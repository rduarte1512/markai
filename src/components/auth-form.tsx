"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível continuar.");

      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {mode === "register" && (
        <>
          <div className="field">
            <label htmlFor="name">O teu nome</label>
            <input className="input" id="name" name="name" placeholder="Rodrigo Duarte" minLength={2} required />
          </div>
          <div className="field">
            <label htmlFor="workspaceName">Nome da agência</label>
            <input className="input" id="workspaceName" name="workspaceName" placeholder="MarkAI Agency" minLength={2} required />
          </div>
        </>
      )}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" placeholder="tu@agencia.pt" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Palavra-passe</label>
        <input className="input" id="password" name="password" type="password" placeholder="Mínimo 8 caracteres" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required />
      </div>
      {error && <div className="form-error">{error}</div>}
      <button className="button button-primary" disabled={loading} type="submit">
        {loading ? <><LoaderCircle size={17} className="spin" /> A processar...</> : <>{mode === "login" ? "Entrar" : "Criar conta grátis"} <ArrowRight size={17} /></>}
      </button>
    </form>
  );
}
