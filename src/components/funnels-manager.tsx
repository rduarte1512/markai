"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlignLeft, ArrowLeft, ArrowRight, BarChart3, Check, CheckCircle2,
  ChevronRight, CircleDot, Clock3, Eye, FileImage, FormInput, Globe2,
  Heading1, ImageIcon, LayoutTemplate, LoaderCircle, Mail, Monitor,
  MousePointerClick, PanelRight, Play, Plus, Quote, Rocket, Save,
  ShoppingCart, Smartphone, Sparkles, Target, Trash2, Upload, Video,
  Workflow, X, Zap,
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

type ContentBlock = {
  id: string;
  type: "text" | "benefit" | "testimonial" | "image" | "video" | "button";
  title?: string;
  text?: string;
  url?: string;
  label?: string;
};

type StepContent = {
  status?: string;
  eyebrow?: string;
  headline?: string;
  body?: string;
  audience?: string;
  button_label?: string;
  image_url?: string;
  video_url?: string;
  subject?: string;
  price?: string;
  guarantee?: string;
  theme?: string;
  fields?: string[];
  blocks?: ContentBlock[];
};

type FunnelStep = {
  id: string;
  funnel_id: string;
  step_type: string;
  title: string;
  position: number;
  content: StepContent | null;
};

const templates = [
  { key: "leads", name: "Captação de leads", description: "Landing, formulário, obrigado e nutrição.", icon: Target, accent: "violet", steps: 4 },
  { key: "sales", name: "Venda direta", description: "Página de vendas, checkout, upsell e follow-up.", icon: ShoppingCart, accent: "cyan", steps: 5 },
  { key: "webinar", name: "Evento ou webinar", description: "Registo, lembretes, replay e oferta.", icon: Globe2, accent: "blue", steps: 5 },
  { key: "local", name: "Serviço local", description: "Pedido de orçamento e seguimento comercial.", icon: FormInput, accent: "green", steps: 4 },
];

const stepTypeMeta: Record<string, { label: string; icon: LucideIcon }> = {
  landing: { label: "Página", icon: Globe2 },
  form: { label: "Formulário", icon: FormInput },
  checkout: { label: "Checkout", icon: ShoppingCart },
  upsell: { label: "Upsell", icon: Zap },
  thank_you: { label: "Obrigado", icon: CheckCircle2 },
  email: { label: "Email", icon: Mail },
};

const stepIcons = [Globe2, FormInput, ShoppingCart, Mail, CheckCircle2];

function normalizeContent(content: StepContent | null | undefined): StepContent {
  return {
    eyebrow: content?.eyebrow || "Uma experiência desenhada para converter",
    headline: content?.headline || "Título principal da etapa",
    body: content?.body || "Explica aqui o benefício, reduz a fricção e orienta a pessoa para o próximo passo.",
    button_label: content?.button_label || "Continuar",
    image_url: content?.image_url || "",
    video_url: content?.video_url || "",
    subject: content?.subject || "",
    price: content?.price || "",
    guarantee: content?.guarantee || "",
    theme: content?.theme || "premium-dark",
    fields: Array.isArray(content?.fields) ? content?.fields : ["Nome", "Email", "Telefone"],
    blocks: Array.isArray(content?.blocks) ? content?.blocks : [],
  };
}

function makeBlock(type: ContentBlock["type"]): ContentBlock {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  if (type === "benefit") return { id, type, title: "Benefício principal", text: "Mostra o resultado concreto que o cliente recebe." };
  if (type === "testimonial") return { id, type, title: "Cliente satisfeito", text: "“Esta solução tornou o processo muito mais simples e rápido.”" };
  if (type === "image") return { id, type, title: "Imagem", url: "" };
  if (type === "video") return { id, type, title: "Vídeo", url: "" };
  if (type === "button") return { id, type, label: "Quero avançar" };
  return { id, type, title: "Novo bloco", text: "Adiciona conteúdo complementar a esta etapa." };
}

function formatVideoUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (parsed.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
    if (parsed.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video/${parsed.pathname.replace("/", "")}`;
  } catch {
    return url;
  }
  return url;
}

export function FunnelsManager({ brands, initialFunnels }: { brands: Brand[]; initialFunnels: Funnel[] }) {
  const [funnels, setFunnels] = useState(initialFunnels);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState(brands[0]?.id || "");
  const [templateKey, setTemplateKey] = useState("leads");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("");
  const [offer, setOffer] = useState("");
  const [cta, setCta] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");

  const [canvasOpen, setCanvasOpen] = useState(false);
  const [canvasLoading, setCanvasLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [steps, setSteps] = useState<FunnelStep[]>([]);
  const [activeStepId, setActiveStepId] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [saveNotice, setSaveNotice] = useState("");

  const visibleFunnels = useMemo(() => funnels.filter((funnel) => filter === "all" || funnel.status === filter), [funnels, filter]);
  const published = funnels.filter((funnel) => funnel.status === "published").length;
  const totalSteps = funnels.reduce((sum, funnel) => sum + Number(funnel.step_count || 0), 0);
  const activeStep = steps.find((step) => step.id === activeStepId) || steps[0];
  const activeContent = normalizeContent(activeStep?.content);

  function resetCreation() {
    setName("");
    setObjective("");
    setAudience("");
    setOffer("");
    setCta("");
    setHeroImageUrl("");
    setVideoUrl("");
  }

  async function createFunnel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/funnels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, name, templateKey, objective, audience, offer, cta, heroImageUrl, videoUrl }),
      });
      const data = (await response.json()) as { error?: string; funnel?: Funnel };
      if (!response.ok || !data.funnel) throw new Error(data.error || "Não foi possível criar o funil.");
      setFunnels((current) => [data.funnel!, ...current]);
      setCreating(false);
      resetCreation();
      await openCanvas(data.funnel);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function openCanvas(funnel: Funnel, preview = false) {
    setCanvasOpen(true);
    setCanvasLoading(true);
    setSelectedFunnel(funnel);
    setPreviewMode(preview);
    setSaveNotice("");
    setError("");
    try {
      const response = await fetch(`/api/funnels?funnelId=${encodeURIComponent(funnel.id)}`, { cache: "no-store" });
      const data = (await response.json()) as { error?: string; funnel?: Funnel; steps?: FunnelStep[] };
      if (!response.ok || !data.funnel) throw new Error(data.error || "Não foi possível abrir o funil.");
      const loadedSteps = (data.steps || []).map((step) => ({ ...step, content: normalizeContent(step.content) }));
      setSelectedFunnel({ ...funnel, ...data.funnel });
      setSteps(loadedSteps);
      setActiveStepId(loadedSteps[0]?.id || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível abrir o funil.");
    } finally {
      setCanvasLoading(false);
    }
  }

  async function changeStatus(funnelId: string, status: "draft" | "published" | "archived") {
    const previous = funnels;
    setFunnels((current) => current.map((item) => item.id === funnelId ? { ...item, status } : item));
    const response = await fetch("/api/funnels", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funnelId, status }),
    });
    if (!response.ok) {
      setFunnels(previous);
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Não foi possível atualizar o funil.");
    } else if (selectedFunnel?.id === funnelId) {
      setSelectedFunnel((current) => current ? { ...current, status } : current);
    }
  }

  function updateActiveStepContent(patch: Partial<StepContent>) {
    if (!activeStep) return;
    setSteps((current) => current.map((step) => step.id === activeStep.id
      ? { ...step, content: { ...normalizeContent(step.content), ...patch } }
      : step));
    setSaveNotice("");
  }

  function updateActiveStepTitle(title: string) {
    if (!activeStep) return;
    setSteps((current) => current.map((step) => step.id === activeStep.id ? { ...step, title } : step));
    setSaveNotice("");
  }

  function addBlock(type: ContentBlock["type"]) {
    updateActiveStepContent({ blocks: [...(activeContent.blocks || []), makeBlock(type)] });
  }

  function updateBlock(blockId: string, patch: Partial<ContentBlock>) {
    updateActiveStepContent({
      blocks: (activeContent.blocks || []).map((block) => block.id === blockId ? { ...block, ...patch } : block),
    });
  }

  function removeBlock(blockId: string) {
    updateActiveStepContent({ blocks: (activeContent.blocks || []).filter((block) => block.id !== blockId) });
  }

  function uploadHeroImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Seleciona um ficheiro de imagem.");
    if (file.size > 1_200_000) return setError("A imagem deve ter menos de 1,2 MB neste MVP.");
    const reader = new FileReader();
    reader.onload = () => updateActiveStepContent({ image_url: String(reader.result || "") });
    reader.onerror = () => setError("Não foi possível ler a imagem.");
    reader.readAsDataURL(file);
  }

  async function saveActiveStep() {
    if (!activeStep || !selectedFunnel) return;
    setSaving(true);
    setError("");
    setSaveNotice("");
    try {
      const response = await fetch("/api/funnels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funnelId: selectedFunnel.id, stepId: activeStep.id, title: activeStep.title, content: normalizeContent(activeStep.content) }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível guardar a etapa.");
      setSaveNotice("Etapa guardada no funil.");
      window.setTimeout(() => setSaveNotice(""), 2200);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="funnels-v2 funnels-v3">
      <section className="studio-hero funnel-hero">
        <div>
          <span className="studio-kicker"><Workflow size={14}/> Revenue canvas</span>
          <h1>Constrói jornadas que transformam atenção em receita.</h1>
          <p>Cria, edita e publica páginas com imagens, vídeo, formulários, checkouts, upsells e sequências de email num fluxo visual.</p>
          <div className="studio-hero-actions"><button className="button button-primary" onClick={() => setCreating(true)}><Plus size={16}/> Novo funil completo</button><button className="button button-secondary"><Sparkles size={16}/> Gerar estratégia com IA</button></div>
        </div>
        <div className="funnel-hero-visual">
          <span><Globe2 size={17}/> Landing</span><ArrowRight size={15}/><span><FormInput size={17}/> Lead</span><ArrowRight size={15}/><span><ShoppingCart size={17}/> Venda</span><ArrowRight size={15}/><span><Mail size={17}/> Retenção</span>
        </div>
      </section>

      <section className="studio-metrics-grid">
        <article><span className="metric-icon violet"><Workflow size={18}/></span><div><small>Funis ativos</small><strong>{funnels.length}</strong><em>{published} publicados</em></div></article>
        <article><span className="metric-icon cyan"><CircleDot size={18}/></span><div><small>Etapas criadas</small><strong>{totalSteps}</strong><em>editáveis no canvas</em></div></article>
        <article><span className="metric-icon green"><BarChart3 size={18}/></span><div><small>Media suportada</small><strong>Imagem + vídeo</strong><em>por etapa</em></div></article>
        <article><span className="metric-icon gold"><Clock3 size={18}/></span><div><small>Tempo poupado</small><strong>{funnels.length * 3}h</strong><em>estimativa mensal</em></div></article>
      </section>

      <section className="funnel-template-section">
        <div className="section-title-row"><div><span className="studio-kicker"><Sparkles size={13}/> Templates inteligentes</span><h2>Começa com uma estrutura validada.</h2></div><button className="text-button" onClick={() => setCreating(true)}>Ver todos <ChevronRight size={15}/></button></div>
        <div className="funnel-template-grid">
          {templates.map(({ key, name: templateName, description, icon: Icon, accent, steps: count }) => (
            <button className={`funnel-template-card ${accent}`} key={key} onClick={() => { setTemplateKey(key); setName(`${templateName} — ${brands[0]?.name || "Nova marca"}`); setCreating(true); }}>
              <span className="template-icon"><Icon size={20}/></span><span><strong>{templateName}</strong><small>{description}</small></span><em>{count} etapas</em><ArrowRight size={16}/>
            </button>
          ))}
        </div>
      </section>

      <section className="funnel-library">
        <div className="section-title-row"><div><span className="studio-kicker"><Rocket size={13}/> Biblioteca operacional</span><h2>Os teus funis</h2></div><div className="segmented-control"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Todos</button><button className={filter === "draft" ? "active" : ""} onClick={() => setFilter("draft")}>Rascunhos</button><button className={filter === "published" ? "active" : ""} onClick={() => setFilter("published")}>Publicados</button></div></div>
        {error && !canvasOpen && <div className="form-error">{error}</div>}
        <div className="funnel-card-grid">
          {visibleFunnels.map((funnel) => {
            const template = templates.find((item) => item.key === funnel.template_key) || templates[0];
            const TemplateIcon = template.icon;
            return (
              <article className="funnel-project-card" key={funnel.id}>
                <header><div className={`project-avatar ${template.accent}`}><TemplateIcon size={19}/></div><div><span>{funnel.brand_name}</span><h3>{funnel.name}</h3></div><span className={`status-pill ${funnel.status}`}>{funnel.status === "published" ? "Publicado" : funnel.status === "archived" ? "Arquivado" : "Rascunho"}</span></header>
                <div className="funnel-flow-mini">
                  {Array.from({ length: Math.min(5, Number(funnel.step_count || 0)) }).map((_, index) => {
                    const Icon = stepIcons[index] || CircleDot;
                    return <div key={index}><span><Icon size={14}/></span>{index < Math.min(5, Number(funnel.step_count || 0)) - 1 && <i/>}</div>;
                  })}
                </div>
                <div className="funnel-card-insights"><span><Eye size={14}/> Preview real</span><span><ImageIcon size={14}/> Media editável</span><span><Clock3 size={14}/> {new Date(funnel.created_at).toLocaleDateString("pt-PT")}</span></div>
                <footer className="funnel-card-footer-v3"><button className="button button-secondary button-sm" onClick={() => openCanvas(funnel)}><Workflow size={14}/> Abrir canvas</button><button className="button button-ghost button-sm" onClick={() => openCanvas(funnel, true)}><Eye size={14}/> Ver funil</button>{funnel.status === "published" ? <button className="button button-ghost button-sm" onClick={() => changeStatus(funnel.id, "draft")}>Despublicar</button> : <button className="button button-primary button-sm" onClick={() => changeStatus(funnel.id, "published")}><Rocket size={14}/> Publicar</button>}</footer>
              </article>
            );
          })}
          {!visibleFunnels.length && <div className="studio-empty-wide"><span><Workflow size={25}/></span><h3>A tua primeira jornada começa aqui.</h3><p>Escolhe um template, adiciona oferta e media e o MarkAI prepara todas as etapas.</p><button className="button button-primary" onClick={() => setCreating(true)}><Plus size={16}/> Criar primeiro funil</button></div>}
        </div>
      </section>

      {creating && (
        <div className="studio-modal-backdrop" onMouseDown={() => setCreating(false)}>
          <form className="studio-modal funnel-create-modal-v3" onSubmit={createFunnel} onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span className="studio-kicker"><Sparkles size={13}/> Novo ativo de conversão</span><h2>Criar funil completo</h2><p>O conteúdo inicial, media e todas as etapas ficam preparados para editar.</p></div><button type="button" onClick={() => setCreating(false)}><X size={18}/></button></header>
            <div className="funnel-create-grid">
              <section>
                <div className="field"><label>Nome do funil</label><input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Captação de leads — Clínica Lisboa" required/></div>
                <div className="form-row"><div className="field"><label>Marca</label><select className="select" value={brandId} onChange={(event) => setBrandId(event.target.value)} required>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div><div className="field"><label>Objetivo</label><input className="input" value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Ex.: Marcar avaliação"/></div></div>
                <div className="field"><label>Template</label><div className="modal-template-grid">{templates.map(({ key, name: templateName, icon: Icon }) => <button type="button" key={key} className={templateKey === key ? "active" : ""} onClick={() => setTemplateKey(key)}><Icon size={16}/><span>{templateName}</span></button>)}</div></div>
                <div className="field"><label>Público</label><input className="input" value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="Quem deve avançar neste funil?"/></div>
                <div className="field"><label>Oferta principal</label><textarea className="textarea" value={offer} onChange={(event) => setOffer(event.target.value)} placeholder="Benefício, preço, condições, prova e urgência."/></div>
                <div className="field"><label>CTA principal</label><input className="input" value={cta} onChange={(event) => setCta(event.target.value)} placeholder="Ex.: Quero marcar agora"/></div>
              </section>
              <aside className="funnel-create-media">
                <span className="studio-kicker"><FileImage size={13}/> Media inicial</span>
                <div className="field"><label>Imagem principal por URL</label><input className="input" value={heroImageUrl} onChange={(event) => setHeroImageUrl(event.target.value)} placeholder="https://.../imagem.jpg"/></div>
                <div className="field"><label>Vídeo por URL</label><input className="input" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="YouTube, Vimeo ou ficheiro MP4"/></div>
                <div className="creation-media-preview">
                  {heroImageUrl ? <div style={{ backgroundImage: `url(${heroImageUrl})` }}/>: <span><ImageIcon size={22}/><small>A imagem aparece aqui</small></span>}
                  {videoUrl && <em><Play size={13}/> Vídeo ligado</em>}
                </div>
                <p>Podes alterar estes elementos e adicionar mais blocos depois no canvas.</p>
              </aside>
            </div>
            {error && <div className="form-error">{error}</div>}
            <footer><button className="button button-secondary" type="button" onClick={() => setCreating(false)}>Cancelar</button><button className="button button-primary" disabled={loading} type="submit">{loading ? <><LoaderCircle className="spin" size={16}/> A preparar</> : <><Rocket size={16}/> Criar e abrir canvas</>}</button></footer>
          </form>
        </div>
      )}

      {canvasOpen && (
        <div className="funnel-canvas-backdrop">
          <section className={`funnel-canvas-shell ${previewMode ? "preview-mode" : ""}`}>
            <header className="funnel-canvas-topbar">
              <div><button onClick={() => setCanvasOpen(false)}><ArrowLeft size={17}/></button><span><small>{selectedFunnel?.brand_name}</small><strong>{selectedFunnel?.name || "Funil"}</strong></span><span className={`status-pill ${selectedFunnel?.status || "draft"}`}>{selectedFunnel?.status === "published" ? "Publicado" : "Rascunho"}</span></div>
              <div className="canvas-device-toggle"><button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")}><Monitor size={15}/></button><button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}><Smartphone size={15}/></button></div>
              <div><button className={`button button-secondary button-sm ${previewMode ? "active" : ""}`} onClick={() => setPreviewMode((current) => !current)}><Eye size={14}/>{previewMode ? "Editar" : "Pré-visualizar"}</button>{selectedFunnel?.status === "published" ? <button className="button button-secondary button-sm" onClick={() => changeStatus(selectedFunnel.id, "draft")}>Despublicar</button> : selectedFunnel && <button className="button button-secondary button-sm" onClick={() => changeStatus(selectedFunnel.id, "published")}><Rocket size={14}/> Publicar</button>}<button className="button button-primary button-sm" disabled={saving || !activeStep} onClick={saveActiveStep}>{saving ? <LoaderCircle className="spin" size={14}/> : <Save size={14}/>} Guardar</button></div>
            </header>

            {canvasLoading ? <div className="funnel-canvas-loading"><LoaderCircle className="spin" size={25}/><strong>A carregar o canvas...</strong></div> : (
              <div className="funnel-canvas-layout">
                {!previewMode && <aside className="funnel-step-rail">
                  <header><span><Workflow size={15}/> Etapas</span><em>{steps.length}</em></header>
                  <div>{steps.map((step, index) => {
                    const meta = stepTypeMeta[step.step_type] || { label: "Etapa", icon: CircleDot };
                    const Icon = meta.icon;
                    return <button className={activeStep?.id === step.id ? "active" : ""} key={step.id} onClick={() => setActiveStepId(step.id)}><span>{index + 1}</span><i><Icon size={16}/></i><div><strong>{step.title}</strong><small>{meta.label}</small></div><ChevronRight size={14}/></button>;
                  })}</div>
                  <footer><span><Check size={13}/> Todas as etapas estão ligadas</span></footer>
                </aside>}

                <main className="funnel-preview-stage">
                  <div className="preview-stage-toolbar"><span><Eye size={13}/> Preview da etapa</span><small>{device === "desktop" ? "Desktop 1440 px" : "Mobile 390 px"}</small></div>
                  {activeStep ? <FunnelStepPreview step={activeStep} content={activeContent} device={device}/> : <div className="studio-empty-wide"><h3>Este funil ainda não tem etapas.</h3></div>}
                  {saveNotice && <div className="canvas-save-notice"><CheckCircle2 size={14}/>{saveNotice}</div>}
                  {error && <div className="form-error canvas-error">{error}</div>}
                </main>

                {!previewMode && activeStep && <aside className="funnel-properties-panel">
                  <header><span><PanelRight size={15}/> Propriedades</span><small>{stepTypeMeta[activeStep.step_type]?.label || "Etapa"}</small></header>
                  <div className="property-scroll">
                    <label><span>Nome da etapa</span><input value={activeStep.title} onChange={(event) => updateActiveStepTitle(event.target.value)}/></label>
                    {activeStep.step_type === "email" && <label><span>Assunto do email</span><input value={activeContent.subject || ""} onChange={(event) => updateActiveStepContent({ subject: event.target.value })}/></label>}
                    <label><span>Eyebrow</span><input value={activeContent.eyebrow || ""} onChange={(event) => updateActiveStepContent({ eyebrow: event.target.value })}/></label>
                    <label><span>Título principal</span><textarea value={activeContent.headline || ""} onChange={(event) => updateActiveStepContent({ headline: event.target.value })}/></label>
                    <label><span>Descrição</span><textarea value={activeContent.body || ""} onChange={(event) => updateActiveStepContent({ body: event.target.value })}/></label>
                    {(activeStep.step_type === "checkout" || activeStep.step_type === "upsell") && <div className="property-two"><label><span>Preço</span><input value={activeContent.price || ""} onChange={(event) => updateActiveStepContent({ price: event.target.value })}/></label><label><span>Garantia</span><input value={activeContent.guarantee || ""} onChange={(event) => updateActiveStepContent({ guarantee: event.target.value })}/></label></div>}
                    <label><span>Texto do botão</span><input value={activeContent.button_label || ""} onChange={(event) => updateActiveStepContent({ button_label: event.target.value })}/></label>

                    <section className="media-property-card">
                      <header><ImageIcon size={14}/><span><strong>Imagem</strong><small>URL ou ficheiro até 1,2 MB</small></span></header>
                      <input value={activeContent.image_url || ""} onChange={(event) => updateActiveStepContent({ image_url: event.target.value })} placeholder="https://.../imagem.jpg"/>
                      <label className="media-upload-button"><Upload size={14}/> Carregar imagem<input type="file" accept="image/*" onChange={(event) => uploadHeroImage(event.target.files?.[0])}/></label>
                    </section>
                    <section className="media-property-card">
                      <header><Video size={14}/><span><strong>Vídeo</strong><small>YouTube, Vimeo ou MP4</small></span></header>
                      <input value={activeContent.video_url || ""} onChange={(event) => updateActiveStepContent({ video_url: event.target.value })} placeholder="https://youtube.com/watch?v=..."/>
                    </section>

                    <section className="block-library">
                      <header><LayoutTemplate size={14}/><span><strong>Adicionar bloco</strong><small>Constrói a etapa sem código.</small></span></header>
                      <div><button onClick={() => addBlock("text")}><AlignLeft size={15}/>Texto</button><button onClick={() => addBlock("benefit")}><CheckCircle2 size={15}/>Benefício</button><button onClick={() => addBlock("testimonial")}><Quote size={15}/>Testemunho</button><button onClick={() => addBlock("image")}><ImageIcon size={15}/>Imagem</button><button onClick={() => addBlock("video")}><Play size={15}/>Vídeo</button><button onClick={() => addBlock("button")}><MousePointerClick size={15}/>Botão</button></div>
                    </section>

                    {(activeContent.blocks || []).map((block, index) => <section className="block-editor-card" key={block.id}><header><span>Bloco {index + 1} · {block.type}</span><button onClick={() => removeBlock(block.id)}><Trash2 size={13}/></button></header>{block.type === "button" ? <input value={block.label || ""} onChange={(event) => updateBlock(block.id, { label: event.target.value })} placeholder="Texto do botão"/> : <><input value={block.title || ""} onChange={(event) => updateBlock(block.id, { title: event.target.value })} placeholder="Título"/>{["image", "video"].includes(block.type) ? <input value={block.url || ""} onChange={(event) => updateBlock(block.id, { url: event.target.value })} placeholder="URL da media"/> : <textarea value={block.text || ""} onChange={(event) => updateBlock(block.id, { text: event.target.value })} placeholder="Conteúdo do bloco"/>}</>}</section>)}
                  </div>
                </aside>}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function FunnelStepPreview({ step, content, device }: { step: FunnelStep; content: StepContent; device: "desktop" | "mobile" }) {
  const isEmail = step.step_type === "email";
  const isForm = step.step_type === "form";
  const hasVideo = Boolean(content.video_url);
  const videoSource = formatVideoUrl(content.video_url || "");
  const isEmbed = /youtube\.com\/embed|player\.vimeo\.com/.test(videoSource);

  if (isEmail) {
    return <article className={`funnel-page-preview email-preview ${device}`}><div className="email-chrome"><span/><span/><span/><strong>{content.subject || "Assunto do email"}</strong></div><div className="email-document"><span className="preview-logo"><Sparkles size={18}/> MarkAI</span><small>{content.eyebrow}</small><h1>{content.headline}</h1><p>{content.body}</p>{content.image_url && <div className="preview-media image" style={{ backgroundImage: `url(${content.image_url})` }}/>}<button>{content.button_label}</button><footer>Enviado com contexto da marca · Cancelar subscrição</footer></div></article>;
  }

  return (
    <article className={`funnel-page-preview ${device}`}>
      <nav><span className="preview-logo"><Sparkles size={18}/> {step.title.split(" ")[0]}</span><div><span>Benefícios</span><span>Como funciona</span><button>{content.button_label}</button></div></nav>
      <section className={`funnel-preview-hero ${content.image_url ? "has-image" : ""}`}>
        <div className="preview-hero-copy"><small>{content.eyebrow}</small><h1>{content.headline}</h1><p>{content.body}</p>{content.price && <div className="preview-price"><strong>{content.price}</strong><span>{content.guarantee || "Pagamento seguro"}</span></div>}{isForm ? <div className="preview-form">{(content.fields || ["Nome", "Email"]).map((field) => <label key={field}><span>{field}</span><input readOnly placeholder={field}/></label>)}<button>{content.button_label}</button></div> : <div className="preview-hero-actions"><button>{content.button_label}</button><span><CheckCircle2 size={14}/> Sem compromisso</span></div>}</div>
        <div className="preview-hero-media">
          {hasVideo ? isEmbed ? <iframe src={videoSource} title="Vídeo do funil" allow="autoplay; encrypted-media; picture-in-picture"/> : <video src={videoSource} controls/> : content.image_url ? <div className="preview-media image" style={{ backgroundImage: `url(${content.image_url})` }}/> : <div className="preview-media-placeholder"><ImageIcon size={35}/><strong>Adiciona uma imagem ou vídeo</strong><small>Usa o painel de propriedades</small></div>}
        </div>
      </section>
      <section className="preview-proof-strip"><span><strong>+34%</strong><small>mais clareza</small></span><span><strong>24/7</strong><small>sempre disponível</small></span><span><strong>4.9/5</strong><small>experiência</small></span></section>
      {(content.blocks || []).length > 0 && <section className="preview-blocks">{content.blocks?.map((block) => <PreviewBlock block={block} key={block.id}/>)}</section>}
      <footer className="preview-page-footer"><span>{step.title}</span><span>Privacidade · Termos</span></footer>
    </article>
  );
}

function PreviewBlock({ block }: { block: ContentBlock }) {
  if (block.type === "button") return <div className="preview-block button-block"><button>{block.label || "Continuar"}</button></div>;
  if (block.type === "image") return <div className="preview-block media-block">{block.url ? <div style={{ backgroundImage: `url(${block.url})` }}/> : <span><ImageIcon size={24}/>Imagem</span>}</div>;
  if (block.type === "video") {
    const source = formatVideoUrl(block.url || "");
    const embed = /youtube\.com\/embed|player\.vimeo\.com/.test(source);
    return <div className="preview-block media-block">{block.url ? embed ? <iframe src={source} title={block.title || "Vídeo"}/> : <video src={source} controls/> : <span><Play size={24}/>Vídeo</span>}</div>;
  }
  if (block.type === "testimonial") return <blockquote className="preview-block testimonial-block"><Quote size={21}/><p>{block.text}</p><strong>{block.title}</strong></blockquote>;
  if (block.type === "benefit") return <article className="preview-block benefit-block"><CheckCircle2 size={22}/><h3>{block.title}</h3><p>{block.text}</p></article>;
  return <article className="preview-block text-block"><Heading1 size={20}/><h3>{block.title}</h3><p>{block.text}</p></article>;
}
