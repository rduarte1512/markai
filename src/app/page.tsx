import Link from "next/link";
import {
  ArrowRight, BarChart3, Bot, BriefcaseBusiness, CalendarDays, Check,
  ChevronRight, CirclePlay, Coins, Gem, Globe2, Layers3, Megaphone,
  ShieldCheck, Sparkles, Star, TrendingUp, Users, Workflow, Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { PlanSelector } from "@/components/plan-selector";

const features = [
  { icon: BriefcaseBusiness, title: "Brand intelligence", text: "Tom, público, personas, cores e decisões centralizados em Brand Kits vivos.", className: "feature-violet" },
  { icon: Megaphone, title: "Ads Studio", text: "Copy, ângulos, CTAs e testes A/B para Meta, Google, TikTok e LinkedIn.", className: "feature-cyan" },
  { icon: Workflow, title: "Funis completos", text: "Páginas, emails, upsells e sequências pensadas para conversão.", className: "feature-blue" },
  { icon: Bot, title: "Copiloto estratégico", text: "Um agente que conhece cada marca e transforma contexto em decisões.", className: "feature-pink" },
  { icon: CalendarDays, title: "Conteúdo e SEO", text: "Calendários, briefs e conteúdos prontos para revisão e publicação.", className: "feature-green" },
  { icon: BarChart3, title: "Relatórios premium", text: "Entrega resultados claros aos clientes com métricas e recomendações.", className: "feature-gold" },
];

const workflow = [
  { number: "01", title: "Cria a marca", text: "O onboarding transforma informação simples num Brand Kit completo." },
  { number: "02", title: "Escolhe o objetivo", text: "Anúncios, estratégia, conteúdo, funis ou análise de resultados." },
  { number: "03", title: "Produz com IA", text: "Seleciona o modelo, vê o custo e gera trabalho alinhado com a marca." },
  { number: "04", title: "Aprova e entrega", text: "Colabora, mede e apresenta ao cliente sem sair da plataforma." },
];

export default function HomePage() {
  return (
    <main className="premium-landing">
      <div className="landing-noise" />
      <header className="site-header premium-site-header">
        <div className="container site-header-inner">
          <Logo />
          <nav className="site-nav premium-site-nav">
            <a href="#produto">Produto</a>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#precos">Planos</a>
          </nav>
          <div className="header-actions">
            <Link className="button button-ghost button-sm" href="/login">Entrar</Link>
            <Link className="button button-primary button-sm premium-header-cta" href="/register">Começar grátis <ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      <section className="premium-hero" id="produto">
        <div className="premium-hero-glow premium-hero-glow-one" />
        <div className="premium-hero-glow premium-hero-glow-two" />
        <div className="container premium-hero-grid">
          <div className="premium-hero-copy">
            <span className="landing-badge"><span className="live-dot"/> O novo sistema operativo para agências</span>
            <h1>Marketing com IA.<br/><span>Sem perder a alma da marca.</span></h1>
            <p>Transforma briefing, estratégia, anúncios, conteúdo e relatórios num fluxo de trabalho elegante, rápido e completamente ligado.</p>
            <div className="hero-actions premium-hero-actions">
              <Link className="button button-primary landing-main-cta" href="/register">Criar workspace gratuito <ArrowRight size={18}/></Link>
              <a className="button button-secondary landing-demo-button" href="#como-funciona"><CirclePlay size={18}/> Ver como funciona</a>
            </div>
            <div className="premium-hero-trust">
              <span><Check size={14}/> Sem cartão</span>
              <span><Check size={14}/> Configuração em 2 minutos</span>
              <span><Check size={14}/> 11 modelos de IA</span>
            </div>
            <div className="premium-social-proof">
              <div className="avatar-stack"><span>R</span><span>M</span><span>A</span><span>+</span></div>
              <div><strong><Star size={13} fill="currentColor"/> 4.9/5</strong><small>Feito para equipas que querem produzir melhor</small></div>
            </div>
          </div>

          <div className="landing-product-stage">
            <div className="floating-chip chip-top"><Sparkles size={14}/> Campanha gerada em 18s</div>
            <div className="floating-chip chip-bottom"><TrendingUp size={14}/> +34% potencial de conversão</div>
            <div className="landing-dashboard-window">
              <div className="landing-window-bar"><div><span/><span/><span/></div><small>app.markai.pt/dashboard</small><ShieldCheck size={14}/></div>
              <div className="landing-dashboard-body">
                <aside className="landing-mini-sidebar">
                  <div className="mini-brand"><Sparkles size={15}/></div>
                  {[0,1,2,3,4,5].map((item) => <div className={`mini-nav ${item === 0 ? "active" : ""}`} key={item}><span/></div>)}
                </aside>
                <div className="landing-dashboard-main">
                  <div className="landing-dashboard-head"><div><small>Bom dia, Rodrigo</small><strong>Visão geral</strong></div><button><Sparkles size={13}/> Criar campanha</button></div>
                  <div className="landing-metric-grid">
                    <div><span><BriefcaseBusiness size={14}/></span><small>Marcas</small><strong>12</strong><em>+2 este mês</em></div>
                    <div><span><Megaphone size={14}/></span><small>Anúncios</small><strong>148</strong><em>+28 esta semana</em></div>
                    <div><span><TrendingUp size={14}/></span><small>Performance</small><strong>8.4x</strong><em>ROAS médio</em></div>
                  </div>
                  <div className="landing-chart-card">
                    <div><strong>Performance das campanhas</strong><small>Últimos 30 dias</small></div>
                    <div className="animated-line-chart"><span/><span/><span/><span/><span/><span/><span/><span/></div>
                  </div>
                  <div className="landing-bottom-grid">
                    <div className="landing-ai-card"><span><Bot size={16}/></span><div><strong>Copiloto MarkAI</strong><small>3 oportunidades encontradas</small></div><ChevronRight size={14}/></div>
                    <div className="landing-credit-card"><Coins size={15}/><div><strong>10.840</strong><small>créditos disponíveis</small></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-logo-strip">
        <div className="container">
          <span>Cria para todos os canais</span>
          <div><strong>Meta</strong><strong>Google</strong><strong>TikTok</strong><strong>LinkedIn</strong><strong>Instagram</strong></div>
        </div>
      </section>

      <section className="premium-stats-section">
        <div className="container premium-stats-grid">
          <div><strong>11</strong><span>modelos de IA</span></div>
          <div><strong>4×</strong><span>mais rápido a produzir</span></div>
          <div><strong>100%</strong><span>contexto de marca</span></div>
          <div><strong>1</strong><span>plataforma para tudo</span></div>
        </div>
      </section>

      <section className="premium-section" id="funcionalidades">
        <div className="container">
          <div className="premium-section-heading centered">
            <span className="premium-eyebrow"><Gem size={14}/> Uma plataforma verdadeiramente completa</span>
            <h2>Tudo o que a tua agência precisa.<br/><span>Nada do que a atrasa.</span></h2>
            <p>Uma experiência desenhada para substituir ferramentas soltas por um sistema elegante, inteligente e coerente.</p>
          </div>
          <div className="premium-feature-grid">
            {features.map(({ icon: Icon, title, text, className }, index) => (
              <article className={`premium-feature-card ${className}`} key={title} style={{ animationDelay: `${index * 90}ms` }}>
                <div className="premium-feature-icon"><Icon size={21}/></div>
                <span className="feature-number">0{index + 1}</span>
                <h3>{title}</h3><p>{text}</p>
                <Link href="/register">Explorar <ArrowRight size={14}/></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-section workflow-section" id="como-funciona">
        <div className="container workflow-layout">
          <div className="workflow-copy">
            <span className="premium-eyebrow"><Zap size={14}/> Fluxo simples, resultado premium</span>
            <h2>Do zero à campanha pronta em minutos.</h2>
            <p>O MarkAI guia cada passo, mantém a marca consistente e mostra o custo antes de usar qualquer modelo.</p>
            <Link className="button button-primary" href="/register">Experimentar o fluxo <ArrowRight size={16}/></Link>
          </div>
          <div className="workflow-steps">
            {workflow.map((item) => <article key={item.number}><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>)}
          </div>
        </div>
      </section>

      <section className="premium-section model-showcase-section">
        <div className="container model-showcase">
          <div className="model-orbit">
            <span className="model-core"><Sparkles size={28}/><strong>MarkAI</strong></span>
            <span className="model-node node-one">GPT 5.6</span><span className="model-node node-two">Sonnet 5</span><span className="model-node node-three">Opus 5</span><span className="model-node node-four">Qwen 3.7</span>
          </div>
          <div className="model-showcase-copy">
            <span className="premium-eyebrow"><Layers3 size={14}/> Multi-modelo</span>
            <h2>O modelo certo para cada trabalho.</h2>
            <p>Escolhe rapidez, profundidade ou custo. O MarkAI mostra créditos, limites e disponibilidade antes de cada geração.</p>
            <div className="model-benefits"><span><Zap size={15}/> Custo previsível</span><span><ShieldCheck size={15}/> Limites por plano</span><span><Globe2 size={15}/> Vários fornecedores</span></div>
          </div>
        </div>
      </section>

      <section className="premium-section plans-landing-section" id="precos">
        <div className="container">
          <div className="premium-section-heading centered">
            <span className="premium-eyebrow"><CrownIcon/> Cresce sem mudar de plataforma</span>
            <h2>Um plano para cada fase da agência.</h2>
            <p>Começa gratuitamente e faz upgrade quando precisares de mais marcas, equipa e poder de IA.</p>
          </div>
          <PlanSelector />
        </div>
      </section>

      <section className="premium-section landing-testimonial-section">
        <div className="container testimonial-grid">
          <article className="large-testimonial"><div className="quote-mark">“</div><p>O MarkAI transforma um briefing numa operação completa. A equipa deixa de saltar entre ferramentas e começa a trabalhar com o mesmo contexto.</p><div><span>RD</span><strong>Operação mais rápida<small>Estratégia, criação e aprovação ligadas</small></strong></div></article>
          <div className="testimonial-results"><div><Users size={19}/><strong>Equipas alinhadas</strong><span>Uma fonte de verdade por marca.</span></div><div><TrendingUp size={19}/><strong>Mais margem</strong><span>Menos tempo perdido em tarefas repetitivas.</span></div><div><ShieldCheck size={19}/><strong>Mais controlo</strong><span>Limites e custos sempre visíveis.</span></div></div>
        </div>
      </section>

      <section className="premium-final-cta">
        <div className="premium-final-orb"/>
        <div className="container">
          <span className="landing-badge"><Sparkles size={13}/> O próximo nível da tua agência</span>
          <h2>Cria melhor. Entrega mais rápido.<br/>Cresce com controlo.</h2>
          <p>Começa com uma marca, 60 créditos e acesso imediato ao teu novo sistema operativo de marketing.</p>
          <Link className="button button-primary landing-main-cta" href="/register">Criar conta gratuita <ArrowRight size={18}/></Link>
        </div>
      </section>

      <footer className="site-footer premium-footer">
        <div className="container footer-inner"><Logo /><span>© 2026 MarkAI. Marketing OS com inteligência artificial.</span><span>Neon · Next.js · Vercel</span></div>
      </footer>
    </main>
  );
}

function CrownIcon() {
  return <Sparkles size={14}/>;
}
