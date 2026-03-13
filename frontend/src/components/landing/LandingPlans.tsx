"use client";

import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

const plans = [
  {
    key: "starter",
    popular: false,
    price: "$67",
    period: "/mes",
    tenants: "1",
    users: "1 admin + 2 empleados",
    features: [
      "products",
      "orders",
      "agenda",
      "ai",
    ],
  },
  {
    key: "pro",
    popular: true,
    price: "$97",
    period: "/mes",
    tenants: "3",
    users: "2 admins + 4 empleados",
    features: [
      "products",
      "orders",
      "agenda",
      "chat",
      "ai",
      "payments",
      "automations",
    ],
  },
  {
    key: "enterprise",
    popular: false,
    price: "Contacto",
    period: "",
    tenants: "∞",
    users: "∞",
    features: [
      "products",
      "orders",
      "agenda",
      "chat",
      "ai",
      "payments",
      "automations",
      "audit",
      "api",
    ],
  },
];

export default function LandingPlans() {
  const { t } = useTranslation();

  const scrollToAuth = (e: React.MouseEvent) => {
    e.preventDefault();
    document.querySelector("#auth")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="plans" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold ds-text sm:text-4xl">
            {t("landing.plans.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg ds-soft">
            {t("landing.plans.subtitle")}
          </p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`ds-card ds-section-transition relative flex flex-col p-8 ${
                plan.popular
                  ? "ring-2 ring-[var(--color-accent)] shadow-[0_0_30px_var(--color-glow-1)]"
                  : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                  {t("landing.plans.popular")}
                </span>
              )}
              <h3 className="font-display text-xl font-semibold ds-text">
                {t(`landing.plans.${plan.key}.name`)}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold ds-text">
                  {plan.price}
                </span>
                <span className="ds-muted">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm ds-muted">
                {t("landing.plans.tenants")}: {plan.tenants} · {t("landing.plans.users")}: {plan.users}
              </p>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-sm ds-soft">
                    <Check className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
                    {t(`landing.plans.features.${feat}`)}
                  </li>
                ))}
              </ul>
              <a
                href="#auth"
                onClick={scrollToAuth}
                className={`mt-8 block w-full text-center py-3 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? "ds-button-primary"
                    : "ds-button ds-button-ghost"
                }`}
              >
                {plan.key === "enterprise"
                  ? t("landing.plans.contact")
                  : t("landing.plans.cta")}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
