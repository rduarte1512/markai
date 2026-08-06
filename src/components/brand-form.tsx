"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, LoaderCircle, Sparkles } from "lucide-react";

export function BrandForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    website: "",
    description: "",
    audience: "",
    toneOfVoice: "",
    primaryColor: "#8B5CF6",
    secondaryColor: "#22D3EE",
    values: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function suggestBrandKit() {
    if (!form.name || !form.description) {
      setError("Indica o nome e uma breve descrição para a IA criar o Brand Kit.");
      return;
    }

    setSuggesting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/brand-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as {
        error?: string;
        audience?: string;
        toneOfVoice?: string;
        values?: string[];
        creditsUsed?: number;
        demoMode?: boolean;
      };
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar o Brand Kit.");

      setForm((current) => ({
        ...current,
        audience: data.audience || current.audience,
        toneOfVoice: data.toneOfVoice || current.toneOfVoice,
        values: data.values?.join(", ") || current.values,
      }));
      setNotice(`Sugestões aplicadas · ${data.creditsUsed || 1} crédito usado${data.demoMode ? " · modo demonstração" : ""}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao gerar o Brand Kit.");
    } finally {
      setSuggesting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { error?: string; brandId?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível criar a marca.");

      router.push(`/dashboard/brands/${data.brandId}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao criar a marca.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="field"><label>Nome da marca</label><input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex.: Chrono Prestige" required /></div>
        <div className="field"><label>Setor</label><input className="input" value={form.industry} onChange={(e) => update("industry", e.target.value)} placeholder="Ex.: Relógios de luxo" /></div>
      </div>
      <div className="field"><label>Website</label><input className="input" value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://marca.com" type="url" /></div>
      <div className="field"><label>O que vende e qual é a proposta de valor?</label><textarea className="textarea" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Descreve os produtos, diferenciação, mercado e objetivo da marca." required /></div>

      <div className="cost-preview">
        <span><Bot size={15} style={{verticalAlign: "middle", marginRight: 7}}/>A IA pode sugerir público, tom e valores</span>
        <button className="button button-secondary button-sm" type="button" onClick={suggestBrandKit} disabled={suggesting}>
          {suggesting ? <><LoaderCircle className="spin" size={14}/> A gerar</> : <><Sparkles size={14}/> Sugerir por 1 crédito</>}
        </button>
      </div>

      <div className="field"><label>Público-alvo</label><textarea className="textarea" value={form.audience} onChange={(e) => update("audience", e.target.value)} placeholder="Quem compra, principais necessidades, localização e poder de compra." /></div>
      <div className="field"><label>Tom de voz</label><input className="input" value={form.toneOfVoice} onChange={(e) => update("toneOfVoice", e.target.value)} placeholder="Ex.: premium, confiante, elegante e direto" /></div>
      <div className="field"><label>Valores da marca</label><input className="input" value={form.values} onChange={(e) => update("values", e.target.value)} placeholder="Qualidade, exclusividade, confiança" /></div>
      <div className="form-row">
        <div className="field"><label>Cor principal</label><input className="input" value={form.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} type="color" /></div>
        <div className="field"><label>Cor secundária</label><input className="input" value={form.secondaryColor} onChange={(e) => update("secondaryColor", e.target.value)} type="color" /></div>
      </div>
      {error && <div className="form-error">{error}</div>}
      {notice && <div className="form-success">{notice}</div>}
      <div className="page-actions">
        <button className="button button-primary" disabled={saving} type="submit">{saving ? <><LoaderCircle className="spin" size={16}/> A guardar</> : "Criar marca"}</button>
      </div>
    </form>
  );
}
