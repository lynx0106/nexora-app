"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const scrollToAuth = (e: React.MouseEvent) => {
  e.preventDefault();
  document.querySelector("#auth")?.scrollIntoView({ behavior: "smooth" });
};

export default function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-[var(--color-border)] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo-fondo.png"
                alt="NEXORA"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="font-display text-xl font-semibold ds-text">NEXORA</span>
            </Link>
            <p className="mt-4 max-w-xs text-center md:text-left text-sm ds-muted">
              {t("landing.footer.tagline")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8">
            <div>
              <h4 className="text-sm font-semibold ds-text">{t("landing.footer.links")}</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <a href="#features" className="text-sm ds-muted hover:text-[var(--color-accent)] transition-colors">
                    {t("landing.nav.features")}
                  </a>
                </li>
                <li>
                  <a href="#plans" className="text-sm ds-muted hover:text-[var(--color-accent)] transition-colors">
                    {t("landing.nav.plans")}
                  </a>
                </li>
                <li>
                  <a href="#auth" onClick={scrollToAuth} className="text-sm ds-muted hover:text-[var(--color-accent)] transition-colors">
                    {t("landing.footer.demo")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold ds-text">{t("landing.footer.legal")}</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/privacy" className="text-sm ds-muted hover:text-[var(--color-accent)] transition-colors">
                    {t("landing.footer.privacy")}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm ds-muted hover:text-[var(--color-accent)] transition-colors">
                    {t("landing.footer.terms")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-[var(--color-border)] pt-8 text-center text-sm ds-muted">
          {t("landing.footer.copyright", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
