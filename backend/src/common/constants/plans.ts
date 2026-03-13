/**
 * Planes de suscripción NEXORA
 * Límites y precios según docs/LANDING_PLANS_ONBOARDING_SPEC.md
 */

export type PlanKey = 'starter' | 'pro' | 'enterprise';

export interface PlanConfig {
  key: PlanKey;
  maxTenants: number; // Negocios/empresas que puede gestionar la cuenta
  maxUsersPerTenant: number; // Admins + empleados por negocio (excluye clientes)
  maxAdminsPerTenant: number; // Máximo de admins por empresa
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
    maxUsersPerTenant: 3, // 1 admin + 2 empleados
    maxAdminsPerTenant: 1,
    priceUsd: 67,
    priceCop: 280000, // ~67 USD
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
    maxUsersPerTenant: 6, // 2 admins + 4 empleados
    maxAdminsPerTenant: 2,
    priceUsd: 97,
    priceCop: 405000, // ~97 USD
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
    maxAdminsPerTenant: 10,
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

export function getPlanLimits(plan: PlanKey): {
  maxTenants: number;
  maxUsersPerTenant: number;
  maxAdminsPerTenant: number;
} {
  const config = PLANS[plan] ?? PLANS.starter;
  return {
    maxTenants: config.maxTenants,
    maxUsersPerTenant: config.maxUsersPerTenant,
    maxAdminsPerTenant: config.maxAdminsPerTenant ?? 3,
  };
}
