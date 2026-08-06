"use client";

import { useMemo, useState } from "react";
import { Check, Copy, LoaderCircle, Sparkles } from "lucide-react";
import { CONSUMPTION_LABELS } from "@/lib/constants";
import type { Brand, ModelAccess } from "@/lib/types";

export type GeneratedAd = {
  id?: string;
  title: string;
  primaryText: string;
  description?: string;
  cta?: string;
  angle?: string;
};

export function AdsStudio({ brands, models, initialBrandId }: { brands: Brand[]; models: ModelAccess[]; initialBrandId?: string }) {
  const firstAvailable = models.find((model) => model.available)?.key || models[0]?.key || "gpt-5.6-lua";
  const [brandId, setBrandId] = useState(initialBrandId || brands[0]?.id || "");
  const [modelKey, setModelKey] = useState(firstAvailable);
  const [platform, setPlatform] = useState("meta");
  const [objective, setObjective] = useState("Conversões");
  const [offer, setOffer] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [variations, setVariations] = useState(3);
  const [results, setResults] = useState<GeneratedAd[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const model = models.find((item) => item.key === modelKey);
  const estimatedCost = (model?.credit_cost || 0) * variations;

  const unavailableReason = useMemo(() => {
    if (!brands.length) return "Adiciona primeiro uma marca.";
    if (!model?.available) return "Este modelo está bloqueado ou atingiu o limite mensal.";
    return "";
  }, [brands.length, model]);

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unavailableReason) return setError(unavailableReason);
    setLoading(true);
    setError("");
    setNotice("");
    setResults([]);

    try {
      const response = await fetch("/api/generate/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, modelKey, platform, objective, offer, extraContext, variations }),
      });
      const data = (await response.json()) as { error?: string; ads?: GeneratedAd[]; creditsUsed?: number; balanceRemaining?: number; demoMode?: boolean };
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar os anúncios.");
      setResults(data.ads || []);
      setNotice(`${data.ads?.length || 0} variações criadas · ${data.creditsUsed} créditos usados · saldo ${data.balanceRemaining}${data.demoMode ? " · modo demonstração" : ""}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function copyAd(ad: GeneratedAd, index: number) {
    await navigator.clipboard.writeText(`${ad.title}\n\n${ad.primaryText}\n\n${ad.description || ""}\nCTA: ${ad.cta || ""}`);
    setCopied(index);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="builder-grid">
      <section className="builder-panel">
        <div className="builder-panel-header"><h2>Configuração do anúncio</h2><p>O Brand Kit selecionado é incluído automaticamente.</p></div>
        <div className="builder-panel-body">
          <form className="form" onSubmit={generate}>
            <div className="field"><label>Marca</label><select className="select" value={brandId} onChange={(e) => setBrandId(e.target.value)} required>{brands.length ? brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>) : <option value="">Sem marcas</option>}</select></div>
            <div className="form-row">
              <div className="field"><label>Plataforma</label><select className="select" value={platform} onChange={(e) => setPlatform(e.target.value)}><option value="meta">Meta Ads</option><option value="google">Google Ads</option><option value="tiktok">TikTok Ads</option><option value="linkedin">LinkedIn Ads</option></select></div>
              <div className="field"><label>Objetivo</label><select className="select" value={objective} onChange={(e) => setObjective(e.target.value)}><option>Conversões</option><option>Leads</option><option>Tráfego</option><option>Reconhecimento</option><option>Vendas</option></select></div>
            </div>
            <div className="field"><label>Oferta ou produto</label><textarea className="textarea" value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="O que estás a promover, preço, benefício principal e condição especial." required /></div>
            <div className="field"><label>Contexto adicional</label><textarea className="textarea" value={extraContext} onChange={(e) => setExtraContext(e.target.value)} placeholder="Objeções, provas, urgência, palavras proibidas ou requisitos." /></div>
            <div className="form-row">
              <div className="field"><label>Modelo de IA</label><select className="select" value={modelKey} onChange={(e) => setModelKey(e.target.value)}>{models.map((item) => <option value={item.key} disabled={!item.available} key={item.key}>{item.display_name} · {item.credit_cost} créditos {item.available ? "" : "· bloqueado"}</option>)}</select></div>
              <div className="field"><label>Variações</label><select className="select" value={variations} onChange={(e) => setVariations(Number(e.target.value))}><option value={1}>1 variação</option><option value={2}>2 variações</option><option value={3}>3 variações</option><option value={5}>5 variações</option></select></div>
            </div>
            {model && <div className="cost-preview"><span>{model.display_name} · consumo {CONSUMPTION_LABELS[model.consumption_group].toLowerCase()}</span><strong>{estimatedCost} créditos</strong></div>}
            {error && <div className="form-error">{error}</div>}
            <button className="button button-primary" disabled={loading || Boolean(unavailableReason)} type="submit">{loading ? <><LoaderCircle className="spin" size={16}/> A criar variações</> : <><Sparkles size={16}/> Gerar anúncios</>}</button>
          </form>
        </div>
      </section>

      <section className="builder-panel">
        <div className="builder-panel-header"><h2>Variações geradas</h2><p>Todos os resultados ficam guardados na biblioteca da marca.</p></div>
        <div className="builder-panel-body">
          {notice && <div className="form-success" style={{marginBottom: 14}}>{notice}</div>}
          {loading ? (
            <div className="empty-state"><div className="empty-icon"><Sparkles size={23}/></div><h3>A preparar a campanha</h3><p>O modelo está a combinar o Brand Kit, a oferta e o canal selecionado.</p><span className="loading-dots"><span/><span/><span/></span></div>
          ) : results.length ? (
            <div className="generated-list">
              {results.map((ad, index) => (
                <article className="generated-ad" key={`${ad.title}-${index}`}>
                  <div className="generated-ad-header"><span className="badge badge-purple">Variação {String.fromCharCode(65 + index)}</span>{ad.angle && <span className="badge">{ad.angle}</span>}</div>
                  <h3>{ad.title}</h3><p>{ad.primaryText}</p>{ad.description && <small>{ad.description}</small>}
                  <div className="generated-ad-footer"><span className="badge badge-green">CTA: {ad.cta || "Saber mais"}</span><button className="button button-secondary button-sm" onClick={() => copyAd(ad, index)} type="button">{copied === index ? <><Check size={14}/> Copiado</> : <><Copy size={14}/> Copiar</>}</button></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state"><div className="empty-icon"><Sparkles size={23}/></div><h3>O resultado aparece aqui</h3><p>Escolhe uma marca, descreve a oferta e confirma o custo antes de gerar.</p></div>
          )}
        </div>
      </section>
    </div>
  );
}
