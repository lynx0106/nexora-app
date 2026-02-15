"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function ConfiguracionPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-12">
        {/* Header con navegación */}
        <header className="mb-12 flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <img
              src="/logo-fondo.png"
              alt="Logo NEXORA"
              className="h-12 w-auto object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                {t('config.title')}
              </h1>
              <p className="text-sm text-slate-400">
                {t('config.subtitle')}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 shadow-sm ring-1 ring-slate-700 transition-all hover:bg-slate-800"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            {t('config.back_dashboard')}
          </Link>
        </header>

        <main className="grid gap-8 md:grid-cols-2">
          {/* Sección: Interfaz y Experiencia */}
          <section className="col-span-full md:col-span-1 rounded-xl bg-slate-900/70 p-6 shadow-sm ring-1 ring-slate-800">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-900/40 text-indigo-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              </div>
              <h2 className="text-base font-semibold text-slate-100">{t('config.visual_interface')}</h2>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-slate-400">
              {t('config.visual_desc')}
            </p>
            <div className="flex items-center justify-between rounded-lg bg-slate-900 p-3">
              <span className="text-sm font-medium text-slate-300">{t('config.current_theme')}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-100 shadow-sm ring-1 ring-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Modo oscuro
              </span>
            </div>
          </section>

          {/* Sección: Seguridad (Placeholder) */}
          <section className="col-span-full md:col-span-1 rounded-xl bg-slate-900/70 p-6 shadow-sm ring-1 ring-slate-800">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h2 className="text-base font-semibold text-slate-100">{t('config.security')}</h2>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-slate-400">
              {t('config.security_desc')}
            </p>
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900 p-3 text-center text-xs text-slate-400">
              {t('config.in_development')}
            </div>
          </section>

          {/* Sección: Información del Sistema */}
          <section className="col-span-full rounded-xl bg-slate-900/70 p-6 shadow-sm ring-1 ring-slate-800">
            <h2 className="mb-4 text-base font-semibold text-slate-100">{t('config.system_info')}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">{t('config.version')}</span>
                <span className="text-sm font-medium text-slate-100">v1.2.0 (Beta)</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">{t('config.environment')}</span>
                <span className="text-sm font-medium text-slate-100">{t('config.env_prod')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">{t('config.support')}</span>
                <a href="#" className="text-sm font-medium text-emerald-300 hover:text-emerald-200 hover:underline">
                  {t('config.help_center')} &rarr;
                </a>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-auto pt-12 text-center">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {t('config.footer')}
          </p>
        </footer>
      </div>
    </div>
  );
}
