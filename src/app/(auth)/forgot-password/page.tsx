"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { LanguageSelector } from "@/components/shared/language-selector";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const schema = z.object({
    email: z.string().email({ message: t("contacts.emails") + " " + t("common.error") }),
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "Error al enviar correo");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          {t("auth.forgotPassword")}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Recordé mi contraseña.{" "}
          <button
            onClick={() => router.push("/login")}
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            {t("auth.login")}
          </button>
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

      {success ? (
        <div className="p-4 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/40">
          <p className="font-semibold">Se ha enviado un correo con instrucciones para restablecer tu contraseña.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
            >
              {t("auth.email")}
            </label>
            <input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              disabled={loading}
              className={`px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all ${
                errors.email ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : ""
              }`}
              {...register("email")}
            />
            {errors.email && (
              <span className="text-xs text-red-500">{errors.email.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Enviar enlace de recuperación"}
          </button>
        </form>
      )}

      <div className="flex justify-center mt-2 border-t border-neutral-100 dark:border-neutral-800/50 pt-4">
        <LanguageSelector />
      </div>
    </>
  );
}
