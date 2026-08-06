"use client";

import { useState } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";

export function CancelPlanButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function cancelPlan() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });
      const data = (await response.json()) as { error?: string; endsAt?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível cancelar.");
      const date = data.endsAt ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "long" }).format(new Date(data.endsAt)) : "fim do período";
      setMessage(`Cancelamento agendado para ${date}.`);
      setOpen(false);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cancel-plan-wrap">
      {message && <div className="billing-inline-message">{message}</div>}
      {!open ? (
        <button className="button button-danger" type="button" onClick={() => setOpen(true)}>Cancelar plano</button>
      ) : (
        <div className="cancel-confirmation">
          <TriangleAlert size={18}/>
          <div><strong>Confirmar cancelamento?</strong><p>Continuas com acesso até ao fim do período atual.</p></div>
          <div className="cancel-actions">
            <button className="button button-ghost button-sm" type="button" onClick={() => setOpen(false)}>Voltar</button>
            <button className="button button-danger button-sm" disabled={loading} type="button" onClick={cancelPlan}>
              {loading ? <><LoaderCircle className="spin" size={14}/> A cancelar</> : "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
