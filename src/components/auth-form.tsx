"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

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
      const data = (await response.json()) as { error?: string; next?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível continuar.");

      router.push(data.next || (mode === "register" ? "/onboarding" : "/dashboard"));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {mode === "register" && (
        <div className="auth-form-grid">
          <div className="field">
            <label htmlFor="name">O teu nome</label>
            <div className="input-shell">
              <UserRound size={17} />
              <input id="name" name="name" placeholder="Rodrigo Duarte" minLength={2} autoComplete="name" required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="workspaceName">Nome da agência</label>
            <div className="input-shell">
              <Building2 size={17} />
              <input id="workspaceName" name="workspaceName" placeholder="A minha agência" minLength={2} required />
            </div>
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="email">Email profissional</label>
        <div className="input-shell">
          <Mail size={17} />
          <input id="email" name="email" type="email" placeholder="tu@agencia.pt" autoComplete="email" required />
        </div>
      </div>

      <div className="field">
        <div className="field-label-row">
          <label htmlFor="password">Palavra-passe</label>
          {mode === "login" && <span>Protegido por sessão segura</span>}
        </div>
        <div className="input-shell">
          <LockKeyhole size={17} />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={mode === "login" ? "A tua palavra-passe" : "Mínimo 8 caracteres"}
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            className="password-toggle"
            type="button"
            aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {mode === "register" && password.length > 0 && (
          <div className="password-strength" aria-label="Força da palavra-passe">
            <div className="password-strength-bars">
              {[1, 2, 3, 4].map((level) => (
                <span key={level} className={passwordStrength >= level ? "active" : ""} />
              ))}
            </div>
            <small>{passwordStrength >= 3 ? "Boa palavra-passe" : "Usa maiúsculas, números e símbolos"}</small>
          </div>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}

      <button className="button button-primary auth-submit" disabled={loading} type="submit">
        {loading ? (
          <><LoaderCircle size={17} className="spin" /> A processar...</>
        ) : (
          <>{mode === "login" ? "Entrar no MarkAI" : "Criar conta grátis"} <ArrowRight size={17} /></>
        )}
      </button>

      <div className="auth-security-note">
        <ShieldCheck size={16} />
        <span>{mode === "login" ? "Os teus dados e marcas ficam protegidos." : "Sem cartão. Configuras a primeira marca logo a seguir."}</span>
      </div>

      {mode === "register" && (
        <div className="auth-mini-benefits">
          <span><Check size={13} /> 120 créditos incluídos</span>
          <span><Check size={13} /> 1 marca gratuita</span>
          <span><Check size={13} /> Sem compromisso</span>
        </div>
      )}
    </form>
  );
}
