"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import type { BillingCycle, PlanDefinition } from "@/lib/plans";
import { getPlanPrice } from "@/lib/plans";

export function CheckoutForm({ plan, cycle, email }: { plan: PlanDefinition; cycle: BillingCycle; email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const price = getPlanPrice(plan, cycle);
  const total = cycle === "annual" ? price * 12 : price;

  async function activatePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.key, cycle }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível ativar o plano.");
      router.push("/dashboard/plans?upgraded=1");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="checkout-form-card" onSubmit={activatePlan}>
      <div className="checkout-form-heading">
        <span><CreditCard size={19}/></span>
        <div><h2>Dados de pagamento</h2><p>Checkout seguro e encriptado.</p></div>
      </div>

      <div className="field"><label>Email de faturação</label><input className="input" value={email} readOnly /></div>
      <div className="field"><label>Nome no cartão</label><input className="input" placeholder="Nome completo ou empresa" required /></div>
      <div className="field">
        <label>Número do cartão</label>
        <div className="checkout-card-input"><CreditCard size={17}/><input inputMode="numeric" placeholder="4242 4242 4242 4242" maxLength={19} required/><span>VISA</span></div>
      </div>
      <div className="form-row">
        <div className="field"><label>Validade</label><input className="input" placeholder="MM/AA" maxLength={5} required /></div>
        <div className="field"><label>CVC</label><input className="input" placeholder="123" maxLength={4} required /></div>
      </div>
      <label className="checkout-consent"><input type="checkbox" required/><span>Autorizo a renovação automática. Posso cancelar o plano nas definições.</span></label>

      {error && <div className="form-error">{error}</div>}

      <button className="button button-primary checkout-pay-button" disabled={loading} type="submit">
        {loading ? <><LoaderCircle className="spin" size={17}/> A ativar...</> : <><LockKeyhole size={16}/> Ativar {plan.name} por {total}€</>}
      </button>

      <div className="checkout-security-grid">
        <span><ShieldCheck size={15}/> Pagamento protegido</span>
        <span><Sparkles size={15}/> Upgrade imediato</span>
        <span><Check size={15}/> Cancela quando quiseres</span>
      </div>
      <p className="checkout-demo-note">Nesta fase, o checkout ativa o plano em modo de demonstração. Nenhum dado de cartão é guardado.</p>
    </form>
  );
}
