"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, Crown, Loader2, Plus, X } from "lucide-react";
import { getPlan } from "@/lib/plans";
import type { PlanKey } from "@/lib/types";

export function WorkspaceQuickCreate({ planKey, workspaceCount }: { planKey: PlanKey; workspaceCount: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const plan = getPlan(planKey);
  const blocked = planKey === "free" || workspaceCount >= plan.workspaceLimit;

  async function createWorkspace() {
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setError("Escreve um nome com pelo menos 2 caracteres.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: cleanName }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; next?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Não foi possível criar o workspace.");
      window.location.assign(payload?.next || "/onboarding");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o workspace.");
      setLoading(false);
    }
  }

  if (blocked) {
    return (
      <Link className="workspace-quick-create locked" href="/dashboard/plans">
        <span><Crown size={15}/></span>
        <div>
          <strong>Criar novo workspace</strong>
          <small>{planKey === "free" ? "Disponível a partir do Starter" : `Limite do ${plan.name} atingido`}</small>
        </div>
        <Plus size={15}/>
      </Link>
    );
  }

  if (!open) {
    return (
      <button className="workspace-quick-create" type="button" onClick={(event) => { event.stopPropagation(); setOpen(true); }}>
        <span><Plus size={15}/></span>
        <div><strong>Criar novo workspace</strong><small>{workspaceCount} de {plan.workspaceLimit} utilizados</small></div>
        <Building2 size={15}/>
      </button>
    );
  }

  return (
    <div className="workspace-quick-form" onClick={(event) => event.stopPropagation()}>
      <div className="workspace-quick-form-head">
        <span><Building2 size={15}/></span>
        <div><strong>Novo workspace</strong><small>Cria um contexto separado para outra operação.</small></div>
        <button type="button" aria-label="Fechar" onClick={() => { setOpen(false); setError(""); }}><X size={14}/></button>
      </div>
      <input
        autoFocus
        value={name}
        maxLength={70}
        placeholder="Ex.: Agência Lisboa"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void createWorkspace();
          if (event.key === "Escape") { setOpen(false); setError(""); }
        }}
      />
      {error && <p>{error}</p>}
      <button className="workspace-quick-submit" type="button" disabled={loading} onClick={() => void createWorkspace()}>
        {loading ? <Loader2 className="spin" size={14}/> : <Plus size={14}/>} {loading ? "A criar…" : "Criar workspace"}
      </button>
    </div>
  );
}
