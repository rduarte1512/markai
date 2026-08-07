"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp, BarChart3, Bot, BrainCircuit, BriefcaseBusiness, CheckCircle2,
  ChevronRight, Clock3, FileText, GitBranch, Image as ImageIcon, Lightbulb,
  LoaderCircle, Megaphone, MessageSquare, MoreHorizontal, Paperclip, Plus,
  Search, ShieldCheck, Sparkles, Target, TrendingUp, UserRound, Video, WandSparkles,
  X, Zap,
} from "lucide-react";
import { ModelPicker } from "@/components/model-picker";
import {
  getAttachmentCreditCost,
  getImageCreditCost,
  getVideoCreditCost,
  IMAGE_MODELS,
  VIDEO_MODELS,
  type AgentAttachment,
  type ImageModelKey,
  type ImageSize,
  type VideoDuration,
  type VideoModelKey,
  type VideoResolution,
} from "@/lib/agent-media";
import type { Brand, ModelAccess, PlanKey } from "@/lib/types";

const promptGroups = [
  { label: "Estratégia", icon: BrainCircuit, prompts: ["Analisa a oferta e encontra três oportunidades de crescimento.", "Cria um plano de campanha para os próximos 30 dias."] },
  { label: "Performance", icon: TrendingUp, prompts: ["Que testes A/B devo lançar primeiro?", "Revê esta campanha e identifica pontos de fuga."] },
  { label: "Conteúdo", icon: FileText, prompts: ["Cria cinco ângulos de conteúdo para esta marca.", "Transforma a proposta de valor num calendário semanal."] },
];

type ToolKey = "strategy" | "create_ad" | "campaign" | "funnel" | "content" | "analysis";
type MediaKind = "image" | "video";

type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  media?: { kind: MediaKind; src?: string; jobId?: string; status?: "processing" | "completed" | "failed" };
};

type ConversationListItem = {
  id: string;
  brand_id: string | null;
  brand_name?: string | null;
  title: string;
  preview?: string;
  created_at: string;
  updated_at: string;
};

const TOOLS: Array<{ key: ToolKey | MediaKind; label: string; description: string; icon: typeof Sparkles }> = [
  { key: "strategy", label: "Estratégia", description: "Prioridades, posicionamento e crescimento", icon: BrainCircuit },
  { key: "create_ad", label: "Criar anúncio", description: "Copy pronta para os principais canais", icon: Megaphone },
  { key: "campaign", label: "Criar campanha", description: "Objetivo, público, oferta e testes", icon: Target },
  { key: "funnel", label: "Analisar funil", description: "Fricção, conversão e próximos testes", icon: GitBranch },
  { key: "content", label: "Plano de conteúdo", description: "Calendário, formatos e hooks", icon: FileText },
  { key: "analysis", label: "Analisar operação", description: "Cruza os dados reais da marca", icon: BarChart3 },
  { key: "image", label: "Gerar imagem", description: "Nano Banana com custos por plano", icon: ImageIcon },
  { key: "video", label: "Gerar vídeo", description: "Veo e Gemini Omni nos planos pagos", icon: Video },
];

function formatHistoryGroup(value: string) {
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const stamp = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.floor((today - stamp) / 86_400_000);
  if (days <= 0) return "Hoje";
  if (days <= 7) return "Esta semana";
  return "Anteriores";
}

function formatHistoryTime(value: string) {
  const date = new Date(value);
  const group = formatHistoryGroup(value);
  if (group === "Hoje") return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(date);
  if (group === "Esta semana") return new Intl.DateTimeFormat("pt-PT", { weekday: "long" }).format(date);
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short" }).format(date);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("FILE_READ_FAILED"));
    reader.readAsDataURL(file);
  });
}

