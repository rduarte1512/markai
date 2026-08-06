"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3,
  Expand, FileText, Hash, Instagram, LayoutGrid, ListFilter, LoaderCircle,
  Mail, MoreHorizontal, Plus, Search, Sparkles, Target, Video, X,
} from "lucide-react";
import type { Brand } from "@/lib/types";

type ContentItem = {
  id: string;
  brand_id: string;
  brand_name: string;
  title: string;
  content_type: string;
  channel: string | null;
  body: string | null;
  status: string;
  scheduled_for: string | null;
  created_at: string;
};

type CalendarCell = { date: Date; inMonth: boolean };

const columns = [
  { key: "idea", label: "Ideias", description: "Backlog criativo" },
  { key: "draft", label: "Em produção", description: "A desenvolver" },
  { key: "review", label: "Em revisão", description: "À espera de feedback" },
  { key: "approved", label: "Aprovado", description: "Pronto para agendar" },
  { key: "scheduled", label: "Agendado", description: "Calendário confirmado" },
];

const contentTypes = [
  { key: "post", label: "Post", icon: Instagram },
  { key: "reel", label: "Reel", icon: Video },
  { key: "article", label: "Artigo", icon: FileText },
  { key: "email", label: "Email", icon: Mail },
  { key: "seo_brief", label: "Brief SEO", icon: Search },
];

const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function typeIcon(type: string) {
  return contentTypes.find((item) => item.key === type)?.icon || FileText;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function calendarCells(month: Date): CalendarCell[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, inMonth: date.getMonth() === month.getMonth() };
  });
}

