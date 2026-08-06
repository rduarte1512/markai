import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Criar conta" };

export default async function RegisterPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className="auth-page">
      <section className="auth-art">
        <Logo />
        <h1>Cria a agência que trabalha mais depressa.</h1>
        <div className="auth-testimonial">
          <p>Começa com 120 créditos, uma marca e acesso de teste a modelos avançados. Sem cartão.</p>
          <strong>Configuração em menos de dois minutos</strong>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-card">
          <Logo />
          <h2>Começar gratuitamente</h2>
          <p>Cria o teu workspace e adiciona a primeira marca.</p>
          <AuthForm mode="register" />
          <div className="auth-switch">Já tens conta? <Link href="/login">Entrar</Link></div>
        </div>
      </section>
    </main>
  );
}
