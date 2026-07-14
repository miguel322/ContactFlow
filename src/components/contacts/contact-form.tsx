"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { Plus, Trash2, Loader2, Save } from "lucide-react";

interface CustomFieldDef {
  id: string;
  name: string;
  label: string;
  type: string;
  options: string[] | null;
  is_required: boolean;
}

interface ContactFormProps {
  contactId?: string;
  initialData?: any;
}

export function ContactForm({ contactId, initialData }: ContactFormProps) {
  const router = useRouter();
  const { t } = useI18n();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [orgId, setOrgId] = useState<string | null>(null);

  // Form Zod validation schema
  const contactSchema = z.object({
    type: z.enum(["person", "company"]),
    first_name: z.string().optional(),
    middle_name: z.string().optional(),
    last_name: z.string().optional(),
    display_name: z.string().min(2, { message: "El nombre es obligatorio" }),
    company_name: z.string().optional(),
    job_title: z.string().optional(),
    department: z.string().optional(),
    description: z.string().optional(),
    birth_date: z.string().optional(),
    website: z.string().optional(),
    status: z.enum(["active", "inactive", "lead", "customer", "supplier", "employee", "archived"]),
    owner_id: z.string().optional(),
    source: z.string().optional(),
    phones: z.array(
      z.object({
        phone: z.string().min(3),
        type: z.enum(["work", "home", "mobile", "other"]),
        is_primary: z.boolean(),
      })
    ),
    emails: z.array(
      z.object({
        email: z.string().email(),
        type: z.enum(["work", "personal", "other"]),
        is_primary: z.boolean(),
      })
    ),
    addresses: z.array(
      z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postal_code: z.string().optional(),
        country: z.string().optional(),
        type: z.enum(["work", "home", "billing", "shipping", "other"]),
        is_primary: z.boolean(),
      })
    ),
  });

  type FormValues = z.infer<typeof contactSchema>;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: initialData?.type || "person",
      first_name: initialData?.first_name || "",
      middle_name: initialData?.middle_name || "",
      last_name: initialData?.last_name || "",
      display_name: initialData?.display_name || "",
      company_name: initialData?.company_name || "",
      job_title: initialData?.job_title || "",
      department: initialData?.department || "",
      description: initialData?.description || "",
      birth_date: initialData?.birth_date || "",
      website: initialData?.website || "",
      status: initialData?.status || "active",
      owner_id: initialData?.owner_id || "",
      source: initialData?.source || "website",
      phones: initialData?.phones || [],
      emails: initialData?.emails || [],
      addresses: initialData?.addresses || [],
    },
  });

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control,
    name: "phones",
  });

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control,
    name: "emails",
  });

  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
    control,
    name: "addresses",
  });

  const contactType = watch("type");
  const firstName = watch("first_name");
  const lastName = watch("last_name");

  // Auto-generate display name for person
  useEffect(() => {
    if (contactType === "person") {
      const generated = `${firstName || ""} ${lastName || ""}`.trim();
      if (generated) {
        setValue("display_name", generated);
      }
    }
  }, [contactType, firstName, lastName, setValue]);

  useEffect(() => {
    async function loadMeta() {
      const activeId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("contactflow:org_id="))
        ?.split("=")[1];
      if (!activeId) return;
      setOrgId(activeId);

      // Fetch org members
      const { data: members } = await supabase
        .from("organization_members")
        .select("profile_id, profiles(display_name)")
        .eq("organization_id", activeId);
      if (members) {
        setUsers(members.map((m: any) => ({ id: m.profile_id, name: m.profiles?.display_name })));
      }

      // Fetch categories
      const { data: cats } = await supabase
        .from("contact_categories")
        .select("id, name")
        .eq("organization_id", activeId);
      if (cats) setCategories(cats);

      // Fetch tags
      const { data: tg } = await supabase
        .from("tags")
        .select("id, name")
        .eq("organization_id", activeId);
      if (tg) setTags(tg);

      // Fetch Custom Fields
      const { data: fieldDefs } = await supabase
        .from("custom_field_definitions")
        .select("*")
        .eq("organization_id", activeId);
      if (fieldDefs) {
        setCustomFields(fieldDefs);
      }

      // Fetch custom values if editing
      if (contactId) {
        const { data: vals } = await supabase
          .from("custom_field_values")
          .select("field_definition_id, value")
          .eq("contact_id", contactId);
        if (vals) {
          const map: Record<string, string> = {};
          vals.forEach((v) => {
            map[v.field_definition_id] = v.value || "";
          });
          setCustomValues(map);
        }
      }
    }
    loadMeta();
  }, [supabase, contactId]);

  const onSubmit = async (values: FormValues) => {
    if (!orgId) return;
    setError(null);
    setLoading(true);

    try {
      let activeContactId = contactId;

      // 1. Insert/Update Contact Core
      if (contactId) {
        const { error: err } = await supabase
          .from("contacts")
          .update({
            type: values.type,
            first_name: values.first_name,
            middle_name: values.middle_name,
            last_name: values.last_name,
            display_name: values.display_name,
            company_name: values.company_name,
            job_title: values.job_title,
            department: values.department,
            description: values.description,
            birth_date: values.birth_date ? values.birth_date : null,
            website: values.website,
            status: values.status,
            owner_id: values.owner_id ? values.owner_id : null,
            source: values.source,
          })
          .eq("id", contactId);

        if (err) throw err;
      } else {
        const newContactId = crypto.randomUUID();
        const { error: err } = await supabase.from("contacts").insert({
          id: newContactId,
          organization_id: orgId,
          type: values.type,
          first_name: values.first_name,
          middle_name: values.middle_name,
          last_name: values.last_name,
          display_name: values.display_name,
          company_name: values.company_name,
          job_title: values.job_title,
          department: values.department,
          description: values.description,
          birth_date: values.birth_date ? values.birth_date : null,
          website: values.website,
          status: values.status,
          owner_id: values.owner_id ? values.owner_id : null,
          source: values.source,
        });

        if (err) throw err;
        activeContactId = newContactId;
      }

      if (!activeContactId) return;

      // 2. Insert/Update Phones, Emails, Addresses (Delete old and insert new is clean)
      await supabase.from("contact_phones").delete().eq("contact_id", activeContactId);
      if (values.phones.length > 0) {
        await supabase.from("contact_phones").insert(
          values.phones.map((p) => ({
            contact_id: activeContactId,
            phone: p.phone,
            type: p.type,
            is_primary: p.is_primary,
          }))
        );
      }

      await supabase.from("contact_emails").delete().eq("contact_id", activeContactId);
      if (values.emails.length > 0) {
        await supabase.from("contact_emails").insert(
          values.emails.map((e) => ({
            contact_id: activeContactId,
            email: e.email,
            type: e.type,
            is_primary: e.is_primary,
          }))
        );
      }

      await supabase.from("contact_addresses").delete().eq("contact_id", activeContactId);
      if (values.addresses.length > 0) {
        await supabase.from("contact_addresses").insert(
          values.addresses.map((a) => ({
            contact_id: activeContactId,
            street: a.street,
            city: a.city,
            state: a.state,
            postal_code: a.postal_code,
            country: a.country,
            type: a.type,
            is_primary: a.is_primary,
          }))
        );
      }

      // 3. Save Custom Fields values
      await supabase.from("custom_field_values").delete().eq("contact_id", activeContactId);
      const customInserts = Object.entries(customValues)
        .filter(([_, val]) => val !== undefined && val !== "")
        .map(([defId, val]) => ({
          contact_id: activeContactId,
          field_definition_id: defId,
          value: String(val),
        }));

      if (customInserts.length > 0) {
        await supabase.from("custom_field_values").insert(customInserts);
      }

      router.push(`/contacts/${activeContactId}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Error al guardar el contacto");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 rounded-2xl shadow-xs">
      <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800/60 pb-4">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
          {contactId ? t("contacts.edit") : t("contacts.new")}
        </h2>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
              <Save size={16} />
              <span>{t("common.save")}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

      {/* Tipo de contacto */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          {t("contacts.type")}
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer">
            <input type="radio" value="person" {...register("type")} className="text-indigo-600" />
            <span>{t("contacts.person")}</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer">
            <input type="radio" value="company" {...register("type")} className="text-indigo-600" />
            <span>{t("contacts.company")}</span>
          </label>
        </div>
      </div>

      {/* Core Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contactType === "person" ? (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-750 dark:text-neutral-300">
                {t("contacts.firstName")}
              </label>
              <input
                type="text"
                {...register("first_name")}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-750 dark:text-neutral-300">
                {t("contacts.lastName")}
              </label>
              <input
                type="text"
                {...register("last_name")}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-neutral-750 dark:text-neutral-300">
              Nombre de la empresa
            </label>
            <input
              type="text"
              {...register("display_name")}
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
            />
          </div>
        )}

        {contactType === "person" && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-750 dark:text-neutral-300">
                {t("contacts.companyName")}
              </label>
              <input
                type="text"
                {...register("company_name")}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-750 dark:text-neutral-300">
                {t("contacts.jobTitle")}
              </label>
              <input
                type="text"
                {...register("job_title")}
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
              />
            </div>
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-750 dark:text-neutral-300">
            {t("contacts.status")}
          </label>
          <select
            {...register("status")}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
          >
            <option value="active">{t("contacts.active")}</option>
            <option value="inactive">{t("contacts.inactive")}</option>
            <option value="lead">{t("contacts.lead")}</option>
            <option value="customer">{t("contacts.customer")}</option>
            <option value="supplier">{t("contacts.supplier")}</option>
            <option value="employee">{t("contacts.employee")}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-750 dark:text-neutral-300">
            Propietario / Responsable
          </label>
          <select
            {...register("owner_id")}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
          >
            <option value="">Seleccionar miembro...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-750 dark:text-neutral-300">
            {t("contacts.website")}
          </label>
          <input
            type="url"
            placeholder="https://ejemplo.com"
            {...register("website")}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-750 dark:text-neutral-300">
            {t("contacts.source")}
          </label>
          <input
            type="text"
            placeholder="Recomendado, Evento, Google, etc."
            {...register("source")}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
          />
        </div>
      </div>

      <div className="border-t border-neutral-100 dark:border-neutral-800/60 my-6" />

      {/* Dynamic Phones */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-200">
            {t("contacts.phones")}
          </h3>
          <button
            type="button"
            onClick={() => appendPhone({ phone: "", type: "mobile", is_primary: false })}
            className="flex items-center gap-1.5 text-xs text-indigo-650 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
          >
            <Plus size={14} />
            Añadir teléfono
          </button>
        </div>
        <div className="space-y-3">
          {phoneFields.map((field, index) => (
            <div key={field.id} className="flex gap-3 items-center">
              <input
                type="tel"
                placeholder="+34600000000"
                required
                {...register(`phones.${index}.phone` as const)}
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none"
              />
              <select
                {...register(`phones.${index}.type` as const)}
                className="w-28 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none"
              >
                <option value="mobile">Móvil</option>
                <option value="work">Trabajo</option>
                <option value="home">Casa</option>
                <option value="other">Otro</option>
              </select>
              <label className="flex items-center gap-1 text-xs text-neutral-500 cursor-pointer">
                <input type="checkbox" {...register(`phones.${index}.is_primary` as const)} />
                <span>Pr.</span>
              </label>
              <button
                type="button"
                onClick={() => removePhone(index)}
                className="text-red-600 hover:text-red-750 p-1 cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Emails */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-200">
            {t("contacts.emails")}
          </h3>
          <button
            type="button"
            onClick={() => appendEmail({ email: "", type: "work", is_primary: false })}
            className="flex items-center gap-1.5 text-xs text-indigo-650 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
          >
            <Plus size={14} />
            Añadir correo
          </button>
        </div>
        <div className="space-y-3">
          {emailFields.map((field, index) => (
            <div key={field.id} className="flex gap-3 items-center">
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                required
                {...register(`emails.${index}.email` as const)}
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none"
              />
              <select
                {...register(`emails.${index}.type` as const)}
                className="w-28 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none"
              >
                <option value="work">Trabajo</option>
                <option value="personal">Personal</option>
                <option value="other">Otro</option>
              </select>
              <label className="flex items-center gap-1 text-xs text-neutral-500 cursor-pointer">
                <input type="checkbox" {...register(`emails.${index}.is_primary` as const)} />
                <span>Pr.</span>
              </label>
              <button
                type="button"
                onClick={() => removeEmail(index)}
                className="text-red-600 hover:text-red-750 p-1 cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-neutral-100 dark:border-neutral-800/60 my-6" />

      {/* Custom Fields dynamic section */}
      {customFields.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-neutral-850 dark:text-neutral-200">
            Campos Personalizados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customFields.map((field) => (
              <div key={field.id} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-750 dark:text-neutral-300">
                  {field.label} {field.is_required && <span className="text-red-500">*</span>}
                </label>
                {field.type === "select" ? (
                  <select
                    value={customValues[field.id] || ""}
                    onChange={(e) => setCustomValues({ ...customValues, [field.id]: e.target.value })}
                    required={field.is_required}
                    className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Seleccionar...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === "boolean" ? (
                  <label className="flex items-center gap-2 py-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customValues[field.id] === "true"}
                      onChange={(e) =>
                        setCustomValues({
                          ...customValues,
                          [field.id]: e.target.checked ? "true" : "false",
                        })
                      }
                      className="text-indigo-600"
                    />
                    <span>Sí / Activo</span>
                  </label>
                ) : (
                  <input
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    value={customValues[field.id] || ""}
                    onChange={(e) => setCustomValues({ ...customValues, [field.id]: e.target.value })}
                    required={field.is_required}
                    className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
