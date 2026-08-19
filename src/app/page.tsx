"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Bot, BrainCircuit, BriefcaseBusiness, CalendarDays, Check,
  ChevronRight, Copy, Crown, Gauge, Gem, Layers3, Menu,
  Megaphone, Rocket, ShieldCheck, Sparkles, Target, TrendingUp, Users,
  WandSparkles, Workflow, X, Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";

const modules = [
  { icon: TrendingUp, number: "01", title: "Performance Intelligence", text: "Spend, revenue, ROAS, CPA e CTR ligados às campanhas, com sync por conector nos planos pagos." },
  { icon: Rocket, number: "02", title: "Campaign OS", text: "Objetivo, budget, canais, anúncios, conteúdo e estratégia centralizados por campanha." },
  { icon: CalendarDays, number: "03", title: "Social Publisher", text: "Fila editorial, agendamento multicanal e publicação live quando a integração está configurada." },
  { icon: Users, number: "04", title: "Client Portal", text: "Links seguros para clientes aprovarem anúncios e conteúdos, pedirem alterações e verem relatórios." },
  { icon: BrainCircuit, number: "05", title: "AI Reports", text: "Relatórios de performance com métricas reais e recomendações com IA nos planos elegíveis." },
  { icon: Workflow, number: "06", title: "Funnel Analytics + A/B", text: "Eventos por etapa, conversão, drop-off e variantes A/B ligados ao Funnel Builder." },
  { icon: Zap, number: "07", title: "AI Automations", text: "Regras para CPA, conteúdo aprovado, resumos e drop-off que executam ações dentro do MarkAI." },
  { icon: Target, number: "08", title: "Search Intelligence · Beta", text: "Auditoria SEO + GEO readiness com análise técnica real e recomendações avançadas nos planos pagos." },
];

const plans = [
  { name: "Free", sub: "Experimenta o sistema antes de escalar.", price: "0€", per: "para sempre", bill: "Sem cartão de crédito", badge: "", chips: ["60 créditos", "1 marca", "1 campanha", "Growth limitado"], features: ["Campaign OS · 1 campanha ativa", "Performance · 7 dias / 8 snapshots", "Publisher · 3 publicações/mês", "1 relatório básico + analytics de 1 funil", "Search Intelligence Beta · 1 auditoria/mês", "Sem Client Portal, Automations ou publicação live"], href: "/register" },
  { name: "Starter", sub: "Para freelancers e pequenas equipas em produção.", price: "23€", per: "/mês", bill: "Faturado anualmente · 276€/ano", badge: "Melhor para começar", chips: ["3.000 créditos", "5 marcas", "3 utilizadores", "Growth completo"], features: ["10 campanhas + Performance 90 dias com IA", "50 publicações/mês + live connectors", "5 Client Portals com aprovações", "10 relatórios IA + analytics de 10 funis", "3 Automations ativas", "Search Intelligence Beta · 5 auditorias/mês"], href: "/register?plan=starter" },
  { name: "Pro", sub: "Para agências que precisam de escala e otimização contínua.", price: "63€", per: "/mês", bill: "Faturado anualmente · 756€/ano", badge: "Mais escolhido", chips: ["12.000 créditos", "20 marcas", "10 utilizadores", "Todos os modelos premium"], features: ["50 campanhas + Performance 365 dias, sync e IA", "250 publicações/mês", "25 Client Portals e 50 relatórios IA", "Funnel Analytics + A/B avançado", "25 Automations ativas", "Search Intelligence Beta · 30 auditorias/mês"], href: "/register?plan=pro", featured: true },
  { name: "Agency", sub: "Marketing Operating System para operações multi-cliente.", price: "159€", per: "/mês", bill: "Faturado anualmente · 1.908€/ano", badge: "Escala máxima", chips: ["50.000 créditos", "Marcas ilimitadas", "50 utilizadores", "Acesso máximo"], features: ["Campaign OS e Performance em escala", "2.000 publicações/mês", "Client Portals e relatórios sem limite prático", "100 Automations ativas", "Search Intelligence Beta · 200 auditorias/mês", "White-label, integrações e limites máximos"], href: "/register?plan=agency" },
];

