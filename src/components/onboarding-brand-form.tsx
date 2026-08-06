"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  LoaderCircle,
  Palette,
  Sparkles,
  Target,
} from "lucide-react";

const steps = [
  { label: "Identidade", icon: Sparkles },
  { label: "Público", icon: Target },
  { label: "Estilo", icon: Palette },
];

export function OnboardingBrandForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
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

  const completion = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function goNext() {
    setError("");
    if (step === 0 && (form.name.trim().length < 2 || form.description.trim().length < 10)) {
      setError("Indica o nome da marca e explica brevemente o que ela vende.");
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function suggestBrandKit() {
    if (!form.name || !form.description) {
      setError("Preenche primeiro o nome e a descrição da marca.");
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
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar as sugestões.");

      setForm((current) => ({
        ...current,
        audience: data.audience || current.audience,
        toneOfVoice: data.toneOfVoice || current.toneOfVoice,
        values: data.values?.join(", ") || current.values,
      }));
      setNotice(`Sugestões aplicadas${data.demoMode ? " em modo demonstração" : ""}.`);
      setStep(1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao gerar sugestões.");
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

      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao criar a marca.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="onboarding-wizard" onSubmit={handleSubmit}>
      <div className="onboarding-progress-head">
        <span>Passo {step + 1} de {steps.length}</span>
        <strong>{completion}% concluído</strong>
      </div>
      <div className="onboarding-progress"><span style={{ width: `${completion}%` }} /></div>

      <div className="onboarding-steps">
        {steps.map((item, index) => {
          const Icon = item.icon;
          const state = index < step ? "done" : index === step ? "active" : "";
          return (
            <button key={item.label} className={state} type="button" onClick={() => index < step && setStep(index)}>
              <span>{index < step ? <Check size={15} /> : <Icon size={15} />}</span>
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="onboarding-panel">
        {step === 0 && (
          <div className="onboarding-step-content">
            <div className="onboarding-copy">
              <span className="eyebrow">Primeira marca</span>
              <h2>Vamos dar identidade ao teu trabalho.</h2>
              <p>Esta informação passa a acompanhar anúncios, conteúdos, funis e todas as respostas do copiloto.</p>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Nome da marca</label>
                <input className="input" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Ex.: Chrono Prestige" autoFocus required />
              </div>
              <div className="field">
                <label>Setor</label>
                <input className="input" value={form.industry} onChange={(event) => update("industry", event.target.value)} placeholder="Ex.: Relógios de luxo" />
              </div>
            </div>
            <div className="field">
              <label>Website <span className="optional-label">Opcional</span></label>
              <input className="input" value={form.website} onChange={(event) => update("website", event.target.value)} placeholder="https://marca.com" type="url" />
            </div>
            <div className="field">
              <label>O que vende e por que motivo alguém deve escolher esta marca?</label>
              <textarea className="textarea onboarding-description" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Explica de forma simples os produtos, o mercado, a diferença e o objetivo da marca." required />
              <small className="field-hint">Uma boa descrição ajuda a IA a produzir resultados muito mais próximos da marca.</small>
            </div>

            <button className="onboarding-ai-card" type="button" onClick={suggestBrandKit} disabled={suggesting}>
              <span className="onboarding-ai-icon"><Bot size={20} /></span>
              <span>
                <strong>{suggesting ? "A analisar a marca..." : "Deixa a IA completar o Brand Kit"}</strong>
                <small>Gera público, tom de voz e valores a partir da tua descrição.</small>
              </span>
              {suggesting ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-step-content">
            <div className="onboarding-copy">
              <span className="eyebrow">Cliente ideal</span>
              <h2>Quem é que esta marca quer conquistar?</h2>
              <p>Quanto mais claro for o público, melhores serão as mensagens, os ângulos e as campanhas.</p>
            </div>
            <div className="field">
              <label>Público-alvo</label>
              <textarea className="textarea onboarding-large-textarea" value={form.audience} onChange={(event) => update("audience", event.target.value)} placeholder="Idade, localização, necessidades, interesses, poder de compra e principais objeções." />
            </div>
            <div className="onboarding-tip">
              <Target size={18} />
              <div><strong>Dica rápida</strong><span>Descreve uma pessoa real em vez de dizer apenas “todos”.</span></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step-content">
            <div className="onboarding-copy">
              <span className="eyebrow">Personalidade</span>
              <h2>Define como a marca deve parecer e falar.</h2>
              <p>Escolhe uma direção visual simples. Poderás alterar tudo mais tarde no Brand Kit.</p>
            </div>
            <div className="field">
              <label>Tom de voz</label>
              <input className="input" value={form.toneOfVoice} onChange={(event) => update("toneOfVoice", event.target.value)} placeholder="Ex.: premium, confiante, elegante e direto" />
            </div>
            <div className="field">
              <label>Valores da marca</label>
              <input className="input" value={form.values} onChange={(event) => update("values", event.target.value)} placeholder="Qualidade, confiança, inovação" />
            </div>
            <div className="color-picker-grid">
              <label className="color-picker-card">
                <span>Cor principal</span>
                <div><input value={form.primaryColor} onChange={(event) => update("primaryColor", event.target.value)} type="color" /><strong>{form.primaryColor.toUpperCase()}</strong></div>
              </label>
              <label className="color-picker-card">
                <span>Cor secundária</span>
                <div><input value={form.secondaryColor} onChange={(event) => update("secondaryColor", event.target.value)} type="color" /><strong>{form.secondaryColor.toUpperCase()}</strong></div>
              </label>
            </div>
            <div className="brand-preview-card" style={{ background: `linear-gradient(135deg, ${form.primaryColor}22, ${form.secondaryColor}18)` }}>
              <span style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}>{form.name.slice(0, 1).toUpperCase() || "M"}</span>
              <div><strong>{form.name || "A tua marca"}</strong><small>{form.toneOfVoice || "A personalidade da marca aparece aqui"}</small></div>
            </div>
          </div>
        )}

        {error && <div className="form-error">{error}</div>}
        {notice && <div className="form-success">{notice}</div>}

        <div className="onboarding-actions">
          <button className="button button-ghost" type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || saving}>
            <ArrowLeft size={16} /> Voltar
          </button>
          {step < steps.length - 1 ? (
            <button className="button button-primary" type="button" onClick={goNext}>
              Continuar <ArrowRight size={16} />
            </button>
          ) : (
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? <><LoaderCircle className="spin" size={16} /> A criar marca</> : <>Entrar no MarkAI <ArrowRight size={16} /></>}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
