"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

interface LegalFooterProps {
  className?: string;
  variant?: "compact" | "full";
}

export default function LegalFooter({ className = "", variant = "compact" }: LegalFooterProps) {
  const { t } = useTranslation();

  if (variant === "full") {
    return (
      <footer className={`border-t border-[var(--color-border)] px-4 py-6 text-center text-xs ds-muted ${className}`}>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-[var(--color-accent)] transition-colors">
            {t("landing.footer.privacy")}
          </Link>
          <span>|</span>
          <Link href="/terms" className="hover:text-[var(--color-accent)] transition-colors">
            {t("landing.footer.terms")}
          </Link>
        </div>
        <p className="mt-2">{t("landing.footer.copyright", { year: new Date().getFullYear() })}</p>
      </footer>
    );
  }

  return (
    <span className={`inline ${className}`}>
      <Link href="/privacy" className="hover:text-[var(--color-accent)] transition-colors text-[11px] ds-muted">
        {t("landing.footer.privacy")}
      </Link>
      {" · "}
      <Link href="/terms" className="hover:text-[var(--color-accent)] transition-colors text-[11px] ds-muted">
        {t("landing.footer.terms")}
      </Link>
    </span>
  );
}
