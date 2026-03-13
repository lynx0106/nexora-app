/**
 * Planes de suscripción NEXORA
 * Límites y precios según docs/LANDING_PLANS_ONBOARDING_SPEC.md
 */

export type PlanKey = 'starter' | 'pro' | 'enterprise';

export interface PlanConfig {
  key: PlanKey;
  maxTenants: number; // Negocios/empresas que puede gestionar la cuenta
  maxUsersPerTenant: number; // Usuarios por negocio
  priceUsd: number | null; // null = contacto/enterprise
  priceCop: number | null;
  features: {
    products: boolean;
    orders: boolean;
    agenda: boolean;
    chat: boolean;
    ai: boolean;
    payments: boolean;
    automations: boolean;
    audit: boolean;
    api: boolean;
  };
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  starter: {
    key: 'starter',
    maxTenants: 1,
    maxUsersPerTenant: 3,
    priceUsd: 29,
    priceCop: 149000,
    features: {
      products: true,
      orders: true,
      agenda: true,
      chat: false,
      ai: true,
      payments: false,
      automations: false,
      audit: false,
      api: false,
    },
  },
  pro: {
    key: 'pro',
    maxTenants: 3,
    maxUsersPerTenant: 15,
    priceUsd: 79,
    priceCop: 349000,
    features: {
      products: true,
      orders: true,
      agenda: true,
      chat: true,
      ai: true,
      payments: true,
      automations: true,
      audit: false,
      api: false,
    },
  },
  enterprise: {
    key: 'enterprise',
    maxTenants: 999,
    maxUsersPerTenant: 9999,
    priceUsd: null,
    priceCop: null,
    features: {
      products: true,
      orders: true,
      agenda: true,
      chat: true,
      ai: true,
      payments: true,
      automations: true,
      audit: true,
      api: true,
    },
  },
};

export function getPlanLimits(plan: PlanKey): { maxTenants: number; maxUsersPerTenant: number } {
  const config = PLANS[plan] ?? PLANS.starter;
  return {
    maxTenants: config.maxTenants,
    maxUsersPerTenant: config.maxUsersPerTenant,
  };
}
