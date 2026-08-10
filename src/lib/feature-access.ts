import type { PlanKey } from "@/lib/types";

export type GrowthFeatureKey =
  | "performance"
  | "campaigns"
  | "publisher"
  | "clientPortal"
  | "reports"
  | "funnelAnalytics"
  | "automations"
  | "searchIntelligence";

type FeatureLimit = {
  enabled: boolean;
  limit: number;
  label: string;
  ai?: boolean;
  live?: boolean;
  windowDays?: number;
  beta?: boolean;
};

export type GrowthAccess = Record<GrowthFeatureKey, FeatureLimit>;

const unlimited = 999999;

export const GROWTH_ACCESS: Record<PlanKey, GrowthAccess> = {
  free: {
    performance: { enabled: true, limit: 8, windowDays: 7, ai: false, label: "7 dias · 8 snapshots" },
    campaigns: { enabled: true, limit: 1, label: "1 campanha ativa" },
    publisher: { enabled: true, limit: 3, live: false, label: "3 publicações/mês · sem publicação live" },
    clientPortal: { enabled: false, limit: 0, label: "Disponível nos planos pagos" },
    reports: { enabled: true, limit: 1, ai: false, label: "1 relatório básico/mês" },
    funnelAnalytics: { enabled: true, limit: 1, label: "1 funil com analytics" },
    automations: { enabled: false, limit: 0, label: "Disponível nos planos pagos" },
    searchIntelligence: { enabled: true, limit: 1, ai: false, beta: true, label: "1 auditoria Beta/mês" },
  },
  starter: {
    performance: { enabled: true, limit: 250, windowDays: 90, ai: true, live: true, label: "90 dias · insights com IA" },
    campaigns: { enabled: true, limit: 10, label: "10 campanhas ativas" },
    publisher: { enabled: true, limit: 50, live: true, label: "50 publicações/mês" },
    clientPortal: { enabled: true, limit: 5, label: "5 portais de cliente" },
    reports: { enabled: true, limit: 10, ai: true, label: "10 relatórios IA/mês" },
    funnelAnalytics: { enabled: true, limit: 10, label: "10 funis com analytics" },
    automations: { enabled: true, limit: 3, label: "3 automações ativas" },
    searchIntelligence: { enabled: true, limit: 5, ai: true, beta: true, label: "5 auditorias Beta/mês" },
  },
  pro: {
    performance: { enabled: true, limit: 2500, windowDays: 365, ai: true, live: true, label: "365 dias · sync e IA" },
    campaigns: { enabled: true, limit: 50, label: "50 campanhas ativas" },
    publisher: { enabled: true, limit: 250, live: true, label: "250 publicações/mês" },
    clientPortal: { enabled: true, limit: 25, label: "25 portais de cliente" },
    reports: { enabled: true, limit: 50, ai: true, label: "50 relatórios IA/mês" },
    funnelAnalytics: { enabled: true, limit: 100, label: "Analytics e A/B avançado" },
    automations: { enabled: true, limit: 25, label: "25 automações ativas" },
    searchIntelligence: { enabled: true, limit: 30, ai: true, beta: true, label: "30 auditorias Beta/mês" },
  },
  agency: {
    performance: { enabled: true, limit: unlimited, windowDays: 730, ai: true, live: true, label: "Histórico alargado · sync e IA" },
    campaigns: { enabled: true, limit: unlimited, label: "Campanhas sem limite prático" },
    publisher: { enabled: true, limit: 2000, live: true, label: "2.000 publicações/mês" },
    clientPortal: { enabled: true, limit: unlimited, label: "Portais sem limite prático" },
    reports: { enabled: true, limit: unlimited, ai: true, label: "Relatórios sem limite prático" },
    funnelAnalytics: { enabled: true, limit: unlimited, label: "Analytics e A/B sem limite prático" },
    automations: { enabled: true, limit: 100, label: "100 automações ativas" },
    searchIntelligence: { enabled: true, limit: 200, ai: true, beta: true, label: "200 auditorias Beta/mês" },
  },
};

export function getGrowthAccess(plan: PlanKey) {
  return GROWTH_ACCESS[plan] || GROWTH_ACCESS.free;
}

export function planCan(plan: PlanKey, feature: GrowthFeatureKey) {
  return getGrowthAccess(plan)[feature].enabled;
}
