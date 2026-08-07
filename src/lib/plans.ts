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
    tagline: "Para descobrir o MarkAI sem risco.",
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    credits: 60,
    brands: "1 marca",
    seats: "1 utilizador",
    workspaceLimit: 1,
    modelAccess: "Modelos económicos",
    features: [
      "60 créditos por mês",
      "1 workspace",
      "Ads Studio essencial",
      "Copiloto em modo limitado",
      "Brand Kit para uma marca",
      "Histórico de 7 dias",
    ],
    limits: [
      "Sem workspaces adicionais",
      "Sem relatórios avançados",
      "Sem agendamento social",
      "Sem portal de cliente",
      "Limites baixos nos modelos premium",
    ],
  },
  {
    key: "starter",
    name: "Starter",
    tagline: "Para freelancers e equipas pequenas.",
    monthlyPrice: 29,
    annualMonthlyPrice: 23,
    credits: 3000,
    brands: "5 marcas",
    seats: "3 utilizadores",
    workspaceLimit: 2,
    modelAccess: "Modelos baixos e médios",
    badge: "Melhor para começar",
    features: [
      "3.000 créditos por mês",
      "Até 2 workspaces",
      "5 Brand Kits completos",
      "Ads Studio e variações A/B",
      "Funis e calendário de conteúdo",
      "Relatórios essenciais",
      "Portal de cliente",
    ],
    limits: ["Sem white-label", "Agendamento social limitado"],
  },
  {
    key: "pro",
    name: "Pro",
    tagline: "Para agências que precisam de escala.",
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
      "Até 5 workspaces",
      "20 marcas e 10 utilizadores",
      "Modelos premium e de alto consumo",
      "Relatórios completos e SEO",
      "Agendamento social",
      "Aprovações e colaboração",
      "Suporte prioritário",
    ],
    limits: ["Sem white-label completo"],
  },
  {
    key: "agency",
    name: "Agency",
    tagline: "Operação completa para equipas maiores.",
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
      "Até 15 workspaces",
      "Marcas ilimitadas",
      "50 lugares de equipa",
      "White-label e portal personalizado",
      "Todos os relatórios e integrações",
      "Limites máximos por modelo",
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
