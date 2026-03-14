"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import LegalFooter from "@/components/LegalFooter";
import { API_URL } from "@/lib/api";
import { validatePassword } from "@/lib/validation";
import { showToast } from "@/lib/toast";

function ResetPasswordContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError(t("auth.reset_token_missing"));
    }
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) {
      setError(pwCheck.message || t("auth.validation_password_min"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("auth.reset_password_mismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t("auth.generic_error"));

      showToast(t("auth.reset_success"), "success");
      router.push("/?reset=success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("auth.reset_token_invalid")
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <Image
            src="/logo-fondo.png"
            alt="Logo NEXORA"
            width={80}
            height={80}
            className="mx-auto h-20 w-auto object-contain"
          />
          <p className="text-slate-400">{t("auth.reset_token_missing")}</p>
          <Link
            href="/auth/forgot-password"
            className="inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-500"
          >
            {t("auth.forgot_password_title")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Image
            src="/logo-fondo.png"
            alt="Logo NEXORA"
            width={80}
            height={80}
            priority
            className="mb-2 h-20 w-auto object-contain"
          />
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-100">
            {t("auth.reset_password_title")}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            {t("auth.reset_password_desc")}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/70 px-6 py-8 shadow-lg border border-slate-700/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-slate-300"
              >
                {t("auth.reset_new_password")}
              </label>
              <div className="relative mt-1">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 pr-10 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-300"
              >
                {t("auth.reset_confirm_password")}
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="rounded-lg bg-red-900/30 border border-red-700/50 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                t("auth.reset_password_submit")
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >
              {t("auth.back_to_login")}
            </Link>
          </div>
        </div>
      </div>
      <LegalFooter variant="platform" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
