"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { useState, useCallback } from "react";

const navLinks = [
  { key: "features", href: "#features" },
  { key: "plans", href: "#plans" },
  { key: "faq", href: "#faq" },
];

export default function LandingHeader() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ key, href }) => (
            <a
              key={key}
              href={href}
              onClick={(e) => scrollTo(e, href)}
              className="text-sm font-medium ds-soft hover:text-[var(--color-accent)] transition-colors"
            >
              {t(`landing.nav.${key}`)}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="#auth"
            onClick={(e) => scrollTo(e, "#auth")}
            className="ds-button ds-button-ghost px-4 py-2 text-sm"
          >
            {t("landing.nav.login")}
          </a>
          <a
            href="#auth"
            onClick={(e) => scrollTo(e, "#auth")}
            className="ds-button ds-button-primary px-5 py-2 text-sm"
          >
            {t("landing.nav.cta")}
          </a>
        </div>

        <button
          type="button"
          className="md:hidden p-2 ds-muted hover:ds-text"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
          <nav className="flex flex-col gap-3">
            {navLinks.map(({ key, href }) => (
              <a
                key={key}
                href={href}
                onClick={(e) => scrollTo(e, href)}
                className="text-sm font-medium ds-soft hover:text-[var(--color-accent)] py-2"
              >
                {t(`landing.nav.${key}`)}
              </a>
            ))}
            <a
              href="#auth"
              onClick={(e) => scrollTo(e, "#auth")}
              className="ds-button ds-button-ghost mt-2"
            >
              {t("landing.nav.login")}
            </a>
            <a
              href="#auth"
              onClick={(e) => scrollTo(e, "#auth")}
              className="ds-button ds-button-primary"
            >
              {t("landing.nav.cta")}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
