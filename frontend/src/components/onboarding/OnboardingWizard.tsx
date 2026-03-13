"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import {
  PartyPopper,
  Store,
  ImageIcon,
  Users,
  CheckCircle2,
  ShoppingBag,
  Calendar,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fetchAPIWithAuth, uploadFile } from "@/lib/api";

interface OnboardingWizardProps {
  role: string;
  tenantId: string;
  tenantName?: string;
  onComplete: (opts?: { navigateTo?: string }) => void;
}

const SECTOR_OPTIONS: Record<string, string> = {
  restaurant: "Restaurante",
  store: "Tienda",
  clinic: "Consultorio",
  spa: "Spa",
  other: "Otro",
};

export default function OnboardingWizard({ role, tenantId, onComplete }: OnboardingWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [tenantName, setTenantName] = useState("");
  const [sector, setSector] = useState("other");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const roleKey: "admin" | "employee" | "client" =
    role === "admin" || role === "superadmin" ? "admin" :
    role === "client" ? "client" : "employee";

  const totalSteps =
    roleKey === "admin" ? 6 :
    roleKey === "client" ? 3 : 3;

  const completeOnboarding = async () => {
    try {
      await fetchAPIWithAuth("/users/profile", {
        method: "PUT",
        body: JSON.stringify({ onboardingCompleted: true }),
      });
      if (typeof window !== "undefined") {
        const userJson = window.localStorage.getItem("user");
        if (userJson) {
          const user = JSON.parse(userJson);
          user.onboardingCompleted = true;
          window.localStorage.setItem("user", JSON.stringify(user));
        }
      }
    } catch {
      // Fallback: update localStorage only
      if (typeof window !== "undefined") {
        const userJson = window.localStorage.getItem("user");
        if (userJson) {
          const user = JSON.parse(userJson);
          user.onboardingCompleted = true;
          window.localStorage.setItem("user", JSON.stringify(user));
        }
      }
    }
    onComplete({});
  };

  const handleSkip = () => {
    if (skipping) {
      completeOnboarding();
      return;
    }
    setSkipping(true);
    setTimeout(() => setSkipping(false), 3000);
  };

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      if (roleKey === "admin" && tenantId && tenantId !== "system") {
        if (step === 1 && tenantName.trim()) {
          try {
            await fetchAPIWithAuth("/tenants/me", {
              method: "PUT",
              body: JSON.stringify({ name: tenantName.trim() }),
            });
          } catch {
            // Ignore - user can update in Settings
          }
        }
        if (step === 2) {
          try {
            await fetchAPIWithAuth("/tenants/me", {
              method: "PUT",
              body: JSON.stringify({ sector }),
            });
          } catch {
            // Ignore
          }
        }
        if (step === 3) {
          try {
            setLogoUploading(true);
            let logoUrl: string | undefined;
            if (logoFile) {
              logoUrl = await uploadFile(logoFile, "avatars");
            }
            if (logoUrl) {
              await fetchAPIWithAuth("/tenants/me", {
                method: "PUT",
                body: JSON.stringify({ logoUrl }),
              });
            }
          } catch {
            // Ignore - user can add logo in Settings
          } finally {
            setLogoUploading(false);
          }
        }
      }
      setStep((s) => s + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleInviteNow = () => {
    onComplete({ navigateTo: "invitaciones" });
    completeOnboarding();
  };

  const icons = [PartyPopper, Store, Store, ImageIcon, Users, CheckCircle2];
  const stepIcons = roleKey === "employee" ? [PartyPopper, MessageCircle, CheckCircle2] : icons;
  const StepIcon = stepIcons[step] ?? CheckCircle2;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-bg)]/95 backdrop-blur-sm p-4">
      <div className="ds-card w-full max-w-lg overflow-hidden">
        <div className="p-8">
          <div className="mb-6 flex justify-center">
            <Image src="/logo-fondo.png" alt="NEXORA" width={64} height={64} className="object-contain" />
          </div>

          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <StepIcon className="h-7 w-7" />
            </div>
          </div>

          <p className="text-center text-sm ds-muted mb-6">
            {t("onboarding.progress", { current: step + 1, total: totalSteps })}
          </p>

          <div className="min-h-[120px]">
            {roleKey === "admin" && (
              <>
                {step === 0 && (
                  <>
                    <h2 className="font-display text-xl font-semibold ds-text text-center">
                      {t("onboarding.admin.1_title")}
                    </h2>
                    <p className="mt-3 text-center ds-soft">{t("onboarding.admin.1_text")}</p>
                  </>
                )}
                {step === 1 && (
                  <>
                    <h2 className="font-display text-xl font-semibold ds-text text-center">
                      {t("onboarding.admin.2_title")}
                    </h2>
                    <p className="mt-2 text-center text-sm ds-soft">{t("onboarding.admin.2_text")}</p>
                    <input
                      type="text"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      placeholder={t("onboarding.admin.2_placeholder")}
                      className="ds-input w-full mt-4"
                    />
                  </>
                )}
                {step === 2 && (
                  <>
                    <h2 className="font-display text-xl font-semibold ds-text text-center">
                      {t("onboarding.admin.3_title")}
                    </h2>
                    <p className="mt-2 text-center text-sm ds-soft">{t("onboarding.admin.3_text")}</p>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="ds-input w-full mt-4"
                    >
                      {Object.entries(SECTOR_OPTIONS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </>
                )}
                {step === 3 && (
                  <>
                    <h2 className="font-display text-xl font-semibold ds-text text-center">
                      {t("onboarding.admin.4_title")}
                    </h2>
                    <p className="mt-2 text-center text-sm ds-soft">{t("onboarding.admin.4_text")}</p>
                    <div className="mt-6 flex flex-col items-center gap-4">
                      <div className="flex items-center gap-4">
                        {logoFile ? (
                          <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                            <Image
                              src={URL.createObjectURL(logoFile)}
                              alt={t("onboarding.admin.4_preview")}
                              fill
                              className="object-cover"
                              unoptimized
                              sizes="80px"
                            />
                          </div>
                        ) : (
                          <div className="h-20 w-20 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)]">
                            <ImageIcon className="h-10 w-10" />
                          </div>
                        )}
                        <label className="ds-button ds-button-ghost cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setLogoFile(f);
                            }}
                          />
                          {logoFile ? t("onboarding.admin.4_change") : t("onboarding.admin.4_upload")}
                        </label>
                      </div>
                      {logoFile && (
                        <button
                          type="button"
                          onClick={() => setLogoFile(null)}
                          className="text-sm ds-muted hover:ds-soft transition-colors"
                        >
                          {t("onboarding.admin.4_remove")}
                        </button>
                      )}
                    </div>
                  </>
                )}
                {step === 4 && (
                  <>
                    <h2 className="font-display text-xl font-semibold ds-text text-center">
                      {t("onboarding.admin.5_title")}
                    </h2>
                    <p className="mt-3 text-center ds-soft">{t("onboarding.admin.5_text")}</p>
                    {tenantId && tenantId !== "system" && (
                      <button
                        type="button"
                        onClick={handleInviteNow}
                        className="ds-button ds-button-primary w-full mt-6"
                      >
                        <Users className="h-4 w-4 mr-2 inline" />
                        {t("onboarding.admin.5_invite_now")}
                      </button>
                    )}
                  </>
                )}
                {step === 5 && (
                  <>
                    <h2 className="font-display text-xl font-semibold ds-text text-center">
                      {t("onboarding.admin.6_title")}
                    </h2>
                    <p className="mt-3 text-center ds-soft">{t("onboarding.admin.6_text")}</p>
                  </>
                )}
              </>
            )}
            {roleKey === "employee" && (
              <>
                {step === 0 && (
                  <>
                    <h2 className="font-display text-xl font-semibold ds-text text-center">
                      {t("onboarding.employee.1_title")}
                    </h2>
                    <p className="mt-3 text-center ds-soft">{t("onboarding.employee.1_text")}</p>
                  </>
                )}
                {step === 1 && (
                  <>
                    <h2 className="font-display text-xl font-semibold ds-text text-center">
                      {t("onboarding.employee.2_title")}
                    </h2>
                    <p className="mt-2 text-center text-sm ds-soft">{t("onboarding.employee.2_text")}</p>
                    <div className="mt-6 flex justify-center gap-4">
                      <div className="ds-panel flex flex-col items-center p-4 min-w-[100px]">
                        <ShoppingBag className="h-8 w-8 text-[var(--color-accent)] mb-2" />
                        <span className="text-sm ds-text">{t("onboarding.employee.2_orders")}</span>
                      </div>
                      <div className="ds-panel flex flex-col items-center p-4 min-w-[100px]">
                        <Calendar className="h-8 w-8 text-[var(--color-accent)] mb-2" />
                        <span className="text-sm ds-text">{t("onboarding.employee.2_agenda")}</span>
                      </div>
                      <div className="ds-panel flex flex-col items-center p-4 min-w-[100px]">
                        <MessageCircle className="h-8 w-8 text-[var(--color-accent)] mb-2" />
                        <span className="text-sm ds-text">{t("onboarding.employee.2_chat")}</span>
                      </div>
                    </div>
                  </>
                )}
                {step === 2 && (
                  <>
                    <h2 className="font-display text-xl font-semibold ds-text text-center">
                      {t("onboarding.employee.3_title")}
                    </h2>
                    <p className="mt-3 text-center ds-soft">{t("onboarding.employee.3_text")}</p>
                  </>
                )}
              </>
            )}
            {roleKey === "client" && (
              <>
                {step === 0 && (
                  <>
                    <h2 className="font-display text-xl font-semibold ds-text text-center">
                      {t("onboarding.client.1_title")}
                    </h2>
                    <p className="mt-3 text-center ds-soft">{t("onboarding.client.1_text")}</p>
                  </>
                )}
                {step === 1 && (
                  <>
                    <h2 className="font-display text-xl font-semibold ds-text text-center">
                      {t("onboarding.client.2_title")}
                    </h2>
                    <p className="mt-3 text-center ds-soft">{t("onboarding.client.2_text")}</p>
                  </>
                )}
                {step === 2 && (
                  <>
                    <h2 className="font-display text-xl font-semibold ds-text text-center">
                      {t("onboarding.client.3_cta")}
                    </h2>
                    <p className="mt-3 text-center ds-soft">{t("onboarding.client.1_text")}</p>
                  </>
                )}
              </>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm ds-muted hover:ds-soft transition-colors"
            >
              {skipping ? t("onboarding.skip_confirm") : t("onboarding.skip")}
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="ds-button ds-button-ghost"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t("onboarding.back")}
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={roleKey === "admin" && step === 3 && logoUploading}
                className="ds-button ds-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {roleKey === "admin" && step === 3 && logoUploading
                  ? "..."
                  : step === totalSteps - 1
                    ? roleKey === "employee"
                      ? t("onboarding.employee.3_cta")
                      : roleKey === "client"
                        ? t("onboarding.client.3_cta")
                        : t("onboarding.finish")
                    : t("onboarding.next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
