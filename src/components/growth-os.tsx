"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity, ArrowRight, BarChart3, Bot, CalendarClock, CheckCircle2, ClipboardCheck,
  Copy, ExternalLink, FileBarChart, Gauge, Globe2, LoaderCircle, LockKeyhole,
  Megaphone, MousePointerClick, Play, Plus, RefreshCw, Rocket, Search, Send,
  Share2, Sparkles, Target, TrendingDown, TrendingUp, Users, WandSparkles,
  Workflow, Zap,
} from "lucide-react";
import type { PlanKey } from "@/lib/types";
import type { GrowthAccess, GrowthFeatureKey } from "@/lib/feature-access";
import { PLAN_LABELS } from "@/lib/constants";
import styles from "./growth-os.module.css";

type Brand = { id: string; name: string; industry?: string; website?: string; primary_color?: string; secondary_color?: string };
type Campaign = { id: string; brand_id: string; brand_name: string; name: string; objective?: string; channel?: string; status: string; budget?: string | number | null; start_date?: string | null; end_date?: string | null; strategy?: Record<string, unknown>; ad_count?: number; updated_at?: string };
type Snapshot = { id: string; campaign_id: string; provider: string; spend: string | number; impressions: string | number; clicks: string | number; conversions: string | number; revenue: string | number; created_at: string };
type Publication = { id: string; brand_id: string; brand_name: string; content_item_id?: string; content_title?: string; provider: string; status: string; scheduled_for?: string; published_at?: string; external_url?: string; error_message?: string; created_at: string };
type PortalLink = { id: string; brand_id: string; brand_name: string; token: string; label?: string; expires_at?: string; active: boolean; created_at: string };
type Report = { id: string; brand_id: string; brand_name: string; title: string; period_start?: string; period_end?: string; metrics?: Record<string, unknown>; ai_insights?: string; status: string; created_at: string };
type Funnel = { id: string; brand_id: string; brand_name: string; name: string; status: string; settings?: Record<string, unknown>; step_count: number; updated_at?: string };
type FunnelEvent = { funnel_id: string; step_id?: string; step_title?: string; position?: number; event_type: string; variant_key: string; event_count: number; total_value: string | number };
type Automation = { id: string; brand_id?: string; brand_name?: string; name: string; trigger_key: string; trigger_config?: Record<string, unknown>; action_key: string; action_config?: Record<string, unknown>; enabled: boolean; last_run_at?: string; last_result?: Record<string, unknown> };
type Audit = { id: string; brand_id: string; brand_name: string; url: string; keywords?: string[]; seo_score: number; geo_score: number; metrics?: Record<string, unknown>; insights?: string; status: string; created_at: string };
type ContentItem = { id: string; brand_id: string; brand_name: string; title: string; content_type: string; channel?: string; status: string; scheduled_for?: string };
type Integration = { provider: string; account_label?: string; status: string; metadata?: Record<string, unknown> };
type Approval = { id: string; brand_id: string; brand_name: string; entity_type: string; entity_id: string; status: string; client_name?: string; client_note?: string; decided_at?: string; created_at: string };

type GrowthData = {
  brands: Brand[];
  campaigns: Campaign[];
  snapshots: Snapshot[];
  publications: Publication[];
  portalLinks: PortalLink[];
  reports: Report[];
  funnels: Funnel[];
  funnelEvents: FunnelEvent[];
  automations: Automation[];
  audits: Audit[];
  content: ContentItem[];
  integrations: Integration[];
  approvals: Approval[];
};

type TabKey = "performance" | "campaigns" | "publisher" | "clients" | "reports" | "funnels" | "automations" | "search";

