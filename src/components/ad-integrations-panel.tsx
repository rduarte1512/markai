"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, KeyRound, Linkedin, Loader2, Megaphone, Music2, Search, ShieldCheck, Trash2, Youtube } from "lucide-react";

type Provider = "meta" | "google_ads" | "tiktok" | "linkedin" | "youtube";
type Integration = { provider: Provider; configured: boolean; accountLabel?: string; status?: string };

type FormState = {
  accessToken: string;
  apiKey: string;
  clientId: string;
  clientSecret: string;
  developerToken: string;
  accountId: string;
  accountLabel: string;
};

const EMPTY_FORM: FormState = { accessToken: "", apiKey: "", clientId: "", clientSecret: "", developerToken: "", accountId: "", accountLabel: "" };

const PROVIDERS: Array<{
  key: Provider;
  name: string;
  description: string;
  icon: typeof Megaphone;
  fields: Array<keyof FormState>;
}> = [
  { key: "meta", name: "Meta Ads", description: "Facebook e Instagram Ads, contas, campanhas e performance.", icon: Megaphone, fields: ["accessToken", "accountId", "accountLabel"] },
  { key: "google_ads", name: "Google Ads", description: "Pesquisa, Performance Max, Display e conversões.", icon: Search, fields: ["developerToken", "clientId", "clientSecret", "accountId", "accountLabel"] },
  { key: "tiktok", name: "TikTok Ads", description: "Campanhas, criativos e métricas do TikTok for Business.", icon: Music2, fields: ["accessToken", "accountId", "accountLabel"] },
  { key: "linkedin", name: "LinkedIn Ads", description: "Campaign Manager para B2B, leads e públicos profissionais.", icon: Linkedin, fields: ["accessToken", "accountId", "accountLabel"] },
  { key: "youtube", name: "YouTube", description: "YouTube Data/API e contexto de canal para campanhas de vídeo.", icon: Youtube, fields: ["apiKey", "accessToken", "accountId", "accountLabel"] },
];

const LABELS: Record<keyof FormState, string> = {
  accessToken: "Access token",
  apiKey: "API key",
  clientId: "Client ID",
  clientSecret: "Client secret",
  developerToken: "Developer token",
  accountId: "Account / Customer / Channel ID",
  accountLabel: "Nome da conta (opcional)",
};

export function AdIntegrationsPanel() {
  const [items, setItems] = useState<Integration[]>([]);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/integrations/ads", { cache: "no-store" });
      const data = (await response.json()) as { integrations?: Integration[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar integrações.");
      setItems(data.integrations || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro a carregar integrações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);
  const configured = useMemo(() => new Map(items.map((item) => [item.provider, item])), [items]);

  function startEdit(provider: Provider) {
    setEditing(provider);
    setForm({ ...EMPTY_FORM, accountLabel: configured.get(provider)?.accountLabel || "" });
    setError("");
  }

  async function save(provider: Provider) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/integrations/ads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, ...form }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível guardar.");
      setEditing(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function disconnect(provider: Provider) {
    if (!window.confirm("Remover esta ligação e as credenciais guardadas?")) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/integrations/ads?provider=${provider}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível remover.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao remover.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ad-integrations-console">
      <header className="ad-integrations-head">
        <div>
          <span className="studio-kicker"><KeyRound size={14}/> Advertising connections</span>
          <h2>APIs de publicidade</h2>
          <p>Liga as contas que o MarkAI pode usar para contextualizar campanhas, criativos e performance. As credenciais são encriptadas e nunca voltam a ser mostradas.</p>
        </div>
        <span className="ad-integrations-security"><ShieldCheck size={15}/> Cofre encriptado</span>
      </header>

      {error && <div className="form-error">{error}</div>}
      {loading ? <div className="ad-integrations-loading"><Loader2 className="spin" size={18}/> A carregar ligações...</div> : (
        <div className="ad-integrations-grid">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const active = configured.get(provider.key);
            const open = editing === provider.key;
            return (
              <article className={`ad-integration-card ${active ? "configured" : ""} ${open ? "editing" : ""}`} key={provider.key}>
                <header>
                  <span className="ad-provider-icon"><Icon size={20}/></span>
                  <div><strong>{provider.name}</strong><small>{provider.description}</small></div>
                  {active ? <em><CheckCircle2 size={13}/> Ligado</em> : <em>Por ligar</em>}
                </header>
                {active?.accountLabel && <div className="ad-account-label">Conta: <strong>{active.accountLabel}</strong></div>}

                {open ? (
                  <div className="ad-integration-form">
                    {provider.fields.map((field) => (
                      <label key={field}>
                        <span>{LABELS[field]}</span>
                        <input
                          type={["accessToken", "apiKey", "clientSecret", "developerToken"].includes(field) ? "password" : "text"}
                          value={form[field]}
                          autoComplete="off"
                          onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                          placeholder={field === "accountLabel" ? "Ex.: Conta principal" : "Cola aqui a credencial"}
                        />
                      </label>
                    ))}
                    <div className="ad-integration-actions">
                      <button type="button" onClick={() => setEditing(null)} disabled={saving}>Cancelar</button>
                      <button type="button" className="primary" onClick={() => void save(provider.key)} disabled={saving}>
                        {saving ? <Loader2 className="spin" size={14}/> : <KeyRound size={14}/>} Guardar ligação
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="ad-integration-card-actions">
                    <button type="button" className="connect" onClick={() => startEdit(provider.key)}>{active ? "Atualizar credenciais" : "Ligar API"}</button>
                    {active && <button type="button" className="disconnect" aria-label={`Desligar ${provider.name}`} onClick={() => void disconnect(provider.key)} disabled={saving}><Trash2 size={14}/></button>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
