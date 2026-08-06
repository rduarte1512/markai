import { Coins, LockKeyhole, Sparkles } from "lucide-react";
import { requireAppContext } from "@/lib/auth";
import { getCreditHistory, getModels } from "@/lib/data";
import { CONSUMPTION_LABELS, PLAN_LABELS } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata = { title: "Créditos" };

export default async function CreditsPage() {
  const context = await requireAppContext();
  const [models, history] = await Promise.all([getModels(context.workspace_id), getCreditHistory(context.workspace_id)]);
  const total = Number(context.monthly_balance) + Number(context.extra_balance);

  return (
    <>
      <div className="page-heading">
        <div><h1>Créditos e modelos</h1><p>Controla custos, limites e consumo por operação.</p></div>
        <button className="button button-primary" type="button"><Coins size={16}/> Comprar créditos</button>
      </div>

      <section className="stats-grid" style={{gridTemplateColumns: "repeat(3, 1fr)"}}>
        <article className="stat-card"><div className="stat-card-top"><span>Saldo total</span><span className="stat-icon"><Coins size={16}/></span></div><div className="stat-value">{formatNumber(total)}</div><div className="stat-change">{context.monthly_balance} mensais + {context.extra_balance} extra</div></article>
        <article className="stat-card"><div className="stat-card-top"><span>Plano atual</span><span className="stat-icon"><Sparkles size={16}/></span></div><div className="stat-value">{PLAN_LABELS[context.plan_key]}</div><div className="stat-change">{context.monthly_allowance} créditos por mês</div></article>
        <article className="stat-card"><div className="stat-card-top"><span>Renovação</span><span className="stat-icon"><Coins size={16}/></span></div><div className="stat-value" style={{fontSize: 21}}>{formatDate(context.period_end)}</div><div className="stat-change">Créditos extra não expiram no MVP</div></article>
      </section>

      <section className="brand-grid" style={{marginTop: 14}}>
        {models.map((model) => (
          <article className="brand-card" key={model.key}>
            <div className="brand-card-top"><div className="brand-avatar" style={{background: "linear-gradient(135deg, #312e81, #7c3aed)"}}>{model.credit_cost}</div><span className={`badge ${model.available ? "badge-green" : "badge-yellow"}`}>{model.available ? "Disponível" : "Bloqueado"}</span></div>
            <h3>{model.display_name}</h3>
            <p>{model.description}</p>
            <div className="brand-card-footer"><span>{CONSUMPTION_LABELS[model.consumption_group]} · {model.credit_cost} cr.</span><span>{model.available ? `${model.monthly_requests_used}/${model.monthly_request_limit}` : <LockKeyhole size={13}/>}</span></div>
          </article>
        ))}
      </section>

      <section className="card" style={{marginTop: 14}}>
        <div className="card-header"><div><h2>Histórico de movimentos</h2><p>Últimas 50 entradas do workspace</p></div></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Data</th><th>Operação</th><th>Marca</th><th>Modelo</th><th>Movimento</th><th>Saldo</th></tr></thead>
            <tbody>
              {history.map((item) => <tr key={item.id}><td>{formatDate(item.created_at)}</td><td>{item.operation.replaceAll("_", " ")}</td><td>{item.brand_name || "Workspace"}</td><td>{item.model_name || "—"}</td><td className={item.credits_delta >= 0 ? "credit-positive" : "credit-negative"}>{item.credits_delta > 0 ? "+" : ""}{item.credits_delta}</td><td>{item.balance_after}</td></tr>)}
              {!history.length && <tr><td colSpan={6} style={{textAlign: "center", padding: 30}}>Ainda não existem movimentos.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
