"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { ArrowRight, Sparkles } from "lucide-react";

export default function LandingHero() {
  const { t } = useTranslation();

  const scrollToAuth = (e: React.MouseEvent) => {
    e.preventDefault();
    document.querySelector("#auth")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 pt-24 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo-fondo.png"
            alt="NEXORA"
            width={120}
            height={120}
            className="h-24 w-24 sm:h-28 sm:w-28 object-contain"
            priority
          />
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight ds-text sm:text-5xl md:text-6xl">
          {t("landing.hero.headline")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg ds-soft sm:text-xl">
          {t("landing.hero.subtitle")}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#auth"
            onClick={scrollToAuth}
            className="ds-button ds-button-primary inline-flex items-center gap-2 px-8 py-3 text-base"
          >
            {t("landing.hero.cta_primary")}
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#auth"
            onClick={scrollToAuth}
            className="ds-button ds-button-ghost inline-flex items-center gap-2 px-8 py-3 text-base"
          >
            {t("landing.hero.cta_secondary")}
          </a>
        </div>
        <div className="mt-12 flex items-center justify-center gap-2 text-sm ds-muted">
          <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
          <span>{t("landing.hero.badge")}</span>
        </div>
      </div>
    </section>
  );
}
