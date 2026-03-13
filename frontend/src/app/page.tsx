"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingHero from "@/components/landing/LandingHero";
import LandingAuthForm from "@/components/landing/LandingAuthForm";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingPlans from "@/components/landing/LandingPlans";
import LandingComparison from "@/components/landing/LandingComparison";
import LandingAppMobile from "@/components/landing/LandingAppMobile";
import LandingOnboardingDiagram from "@/components/landing/LandingOnboardingDiagram";
import LandingSocialProof from "@/components/landing/LandingSocialProof";
import LandingFAQ from "@/components/landing/LandingFAQ";
import LandingFooter from "@/components/landing/LandingFooter";

function HomeContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

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

  return (
    <>
      <LandingHeader />
      <main className="pt-16">
        <LandingHero />
        <LandingAuthForm />
        <LandingFeatures />
        <LandingPlans />
        <LandingComparison />
        <LandingAppMobile />
        <LandingOnboardingDiagram />
        <LandingSocialProof />
        <LandingFAQ />
        <LandingFooter />
      </main>
    </>
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
