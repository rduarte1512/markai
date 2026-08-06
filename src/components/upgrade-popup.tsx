"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Crown, Sparkles, X, Zap } from "lucide-react";
import type { PlanKey } from "@/lib/types";

const DISMISS_KEY = "markai-upgrade-dismissed-at";
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export function UpgradePopup({ plan, balance, allowance }: { plan: PlanKey; balance: number; allowance: number }) {
  const [visible, setVisible] = useState(false);
  const usedPercentage = useMemo(() => allowance > 0 ? Math.min(100, Math.round(((allowance - balance) / allowance) * 100)) : 0, [allowance, balance]);

  useEffect(() => {
    if (plan !== "free") return;
    const lastDismissed = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - lastDismissed < TWELVE_HOURS) return;
    const delay = usedPercentage >= 50 ? 8000 : 40000;
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [plan, usedPercentage]);

  if (plan !== "free" || !visible) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  return (
    <div className="upgrade-popup-backdrop" role="dialog" aria-modal="true" aria-label="Upgrade de plano">
      <aside className="upgrade-popup">
        <button className="upgrade-popup-close" type="button" onClick={dismiss} aria-label="Fechar"><X size={17}/></button>
        <div className="upgrade-popup-glow"/>
        <span className="upgrade-popup-icon"><Crown size={22}/></span>
        <span className="premium-eyebrow"><Sparkles size={13}/> Oferta para o teu workspace</span>
        <h2>Desbloqueia 50× mais créditos.</h2>
        <p>O Starter dá-te 3.000 créditos, cinco marcas e acesso alargado aos modelos — por menos de 1€ por dia no plano anual.</p>

        <div className="upgrade-usage-card">
          <div><span>Plano Free</span><strong>{balance} de {allowance} créditos restantes</strong></div>
          <div className="progress"><div style={{ width: `${usedPercentage}%` }}/></div>
        </div>

        <div className="upgrade-popup-points">
          <span><Zap size={14}/> 5 marcas</span>
          <span><Sparkles size={14}/> Modelos premium</span>
          <span><Crown size={14}/> Relatórios e portal</span>
        </div>

        <Link className="button button-primary upgrade-popup-cta" href="/dashboard/checkout?plan=starter&cycle=annual">
          Ver oferta Starter <ArrowRight size={16}/>
        </Link>
        <button className="upgrade-popup-later" type="button" onClick={dismiss}>Agora não</button>
      </aside>
    </div>
  );
}
