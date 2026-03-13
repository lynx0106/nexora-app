"use client";

import { useTranslation } from "react-i18next";
import {
  UserPlus,
  Store,
  Users,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

export default function LandingOnboardingDiagram() {
  const { t } = useTranslation();

  return (
    <section
      id="onboarding-flow"
      className="scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="diagram-title"
    >
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2
            id="diagram-title"
            className="font-display text-2xl font-bold ds-text sm:text-3xl"
          >
            {t("landing.diagram.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm ds-soft">
            {t("landing.diagram.subtitle")}
          </p>
        </div>

        <div className="mt-12 ds-panel ds-card p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between lg:gap-8">
            {/* Columna 1: Registro → Rol */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <UserPlus className="h-7 w-7" />
              </div>
              <p className="text-center text-sm font-medium ds-text">
                {t("landing.diagram.register")}
              </p>
              <ArrowRight className="h-5 w-5 ds-muted rotate-90 lg:rotate-0" />
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                <ChevronDown className="h-7 w-7 ds-text" />
              </div>
              <p className="text-center text-sm font-medium ds-text">
                {t("landing.diagram.choose_role")}
              </p>
            </div>

            {/* Columna 2: 3 ramas */}
            <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-4 lg:justify-around">
              {/* Admin */}
              <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-5 min-w-[180px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
                  <Store className="h-6 w-6" />
                </div>
                <p className="font-semibold ds-text">{t("landing.diagram.admin")}</p>
                <ul className="space-y-1.5 text-left text-xs ds-soft w-full">
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--color-success)]">1.</span>
                    {t("landing.diagram.admin_1")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--color-success)]">2.</span>
                    {t("landing.diagram.admin_2")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--color-success)]">3.</span>
                    {t("landing.diagram.admin_3")}
                  </li>
                </ul>
              </div>

              {/* Employee */}
              <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-5 min-w-[180px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-glow-2)] text-blue-400">
                  <Users className="h-6 w-6" />
                </div>
                <p className="font-semibold ds-text">{t("landing.diagram.employee")}</p>
                <ul className="space-y-1.5 text-left text-xs ds-soft w-full">
                  <li className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {t("landing.diagram.employee_1")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {t("landing.diagram.employee_2")}
                  </li>
                </ul>
              </div>

              {/* Client */}
              <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-5 min-w-[180px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <p className="font-semibold ds-text">{t("landing.diagram.client")}</p>
                <ul className="space-y-1.5 text-left text-xs ds-soft w-full">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {t("landing.diagram.client_1")}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
