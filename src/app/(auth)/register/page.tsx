import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Check,
  Clock3,
  Rocket,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/auth";
import styles from "./register.module.css";

export const metadata = { title: "Criar conta" };
export const dynamic = "force-dynamic";

const highlights = [
  {
    icon: WandSparkles,
    title: "Conteúdo e anúncios com IA",
    text: "Cria campanhas, copies e ideias sempre alinhadas com a tua marca.",
  },
  {
    icon: BarChart3,
    title: "Tudo num único workspace",
    text: "Marcas, campanhas, funis, relatórios e automações sem saltar entre ferramentas.",
  },
  {
    icon: Rocket,
    title: "Pronto para produzir",
    text: "Começa no plano Free e leva a primeira marca do briefing à execução.",
  },
];

export default async function RegisterPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className={styles.page}>
      <section className={styles.showcase}>
        <div className={styles.glowOne} aria-hidden="true" />
        <div className={styles.glowTwo} aria-hidden="true" />

        <div className={styles.showcaseTop}>
          <Logo />
          <span className={styles.secureBadge}><ShieldCheck size={14} /> Conta protegida pelo Clerk</span>
        </div>

        <div className={styles.hero}>
          <span className={styles.eyebrow}><Sparkles size={14} /> O teu Marketing OS</span>
          <h1>
            Cria. Lança. Mede.
            <span> Tudo no mesmo lugar.</span>
          </h1>
          <p>
            Monta o teu workspace em minutos e dá à tua agência um sistema completo para trabalhar mais depressa com IA.
          </p>

          <div className={styles.highlightGrid}>
            {highlights.map(({ icon: Icon, title, text }) => (
              <article className={styles.highlightCard} key={title}>
                <span className={styles.highlightIcon}><Icon size={18} /></span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.showcaseBottom}>
          <div className={styles.freeCard}>
            <div>
              <span>Começa no plano Free</span>
              <strong>60 créditos + 1 marca incluída</strong>
            </div>
            <span className={styles.freeCheck}><Check size={17} /></span>
          </div>
          <div className={styles.quickFacts}>
            <span><Clock3 size={14} /> Configuração em ~2 min</span>
            <span><ShieldCheck size={14} /> Sem cartão</span>
          </div>
        </div>
      </section>

      <section className={styles.formSide}>
        <div className={styles.formWrap}>
          <div className={styles.mobileBrand}><Logo /></div>

          <div className={styles.progressHead}>
            <div className={styles.progressMeta}>
              <span>Passo 1 de 2</span>
              <span>Criação da conta</span>
            </div>
            <div className={styles.progressBar}><span /></div>
          </div>

          <header className={styles.formHeader}>
            <span className={styles.formKicker}>Começa gratuitamente</span>
            <h2>Cria o teu espaço no MarkAI</h2>
            <p>Continua com Google ou usa o teu email profissional.</p>
          </header>

          <div className={styles.formCard}>
            <AuthForm mode="register" />
          </div>

          <div className={styles.switchRow}>
            <span>Já tens conta?</span>
            <Link href="/login">Entrar no MarkAI <span aria-hidden="true">→</span></Link>
          </div>

          <p className={styles.legal}>
            Ao criares uma conta, confirmas que aceitas os termos de utilização e a política de privacidade.
          </p>
        </div>
      </section>
    </main>
  );
}
