"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Menu } from "lucide-react";
import LandingSidebar, { type LandingViewId } from "@/components/landing/LandingSidebar";
import LandingViewWrapper from "@/components/landing/LandingViewWrapper";
import LandingHero from "@/components/landing/LandingHero";
import LandingAuthForm from "@/components/landing/LandingAuthForm";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingPlans from "@/components/landing/LandingPlans";
import LandingComparison from "@/components/landing/LandingComparison";
import LandingAppMobile from "@/components/landing/LandingAppMobile";
import LandingOnboardingDiagram from "@/components/landing/LandingOnboardingDiagram";
import LandingSocialProof from "@/components/landing/LandingSocialProof";
import LandingFAQ from "@/components/landing/LandingFAQ";
import LegalFooter from "@/components/LegalFooter";

function HomeContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [activeView, setActiveView] = useState<LandingViewId>("inicio");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    queueMicrotask(() => {
      if (token) setIsAuth(true);
      setMounted(true);
    });
    if (token) router.replace("/dashboard");
  }, [router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center ds-muted">
        Cargando...
      </div>
    );
  }

  if (isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center ds-muted">
        Redirigiendo...
      </div>
    );
  }

  const showBack = activeView !== "inicio";
  const viewTitles: Record<LandingViewId, string> = {
    inicio: "",
    features: t("landing.sidebar.features"),
    plans: t("landing.sidebar.plans"),
    comparison: t("landing.sidebar.comparison"),
    "app-mobile": t("landing.sidebar.app_mobile"),
    diagram: t("landing.sidebar.diagram"),
    "social-proof": t("landing.sidebar.social_proof"),
    faq: t("landing.sidebar.faq"),
    auth: t("landing.sidebar.auth"),
  };

  const renderView = () => {
    switch (activeView) {
      case "inicio":
        return <LandingHero />;
      case "features":
        return <LandingFeatures />;
      case "plans":
        return <LandingPlans />;
      case "comparison":
        return <LandingComparison />;
      case "app-mobile":
        return <LandingAppMobile />;
      case "diagram":
        return <LandingOnboardingDiagram />;
      case "social-proof":
        return <LandingSocialProof />;
      case "faq":
        return <LandingFAQ />;
      case "auth":
        return <LandingAuthForm />;
      default:
        return <LandingHero />;
    }
  };

  return (
    <div className="flex min-h-screen flex-nowrap">
      <LandingSidebar
        activeView={activeView}
        onSelectView={setActiveView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col lg:ml-0">
        {/* Top bar: menú móvil + espacio para logo */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 px-4 backdrop-blur-sm lg:px-8">
          <button
            type="button"
            className="rounded-lg p-2 ds-muted hover:bg-[var(--color-surface-2)] hover:ds-text lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 lg:hidden" />
        </header>

        {/* Main content */}
        {activeView === "inicio" ? (
          <main className="flex flex-1 flex-col">
            <LandingHero onGoToAuth={() => setActiveView("auth")} />
            <LegalFooter variant="landing" />
          </main>
        ) : (
          <main className="flex-1">
            <LandingViewWrapper
              title={viewTitles[activeView]}
              showBack={showBack}
              onBack={() => setActiveView("inicio")}
            >
              {renderView()}
            </LandingViewWrapper>
            <LegalFooter variant="landing" />
          </main>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center ds-muted">
          Cargando...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
