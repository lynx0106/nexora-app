"use client";

import { useTranslation } from "react-i18next";
import {
  LayoutGrid,
  Zap,
  CreditCard,
  Scale,
  Smartphone,
  GitBranch,
  Users,
  HelpCircle,
  LogIn,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

export type LandingViewId =
  | "inicio"
  | "features"
  | "plans"
  | "comparison"
  | "app-mobile"
  | "diagram"
  | "social-proof"
  | "faq"
  | "auth";

interface MenuItem {
  id: LandingViewId;
  icon: React.ComponentType<{ className?: string }>;
  i18nKey: string;
}

const menuItems: MenuItem[] = [
  { id: "inicio", icon: LayoutGrid, i18nKey: "sidebar.inicio" },
  { id: "features", icon: Zap, i18nKey: "sidebar.features" },
  { id: "plans", icon: CreditCard, i18nKey: "sidebar.plans" },
  { id: "comparison", icon: Scale, i18nKey: "sidebar.comparison" },
  { id: "app-mobile", icon: Smartphone, i18nKey: "sidebar.app_mobile" },
  { id: "diagram", icon: GitBranch, i18nKey: "sidebar.diagram" },
  { id: "social-proof", icon: Users, i18nKey: "sidebar.social_proof" },
  { id: "faq", icon: HelpCircle, i18nKey: "sidebar.faq" },
  { id: "auth", icon: LogIn, i18nKey: "sidebar.auth" },
];

interface LandingSidebarProps {
  activeView: LandingViewId;
  onSelectView: (id: LandingViewId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function LandingSidebar({
  activeView,
  onSelectView,
  isOpen,
  onClose,
}: LandingSidebarProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-300 lg:static lg:z-30 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo + título */}
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-5">
            <Image
              src="/logo-fondo.png"
              alt="NEXORA"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <div>
              <span className="font-display text-lg font-bold ds-text">NEXORA</span>
              <p className="text-xs ds-muted">{t("landing.sidebar.tagline")}</p>
            </div>
          </div>

          <p className="mt-4 px-4 text-xs font-semibold uppercase tracking-wider ds-muted">
            {t("landing.sidebar.menu_title")}
          </p>

          <nav className="flex-1 overflow-y-auto px-2 py-3">
            {menuItems.map(({ id, icon: Icon, i18nKey }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onSelectView(id);
                  onClose();
                }}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeView === id
                    ? "bg-[var(--color-surface-2)] text-[var(--color-accent)]"
                    : "ds-soft hover:bg-[var(--color-surface-2)] hover:ds-text"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{t(`landing.${i18nKey}`)}</span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
