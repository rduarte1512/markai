"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, BarChart3, Check, Coins, Crown, Gauge, Rocket,
  Sparkles, TrendingUp, X, Zap,
} from "lucide-react";
import type { PlanKey } from "@/lib/types";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

type NudgeConfig = {
  target: string;
  label: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  benefits: string[];
  baseInterval: number;
  heavyInterval: number;
  firstDelay: number;
};

const CONFIG: Record<PlanKey, NudgeConfig> = {
  free: {
    target: "starter",
    label: "Oferta de crescimento",
    title: "Troca limites por ritmo de produção.",
    description: "O Starter oferece 3.000 créditos, cinco marcas e acesso alargado aos modelos por menos de 1€ por dia no plano anual.",
    cta: "Desbloquear Starter",
    href: "/dashboard/checkout?plan=starter&cycle=annual",
    benefits: ["50× mais créditos", "5 Brand Kits", "Relatórios e portal"],
    baseInterval: 15 * MINUTE,
    heavyInterval: 8 * MINUTE,
    firstDelay: 2 * MINUTE,
  },
  starter: {
    target: "pro",
    label: "A tua operação está a crescer",
    title: "Passa de produção individual para escala de agência.",
    description: "O Pro aumenta a capacidade para 12.000 créditos, 20 marcas, 10 utilizadores e modelos premium com limites muito superiores.",
    cta: "Explorar plano Pro",
    href: "/dashboard/checkout?plan=pro&cycle=annual",
    benefits: ["12.000 créditos", "20 marcas", "Modelos premium"],
    baseInterval: 2 * HOUR,
    heavyInterval: 40 * MINUTE,
    firstDelay: 25 * MINUTE,
  },
  pro: {
    target: "agency",
    label: "Preparado para escalar",
    title: "Centraliza mais clientes sem perder controlo.",
    description: "O Agency inclui marcas ilimitadas, 50 lugares, white-label e a maior capacidade de IA para operações exigentes.",
    cta: "Conhecer Agency",
    href: "/dashboard/checkout?plan=agency&cycle=annual",
    benefits: ["Marcas ilimitadas", "50 utilizadores", "White-label"],
    baseInterval: 6 * HOUR,
    heavyInterval: 2 * HOUR,
    firstDelay: 60 * MINUTE,
  },
  agency: {
    target: "credits",
    label: "Power pack de produção",
    title: "Mantém a equipa a produzir sem interrupções.",
    description: "Adiciona créditos extra ao saldo da agência e protege os projetos de picos inesperados de utilização.",
    cta: "Ver capacidade e créditos",
    href: "/dashboard/credits",
    benefits: ["Saldo adicional", "Sem alterar o plano", "Mais previsibilidade"],
    baseInterval: 12 * HOUR,
    heavyInterval: 4 * HOUR,
    firstDelay: 2 * HOUR,
  },
};

export function UpgradePopup({ plan, balance, allowance }: { plan: PlanKey; balance: number; allowance: number }) {
  const [visible, setVisible] = useState(false);
  const [sessionActions, setSessionActions] = useState(0);
  const usedPercentage = useMemo(() => allowance > 0 ? Math.min(100, Math.max(0, Math.round(((allowance - Math.min(balance, allowance)) / allowance) * 100))) : 0, [allowance, balance]);
  const config = CONFIG[plan];
  const heavyUsage = usedPercentage >= (plan === "free" ? 35 : 45) || sessionActions >= 18;
  const storageKey = `markai-growth-nudge-${plan}`;

  useEffect(() => {
    let actions = Number(window.sessionStorage.getItem("markai-session-actions") || 0);
    const registerAction = () => {
      actions += 1;
      window.sessionStorage.setItem("markai-session-actions", String(actions));
      setSessionActions(actions);
    };
    window.addEventListener("click", registerAction);
    window.addEventListener("keydown", registerAction);
    setSessionActions(actions);
    return () => {
      window.removeEventListener("click", registerAction);
      window.removeEventListener("keydown", registerAction);
    };
  }, []);

  useEffect(() => {
    const lastShown = Number(window.localStorage.getItem(storageKey) || 0);
    const interval = heavyUsage ? config.heavyInterval : config.baseInterval;
    const elapsed = Date.now() - lastShown;
    const delay = lastShown ? Math.max(4_000, interval - elapsed) : config.firstDelay;
    const timer = window.setTimeout(() => {
      setVisible(true);
      window.localStorage.setItem(storageKey, String(Date.now()));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [config.baseInterval, config.firstDelay, config.heavyInterval, heavyUsage, storageKey]);

  function dismiss() {
    window.localStorage.setItem(storageKey, String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="adaptive-nudge" role="dialog" aria-label="Sugestão de crescimento">
      <button className="adaptive-nudge-close" type="button" onClick={dismiss} aria-label="Fechar"><X size={16}/></button>
      <div className="adaptive-nudge-glow"/>
      <header>
        <span className="adaptive-nudge-icon">{plan === "agency" ? <Coins size={20}/> : <Crown size={20}/>}</span>
        <div><span><Sparkles size={12}/>{config.label}</span><small>{heavyUsage ? "Recomendação baseada no teu ritmo atual" : `Plano ${plan}`}</small></div>
      </header>
      <h2>{config.title}</h2>
      <p>{config.description}</p>

      <div className="adaptive-usage">
        <div><span><Gauge size={14}/> Utilização do período</span><strong>{usedPercentage}%</strong></div>
        <div className="progress"><div style={{ width: `${Math.max(4, usedPercentage)}%` }}/></div>
        <small>{balance.toLocaleString("pt-PT")} de {allowance.toLocaleString("pt-PT")} créditos disponíveis</small>
      </div>

      <div className="adaptive-benefits">
        {config.benefits.map((benefit, index) => <span key={benefit}>{index === 0 ? <Zap size={13}/> : index === 1 ? <TrendingUp size={13}/> : <BarChart3 size={13}/>} {benefit}</span>)}
      </div>

      <Link className="button button-primary adaptive-nudge-cta" href={config.href} onClick={() => setVisible(false)}>{config.cta} <ArrowRight size={15}/></Link>
      <button className="adaptive-nudge-later" type="button" onClick={dismiss}><Check size={13}/> Continuar a trabalhar</button>
    </aside>
  );
}
