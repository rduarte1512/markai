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
          <span className="premium-eyebrow"><Sparkles size={14}/> Planos MarkAI · Growth OS</span>
          <h1>Escolhe quanto do teu marketing queres pôr a trabalhar.</h1>
          <p>Todos os planos mantêm o núcleo criativo. Os pagos desbloqueiam a operação mais valiosa: Performance Intelligence, publicação live, Client Portals, relatórios com IA, A/B avançado, Automations e limites muito superiores.</p>
        </div>
        <div className="plans-hero-stats">
          <div><Zap size={18}/><strong>8 módulos Growth</strong><span>Criação → publicação → medição</span></div>
          <div><ShieldCheck size={18}/><strong>Limites reais por plano</strong><span>Aplicados também no backend</span></div>
          <div><ArrowRight size={18}/><strong>Search Intelligence</strong><span>SEO + GEO readiness em Beta</span></div>
        </div>
      </section>

      <PlanSelector currentPlan={context.plan_key} embedded />

      <section className="plan-guarantee-strip">
        <div><ShieldCheck size={22}/><span><strong>Free sem armadilhas</strong><small>Campanhas, performance, publisher, report, funil e Search Beta com limites de teste.</small></span></div>
        <div><Zap size={22}/><span><strong>Pagos para produção</strong><small>Portais, automações, IA, sync e publicação live começam no Starter.</small></span></div>
        <div><Sparkles size={22}/><span><strong>Escala progressiva</strong><small>Pro e Agency aumentam fortemente os limites sem mudar de produto.</small></span></div>
      </section>
    </div>
  );
}
