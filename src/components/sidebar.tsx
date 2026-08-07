"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Coins,
  Crown,
  FilePlus2,
  LayoutDashboard,
  Megaphone,
  PanelLeftOpen,
  Plus,
  Settings,
  Sparkles,
  WandSparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { NAV_ITEMS, PLAN_LABELS } from "@/lib/constants";
import type { PlanKey } from "@/lib/types";

const icons = {
  LayoutDashboard,
  BriefcaseBusiness,
  Megaphone,
  Bot,
  Workflow,
  CalendarDays,
  Coins,
  Crown,
  Settings,
};

const navigationGroups = [
  {
    label: "Visão geral",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { href: "/dashboard/copilot", label: "Agente de Marketing", icon: Bot, agent: true },
      { href: "/dashboard/brands", label: "Brand Intelligence", icon: BriefcaseBusiness },
    ],
  },
  {
    label: "Criar",
    items: [
      { href: "/dashboard/ads", label: "Ads Studio", icon: Megaphone },
      { href: "/dashboard/content", label: "Conteúdo", icon: CalendarDays },
      { href: "/dashboard/funnels", label: "Funis", icon: Workflow },
    ],
  },
  {
    label: "Gestão",
    items: [
      { href: "/dashboard/credits", label: "Créditos", icon: Coins },
      { href: "/dashboard/plans", label: "Planos", icon: Crown },
      { href: "/dashboard/settings", label: "Definições", icon: Settings },
    ],
  },
] as const;

