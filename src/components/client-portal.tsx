"use client";

import { useMemo, useState } from "react";
import {
  BarChart3, CalendarDays, Check, CheckCircle2, Clock3, FileBarChart,
  MessageSquareText, Megaphone, RefreshCw, Send, ShieldCheck, Sparkles,
  XCircle,
} from "lucide-react";
import styles from "./client-portal.module.css";

type Portal = { brand_id: string; label?: string; brand_name: string; industry?: string; primary_color?: string; secondary_color?: string; workspace_name: string };
type Campaign = { id: string; name: string; objective?: string; channel?: string; status: string; budget?: string | number; start_date?: string; end_date?: string };
type Ad = { id: string; platform: string; title?: string; primary_text: string; description?: string; cta?: string; variant_label?: string; status: string; performance?: Record<string, unknown> };
type Content = { id: string; title: string; content_type: string; channel?: string; body?: string; status: string; scheduled_for?: string };
type Report = { id: string; title: string; period_start?: string; period_end?: string; metrics?: Record<string, unknown>; ai_insights?: string; status: string; created_at: string };
type Approval = { entity_type: string; entity_id: string; status: string; client_name?: string; client_note?: string; decided_at?: string };
type Comment = { id: string; entity_type: string; entity_id: string; body: string; resolved: boolean; created_at: string };
type Data = { campaigns: Campaign[]; ads: Ad[]; content: Content[]; reports: Report[]; approvals: Approval[]; comments: Comment[] };

type Tab = "overview" | "approvals" | "reports";

function money(value: unknown) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0);
}

