"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

type Conversation = { id: string; title: string };
type Target = Conversation & { x: number; y: number };

export function ConversationActionsBridge() {
  const [target, setTarget] = useState<Target | null>(null);
  const [mode, setMode] = useState<"rename" | "delete" | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function handleClick(event: MouseEvent) {
      const element = event.target instanceof Element ? event.target : null;
      const ellipsis = element?.closest("svg.lucide-ellipsis, svg.lucide-more-horizontal");
      if (!ellipsis) return;

      const row = ellipsis.closest(".agent-history-group > button");
      if (!(row instanceof HTMLButtonElement)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const rows = Array.from(document.querySelectorAll<HTMLButtonElement>(".agent-history-group > button"));
      const index = rows.indexOf(row);
      if (index < 0) return;

      const query = document.querySelector<HTMLInputElement>(".agent-search input")?.value.trim() || "";
      try {
        const response = await fetch(`/api/chat${query ? `?q=${encodeURIComponent(query)}` : ""}`, { cache: "no-store" });
        const data = (await response.json()) as { conversations?: Conversation[] };
        const conversation = data.conversations?.[index];
        if (!response.ok || !conversation) return;

        const rect = row.getBoundingClientRect();
        setTarget({
          ...conversation,
          x: Math.max(12, Math.min(window.innerWidth - 210, rect.right - 185)),
          y: Math.min(window.innerHeight - 120, rect.bottom + 6),
        });
        setMode(null);
        setError("");
      } catch {
        // The history remains usable even if the contextual menu cannot be loaded.
      }
    }

    function closeOnOutside(event: MouseEvent) {
      const element = event.target instanceof Element ? event.target : null;
      if (element?.closest(".agent-conversation-actions, .agent-conversation-dialog")) return;
      if (!element?.closest("svg.lucide-ellipsis, svg.lucide-more-horizontal")) setTarget(null);
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("click", closeOnOutside, false);
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("click", closeOnOutside, false);
    };
  }, []);

  function beginRename() {
    if (!target) return;
    setTitle(target.title);
    setError("");
    setMode("rename");
  }

  function beginDelete() {
    setError("");
    setMode("delete");
  }

  async function renameConversation() {
    if (!target || title.trim().length < 2 || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/chat/conversation", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId: target.id, title: title.trim() }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível renomear a conversa.");
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível renomear a conversa.");
      setBusy(false);
    }
  }

  async function deleteConversation() {
    if (!target || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/chat/conversation?conversationId=${encodeURIComponent(target.id)}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível eliminar a conversa.");
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível eliminar a conversa.");
      setBusy(false);
    }
  }

  if (!target) return null;

  return (
    <>
      {!mode && (
        <div className="agent-conversation-actions" style={{ left: target.x, top: target.y }} role="menu" aria-label="Ações da conversa">
          <button type="button" onClick={beginRename}><Pencil size={14}/><span><strong>Renomear</strong><small>Alterar o nome da conversa</small></span></button>
          <button type="button" className="danger" onClick={beginDelete}><Trash2 size={14}/><span><strong>Eliminar</strong><small>Apagar esta conversa</small></span></button>
        </div>
      )}

      {mode && (
        <div className="agent-conversation-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) { setMode(null); setTarget(null); } }}>
          <section className="agent-conversation-dialog" role="dialog" aria-modal="true">
            <header>
              <div><span>{mode === "rename" ? <Pencil size={16}/> : <Trash2 size={16}/>}</span><div><small>Conversa</small><strong>{mode === "rename" ? "Renomear conversa" : "Eliminar conversa"}</strong></div></div>
              <button type="button" onClick={() => { if (!busy) { setMode(null); setTarget(null); } }}><X size={16}/></button>
            </header>

            {mode === "rename" ? (
              <div className="agent-conversation-dialog-body">
                <label><span>Novo nome</span><input autoFocus maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void renameConversation(); }}/></label>
                <p>Usa um nome curto para encontrares esta conversa rapidamente no histórico.</p>
              </div>
            ) : (
              <div className="agent-conversation-dialog-body delete-copy">
                <strong>Eliminar “{target.title}”?</strong>
                <p>Esta ação remove a conversa e as mensagens associadas. Não pode ser anulada.</p>
              </div>
            )}

            {error && <div className="agent-conversation-dialog-error">{error}</div>}
            <footer>
              <button type="button" onClick={() => setMode(null)} disabled={busy}>Cancelar</button>
              <button type="button" className={mode === "delete" ? "danger" : "primary"} disabled={busy || (mode === "rename" && title.trim().length < 2)} onClick={() => void (mode === "rename" ? renameConversation() : deleteConversation())}>
                {mode === "rename" ? <><Check size={14}/> Guardar nome</> : <><Trash2 size={14}/> Eliminar conversa</>}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
