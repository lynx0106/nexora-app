"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import LegalFooter from "@/components/LegalFooter";
import { API_URL } from "@/lib/api";
import { isValidEmail } from "@/lib/validation";
import { showToast } from "@/lib/toast";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email.trim())) {
      setError(t("auth.validation_email_invalid"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t("auth.generic_error"));

      setSent(true);
      showToast(t("auth.forgot_password_sent"), "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.generic_error"));
    } finally {
      setLoading(false);
    }
  };

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
            {t("auth.forgot_password_title")}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            {t("auth.forgot_password_desc")}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/70 px-6 py-8 shadow-lg border border-slate-700/50">
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                {t("auth.forgot_password_sent")}
              </p>
              <Link
                href="/"
                className="block w-full rounded-lg bg-teal-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-teal-500 transition-colors"
              >
                {t("auth.back_to_login")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300"
                >
                  {t("auth.email_label")}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="nombre@ejemplo.com"
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
                  t("auth.forgot_password_submit")
                )}
              </button>
            </form>
          )}

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
