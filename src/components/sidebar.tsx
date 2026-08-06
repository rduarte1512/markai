"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot, BriefcaseBusiness, CalendarDays, Coins, LayoutDashboard,
  Megaphone, Settings, Workflow,
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
  Settings,
};

export function Sidebar({ plan, balance, allowance }: { plan: PlanKey; balance: number; allowance: number }) {
  const pathname = usePathname();
  const used = Math.max(0, allowance - Math.min(balance, allowance));
  const percentage = allowance > 0 ? Math.min(100, Math.round((used / allowance) * 100)) : 0;

  return (
    <aside className="sidebar">
      <Logo href="/dashboard" />
      <div className="sidebar-section-label">Workspace</div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.icon];
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link className={`sidebar-link ${active ? "active" : ""}`} href={item.href} key={item.href}>
              <Icon size={17} /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-plan">
        <div className="sidebar-plan-top"><strong>Plano {PLAN_LABELS[plan]}</strong><span>{balance} créditos</span></div>
        <div className="progress"><div style={{ width: `${percentage}%` }} /></div>
        <small>{used} de {allowance} créditos mensais usados</small>
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
