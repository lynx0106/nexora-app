"use client";

import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

interface LandingViewWrapperProps {
  title?: string;
  showBack: boolean;
  onBack: () => void;
  children: React.ReactNode;
}

export default function LandingViewWrapper({
  title,
  showBack,
  onBack,
  children,
}: LandingViewWrapperProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center gap-4 border-b border-[var(--color-border)] px-4 py-4 lg:px-8">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ds-soft hover:bg-[var(--color-surface-2)] hover:ds-text transition-colors"
            aria-label={t("landing.sidebar.back")}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">{t("landing.sidebar.back")}</span>
          </button>
        )}
        {title && (
          <h2 className="font-display text-xl font-semibold ds-text">
            {title}
          </h2>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
