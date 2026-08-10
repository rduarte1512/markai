import type { PlanKey } from "@/lib/types";

export type BillingCycle = "monthly" | "annual";

export type PlanDefinition = {
  key: PlanKey;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  credits: number;
  brands: string;
  seats: string;
  workspaceLimit: number;
  modelAccess: string;
  badge?: string;
  highlighted?: boolean;
  features: string[];
  limits: string[];
};

export const PLANS: PlanDefinition[] = [
  {
    key: "free",
    name: "Free",
    tagline: "Experimenta o sistema antes de escalar.",
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    credits: 60,
    brands: "1 marca",
    seats: "1 utilizador",
    workspaceLimit: 1,
    modelAccess: "Modelos económicos + testes premium",
    features: [
      "60 créditos por mês",
      "1 workspace e 1 Brand Kit",
      "Ads Studio e Agente em modo limitado",
      "Campaign OS · 1 campanha ativa",
      "Performance · 7 dias / 8 snapshots",
      "Publisher · 3 publicações por mês",
      "1 relatório básico por mês",
      "Analytics de 1 funil",
      "Search Intelligence Beta · 1 auditoria/mês",
    ],
    limits: [
      "Sem publicação live nem sync automático",
      "Sem Client Portal",
      "Sem Automations",
      "Sem relatórios ou Search insights avançados com IA",
      "Limites baixos nos modelos premium",
    ],
  },
  {
    key: "starter",
    name: "Starter",
    tagline: "Para freelancers e pequenas equipas em produção.",
    monthlyPrice: 29,
    annualMonthlyPrice: 23,
    credits: 3000,
    brands: "5 marcas",
    seats: "3 utilizadores",
    workspaceLimit: 2,
    modelAccess: "Modelos baixos, médios e testes premium",
    badge: "Melhor para começar",
    features: [
      "3.000 créditos por mês",
      "Até 2 workspaces e 5 Brand Kits",
      "Campaign OS · 10 campanhas ativas",
      "Performance · 90 dias + insights IA",
      "Publisher · 50 publicações/mês + live connectors",
      "5 Client Portals com aprovações",
      "10 relatórios IA por mês",
      "Analytics de 10 funis + A/B",
      "3 Automations ativas",
      "Search Intelligence Beta · 5 auditorias/mês",
    ],
    limits: ["Sem white-label", "Limites de operação inferiores ao Pro"],
  },
  {
    key: "pro",
    name: "Pro",
    tagline: "Para agências que precisam de escala e otimização contínua.",
    monthlyPrice: 79,
    annualMonthlyPrice: 63,
    credits: 12000,
    brands: "20 marcas",
    seats: "10 utilizadores",
    workspaceLimit: 5,
    modelAccess: "Todos os modelos premium",
    badge: "Mais escolhido",
    highlighted: true,
    features: [
      "12.000 créditos por mês",
      "Até 5 workspaces · 20 marcas · 10 utilizadores",
      "Campaign OS · 50 campanhas ativas",
      "Performance · 365 dias + sync + IA",
      "Publisher · 250 publicações/mês",
      "25 Client Portals e aprovações",
      "50 relatórios IA por mês",
      "Funnel Analytics + A/B avançado",
      "25 Automations ativas",
      "Search Intelligence Beta · 30 auditorias/mês",
      "Suporte prioritário",
    ],
    limits: ["Sem white-label completo"],
  },
  {
    key: "agency",
    name: "Agency",
    tagline: "Marketing Operating System para operações multi-cliente.",
    monthlyPrice: 199,
    annualMonthlyPrice: 159,
    credits: 50000,
    brands: "Marcas ilimitadas",
    seats: "50 utilizadores",
    workspaceLimit: 15,
    modelAccess: "Acesso máximo a todos os modelos",
    badge: "Escala máxima",
    features: [
      "50.000 créditos por mês",
      "Até 15 workspaces · marcas sem limite prático",
      "50 lugares de equipa",
      "Campaign OS e Performance em escala",
      "Publisher · 2.000 publicações/mês",
      "Client Portals sem limite prático + white-label",
      "Relatórios e Funnel Analytics sem limite prático",
      "100 Automations ativas",
      "Search Intelligence Beta · 200 auditorias/mês",
      "Todos os relatórios, integrações e limites máximos",
      "Suporte prioritário de agência",
    ],
    limits: [],
  },
];

export function getPlan(key: string | null | undefined) {
  return PLANS.find((plan) => plan.key === key) ?? PLANS[0];
}

export function getPlanPrice(plan: PlanDefinition, cycle: BillingCycle) {
  return cycle === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;
}
