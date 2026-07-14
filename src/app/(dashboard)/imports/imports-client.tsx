"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { Upload, ArrowRight, ArrowLeft, Check, AlertTriangle, Play, RefreshCw, CheckCircle2 } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { parseVCF } from "@/lib/utils/vcard";


export function ImportsClient() {
  const router = useRouter();
  const { t } = useI18n();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [duplicateStrategy, setDuplicateStrategy] = useState<"skip" | "update" | "create">("skip");

  // Progress metrics
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({
    processed: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  });

  const targetFields = [
    { key: "display_name", label: "Nombre para Mostrar (Obligatorio)" },
    { key: "first_name", label: "Primer Nombre" },
    { key: "last_name", label: "Apellido" },
    { key: "company_name", label: "Empresa" },
    { key: "job_title", label: "Cargo" },
    { key: "email", label: "Correo Principal" },
    { key: "phone", label: "Teléfono Principal" },
    { key: "website", label: "Sitio Web" },
    { key: "source", label: "Fuente" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    const reader = new FileReader();

    if (selectedFile.name.endsWith(".vcf")) {
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        const contacts = parseVCF(text);
        // Normalize vCard parsed data for preview
        setRawData(contacts);
        setHeaders(["display_name", "first_name", "last_name", "company_name", "job_title", "email", "phone", "website"]);
        // Pre-map
        const mapping: Record<string, string> = {};
        ["display_name", "first_name", "last_name", "company_name", "job_title", "email", "phone", "website"].forEach((key) => {
          mapping[key] = key;
        });
        setColumnMapping(mapping);
        setStep(3); // Jump column mapping for vCards since they are pre-parsed
      };
      reader.readAsText(selectedFile);
    } else if (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")) {
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet) as any[];

        if (json.length > 0) {
          setHeaders(Object.keys(json[0]));
          setRawData(json);
          setStep(2);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      // Default CSV
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          if (results.data.length > 0 && results.meta.fields) {
            setHeaders(results.meta.fields);
            setRawData(results.data);
            setStep(2);
          }
        },
      });
    }
  };

  const handleStartImport = async () => {
    setImporting(true);
    setErrorState(null);

    const activeId = document.cookie
      .split("; ")
      .find((row) => row.startsWith("contactflow:org_id="))
      ?.split("=")[1];

    if (!activeId) return;

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const batchSize = 10;
    const total = rawData.length;

    for (let i = 0; i < total; i += batchSize) {
      const batch = rawData.slice(i, i + batchSize);

      const promises = batch.map(async (row) => {
        try {
          // Resolve mapped fields
          const displayName = file?.name.endsWith(".vcf")
            ? row.display_name
            : row[columnMapping["display_name"]];

          if (!displayName) {
            skipped++;
            return;
          }

          const emailVal = file?.name.endsWith(".vcf")
            ? row.emails?.[0]?.email
            : row[columnMapping["email"]];
          const phoneVal = file?.name.endsWith(".vcf")
            ? row.phones?.[0]?.phone
            : row[columnMapping["phone"]];

          const contactData = {
            organization_id: activeId,
            type: "person" as const,
            display_name: displayName,
            first_name: file?.name.endsWith(".vcf") ? row.first_name : row[columnMapping["first_name"]] || "",
            last_name: file?.name.endsWith(".vcf") ? row.last_name : row[columnMapping["last_name"]] || "",
            company_name: file?.name.endsWith(".vcf") ? row.company_name : row[columnMapping["company_name"]] || "",
            job_title: file?.name.endsWith(".vcf") ? row.job_title : row[columnMapping["job_title"]] || "",
            website: file?.name.endsWith(".vcf") ? row.website : row[columnMapping["website"]] || "",
            source: file?.name.endsWith(".vcf") ? row.source : row[columnMapping["source"]] || "import",
            status: "active" as const,
          };

          // Check if contact already exists
          let existingContactId: string | null = null;
          if (emailVal) {
            // Find contact by email
            const { data: matchedEmail } = await supabase
              .from("contact_emails")
              .select("contact_id, contact:contacts(organization_id)")
              .eq("email", emailVal)
              .eq("contact.organization_id", activeId)
              .limit(1);

            if (matchedEmail && matchedEmail.length > 0) {
              existingContactId = matchedEmail[0].contact_id;
            }
          }

          if (existingContactId && duplicateStrategy === "skip") {
            skipped++;
            return;
          }

          if (existingContactId && duplicateStrategy === "update") {
            // Update contact details
            await supabase.from("contacts").update(contactData).eq("id", existingContactId);
            updated++;
          } else {
            // Insert contact details
            const newContactId = crypto.randomUUID();
            const { error: insErr } = await supabase.from("contacts").insert({
              id: newContactId,
              ...contactData,
            });

            if (insErr) throw insErr;

            // Insert phone if present
            if (phoneVal) {
              await supabase.from("contact_phones").insert({
                contact_id: newContactId,
                phone: phoneVal,
                type: "work",
                is_primary: true,
              });
            }

            // Insert email if present
            if (emailVal) {
              await supabase.from("contact_emails").insert({
                contact_id: newContactId,
                email: emailVal,
                type: "work",
                is_primary: true,
              });
            }
            imported++;
          }
        } catch (err) {
          failed++;
        }
      });

      await Promise.all(promises);
      const currentProcessed = Math.min(i + batchSize, total);
      setProgress(Math.round((currentProcessed / total) * 100));
      setResults({
        processed: currentProcessed,
        imported,
        updated,
        skipped,
        failed,
      });
    }

    setImporting(false);
    setStep(5);
  };

  const [errorState, setErrorState] = useState<string | null>(null);

  return (
    <div className="max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Step progress bar */}
      <div className="bg-neutral-50 dark:bg-neutral-850 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-xs font-bold text-neutral-450">
        <span>Asistente de Importación</span>
        <span>Paso {step} de 5</span>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-12 hover:bg-neutral-50/50 transition-colors cursor-pointer relative">
            <Upload size={48} className="text-neutral-400 mb-4 animate-bounce" />
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
              Haz clic para seleccionar o arrastra un archivo
            </p>
            <p className="text-xs text-neutral-400 mb-6">
              Soporta archivos CSV, Excel (.xlsx, .xls) o vCard (.vcf) de hasta 5MB.
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.vcf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        )}

        {/* STEP 2: Map Columns */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-850 dark:text-neutral-200">
                Mapeo de columnas
              </h3>
              <p className="text-xs text-neutral-550">
                Selecciona qué columna de tu archivo corresponde a cada campo del sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              {targetFields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5 p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                  <label className="text-neutral-700 dark:text-neutral-400">{field.label}</label>
                  <select
                    value={columnMapping[field.key] || ""}
                    onChange={(e) =>
                      setColumnMapping({ ...columnMapping, [field.key]: e.target.value })
                    }
                    className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg"
                  >
                    <option value="">-- No mapear --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800/60 pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 cursor-pointer font-bold"
              >
                <ArrowLeft size={14} /> Volver
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!columnMapping["display_name"]}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <span>Continuar</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview & Settings */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-850 dark:text-neutral-200">
                Vista previa y duplicados
              </h3>
              <p className="text-xs text-neutral-550">
                Revisa los datos antes de cargarlos y elige cómo manejar los contactos duplicados.
              </p>
            </div>

            {/* Preview table */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-850 text-neutral-500 font-semibold border-b border-neutral-200 dark:border-neutral-800 uppercase">
                    <th className="p-2">Nombre</th>
                    <th className="p-2">Compañía</th>
                    <th className="p-2">Correo</th>
                    <th className="p-2">Teléfono</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150 dark:divide-neutral-800 text-neutral-600 dark:text-neutral-450">
                  {rawData.slice(0, 3).map((row, idx) => {
                    const name = file?.name.endsWith(".vcf")
                      ? row.display_name
                      : row[columnMapping["display_name"]];
                    const comp = file?.name.endsWith(".vcf")
                      ? row.company_name
                      : row[columnMapping["company_name"]];
                    const email = file?.name.endsWith(".vcf")
                      ? row.emails?.[0]?.email
                      : row[columnMapping["email"]];
                    const phone = file?.name.endsWith(".vcf")
                      ? row.phones?.[0]?.phone
                      : row[columnMapping["phone"]];

                    return (
                      <tr key={idx}>
                        <td className="p-2 font-bold">{name}</td>
                        <td className="p-2">{comp || "—"}</td>
                        <td className="p-2">{email || "—"}</td>
                        <td className="p-2">{phone || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Duplicate strategy selector */}
            <div className="bg-neutral-50 dark:bg-neutral-855 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <AlertTriangle size={16} className="text-indigo-500" />
                Estrategia de duplicados
              </span>
              <div className="flex flex-col gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-350">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="strategy"
                    checked={duplicateStrategy === "skip"}
                    onChange={() => setDuplicateStrategy("skip")}
                  />
                  <span>Omitir (no agregar contactos existentes)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="strategy"
                    checked={duplicateStrategy === "update"}
                    onChange={() => setDuplicateStrategy("update")}
                  />
                  <span>Actualizar (sobrescribir información del contacto existente)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="strategy"
                    checked={duplicateStrategy === "create"}
                    onChange={() => setDuplicateStrategy("create")}
                  />
                  <span>Crear de todos modos (duplicar registros)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800/60 pt-4">
              <button
                onClick={() => setStep(file?.name.endsWith(".vcf") ? 1 : 2)}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 cursor-pointer font-bold"
              >
                <ArrowLeft size={14} /> Volver
              </button>
              <button
                onClick={() => {
                  setStep(4);
                  handleStartImport();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Play size={12} />
                <span>Comenzar Importación</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Processing Progress */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <RefreshCw className="animate-spin text-indigo-500" size={32} />
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Procesando importación...
            </p>
            <div className="w-full max-w-xs bg-neutral-105 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-neutral-450">{progress}% completado</span>
          </div>
        )}

        {/* STEP 5: Finished Summary */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
              <CheckCircle2 size={40} className="text-green-500 animate-pulse" />
              <h3 className="text-base font-bold text-neutral-850 dark:text-neutral-200">
                ¡Importación completada con éxito!
              </h3>
              <p className="text-xs text-neutral-550 max-w-xs">
                Se han procesado {rawData.length} filas de tu archivo. Revisa el resumen de carga.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-neutral-50 dark:bg-neutral-855 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-450 uppercase block font-bold">Procesadas</span>
                <p className="text-lg font-bold text-neutral-800 dark:text-neutral-200">{rawData.length}</p>
              </div>
              <div className="bg-green-50/30 dark:bg-green-950/10 p-3 rounded-lg border border-green-200/50 text-center">
                <span className="text-[10px] text-green-600 uppercase block font-bold">Importados</span>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">{results.imported}</p>
              </div>
              <div className="bg-blue-50/30 dark:bg-blue-950/10 p-3 rounded-lg border border-blue-200/50 text-center">
                <span className="text-[10px] text-blue-650 uppercase block font-bold">Actualizados</span>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{results.updated}</p>
              </div>
              <div className="bg-orange-50/30 dark:bg-orange-950/10 p-3 rounded-lg border border-orange-200/50 text-center">
                <span className="text-[10px] text-orange-655 uppercase block font-bold">Omitidos</span>
                <p className="text-lg font-bold text-orange-700 dark:text-orange-400">{results.skipped}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-100 dark:border-neutral-800/60">
              <button
                onClick={() => router.push("/contacts")}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Ir a Contactos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
