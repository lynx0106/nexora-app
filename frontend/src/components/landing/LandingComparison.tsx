"use client";

import { useTranslation } from "react-i18next";
import { Check, Minus } from "lucide-react";

type PlanKey = "starter" | "pro" | "enterprise";
type CellValue = "yes" | "no" | string;

const comparisonRows: { key: string; starter: CellValue; pro: CellValue; enterprise: CellValue }[] = [
  { key: "tenants", starter: "1", pro: "3", enterprise: "∞" },
  { key: "users", starter: "3", pro: "15", enterprise: "∞" },
  { key: "products", starter: "yes", pro: "yes", enterprise: "yes" },
  { key: "orders", starter: "yes", pro: "yes", enterprise: "yes" },
  { key: "agenda", starter: "yes", pro: "yes", enterprise: "yes" },
  { key: "chat", starter: "no", pro: "yes", enterprise: "yes" },
  { key: "ai", starter: "no", pro: "yes", enterprise: "yes" },
  { key: "payments", starter: "no", pro: "yes", enterprise: "yes" },
  { key: "automations", starter: "no", pro: "yes", enterprise: "yes" },
  { key: "audit", starter: "no", pro: "no", enterprise: "yes" },
  { key: "api", starter: "no", pro: "no", enterprise: "yes" },
  { key: "support", starter: "no", pro: "no", enterprise: "yes" },
];

const plans: PlanKey[] = ["starter", "pro", "enterprise"];

export default function LandingComparison() {
  const { t } = useTranslation();

  const renderCell = (value: CellValue) => {
    if (value === "yes")
      return <Check className="mx-auto h-5 w-5 text-[var(--color-success)]" aria-hidden />;
    if (value === "no")
      return <Minus className="mx-auto h-4 w-4 text-[var(--color-muted)]" aria-hidden />;
    return <span className="ds-text font-medium">{value}</span>;
  };

  return (
    <section
      id="comparison"
      className="scroll-mt-20 border-t border-[var(--color-border)] px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="comparison-title"
    >
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2
            id="comparison-title"
            className="font-display text-2xl font-bold ds-text sm:text-3xl"
          >
            {t("landing.comparison.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm ds-soft">
            {t("landing.comparison.subtitle")}
          </p>
        </div>

        <div className="mt-12 overflow-x-auto rounded-xl border border-[var(--color-border)] ds-panel">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th
                  className="px-4 py-4 text-left font-semibold ds-text"
                  scope="col"
                >
                  {t("landing.comparison.feature")}
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan}
                    className={`px-4 py-4 text-center font-semibold ds-text ${
                      plan === "pro" ? "bg-[var(--color-glow-1)]/20" : ""
                    }`}
                    scope="col"
                  >
                    {t(`landing.plans.${plan}.name`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-[var(--color-border)]/60 last:border-0 hover:bg-[var(--color-surface-2)]/30 transition-colors"
                >
                  <td className="px-4 py-3 ds-soft">
                    {t(`landing.comparison.rows.${row.key}`)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {renderCell(row.starter)}
                  </td>
                  <td className="px-4 py-3 text-center bg-[var(--color-glow-1)]/20">
                    {renderCell(row.pro)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {renderCell(row.enterprise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
