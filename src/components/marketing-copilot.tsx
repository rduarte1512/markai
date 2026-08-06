"use client";

import { useState } from "react";
import { Bot, LoaderCircle, Send, Sparkles, UserRound } from "lucide-react";
import type { Brand, ModelAccess } from "@/lib/types";

export function MarketingCopilot({ brands, models, initialBrandId, userName }: { brands: Brand[]; models: ModelAccess[]; initialBrandId?: string; userName: string }) {
  const firstModel = models.find((model) => model.available)?.key || models[0]?.key || "gpt-5.6-lua";
  const [brandId, setBrandId] = useState(initialBrandId || brands[0]?.id || "");
  const [modelKey, setModelKey] = useState(firstModel);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Olá! Sou o teu Agente de Marketing. Seleciona uma marca e diz-me o que queres melhorar — campanha, oferta, funil, conteúdo ou estratégia." },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedBrand = brands.find((brand) => brand.id === brandId);
  const selectedModel = models.find((model) => model.key === modelKey);

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

  return (
    <section className="chat-shell">
      <aside className="chat-sidebar">
        <button className="button button-primary" style={{width: "100%"}} onClick={() => { setConversationId(null); setMessages([{ role: "assistant", content: "Nova conversa iniciada. Em que posso ajudar esta marca?" }]); }} type="button"><Sparkles size={15}/> Nova conversa</button>
        <h3>Contexto ativo</h3>
        <div className="field"><label>Marca</label><select className="select" value={brandId} onChange={(e) => { setBrandId(e.target.value); setConversationId(null); }}><option value="">Selecionar</option>{brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}</select></div>
        {selectedBrand && <div className="context-card" style={{marginTop: 12}}><strong>{selectedBrand.name}</strong><p>{selectedBrand.audience || selectedBrand.description || "Brand Kit em configuração."}</p></div>}
        <h3>Modelo</h3>
        <div className="field"><select className="select" value={modelKey} onChange={(e) => setModelKey(e.target.value)}>{models.map((model) => <option value={model.key} disabled={!model.available} key={model.key}>{model.display_name} · {model.credit_cost} cr.</option>)}</select></div>
        {selectedModel && <div className="context-card" style={{marginTop: 12}}><strong>{selectedModel.credit_cost} créditos por resposta</strong><p>{selectedModel.monthly_requests_used}/{selectedModel.monthly_request_limit} utilizações este mês.</p></div>}
      </aside>

      <div className="chat-main">
        <header className="chat-header">
          <div className="chat-agent"><div className="chat-agent-icon"><Bot size={18}/></div><div><strong>Agente de Marketing</strong><small>● Disponível com contexto da marca</small></div></div>
          <span className="badge badge-purple">{selectedModel?.display_name || "Seleciona um modelo"}</span>
        </header>

        <div className="chat-messages">
          {messages.map((item, index) => (
            <div className={`message ${item.role === "user" ? "user" : ""}`} key={index}>
              <div className="message-avatar">{item.role === "user" ? <UserRound size={15}/> : <Bot size={15}/>}</div>
              <div className="message-bubble">{item.content}</div>
            </div>
          ))}
          {loading && <div className="message"><div className="message-avatar"><Bot size={15}/></div><div className="message-bubble"><span className="loading-dots"><span/><span/><span/></span></div></div>}
        </div>

        <div className="chat-composer">
          {error && <div className="form-error" style={{marginBottom: 10}}>{error}</div>}
          <form className="chat-input-wrap" onSubmit={sendMessage}>
            <textarea className="chat-input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={brands.length ? `Pergunta sobre ${selectedBrand?.name || "a marca"}...` : "Adiciona uma marca primeiro"} disabled={!brands.length || loading} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
            <button className="button button-primary" disabled={!message.trim() || !brandId || loading} type="submit">{loading ? <LoaderCircle className="spin" size={16}/> : <Send size={16}/>}</button>
          </form>
          <div className="chat-footnote">{userName}, confirma sempre dados críticos antes de publicar campanhas.</div>
        </div>
      </div>
    </section>
  );
}
