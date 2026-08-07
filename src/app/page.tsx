"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Bot, BrainCircuit, BriefcaseBusiness, CalendarDays, Check,
  ChevronRight, CirclePlay, Copy, Crown, Gauge, Gem, Layers3, Menu,
  Megaphone, Rocket, ShieldCheck, Sparkles, Target, TrendingUp, Users,
  WandSparkles, Workflow, X, Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";

const modules = [
  { icon: Megaphone, number: "01", title: "Ads Studio", text: "Campanhas A/B com preview, scoring e contexto completo da marca." },
  { icon: Bot, number: "02", title: "Agente estratégico", text: "Decisões, planos e análises com memória permanente por Brand Kit." },
  { icon: Workflow, number: "03", title: "Revenue funnels", text: "Landing, formulário, checkout, upsell e follow-up num canvas visual." },
  { icon: CalendarDays, number: "04", title: "Content OS", text: "Pipeline editorial, calendário, aprovação e planeamento multicanal." },
];

const plans = [
  { name: "Free", sub: "Para descobrir o MarkAI sem risco.", price: "0€", per: "para sempre", bill: "Sem cartão de crédito", badge: "", chips: ["60 créditos", "1 marca", "1 utilizador", "Modelos económicos"], features: ["60 créditos por mês", "1 workspace", "Ads Studio essencial", "Copiloto em modo limitado", "Brand Kit para uma marca", "Histórico de 7 dias"], href: "/register" },
  { name: "Starter", sub: "Para freelancers e equipas pequenas.", price: "23€", per: "/mês", bill: "Faturado anualmente · 276€/ano", badge: "Melhor para começar", chips: ["3.000 créditos", "5 marcas", "3 utilizadores", "Modelos baixos e médios"], features: ["3.000 créditos por mês", "Até 2 workspaces", "5 Brand Kits completos", "Ads Studio e variações A/B", "Funis e calendário de conteúdo", "Relatórios essenciais", "Portal de cliente"], href: "/register?plan=starter" },
  { name: "Pro", sub: "Para agências que precisam de escala.", price: "63€", per: "/mês", bill: "Faturado anualmente · 756€/ano", badge: "Mais escolhido", chips: ["12.000 créditos", "20 marcas", "10 utilizadores", "Todos os modelos premium"], features: ["12.000 créditos por mês", "Até 5 workspaces", "20 marcas e 10 utilizadores", "Modelos premium e de alto consumo", "Relatórios completos e SEO", "Agendamento social", "Aprovações e colaboração", "Suporte prioritário"], href: "/register?plan=pro", featured: true },
  { name: "Agency", sub: "Operação completa para equipas maiores.", price: "159€", per: "/mês", bill: "Faturado anualmente · 1.908€/ano", badge: "Escala máxima", chips: ["50.000 créditos", "Marcas ilimitadas", "50 utilizadores", "Acesso máximo"], features: ["50.000 créditos por mês", "Até 15 workspaces", "Marcas ilimitadas", "50 lugares de equipa", "White-label e portal personalizado", "Todos os relatórios e integrações", "Limites máximos por modelo", "Suporte prioritário de agência"], href: "/register?plan=agency" },
];

const faqs = [
  ["Como funciona o sistema de créditos?", "Cada geração tem um custo que vês antes de a lançar. O plano Free inclui 60 créditos por mês; os planos pagos trazem de 3.000 a 50.000 créditos mensais."],
  ["O que significa modelos bloqueados por plano e limite?", "Cada plano dá acesso a modelos económicos, intermédios ou premium. O MarkAI mostra sempre o motor e o custo da operação antes de a executar."],
  ["Quantas marcas e quantas pessoas posso incluir?", "Free: 1 marca e 1 utilizador. Starter: 5 marcas e 3 utilizadores. Pro: 20 marcas e 10 utilizadores. Agency: marcas ilimitadas e 50 lugares de equipa."],
  ["Preciso de cartão para começar?", "Não. Crias o workspace sem cartão e recebes 60 créditos para experimentar. A configuração do primeiro Brand Kit demora cerca de 2 minutos."],
  ["Posso cancelar quando quiser?", "Sim. O plano Free não tem qualquer compromisso e os planos pagos podem ser cancelados a qualquer momento."],
];

