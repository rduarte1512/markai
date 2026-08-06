import { CheckCircle2, CircleAlert, Database, KeyRound, Server } from "lucide-react";
import { requireAppContext } from "@/lib/auth";
import { PLAN_LABELS } from "@/lib/constants";

export const metadata = { title: "Definições" };

export default async function SettingsPage() {
  const context = await requireAppContext();
  const gatewayReady = Boolean(process.env.AI_GATEWAY_BASE_URL && process.env.AI_GATEWAY_API_KEY);

  return (
    <>
      <div className="page-heading"><div><h1>Definições</h1><p>Workspace, integrações e estado da infraestrutura.</p></div></div>
      <div className="settings-grid">
        <nav className="settings-menu"><a className="active" href="#workspace">Workspace</a><a href="#integrations">Integrações</a><a href="#billing">Plano</a></nav>
        <section className="settings-content">
          <h2 id="workspace">Workspace</h2>
          <div className="form-row"><div className="field"><label>Nome</label><input className="input" value={context.workspace_name} readOnly /></div><div className="field"><label>Slug</label><input className="input" value={context.workspace_slug} readOnly /></div></div>
          <div className="divider"/>
          <h2 id="integrations">Infraestrutura</h2>
          <div className="activity-list" style={{border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginTop: 14}}>
            <div className="activity-item"><div className="activity-icon"><Database size={15}/></div><div><strong>Neon Postgres</strong><small>Ligação à base de dados configurada</small></div><CheckCircle2 size={17} color="var(--green)"/></div>
            <div className="activity-item"><div className="activity-icon"><Server size={15}/></div><div><strong>Vercel / Next.js</strong><small>Aplicação pronta para deploy serverless</small></div><CheckCircle2 size={17} color="var(--green)"/></div>
            <div className="activity-item"><div className="activity-icon"><KeyRound size={15}/></div><div><strong>Gateway de IA</strong><small>{gatewayReady ? "Variáveis configuradas" : "Modo demonstração — adiciona as variáveis na Vercel"}</small></div>{gatewayReady ? <CheckCircle2 size={17} color="var(--green)"/> : <CircleAlert size={17} color="var(--yellow)"/>}</div>
          </div>
          <div className="divider"/>
          <h2 id="billing">Plano</h2><p className="muted">Plano atual: <strong>{PLAN_LABELS[context.plan_key]}</strong>. O checkout será ligado no módulo de subscrições.</p>
          <form action="/api/auth/logout" method="post" style={{marginTop: 20}}><button className="button button-danger" type="submit">Terminar sessão</button></form>
        </section>
      </div>
    </>
  );
}
