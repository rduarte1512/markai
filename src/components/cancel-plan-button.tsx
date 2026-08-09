"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, TriangleAlert } from "lucide-react";

export function CancelPlanButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function cancelPlan() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });
      const data = (await response.json()) as { error?: string; plan?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível cancelar.");
      setMessage("Plano cancelado. A conta voltou imediatamente para o Free.");
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cancel-plan-wrap">
      {message && <div className="billing-inline-message"><CheckCircle2 size={15}/>{message}</div>}
      {!open ? (
        <button className="button button-danger" type="button" onClick={() => setOpen(true)}>Cancelar plano</button>
      ) : (
        <div className="cancel-confirmation">
          <TriangleAlert size={18}/>
          <div>
            <strong>Voltar imediatamente para o Free?</strong>
            <p>O plano pago termina já. Os limites, workspaces disponíveis e créditos passam imediatamente para os do plano Free.</p>
          </div>
          <div className="cancel-actions">
            <button className="button button-ghost button-sm" type="button" onClick={() => setOpen(false)}>Manter plano</button>
            <button className="button button-danger button-sm" disabled={loading} type="button" onClick={cancelPlan}>
              {loading ? <><LoaderCircle className="spin" size={14}/> A cancelar</> : "Cancelar agora"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
