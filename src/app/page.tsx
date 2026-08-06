import Link from "next/link";
import {
  ArrowRight, BarChart3, Bot, BrainCircuit, BriefcaseBusiness,
  CalendarDays, Check, ChevronRight, CirclePlay, Coins, Command,
  Crown, FileText, Gauge, Gem, Globe2, Layers3, Megaphone,
  MousePointerClick, Rocket, ShieldCheck, Sparkles, Target,
  TrendingUp, Users, WandSparkles, Workflow, Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { PlanSelector } from "@/components/plan-selector";

const products = [
  { icon: Megaphone, title: "Ads Studio", text: "Campanhas A/B com preview, scoring e contexto completo da marca.", className: "violet" },
  { icon: Bot, title: "Agente estratégico", text: "Decisões, planos e análises com memória permanente por Brand Kit.", className: "cyan" },
  { icon: Workflow, title: "Revenue funnels", text: "Landing, formulário, checkout, upsell e follow-up num canvas visual.", className: "blue" },
  { icon: CalendarDays, title: "Content OS", text: "Pipeline editorial, calendário, aprovação e planeamento multicanal.", className: "green" },
];

const proReasons = [
  { icon: BrainCircuit, title: "Modelos premium", text: "Usa motores mais fortes quando a estratégia, a profundidade e a qualidade realmente importam." },
  { icon: BriefcaseBusiness, title: "20 marcas", text: "Centraliza clientes, Brand Kits, campanhas e conhecimento sem multiplicar ferramentas." },
  { icon: Users, title: "10 utilizadores", text: "Estrategas, criadores e aprovadores trabalham no mesmo sistema com contexto partilhado." },
  { icon: BarChart3, title: "Operação completa", text: "Relatórios, SEO, agendamento social, colaboração e suporte prioritário." },
];

const workflow = [
  { number: "01", title: "Liga a identidade", text: "O Brand Kit concentra público, tom, oferta, cores e decisões." },
  { number: "02", title: "Escolhe o resultado", text: "Campanha, conteúdo, funil, análise ou plano estratégico." },
  { number: "03", title: "Produz com controlo", text: "Vê o modelo, custo e limites antes de cada geração." },
  { number: "04", title: "Aprova e escala", text: "Guarda, compara, publica e transforma insights em execução." },
];

export default function HomePage() {
  return (
    <main className="landing-v3">
      <div className="landing-v3-grid"/>
      <div className="landing-v3-noise"/>

      <header className="landing-v3-header">
        <div className="container landing-v3-header-inner">
          <Logo />
          <nav><a href="#produto">Produto</a><a href="#pro">Porquê Pro</a><a href="#processo">Como funciona</a><a href="#precos">Planos</a></nav>
          <div><Link className="button button-ghost button-sm" href="/login">Entrar</Link><Link className="button button-primary button-sm" href="/register">Começar grátis <ArrowRight size={15}/></Link></div>
        </div>
      </header>

      <section className="landing-v3-hero" id="produto">
        <div className="landing-v3-aurora aurora-one"/><div className="landing-v3-aurora aurora-two"/>
        <div className="container landing-v3-hero-grid">
          <div className="landing-v3-copy">
            <span className="landing-v3-kicker"><i/> Marketing intelligence para equipas ambiciosas</span>
            <h1>Menos ferramentas.<br/><span>Mais trabalho que move receita.</span></h1>
            <p>O MarkAI reúne estratégia, criação, funis, conteúdo e conhecimento de marca num sistema operacional premium alimentado por inteligência artificial.</p>
            <div className="landing-v3-actions"><Link className="button button-primary landing-v3-primary" href="/register">Criar workspace gratuito <ArrowRight size={18}/></Link><a className="button button-secondary landing-v3-secondary" href="#demo"><CirclePlay size={18}/> Ver produto em ação</a></div>
            <div className="landing-v3-trust"><span><Check size={14}/> Sem cartão</span><span><Check size={14}/> 60 créditos incluídos</span><span><Check size={14}/> Configuração em 2 minutos</span></div>
            <div className="landing-v3-proof"><div><strong>11</strong><span>modelos disponíveis</span></div><div><strong>4</strong><span>módulos ligados</span></div><div><strong>1</strong><span>fonte de verdade</span></div></div>
          </div>

          <div className="landing-v3-stage" id="demo">
            <div className="stage-orbit orbit-one"/><div className="stage-orbit orbit-two"/>
            <div className="stage-floating-note note-one"><Sparkles size={14}/><span><strong>3 campanhas criadas</strong><small>com o mesmo Brand Kit</small></span></div>
            <div className="stage-floating-note note-two"><TrendingUp size={14}/><span><strong>Score 92/100</strong><small>alinhamento da oferta</small></span></div>
            <div className="stage-floating-note note-three"><Command size={14}/><span><strong>Ctrl K</strong><small>abre qualquer fluxo</small></span></div>

            <div className="landing-v3-app-window">
              <header><div><i/><i/><i/></div><span>app.markai.pt</span><ShieldCheck size={14}/></header>
              <div className="app-demo-body">
                <aside><span className="demo-logo"><Sparkles size={16}/></span>{[0,1,2,3,4,5].map((item) => <i className={item === 1 ? "active" : ""} key={item}/>)}</aside>
                <main>
                  <div className="demo-topbar"><div><small>Creative performance studio</small><strong>Ads Studio</strong></div><button><WandSparkles size={13}/> Gerar campanha</button></div>
                  <div className="demo-workspace">
                    <section className="demo-brief-panel"><div className="demo-step"><span>01</span><div><strong>Estratégia</strong><small>Contexto ligado</small></div></div><div className="demo-brand-row"><i>MD</i><span><strong>Maison Digital</strong><small>Premium · Minimalista</small></span><Check size={13}/></div><div className="demo-channel-row"><button className="active">Meta</button><button>Google</button><button>TikTok</button></div><div className="demo-textarea"><span/><span/><span/></div><div className="demo-generate"><Sparkles size={13}/> A gerar 3 variações</div></section>
                    <section className="demo-result-panel"><div className="demo-result-tabs"><span className="active">Criativo</span><span>Copy</span><span>Insights</span></div><article className="demo-social-card"><header><i>MD</i><span><strong>Maison Digital</strong><small>Patrocinado</small></span></header><p>A experiência premium começa antes da primeira compra.</p><div className="demo-creative"><span><Sparkles size={20}/><strong>Transforma atenção em desejo.</strong><small>Campanha alinhada com a marca</small></span></div><footer><span><small>maisondigital.pt</small><strong>Descobrir coleção</strong></span><button>Comprar</button></footer></article><div className="demo-score-row"><span><Gauge size={14}/> Atenção <strong>89</strong></span><span><Target size={14}/> Marca <strong>96%</strong></span><span><ShieldCheck size={14}/> Risco <strong>Baixo</strong></span></div></section>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-v3-marquee"><div><span>Brand intelligence</span><i/><span>Ads Studio</span><i/><span>Marketing agent</span><i/><span>Revenue funnels</span><i/><span>Content OS</span><i/><span>Credit control</span><i/><span>Brand intelligence</span><i/><span>Ads Studio</span></div></section>

      <section className="landing-v3-product-section">
        <div className="container">
          <div className="landing-v3-heading"><span><Layers3 size={14}/> Um sistema, não mais uma ferramenta</span><h2>Cada módulo fica mais forte porque partilha o mesmo contexto.</h2><p>O trabalho deixa de começar do zero. O conhecimento acompanha a marca, a equipa e cada nova campanha.</p></div>
          <div className="landing-v3-product-grid">{products.map(({ icon: Icon, title, text, className }, index) => <article className={`landing-v3-product-card ${className}`} key={title}><header><span><Icon size={21}/></span><em>0{index + 1}</em></header><h3>{title}</h3><p>{text}</p><Link href="/register">Explorar módulo <ArrowRight size={14}/></Link><div className="product-card-glow"/></article>)}</div>
        </div>
      </section>

      <section className="landing-v3-pro-section" id="pro">
        <div className="container landing-v3-pro-grid">
          <div className="pro-copy">
            <span className="landing-v3-kicker"><Crown size={13}/> O plano construído para operações sérias</span>
            <h2>O Pro não oferece apenas mais créditos. <span>Remove os limites que travam crescimento.</span></h2>
            <p>Quando o MarkAI entra no fluxo diário, precisas de mais marcas, mais equipa, modelos mais fortes e capacidade suficiente para testar sem medo.</p>
            <div className="pro-price-preview"><span><small>Plano Pro anual</small><strong>63€<em>/mês</em></strong></span><div><Check size={14}/> 12.000 créditos mensais</div></div>
            <Link className="button button-primary" href="/register?plan=pro">Começar com Pro <ArrowRight size={16}/></Link>
          </div>
          <div className="pro-value-stack">
            {proReasons.map(({ icon: Icon, title, text }, index) => <article key={title} style={{ "--delay": `${index * 110}ms` } as React.CSSProperties}><span><Icon size={19}/></span><div><h3>{title}</h3><p>{text}</p></div><ChevronRight size={16}/></article>)}
            <div className="pro-capacity-visual"><header><span><Zap size={14}/> Capacidade mensal</span><strong>12.000</strong></header><div><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><footer><span>Free 60</span><span>Pro 12.000</span></footer></div>
          </div>
        </div>
      </section>

      <section className="landing-v3-workflow" id="processo">
        <div className="container">
          <div className="landing-v3-heading centered"><span><Rocket size={14}/> Do contexto à execução</span><h2>Quatro passos. Um fluxo que aprende com cada marca.</h2></div>
          <div className="landing-v3-workflow-grid">{workflow.map((item, index) => <article key={item.number}><span>{item.number}</span><div className="workflow-v3-icon">{index === 0 ? <BriefcaseBusiness size={20}/> : index === 1 ? <MousePointerClick size={20}/> : index === 2 ? <Sparkles size={20}/> : <TrendingUp size={20}/>}</div><h3>{item.title}</h3><p>{item.text}</p>{index < workflow.length - 1 && <i className="workflow-connector"><ArrowRight size={15}/></i>}</article>)}</div>
        </div>
      </section>

      <section className="landing-v3-ai-section">
        <div className="container landing-v3-ai-grid">
          <div className="ai-network-visual"><div className="ai-network-core"><Sparkles size={28}/><strong>MarkAI</strong></div><span className="node n1">GPT 5.6</span><span className="node n2">Sonnet 5</span><span className="node n3">Opus 5</span><span className="node n4">Qwen 3.7</span><i className="network-ring r1"/><i className="network-ring r2"/></div>
          <div><span className="landing-v3-kicker"><BrainCircuit size={13}/> Inteligência multi-modelo</span><h2>Velocidade quando basta. Profundidade quando importa.</h2><p>Escolhe o motor por tarefa, vê o custo antes de gerar e mantém limites previsíveis por plano.</p><ul><li><Check size={15}/> Custos transparentes por operação</li><li><Check size={15}/> Modelos bloqueados por plano e limite</li><li><Check size={15}/> Contexto de marca injetado automaticamente</li></ul><Link className="button button-secondary" href="/register">Explorar modelos <ArrowRight size={15}/></Link></div>
        </div>
      </section>

      <section className="landing-v3-pricing" id="precos">
        <div className="container"><div className="landing-v3-heading centered"><span><Gem size={14}/> Capacidade para cada fase</span><h2>Começa grátis. Faz upgrade quando o produto já trabalha contigo.</h2><p>Os limites do Free deixam experimentar; os planos pagos dão espaço real para produzir e crescer.</p></div><PlanSelector/></div>
      </section>

      <section className="landing-v3-final">
        <div className="final-pulse"/><div className="container"><span className="landing-v3-kicker"><Sparkles size={13}/> O teu marketing, finalmente ligado</span><h2>Uma marca. Uma campanha.<br/><span>É o suficiente para sentir a diferença.</span></h2><p>Cria o workspace, configura o primeiro Brand Kit e começa a produzir em minutos.</p><Link className="button button-primary landing-v3-primary" href="/register">Começar gratuitamente <ArrowRight size={18}/></Link><small>Sem cartão · 60 créditos · cancela quando quiseres</small></div>
      </section>

      <footer className="landing-v3-footer"><div className="container"><Logo/><span>© 2026 MarkAI. Marketing intelligence workspace.</span><div><a href="#produto">Produto</a><a href="#pro">Pro</a><a href="#precos">Planos</a></div></div></footer>
    </main>
  );
}