const tabs: Array<{ key: TabKey; label: string; icon: typeof Activity; feature: GrowthFeatureKey; beta?: boolean }> = [
  { key: "performance", label: "Performance", icon: Activity, feature: "performance" },
  { key: "campaigns", label: "Campaigns", icon: Rocket, feature: "campaigns" },
  { key: "publisher", label: "Publisher", icon: Send, feature: "publisher" },
  { key: "clients", label: "Clientes", icon: Users, feature: "clientPortal" },
  { key: "reports", label: "Reports", icon: FileBarChart, feature: "reports" },
  { key: "funnels", label: "Funnel Analytics", icon: Workflow, feature: "funnelAnalytics" },
  { key: "automations", label: "Automations", icon: Zap, feature: "automations" },
  { key: "search", label: "Search Intelligence", icon: Search, feature: "searchIntelligence", beta: true },
];

function number(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(number(value));
}

function compact(value: unknown) {
  return new Intl.NumberFormat("pt-PT", { notation: "compact", maximumFractionDigits: 1 }).format(number(value));
}

function date(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    draft: "Rascunho", active: "Ativa", paused: "Pausada", completed: "Concluída",
    scheduled: "Agendado", ready: "Pronto", publishing: "A publicar", published: "Publicado",
    failed: "Falhou", pending: "Pendente", approved: "Aprovado", changes_requested: "Alterações pedidas",
  };
  return labels[value] || value;
}

function LockPanel({ access, feature, children }: { access: GrowthAccess; feature: GrowthFeatureKey; children: React.ReactNode }) {
  const rule = access[feature];
  if (rule.enabled) return children;
  return (
    <section className={styles.locked}>
      <LockKeyhole size={28} />
      <h3>Funcionalidade reservada aos planos pagos</h3>
      <p>{rule.label}. Faz upgrade para ativar este módulo no workspace.</p>
      <Link href="/dashboard/plans">Comparar planos <ArrowRight size={15} /></Link>
    </section>
  );
}

