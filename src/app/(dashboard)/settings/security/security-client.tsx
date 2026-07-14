"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { Shield, Key, Eye, EyeOff, Loader2, AlertTriangle, Save } from "lucide-react";

interface SecurityClientProps {
  userRole: string;
  orgId: string;
}

export function SecurityClient({ userRole, orgId }: SecurityClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [deactivating, setDeactivating] = useState(false);

  const isOwner = userRole === "owner";

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }

    setMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Contraseña actualizada con éxito." });
      setPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  const handleDeactivateOrg = async () => {
    if (!isOwner) return;
    if (
      !confirm(
        "¿Estás completamente seguro de que quieres desactivar esta organización? Todos los datos de contactos y tareas dejarán de estar accesibles temporalmente."
      )
    ) {
      return;
    }

    setDeactivating(true);
    const { error } = await supabase
      .from("organizations")
      .update({ is_active: false })
      .eq("id", orgId);

    if (!error) {
      // Clear cookie and log out of organization context
      document.cookie = "contactflow:org_id=; path=/; max-age=0";
      router.push("/onboarding");
      router.refresh();
    } else {
      alert("Error al desactivar: " + error.message);
      setDeactivating(false);
    }
  };

  return (
    <div className="space-y-8 text-xs font-semibold text-neutral-700 dark:text-neutral-350">
      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Key size={18} className="text-neutral-405" />
            Cambiar Contraseña
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Modifica la contraseña de acceso a tu cuenta. Se requiere un mínimo de 6 caracteres.
          </p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg border text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-950/20 text-green-700 border-green-200"
              : "bg-red-50 dark:bg-red-950/20 text-red-650 border-red-200"
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div className="flex flex-col gap-1.5">
            <label>Nueva contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-850 dark:text-neutral-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label>Confirmar nueva contraseña</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              disabled={loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-850 dark:text-neutral-200"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !password.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
          <span>Guardar contraseña</span>
        </button>
      </form>

      <div className="border-t border-neutral-200 dark:border-neutral-800 my-6" />

      {/* Deactivate Organization */}
      {isOwner && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-red-650 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle size={16} />
            Desactivar Organización
          </h3>
          <p className="text-xs text-neutral-500">
            Esta acción desactiva la organización actual. Ningún miembro podrá acceder a los contactos ni tareas vinculadas. Puedes volver a activarla en el futuro poniéndote en contacto con el soporte.
          </p>

          <button
            onClick={handleDeactivateOrg}
            disabled={deactivating}
            className="flex items-center gap-2 px-4 py-2 bg-red-650 hover:bg-red-750 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {deactivating ? <Loader2 className="animate-spin" size={14} /> : <AlertTriangle size={14} />}
            <span>Desactivar &quot;NexusCorp CRM&quot;</span>
          </button>
        </div>
      )}
    </div>
  );
}
