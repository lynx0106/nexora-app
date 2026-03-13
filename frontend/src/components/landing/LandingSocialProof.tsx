"use client";

import { useTranslation } from "react-i18next";
import { UtensilsCrossed, Stethoscope, Store } from "lucide-react";

const SECTORS = [
  { key: "restaurant", icon: UtensilsCrossed },
  { key: "health", icon: Stethoscope },
  { key: "retail", icon: Store },
];

export default function LandingSocialProof() {
  const { t } = useTranslation();

  return (
    <section id="social-proof" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold ds-text sm:text-4xl">
            {t("landing.social_proof.title")}
          </h2>
          <p className="mt-4 text-lg ds-soft max-w-2xl mx-auto">
            {t("landing.social_proof.subtitle")}
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {SECTORS.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="ds-card ds-section-transition flex flex-col items-center p-8 text-center"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="font-display text-lg font-semibold ds-text">
                {t(`landing.social_proof.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm ds-soft">
                {t(`landing.social_proof.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm ds-muted">
          {t("landing.social_proof.testimonials_placeholder")}
        </p>
      </div>
    </section>
  );
}
