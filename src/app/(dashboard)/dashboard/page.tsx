import Link from "next/link";
import { ArrowRight, Bot, BriefcaseBusiness, Coins, Megaphone, MousePointerClick, Plus, Sparkles } from "lucide-react";
import { requireAppContext } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const context = await requireAppContext();
  const { summary, activity, byModel } = await getDashboardStats(context.workspace_id);
  const maxCredits = Math.max(...byModel.map((item) => Number(item.credits)), 1);
  const totalBalance = Number(context.monthly_balance) + Number(context.extra_balance);

  const stats = [
    { label: "Marcas ativas", value: summary.brands, icon: BriefcaseBusiness, note: "Clientes no workspace" },
    { label: "Campanhas", value: summary.campaigns, icon: MousePointerClick, note: "Total criado" },
    { label: "Anúncios gerados", value: summary.ads, icon: Megaphone, note: "Variações guardadas" },
    { label: "Créditos disponíveis", value: totalBalance, icon: Coins, note: `${summary.credits_used} usados este mês` },
  ];

  return (
    <>
      <div className="page-heading">
        <div><h1>Olá, {context.user_name.split(" ")[0]} 👋</h1><p>Acompanha as marcas, campanhas e uso de IA da tua agência.</p></div>
        <div className="page-actions">
          <Link className="button button-secondary" href="/dashboard/brands/new"><Plus size={16}/> Nova marca</Link>
          <Link className="button button-primary" href="/dashboard/ads"><Sparkles size={16}/> Criar anúncio</Link>
        </div>
      </div>

      <section className="stats-grid">
        {stats.map(({label, value, icon: Icon, note}) => (
          <article className="stat-card" key={label}>
            <div className="stat-card-top"><span>{label}</span><span className="stat-icon"><Icon size={16}/></span></div>
            <div className="stat-value">{formatNumber(Number(value))}</div>
            <div className="stat-change">{note}</div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="card">
          <div className="card-header"><div><h2>Consumo por modelo</h2><p>Créditos usados no mês atual</p></div><Link className="button button-ghost button-sm" href="/dashboard/credits">Ver detalhes <ArrowRight size={14}/></Link></div>
          <div className="card-body">
            {byModel.length ? (
              <div className="usage-chart">
                {byModel.map((item) => (
                  <div className="usage-column" key={item.label}>
                    <div className="usage-bar-wrap"><div className="usage-bar" style={{height: `${Math.max(5, (Number(item.credits) / maxCredits) * 100)}%`}}><span>{item.credits}</span></div></div>
                    <label title={item.label}>{item.label}</label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><div className="empty-icon"><Coins size={22}/></div><h3>Ainda sem consumo</h3><p>As utilizações dos modelos aparecem aqui depois da primeira geração.</p></div>
            )}
          </div>
        </article>

        <article className="card">
          <div className="card-header"><div><h2>Atividade recente</h2><p>Últimas ações com créditos</p></div></div>
          {activity.length ? (
            <div className="activity-list">
              {activity.map((item) => (
                <div className="activity-item" key={item.id}>
                  <div className="activity-icon"><Bot size={15}/></div>
                  <div><strong>{item.model_name || item.operation}</strong><small>{item.brand_name || "Workspace"} · {formatDate(item.created_at)}</small></div>
                  <span className="activity-value">{item.credits_delta}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><div className="empty-icon"><Bot size={22}/></div><h3>Pronto para começar</h3><p>Adiciona uma marca ou abre o agente de marketing.</p><Link className="button button-primary button-sm" href="/dashboard/copilot">Abrir agente</Link></div>
          )}
        </article>
      </section>
    </>
  );
}
