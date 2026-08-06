import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Check, Layers3, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className="auth-page auth-page-premium">
      <section className="auth-art auth-art-premium">
        <div className="auth-art-top">
          <Logo />
          <span className="auth-live-badge"><span /> Marketing OS com IA</span>
        </div>

        <div className="auth-hero-copy">
          <span className="auth-kicker"><Sparkles size={15} /> Tudo o que a tua agência precisa</span>
          <h1>Transforma estratégia em trabalho pronto.</h1>
          <p>Gere marcas, cria campanhas e toma decisões com um copiloto que conhece todo o contexto do cliente.</p>

          <div className="auth-feature-list">
            <div><span><Layers3 size={18} /></span><div><strong>Brand Kits centralizados</strong><small>Tom, público, valores e decisões sempre ligados.</small></div></div>
            <div><span><WandSparkles size={18} /></span><div><strong>Produção com IA</strong><small>Anúncios, conteúdos e funis em poucos minutos.</small></div></div>
            <div><span><BarChart3 size={18} /></span><div><strong>Controlo real</strong><small>Créditos, modelos e utilização visíveis em tempo real.</small></div></div>
          </div>
        </div>

        <div className="auth-proof-card">
          <div className="auth-proof-stars">★★★★★</div>
          <p>“Agora a equipa entra, escolhe a marca e começa a produzir sem perder contexto entre ferramentas.”</p>
          <div><span className="auth-proof-avatar">M</span><span><strong>Marketing mais organizado</strong><small>Uma plataforma, todas as marcas</small></span></div>
        </div>

        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
      </section>

      <section className="auth-form-side auth-form-side-premium">
        <div className="auth-mobile-logo"><Logo /></div>
        <div className="auth-card auth-card-premium">
          <div className="auth-card-icon"><ShieldCheck size={22} /></div>
          <span className="auth-card-kicker">Área segura</span>
          <h2>Bem-vindo de volta</h2>
          <p>Entra para continuar a trabalhar nas tuas marcas e campanhas.</p>

          <AuthForm mode="login" />

          <div className="auth-divider"><span>ou</span></div>
          <div className="auth-switch auth-switch-centered">
            Ainda não tens conta? <Link href="/register">Criar conta gratuitamente</Link>
          </div>

          <div className="auth-trust-row">
            <span><Check size={13} /> Ligação segura</span>
            <span><Check size={13} /> Dados protegidos</span>
          </div>
        </div>
        <div className="auth-legal">Ao entrar, confirmas que aceitas os termos e a política de privacidade.</div>
      </section>
    </main>
  );
}
