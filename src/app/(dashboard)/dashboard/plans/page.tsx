import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { PlanSelector } from "@/components/plan-selector";
import { requireAppContext } from "@/lib/auth";

export const metadata = { title: "Planos" };

export default async function PlansPage() {
  const context = await requireAppContext();

  return (
    <div className="premium-page-shell">
      <section className="plans-hero-panel">
        <div>
          <span className="premium-eyebrow"><Sparkles size={14}/> Planos MarkAI</span>
          <h1>Escolhe a potência certa para a tua agência.</h1>
          <p>Mais créditos, mais marcas, modelos superiores e ferramentas de colaboração para crescer sem trocar de plataforma.</p>
        </div>
        <div className="plans-hero-stats">
          <div><Zap size={18}/><strong>11 modelos</strong><span>Escolhe custo e qualidade</span></div>
          <div><ShieldCheck size={18}/><strong>Sem fidelização</strong><span>Cancela quando precisares</span></div>
          <div><ArrowRight size={18}/><strong>Upgrade imediato</strong><span>Créditos atualizados na hora</span></div>
        </div>
      </section>

      <PlanSelector currentPlan={context.plan_key} embedded />

      <section className="plan-guarantee-strip">
        <div><ShieldCheck size={22}/><span><strong>Pagamento seguro</strong><small>Checkout preparado para integração Stripe.</small></span></div>
        <div><Zap size={22}/><span><strong>Créditos transparentes</strong><small>Sabes sempre quanto cada modelo consome.</small></span></div>
        <div><Sparkles size={22}/><span><strong>Sem surpresas</strong><small>Limites claros antes de cada geração.</small></span></div>
      </section>
    </div>
  );
}
