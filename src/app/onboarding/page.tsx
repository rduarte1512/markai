import { redirect } from "next/navigation";
import { CheckCircle2, Layers3, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { OnboardingBrandForm } from "@/components/onboarding-brand-form";
import { requireAppContext } from "@/lib/auth";
import { getSql } from "@/lib/db";

export const metadata = { title: "Configurar primeira marca" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const context = await requireAppContext();
  const sql = getSql();
  const brands = (await sql`
    select count(*)::int as count
    from brands
    where workspace_id = ${context.workspace_id}
      and status = 'active'
  `) as unknown as Array<{ count: number }>;

  if (Number(brands[0]?.count || 0) > 0) redirect("/dashboard");

  return (
    <main className="onboarding-page">
      <header className="onboarding-header">
        <Logo />
        <div className="onboarding-header-status">
          <span><CheckCircle2 size={15} /> Conta criada</span>
          <strong>Olá, {context.user_name.split(" ")[0]}</strong>
        </div>
      </header>

      <div className="onboarding-layout">
        <aside className="onboarding-intro">
          <span className="onboarding-kicker"><Sparkles size={15} /> Configuração inicial</span>
          <h1>Cria a tua primeira marca antes de entrar.</h1>
          <p>O MarkAI usa este contexto para manter anúncios, conteúdos, funis e decisões sempre alinhados.</p>

          <div className="onboarding-value-list">
            <div><span><Layers3 size={17} /></span><div><strong>Um contexto único</strong><small>A marca fica disponível em todas as ferramentas.</small></div></div>
            <div><span><Sparkles size={17} /></span><div><strong>Resultados mais relevantes</strong><small>A IA passa a escrever com o público e o tom certos.</small></div></div>
            <div><span><CheckCircle2 size={17} /></span><div><strong>Podes editar depois</strong><small>Nada fica bloqueado. O Brand Kit evolui contigo.</small></div></div>
          </div>

          <div className="onboarding-quote">
            <p>“Demora poucos minutos e melhora todas as gerações seguintes.”</p>
            <span>Primeiro passo do teu Marketing OS</span>
          </div>
        </aside>

        <section className="onboarding-card-wrap">
          <OnboardingBrandForm />
        </section>
      </div>
    </main>
  );
}