const quickCreateItems = [
  { href: "/dashboard/brands/new", label: "Nova marca", description: "Criar Brand Kit", icon: BriefcaseBusiness },
  { href: "/dashboard/ads", label: "Novo anúncio", description: "Criativo e copy", icon: Megaphone },
  { href: "/dashboard/content", label: "Novo conteúdo", description: "Conteúdo multi-canal", icon: FilePlus2 },
  { href: "/dashboard/funnels", label: "Novo funil", description: "Jornada de conversão", icon: Workflow },
  { href: "/dashboard/copilot", label: "Perguntar ao agente", description: "Estratégia com IA", icon: WandSparkles },
] as const;

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "MK";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function isActiveRoute(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  plan,
  balance,
  allowance,
  workspaceName = "Workspace",
  userName = "Conta MarkAI",
}: {
  plan: PlanKey;
  balance: number;
  allowance: number;
  workspaceName?: string;
  userName?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const used = Math.max(0, allowance - Math.min(balance, allowance));
  const percentage = allowance > 0 ? Math.min(100, Math.round((used / allowance) * 100)) : 0;
  const remainingPercentage = allowance > 0 ? Math.max(0, Math.min(100, Math.round((Math.min(balance, allowance) / allowance) * 100))) : 0;
  const planLabel = PLAN_LABELS[plan];

  const formattedBalance = useMemo(() => Math.max(0, balance).toLocaleString("pt-PT"), [balance]);
  const formattedAllowance = useMemo(() => Math.max(0, allowance).toLocaleString("pt-PT"), [allowance]);

  useEffect(() => {
    const saved = window.localStorage.getItem("markai:sidebar-collapsed") === "true";
    setCollapsed(saved);
    document.documentElement.dataset.sidebarCollapsed = saved ? "true" : "false";
    return () => {
      delete document.documentElement.dataset.sidebarCollapsed;
    };
  }, []);

  useEffect(() => {
    setQuickCreateOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("markai:sidebar-collapsed", String(next));
      document.documentElement.dataset.sidebarCollapsed = next ? "true" : "false";
      if (next) setQuickCreateOpen(false);
      return next;
    });
  }

  function toggleQuickCreate() {
    if (collapsed) {
      setCollapsed(false);
      window.localStorage.setItem("markai:sidebar-collapsed", "false");
      document.documentElement.dataset.sidebarCollapsed = "false";
      window.setTimeout(() => setQuickCreateOpen(true), 120);
      return;
    }
    setQuickCreateOpen((value) => !value);
  }

  return (
    <aside className={`sidebar premium-sidebar command-sidebar${collapsed ? " is-collapsed" : ""}`}>
      <div className="command-sidebar-brand">
        <Logo href="/dashboard" />
        <span className="command-sidebar-edition">OS</span>
        <button
          type="button"
          className="command-sidebar-collapse"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <Link className="command-workspace-card" href="/dashboard/settings" title={collapsed ? workspaceName : undefined}>
        <span className="command-workspace-avatar">{initials(workspaceName)}</span>
        <span className="command-workspace-copy">
          <small>Workspace</small>
          <strong>{workspaceName}</strong>
          <span>Gerir workspace</span>
        </span>
        <span className={`command-plan-badge plan-${plan}`}>{planLabel}</span>
      </Link>

      <div className="command-quick-create-wrap">
        <button
          type="button"
          className={`command-quick-create${quickCreateOpen ? " open" : ""}`}
          onClick={toggleQuickCreate}
          aria-expanded={quickCreateOpen}
          title={collapsed ? "Criar" : undefined}
        >
          <span><Plus size={17} /></span>
          <strong>Criar</strong>
          <ChevronDown className="command-quick-chevron" size={14} />
        </button>
        {quickCreateOpen && !collapsed && (
          <div className="command-quick-menu">
            <div className="command-quick-heading">
              <span><Zap size={13} /> Quick create</span>
              <small>Começa sem perder contexto</small>
            </div>
            {quickCreateItems.map(({ href, label, description, icon: Icon }) => (
              <Link href={href} key={label}>
                <span><Icon size={16} /></span>
                <div><strong>{label}</strong><small>{description}</small></div>
                <ChevronRight size={13} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <nav className="command-navigation" aria-label="Navegação principal">
        {navigationGroups.map((group) => (
          <section className="command-nav-group" key={group.label}>
            <span className="command-nav-label">{group.label}</span>
            <div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(pathname, item.href);
                const isAgent = "agent" in item && item.agent;
                return (
                  <Link
                    className={`command-nav-link${active ? " active" : ""}${isAgent ? " agent-link" : ""}`}
                    href={item.href}
                    key={item.href}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="command-nav-icon"><Icon size={18} /></span>
                    <span className="command-nav-copy">{item.label}</span>
                    {isAgent && <span className="command-agent-status"><i /> Online</span>}
                    {item.href === "/dashboard/plans" && plan === "free" && <span className="command-upgrade-mini">UP</span>}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="command-sidebar-bottom">
        <section className="command-credit-card" title={collapsed ? `${formattedBalance} créditos disponíveis` : undefined}>
          <header>
            <span className="command-credit-icon"><Sparkles size={15} /></span>
            <div><small>Créditos</small><strong>{formattedBalance}</strong></div>
            <span className="command-credit-percent">{remainingPercentage}%</span>
          </header>
          <div className="command-credit-progress"><i style={{ width: `${remainingPercentage}%` }} /></div>
          <div className="command-credit-meta"><span>{formattedAllowance} incluídos</span><span>{percentage}% usado</span></div>
          <Link href="/dashboard/credits">Ver utilização <ChevronRight size={13} /></Link>
        </section>

        {plan === "free" ? (
          <Link className="command-upgrade-card" href="/dashboard/plans" title={collapsed ? "Desbloquear MarkAI Pro" : undefined}>
            <span><Crown size={15} /></span>
            <div><strong>Desbloqueia o MarkAI</strong><small>Mais IA, vídeo e workspaces</small></div>
            <ChevronRight size={13} />
          </Link>
        ) : (
          <Link className="command-paid-plan" href="/dashboard/plans" title={collapsed ? `Plano ${planLabel}` : undefined}>
            <span><Crown size={14} /></span><strong>{planLabel}</strong><small>Gerir plano</small>
          </Link>
        )}

        <Link className="command-account" href="/dashboard/settings" title={collapsed ? userName : undefined}>
          <span className="command-account-avatar">{initials(userName)}</span>
          <span className="command-account-copy"><strong>{userName}</strong><small>{planLabel} · {formattedBalance} créditos</small></span>
          <CircleUserRound size={16} />
        </Link>
      </div>
    </aside>
  );
}

export function MobileMenu() {
  const pathname = usePathname();
  const items = [NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2], NAV_ITEMS[3], NAV_ITEMS[6]];

  return (
    <nav className="mobile-menu">
      {items.map((item) => {
        const Icon = icons[item.icon];
        const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        return <Link aria-label={item.label} className={active ? "active" : ""} href={item.href} key={item.href}><Icon size={19}/></Link>;
      })}
    </nav>
  );
}
