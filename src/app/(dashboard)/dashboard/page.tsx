import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  Coins,
  Crown,
  Megaphone,
  MousePointerClick,
  Plus,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { requireAppContext } from "@/lib/auth";
import { PLAN_LABELS } from "@/lib/constants";
import { getDashboardStats } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const context = await requireAppContext();
  const { summary, activity, byModel } = await getDashboardStats(context.workspace_id);
  const maxCredits = Math.max(...byModel.map((item) => Number(item.credits)), 1);
  const totalBalance = Number(context.monthly_balance) + Number(context.extra_balance);
  const usagePercent = context.monthly_allowance > 0
    ? Math.min(100, Math.round((summary.credits_used / Number(context.monthly_allowance)) * 100))
    : 0;
  const remainingPercent = Math.max(0, 100 - usagePercent);

  const stats = [
    {
      label: "Marcas ativas",
      value: summary.brands,
      icon: BriefcaseBusiness,
      note: "Clientes ativos no workspace",
      accent: "violet",
    },
    {
      label: "Campanhas",
      value: summary.campaigns,
      icon: MousePointerClick,
      note: "Campanhas criadas até agora",
      accent: "cyan",
    },
    {
      label: "Anúncios gerados",
      value: summary.ads,
      icon: Megaphone,
      note: "Variações guardadas na biblioteca",
      accent: "amber",
    },
    {
      label: "Créditos disponíveis",
      value: totalBalance,
      icon: Coins,
      note: `${summary.credits_used} usados neste mês`,
      accent: "green",
    },
  ];

  const quickActions = [
    {
      title: "Criar campanha com IA",
      description: "Abre o Ads Studio e gera novas variações com o Brand Kit ativo.",
      href: "/dashboard/ads",
      icon: Sparkles,
      button: "Abrir Studio",
    },
    {
      title: "Validar estratégia",
      description: "Usa o Agente de Marketing para obter sugestões, melhorias e próximos passos.",
      href: "/dashboard/copilot",
      icon: Bot,
      button: "Falar com o agente",
    },
    {
      title: "Planeamento de conteúdo",
      description: "Organiza ideias, revisão e calendário editorial para a tua marca.",
      href: "/dashboard/content",
      icon: CalendarClock,
      button: "Abrir calendário",
    },
  ];

  return (
    <>
      <section className="dashboard-hero card premium-hero">
        <div className="premium-hero-copy">
          <div className="dashboard-kicker">
            <span className="dashboard-kicker-dot" />
            Command center da tua agência
          </div>
          <h1>Olá, {context.user_name.split(" ")[0]} 👋</h1>
          <p>
            Acompanha marcas, produção e consumo de IA num painel mais claro, robusto e pronto para crescer.
          </p>
          <div className="premium-hero-actions page-actions">
            <Link className="button button-secondary" href="/dashboard/brands/new">
              <Plus size={18} /> Nova marca
            </Link>
            <Link className="button button-primary" href="/dashboard/ads">
              <Sparkles size={18} /> Criar anúncio
            </Link>
          </div>
        </div>

        <div className="premium-hero-panel">
          <div className="premium-plan-card">
            <div className="premium-plan-top">
              <div>
                <span className="mini-label">Plano atual</span>
                <strong>{PLAN_LABELS[context.plan_key]}</strong>
              </div>
              <span className="premium-plan-icon"><Crown size={18} /></span>
            </div>
            <div className="plan-progress-row">
              <div>
                <span className="mini-label">Créditos mensais</span>
                <strong>{formatNumber(context.monthly_allowance)}</strong>
              </div>
              <div>
                <span className="mini-label">Saldo restante</span>
                <strong>{formatNumber(totalBalance)}</strong>
              </div>
            </div>
            <div className="progress-shell">
              <div className="progress-track">
                <span style={{ width: `${remainingPercent}%` }} />
              </div>
              <div className="progress-meta">
                <span>{summary.credits_used} usados</span>
                <span>{remainingPercent}% disponível</span>
              </div>
            </div>
            <div className="plan-mini-stats">
              <div>
                <span className="mini-label">Renovação</span>
                <strong>{formatDate(context.period_end)}</strong>
              </div>
              <div>
                <span className="mini-label">Ritmo</span>
                <strong>{summary.credits_used > 0 ? "Ativo" : "Sem uso"}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid premium-stats-grid">
        {stats.map(({ label, value, icon: Icon, note, accent }) => (
          <article className={`stat-card premium-stat-card accent-${accent}`} key={label}>
            <div className="stat-card-top">
              <span>{label}</span>
              <span className="stat-icon"><Icon size={17} /></span>
            </div>
            <div className="stat-value">{formatNumber(Number(value))}</div>
            <div className="stat-change">{note}</div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid dashboard-grid-premium">
        <article className="card premium-card chart-card-wide">
          <div className="card-header premium-card-header">
            <div>
              <h2>Consumo por modelo</h2>
              <p>Visão mensal dos modelos que mais estão a ser usados.</p>
            </div>
            <Link className="button button-ghost button-sm" href="/dashboard/credits">
              Ver detalhes <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-body">
            {byModel.length ? (
              <div className="usage-chart premium-usage-chart">
                {byModel.map((item) => (
                  <div className="usage-column" key={item.label}>
                    <div className="usage-bar-wrap">
                      <div
                        className="usage-bar"
                        style={{ height: `${Math.max(8, (Number(item.credits) / maxCredits) * 100)}%` }}
                      >
                        <span>{item.credits}</span>
                      </div>
                    </div>
                    <label title={item.label}>{item.label}</label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon"><Coins size={24} /></div>
                <h3>Ainda sem consumo</h3>
                <p>As utilizações dos modelos aparecem aqui depois da primeira geração.</p>
              </div>
            )}
          </div>
        </article>

        <article className="card premium-card">
          <div className="card-header premium-card-header">
            <div>
              <h2>Atividade recente</h2>
              <p>Últimas ações ligadas ao uso de créditos.</p>
            </div>
          </div>
          {activity.length ? (
            <div className="activity-list premium-activity-list">
              {activity.map((item) => (
                <div className="activity-item" key={item.id}>
                  <div className="activity-icon"><Bot size={16} /></div>
                  <div>
                    <strong>{item.model_name || item.operation}</strong>
                    <small>{item.brand_name || "Workspace"} · {formatDate(item.created_at)}</small>
                  </div>
                  <span className="activity-value">{item.credits_delta}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><Bot size={24} /></div>
              <h3>Pronto para começar</h3>
              <p>Adiciona uma marca ou abre o agente de marketing.</p>
              <Link className="button button-primary button-sm" href="/dashboard/copilot">Abrir agente</Link>
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-lower-grid">
        <article className="card premium-card insights-card">
          <div className="card-header premium-card-header">
            <div>
              <h2>Ritmo do workspace</h2>
              <p>Resumo rápido do estado atual da operação.</p>
            </div>
          </div>
          <div className="insights-grid">
            <div className="insight-tile">
              <span className="insight-icon"><TrendingUp size={17} /></span>
              <div>
                <strong>{usagePercent}% do plano usado</strong>
                <p>Controla o consumo antes de esgotar os créditos do mês.</p>
              </div>
            </div>
            <div className="insight-tile">
              <span className="insight-icon"><Zap size={17} /></span>
              <div>
                <strong>{summary.ads || 0} anúncios gerados</strong>
                <p>Usa o Ads Studio para acelerar testes criativos e copy.</p>
              </div>
            </div>
            <div className="insight-tile">
              <span className="insight-icon"><BriefcaseBusiness size={17} /></span>
              <div>
                <strong>{summary.brands || 0} marcas em gestão</strong>
                <p>Mantém cada Brand Kit organizado para ganhar consistência.</p>
              </div>
            </div>
          </div>
        </article>

        <article className="card premium-card quick-actions-card">
          <div className="card-header premium-card-header">
            <div>
              <h2>Ações rápidas</h2>
              <p>Atalhos para as tarefas mais importantes do dia.</p>
            </div>
          </div>
          <div className="quick-actions-list">
            {quickActions.map(({ title, description, href, icon: Icon, button }) => (
              <div className="quick-action-item" key={title}>
                <span className="quick-action-icon"><Icon size={18} /></span>
                <div className="quick-action-copy">
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
                <Link className="button button-secondary button-sm" href={href}>{button}</Link>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
