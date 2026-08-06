"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, Check, Sparkles, X } from "lucide-react";
import { PLANS, getPlanPrice, type BillingCycle } from "@/lib/plans";
import type { PlanKey } from "@/lib/types";

export function PlanSelector({ currentPlan, embedded = false }: { currentPlan?: PlanKey; embedded?: boolean }) {
  const [cycle, setCycle] = useState<BillingCycle>("annual");

  return (
    <div className={embedded ? "plan-selector embedded" : "plan-selector"}>
      <div className="billing-toggle" role="group" aria-label="Periodicidade da faturação">
        <button className={cycle === "monthly" ? "active" : ""} onClick={() => setCycle("monthly")} type="button">Mensal</button>
        <button className={cycle === "annual" ? "active" : ""} onClick={() => setCycle("annual")} type="button">Anual <span>Poupa 20%</span></button>
      </div>

      <div className="premium-pricing-grid">
        {PLANS.map((plan) => {
          const price = getPlanPrice(plan, cycle);
          const isCurrent = currentPlan === plan.key;
          const checkoutHref = `/dashboard/checkout?plan=${plan.key}&cycle=${cycle}`;

          return (
            <article className={`premium-plan-card ${plan.highlighted ? "highlighted" : ""} ${isCurrent ? "current" : ""}`} key={plan.key}>
              {plan.badge && <span className="premium-plan-badge"><Sparkles size={12}/>{plan.badge}</span>}
              {isCurrent && <span className="current-plan-pill"><BadgeCheck size={13}/> Plano atual</span>}
              <div className="premium-plan-heading">
                <h3>{plan.name}</h3>
                <p>{plan.tagline}</p>
              </div>
              <div className="premium-price-row">
                <strong>{price === 0 ? "0€" : `${price}€`}</strong>
                <span>{price === 0 ? "para sempre" : "/mês"}</span>
              </div>
              {cycle === "annual" && price > 0 && (
                <small className="annual-note">Faturado anualmente · {price * 12}€/ano</small>
              )}
              <div className="plan-capacity-row">
                <span>{plan.credits.toLocaleString("pt-PT")} créditos</span>
                <span>{plan.brands}</span>
                <span>{plan.seats}</span>
              </div>
              <div className="plan-model-access">{plan.modelAccess}</div>
              <ul className="premium-feature-list">
                {plan.features.map((feature) => <li key={feature}><Check size={15}/>{feature}</li>)}
                {plan.limits.map((limit) => <li className="muted-limit" key={limit}><X size={14}/>{limit}</li>)}
              </ul>
              {isCurrent ? (
                <button className="button button-secondary plan-cta" disabled type="button">Plano ativo</button>
              ) : plan.key === "free" ? (
                <Link className="button button-secondary plan-cta" href={currentPlan ? "/dashboard/settings#billing" : "/register"}>Começar grátis</Link>
              ) : (
                <Link className={`button plan-cta ${plan.highlighted ? "button-primary" : "button-secondary"}`} href={currentPlan ? checkoutHref : `/register?plan=${plan.key}`}>
                  Escolher {plan.name}
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
