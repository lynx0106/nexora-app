"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Smartphone, ChevronDown, ChevronUp, Link2, Download, CheckCircle } from "lucide-react";
import QRCode from "react-qr-code";

const APK_URL = process.env.NEXT_PUBLIC_APP_APK_URL ?? "";

export default function LandingAppMobile() {
  const { t } = useTranslation();
  const [guideOpen, setGuideOpen] = useState(false);
  const hasApkUrl = Boolean(APK_URL);

  return (
    <section id="app-mobile" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="ds-card ds-section-transition overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center gap-10 p-8 lg:p-12">
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <Smartphone className="h-8 w-8" />
              </div>
              {hasApkUrl ? (
                <div className="bg-white p-4 rounded-xl">
                  <QRCode
                    value={APK_URL}
                    size={180}
                    level="H"
                    className="h-auto w-[180px]"
                  />
                </div>
              ) : (
                <div className="h-[180px] w-[180px] rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center ds-muted text-sm text-center px-2">
                  {t("landing.app_mobile.qr_placeholder")}
                </div>
              )}
            </div>

            <div className="flex-1 text-center lg:text-left">
              <h2 className="font-display text-2xl font-bold ds-text sm:text-3xl">
                {t("landing.app_mobile.title")}
              </h2>
              <p className="mt-4 text-lg ds-soft">
                {t("landing.app_mobile.subtitle")}
              </p>

              {hasApkUrl ? (
                <a
                  href={APK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ds-button ds-button-primary mt-6 inline-flex items-center gap-2 px-6 py-3"
                >
                  <Download className="h-5 w-5" />
                  {t("landing.app_mobile.download_btn")}
                </a>
              ) : (
                <p className="mt-6 text-sm ds-muted italic">
                  {t("landing.app_mobile.coming_soon")}
                </p>
              )}

              <button
                type="button"
                onClick={() => setGuideOpen(!guideOpen)}
                className="mt-8 flex w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-left ds-text hover:bg-[var(--color-surface-3)] transition-colors sm:w-auto sm:min-w-[280px]"
              >
                <span className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-[var(--color-accent)]" />
                  {t("landing.app_mobile.how_install")}
                </span>
                {guideOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {guideOpen && (
            <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-8 py-8">
              <div className="max-w-2xl space-y-6">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold">
                      {step}
                    </div>
                    <div>
                      <h4 className="font-display font-semibold ds-text">
                        {t(`landing.app_mobile.steps.${step}.title`)}
                      </h4>
                      <p className="mt-1 text-sm ds-soft">
                        {t(`landing.app_mobile.steps.${step}.text`)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-3 rounded-lg bg-[var(--color-success-soft)] border border-[var(--color-success-border)] p-4">
                  <CheckCircle className="h-5 w-5 shrink-0 text-[var(--color-success)] mt-0.5" />
                  <p className="text-sm ds-text">
                    {t("landing.app_mobile.safety_notice")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
