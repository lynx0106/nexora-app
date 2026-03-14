"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

interface LegalFooterProps {
  className?: string;
  variant?: "compact" | "full" | "landing" | "platform";
  /** Solo para variant platform: muestra "Powered by Lynx IA" */
  showPoweredBy?: boolean;
}

export default function LegalFooter({ className = "", variant = "compact", showPoweredBy = false }: LegalFooterProps) {
  const { t } = useTranslation();

  const footerLanding = (
    <footer
      className={`mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 text-center ${className}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm ds-soft">
        <Link href="/privacy" className="hover:text-[var(--color-accent)] transition-colors">
          {t("landing.footer.privacy")}
        </Link>
        <span className="text-[var(--color-border)]">·</span>
        <Link href="/terms" className="hover:text-[var(--color-accent)] transition-colors">
          {t("landing.footer.terms")}
        </Link>
      </div>
      <p className="mt-3 text-sm ds-muted">
        {t("landing.footer.copyright", { year: new Date().getFullYear() })}
        {showPoweredBy && " · Powered by Lynx IA"}
      </p>
    </footer>
  );

  if (variant === "landing" || variant === "platform") {
    return footerLanding;
  }

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
