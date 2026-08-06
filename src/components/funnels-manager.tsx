"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight, BarChart3, CheckCircle2, ChevronRight, CircleDot,
  Clock3, Eye, FormInput, Globe2, LoaderCircle, Mail, Plus,
  Rocket, ShoppingCart, Sparkles, Target, Workflow, X,
} from "lucide-react";
import type { Brand } from "@/lib/types";

type Funnel = {
  id: string;
  brand_id: string;
  brand_name: string;
  name: string;
  template_key: string | null;
  status: "draft" | "published" | "archived";
  step_count: number;
  created_at: string;
  settings?: Record<string, unknown>;
};

const templates = [
  { key: "leads", name: "Captação de leads", description: "Landing, formulário, obrigado e nutrição.", icon: Target, accent: "violet", steps: 4 },
  { key: "sales", name: "Venda direta", description: "Página de vendas, checkout, upsell e follow-up.", icon: ShoppingCart, accent: "cyan", steps: 5 },
  { key: "webinar", name: "Evento ou webinar", description: "Registo, lembretes, replay e oferta.", icon: Globe2, accent: "blue", steps: 5 },
  { key: "local", name: "Serviço local", description: "Pedido de orçamento e seguimento comercial.", icon: FormInput, accent: "green", steps: 4 },
];

const stepIcons = [Globe2, FormInput, ShoppingCart, Mail, CheckCircle2];

