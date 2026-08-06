"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrainCircuit, Check, ChevronDown, Gauge, LockKeyhole, Sparkles, Zap,
} from "lucide-react";
import { CONSUMPTION_LABELS } from "@/lib/constants";
import type { ModelAccess } from "@/lib/types";

export function ModelPicker({
  models,
  value,
  onChange,
  compact = false,
}: {
  models: ModelAccess[];
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = models.find((model) => model.key === value) || models[0];

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  if (!selected) return null;

  return (
    <div className={`model-picker ${compact ? "compact" : ""} ${open ? "open" : ""}`} ref={rootRef}>
      <button className="model-picker-trigger" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <span className="model-picker-icon"><BrainCircuit size={compact ? 15 : 18}/><i/></span>
        <span className="model-picker-copy">
          <small>{compact ? "Modelo" : "Modelo de inteligência"}</small>
          <strong>{selected.display_name}</strong>
          {!compact && <em>{CONSUMPTION_LABELS[selected.consumption_group]} · {selected.credit_cost} crédito{selected.credit_cost === 1 ? "" : "s"}</em>}
        </span>
        <span className="model-picker-cost"><Zap size={12}/>{selected.credit_cost} cr.</span>
        <ChevronDown className="model-picker-chevron" size={15}/>
      </button>

      {open && (
        <section className="model-picker-menu" role="listbox" aria-label="Escolher modelo de IA">
          <header>
            <div><Sparkles size={15}/><span><strong>Escolher inteligência</strong><small>Compara qualidade, custo e disponibilidade.</small></span></div>
            <span>{models.filter((model) => model.available).length} disponíveis</span>
          </header>
          <div className="model-picker-list">
            {models.map((model) => {
              const active = model.key === value;
              const remaining = Math.max(0, model.monthly_request_limit - model.monthly_requests_used);
              const usage = model.monthly_request_limit > 0
                ? Math.min(100, Math.round((model.monthly_requests_used / model.monthly_request_limit) * 100))
                : 100;
              return (
                <button
                  className={`${active ? "active" : ""} ${model.available ? "" : "locked"}`}
                  disabled={!model.available}
                  key={model.key}
                  onClick={() => {
                    onChange(model.key);
                    setOpen(false);
                  }}
                  role="option"
                  aria-selected={active}
                  type="button"
                >
                  <span className="model-option-icon"><BrainCircuit size={17}/></span>
                  <span className="model-option-main">
                    <span><strong>{model.display_name}</strong>{active && <em><Check size={11}/> Ativo</em>}</span>
                    <small>{model.description || "Modelo de inteligência para tarefas de marketing."}</small>
                    <span className="model-option-usage"><i><b style={{ width: `${usage}%` }}/></i><em>{model.available ? `${remaining} pedidos restantes` : "Limite ou plano insuficiente"}</em></span>
                  </span>
                  <span className="model-option-meta">
                    <strong>{model.credit_cost}<small> cr.</small></strong>
                    <em><Gauge size={11}/>{CONSUMPTION_LABELS[model.consumption_group]}</em>
                    {!model.available && <span><LockKeyhole size={11}/> Bloqueado</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <footer><span><Zap size={12}/> O custo é mostrado antes de cada resposta.</span><a href="/dashboard/credits">Ver créditos</a></footer>
        </section>
      )}
    </div>
  );
}
