"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { LanguageSelector } from "@/components/shared/language-selector";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClient();

  const schema = z.object({
    password: z.string().min(6, { message: t("auth.password") + " (min 6)" }),
    confirmPassword: z.string().min(6),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err?.message || "Error al actualizar contraseña");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          {t("auth.resetPassword")}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Establece tu nueva contraseña de acceso.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

      {success ? (
        <div className="p-4 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/40">
          <p className="font-semibold">¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
            >
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                disabled={loading}
                className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all ${
                  errors.password ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : ""
                }`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-red-500">{errors.password.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
            >
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              disabled={loading}
              className={`w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all ${
                errors.confirmPassword ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : ""
              }`}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Establecer nueva contraseña"}
          </button>
        </form>
      )}

      <div className="flex justify-center mt-2 border-t border-neutral-100 dark:border-neutral-800/50 pt-4">
        <LanguageSelector />
      </div>
    </>
  );
}