function date(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

export function ClientPortal({ token, portal, data }: { token: string; portal: Portal; data: Data }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [clientName, setClientName] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [localApprovals, setLocalApprovals] = useState(data.approvals);

  const approvalMap = useMemo(() => new Map(localApprovals.map((item) => [`${item.entity_type}:${item.entity_id}`, item])), [localApprovals]);
  const pendingCount = data.ads.filter((item) => !approvalMap.has(`ad:${item.id}`)).length + data.content.filter((item) => !approvalMap.has(`content:${item.id}`)).length;
  const approvedCount = localApprovals.filter((item) => item.status === "approved").length;
  const changeCount = localApprovals.filter((item) => item.status === "changes_requested").length;

  async function submitApproval(entityType: string, entityId: string, status: "approved" | "changes_requested", note = "") {
    setBusy(`${entityType}:${entityId}`);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/portal/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approval", entityType, entityId, status, clientName, note }),
      });
      const body = await response.json() as { error?: string; approval?: Approval; message?: string };
      if (!response.ok || !body.approval) throw new Error(body.error || "Não foi possível guardar a decisão.");
      setLocalApprovals((current) => [...current.filter((item) => !(item.entity_type === entityType && item.entity_id === entityId)), body.approval!]);
      setNotice(body.message || "Decisão guardada.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brandMark}>M</div>
        <div><strong>MarkAI Client Portal</strong><small>Área segura de revisão e resultados</small></div>
        <span><ShieldCheck size={14}/> Link protegido</span>
      </header>

      <section className={styles.hero} style={{ "--brand-a": portal.primary_color || "#7c3aed", "--brand-b": portal.secondary_color || "#22d3ee" } as React.CSSProperties}>
        <div className={styles.brandAvatar}>{portal.brand_name.slice(0,2).toUpperCase()}</div>
        <div><small>{portal.workspace_name}</small><h1>{portal.label || portal.brand_name}</h1><p>{portal.industry || "Área de cliente"} · acompanha trabalho, aprova entregáveis e consulta relatórios.</p></div>
        <label>O teu nome<input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Opcional para assinar decisões" /></label>
      </section>

      <nav className={styles.tabs}>
        <button className={tab === "overview" ? styles.active : ""} onClick={() => setTab("overview")}><BarChart3 size={15}/>Visão geral</button>
        <button className={tab === "approvals" ? styles.active : ""} onClick={() => setTab("approvals")}><CheckCircle2 size={15}/>Aprovações <em>{pendingCount}</em></button>
        <button className={tab === "reports" ? styles.active : ""} onClick={() => setTab("reports")}><FileBarChart size={15}/>Relatórios</button>
      </nav>

      {error && <div className={styles.error}>{error}</div>}
      {notice && <div className={styles.notice}><Check size={14}/>{notice}</div>}

      {tab === "overview" && <>
        <section className={styles.metrics}>
          <article><span><Clock3 size={17}/></span><small>Pendentes</small><strong>{pendingCount}</strong><p>itens à espera de revisão</p></article>
          <article><span><CheckCircle2 size={17}/></span><small>Aprovados</small><strong>{approvedCount}</strong><p>decisões confirmadas</p></article>
          <article><span><RefreshCw size={17}/></span><small>Alterações</small><strong>{changeCount}</strong><p>pedidos enviados à agência</p></article>
          <article><span><FileBarChart size={17}/></span><small>Relatórios</small><strong>{data.reports.length}</strong><p>prontos para consulta</p></article>
        </section>
        <section className={styles.panel}>
          <header><div><small>Campanhas</small><h2>Trabalho em curso</h2></div><Megaphone size={18}/></header>
          <div className={styles.campaigns}>{data.campaigns.map((campaign) => <article key={campaign.id}><span className={styles.status}>{campaign.status}</span><h3>{campaign.name}</h3><p>{campaign.objective || "Objetivo em definição"}</p><div><span><small>Canal</small><strong>{campaign.channel || "Multicanal"}</strong></span><span><small>Budget</small><strong>{campaign.budget ? money(campaign.budget) : "—"}</strong></span><span><small>Período</small><strong>{date(campaign.start_date)} → {date(campaign.end_date)}</strong></span></div></article>)}{!data.campaigns.length && <Empty text="Ainda não existem campanhas partilhadas."/>}</div>
        </section>
      </>}

      {tab === "approvals" && <section className={styles.panel}>
        <header><div><small>Revisão</small><h2>Anúncios e conteúdos</h2></div><CheckCircle2 size={18}/></header>
        <div className={styles.approvalGrid}>
          {data.ads.map((ad) => <ApprovalCard key={ad.id} entityType="ad" entityId={ad.id} title={ad.title || ad.variant_label || "Anúncio"} meta={`${ad.platform} · ${ad.status}`} body={ad.primary_text} approval={approvalMap.get(`ad:${ad.id}`)} busy={busy === `ad:${ad.id}`} onDecision={submitApproval} />)}
          {data.content.map((item) => <ApprovalCard key={item.id} entityType="content" entityId={item.id} title={item.title} meta={`${item.content_type} · ${item.channel || "Multicanal"} · ${item.status}`} body={item.body || "Sem descrição."} approval={approvalMap.get(`content:${item.id}`)} busy={busy === `content:${item.id}`} onDecision={submitApproval} />)}
          {!data.ads.length && !data.content.length && <Empty text="Não existem itens para revisão."/>}
        </div>
      </section>}

      {tab === "reports" && <section className={styles.panel}>
        <header><div><small>Performance</small><h2>Relatórios partilhados</h2></div><FileBarChart size={18}/></header>
        <div className={styles.reports}>{data.reports.map((report) => <article key={report.id}><div><span><Sparkles size={15}/></span><div><strong>{report.title}</strong><small>{date(report.period_start)} → {date(report.period_end)}</small></div></div><div className={styles.reportNumbers}><span><small>Spend</small><strong>{money(report.metrics?.spend)}</strong></span><span><small>Revenue</small><strong>{money(report.metrics?.revenue)}</strong></span><span><small>ROAS</small><strong>{Number(report.metrics?.roas || 0).toFixed(2)}x</strong></span></div>{report.ai_insights && <p>{report.ai_insights}</p>}</article>)}{!data.reports.length && <Empty text="Ainda não existem relatórios partilhados."/>}</div>
      </section>}

      <footer className={styles.footer}><span>Powered by MarkAI</span><span><ShieldCheck size={13}/> Decisões registadas no workspace da agência</span></footer>
    </main>
  );
}

function ApprovalCard({ entityType, entityId, title, meta, body, approval, busy, onDecision }: { entityType: string; entityId: string; title: string; meta: string; body: string; approval?: Approval; busy: boolean; onDecision: (type: string, id: string, status: "approved" | "changes_requested", note?: string) => Promise<void> }) {
  const [note, setNote] = useState(approval?.client_note || "");
  return <article className={styles.approvalCard}>
    <header><div><span className={styles.typeIcon}>{entityType === "ad" ? <Megaphone size={14}/> : <CalendarDays size={14}/>}</span><div><strong>{title}</strong><small>{meta}</small></div></div>{approval && <span className={`${styles.decision} ${approval.status === "approved" ? styles.approved : styles.changes}`}>{approval.status === "approved" ? "Aprovado" : "Alterações pedidas"}</span>}</header>
    <p>{body}</p>
    <label><MessageSquareText size={13}/><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Comentário opcional para a agência…" /></label>
    <footer><button disabled={busy} className={styles.changeButton} onClick={() => void onDecision(entityType, entityId, "changes_requested", note)}><XCircle size={14}/>Pedir alterações</button><button disabled={busy} className={styles.approveButton} onClick={() => void onDecision(entityType, entityId, "approved", note)}>{busy ? <RefreshCw className={styles.spin} size={14}/> : <CheckCircle2 size={14}/>}Aprovar</button></footer>
  </article>;
}

function Empty({ text }: { text: string }) {
  return <div className={styles.empty}><Send size={19}/><span>{text}</span></div>;
}
