import Link from "next/link";
import { ArrowLeft, Check, Gem, LockKeyhole, ShieldCheck } from "lucide-react";
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
    <div className="checkout-page-shell">
      <Link className="checkout-back" href="/dashboard/plans"><ArrowLeft size={15}/> Voltar aos planos</Link>
      <div className="checkout-grid">
        <section className="checkout-summary-panel">
          <span className="premium-eyebrow"><LockKeyhole size={14}/> Checkout seguro</span>
          <h1>Confirma o teu upgrade para {plan.name}.</h1>
          <p>Desbloqueia mais marcas, modelos premium e ferramentas para a tua agência crescer.</p>

          <div className="checkout-plan-summary">
            <div><span>Plano escolhido</span><strong>{plan.name}</strong></div>
            <div><span>Periodicidade</span><strong>{cycle === "annual" ? "Anual" : "Mensal"}</strong></div>
            <div><span>Créditos mensais</span><strong>{plan.credits.toLocaleString("pt-PT")}</strong></div>
          </div>

          <ul className="checkout-benefits">
            {plan.features.slice(0, 6).map((feature) => <li key={feature}><Check size={16}/>{feature}</li>)}
          </ul>

          <div className="checkout-total-card">
            <div><span>Total de hoje</span><small>{cycle === "annual" ? `Equivale a ${monthlyPrice}€/mês` : "Renovação mensal"}</small></div>
            <strong>{total}€</strong>
          </div>
          <div className="checkout-guarantee"><ShieldCheck size={20}/><span><strong>Sem risco</strong><small>Podes cancelar nas definições antes da próxima renovação.</small></span></div>
        </section>

        <CheckoutForm plan={plan} cycle={cycle} email={context.email} />
      </div>
    </div>
  );
}
