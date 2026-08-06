import Link from "next/link";
import { CheckCircle2, CircleAlert, CreditCard, Crown, Database, KeyRound, Server, Sparkles } from "lucide-react";
import { CancelPlanButton } from "@/components/cancel-plan-button";
import { requireAppContext } from "@/lib/auth";
import { PLAN_LABELS } from "@/lib/constants";
import { getSql } from "@/lib/db";
import { getPlan } from "@/lib/plans";

export const metadata = { title: "Definições" };

export default async function SettingsPage() {
  const context = await requireAppContext();
  const gatewayReady = Boolean(process.env.AI_GATEWAY_BASE_URL && process.env.AI_GATEWAY_API_KEY);
  const sql = getSql();
  const subscriptions = (await sql`
    select status, current_period_end, cancel_at_period_end, provider
    from subscriptions
    where workspace_id = ${context.workspace_id}
    limit 1
  `) as unknown as Array<{ status: string; current_period_end: string; cancel_at_period_end: boolean; provider: string | null }>;
  const subscription = subscriptions[0];
  const plan = getPlan(context.plan_key);
  const renewalDate = subscription?.current_period_end
    ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "long" }).format(new Date(subscription.current_period_end))
    : null;

  return (
    <div className="premium-page-shell">
      <div className="page-heading premium-page-heading"><div><span className="premium-eyebrow"><Sparkles size={13}/> Controlo do workspace</span><h1>Definições</h1><p>Gere a organização, a infraestrutura e a subscrição num só lugar.</p></div></div>
      <div className="settings-grid premium-settings-grid">
        <nav className="settings-menu premium-settings-menu"><a className="active" href="#workspace">Workspace</a><a href="#integrations">Integrações</a><a href="#billing">Plano e faturação</a></nav>
        <section className="settings-content premium-settings-content">
          <h2 id="workspace">Workspace</h2>
          <div className="form-row"><div className="field"><label>Nome</label><input className="input" value={context.workspace_name} readOnly /></div><div className="field"><label>Slug</label><input className="input" value={context.workspace_slug} readOnly /></div></div>
          <div className="divider"/>

          <h2 id="integrations">Infraestrutura</h2>
          <div className="premium-integration-list">
            <div className="premium-integration-item"><div className="activity-icon"><Database size={15}/></div><div><strong>Neon Postgres</strong><small>Base de dados e faturação ligadas</small></div><CheckCircle2 size={17} color="var(--green)"/></div>
            <div className="premium-integration-item"><div className="activity-icon"><Server size={15}/></div><div><strong>Vercel / Next.js</strong><small>Produção serverless ativa</small></div><CheckCircle2 size={17} color="var(--green)"/></div>
            <div className="premium-integration-item"><div className="activity-icon"><KeyRound size={15}/></div><div><strong>Gateway de IA</strong><small>{gatewayReady ? "Variáveis configuradas" : "Modo demonstração — falta configurar o gateway"}</small></div>{gatewayReady ? <CheckCircle2 size={17} color="var(--green)"/> : <CircleAlert size={17} color="var(--yellow)"/>}</div>
          </div>
          <div className="divider"/>

          <div className="billing-section-heading"><div><h2 id="billing">Plano e faturação</h2><p>Consulta limites, renovações e cancelamento.</p></div><Link className="button button-secondary button-sm" href="/dashboard/plans">Comparar planos</Link></div>
          <div className="current-subscription-card">
            <div className="current-subscription-icon"><Crown size={23}/></div>
            <div className="current-subscription-main">
              <span>Plano atual</span>
              <h3>{PLAN_LABELS[context.plan_key]}</h3>
              <p>{plan.credits.toLocaleString("pt-PT")} créditos · {plan.brands} · {plan.seats}</p>
            </div>
            <div className="subscription-status-block">
              <span className={`subscription-status ${subscription?.cancel_at_period_end ? "warning" : "active"}`}>{subscription?.cancel_at_period_end ? "Cancelamento agendado" : "Ativo"}</span>
              <small>{renewalDate ? `${subscription?.cancel_at_period_end ? "Termina" : "Renova"} a ${renewalDate}` : "Plano permanente"}</small>
            </div>
          </div>

          {context.plan_key === "free" ? (
            <div className="free-upgrade-banner"><div><CreditCard size={20}/><span><strong>Leva o workspace para o próximo nível</strong><small>O Starter inclui 3.000 créditos, cinco marcas e relatórios.</small></span></div><Link className="button button-primary" href="/dashboard/checkout?plan=starter&cycle=annual">Fazer upgrade</Link></div>
          ) : (
            <CancelPlanButton />
          )}

          <div className="divider"/>
          <form action="/api/auth/logout" method="post"><button className="button button-danger" type="submit">Terminar sessão</button></form>
        </section>
      </div>
    </div>
  );
}
