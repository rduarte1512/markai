import type { PlanKey } from "@/lib/types";

export const APP_NAME = "MarkAI";

export const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

export const CONSUMPTION_LABELS = {
  very_low: "Muito baixo",
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
  very_high: "Muito alto",
} as const;

export const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta Ads",
  google: "Google Ads",
  tiktok: "TikTok Ads",
  linkedin: "LinkedIn Ads",
};

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Visão geral", icon: "LayoutDashboard" },
  { href: "/dashboard/brands", label: "Marcas", icon: "BriefcaseBusiness" },
  { href: "/dashboard/ads", label: "Ads Studio", icon: "Megaphone" },
  { href: "/dashboard/copilot", label: "Agente de Marketing", icon: "Bot" },
  { href: "/dashboard/funnels", label: "Funis", icon: "Workflow" },
  { href: "/dashboard/content", label: "Conteúdo", icon: "CalendarDays" },
  { href: "/dashboard/credits", label: "Créditos", icon: "Coins" },
  { href: "/dashboard/plans", label: "Planos", icon: "Crown" },
  { href: "/dashboard/settings", label: "Definições", icon: "Settings" },
] as const;
