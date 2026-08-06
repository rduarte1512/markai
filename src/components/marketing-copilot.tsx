"use client";

import { useMemo, useState } from "react";
import {
  ArrowUp, BarChart3, Bot, BrainCircuit, BriefcaseBusiness, CheckCircle2,
  ChevronRight, Clock3, FileText, Lightbulb, LoaderCircle, MessageSquare,
  MoreHorizontal, Paperclip, Plus, Search, ShieldCheck, Sparkles,
  Target, TrendingUp, UserRound, WandSparkles, Zap,
} from "lucide-react";
import { ModelPicker } from "@/components/model-picker";
import type { Brand, ModelAccess } from "@/lib/types";

const promptGroups = [
  { label: "Estratégia", icon: BrainCircuit, prompts: ["Analisa a oferta e encontra três oportunidades de crescimento.", "Cria um plano de campanha para os próximos 30 dias."] },
  { label: "Performance", icon: TrendingUp, prompts: ["Que testes A/B devo lançar primeiro?", "Revê esta campanha e identifica pontos de fuga."] },
  { label: "Conteúdo", icon: FileText, prompts: ["Cria cinco ângulos de conteúdo para esta marca.", "Transforma a proposta de valor num calendário semanal."] },
];

export function MarketingCopilot({ brands, models, initialBrandId, userName }: { brands: Brand[]; models: ModelAccess[]; initialBrandId?: string; userName: string }) {
  const firstModel = models.find((model) => model.available)?.key || models[0]?.key || "gpt-5.6-lua";
  const [brandId, setBrandId] = useState(initialBrandId || brands[0]?.id || "");
  const [modelKey, setModelKey] = useState(firstModel);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Olá! Já carreguei o contexto da marca ativa. Posso analisar a estratégia, criar campanhas, rever funis ou transformar uma ideia num plano de execução." },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rightTab, setRightTab] = useState<"context" | "insights">("context");
  const selectedBrand = brands.find((brand) => brand.id === brandId);
  const selectedModel = models.find((model) => model.key === modelKey);

  const contextScore = useMemo(() => {
    if (!selectedBrand) return 0;
    return Math.min(100, [selectedBrand.description, selectedBrand.audience, selectedBrand.tone_of_voice, selectedBrand.industry, selectedBrand.website].filter(Boolean).length * 18 + 10);
  }, [selectedBrand]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage || !brandId || loading) return;

    setMessages((current) => [...current, { role: "user", content: cleanMessage }]);
    setMessage("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, modelKey, message: cleanMessage, conversationId }),
      });
      const data = (await response.json()) as { error?: string; content?: string; conversationId?: string; creditsUsed?: number; demoMode?: boolean };
      if (!response.ok) throw new Error(data.error || "Não foi possível obter resposta.");
      setConversationId(data.conversationId || null);
      setMessages((current) => [...current, { role: "assistant", content: `${data.content || ""}${data.demoMode ? "\n\n— Modo demonstração ativo" : ""}` }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  function usePrompt(prompt: string) {
    setMessage(prompt);
  }

  function newConversation() {
    setConversationId(null);
    setMessages([{ role: "assistant", content: `Nova sessão iniciada para ${selectedBrand?.name || "a marca"}. Qual é o resultado que queres alcançar?` }]);
    setMessage("");
  }

  return (
    <div className="agent-v2 agent-v3">
      <section className="studio-hero agent-hero">
        <div>
          <span className="studio-kicker"><BrainCircuit size={14}/> Brand-aware intelligence</span>
          <h1>Um estratega de marketing que conhece a tua operação.</h1>
          <p>Conversa com contexto real da marca, modelos ajustáveis e sugestões prontas para transformar decisões em trabalho.</p>
          <div className="studio-hero-badges"><span><ShieldCheck size={14}/> Contexto privado</span><span><Zap size={14}/> Respostas orientadas à ação</span><span><CheckCircle2 size={14}/> Histórico por marca</span></div>
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
          <div className="agent-search"><Search size={15}/><input placeholder="Pesquisar conversas..."/></div>
          <div className="agent-history-group"><span>Hoje</span><button className="active"><MessageSquare size={15}/><div><strong>Estratégia da marca</strong><small>Agora</small></div><MoreHorizontal size={14}/></button><button><Target size={15}/><div><strong>Campanha de leads</strong><small>Há 2 horas</small></div></button></div>
          <div className="agent-history-group"><span>Esta semana</span><button><BarChart3 size={15}/><div><strong>Análise de performance</strong><small>Terça-feira</small></div></button><button><FileText size={15}/><div><strong>Plano editorial</strong><small>Segunda-feira</small></div></button></div>
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
              <div className={`agent-message ${item.role === "user" ? "user" : "assistant"}`} key={index}>
                <div className="agent-message-avatar">{item.role === "user" ? <UserRound size={16}/> : <Bot size={16}/>}</div>
                <div className="agent-message-content"><div className="agent-message-meta"><strong>{item.role === "user" ? userName : "MarkAI Strategist"}</strong><span>agora</span></div><div className="agent-message-bubble">{item.content}</div>{item.role === "assistant" && index > 0 && <div className="agent-message-actions"><button><CheckCircle2 size={13}/> Transformar em tarefa</button><button><FileText size={13}/> Guardar insight</button><button><MoreHorizontal size={13}/></button></div>}</div>
              </div>
            ))}
            {loading && <div className="agent-message assistant"><div className="agent-message-avatar"><Bot size={16}/></div><div className="agent-message-content"><div className="agent-message-meta"><strong>MarkAI Strategist</strong><span>a analisar</span></div><div className="agent-thinking"><span/><span/><span/><small>A cruzar Brand Kit, objetivo e histórico...</small></div></div></div>}
          </div>

          <div className="agent-composer-area agent-composer-area-v3">
            {error && <div className="form-error">{error}</div>}
            <div className="agent-suggestion-row"><button onClick={() => usePrompt("Cria um plano de ação com prioridades para esta semana.")}><Lightbulb size={13}/> Plano da semana</button><button onClick={() => usePrompt("Que oportunidade de crescimento estou a ignorar?")}><TrendingUp size={13}/> Encontrar oportunidade</button><button onClick={() => usePrompt("Revê o posicionamento e sugere uma versão mais forte.")}><Target size={13}/> Melhorar posicionamento</button></div>
            <form className="agent-composer agent-composer-v3" onSubmit={sendMessage}>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={brands.length ? `Pergunta qualquer coisa sobre ${selectedBrand?.name || "a marca"}...` : "Adiciona uma marca primeiro"} disabled={!brands.length || loading} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}/>
              <footer>
                <div><button type="button"><Paperclip size={16}/></button><button type="button"><Sparkles size={16}/> Ferramentas</button><span className="composer-model-chip"><BrainCircuit size={12}/>{selectedModel?.display_name || "Modelo"}</span></div>
                <div><span>{selectedModel?.credit_cost || 0} cr. por resposta</span><button className="agent-send-button" disabled={!message.trim() || !brandId || loading} type="submit">{loading ? <LoaderCircle className="spin" size={16}/> : <ArrowUp size={17}/>}</button></div>
              </footer>
            </form>
            <small className="agent-disclaimer">O MarkAI pode cometer erros. Confirma dados críticos antes de publicar.</small>
          </div>
        </main>

        <aside className="agent-context-panel">
          <div className="context-tabs"><button className={rightTab === "context" ? "active" : ""} onClick={() => setRightTab("context")}>Contexto</button><button className={rightTab === "insights" ? "active" : ""} onClick={() => setRightTab("insights")}>Insights</button></div>
          {rightTab === "context" ? <>
            <div className="context-brand-card"><header><span className="brand-select-avatar" style={{ background: `linear-gradient(135deg, ${selectedBrand?.primary_color || "#7c3aed"}, ${selectedBrand?.secondary_color || "#22d3ee"})` }}>{selectedBrand?.name?.slice(0, 2).toUpperCase() || "MK"}</span><div><small>Marca ativa</small><strong>{selectedBrand?.name || "Selecionar marca"}</strong></div></header><select value={brandId} onChange={(event) => { setBrandId(event.target.value); setConversationId(null); }}>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>
            <div className="context-score-card"><header><span>Qualidade do contexto</span><strong>{contextScore}%</strong></header><div className="mini-progress"><i style={{ width: `${contextScore}%` }}/></div><p>{contextScore >= 80 ? "O agente tem contexto suficiente para respostas muito específicas." : "Completa o Brand Kit para aumentar a precisão."}</p></div>
            <div className="context-detail-list"><div><span><BriefcaseBusiness size={14}/> Setor</span><strong>{selectedBrand?.industry || "Por definir"}</strong></div><div><span><Target size={14}/> Público</span><p>{selectedBrand?.audience || "Ainda sem público definido."}</p></div><div><span><MessageSquare size={14}/> Tom de voz</span><p>{selectedBrand?.tone_of_voice || "Ainda sem tom de voz definido."}</p></div><div><span><FileText size={14}/> Descrição</span><p>{selectedBrand?.description || "Completa o Brand Kit para enriquecer as respostas."}</p></div></div>
            <button className="context-edit-button">Editar Brand Kit <ChevronRight size={14}/></button>
          </> : <>
            <div className="agent-insight-card priority"><span><TrendingUp size={16}/></span><div><small>Oportunidade</small><strong>Reforçar prova social</strong><p>As campanhas podem ganhar clareza com resultados concretos e depoimentos.</p></div></div>
            <div className="agent-insight-card"><span><Target size={16}/></span><div><small>Foco recomendado</small><strong>Uma oferta principal</strong><p>Concentrar a comunicação num único benefício reduz fricção.</p></div></div>
            <div className="agent-insight-card"><span><Clock3 size={16}/></span><div><small>Próxima ação</small><strong>Criar teste A/B</strong><p>Testar urgência versus autoridade no próximo conjunto de anúncios.</p></div></div>
          </>}
        </aside>
      </section>
    </div>
  );
}