const demoVariants = [
  { copy: "A experiência premium começa antes da primeira compra.", creative: "Transforma atenção em desejo.", score: 89 },
  { copy: "Não é mais um produto. É o teu próximo nível.", creative: "Premium, discreto, à tua altura.", score: 91 },
  { copy: "O cuidado está nos detalhes — até no anúncio.", creative: "Alta qualidade em cada clique.", score: 87 },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [channel, setChannel] = useState("Meta");
  const [tab, setTab] = useState("Criativo");
  const [variant, setVariant] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  function generate() {
    if (generating) return;
    setGenerating(true);
    window.setTimeout(() => {
      setVariant((value) => (value + 1) % demoVariants.length);
      setGenerating(false);
    }, 900);
  }

  async function copyVariations() {
    await navigator.clipboard?.writeText(demoVariants.map((item) => item.copy).join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    window.location.href = email ? `/register?email=${encodeURIComponent(email)}` : "/register";
  }

  const current = demoVariants[variant];

  return (
    <main className="landing-v4">
      <div className="v4-progress" />
      <header className="v4-header">
        <div className="v4-container v4-header-inner">
          <Logo />
          <nav className="v4-nav">
            <a href="#produto">Produto</a><a href="#processo">Como funciona</a><a href="#pro">Pro</a><a href="#precos">Planos</a><a href="#faq">FAQ</a>
            <a className="v4-demo-link" href="#demo">Ver demo</a>
          </nav>
          <div className="v4-header-actions">
            <Link href="/login">Entrar</Link>
            <Link className="v4-btn v4-btn-ghost" href="/register">Começar grátis</Link>
          </div>
          <button className="v4-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menu">{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button>
        </div>
        {menuOpen && <div className="v4-mobile-menu"><a href="#produto" onClick={() => setMenuOpen(false)}>Produto</a><a href="#processo" onClick={() => setMenuOpen(false)}>Como funciona</a><a href="#pro" onClick={() => setMenuOpen(false)}>Pro</a><a href="#precos" onClick={() => setMenuOpen(false)}>Planos</a><a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a><Link href="/login">Entrar</Link><Link className="v4-btn v4-btn-primary" href="/register">Começar grátis</Link></div>}
      </header>

      <section className="v4-hero" id="produto">
        <div className="v4-hero-grid-bg"/><div className="v4-hero-glow"/>
        <div className="v4-container v4-hero-inner">
          <span className="v4-pill">Marketing intelligence para equipas ambiciosas</span>
          <h1>Menos ferramentas.<br/><span>Mais trabalho que move receita.</span></h1>
          <p>O MarkAI reúne estratégia, criação, funis, conteúdo e conhecimento de marca num sistema operativo premium alimentado por inteligência artificial.</p>
          <div className="v4-hero-actions"><Link className="v4-btn v4-btn-primary v4-btn-lg" href="/register">Criar workspace gratuito <ArrowRight size={18}/></Link><a className="v4-btn v4-btn-ghost v4-btn-lg" href="#demo"><CirclePlay size={18}/> Ver produto em ação</a></div>
          <div className="v4-trust"><span><Check size={15}/> Sem cartão</span><span><Check size={15}/> 60 créditos incluídos</span><span><Check size={15}/> Configuração em 2 minutos</span></div>
          <div className="v4-stats"><div><strong>11</strong><span>modelos disponíveis</span></div><div><strong>4</strong><span>módulos ligados</span></div><div><strong>1</strong><span>fonte de verdade</span></div></div>

          <div className="v4-preview" id="demo">
            <div className="v4-window">
              <div className="v4-window-chrome"><span className="v4-dots"><i/><i/><i/></span><span className="v4-url"><ShieldCheck size={13}/> app.markai.pt</span><span className="v4-demo-badge">Demonstração</span></div>
              <div className="v4-window-body">
                <section className="v4-demo-left">
                  <span className="v4-step-chip"><b>01</b> Estratégia · Contexto ligado</span>
                  <div className="v4-brand"><i>MD</i><span><strong>Maison Digital</strong><small>Premium · Minimalista</small></span></div>
                  <div className="v4-channels">{["Meta","Google","TikTok"].map((item) => <button className={channel === item ? "active" : ""} onClick={() => setChannel(item)} key={item}>{item}</button>)}</div>
                  <button className={`v4-generate ${generating ? "loading" : ""}`} onClick={generate}><WandSparkles size={17}/><span><strong>{generating ? "A gerar 3 variações…" : "Gerar campanha"}</strong><small>{generating ? "A ligar ao contexto de marca" : `${channel} · contexto pronto`}</small></span></button>
                  <div className="v4-demo-signals"><span><Check size={13}/> Brand Kit ligado</span><span><Zap size={13}/> Custo previsível</span></div>
                </section>
                <section className="v4-demo-right">
                  <div className="v4-tabs">{["Criativo","Copy","Insights"].map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</div>
                  {tab === "Criativo" && <><article className="v4-ad-card"><header><i>MD</i><span><strong>Maison Digital</strong><small>Patrocinado</small></span></header><p>{current.copy}</p><div><Sparkles size={23}/><strong>{current.creative}</strong><small>Campanha alinhada com a marca</small></div><footer><span><small>maisondigital.pt</small><strong>Descobrir coleção</strong></span><button>Comprar</button></footer></article><div className="v4-scores"><span><Gauge size={15}/><small>Atenção</small><strong>{current.score}</strong></span><span><Target size={15}/><small>Marca</small><strong>96%</strong></span><span><ShieldCheck size={15}/><small>Risco</small><strong>Baixo</strong></span></div></>}
                  {tab === "Copy" && <div className="v4-copy-list">{demoVariants.map((item, index) => <article className={index === 1 ? "recommended" : ""} key={item.copy}><strong>Variação {index + 1} · {item.score}</strong><p>{item.copy}</p>{index === 1 && <small><Check size={12}/> Recomendada</small>}</article>)}<button className="v4-copy-btn" onClick={copyVariations}><Copy size={14}/>{copied ? "Copiado" : "Copiar variações"}</button></div>}
                  {tab === "Insights" && <div className="v4-insights"><article><strong>Variar o gancho</strong><p>Testar três ganchos mantém o posicionamento premium e aumenta a aprendizagem.</p></article><article><strong>Distribuição sugerida</strong><p>70% interesse frio · 20% remarketing · 10% clientes ativos.</p></article><article><strong>Proposta de valor</strong><p>Privilegiar exclusividade e qualidade sobre promoção de preço.</p></article></div>}
                </section>
              </div>
            </div>
            <p className="v4-preview-caption">Pré-visualização ilustrativa do fluxo do Ads Studio.</p>
          </div>
        </div>
      </section>

      <section className="v4-logo-strip"><div className="v4-container"><small>Confiam no MarkAI para produzir todos os dias</small><div>{["Lumen Studio","Braga Digital","Alta Living","Norte Co.","Ateliê Casa","Viana Tech"].map((item) => <span key={item}><i/>{item}</span>)}</div></div></section>
      <section className="v4-marquee"><div>{["Brand intelligence","Ads Studio","Marketing agent","Revenue funnels","Content OS","Credit control","Brand intelligence","Ads Studio"].map((item,index) => <span key={`${item}-${index}`}>{item}<i/></span>)}</div></section>

      <section className="v4-section" id="solucao"><div className="v4-container"><div className="v4-section-head"><span>Um sistema, não mais uma ferramenta</span><h2>Cada módulo fica mais forte porque partilha o mesmo contexto.</h2><p>O trabalho deixa de começar do zero. O conhecimento acompanha a marca, a equipa e cada nova campanha.</p></div><div className="v4-module-grid">{modules.map(({icon:Icon,...item}) => <article key={item.title}><em>{item.number}</em><span className="v4-module-icon"><Icon size={21}/></span><h3>{item.title}</h3><p>{item.text}</p><Link href="/register">Explorar módulo <ArrowRight size={15}/></Link></article>)}</div></div></section>

      <section className="v4-section v4-compare"><div className="v4-container"><div className="v4-section-head"><span>O MarkAI vs. o caos</span><h2>Um sistema em vez de cinco ferramentas por gerir.</h2><p>Quando o contexto vive em cinco sítios, o trabalho repete-se. No MarkAI, cada geração já conhece a marca.</p></div><div className="v4-compare-table"><div className="head"><strong>Recurso</strong><strong>MarkAI</strong><strong>Stack atual</strong></div>{["Contexto de marca partilhado","Geração de criativos A/B com preview","Scoring e risco por campanha","Funis com follow-up automático","Calendário editorial multicanal","Memória entre projetos e marcas"].map((item) => <div className="row" key={item}><span>{item}</span><b><Check size={16}/> Incluído</b><em><X size={16}/> Fragmentado</em></div>)}</div></div></section>

      <section className="v4-testimonials"><div className="v4-container"><div className="v4-section-head"><span>Quem usa, sente a diferença</span><h2>Menos ferramentas, mais trabalho que conta.</h2></div><div className="v4-test-grid"><article><p>“O contexto da marca perdia-se sempre entre ferramentas. Hoje estratégia, criativo e funis falam a mesma língua.”</p><footer><i>MS</i><span><strong>Mariana Sousa</strong><small>Head of Growth · Lumen Studio</small></span></footer></article><article className="lead"><p>“Prefiro gastar o orçamento em testes do que em licenças. O MarkAI substituiu três ferramentas na nossa operação.”</p><footer><i>AC</i><span><strong>André Campos</strong><small>Founder · Braga Digital</small></span></footer></article><article><p>“A equipa deixou de esperar por mim para validar criativos. O scoring diz-nos onde vale a pena olhar.”</p><footer><i>IR</i><span><strong>Inês Rocha</strong><small>CMO · Alta Living</small></span></footer></article></div></div></section>

      <section className="v4-integrations"><div className="v4-container"><small>Liga ao teu stack</small><div>{["Meta Ads","Google Ads","TikTok Ads","Shopify","Notion","Slack","Google Drive","Zapier"].map((item) => <span key={item}><i/>{item}</span>)}</div></div></section>

      <section className="v4-section" id="processo"><div className="v4-container"><div className="v4-section-head"><span>Do contexto à execução</span><h2>Quatro passos. Um fluxo que aprende com cada marca.</h2></div><div className="v4-steps">{[["01","Liga a identidade","O Brand Kit concentra público, tom, oferta, cores e decisões."],["02","Escolhe o resultado","Campanha, conteúdo, funil, análise ou plano estratégico."],["03","Produz com controlo","Vê o modelo, custo e limites antes de cada geração."],["04","Aprova e escala","Guarda, compara, publica e transforma insights em execução."]].map(([n,t,p]) => <article key={n}><i/><em>{n}</em><h3>{t}</h3><p>{p}</p></article>)}</div></div></section>

      <section className="v4-section v4-pro" id="pro"><div className="v4-container v4-pro-grid"><div><span className="v4-eyebrow">O plano construído para operações sérias</span><h2>O Pro não oferece apenas mais créditos. <b>Remove os limites que travam crescimento.</b></h2><p>Quando o MarkAI entra no fluxo diário, precisas de mais marcas, mais equipa, modelos mais fortes e capacidade suficiente para testar sem medo.</p><div className="v4-values"><article><BrainCircuit/><span><strong>Modelos premium</strong><small>Motores mais fortes quando a profundidade realmente importa.</small></span></article><article><BriefcaseBusiness/><span><strong>20 marcas</strong><small>Centraliza clientes, Brand Kits, campanhas e conhecimento.</small></span></article><article><Users/><span><strong>10 utilizadores</strong><small>Estrategas, criadores e aprovadores no mesmo sistema.</small></span></article><article><TrendingUp/><span><strong>Operação completa</strong><small>Relatórios, SEO, colaboração e suporte prioritário.</small></span></article></div></div><aside className="v4-pro-card"><span>Plano Pro · Anual</span><div><strong>63€</strong><small>/mês</small></div><p>Faturado anualmente · 756€/ano</p><section><header><span>Capacidade mensal</span><b>12.000 créditos</b></header><div className="v4-cap"><i/></div><footer><span>Free 60</span><span>Pro 12.000</span></footer></section><Link className="v4-btn v4-btn-primary" href="/register?plan=pro">Começar com Pro</Link></aside></div></section>

      <section className="v4-section v4-ai"><div className="v4-container v4-ai-grid"><div className="v4-ai-network"><i className="ring r1"/><i className="ring r2"/><span className="node n1">Motor estratégico</span><span className="node n2">Motor criativo</span><span className="node n3">Motor analítico</span><span className="node n4">Copiloto</span><div><Sparkles size={24}/><strong>MarkAI</strong><small>Multi-modelo</small></div></div><div><span className="v4-eyebrow">Inteligência multi-modelo</span><h2>Velocidade quando basta. Profundidade quando importa.</h2><p>Escolhe o motor por tarefa, vê o custo antes de gerar e mantém limites previsíveis por plano.</p><ul><li><Check/> Custos transparentes por operação</li><li><Check/> Modelos bloqueados por plano e limite</li><li><Check/> Contexto de marca injetado automaticamente</li></ul><Link className="v4-btn v4-btn-ghost" href="/register">Explorar modelos</Link></div></div></section>

      <section className="v4-section v4-pricing" id="precos"><div className="v4-container"><div className="v4-section-head"><span>Capacidade para cada fase</span><h2>Começa grátis. Faz upgrade quando o produto já trabalha contigo.</h2><p>Os limites do Free deixam experimentar; os planos pagos dão espaço real para produzir e crescer.</p></div><div className="v4-plan-grid">{plans.map((plan) => <article className={plan.featured ? "featured" : ""} key={plan.name}>{plan.badge && <span className="v4-plan-badge">{plan.badge}</span>}<h3>{plan.name}</h3><p>{plan.sub}</p><div className="v4-price"><strong>{plan.price}</strong><span>{plan.per}</span></div><small>{plan.bill}</small><div className="v4-chips">{plan.chips.map((chip) => <span key={chip}>{chip}</span>)}</div><ul>{plan.features.map((feature) => <li key={feature}><Check size={15}/>{feature}</li>)}</ul><Link className={`v4-btn ${plan.featured ? "v4-btn-primary" : "v4-btn-ghost"}`} href={plan.href}>Escolher {plan.name}</Link></article>)}</div><div className="v4-risk"><ShieldCheck size={15}/><b>14 dias grátis</b> em qualquer plano · sem cartão · cancela quando quiseres</div></div></section>

      <section className="v4-section" id="faq"><div className="v4-container"><div className="v4-section-head"><span>Perguntas frequentes</span><h2>Respostas diretas, antes de te inscreveres.</h2></div><div className="v4-faq">{faqs.map(([q,a]) => <details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></div></section>

      <section className="v4-final"><div className="v4-final-glow"/><div className="v4-container"><span className="v4-eyebrow">O teu marketing, finalmente ligado</span><h2>Uma marca. Uma campanha.<br/><b>É o suficiente para sentir a diferença.</b></h2><p>Cria o workspace, configura o primeiro Brand Kit e começa a produzir em minutos.</p><form onSubmit={submitLead}><input name="email" type="email" required placeholder="o.teu@email.pt"/><button className="v4-btn v4-btn-primary v4-btn-lg" type="submit">Começar gratuitamente <ArrowRight size={17}/></button></form><small>Sem cartão · 60 créditos · cancela quando quiseres</small></div></section>

      <footer className="v4-footer"><div className="v4-container"><div><Logo/><p>Marketing intelligence workspace.</p></div><nav><a href="#produto">Produto</a><a href="#processo">Como funciona</a><a href="#pro">Pro</a><a href="#precos">Planos</a></nav><Link className="v4-btn v4-btn-ghost" href="/register">Começar grátis</Link></div><div className="v4-container v4-footer-bottom"><span>© 2026 MarkAI. Marketing intelligence workspace.</span><span>Feito para equipas de marketing.</span></div></footer>
    </main>
  );
}