export function FunnelsManager({ brands, initialFunnels }: { brands: Brand[]; initialFunnels: Funnel[] }) {
  const [funnels, setFunnels] = useState(initialFunnels);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState(brands[0]?.id || "");
  const [templateKey, setTemplateKey] = useState("leads");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");

  const visibleFunnels = useMemo(() => funnels.filter((funnel) => filter === "all" || funnel.status === filter), [funnels, filter]);
  const published = funnels.filter((funnel) => funnel.status === "published").length;
  const totalSteps = funnels.reduce((sum, funnel) => sum + Number(funnel.step_count || 0), 0);

  async function createFunnel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/funnels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, name, templateKey }),
      });
      const data = (await response.json()) as { error?: string; funnel?: Funnel };
      if (!response.ok || !data.funnel) throw new Error(data.error || "Não foi possível criar o funil.");
      setFunnels((current) => [data.funnel!, ...current]);
      setName("");
      setCreating(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(funnelId: string, status: "draft" | "published" | "archived") {
    setFunnels((current) => current.map((item) => item.id === funnelId ? { ...item, status } : item));
    const response = await fetch("/api/funnels", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funnelId, status }),
    });
    if (!response.ok) {
      setFunnels(initialFunnels);
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Não foi possível atualizar o funil.");
    }
  }

  return (
    <div className="funnels-v2">
      <section className="studio-hero funnel-hero">
        <div>
          <span className="studio-kicker"><Workflow size={14}/> Revenue canvas</span>
          <h1>Constrói jornadas que transformam atenção em receita.</h1>
          <p>Cria, organiza e publica landing pages, formulários, checkouts, upsells e sequências de email num fluxo visual.</p>
          <div className="studio-hero-actions"><button className="button button-primary" onClick={() => setCreating(true)}><Plus size={16}/> Novo funil</button><button className="button button-secondary"><Sparkles size={16}/> Gerar estratégia com IA</button></div>
        </div>
        <div className="funnel-hero-visual">
          <span><Globe2 size={17}/> Landing</span><ArrowRight size={15}/><span><FormInput size={17}/> Lead</span><ArrowRight size={15}/><span><ShoppingCart size={17}/> Venda</span><ArrowRight size={15}/><span><Mail size={17}/> Retenção</span>
        </div>
      </section>

      <section className="studio-metrics-grid">
        <article><span className="metric-icon violet"><Workflow size={18}/></span><div><small>Funis ativos</small><strong>{funnels.length}</strong><em>{published} publicados</em></div></article>
        <article><span className="metric-icon cyan"><CircleDot size={18}/></span><div><small>Etapas criadas</small><strong>{totalSteps}</strong><em>prontas para editar</em></div></article>
        <article><span className="metric-icon green"><BarChart3 size={18}/></span><div><small>Potencial de otimização</small><strong>{funnels.length ? "Alta" : "—"}</strong><em>análise contínua</em></div></article>
        <article><span className="metric-icon gold"><Clock3 size={18}/></span><div><small>Tempo poupado</small><strong>{funnels.length * 3}h</strong><em>estimativa mensal</em></div></article>
      </section>

      <section className="funnel-template-section">
        <div className="section-title-row"><div><span className="studio-kicker"><Sparkles size={13}/> Templates inteligentes</span><h2>Começa com uma estrutura validada.</h2></div><button className="text-button" onClick={() => setCreating(true)}>Ver todos <ChevronRight size={15}/></button></div>
        <div className="funnel-template-grid">
          {templates.map(({ key, name: templateName, description, icon: Icon, accent, steps }) => (
            <button className={`funnel-template-card ${accent}`} key={key} onClick={() => { setTemplateKey(key); setName(`${templateName} — ${brands[0]?.name || "Nova marca"}`); setCreating(true); }}>
              <span className="template-icon"><Icon size={20}/></span><span><strong>{templateName}</strong><small>{description}</small></span><em>{steps} etapas</em><ArrowRight size={16}/>
            </button>
          ))}
        </div>
      </section>

      <section className="funnel-library">
        <div className="section-title-row"><div><span className="studio-kicker"><Rocket size={13}/> Biblioteca operacional</span><h2>Os teus funis</h2></div><div className="segmented-control"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Todos</button><button className={filter === "draft" ? "active" : ""} onClick={() => setFilter("draft")}>Rascunhos</button><button className={filter === "published" ? "active" : ""} onClick={() => setFilter("published")}>Publicados</button></div></div>
        {error && <div className="form-error">{error}</div>}
        <div className="funnel-card-grid">
          {visibleFunnels.map((funnel) => {
            const template = templates.find((item) => item.key === funnel.template_key) || templates[0];
            return (
              <article className="funnel-project-card" key={funnel.id}>
                <header><div className={`project-avatar ${template.accent}`}><template.icon size={19}/></div><div><span>{funnel.brand_name}</span><h3>{funnel.name}</h3></div><span className={`status-pill ${funnel.status}`}>{funnel.status === "published" ? "Publicado" : funnel.status === "archived" ? "Arquivado" : "Rascunho"}</span></header>
                <div className="funnel-flow-mini">
                  {Array.from({ length: Math.min(5, Number(funnel.step_count || 0)) }).map((_, index) => {
                    const Icon = stepIcons[index] || CircleDot;
                    return <div key={index}><span><Icon size={14}/></span>{index < Math.min(5, Number(funnel.step_count || 0)) - 1 && <i/>}</div>;
                  })}
                </div>
                <div className="funnel-card-insights"><span><Eye size={14}/> Estrutura pronta</span><span><Target size={14}/> {template.name}</span><span><Clock3 size={14}/> {new Date(funnel.created_at).toLocaleDateString("pt-PT")}</span></div>
                <footer><button className="button button-secondary button-sm"><Workflow size={14}/> Abrir canvas</button>{funnel.status === "published" ? <button className="button button-ghost button-sm" onClick={() => changeStatus(funnel.id, "draft")}>Despublicar</button> : <button className="button button-primary button-sm" onClick={() => changeStatus(funnel.id, "published")}><Rocket size={14}/> Publicar</button>}</footer>
              </article>
            );
          })}
          {!visibleFunnels.length && <div className="studio-empty-wide"><span><Workflow size={25}/></span><h3>A tua primeira jornada começa aqui.</h3><p>Escolhe um template, associa uma marca e o MarkAI prepara todas as etapas.</p><button className="button button-primary" onClick={() => setCreating(true)}><Plus size={16}/> Criar primeiro funil</button></div>}
        </div>
      </section>

      {creating && (
        <div className="studio-modal-backdrop" onMouseDown={() => setCreating(false)}>
          <form className="studio-modal" onSubmit={createFunnel} onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span className="studio-kicker"><Sparkles size={13}/> Novo ativo de conversão</span><h2>Criar funil</h2><p>Escolhe uma estrutura e deixa o MarkAI preparar o canvas inicial.</p></div><button type="button" onClick={() => setCreating(false)}><X size={18}/></button></header>
            <div className="field"><label>Nome do funil</label><input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Captação de leads — Clínica Lisboa" required/></div>
            <div className="field"><label>Marca</label><select className="select" value={brandId} onChange={(event) => setBrandId(event.target.value)} required>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>
            <div className="field"><label>Template</label><div className="modal-template-grid">{templates.map(({ key, name: templateName, icon: Icon }) => <button type="button" key={key} className={templateKey === key ? "active" : ""} onClick={() => setTemplateKey(key)}><Icon size={16}/><span>{templateName}</span></button>)}</div></div>
            {error && <div className="form-error">{error}</div>}
            <footer><button className="button button-secondary" type="button" onClick={() => setCreating(false)}>Cancelar</button><button className="button button-primary" disabled={loading} type="submit">{loading ? <><LoaderCircle className="spin" size={16}/> A preparar</> : <><Rocket size={16}/> Criar canvas</>}</button></footer>
          </form>
        </div>
      )}
    </div>
  );
}
