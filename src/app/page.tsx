import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Bot, BriefcaseBusiness, CalendarDays, Check,
  Coins, Megaphone, Sparkles, Workflow,
} from "lucide-react";
import { Logo } from "@/components/logo";

const features = [
  { icon: BriefcaseBusiness, title: "Brand Kits inteligentes", text: "Centraliza tom de voz, público, personas, cores e decisões para manter toda a equipa alinhada." },
  { icon: Megaphone, title: "Ads Studio", text: "Gera copy, ângulos, CTAs e variações A/B para Meta, Google, TikTok e LinkedIn." },
  { icon: Workflow, title: "Funis completos", text: "Planeia páginas, upsells, emails e etapas de conversão a partir de templates por negócio." },
  { icon: Bot, title: "Copiloto de marketing", text: "Conversa com um agente que conhece a marca ativa e sugere melhorias com contexto real." },
  { icon: CalendarDays, title: "Conteúdo e calendário", text: "Transforma ideias em calendários editoriais, briefs SEO e conteúdos prontos para revisão." },
  { icon: Coins, title: "Créditos transparentes", text: "Vê o custo antes de gerar, controla limites por modelo e acompanha o consumo por marca." },
];

const plans = [
  { name: "Free", price: "0€", credits: "120 créditos/mês", brands: "1 marca", models: "Modelos base + testes limitados" },
  { name: "Starter", price: "29€", credits: "3.000 créditos/mês", brands: "5 marcas", models: "Acesso alargado", featured: true },
  { name: "Pro", price: "79€", credits: "12.000 créditos/mês", brands: "20 marcas", models: "Modelos médios e altos" },
  { name: "Agency", price: "199€", credits: "50.000 créditos/mês", brands: "Marcas ilimitadas", models: "Todos os modelos" },
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <div className="container site-header-inner">
          <Logo />
          <nav className="site-nav">
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#modelos">Modelos</a>
            <a href="#precos">Preços</a>
          </nav>
          <div className="header-actions">
            <Link className="button button-ghost button-sm" href="/login">Entrar</Link>
            <Link className="button button-primary button-sm" href="/register">Criar conta <ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Marketing OS com inteligência artificial</span>
            <h1 className="gradient-text">A tua agência inteira, numa só plataforma.</h1>
            <p>Gere clientes, cria anúncios, planeia funis e toma decisões melhores com um agente de IA que conhece cada marca.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/register">Começar gratuitamente <ArrowRight size={17} /></Link>
              <a className="button button-secondary" href="#funcionalidades">Explorar plataforma</a>
            </div>
            <div className="hero-note">
              <span><Check size={14} /> Sem cartão</span>
              <span><Check size={14} /> 120 créditos incluídos</span>
              <span><Check size={14} /> Pronto para Neon e Vercel</span>
            </div>
          </div>

          <div className="product-shell" aria-label="Pré-visualização do dashboard MarkAI">
            <div className="product-window">
              <div className="window-top"><span className="window-dot"/><span className="window-dot"/><span className="window-dot"/></div>
              <div className="product-body">
                <div className="product-sidebar">
                  <div className="fake-logo" />
                  <div className="fake-nav active"/><div className="fake-nav"/><div className="fake-nav"/><div className="fake-nav"/><div className="fake-nav"/>
                </div>
                <div className="product-main">
                  <div className="fake-title"/><div className="fake-subtitle"/>
                  <div className="fake-stats">
                    <div className="fake-card"><div className="fake-number">12</div><div className="fake-label"/></div>
                    <div className="fake-card"><div className="fake-number">48</div><div className="fake-label"/></div>
                    <div className="fake-card"><div className="fake-number">8.4k</div><div className="fake-label"/></div>
                  </div>
                  <div className="fake-chart">
                    {[44, 72, 53, 91, 66, 82, 58, 96].map((height, index) => <div className="fake-bar" style={{height: `${height}%`}} key={index} />)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="logo-strip">
        <div className="container logo-strip-inner">
          <strong>Cria para os canais onde os teus clientes já estão</strong>
          <div className="channel-list"><span>Meta</span><span>Google</span><span>TikTok</span><span>LinkedIn</span></div>
        </div>
      </section>

      <section className="section" id="funcionalidades">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Tudo ligado</span>
            <h2>Do briefing ao relatório, sem perder contexto.</h2>
            <p>O MarkAI junta execução, estratégia e conhecimento de marca para reduzir ferramentas, retrabalho e decisões soltas.</p>
          </div>
          <div className="feature-grid">
            {features.map(({icon: Icon, title, text}) => (
              <article className="feature-card" key={title}>
                <div className="feature-icon"><Icon size={20}/></div>
                <h3>{title}</h3><p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="modelos">
        <div className="container">
          <div className="cta-panel">
            <Sparkles size={28} style={{marginBottom: 18}} />
            <h2>Escolhe velocidade, qualidade e custo.</h2>
            <p>Do GPT 5.6 Lua aos modelos de consumo elevado, cada geração mostra o custo antes de começar e respeita os limites do plano.</p>
            <Link className="button button-primary" href="/register">Experimentar Ads Studio <Megaphone size={17}/></Link>
          </div>
        </div>
      </section>

      <section className="section" id="precos">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Planos</span>
            <h2>Começa pequeno. Escala com os clientes.</h2>
            <p>Limites generosos nos planos pagos e possibilidade de comprar créditos extra quando precisares.</p>
          </div>
          <div className="pricing-grid">
            {plans.map((plan) => (
              <article className={`price-card ${plan.featured ? "featured" : ""}`} key={plan.name}>
                {plan.featured && <span className="price-badge">Mais escolhido</span>}
                <h3>{plan.name}</h3>
                <div className="price">{plan.price}<small>/mês</small></div>
                <ul>
                  <li><Check size={14}/>{plan.credits}</li>
                  <li><Check size={14}/>{plan.brands}</li>
                  <li><Check size={14}/>{plan.models}</li>
                  <li><BadgeCheck size={14}/>Histórico e controlo de uso</li>
                </ul>
                <Link className={`button ${plan.featured ? "button-primary" : "button-secondary"}`} href="/register" style={{width: "100%"}}>Escolher {plan.name}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <Logo />
          <span>© 2026 MarkAI. Plataforma de marketing com IA.</span>
          <span>Neon Postgres · Next.js · Vercel</span>
        </div>
      </footer>
    </main>
  );
}
