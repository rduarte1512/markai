import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className="auth-page">
      <section className="auth-art">
        <Logo />
        <h1>Transforma ideias de marketing em trabalho pronto.</h1>
        <div className="auth-testimonial">
          <p>“O MarkAI dá à equipa um contexto único para cada cliente: marca, anúncios, testes e decisões ficam todos ligados.”</p>
          <strong>O teu novo sistema operativo de marketing</strong>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-card">
          <Logo />
          <h2>Bem-vindo de volta</h2>
          <p>Entra para continuar a gerir as tuas marcas.</p>
          <AuthForm mode="login" />
          <div className="auth-switch">Ainda não tens conta? <Link href="/register">Criar conta grátis</Link></div>
        </div>
      </section>
    </main>
  );
}
