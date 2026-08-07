"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, Crown, Loader2, LockKeyhole, Plus, Sparkles } from "lucide-react";
import { getPlan } from "@/lib/plans";
import type { PlanKey } from "@/lib/types";

export function WorkspaceCreateControl({ planKey, ownedCount }: { planKey: PlanKey; ownedCount: number }) {
  const plan = getPlan(planKey);
  const limit = plan.workspaceLimit;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const blocked = planKey === "free" || ownedCount >= limit;

  async function createWorkspace() {
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setError("Escreve um nome para o novo workspace.");
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

  if (planKey === "free") {
    return (
      <div className="workspace-quota-card locked">
        <div className="workspace-quota-copy">
          <span className="workspace-quota-icon"><LockKeyhole size={15}/></span>
          <div>
            <strong>Workspaces adicionais</strong>
            <small>O plano Free inclui apenas 1 workspace.</small>
          </div>
        </div>
        <Link href="/dashboard/plans" className="workspace-upgrade-link">
          <Sparkles size={14}/> Desbloquear Starter
        </Link>
      </div>
    );
  }

  return (
    <div className="workspace-create-zone">
      <div className="workspace-quota-row">
        <div>
          <span>Workspaces do plano</span>
          <strong>{ownedCount} / {limit}</strong>
        </div>
        <div className="workspace-quota-track"><span style={{ width: `${Math.min(100, (ownedCount / limit) * 100)}%` }}/></div>
      </div>

      {!open ? (
        <button className="workspace-create-button" type="button" disabled={blocked} onClick={() => setOpen(true)}>
          <span><Plus size={16}/></span>
          <div>
            <strong>{blocked ? "Limite de workspaces atingido" : "Criar novo workspace"}</strong>
            <small>{blocked ? `O ${plan.name} permite até ${limit}.` : "Separa outra operação, marca ou equipa."}</small>
          </div>
          {blocked ? <Crown size={15}/> : <Building2 size={15}/>} 
        </button>
      ) : (
        <div className="workspace-create-form">
          <div className="workspace-create-form-head">
            <span><Building2 size={16}/></span>
            <div><strong>Novo workspace</strong><small>Partilha o mesmo plano e os mesmos créditos.</small></div>
          </div>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void createWorkspace();
              if (event.key === "Escape") setOpen(false);
            }}
            placeholder="Ex.: Agência Lisboa"
            maxLength={70}
          />
          {error && <p>{error}</p>}
          <div className="workspace-create-actions">
            <button type="button" onClick={() => { setOpen(false); setError(""); }} disabled={loading}>Cancelar</button>
            <button type="button" className="primary" onClick={() => void createWorkspace()} disabled={loading}>
              {loading ? <Loader2 className="spin" size={14}/> : <Plus size={14}/>} Criar workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