export function GrowthOS({ data, plan, access, initialTab }: { data: GrowthData; plan: PlanKey; access: GrowthAccess; initialTab: string }) {
  const router = useRouter();
  const validInitial = tabs.some((item) => item.key === initialTab) ? initialTab as TabKey : "performance";
  const [tab, setTab] = useState<TabKey>(validInitial);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [campaignId, setCampaignId] = useState(data.campaigns[0]?.id || "");
  const [funnelId, setFunnelId] = useState(data.funnels[0]?.id || "");

  const performance = useMemo(() => {
    const byCampaign = new Map<string, { spend: number; impressions: number; clicks: number; conversions: number; revenue: number; snapshots: number }>();
    for (const snap of data.snapshots) {
      const current = byCampaign.get(snap.campaign_id) || { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, snapshots: 0 };
      current.spend += number(snap.spend);
      current.impressions += number(snap.impressions);
      current.clicks += number(snap.clicks);
      current.conversions += number(snap.conversions);
      current.revenue += number(snap.revenue);
      current.snapshots += 1;
      byCampaign.set(snap.campaign_id, current);
    }
    const total = [...byCampaign.values()].reduce((acc, item) => ({
      spend: acc.spend + item.spend,
      impressions: acc.impressions + item.impressions,
      clicks: acc.clicks + item.clicks,
      conversions: acc.conversions + item.conversions,
      revenue: acc.revenue + item.revenue,
    }), { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 });
    return { byCampaign, total };
  }, [data.snapshots]);

  const totalRoas = performance.total.spend > 0 ? performance.total.revenue / performance.total.spend : 0;
  const totalCpa = performance.total.conversions > 0 ? performance.total.spend / performance.total.conversions : 0;
  const totalCtr = performance.total.impressions > 0 ? performance.total.clicks / performance.total.impressions * 100 : 0;
  const currentRule = tabs.find((item) => item.key === tab)!;

  async function action(module: string, payload: Record<string, unknown>, form?: HTMLFormElement) {
    setBusy(`${module}:${String(payload.action || "save")}`);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/growth/${module}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(body.error || "Não foi possível concluir a operação.");
      setNotice(body.message || "Alteração guardada.");
      form?.reset();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
    } finally {
      setBusy("");
    }
  }

  function submit(module: string, event: React.FormEvent<HTMLFormElement>, extra: Record<string, unknown> = {}) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    void action(module, { ...values, ...extra }, form);
  }

  async function copyPortal(token: string) {
    const url = `${window.location.origin}/portal/${token}`;
    await navigator.clipboard.writeText(url);
    setNotice("Link do portal copiado.");
  }

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}><Sparkles size={14} /> Growth operating system</span>
          <h1>Cria, publica, mede e melhora no mesmo ciclo.</h1>
          <p>Campanhas, performance, publicação, clientes, relatórios, funis e automações ligados ao contexto real de cada marca.</p>
          <div className={styles.heroBadges}>
            <span><CheckCircle2 size={14} /> Plano {PLAN_LABELS[plan]}</span>
            <span><Gauge size={14} /> Limites aplicados no backend</span>
            <span><Bot size={14} /> IA nos planos elegíveis</span>
          </div>
        </div>
        <div className={styles.heroMetrics}>
          <article><small>Spend acompanhado</small><strong>{money(performance.total.spend)}</strong><span>{data.snapshots.length} snapshots</span></article>
          <article><small>Revenue atribuído</small><strong>{money(performance.total.revenue)}</strong><span>ROAS {totalRoas.toFixed(2)}x</span></article>
          <article><small>Operação</small><strong>{data.campaigns.length + data.publications.length + data.reports.length}</strong><span>itens ligados ao Growth OS</span></article>
        </div>
      </section>

      <nav className={styles.tabs} aria-label="Módulos Growth OS">
        {tabs.map(({ key, label, icon: Icon, feature, beta }) => (
          <button className={tab === key ? styles.activeTab : ""} onClick={() => setTab(key)} key={key} type="button">
            <Icon size={16} /><span>{label}</span>{beta && <em>BETA</em>}{!access[feature].enabled && <LockKeyhole size={12} />}
          </button>
        ))}
      </nav>

      <div className={styles.limitBar}>
        <span><strong>{tabs.find((item) => item.key === tab)?.label}</strong> · {access[currentRule.feature].label}</span>
        {access[currentRule.feature].beta && <em>Beta — resultados podem evoluir</em>}
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {notice && <div className={styles.notice}><CheckCircle2 size={15} />{notice}</div>}

      {tab === "performance" && (
        <LockPanel access={access} feature="performance">
          <section className={styles.metricsGrid}>
            <article><span><TrendingUp size={18}/></span><small>ROAS global</small><strong>{totalRoas.toFixed(2)}x</strong><p>{performance.total.revenue ? `${money(performance.total.revenue)} em revenue` : "Adiciona o primeiro snapshot"}</p></article>
            <article><span><MousePointerClick size={18}/></span><small>CTR</small><strong>{totalCtr.toFixed(2)}%</strong><p>{compact(performance.total.clicks)} cliques em {compact(performance.total.impressions)} impressões</p></article>
            <article><span><Target size={18}/></span><small>CPA</small><strong>{money(totalCpa)}</strong><p>{compact(performance.total.conversions)} conversões acompanhadas</p></article>
            <article><span><Activity size={18}/></span><small>Janela do plano</small><strong>{access.performance.windowDays} dias</strong><p>{access.performance.ai ? "Insights inteligentes ativos" : "Análise essencial no Free"}</p></article>
          </section>

          <div className={styles.twoCol}>
            <section className={styles.panel}>
              <header><div><span>Performance intelligence</span><h2>Campanhas e retorno</h2></div><BarChart3 size={20}/></header>
              <div className={styles.campaignPerformanceList}>
                {data.campaigns.map((campaign) => {
                  const p = performance.byCampaign.get(campaign.id) || { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, snapshots: 0 };
                  const roas = p.spend ? p.revenue / p.spend : 0;
                  const cpa = p.conversions ? p.spend / p.conversions : 0;
                  return <article key={campaign.id}>
                    <div><span className={styles.dot}/><div><strong>{campaign.name}</strong><small>{campaign.brand_name} · {campaign.channel || "Multicanal"}</small></div></div>
                    <div className={styles.performanceNumbers}><span><small>Spend</small><strong>{money(p.spend)}</strong></span><span><small>ROAS</small><strong>{roas.toFixed(2)}x</strong></span><span><small>CPA</small><strong>{money(cpa)}</strong></span></div>
                    <em className={roas >= 3 ? styles.good : roas > 0 && roas < 1.5 ? styles.bad : ""}>{p.snapshots ? `${p.snapshots} snapshots` : "Sem dados"}</em>
                  </article>;
                })}
                {!data.campaigns.length && <Empty text="Cria uma campanha para começar a medir performance." />}
              </div>
            </section>

            <form className={styles.panel} onSubmit={(event) => submit("performance", event)}>
              <header><div><span>Importação rápida</span><h2>Adicionar snapshot</h2></div><Plus size={20}/></header>
              <p className={styles.help}>Regista dados de Meta, Google, TikTok, LinkedIn ou outra fonte. Nos planos pagos, o endpoint também aceita sincronização por conector.</p>
              <label>Campanha<select name="campaignId" value={campaignId} onChange={(e) => setCampaignId(e.target.value)} required><option value="">Selecionar</option>{data.campaigns.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <div className={styles.formGrid}><label>Fonte<select name="provider" defaultValue="manual"><option value="manual">Manual</option><option value="meta">Meta</option><option value="google_ads">Google Ads</option><option value="tiktok">TikTok</option><option value="linkedin">LinkedIn</option></select></label><label>Spend (€)<input name="spend" type="number" min="0" step="0.01" defaultValue="0" /></label><label>Impressões<input name="impressions" type="number" min="0" defaultValue="0" /></label><label>Cliques<input name="clicks" type="number" min="0" defaultValue="0" /></label><label>Conversões<input name="conversions" type="number" min="0" step="0.01" defaultValue="0" /></label><label>Revenue (€)<input name="revenue" type="number" min="0" step="0.01" defaultValue="0" /></label></div>
              <button className={styles.primary} disabled={busy.startsWith("performance")}><RefreshCw className={busy.startsWith("performance") ? styles.spin : ""} size={15}/>Guardar snapshot</button>
            </form>
          </div>
        </LockPanel>
      )}

      {tab === "campaigns" && (
        <LockPanel access={access} feature="campaigns">
          <div className={styles.twoCol}>
            <section className={styles.panel}>
              <header><div><span>Campaign OS</span><h2>Operação por campanha</h2></div><Rocket size={20}/></header>
              <div className={styles.cards}>
                {data.campaigns.map((campaign) => <article className={styles.campaignCard} key={campaign.id}>
                  <div className={styles.cardTop}><span className={styles.status}>{statusLabel(campaign.status)}</span><small>{campaign.brand_name}</small></div>
                  <h3>{campaign.name}</h3><p>{campaign.objective || "Objetivo por definir"}</p>
                  <div className={styles.cardStats}><span><small>Budget</small><strong>{campaign.budget ? money(campaign.budget) : "—"}</strong></span><span><small>Anúncios</small><strong>{campaign.ad_count || 0}</strong></span><span><small>Canal</small><strong>{campaign.channel || "Multi"}</strong></span></div>
                  <footer><span>{date(campaign.start_date)} → {date(campaign.end_date)}</span><Link href={`/dashboard/ads?brand=${campaign.brand_id}`}>Criar anúncios <ArrowRight size={13}/></Link></footer>
                </article>)}
                {!data.campaigns.length && <Empty text="Ainda não existem campanhas." />}
              </div>
            </section>

            <form className={styles.panel} onSubmit={(event) => submit("campaigns", event)}>
              <header><div><span>Nova campanha</span><h2>Centralizar estratégia</h2></div><Plus size={20}/></header>
              <label>Nome<input name="name" required placeholder="Ex.: Black Friday 2026" /></label>
              <label>Marca<select name="brandId" required><option value="">Selecionar</option>{data.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
              <div className={styles.formGrid}><label>Objetivo<select name="objective" defaultValue="sales"><option value="sales">Vendas</option><option value="leads">Leads</option><option value="traffic">Tráfego</option><option value="awareness">Awareness</option></select></label><label>Canal<select name="channel" defaultValue="multichannel"><option value="multichannel">Multicanal</option><option value="meta">Meta</option><option value="google">Google</option><option value="tiktok">TikTok</option><option value="linkedin">LinkedIn</option></select></label><label>Budget (€)<input name="budget" type="number" min="0" step="0.01" /></label><label>Início<input name="startDate" type="date" /></label><label>Fim<input name="endDate" type="date" /></label></div>
              <label>Estratégia<textarea name="strategy" placeholder="Oferta, público, mensagem, canais e KPI principal..." /></label>
              <button className={styles.primary} disabled={busy.startsWith("campaigns")}><Rocket size={15}/>Criar campanha</button>
            </form>
          </div>
        </LockPanel>
      )}

      {tab === "publisher" && (
        <LockPanel access={access} feature="publisher">
          <div className={styles.twoCol}>
            <section className={styles.panel}>
              <header><div><span>Social Publisher</span><h2>Fila multicanal</h2></div><Send size={20}/></header>
              <div className={styles.queue}>
                {data.publications.map((item) => <article key={item.id}><span className={styles.provider}>{item.provider.slice(0, 2).toUpperCase()}</span><div><strong>{item.content_title || "Conteúdo personalizado"}</strong><small>{item.brand_name} · {item.scheduled_for ? date(item.scheduled_for) : "Sem data"}</small></div><em className={item.status === "failed" ? styles.bad : item.status === "published" ? styles.good : ""}>{statusLabel(item.status)}</em>{item.external_url && <a href={item.external_url} target="_blank" rel="noreferrer"><ExternalLink size={13}/></a>}</article>)}
                {!data.publications.length && <Empty text="A fila de publicação está vazia." />}
              </div>
              <div className={styles.connectorStrip}><Share2 size={16}/><span><strong>{data.integrations.length} integrações configuradas</strong><small>{access.publisher.live ? "Publicação live disponível quando o conector da plataforma estiver configurado." : "O Free permite planear e testar a fila; publicação live requer plano pago."}</small></span></div>
            </section>

            <form className={styles.panel} onSubmit={(event) => submit("publisher", event)}>
              <header><div><span>Agendar</span><h2>Nova publicação</h2></div><CalendarClock size={20}/></header>
              <label>Conteúdo<select name="contentItemId" required><option value="">Selecionar conteúdo aprovado</option>{data.content.map((item) => <option key={item.id} value={item.id}>{item.brand_name} · {item.title}</option>)}</select></label>
              <div className={styles.formGrid}><label>Plataforma<select name="provider" defaultValue="instagram"><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="linkedin">LinkedIn</option><option value="tiktok">TikTok</option><option value="x">X</option><option value="youtube">YouTube</option></select></label><label>Data/hora<input name="scheduledFor" type="datetime-local" /></label></div>
              <label>Legenda/override<textarea name="caption" placeholder="Opcional — usa o corpo do conteúdo se ficar vazio." /></label>
              <div className={styles.buttonRow}><button className={styles.primary} name="mode" value="schedule" disabled={busy.startsWith("publisher")}><CalendarClock size={15}/>Agendar</button>{access.publisher.live && <button className={styles.secondary} type="button" disabled={busy.startsWith("publisher")} onClick={(event) => { const form = event.currentTarget.closest("form"); if (!form) return; const values = Object.fromEntries(new FormData(form).entries()); void action("publisher", { ...values, mode: "publish" }); }}><Send size={15}/>Publicar agora</button>}</div>
            </form>
          </div>
        </LockPanel>
      )}

      {tab === "clients" && (
        <LockPanel access={access} feature="clientPortal">
          <div className={styles.twoCol}>
            <section className={styles.panel}>
              <header><div><span>Client Portal</span><h2>Links e aprovações</h2></div><ClipboardCheck size={20}/></header>
              <div className={styles.portalList}>
                {data.portalLinks.map((item) => <article key={item.id}><div><span className={styles.brandAvatar}>{item.brand_name.slice(0,2).toUpperCase()}</span><div><strong>{item.label || item.brand_name}</strong><small>{item.active ? "Ativo" : "Desativado"} · criado {date(item.created_at)}</small></div></div><div><button onClick={() => void copyPortal(item.token)} type="button"><Copy size={14}/>Copiar</button><a href={`/portal/${item.token}`} target="_blank"><ExternalLink size={14}/></a></div></article>)}
                {!data.portalLinks.length && <Empty text="Ainda não existem portais de cliente." />}
              </div>
              <div className={styles.approvalSummary}><span><strong>{data.approvals.filter((item) => item.status === "pending").length}</strong><small>Pendentes</small></span><span><strong>{data.approvals.filter((item) => item.status === "approved").length}</strong><small>Aprovados</small></span><span><strong>{data.approvals.filter((item) => item.status === "changes_requested").length}</strong><small>Alterações</small></span></div>
            </section>

            <form className={styles.panel} onSubmit={(event) => submit("clients", event)}>
              <header><div><span>Novo acesso</span><h2>Criar portal</h2></div><Plus size={20}/></header>
              <label>Marca<select name="brandId" required><option value="">Selecionar</option>{data.brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}</select></label>
              <label>Nome do portal<input name="label" placeholder="Ex.: Área de aprovação — Cliente XPTO" /></label>
              <label>Expira em<input name="expiresAt" type="date" /></label>
              <p className={styles.help}>O cliente não precisa de conta. O link mostra campanhas, conteúdos, anúncios e relatórios da marca e permite aprovar ou pedir alterações.</p>
              <button className={styles.primary} disabled={busy.startsWith("clients")}><Share2 size={15}/>Criar link seguro</button>
            </form>
          </div>
        </LockPanel>
      )}

      {tab === "reports" && (
        <LockPanel access={access} feature="reports">
          <div className={styles.twoCol}>
            <section className={styles.panel}>
              <header><div><span>Reports</span><h2>Relatórios prontos para cliente</h2></div><FileBarChart size={20}/></header>
              <div className={styles.reportList}>{data.reports.map((report) => <article key={report.id}><div><strong>{report.title}</strong><small>{report.brand_name} · {date(report.period_start)} → {date(report.period_end)}</small></div><span className={styles.status}>{statusLabel(report.status)}</span>{report.ai_insights && <p>{report.ai_insights}</p>}</article>)}{!data.reports.length && <Empty text="Gera o primeiro relatório de performance." />}</div>
            </section>
            <form className={styles.panel} onSubmit={(event) => submit("reports", event)}>
              <header><div><span>{access.reports.ai ? "Relatório com IA" : "Relatório essencial"}</span><h2>Gerar relatório</h2></div><WandSparkles size={20}/></header>
              <label>Marca<select name="brandId" required><option value="">Selecionar</option>{data.brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}</select></label>
              <label>Título<input name="title" placeholder="Relatório mensal de performance" /></label>
              <div className={styles.formGrid}><label>Início<input name="periodStart" type="date" required /></label><label>Fim<input name="periodEnd" type="date" required /></label></div>
              <p className={styles.help}>{access.reports.ai ? "O MarkAI resume spend, revenue, ROAS, campanhas e funis e cria recomendações com o modelo económico do workspace." : "No Free é criado um resumo quantitativo sem geração avançada de IA."}</p>
              <button className={styles.primary} disabled={busy.startsWith("reports")}><Sparkles size={15}/>Gerar relatório</button>
            </form>
          </div>
        </LockPanel>
      )}

      {tab === "funnels" && (
        <LockPanel access={access} feature="funnelAnalytics">
          <section className={styles.panel}>
            <header><div><span>Funnel Analytics + A/B</span><h2>Onde a conversão está a cair</h2></div><Workflow size={20}/></header>
            <div className={styles.toolbar}><select value={funnelId} onChange={(event) => setFunnelId(event.target.value)}><option value="">Selecionar funil</option>{data.funnels.map((funnel) => <option value={funnel.id} key={funnel.id}>{funnel.brand_name} · {funnel.name}</option>)}</select><Link href="/dashboard/funnels">Abrir Funnel Builder <ArrowRight size={14}/></Link></div>
            <FunnelAnalytics funnelId={funnelId} funnels={data.funnels} events={data.funnelEvents} />
            {funnelId && <form className={styles.experimentForm} onSubmit={(event) => submit("funnels", event, { funnelId, action: "experiment" })}><div><strong>Novo teste A/B</strong><small>Guarda a configuração no funil e começa a separar eventos por variante.</small></div><input name="experimentName" placeholder="Ex.: Headline hero" required/><input name="variantB" placeholder="Nome da variante B" required/><input name="trafficB" type="number" min="10" max="90" defaultValue="50"/><button className={styles.secondary}><Play size={14}/>Ativar teste</button></form>}
          </section>
        </LockPanel>
      )}

      {tab === "automations" && (
        <LockPanel access={access} feature="automations">
          <div className={styles.twoCol}>
            <section className={styles.panel}>
              <header><div><span>AI Automations</span><h2>Regras ativas</h2></div><Zap size={20}/></header>
              <div className={styles.automationList}>{data.automations.map((rule) => <article key={rule.id}><span className={rule.enabled ? styles.automationOn : styles.automationOff}><i/></span><div><strong>{rule.name}</strong><small>{rule.brand_name || "Workspace"} · {rule.trigger_key} → {rule.action_key}</small>{rule.last_run_at && <em>Última execução: {date(rule.last_run_at)}</em>}</div><button type="button" disabled={busy.startsWith("automations")} onClick={() => void action("automations", { action: "run", ruleId: rule.id })}><Play size={13}/>Executar</button></article>)}{!data.automations.length && <Empty text="Ainda não existem automações." />}</div>
            </section>
            <form className={styles.panel} onSubmit={(event) => submit("automations", event)}>
              <header><div><span>Nova regra</span><h2>Quando isto acontecer…</h2></div><Bot size={20}/></header>
              <label>Nome<input name="name" required placeholder="Ex.: Avisar quando CPA sobe" /></label>
              <label>Marca<select name="brandId"><option value="">Todo o workspace</option>{data.brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}</select></label>
              <label>Trigger<select name="triggerKey" defaultValue="cpa_threshold"><option value="cpa_threshold">CPA acima do limite</option><option value="daily_summary">Resumo diário</option><option value="content_approved">Conteúdo aprovado</option><option value="funnel_dropoff">Drop-off elevado no funil</option></select></label>
              <label>Limite/valor<input name="threshold" type="number" step="0.01" placeholder="Ex.: 20" /></label>
              <label>Ação<select name="actionKey" defaultValue="create_decision"><option value="create_decision">Criar alerta/decisão</option><option value="create_report">Gerar relatório</option><option value="create_content_idea">Criar ideia de conteúdo</option><option value="clone_winning_ad">Criar draft do anúncio vencedor</option></select></label>
              <button className={styles.primary} disabled={busy.startsWith("automations")}><Zap size={15}/>Criar automação</button>
            </form>
          </div>
        </LockPanel>
      )}

      {tab === "search" && (
        <LockPanel access={access} feature="searchIntelligence">
          <div className={styles.twoCol}>
            <section className={styles.panel}>
              <header><div><span>Search Intelligence <b className={styles.beta}>BETA</b></span><h2>SEO + GEO readiness</h2></div><Globe2 size={20}/></header>
              <p className={styles.help}>Auditoria on-page real do URL e análise de preparação para motores de pesquisa e respostas de IA. A pontuação GEO mede readiness técnica e de conteúdo — não afirma posições reais em ChatGPT/Gemini/Perplexity.</p>
              <div className={styles.auditList}>{data.audits.map((audit) => <article key={audit.id}><div className={styles.scorePair}><span><strong>{audit.seo_score}</strong><small>SEO</small></span><span><strong>{audit.geo_score}</strong><small>GEO</small></span></div><div><strong>{audit.brand_name}</strong><a href={audit.url} target="_blank" rel="noreferrer">{audit.url}</a><small>{date(audit.created_at)}</small></div>{audit.insights && <p>{audit.insights}</p>}</article>)}{!data.audits.length && <Empty text="Ainda não existem auditorias Search Intelligence." />}</div>
            </section>
            <form className={styles.panel} onSubmit={(event) => submit("search", event)}>
              <header><div><span>Nova auditoria Beta</span><h2>Analisar página</h2></div><Search size={20}/></header>
              <label>Marca<select name="brandId" required><option value="">Selecionar</option>{data.brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}</select></label>
              <label>URL<input name="url" type="url" required placeholder="https://exemplo.com/pagina" /></label>
              <label>Keywords<textarea name="keywords" placeholder="marketing com IA, agência de marketing, automação…" /></label>
              <p className={styles.help}>{access.searchIntelligence.ai ? "O plano inclui recomendações geradas pelo motor de IA depois da auditoria técnica." : "O Free recebe a análise técnica essencial; recomendações avançadas com IA ficam nos planos pagos."}</p>
              <button className={styles.primary} disabled={busy.startsWith("search")}><Search size={15}/>Executar auditoria Beta</button>
            </form>
          </div>
        </LockPanel>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className={styles.empty}><Sparkles size={20}/><span>{text}</span></div>;
}

function FunnelAnalytics({ funnelId, funnels, events }: { funnelId: string; funnels: Funnel[]; events: FunnelEvent[] }) {
  const funnel = funnels.find((item) => item.id === funnelId);
  if (!funnel) return <Empty text="Seleciona um funil para analisar." />;
  const current = events.filter((item) => item.funnel_id === funnelId);
  if (!current.length) return <Empty text="Ainda não existem eventos neste funil. Usa /api/track/funnel nos passos publicados para começar a medir." />;

  const steps = new Map<string, { title: string; position: number; views: number; submits: number; purchases: number; value: number; variants: Record<string, number> }>();
  for (const event of current) {
    const key = event.step_id || `unknown-${event.position || 0}`;
    const row = steps.get(key) || { title: event.step_title || "Etapa", position: Number(event.position || 0), views: 0, submits: 0, purchases: 0, value: 0, variants: {} };
    const count = number(event.event_count);
    if (event.event_type === "view") row.views += count;
    if (["submit", "checkout"].includes(event.event_type)) row.submits += count;
    if (event.event_type === "purchase") { row.purchases += count; row.value += number(event.total_value); }
    row.variants[event.variant_key || "A"] = (row.variants[event.variant_key || "A"] || 0) + count;
    steps.set(key, row);
  }
  const rows = [...steps.values()].sort((a, b) => a.position - b.position);
  const firstViews = rows[0]?.views || 0;

  return <div className={styles.funnelFlow}>{rows.map((row, index) => {
    const previous = index === 0 ? firstViews : (rows[index - 1]?.views || rows[index - 1]?.submits || firstViews);
    const currentVolume = row.views || row.submits || row.purchases;
    const conversion = previous > 0 ? currentVolume / previous * 100 : 0;
    const drop = Math.max(0, 100 - conversion);
    return <article key={`${row.title}-${index}`}><div className={styles.flowIndex}>{index + 1}</div><div><strong>{row.title}</strong><small>{row.views} views · {row.submits} ações · {row.purchases} compras</small></div><span><small>Conversão</small><strong>{index === 0 ? "100%" : `${conversion.toFixed(1)}%`}</strong></span><span className={drop > 60 && index > 0 ? styles.bad : ""}><TrendingDown size={13}/>{index === 0 ? "Entrada" : `${drop.toFixed(1)}% drop`}</span><em>{Object.entries(row.variants).map(([variant, count]) => `${variant}:${count}`).join(" · ")}</em></article>;
  })}</div>;
}
