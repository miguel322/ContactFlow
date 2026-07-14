"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { User, Trash2, Loader2, Save } from "lucide-react";

interface ProfileClientProps {
  profile: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  email: string;
  userId: string;
}

export function ProfileClient({ profile: initialProfile, email, userId }: ProfileClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const supabase = createClient();

  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete account confirmation
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      })
      .eq("id", userId);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Perfil actualizado con éxito." });
      router.refresh();
    }
    setLoading(false);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteEmail !== email) return;

    setDeleting(true);
    
    // Call administrative API route to delete user account
    const res = await fetch("/api/user/delete", {
      method: "POST",
    });

    if (res.ok) {
      // Clear cookies and session
      document.cookie = "contactflow:org_id=; path=/; max-age=0";
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } else {
      const data = await res.json();
      alert("Error al eliminar la cuenta: " + (data.error || "Inténtalo de nuevo."));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Edit Profile */}
      <form onSubmit={handleUpdateProfile} className="space-y-6 text-xs font-semibold text-neutral-700 dark:text-neutral-350">
        <div>
          <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <User size={18} className="text-neutral-400" />
            {t("nav.profile")}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Actualiza tu información personal y cómo te verán otros miembros en tu organización.
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label>Nombre</label>
            <input
              type="text"
              value={profile.first_name || ""}
              onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              disabled={loading}
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label>Apellidos</label>
            <input
              type="text"
              value={profile.last_name || ""}
              onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              disabled={loading}
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label>Nombre para Mostrar (Display Name)</label>
            <input
              type="text"
              required
              value={profile.display_name || ""}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              disabled={loading}
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label>URL del Avatar / Foto</label>
            <input
              type="url"
              placeholder="https://ejemplo.com/avatar.jpg"
              value={profile.avatar_url || ""}
              onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
              disabled={loading}
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-800 dark:text-neutral-200"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
          <span>Guardar Cambios</span>
        </button>
      </form>

      <div className="border-t border-neutral-200 dark:border-neutral-800 my-6" />

      {/* Delete Account */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-red-650 dark:text-red-400 flex items-center gap-2">
          <Trash2 size={16} />
          {t("auth.deleteAccount")}
        </h3>
        <p className="text-xs text-neutral-500">
          Si eliminas tu cuenta, se perderá toda tu información de forma permanente. Las organizaciones de las que seas el único propietario también serán eliminadas.
        </p>

        <form onSubmit={handleDeleteAccount} className="space-y-4 max-w-md text-xs font-semibold">
          <div className="flex flex-col gap-1.5">
            <label className="text-neutral-600 dark:text-neutral-400">
              Escribe tu correo electrónico para confirmar: <span className="font-mono text-neutral-850 dark:text-neutral-100">{email}</span>
            </label>
            <input
              type="email"
              required
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
              disabled={deleting}
              placeholder="correo@ejemplo.com"
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none text-neutral-850 dark:text-neutral-200"
            />
          </div>

          <button
            type="submit"
            disabled={deleting || deleteEmail !== email}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-750 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {deleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
            <span>Confirmar Eliminación Permanente</span>
          </button>
        </form>
      </div>
    </div>
  );
}
