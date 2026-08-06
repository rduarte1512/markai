import Link from "next/link";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, BrainCircuit,
  CalendarClock, CheckCircle2, CircleDollarSign, Coins, Gauge, Layers3,
  LockKeyhole, ShieldCheck, Sparkles, TrendingDown, TrendingUp, WalletCards,
  Zap,
} from "lucide-react";
import { requireAppContext } from "@/lib/auth";
import { getCreditHistory, getModels } from "@/lib/data";
import { CONSUMPTION_LABELS, PLAN_LABELS } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/format";
import { getPlan } from "@/lib/plans";

export const metadata = { title: "Créditos" };

export default async function CreditsPage() {
  const context = await requireAppContext();
  const [models, history] = await Promise.all([getModels(context.workspace_id), getCreditHistory(context.workspace_id)]);
  const total = Number(context.monthly_balance) + Number(context.extra_balance);
  const allowance = Number(context.monthly_allowance);
  const used = Math.max(0, allowance - Number(context.monthly_balance));
  const usedPercentage = allowance > 0 ? Math.min(100, Math.round((used / allowance) * 100)) : 0;
  const usageEntries = history.filter((item) => item.credits_delta < 0);
  const spent = usageEntries.reduce((sum, item) => sum + Math.abs(Number(item.credits_delta)), 0);
  const averageCost = usageEntries.length ? Math.max(1, Math.round(spent / usageEntries.length)) : 0;
  const plan = getPlan(context.plan_key);
  const availableModels = models.filter((model) => model.available).length;
  const renewal = new Date(context.period_end);
  const daysRemaining = Math.max(1, Math.ceil((renewal.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const dailyBudget = Math.max(0, Math.floor(total / daysRemaining));

  return (
    <div className="credits-v2">
      <section className="studio-hero credits-hero">
        <div>
          <span className="studio-kicker"><WalletCards size={14}/> AI cost control</span>
          <h1>Transforma créditos em produção previsível.</h1>
          <p>Acompanha o saldo, percebe onde está a ser consumido e escolhe o modelo certo para cada nível de trabalho.</p>
          <div className="studio-hero-actions"><Link className="button button-primary" href="/dashboard/plans"><Sparkles size={16}/> Aumentar capacidade</Link><button className="button button-secondary"><Coins size={16}/> Comprar créditos extra</button></div>
        </div>
        <div className="credits-balance-visual">
          <div className="credit-ring" style={{ "--credit-progress": `${usedPercentage * 3.6}deg` } as React.CSSProperties}><span><small>Disponível</small><strong>{formatNumber(total)}</strong><em>créditos</em></span></div>
          <div><span><i className="monthly"/>{formatNumber(context.monthly_balance)} mensais</span><span><i className="extra"/>{formatNumber(context.extra_balance)} extra</span><small>Renovação em {daysRemaining} dias</small></div>
        </div>
      </section>

      <section className="studio-metrics-grid credits-metrics">
        <article><span className="metric-icon violet"><Gauge size={18}/></span><div><small>Utilização mensal</small><strong>{usedPercentage}%</strong><em>{formatNumber(used)} de {formatNumber(allowance)} créditos</em></div></article>
        <article><span className="metric-icon cyan"><CircleDollarSign size={18}/></span><div><small>Custo médio</small><strong>{averageCost || "—"}</strong><em>créditos por operação</em></div></article>
        <article><span className="metric-icon green"><BrainCircuit size={18}/></span><div><small>Modelos disponíveis</small><strong>{availableModels}/{models.length}</strong><em>no plano {PLAN_LABELS[context.plan_key]}</em></div></article>
        <article><span className="metric-icon gold"><CalendarClock size={18}/></span><div><small>Orçamento diário</small><strong>{dailyBudget}</strong><em>para durar até à renovação</em></div></article>
      </section>

      <section className="credit-control-grid">
        <article className="credit-usage-card">
          <header><div><span className="studio-kicker"><BarChart3 size={13}/> Consumo mensal</span><h2>Ritmo de utilização</h2></div><span className={`usage-health ${usedPercentage > 75 ? "warning" : "healthy"}`}>{usedPercentage > 75 ? <TrendingUp size={14}/> : <CheckCircle2 size={14}/>} {usedPercentage > 75 ? "Consumo elevado" : "Dentro do previsto"}</span></header>
          <div className="usage-chart">
            {[18, 28, 22, 46, 35, 62, 49, 74, 57, Math.max(20, usedPercentage)].map((height, index) => <div key={index}><span style={{height: `${height}%`}}/><small>{index % 2 === 0 ? index + 1 : ""}</small></div>)}
          </div>
          <div className="usage-chart-footer"><span><i/>Utilização acumulada</span><strong>{formatNumber(spent)} créditos em {usageEntries.length} operações</strong></div>
        </article>

        <article className="plan-capacity-card">
          <header><span className="plan-capacity-icon"><Sparkles size={21}/></span><div><small>Plano atual</small><h2>{PLAN_LABELS[context.plan_key]}</h2></div><span className="status-pill published">Ativo</span></header>
          <div className="plan-capacity-stats"><div><span>Créditos/mês</span><strong>{formatNumber(plan.credits)}</strong></div><div><span>Marcas</span><strong>{plan.brands}</strong></div><div><span>Equipa</span><strong>{plan.seats}</strong></div></div>
          <div className="plan-capacity-progress"><div><span>Capacidade usada</span><strong>{usedPercentage}%</strong></div><div className="progress"><div style={{width: `${usedPercentage}%`}}/></div></div>
          <p>{context.plan_key === "free" ? "O Starter desbloqueia 50× mais créditos, mais marcas e relatórios completos." : usedPercentage > 65 ? "O teu ritmo atual pode beneficiar do próximo plano antes da renovação." : "O plano está ajustado ao ritmo atual do workspace."}</p>
          <Link href="/dashboard/plans">Comparar capacidade <ArrowRight size={14}/></Link>
        </article>
      </section>

      <section className="model-marketplace-section">
        <div className="section-title-row"><div><span className="studio-kicker"><Layers3 size={13}/> Model marketplace</span><h2>Escolhe o motor certo para cada trabalho.</h2><p>Compara custo, disponibilidade e limite mensal sem sair da operação.</p></div><div className="model-legend"><span><i className="fast"/>Económico</span><span><i className="balanced"/>Equilibrado</span><span><i className="premium"/>Premium</span></div></div>
        <div className="model-catalog-grid">
          {models.map((model, index) => {
            const percentage = model.monthly_request_limit > 0 ? Math.min(100, Math.round((model.monthly_requests_used / model.monthly_request_limit) * 100)) : 0;
            return (
              <article className={`model-catalog-card ${model.available ? "" : "locked"}`} key={model.key}>
                <header><span className={`model-logo model-${index % 4}`}><BrainCircuit size={18}/></span><div><h3>{model.display_name}</h3><small>{CONSUMPTION_LABELS[model.consumption_group]} consumo</small></div>{model.available ? <span className="model-status"><CheckCircle2 size={13}/> Disponível</span> : <span className="model-status locked"><LockKeyhole size={13}/> Bloqueado</span>}</header>
                <p>{model.description}</p>
                <div className="model-price-row"><span><Zap size={14}/><strong>{model.credit_cost}</strong> cr. / operação</span><span>{model.monthly_requests_used}/{model.monthly_request_limit || "—"}</span></div>
                <div className="mini-progress"><i style={{width: `${percentage}%`}}/></div>
                <footer><span>{model.available ? `${Math.max(0, model.monthly_request_limit - model.monthly_requests_used)} pedidos restantes` : "Disponível num plano superior"}</span>{!model.available && <Link href="/dashboard/plans">Desbloquear <ArrowRight size={13}/></Link>}</footer>
              </article>
            );
          })}
        </div>
      </section>

      <section className="credit-history-card">
        <header><div><span className="studio-kicker"><ShieldCheck size={13}/> Ledger transparente</span><h2>Movimentos recentes</h2><p>Todos os consumos, compras e ajustes do workspace.</p></div><button className="button button-secondary button-sm">Exportar CSV</button></header>
        <div className="credit-activity-list">
          {history.map((item) => {
            const positive = Number(item.credits_delta) >= 0;
            return <article key={item.id}><span className={`activity-direction ${positive ? "positive" : "negative"}`}>{positive ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}</span><div className="activity-main"><strong>{item.operation.replaceAll("_", " ")}</strong><small>{item.brand_name || "Workspace"} · {item.model_name || "Sistema"}</small></div><div className="activity-date"><span>{formatDate(item.created_at)}</span><small>Saldo {formatNumber(item.balance_after)}</small></div><strong className={positive ? "credit-positive" : "credit-negative"}>{positive ? "+" : ""}{formatNumber(item.credits_delta)}</strong></article>;
          })}
          {!history.length && <div className="studio-empty-wide"><span><Coins size={24}/></span><h3>Ainda não existem movimentos.</h3><p>As utilizações de IA e compras de créditos aparecem aqui.</p></div>}
        </div>
      </section>
    </div>
  );
}
