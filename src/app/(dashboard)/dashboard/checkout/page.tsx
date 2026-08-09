import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, Gem, ShieldCheck, Sparkles } from "lucide-react";
import { CheckoutForm } from "@/components/checkout-form";
import { requireAppContext } from "@/lib/auth";
import { getPlan, getPlanPrice, type BillingCycle } from "@/lib/plans";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string; cycle?: string }> }) {
  const context = await requireAppContext();
  const query = await searchParams;
  const plan = getPlan(query.plan);
  const cycle: BillingCycle = query.cycle === "monthly" ? "monthly" : "annual";
  const monthlyPrice = getPlanPrice(plan, cycle);
  const total = cycle === "annual" ? monthlyPrice * 12 : monthlyPrice;
  const cycleLabel = cycle === "annual" ? "Anual" : "Mensal";

  if (plan.key === "free") {
    return (
      <div className="empty-state premium-empty-state">
        <div className="empty-icon"><Gem size={24}/></div>
        <h3>Escolhe um plano pago</h3>
        <p>O plano Free não precisa de checkout.</p>
        <Link className="button button-primary" href="/dashboard/plans">Ver planos</Link>
      </div>
    );
  }

  return (
    <div className="co-page">
      <header className="co-topbar">
        <div className="co-topbar-inner co-wrap">
          <Link className="co-back" href="/dashboard/plans"><ArrowLeft size={15}/> Voltar aos planos</Link>
          <span className="co-trust-pill"><ShieldCheck size={13}/> Pagamento protegido</span>
        </div>
      </header>

      <main className="co-main">
        <div className="co-brandhead">
          <span className="co-logo"><span className="co-logo-mark"><Sparkles size={17} strokeWidth={2.4}/></span>MarkAI</span>
        </div>

        <h1 className="co-title">Falta pouco para ativares o {plan.name}.</h1>
        <p className="co-sub">Upgrade <strong>{cycleLabel.toLowerCase()}</strong> · equivale a <strong>{monthlyPrice}€/mês</strong> · ativação imediata</p>

        <details className="co-summary-card">
          <summary className="co-summary-toggle">
            <span>
              <span className="co-plan-tag">{plan.name}</span>
              <span className="co-summary-meta">{cycleLabel} · {plan.credits.toLocaleString("pt-PT")} créditos/mês</span>
            </span>
            <span className="co-summary-price">{total.toLocaleString("pt-PT")}€<small>total hoje</small></span>
            <span className="co-summary-caret"><ChevronDown size={16}/></span>
          </summary>

          <div className="co-summary-detail">
            <ul className="co-features">
              {plan.features.slice(0, 6).map((feature) => <li key={feature}><Check size={15}/>{feature}</li>)}
            </ul>
            <div className="co-detail-row"><span>Periodicidade</span><strong>{cycleLabel}</strong></div>
            <div className="co-detail-row"><span>Créditos mensais</span><strong>{plan.credits.toLocaleString("pt-PT")}</strong></div>
            <div className="co-detail-row"><span>Renovação automática</span><strong>Ativada</strong></div>
            <div className="co-detail-total"><span>Total hoje</span><strong>{total.toLocaleString("pt-PT")}€</strong></div>
            <div className="co-guarantee"><ShieldCheck size={17}/><span><strong>Sem risco.</strong> Cancela nas definições antes da próxima renovação e não voltas a pagar nada.</span></div>
          </div>
        </details>

        <CheckoutForm plan={plan} cycle={cycle} email={context.email} />

        <p className="co-legal">Ao continuar, aceitas os termos de serviço e a política de privacidade da MarkAI. Precisas de ajuda? Podes gerir a tua conta nas definições.</p>
      </main>
    </div>
  );
}
