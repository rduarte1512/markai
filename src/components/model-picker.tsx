"use client";

import {
  BrainCircuit, CheckCircle2, ChevronDown, Gauge, LockKeyhole, Zap,
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
  const selected = models.find((model) => model.key === value) || models.find((model) => model.available) || models[0];
  const availableCount = models.filter((model) => model.available).length;
  const lockedCount = Math.max(0, models.length - availableCount);

  if (!selected) return null;

  const remaining = Math.max(0, selected.monthly_request_limit - selected.monthly_requests_used);

  return (
    <div className={`model-picker-native-shell ${compact ? "compact" : ""}`}>
      <label className="model-picker-native-trigger">
        <span className="model-picker-native-icon"><BrainCircuit size={compact ? 18 : 23}/><i/></span>
        <span className="model-picker-native-copy">
          <small>{compact ? "Modelo de IA" : "Selecionar modelo de inteligência"}</small>
          <strong>{selected.display_name}</strong>
          {!compact && (
            <em>
              {CONSUMPTION_LABELS[selected.consumption_group]} · {selected.credit_cost} crédito{selected.credit_cost === 1 ? "" : "s"} por resposta
            </em>
          )}
        </span>
        <select
          aria-label="Selecionar modelo de inteligência artificial"
          value={selected.key}
          onChange={(event) => onChange(event.target.value)}
        >
          {models.map((model) => (
            <option disabled={!model.available} key={model.key} value={model.key}>
              {model.display_name} — {model.credit_cost} cr.{model.available ? "" : " — bloqueado"}
            </option>
          ))}
        </select>
        <span className="model-picker-native-cost"><Zap size={15}/>{selected.credit_cost} cr.</span>
        <ChevronDown className="model-picker-native-chevron" size={20}/>
      </label>

      {!compact && (
        <div className="model-picker-native-details">
          <span className="available"><CheckCircle2 size={15}/>{availableCount} modelo{availableCount === 1 ? "" : "s"} disponível{availableCount === 1 ? "" : "eis"}</span>
          <span><Gauge size={15}/>{remaining} pedidos restantes neste modelo</span>
          {lockedCount > 0 && <span className="locked"><LockKeyhole size={14}/>{lockedCount} bloqueado{lockedCount === 1 ? "" : "s"} pelo plano ou limite</span>}
        </div>
      )}
    </div>
  );
}
