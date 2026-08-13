import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { RecoverForm } from "@/components/recover-form";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Recuperar palavra-passe" };
export const dynamic = "force-dynamic";

export default async function RecoverPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  if (await getSession()) redirect("/dashboard");
  const params = await searchParams;
  const initialEmail = typeof params.email === "string" ? params.email.slice(0, 320) : "";

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "radial-gradient(circle at 50% 0%, rgba(112,75,255,.16), transparent 35%), #090a0f", color: "#f4f2fb" }}>
      <section style={{ width: "min(100%, 520px)", padding: "32px 30px", border: "1px solid rgba(255,255,255,.1)", borderRadius: 22, background: "rgba(15,16,23,.96)", boxShadow: "0 26px 90px rgba(0,0,0,.38)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 30 }}>
          <Logo />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#9aa1b5", fontSize: 12 }}><ShieldCheck size={14} /> Protegido pelo Clerk</span>
        </div>

        <div style={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 14, background: "rgba(119,79,255,.14)", color: "#9b7cff", marginBottom: 18 }}><KeyRound size={21} /></div>
        <h1 style={{ margin: 0, fontSize: "clamp(28px,5vw,40px)", letterSpacing: "-.04em" }}>Recuperar acesso</h1>
        <p style={{ margin: "10px 0 28px", color: "#a5a9b8", lineHeight: 1.6 }}>Recebe um código no teu email, define uma palavra-passe nova e entra novamente no MarkAI.</p>

        <RecoverForm initialEmail={initialEmail} />

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <Link href="/login" style={{ color: "#c9c4da", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, textDecoration: "none" }}><ArrowLeft size={14} /> Voltar ao login</Link>
        </div>
      </section>
    </main>
  );
}