export function ContentStudio({ brands, initialItems }: { brands: Brand[]; initialItems: ContentItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [creating, setCreating] = useState(false);
  const [brandId, setBrandId] = useState(brands[0]?.id || "");
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("post");
  const [channel, setChannel] = useState("Instagram");
  const [body, setBody] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [view, setView] = useState<"board" | "calendar">("board");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const visibleItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesBrand = selectedBrand === "all" || item.brand_id === selectedBrand;
      const matchesQuery = !term || `${item.title} ${item.brand_name} ${item.channel || ""}`.toLowerCase().includes(term);
      return matchesBrand && matchesQuery && item.status !== "archived";
    });
  }, [items, query, selectedBrand]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    for (const item of visibleItems) {
      if (!item.scheduled_for) continue;
      const date = new Date(item.scheduled_for);
      if (Number.isNaN(date.getTime())) continue;
      const key = dateKey(date);
      map.set(key, [...(map.get(key) || []), item]);
    }
    return map;
  }, [visibleItems]);

  const cells = useMemo(() => calendarCells(calendarMonth), [calendarMonth]);
  const monthLabel = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" }).format(calendarMonth);
  const scheduledCount = items.filter((item) => item.status === "scheduled").length;
  const reviewCount = items.filter((item) => item.status === "review").length;
  const thisMonth = items.filter((item) => {
    const date = new Date(item.scheduled_for || item.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  function shiftMonth(offset: number) {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function openFullCalendar() {
    setView("calendar");
    window.setTimeout(() => document.getElementById("editorial-calendar")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, title, contentType, channel, body, scheduledFor }),
      });
      const data = (await response.json()) as { error?: string; item?: ContentItem };
      if (!response.ok || !data.item) throw new Error(data.error || "Não foi possível criar o conteúdo.");
      setItems((current) => [data.item!, ...current]);
      setTitle("");
      setBody("");
      setScheduledFor("");
      setCreating(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function moveItem(itemId: string, status: string) {
    const previous = items;
    setItems((current) => current.map((item) => item.id === itemId ? { ...item, status } : item));
    const response = await fetch("/api/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, status }),
    });
    if (!response.ok) {
      setItems(previous);
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Não foi possível mover o conteúdo.");
    }
  }

  return (
    <div className="content-os content-os-v3">
      <section className="studio-hero content-hero content-hero-v3">
        <div>
          <span className="studio-kicker"><CalendarDays size={14}/> Content operating system</span>
          <h1>Planeia, produz e aprova conteúdo sem perder o ritmo.</h1>
          <p>Um pipeline editorial completo para transformar ideias em publicações consistentes com cada Brand Kit.</p>
          <div className="studio-hero-actions"><button className="button button-primary" onClick={() => setCreating(true)}><Plus size={16}/> Criar conteúdo</button><button className="button button-secondary"><Sparkles size={16}/> Gerar plano mensal</button></div>
        </div>
        <div className="content-hero-calendar content-hero-calendar-v3">
          <header><button onClick={() => shiftMonth(-1)} aria-label="Mês anterior"><ChevronLeft size={16}/></button><div><small>Calendário editorial</small><strong>{monthLabel}</strong></div><button onClick={() => shiftMonth(1)} aria-label="Mês seguinte"><ChevronRight size={16}/></button></header>
          <div className="hero-calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="hero-calendar-grid">{cells.map(({ date, inMonth }) => {
            const dayItems = itemsByDate.get(dateKey(date)) || [];
            const today = dateKey(date) === dateKey(new Date());
            return <button className={`${inMonth ? "" : "outside"} ${dayItems.length ? "has-content" : ""} ${today ? "today" : ""}`} key={dateKey(date)} onClick={() => { setScheduledFor(`${dateKey(date)}T09:00`); setCreating(true); }}><span>{date.getDate()}</span>{dayItems.length > 0 && <i>{dayItems.length}</i>}<em>{dayItems[0]?.title || ""}</em></button>;
          })}</div>
          <footer><span><i/> {scheduledCount} conteúdos agendados</span><button onClick={openFullCalendar}><Expand size={13}/> Abrir calendário grande</button></footer>
        </div>
      </section>

      <section className="studio-metrics-grid">
        <article><span className="metric-icon violet"><FileText size={18}/></span><div><small>Conteúdos este mês</small><strong>{thisMonth}</strong><em>em todo o workspace</em></div></article>
        <article><span className="metric-icon cyan"><CalendarDays size={18}/></span><div><small>Agendados</small><strong>{scheduledCount}</strong><em>prontos a publicar</em></div></article>
        <article><span className="metric-icon gold"><Clock3 size={18}/></span><div><small>Em revisão</small><strong>{reviewCount}</strong><em>precisam de feedback</em></div></article>
        <article><span className="metric-icon green"><Target size={18}/></span><div><small>Consistência</small><strong>{items.length ? "92%" : "—"}</strong><em>alinhamento de marca</em></div></article>
      </section>

      <section className="content-toolbar">
        <div className="content-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar título, marca ou canal..."/></div>
        <select value={selectedBrand} onChange={(event) => setSelectedBrand(event.target.value)}><option value="all">Todas as marcas</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select>
        <button className="toolbar-filter"><ListFilter size={15}/> Filtros</button>
        <div className="view-toggle"><button className={view === "board" ? "active" : ""} onClick={() => setView("board")}><LayoutGrid size={15}/></button><button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}><CalendarDays size={15}/></button></div>
      </section>

      {error && <div className="form-error">{error}</div>}

      {view === "board" ? (
        <section className="content-board">
          {columns.map((column, columnIndex) => {
            const columnItems = visibleItems.filter((item) => item.status === column.key);
            return (
              <div className="content-column" key={column.key}>
                <header><div><span className={`column-dot col-${columnIndex}`}/><strong>{column.label}</strong><em>{columnItems.length}</em></div><small>{column.description}</small></header>
                <div className="content-column-list">
                  {columnItems.map((item) => {
                    const Icon = typeIcon(item.content_type);
                    const next = columns[columnIndex + 1]?.key;
                    return (
                      <article className="content-task-card" key={item.id}>
                        <div className="content-task-top"><span className="content-type-badge"><Icon size={13}/>{contentTypes.find((type) => type.key === item.content_type)?.label || item.content_type}</span><button><MoreHorizontal size={16}/></button></div>
                        <h3>{item.title}</h3>
                        <p>{item.body || "Sem descrição. Abre o conteúdo para completar o briefing."}</p>
                        <div className="content-task-meta"><span><span className="brand-mini-dot"/>{item.brand_name}</span>{item.channel && <span><Hash size={12}/>{item.channel}</span>}</div>
                        <footer>{item.scheduled_for ? <span><CalendarDays size={13}/>{new Date(item.scheduled_for).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}</span> : <span><Clock3 size={13}/>Sem data</span>}{next && <button onClick={() => moveItem(item.id, next)}>Avançar <ChevronRight size={13}/></button>}</footer>
                      </article>
                    );
                  })}
                  {!columnItems.length && <button className="content-column-empty" onClick={() => setCreating(true)}><Plus size={16}/> Adicionar</button>}
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <section className="full-calendar-view full-calendar-v3" id="editorial-calendar">
          <header><button onClick={() => shiftMonth(-1)}><ChevronLeft size={17}/></button><div><span>Calendário editorial completo</span><h2>{monthLabel}</h2><p>Clica num dia para criar e agendar conteúdo.</p></div><button onClick={() => shiftMonth(1)}><ChevronRight size={17}/></button></header>
          <div className="calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-month-grid">{cells.map(({ date, inMonth }) => {
            const dayItems = itemsByDate.get(dateKey(date)) || [];
            const today = dateKey(date) === dateKey(new Date());
            return <div className={`${inMonth ? "" : "outside"} ${today ? "today" : ""}`} key={dateKey(date)}><button className="calendar-day-number" onClick={() => { setScheduledFor(`${dateKey(date)}T09:00`); setCreating(true); }}>{date.getDate()}<Plus size={12}/></button>{dayItems.slice(0, 3).map((item) => <button className={`calendar-event event-${item.status}`} key={item.id}><i/><span><strong>{item.title}</strong><small>{item.channel || item.brand_name}</small></span></button>)}{dayItems.length > 3 && <em>+{dayItems.length - 3} conteúdos</em>}</div>;
          })}</div>
        </section>
      )}

      {creating && (
        <div className="studio-modal-backdrop" onMouseDown={() => setCreating(false)}>
          <form className="studio-modal content-create-modal" onSubmit={createItem} onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span className="studio-kicker"><Sparkles size={13}/> Novo conteúdo</span><h2>Adicionar ao calendário</h2><p>Cria um briefing e coloca-o imediatamente no pipeline editorial.</p></div><button type="button" onClick={() => setCreating(false)}><X size={18}/></button></header>
            <div className="field"><label>Tipo de conteúdo</label><div className="modal-template-grid">{contentTypes.map(({ key, label, icon: Icon }) => <button type="button" key={key} className={contentType === key ? "active" : ""} onClick={() => setContentType(key)}><Icon size={16}/><span>{label}</span></button>)}</div></div>
            <div className="field"><label>Título</label><input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Reel — 3 erros que reduzem conversões" required/></div>
            <div className="form-row"><div className="field"><label>Marca</label><select className="select" value={brandId} onChange={(event) => setBrandId(event.target.value)}>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div><div className="field"><label>Canal</label><select className="select" value={channel} onChange={(event) => setChannel(event.target.value)}><option>Instagram</option><option>LinkedIn</option><option>TikTok</option><option>Email</option><option>Blog</option><option>YouTube</option></select></div></div>
            <div className="field"><label>Briefing</label><textarea className="textarea" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Objetivo, ângulo, CTA, pontos essenciais e referências."/></div>
            <div className="field"><label>Data de publicação opcional</label><input className="input" type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)}/></div>
            {error && <div className="form-error">{error}</div>}
            <footer><button className="button button-secondary" type="button" onClick={() => setCreating(false)}>Cancelar</button><button className="button button-primary" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={16}/> A guardar</> : <><CheckCircle2 size={16}/> Criar conteúdo</>}</button></footer>
          </form>
        </div>
      )}
    </div>
  );
}