export function MarketingCopilot({ brands, models, initialBrandId, userName, planKey }: { brands: Brand[]; models: ModelAccess[]; initialBrandId?: string; userName: string; planKey: PlanKey }) {
  const firstModel = models.find((model) => model.available)?.key || models[0]?.key || "gpt-5.6-lua";
  const [brandId, setBrandId] = useState(initialBrandId || brands[0]?.id || "");
  const [modelKey, setModelKey] = useState(firstModel);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Olá! Já carreguei o contexto da marca ativa. Posso analisar a estratégia, criar campanhas, rever funis ou transformar uma ideia num plano de execução." },
  ]);
  const [attachments, setAttachments] = useState<AgentAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rightTab, setRightTab] = useState<"context" | "insights">("context");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolKey | null>(null);
  const [mediaOpen, setMediaOpen] = useState<MediaKind | null>(null);
  const [mediaPrompt, setMediaPrompt] = useState("");
  const [mediaLoading, setMediaLoading] = useState(false);
  const [imageModel, setImageModel] = useState<ImageModelKey>("nano-banana-2");
  const [imageSize, setImageSize] = useState<ImageSize>("1K");
  const [imageAspect, setImageAspect] = useState("1:1");
  const [videoModel, setVideoModel] = useState<VideoModelKey>(planKey === "starter" ? "veo-3.1-lite" : "veo-3.1-fast");
  const [videoDuration, setVideoDuration] = useState<VideoDuration>(4);
  const [videoResolution, setVideoResolution] = useState<VideoResolution>("720p");
  const [videoAspect, setVideoAspect] = useState("16:9");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedBrand = brands.find((brand) => brand.id === brandId);
  const selectedModel = models.find((model) => model.key === modelKey);

  const contextScore = useMemo(() => {
    if (!selectedBrand) return 0;
    return Math.min(100, [selectedBrand.description, selectedBrand.audience, selectedBrand.tone_of_voice, selectedBrand.industry, selectedBrand.website].filter(Boolean).length * 18 + 10);
  }, [selectedBrand]);

  const historyGroups = useMemo(() => {
    const groups = new Map<string, ConversationListItem[]>();
    conversations.forEach((item) => {
      const key = formatHistoryGroup(item.updated_at);
      groups.set(key, [...(groups.get(key) || []), item]);
    });
    return ["Hoje", "Esta semana", "Anteriores"].map((label) => ({ label, items: groups.get(label) || [] })).filter((group) => group.items.length);
  }, [conversations]);

  const imageCredits = getImageCreditCost(planKey, imageModel, imageSize);
  const videoCredits = getVideoCreditCost(planKey, videoModel, videoDuration, videoResolution);

  async function loadConversations(query = historyQuery) {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/chat${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`, { cache: "no-store" });
      const data = (await response.json()) as { conversations?: ConversationListItem[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar o histórico.");
      setConversations(data.conversations || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao carregar o histórico.");
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => { void loadConversations(""); }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadConversations(historyQuery), 250);
    return () => window.clearTimeout(timer);
  }, [historyQuery]);

  async function pollVideoJob(jobId: string) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 5000));
      try {
        const response = await fetch(`/api/media/video?jobId=${encodeURIComponent(jobId)}`, { cache: "no-store" });
        const data = (await response.json()) as { status?: string; downloadUrl?: string; error?: string };
        if (data.status === "completed" && data.downloadUrl) {
          setMessages((current) => current.map((item) => item.media?.jobId === jobId ? { ...item, media: { ...item.media, status: "completed", src: data.downloadUrl } } : item));
          return;
        }
        if (!response.ok || data.status === "failed") {
          setMessages((current) => current.map((item) => item.media?.jobId === jobId ? { ...item, media: { ...item.media, status: "failed" }, content: data.error || "A geração de vídeo falhou." } : item));
          return;
        }
      } catch {
        if (attempt === 119) setError("A geração continua no servidor. Reabre a conversa mais tarde para verificar o vídeo.");
      }
    }
  }

  async function openConversation(id: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/chat?conversationId=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = (await response.json()) as {
        error?: string;
        conversation?: { id: string; brand_id: string | null };
        messages?: Array<{ id: string; role: "user" | "assistant" | "system"; content: string; created_at: string; metadata?: Record<string, unknown> }>;
      };
      if (!response.ok || !data.conversation) throw new Error(data.error || "Não foi possível abrir a conversa.");
      setConversationId(data.conversation.id);
      if (data.conversation.brand_id) setBrandId(data.conversation.brand_id);
      const mapped: ChatMessage[] = (data.messages || []).filter((item) => item.role !== "system").map((item) => {
        const mediaKind = item.metadata?.mediaKind;
        const jobId = typeof item.metadata?.jobId === "string" ? item.metadata.jobId : undefined;
        return {
          id: item.id,
          role: item.role as "user" | "assistant",
          content: item.content,
          createdAt: item.created_at,
          media: mediaKind === "video" && jobId ? { kind: "video", jobId, status: "processing" } : undefined,
        };
      });
      setMessages(mapped.length ? mapped : [{ role: "assistant", content: "Conversa vazia. Como posso ajudar?" }]);
      mapped.filter((item) => item.media?.jobId).forEach((item) => void pollVideoJob(item.media!.jobId!));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao abrir a conversa.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMessage = message.trim();
    if ((!cleanMessage && !attachments.length) || !brandId || loading) return;

    const localContent = [cleanMessage || "Analisa o ficheiro anexado.", attachments.length ? `\nAnexos: ${attachments.map((item) => item.name).join(", ")}` : ""].join("");
    setMessages((current) => [...current, { role: "user", content: localContent }]);
    const outgoingAttachments = attachments;
    setMessage("");
    setAttachments([]);
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, modelKey, message: cleanMessage, conversationId, attachments: outgoingAttachments, tool: activeTool }),
      });
      const data = (await response.json()) as { error?: string; content?: string; conversationId?: string; creditsUsed?: number; balanceRemaining?: number; demoMode?: boolean };
      if (!response.ok) throw new Error(data.error || "Não foi possível obter resposta.");
      setConversationId(data.conversationId || null);
      setMessages((current) => [...current, { role: "assistant", content: `${data.content || ""}${data.demoMode ? "\n\n— Modo demonstração ativo" : ""}` }]);
      if (typeof data.balanceRemaining === "number") window.dispatchEvent(new CustomEvent("markai:credits-updated", { detail: { balance: data.balanceRemaining } }));
      await loadConversations("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
      setAttachments(outgoingAttachments);
    } finally {
      setLoading(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const next: AgentAttachment[] = [];
    for (const file of Array.from(files).slice(0, Math.max(0, 5 - attachments.length))) {
      if (file.size > 6 * 1024 * 1024) {
        setError(`${file.name} ultrapassa o limite de 6 MB por ficheiro.`);
        continue;
      }
      const base = { name: file.name, mimeType: file.type || "application/octet-stream", size: file.size };
      try {
        if (file.type.startsWith("image/")) next.push({ ...base, dataUrl: await readAsDataUrl(file) });
        else if (file.type.startsWith("text/") || /\.(txt|md|csv|json|xml|html|css|js|ts|tsx|jsx)$/i.test(file.name)) next.push({ ...base, text: await file.text() });
        else next.push(base);
      } catch {
        setError(`Não foi possível ler ${file.name}.`);
      }
    }
    setAttachments((current) => [...current, ...next].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function usePrompt(prompt: string) { setMessage(prompt); }

  function newConversation() {
    setConversationId(null);
    setMessages([{ role: "assistant", content: `Nova sessão iniciada para ${selectedBrand?.name || "a marca"}. Qual é o resultado que queres alcançar?` }]);
    setMessage("");
    setAttachments([]);
    setActiveTool(null);
    setError("");
  }

  function chooseTool(key: ToolKey | MediaKind) {
    setToolsOpen(false);
    if (key === "image" || key === "video") {
      setMediaOpen(key);
      setMediaPrompt(message.trim());
      return;
    }
    setActiveTool(key);
    const starter: Partial<Record<ToolKey, string>> = {
      strategy: "Analisa a situação atual desta marca e define as três prioridades com maior impacto.",
      create_ad: "Cria um anúncio de alta conversão para esta marca e recomenda o melhor canal e teste A/B.",
      campaign: "Cria uma campanha completa para esta marca com objetivo, público, oferta, canais e testes.",
      funnel: "Analisa o funil desta marca, encontra fricções e propõe melhorias priorizadas.",
      content: "Cria um plano de conteúdo executável para os próximos 7 dias.",
      analysis: "Analisa os dados reais disponíveis nesta operação e diz-me o que merece atenção primeiro.",
    };
    if (!message.trim()) setMessage(starter[key] || "");
  }

  async function generateImage() {
    if (!brandId || mediaPrompt.trim().length < 3 || !imageCredits) return;
    setMediaLoading(true);
    setError("");
    try {
      const response = await fetch("/api/media/image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandId, conversationId, prompt: mediaPrompt.trim(), model: imageModel, size: imageSize, aspectRatio: imageAspect }),
      });
      const data = (await response.json()) as { image?: string; error?: string; balanceRemaining?: number };
      if (!response.ok || !data.image) throw new Error(data.error || "Não foi possível gerar a imagem.");
      setMessages((current) => [...current, { role: "assistant", content: `Imagem gerada com ${IMAGE_MODELS[imageModel].label} · ${imageSize} · ${imageAspect}`, media: { kind: "image", src: data.image, status: "completed" } }]);
      if (typeof data.balanceRemaining === "number") window.dispatchEvent(new CustomEvent("markai:credits-updated", { detail: { balance: data.balanceRemaining } }));
      setMediaOpen(null);
      setMediaPrompt("");
      await loadConversations("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao gerar imagem.");
    } finally {
      setMediaLoading(false);
    }
  }

  async function generateVideo() {
    if (!brandId || mediaPrompt.trim().length < 4 || !videoCredits || planKey === "free") return;
    setMediaLoading(true);
    setError("");
    try {
      const response = await fetch("/api/media/video", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandId, conversationId, prompt: mediaPrompt.trim(), model: videoModel, duration: videoDuration, resolution: videoResolution, aspectRatio: videoAspect }),
      });
      const data = (await response.json()) as { jobId?: string; error?: string; balanceRemaining?: number };
      if (!response.ok || !data.jobId) throw new Error(data.error || "Não foi possível iniciar o vídeo.");
      const jobId = data.jobId;
      setMessages((current) => [...current, { role: "assistant", content: `A gerar vídeo com ${VIDEO_MODELS[videoModel].label} · ${videoResolution} · ${videoDuration}s`, media: { kind: "video", jobId, status: "processing" } }]);
      if (typeof data.balanceRemaining === "number") window.dispatchEvent(new CustomEvent("markai:credits-updated", { detail: { balance: data.balanceRemaining } }));
      setMediaOpen(null);
      setMediaPrompt("");
      setMediaLoading(false);
      void pollVideoJob(jobId);
      await loadConversations("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao gerar vídeo.");
      setMediaLoading(false);
    }
  }

  function updateVideoModel(value: VideoModelKey) {
    setVideoModel(value);
    const config = VIDEO_MODELS[value];
    const firstResolution = config.resolutions[0];
    setVideoResolution(firstResolution);
    if (firstResolution !== "720p") setVideoDuration(8);
  }

  function updateVideoResolution(value: VideoResolution) {
    setVideoResolution(value);
    if (value !== "720p") setVideoDuration(8);
  }

  return (
    <div className="agent-v2 agent-v3 agent-functional-v4">
      <section className="studio-hero agent-hero">
        <div>
          <span className="studio-kicker"><BrainCircuit size={14}/> Brand-aware intelligence</span>
          <h1>Um estratega de marketing que conhece a tua operação.</h1>
          <p>Conversa com contexto real da marca, modelos ajustáveis e ferramentas prontas para transformar decisões em trabalho.</p>
          <div className="studio-hero-badges"><span><ShieldCheck size={14}/> Contexto privado</span><span><Zap size={14}/> Dados reais da app</span><span><CheckCircle2 size={14}/> Histórico persistente</span></div>
        </div>
        <div className="agent-status-card">
          <span className="agent-orb"><Bot size={27}/><i/></span>
          <div><small>Agente ativo</small><strong>MarkAI Strategist</strong><p>{selectedBrand ? `Ligado ao Brand Kit de ${selectedBrand.name}` : "Seleciona uma marca para começar"}</p></div>
          <span className="online-pill">Online</span>
        </div>
      </section>

      <section className="agent-workspace">
        <aside className="agent-history-panel">
          <button className="button button-primary new-chat-button" onClick={newConversation}><Plus size={15}/> Nova conversa</button>
          <div className="agent-search"><Search size={15}/><input value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="Pesquisar conversas..."/></div>
          {historyLoading ? <div className="agent-history-loading"><LoaderCircle className="spin" size={16}/> A carregar...</div> : historyGroups.length ? historyGroups.map((group) => (
            <div className="agent-history-group" key={group.label}>
              <span>{group.label}</span>
              {group.items.map((conversation) => (
                <button className={conversation.id === conversationId ? "active" : ""} key={conversation.id} onClick={() => void openConversation(conversation.id)}>
                  <MessageSquare size={15}/><div><strong>{conversation.title}</strong><small>{conversation.brand_name ? `${conversation.brand_name} · ` : ""}{formatHistoryTime(conversation.updated_at)}</small></div><MoreHorizontal size={14}/>
                </button>
              ))}
            </div>
          )) : <div className="agent-history-empty"><MessageSquare size={18}/><strong>Sem conversas</strong><small>As conversas guardadas vão aparecer aqui.</small></div>}
          <div className="agent-history-footer"><Sparkles size={15}/><div><strong>Memória da marca</strong><small>{contextScore}% do contexto preenchido</small></div></div>
        </aside>

        <main className="agent-chat-panel">
          <header className="agent-chat-header agent-chat-header-v3">
            <div><span className="chat-agent-icon premium"><Bot size={19}/><i/></span><div><strong>MarkAI Strategist</strong><small>Contexto: {selectedBrand?.name || "Sem marca"}</small></div></div>
            <div className="agent-header-controls agent-model-control"><ModelPicker models={models} value={modelKey} onChange={setModelKey}/><button aria-label="Mais opções"><MoreHorizontal size={17}/></button></div>
          </header>

          <div className="agent-message-stream">
            {messages.length === 1 && (
              <section className="agent-welcome">
                <span className="agent-welcome-icon"><WandSparkles size={25}/></span>
                <h2>Em que vamos trabalhar, {userName.split(" ")[0]}?</h2>
                <p>Escolhe uma direção ou escreve o objetivo diretamente.</p>
                <div className="agent-prompt-grid">{promptGroups.map(({ label, icon: Icon, prompts }) => <article key={label}><header><Icon size={16}/><strong>{label}</strong></header>{prompts.map((prompt) => <button key={prompt} onClick={() => usePrompt(prompt)}>{prompt}<ChevronRight size={14}/></button>)}</article>)}</div>
              </section>
            )}
            {messages.map((item, index) => (
              <div className={`agent-message ${item.role === "user" ? "user" : "assistant"}`} key={item.id || `${item.role}-${index}`}>
                <div className="agent-message-avatar">{item.role === "user" ? <UserRound size={16}/> : <Bot size={16}/>}</div>
                <div className="agent-message-content">
                  <div className="agent-message-meta"><strong>{item.role === "user" ? userName : "MarkAI Strategist"}</strong><span>{item.createdAt ? formatHistoryTime(item.createdAt) : "agora"}</span></div>
                  <div className="agent-message-bubble">{item.content}</div>
                  {item.media?.kind === "image" && item.media.src && <div className="agent-generated-media"><img src={item.media.src} alt="Imagem gerada pelo MarkAI"/></div>}
                  {item.media?.kind === "video" && <div className="agent-generated-media video">{item.media.status === "completed" && item.media.src ? <video src={item.media.src} controls playsInline/> : item.media.status === "failed" ? <div className="media-failed"><X size={17}/> Geração falhou</div> : <div className="media-processing"><LoaderCircle className="spin" size={17}/> O vídeo está a ser gerado. Podes continuar a usar a app.</div>}</div>}
                  {item.role === "assistant" && index > 0 && <div className="agent-message-actions"><button><CheckCircle2 size={13}/> Transformar em tarefa</button><button><FileText size={13}/> Guardar insight</button><button><MoreHorizontal size={13}/></button></div>}
                </div>
              </div>
            ))}
            {loading && <div className="agent-message assistant"><div className="agent-message-avatar"><Bot size={16}/></div><div className="agent-message-content"><div className="agent-message-meta"><strong>MarkAI Strategist</strong><span>a analisar</span></div><div className="agent-thinking"><span/><span/><span/><small>A cruzar Brand Kit, campanhas, anúncios, funis e histórico...</small></div></div></div>}
          </div>

          <div className="agent-composer-area agent-composer-area-v3">
            {error && <div className="form-error">{error}</div>}
            {activeTool && <div className="active-agent-tool"><Sparkles size={13}/><span>Ferramenta: {TOOLS.find((tool) => tool.key === activeTool)?.label}</span><button type="button" onClick={() => setActiveTool(null)}><X size={13}/></button></div>}
            {attachments.length > 0 && <div className="agent-attachment-row">{attachments.map((item, index) => <div className="agent-attachment-chip" key={`${item.name}-${index}`}><Paperclip size={13}/><span><strong>{item.name}</strong><small>{Math.max(1, Math.round(item.size / 1024))} KB · ~{getAttachmentCreditCost(item.size)} cr.</small></span><button type="button" onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X size={13}/></button></div>)}</div>}
            <div className="agent-suggestion-row"><button onClick={() => usePrompt("Cria um plano de ação com prioridades para esta semana.")}><Lightbulb size={13}/> Plano da semana</button><button onClick={() => usePrompt("Que oportunidade de crescimento estou a ignorar?")}><TrendingUp size={13}/> Encontrar oportunidade</button><button onClick={() => usePrompt("Revê o posicionamento e sugere uma versão mais forte.")}><Target size={13}/> Melhorar posicionamento</button></div>
            <form className="agent-composer agent-composer-v3" onSubmit={sendMessage}>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={brands.length ? `Pergunta qualquer coisa sobre ${selectedBrand?.name || "a marca"}...` : "Adiciona uma marca primeiro"} disabled={!brands.length || loading} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}/>
              <footer>
                <div className="agent-composer-tools">
                  <input ref={fileInputRef} type="file" multiple hidden onChange={(event) => void handleFiles(event.target.files)} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Anexar ficheiro"><Paperclip size={16}/></button>
                  <div className="agent-tools-wrap">
                    <button type="button" className={toolsOpen ? "active" : ""} onClick={() => setToolsOpen((value) => !value)}><Sparkles size={16}/> Ferramentas</button>
                    {toolsOpen && <div className="agent-tools-menu">{TOOLS.map(({ key, label, description, icon: Icon }) => <button type="button" key={key} onClick={() => chooseTool(key)}><span><Icon size={16}/></span><div><strong>{label}</strong><small>{description}</small></div><ChevronRight size={13}/></button>)}</div>}
                  </div>
                  <span className="composer-model-chip"><BrainCircuit size={12}/>{selectedModel?.display_name || "Modelo"}</span>
                </div>
                <div><span>{selectedModel?.credit_cost || 0} cr. resposta{attachments.length ? ` + ${attachments.reduce((sum, item) => sum + getAttachmentCreditCost(item.size), 0)} cr. anexos` : ""}</span><button className="agent-send-button" disabled={(!message.trim() && !attachments.length) || !brandId || loading} type="submit">{loading ? <LoaderCircle className="spin" size={16}/> : <ArrowUp size={17}/>}</button></div>
              </footer>
            </form>
            <small className="agent-disclaimer">O MarkAI pode cometer erros. Confirma dados críticos antes de publicar.</small>
          </div>
        </main>

        <aside className="agent-context-panel">
          <div className="context-tabs"><button className={rightTab === "context" ? "active" : ""} onClick={() => setRightTab("context")}>Contexto</button><button className={rightTab === "insights" ? "active" : ""} onClick={() => setRightTab("insights")}>Insights</button></div>
          {rightTab === "context" ? <>
            <div className="context-brand-card"><header><span className="brand-select-avatar" style={{ background: `linear-gradient(135deg, ${selectedBrand?.primary_color || "#7c3aed"}, ${selectedBrand?.secondary_color || "#22d3ee"})` }}>{selectedBrand?.name?.slice(0, 2).toUpperCase() || "MK"}</span><div><small>Marca ativa</small><strong>{selectedBrand?.name || "Selecionar marca"}</strong></div></header><select value={brandId} onChange={(event) => { setBrandId(event.target.value); setConversationId(null); newConversation(); }}>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>
            <div className="context-score-card"><header><span>Qualidade do contexto</span><strong>{contextScore}%</strong></header><div className="mini-progress"><i style={{ width: `${contextScore}%` }}/></div><p>{contextScore >= 80 ? "O agente tem contexto suficiente para respostas muito específicas." : "Completa o Brand Kit para aumentar a precisão."}</p></div>
            <div className="context-detail-list"><div><span><BriefcaseBusiness size={14}/> Setor</span><strong>{selectedBrand?.industry || "Por definir"}</strong></div><div><span><Target size={14}/> Público</span><p>{selectedBrand?.audience || "Ainda sem público definido."}</p></div><div><span><MessageSquare size={14}/> Tom de voz</span><p>{selectedBrand?.tone_of_voice || "Ainda sem tom de voz definido."}</p></div><div><span><FileText size={14}/> Descrição</span><p>{selectedBrand?.description || "Completa o Brand Kit para enriquecer as respostas."}</p></div></div>
            {selectedBrand && <Link className="context-edit-button" href={`/dashboard/brands/${selectedBrand.id}`}>Editar Brand Kit <ChevronRight size={14}/></Link>}
          </> : <>
            <div className="agent-insight-card priority"><span><TrendingUp size={16}/></span><div><small>Oportunidade</small><strong>Reforçar prova social</strong><p>As campanhas podem ganhar clareza com resultados concretos e depoimentos.</p></div></div>
            <div className="agent-insight-card"><span><Target size={16}/></span><div><small>Foco recomendado</small><strong>Uma oferta principal</strong><p>Concentrar a comunicação num único benefício reduz fricção.</p></div></div>
            <div className="agent-insight-card"><span><Clock3 size={16}/></span><div><small>Próxima ação</small><strong>Criar teste A/B</strong><p>Testar urgência versus autoridade no próximo conjunto de anúncios.</p></div></div>
          </>}
        </aside>
      </section>

      {mediaOpen && <div className="agent-media-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !mediaLoading) setMediaOpen(null); }}>
        <section className="agent-media-modal">
          <header><div><span>{mediaOpen === "image" ? <ImageIcon size={18}/> : <Video size={18}/>}</span><div><small>Ferramenta criativa</small><strong>{mediaOpen === "image" ? "Gerar imagem" : "Gerar vídeo"}</strong></div></div><button type="button" onClick={() => !mediaLoading && setMediaOpen(null)}><X size={17}/></button></header>
          {mediaOpen === "video" && planKey === "free" ? <div className="agent-media-upgrade"><Video size={26}/><strong>Vídeo está disponível nos planos pagos.</strong><p>Starter desbloqueia Veo 3.1 Lite e Fast. Pro e Agency desbloqueiam também Veo 3.1 e Gemini Omni Flash.</p><Link href="/dashboard/plans">Ver planos</Link></div> : <>
            <label className="agent-media-prompt"><span>Prompt</span><textarea value={mediaPrompt} onChange={(event) => setMediaPrompt(event.target.value)} placeholder={mediaOpen === "image" ? "Ex.: anúncio premium para uma marca de relógios..." : "Ex.: vídeo vertical de produto, iluminação cinematográfica..."}/></label>
            {mediaOpen === "image" ? <div className="agent-media-options">
              <label><span>Modelo</span><select value={imageModel} onChange={(event) => setImageModel(event.target.value as ImageModelKey)}><option value="nano-banana-2">Nano Banana 2</option><option value="nano-banana-pro" disabled={!(["pro", "agency"] as PlanKey[]).includes(planKey)}>Nano Banana Pro · Pro+</option></select></label>
              <label><span>Resolução</span><select value={imageSize} onChange={(event) => setImageSize(event.target.value as ImageSize)}><option>1K</option><option>2K</option><option>4K</option></select></label>
              <label><span>Formato</span><select value={imageAspect} onChange={(event) => setImageAspect(event.target.value)}><option>1:1</option><option>16:9</option><option>9:16</option><option>4:5</option></select></label>
            </div> : <div className="agent-media-options video-options">
              <label><span>Modelo</span><select value={videoModel} onChange={(event) => updateVideoModel(event.target.value as VideoModelKey)}>{Object.entries(VIDEO_MODELS).map(([key, config]) => <option key={key} value={key} disabled={!config.plans.includes(planKey)}>{config.label}{config.plans.includes(planKey) ? "" : " · plano superior"}</option>)}</select></label>
              <label><span>Resolução</span><select value={videoResolution} onChange={(event) => updateVideoResolution(event.target.value as VideoResolution)}>{VIDEO_MODELS[videoModel].resolutions.map((resolution) => <option key={resolution}>{resolution}</option>)}</select></label>
              <label><span>Duração</span><select value={videoDuration} onChange={(event) => setVideoDuration(Number(event.target.value) as VideoDuration)}>{([4, 6, 8] as VideoDuration[]).map((duration) => <option key={duration} value={duration} disabled={videoResolution !== "720p" && duration !== 8}>{duration}s{videoResolution !== "720p" && duration !== 8 ? " · requer 8s" : ""}</option>)}</select></label>
              <label><span>Formato</span><select value={videoAspect} onChange={(event) => setVideoAspect(event.target.value)}><option>16:9</option><option>9:16</option></select></label>
            </div>}
            <div className="agent-media-cost"><div><small>Custo estimado</small><strong>{mediaOpen === "image" ? imageCredits ?? "—" : videoCredits ?? "—"} créditos</strong></div><p>{mediaOpen === "image" ? (planKey === "free" ? "No Free, a geração visual tem um custo premium." : "Os planos pagos têm um custo de geração mais equilibrado.") : "Mais duração e resolução aumentam o custo. 1080p e 4K em Veo requerem 8 segundos."}</p></div>
            <footer><button type="button" onClick={() => setMediaOpen(null)} disabled={mediaLoading}>Cancelar</button><button type="button" className="primary" disabled={mediaLoading || mediaPrompt.trim().length < 3 || (mediaOpen === "image" ? !imageCredits : !videoCredits)} onClick={() => void (mediaOpen === "image" ? generateImage() : generateVideo())}>{mediaLoading ? <LoaderCircle className="spin" size={15}/> : mediaOpen === "image" ? <ImageIcon size={15}/> : <Video size={15}/>} Gerar</button></footer>
          </>}
        </section>
      </div>}
    </div>
  );
}