const faqs = [
  ["O Free inclui o novo Growth OS?", "Sim. Podes testar Campaign OS, Performance, Publisher, Reports, Funnel Analytics e Search Intelligence Beta com limites baixos. Client Portal, Automations, publicação live, sync e insights avançados com IA começam nos planos pagos."],
  ["A publicação e sincronização são realmente live?", "Nos planos pagos o MarkAI prepara o fluxo live, mas só envia ou sincroniza quando a integração da plataforma e o respetivo conector estão configurados. Sem conector, o conteúdo fica guardado como pronto e nunca fingimos uma publicação que não aconteceu."],
  ["O que significa Search Intelligence Beta?", "A Beta faz auditoria SEO on-page real e calcula GEO readiness técnica e de conteúdo. Não apresenta a pontuação GEO como se fosse uma posição real no ChatGPT, Gemini ou Perplexity."],
  ["Como funcionam créditos e IA?", "Cada geração com IA tem um custo visível. Relatórios e Search Intelligence avançados nos planos pagos usam o sistema de créditos existente; se uma geração falhar, os créditos são devolvidos."],
  ["Quantas marcas e pessoas posso incluir?", "Free: 1 marca e 1 utilizador. Starter: 5 marcas e 3 utilizadores. Pro: 20 marcas e 10 utilizadores. Agency: marcas sem limite prático e 50 lugares de equipa."],
  ["Posso cancelar quando quiser?", "Sim. O plano Free não tem compromisso e os planos pagos podem ser cancelados a qualquer momento."],
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
            <Link className="v4-btn v4-btn-primary" href="/register">Começar grátis</Link>
          </div>
          <button className="v4-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menu">{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button>
        </div>
        {menuOpen && <div className="v4-mobile-menu"><a href="#produto" onClick={() => setMenuOpen(false)}>Produto</a><a href="#processo" onClick={() => setMenuOpen(false)}>Como funciona</a><a href="#pro" onClick={() => setMenuOpen(false)}>Pro</a><a href="#precos" onClick={() => setMenuOpen(false)}>Planos</a><a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a><Link href="/login">Entrar</Link><Link className="v4-btn v4-btn-primary" href="/register">Começar grátis</Link></div>}
      </header>

      <section className="v4-hero" id="produto">
        <div className="v4-hero-grid-bg"/><div className="v4-hero-glow"/>
        <div className="v4-container v4-hero-inner">
          <span className="v4-pill">Marketing Operating System com IA</span>
          <h1>Cria. Publica. Mede.<br/><span>O MarkAI aprende com o que acontece.</span></h1>
          <p>O MarkAI liga Brand Intelligence, campanhas, anúncios, conteúdo, funis, performance, clientes, relatórios e automações no mesmo ciclo operacional.</p>
          <div className="v4-hero-actions"><Link className="v4-btn v4-btn-primary v4-btn-lg" href="/register">Começar grátis <ArrowRight size={18}/></Link><a className="v4-btn v4-btn-ghost v4-btn-lg" href="#precos"><Crown size={18}/> Ver Planos</a></div>
          <div className="v4-trust"><span><Check size={15}/> Sem cartão</span><span><Check size={15}/> Growth OS incluído no Free com limites</span><span><Check size={15}/> Upgrade desbloqueia operação live</span></div>
          <div className="v4-stats"><div><strong>11</strong><span>modelos disponíveis</span></div><div><strong>8</strong><span>módulos Growth ligados</span></div><div><strong>1</strong><span>fonte de verdade</span></div></div>

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
                  {tab === "Insights" && <div className="v4-insights"><article><strong>Performance Intelligence</strong><p>Os snapshots de campanha alimentam ROAS, CPA, CTR e relatórios no Growth OS.</p></article><article><strong>Próxima ação</strong><p>Nos planos pagos, automações podem transformar sinais como CPA alto em tarefas e novos drafts.</p></article><article><strong>Cliente no loop</strong><p>Entregáveis podem seguir para Client Portal antes de publicação.</p></article></div>}
                </section>
              </div>
            </div>
            <p className="v4-preview-caption">Pré-visualização ilustrativa do fluxo do Ads Studio ligado ao Growth OS.</p>
          </div>
        </div>
      </section>

      <section className="v4-logo-strip"><div className="v4-container"><small>Um workspace para a operação completa</small><div>{["Campaigns","Performance","Publisher","Clients","Reports","Funnels"].map((item) => <span key={item}><i/>{item}</span>)}</div></div></section>
      <section className="v4-marquee"><div>{["Performance intelligence","Campaign OS","Social publisher","Client portal","AI reports","Funnel analytics","Automations","Search intelligence Beta"].map((item,index) => <span key={`${item}-${index}`}>{item}<i/></span>)}</div></section>

      <section className="v4-section" id="solucao"><div className="v4-container"><div className="v4-section-head"><span>Growth OS</span><h2>O marketing deixa de terminar quando carregas em “Gerar”.</h2><p>Criação, publicação, performance, aprovação e otimização passam a usar o mesmo contexto e os mesmos dados.</p></div><div className="v4-module-grid">{modules.map(({icon:Icon,...item}) => <article key={item.title}><em>{item.number}</em><span className="v4-module-icon"><Icon size={21}/></span><h3>{item.title}</h3><p>{item.text}</p><Link href="/register">Explorar módulo <ArrowRight size={15}/></Link></article>)}</div></div></section>

      <section className="v4-section v4-compare"><div className="v4-container"><div className="v4-section-head"><span>O MarkAI vs. o caos</span><h2>Um sistema em vez de uma sequência de ferramentas desligadas.</h2><p>O contexto não fica preso na geração: acompanha campanha, publicação, métricas, cliente e próxima decisão.</p></div><div className="v4-compare-table"><div className="head"><strong>Recurso</strong><strong>MarkAI</strong><strong>Stack fragmentado</strong></div>{["Campaign OS ligado ao Brand Kit","Performance com ROAS, CPA e CTR","Publisher e calendário multicanal","Client Portal com aprovações","Funnel Analytics + testes A/B","Automations baseadas em sinais reais","Search Intelligence SEO + GEO readiness (Beta)"].map((item) => <div className="row" key={item}><span>{item}</span><b><Check size={16}/> Ligado</b><em><X size={16}/> Fragmentado</em></div>)}</div></div></section>

      <section className="v4-testimonials"><div className="v4-container"><div className="v4-section-head"><span>Uma operação mais simples</span><h2>Menos passagens de contexto entre criação, aprovação e resultados.</h2></div><div className="v4-test-grid"><article><p>“O contexto da marca perdia-se sempre entre ferramentas. Hoje estratégia, criativo e funis falam a mesma língua.”</p><footer><i>MS</i><span><strong>Mariana Sousa</strong><small>Head of Growth · Lumen Studio</small></span></footer></article><article className="lead"><p>“Prefiro gastar o orçamento em testes do que em licenças. O MarkAI substituiu três ferramentas na nossa operação.”</p><footer><i>AC</i><span><strong>André Campos</strong><small>Founder · Braga Digital</small></span></footer></article><article><p>“A equipa deixou de esperar por mim para validar criativos. O scoring diz-nos onde vale a pena olhar.”</p><footer><i>IR</i><span><strong>Inês Rocha</strong><small>CMO · Alta Living</small></span></footer></article></div></div></section>

      <section className="v4-integrations"><div className="v4-container"><small>Preparado para o teu stack</small><div>{["Meta Ads","Google Ads","TikTok","LinkedIn","YouTube","Performance Sync","Social Publish","Webhooks"].map((item) => <span key={item}><i/>{item}</span>)}</div></div></section>

      <section className="v4-section" id="processo"><div className="v4-container"><div className="v4-section-head"><span>Do contexto à melhoria contínua</span><h2>Quatro passos. Um loop que não acaba na criação.</h2></div><div className="v4-steps">{[["01","Liga a identidade","O Brand Kit concentra público, tom, oferta, cores e decisões."],["02","Constrói a campanha","Campaign OS liga estratégia, criativos, conteúdo, funis e orçamento."],["03","Publica e mede","Publisher, tracking de funil e snapshots alimentam Performance Intelligence."],["04","Aprova e otimiza","Clientes aprovam; relatórios e automações transformam resultados em próximas ações."]].map(([n,t,p]) => <article key={n}><i/><em>{n}</em><h3>{t}</h3><p>{p}</p></article>)}</div></div></section>

      <section className="v4-section v4-pro" id="pro"><div className="v4-container v4-pro-grid"><div><span className="v4-eyebrow">O plano construído para operações sérias</span><h2>O Pro não oferece apenas mais créditos. <b>Fecha o ciclo de crescimento.</b></h2><p>Quando o MarkAI entra no fluxo diário, precisas de sync, publicação, clientes, relatórios e automações com limites que aguentem uma agência real.</p><div className="v4-values"><article><BrainCircuit/><span><strong>Performance + IA</strong><small>365 dias de histórico, sync por conector e recomendações inteligentes.</small></span></article><article><BriefcaseBusiness/><span><strong>20 marcas</strong><small>Centraliza clientes, Brand Kits, campanhas e conhecimento.</small></span></article><article><Users/><span><strong>25 Client Portals</strong><small>Aprovações e relatórios sem depender de mensagens soltas.</small></span></article><article><TrendingUp/><span><strong>25 Automations</strong><small>Transforma sinais de performance em ações dentro do MarkAI.</small></span></article></div></div><aside className="v4-pro-card"><span>Plano Pro · Anual</span><div><strong>63€</strong><small>/mês</small></div><p>Faturado anualmente · 756€/ano</p><section><header><span>Capacidade mensal</span><b>12.000 créditos</b></header><div className="v4-cap"><i/></div><footer><span>Free 60</span><span>Pro 12.000</span></footer></section><Link className="v4-btn v4-btn-primary" href="/register?plan=pro">Começar com Pro</Link></aside></div></section>

      <section className="v4-section v4-ai"><div className="v4-container v4-ai-grid"><div className="v4-ai-network"><i className="ring r1"/><i className="ring r2"/><span className="node n1">Motor estratégico</span><span className="node n2">Motor criativo</span><span className="node n3">Motor analítico</span><span className="node n4">Automations</span><div><Sparkles size={24}/><strong>MarkAI</strong><small>Multi-modelo</small></div></div><div><span className="v4-eyebrow">Inteligência multi-modelo</span><h2>Velocidade quando basta. Profundidade quando importa.</h2><p>Escolhe o motor por tarefa, vê o custo antes de gerar e usa IA também nos relatórios e Search Intelligence dos planos elegíveis.</p><ul><li><Check/> Custos transparentes por operação</li><li><Check/> Limites de produto aplicados no backend</li><li><Check/> Contexto de marca injetado automaticamente</li></ul><Link className="v4-btn v4-btn-ghost" href="/register">Explorar modelos</Link></div></div></section>

      <section className="v4-section v4-pricing" id="precos"><div className="v4-container"><div className="v4-section-head"><span>Capacidade para cada fase</span><h2>Começa grátis. Faz upgrade quando precisares de operação real.</h2><p>O Free deixa testar o loop; Starter desbloqueia publicação live, portais, automações e IA; Pro e Agency aumentam fortemente os limites.</p></div><div className="v4-plan-grid">{plans.map((plan) => <article className={plan.featured ? "featured" : ""} key={plan.name}>{plan.badge && <span className="v4-plan-badge">{plan.badge}</span>}<h3>{plan.name}</h3><p>{plan.sub}</p><div className="v4-price"><strong>{plan.price}</strong><span>{plan.per}</span></div><small>{plan.bill}</small><div className="v4-chips">{plan.chips.map((chip) => <span key={chip}>{chip}</span>)}</div><ul>{plan.features.map((feature) => <li key={feature}><Check size={15}/>{feature}</li>)}</ul><Link className={`v4-btn ${plan.featured ? "v4-btn-primary" : "v4-btn-ghost"}`} href={plan.href}>Escolher {plan.name}</Link></article>)}</div><div className="v4-risk"><ShieldCheck size={15}/><b>Free disponível sem cartão</b> · limites claros · upgrade quando precisares</div></div></section>

      <section className="v4-section" id="faq"><div className="v4-container"><div className="v4-section-head"><span>Perguntas frequentes</span><h2>Respostas diretas, antes de te inscreveres.</h2></div><div className="v4-faq">{faqs.map(([q,a]) => <details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></div></section>

      <section className="v4-final"><div className="v4-final-glow"/><div className="v4-container"><span className="v4-eyebrow">O teu marketing, finalmente ligado</span><h2>Cria a campanha.<br/><b>Depois deixa os dados dizerem o que fazer a seguir.</b></h2><p>Cria o workspace, configura o primeiro Brand Kit e testa o Growth OS no plano Free.</p><form onSubmit={submitLead}><input name="email" type="email" required placeholder="o.teu@email.pt"/><button className="v4-btn v4-btn-primary v4-btn-lg" type="submit">Começar gratuitamente <ArrowRight size={17}/></button></form><small>Sem cartão · 60 créditos · Growth OS com limites de teste</small></div></section>

      <footer className="v4-footer"><div className="v4-container"><div><Logo/><p>Marketing Operating System com IA.</p></div><nav><a href="#produto">Produto</a><a href="#processo">Como funciona</a><a href="#pro">Pro</a><a href="#precos">Planos</a></nav><Link className="v4-btn v4-btn-ghost" href="/register">Começar grátis</Link></div><div className="v4-container v4-footer-bottom"><span>© 2026 MarkAI. Marketing Operating System.</span><span>Feito para agências e equipas de marketing.</span></div></footer>
    </main>
  );
}