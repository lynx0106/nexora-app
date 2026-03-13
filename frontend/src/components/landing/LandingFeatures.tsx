"use client";

import { useTranslation } from "react-i18next";
import {
  Package,
  ShoppingCart,
  Calendar,
  MessageCircle,
  Bot,
  CreditCard,
  Zap,
  FileText,
} from "lucide-react";

const features = [
  { key: "products", icon: Package },
  { key: "orders", icon: ShoppingCart },
  { key: "agenda", icon: Calendar },
  { key: "chat", icon: MessageCircle },
  { key: "ai", icon: Bot },
  { key: "payments", icon: CreditCard },
  { key: "automations", icon: Zap },
  { key: "audit", icon: FileText },
];

export default function LandingFeatures() {
  const { t } = useTranslation();

  return (
    <section id="features" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold ds-text sm:text-4xl">
            {t("landing.features.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg ds-soft">
            {t("landing.features.subtitle")}
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="ds-card ds-section-transition flex flex-col p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold ds-text">
                {t(`landing.features.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm ds-soft">
                {t(`landing.features.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
