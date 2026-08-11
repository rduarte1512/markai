"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
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

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { signIn, fetchStatus: signInStatus } = useSignIn();
  const { signUp, fetchStatus: signUpStatus } = useSignUp();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const loading = signInStatus === "fetching" || signUpStatus === "fetching";

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  async function finalizeSignUp() {
    await signUp.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          setError("A tua conta precisa de concluir uma verificação adicional.");
          return;
        }
        const url = decorateUrl("/auth/complete");
        if (url.startsWith("http")) window.location.href = url;
        else router.push(url);
      },
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim().toLowerCase();

    try {
      if (mode === "register") {
        const name = String(formData.get("name") || "").trim();
        const workspaceName = String(formData.get("workspaceName") || "").trim();
        const result = await signUp.password({
          emailAddress: email,
          password,
          unsafeMetadata: { markaiName: name, workspaceName },
        });
        if (result.error) throw new Error(errorMessage(result.error, "Não foi possível criar a conta."));
        await signUp.verifications.sendEmailCode();
        setVerifying(true);
        return;
      }

      const result = await signIn.password({ emailAddress: email, password });
      if (result.error) throw new Error(errorMessage(result.error, "Não foi possível entrar."));
      if (signIn.status !== "complete") throw new Error("É necessária uma verificação adicional.");
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return setError("É necessária uma verificação adicional.");
          const url = decorateUrl("/auth/complete");
          if (url.startsWith("http")) window.location.href = url;
          else router.push(url);
        },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocorreu um erro inesperado.");
    }
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const result = await signUp.verifications.verifyEmailCode({ code: verificationCode.trim() });
      if (result.error) throw new Error(errorMessage(result.error, "Código inválido."));
      if (signUp.status !== "complete") throw new Error("A verificação ainda não ficou concluída.");
      await finalizeSignUp();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível verificar o código.");
    }
  }

  if (mode === "register" && verifying) {
    return (
      <form className="auth-form" onSubmit={handleVerify}>
        <div className="field">
          <label htmlFor="verificationCode">Código enviado para o teu email</label>
          <div className="input-shell">
            <ShieldCheck size={17} />
            <input
              id="verificationCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              required
            />
          </div>
        </div>
        {error && <div className="form-error">{error}</div>}
        <button className="button button-primary auth-submit" disabled={loading} type="submit">
          {loading ? <><LoaderCircle size={17} className="spin" /> A verificar...</> : <>Confirmar conta <ArrowRight size={17} /></>}
        </button>
        <button className="button" type="button" disabled={loading} onClick={() => signUp.verifications.sendEmailCode()}>
          Reenviar código
        </button>
      </form>
    );
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
          {mode === "login" && <span>Protegido pelo Clerk</span>}
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
        <span>{mode === "login" ? "Autenticação protegida pelo Clerk." : "Sem cartão. Configuras a primeira marca logo a seguir."}</span>
      </div>

      {mode === "register" && (
        <div className="auth-mini-benefits">
          <span><Check size={13} /> 60 créditos incluídos</span>
          <span><Check size={13} /> 1 marca gratuita</span>
          <span><Check size={13} /> Sem compromisso</span>
        </div>
      )}
      {mode === "register" && <div id="clerk-captcha" />}
    </form>
  );
}
