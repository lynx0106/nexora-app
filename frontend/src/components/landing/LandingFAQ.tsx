"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const;

export default function LandingFAQ() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold ds-text sm:text-4xl">
            {t("landing.faq.title")}
          </h2>
          <p className="mt-4 text-lg ds-soft">
            {t("landing.faq.subtitle")}
          </p>
        </div>

        <div className="mt-12 space-y-2">
          {FAQ_KEYS.map((key, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={key}
                className="ds-card overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left ds-text hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <span className="font-medium pr-4">
                    {t(`landing.faq.${key}.question`)}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 shrink-0 ds-muted" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 ds-muted" />
                  )}
                </button>
                {isOpen && (
                  <div className="border-t border-[var(--color-border)] px-6 py-4">
                    <p className="text-sm ds-soft leading-relaxed">
                      {t(`landing.faq.${key}.answer`)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
