"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { LanguageSelector } from "@/components/shared/language-selector";
import { Globe, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const next = searchParams.get("next") || "/dashboard";
  const supabase = createClient();

  const loginSchema = z.object({
    email: z.string().email({ message: t("contacts.emails") + " " + t("common.error") }),
    password: z.string().min(6, { message: t("auth.password") + " (min 6)" }),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push(next);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (oAuthError) {
        setError(oAuthError.message);
      }
    } catch (err: any) {
      setError(err?.message || "Error de conexión con Google");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          {t("auth.login")}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t("auth.noAccount")}{" "}
          <button
            onClick={() => router.push(`/register?next=${encodeURIComponent(next)}`)}
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            {t("auth.register")}
          </button>
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

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

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
            >
              {t("auth.password")}
            </label>
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {t("auth.forgotPassword")}
            </button>
          </div>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : t("auth.login")}
        </button>
      </form>

      <div className="relative flex items-center justify-center my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
        </div>
        <span className="relative px-3 text-xs bg-white dark:bg-neutral-900 text-neutral-400 dark:text-neutral-500">
          O continuar con
        </span>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
      >
        <Globe size={18} /> Google
      </button>

      <div className="flex justify-center mt-2 border-t border-neutral-100 dark:border-neutral-800/50 pt-4">
        <LanguageSelector />
      </div>
    </>
  );
}
