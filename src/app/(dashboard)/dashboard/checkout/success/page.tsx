import Link from "next/link";
import { ArrowRight, Check, CircleCheckBig, Megaphone, Sparkles, WandSparkles } from "lucide-react";
import { requireAppContext } from "@/lib/auth";
import { getPlan, type BillingCycle } from "@/lib/plans";

export const metadata = { title: "Plano ativado" };

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ plan?: string; cycle?: string; payment?: string }> }) {
  await requireAppContext();
  const query = await searchParams;
  const plan = getPlan(query.plan);
  const cycle: BillingCycle = query.cycle === "monthly" ? "monthly" : "annual";

  return (
    <div className="co-page co-success-page">
      <main className="co-success-main">
        <div className="co-success-hero">
          <div className="co-success-logo"><span><Sparkles size={19}/></span>MarkAI</div>
          <div className="co-success-check"><CircleCheckBig size={46}/></div>
          <span className="co-success-eyebrow">Plano ativado com sucesso</span>
          <h1>Bem-vindo ao {plan.name}.</h1>
          <p>O teu workspace já tem acesso às novas capacidades. Agora tens mais margem para criar, testar e escalar campanhas sem sair do MarkAI.</p>
          <div className="co-success-plan-strip">
            <span><small>Plano</small><strong>{plan.name}</strong></span>
            <span><small>Créditos mensais</small><strong>{plan.credits.toLocaleString("pt-PT")}</strong></span>
            <span><small>Workspaces</small><strong>Até {plan.workspaceLimit}</strong></span>
            <span><small>Renovação</small><strong>{cycle === "annual" ? "Anual" : "Mensal"}</strong></span>
          </div>
        </div>

        <section className="co-unlocked-card">
          <div className="co-unlocked-head">
            <span><WandSparkles size={17}/> O que acabaste de desbloquear</span>
            <small>Disponível já no teu workspace</small>
          </div>
          <div className="co-unlocked-grid">
            {plan.features.slice(0, 6).map((feature, index) => (
              <article key={feature}>
                <span>{index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                <div><strong>{feature}</strong><small>Incluído no plano {plan.name}</small></div>
                <Check size={16}/>
              </article>
            ))}
          </div>
        </section>

        <section className="co-next-actions">
          <Link href="/dashboard/copilot">
            <span><Sparkles size={18}/></span>
            <div><small>Começa pela IA</small><strong>Usar o Agente de Marketing</strong></div>
            <ArrowRight size={17}/>
          </Link>
          <Link href="/dashboard/ads">
            <span><Megaphone size={18}/></span>
            <div><small>Cria já</small><strong>Abrir o Ads Studio</strong></div>
            <ArrowRight size={17}/>
          </Link>
        </section>

        <Link className="co-enter-dashboard" href="/dashboard">Entrar no dashboard <ArrowRight size={17}/></Link>
        <p className="co-success-foot">A subscrição pode ser gerida a qualquer momento em Definições → Plano e faturação.</p>
      </main>
    </div>
  );
}
