"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight, BadgeCheck, BarChart3, Check, CheckCircle2, ChevronRight,
  CircleDollarSign, Copy, Facebook, Gauge, Globe2, ImageIcon, Instagram,
  Layers3, Linkedin, LoaderCircle, LockKeyhole, Megaphone, MessageSquareText,
  MousePointerClick, RefreshCw, Rocket, ShieldCheck, Sparkles, Target,
  WandSparkles, Zap,
} from "lucide-react";
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

const platformOptions = [
  { value: "meta", label: "Meta", helper: "Feed, Stories e Reels", icon: Facebook },
  { value: "google", label: "Google", helper: "Search e Performance Max", icon: Globe2 },
  { value: "tiktok", label: "TikTok", helper: "Vídeo curto e UGC", icon: Zap },
  { value: "linkedin", label: "LinkedIn", helper: "B2B e geração de leads", icon: Linkedin },
];

const objectiveOptions = [
  { value: "Conversões", label: "Conversões", icon: MousePointerClick },
  { value: "Leads", label: "Leads", icon: Target },
  { value: "Tráfego", label: "Tráfego", icon: Rocket },
  { value: "Reconhecimento", label: "Awareness", icon: Megaphone },
];

const quickBriefs = [
  "Lançamento com oferta limitada e prova social",
  "Campanha de retargeting para visitantes indecisos",
  "Captação de leads com diagnóstico gratuito",
];

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
  const [activeResult, setActiveResult] = useState(0);
  const [resultView, setResultView] = useState<"creative" | "copy" | "insights">("creative");

  const model = models.find((item) => item.key === modelKey);
  const selectedBrand = brands.find((brand) => brand.id === brandId);
  const selectedPlatform = platformOptions.find((item) => item.value === platform) || platformOptions[0];
  const estimatedCost = (model?.credit_cost || 0) * variations;

  const readiness = useMemo(() => {
    let score = 25;
    if (brandId) score += 20;
    if (offer.trim().length >= 35) score += 30;
    else if (offer.trim().length >= 10) score += 15;
    if (extraContext.trim().length >= 20) score += 15;
    if (model?.available) score += 10;
    return Math.min(100, score);
  }, [brandId, extraContext, model?.available, offer]);

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
    setActiveResult(0);

    try {
      const response = await fetch("/api/generate/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, modelKey, platform, objective, offer, extraContext, variations }),
      });
      const data = (await response.json()) as { error?: string; ads?: GeneratedAd[]; creditsUsed?: number; balanceRemaining?: number; demoMode?: boolean };
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar os anúncios.");
      setResults(data.ads || []);
      setNotice(`${data.ads?.length || 0} variações criadas · ${data.creditsUsed} créditos usados · saldo ${data.balanceRemaining}${data.demoMode ? " · demonstração" : ""}`);
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

  const currentAd = results[activeResult];

  return (
    <div className="ads-studio-v2">
      <section className="studio-hero ads-hero">
        <div>
          <span className="studio-kicker"><WandSparkles size={14}/> Creative performance studio</span>
          <h1>Transforma um briefing em anúncios prontos para testar.</h1>
          <p>O MarkAI cruza o Brand Kit, o objetivo, o canal e a oferta para criar variações consistentes, diferenciadas e preparadas para performance.</p>
          <div className="studio-hero-badges"><span><ShieldCheck size={14}/> Contexto de marca automático</span><span><Gauge size={14}/> Custo antes de gerar</span><span><Layers3 size={14}/> Variações A/B guardadas</span></div>
        </div>
        <div className="ads-hero-score">
          <div className="score-orbit" style={{ "--score": `${readiness * 3.6}deg` } as React.CSSProperties}><span><strong>{readiness}</strong><small>/100</small></span></div>
          <div><small>Qualidade do briefing</small><strong>{readiness >= 80 ? "Excelente" : readiness >= 55 ? "Bom ponto de partida" : "Precisa de contexto"}</strong><p>Completa a oferta e as objeções para obter resultados mais fortes.</p></div>
        </div>
      </section>

      <div className="ads-workspace-grid">
        <form className="ads-config-panel" onSubmit={generate}>
          <header className="studio-panel-header"><div><span>01</span><div><h2>Estratégia da campanha</h2><p>Define o contexto que orienta todas as variações.</p></div></div><span className="status-pill draft">Briefing</span></header>

          <div className="ads-form-section">
            <div className="form-section-title"><span><BadgeCheck size={15}/></span><div><strong>Marca ativa</strong><small>O Brand Kit é aplicado automaticamente.</small></div></div>
            <div className="brand-select-premium">
              <span className="brand-select-avatar" style={{ background: `linear-gradient(135deg, ${selectedBrand?.primary_color || "#7c3aed"}, ${selectedBrand?.secondary_color || "#22d3ee"})` }}>{selectedBrand?.name?.slice(0, 2).toUpperCase() || "MK"}</span>
              <select value={brandId} onChange={(event) => setBrandId(event.target.value)} required>{brands.length ? brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>) : <option value="">Sem marcas</option>}</select>
              <ChevronRight size={16}/>
            </div>
            {selectedBrand && <div className="brand-context-strip"><span><strong>{selectedBrand.industry || "Marca"}</strong><small>{selectedBrand.tone_of_voice || "Tom de voz por definir"}</small></span><span><strong>Público</strong><small>{selectedBrand.audience || "Público em configuração"}</small></span></div>}
          </div>

          <div className="ads-form-section">
            <div className="form-section-title"><span><Instagram size={15}/></span><div><strong>Canal</strong><small>Escolhe o formato onde a copy será utilizada.</small></div></div>
            <div className="platform-picker">{platformOptions.map(({ value, label, helper, icon: Icon }) => <button type="button" className={platform === value ? "active" : ""} onClick={() => setPlatform(value)} key={value}><Icon size={17}/><span><strong>{label}</strong><small>{helper}</small></span>{platform === value && <CheckCircle2 size={15}/>}</button>)}</div>
          </div>

          <div className="ads-form-section compact">
            <div className="form-section-title"><span><Target size={15}/></span><div><strong>Objetivo</strong><small>O resultado principal desta campanha.</small></div></div>
            <div className="objective-picker">{objectiveOptions.map(({ value, label, icon: Icon }) => <button type="button" className={objective === value ? "active" : ""} onClick={() => setObjective(value)} key={value}><Icon size={15}/>{label}</button>)}</div>
          </div>

          <div className="ads-form-section">
            <div className="form-section-title"><span><MessageSquareText size={15}/></span><div><strong>Oferta e mensagem</strong><small>Quanto mais concreto, melhor a geração.</small></div></div>
            <textarea className="premium-brief-textarea" value={offer} onChange={(event) => setOffer(event.target.value)} placeholder="Descreve o produto ou serviço, preço, benefício principal, oferta e razão para agir agora..." required/>
            <div className="brief-helper-row"><span>{offer.length}/600 caracteres</span><div>{quickBriefs.map((brief) => <button type="button" key={brief} onClick={() => setOffer(brief)}>{brief}</button>)}</div></div>
          </div>

          <div className="ads-form-section">
            <div className="form-section-title"><span><ShieldCheck size={15}/></span><div><strong>Provas, objeções e restrições</strong><small>Opcional, mas aumenta a precisão.</small></div></div>
            <textarea className="premium-brief-textarea small" value={extraContext} onChange={(event) => setExtraContext(event.target.value)} placeholder="Ex.: 1.200 clientes, entrega em 24h, evitar promessas absolutas, responder à objeção do preço..."/>
          </div>

          <div className="generation-control-card">
            <div className="generation-control-top"><div><span className="model-gem"><Sparkles size={17}/></span><span><small>Motor criativo</small><strong>{model?.display_name || "Selecionar modelo"}</strong></span></div><span className="credit-cost"><CircleDollarSign size={14}/>{estimatedCost} créditos</span></div>
            <div className="generation-control-fields"><label><span>Modelo</span><select value={modelKey} onChange={(event) => setModelKey(event.target.value)}>{models.map((item) => <option value={item.key} disabled={!item.available} key={item.key}>{item.display_name} · {item.credit_cost} cr. {item.available ? "" : "· bloqueado"}</option>)}</select></label><label><span>Variações</span><select value={variations} onChange={(event) => setVariations(Number(event.target.value))}><option value={1}>1 variação</option><option value={2}>2 variações</option><option value={3}>3 variações</option><option value={5}>5 variações</option></select></label></div>
            {model && <div className="model-usage-line"><span><Zap size={13}/> Consumo {CONSUMPTION_LABELS[model.consumption_group].toLowerCase()}</span><span>{model.monthly_requests_used}/{model.monthly_request_limit} pedidos este mês</span></div>}
          </div>

          {error && <div className="form-error">{error}</div>}
          <button className="button button-primary ads-generate-button" disabled={loading || Boolean(unavailableReason)} type="submit">{loading ? <><LoaderCircle className="spin" size={17}/> A construir campanha</> : <><WandSparkles size={17}/> Gerar campanha <ArrowRight size={16}/></>}</button>
        </form>

        <section className="ads-results-panel">
          <header className="studio-panel-header results-header"><div><span>02</span><div><h2>Creative preview</h2><p>Compara, ajusta e exporta as melhores variações.</p></div></div><div className="result-tabs"><button className={resultView === "creative" ? "active" : ""} onClick={() => setResultView("creative")}>Criativo</button><button className={resultView === "copy" ? "active" : ""} onClick={() => setResultView("copy")}>Copy</button><button className={resultView === "insights" ? "active" : ""} onClick={() => setResultView("insights")}>Insights</button></div></header>
          {notice && <div className="studio-success-banner"><CheckCircle2 size={16}/><span>{notice}</span></div>}

          {loading ? (
            <div className="creative-loading-state"><div className="creative-loader"><span/><span/><span/></div><h3>A construir a campanha</h3><p>A combinar o Brand Kit de {selectedBrand?.name || "marca"}, a oferta e as melhores estruturas para {selectedPlatform.label}.</p><div className="loading-workflow"><span className="done"><Check size={13}/> Contexto analisado</span><span className="active"><RefreshCw className="spin" size={13}/> A gerar ângulos</span><span><ImageIcon size={13}/> A preparar previews</span></div></div>
          ) : results.length && currentAd ? (
            <div className="creative-result-workspace">
              <div className="variation-selector">{results.map((ad, index) => <button className={activeResult === index ? "active" : ""} onClick={() => setActiveResult(index)} key={`${ad.title}-${index}`}><span>{String.fromCharCode(65 + index)}</span><div><strong>{ad.angle || `Variação ${index + 1}`}</strong><small>{index === 0 ? "Recomendada" : "Alternativa"}</small></div>{index === 0 && <Sparkles size={14}/>}</button>)}</div>

              {resultView === "creative" && <div className="social-ad-preview">
                <header><div className="social-brand-avatar" style={{ background: `linear-gradient(135deg, ${selectedBrand?.primary_color || "#7c3aed"}, ${selectedBrand?.secondary_color || "#22d3ee"})` }}>{selectedBrand?.name?.slice(0, 1) || "M"}</div><div><strong>{selectedBrand?.name || "A tua marca"}</strong><small>Patrocinado · {selectedPlatform.label}</small></div><MoreDots/></header>
                <p>{currentAd.primaryText}</p>
                <div className="social-creative-placeholder"><div className="creative-gradient-orb"/><span><Sparkles size={22}/><strong>{currentAd.title}</strong><small>{currentAd.description || "Criativo recomendado para esta mensagem"}</small></span></div>
                <footer><div><small>{selectedBrand?.website || "markai.pt"}</small><strong>{currentAd.title}</strong></div><button>{currentAd.cta || "Saber mais"}</button></footer>
                <div className="social-engagement"><span>👍 ❤️ 1,2 mil</span><span>48 comentários · 21 partilhas</span></div>
              </div>}

              {resultView === "copy" && <div className="copy-inspector"><div><span>Título</span><strong>{currentAd.title}</strong><button onClick={() => navigator.clipboard.writeText(currentAd.title)}><Copy size={14}/></button></div><div><span>Texto principal</span><p>{currentAd.primaryText}</p><button onClick={() => navigator.clipboard.writeText(currentAd.primaryText)}><Copy size={14}/></button></div><div><span>Descrição</span><p>{currentAd.description || "Sem descrição adicional."}</p></div><div className="copy-cta-row"><span>CTA recomendado</span><strong>{currentAd.cta || "Saber mais"}</strong></div></div>}

              {resultView === "insights" && <div className="creative-insights-grid"><article><span className="metric-icon green"><Gauge size={18}/></span><small>Potencial de atenção</small><strong>87/100</strong><div className="mini-progress"><i style={{width: "87%"}}/></div></article><article><span className="metric-icon violet"><Target size={18}/></span><small>Alinhamento de marca</small><strong>94%</strong><div className="mini-progress"><i style={{width: "94%"}}/></div></article><article><span className="metric-icon cyan"><BarChart3 size={18}/></span><small>Clareza da oferta</small><strong>Alta</strong><p>Benefício e ação estão claros.</p></article><article><span className="metric-icon gold"><ShieldCheck size={18}/></span><small>Risco de compliance</small><strong>Baixo</strong><p>Sem promessas críticas detetadas.</p></article></div>}

              <div className="result-action-bar"><button className="button button-secondary" onClick={() => copyAd(currentAd, activeResult)}>{copied === activeResult ? <><Check size={15}/> Copiado</> : <><Copy size={15}/> Copiar tudo</>}</button><button className="button button-secondary"><RefreshCw size={15}/> Regenerar</button><button className="button button-primary"><Rocket size={15}/> Guardar na campanha</button></div>
            </div>
          ) : (
            <div className="creative-empty-state">
              <div className="empty-preview-stack"><div/><div/><div><span><Sparkles size={24}/></span></div></div>
              <span className="studio-kicker"><Sparkles size={13}/> O teu próximo anúncio começa aqui</span>
              <h3>Preenche o briefing e vê a campanha ganhar forma.</h3>
              <p>Receberás variações com ângulos diferentes, preview de canal, análise de qualidade e copy pronta a testar.</p>
              <div className="empty-capabilities"><span><BadgeCheck size={14}/> Brand voice</span><span><Target size={14}/> Ângulos A/B</span><span><BarChart3 size={14}/> Score de performance</span></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MoreDots() {
  return <span className="more-dots"><i/><i/><i/></span>;
}
