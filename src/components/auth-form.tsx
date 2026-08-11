"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import type { OAuthStrategy } from "@clerk/nextjs/types";
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

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.39a4.61 4.61 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.97-4.33 2.97-7.38Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.39l-3.24-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.59-4.13H3.06v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.93A6.01 6.01 0 0 1 6.1 12c0-.67.11-1.32.31-1.93v-2.6H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.53l3.35-2.6Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.94 5.47l3.35 2.6C7.2 7.7 9.4 5.94 12 5.94Z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path fill="#F25022" d="M2 2h9.4v9.4H2z" />
      <path fill="#7FBA00" d="M12.6 2H22v9.4h-9.4z" />
      <path fill="#00A4EF" d="M2 12.6h9.4V22H2z" />
      <path fill="#FFB900" d="M12.6 12.6H22V22h-9.4z" />
    </svg>
  );
}

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
  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [socialLoading, setSocialLoading] = useState<OAuthStrategy | null>(null);
  const loading = signInStatus === "fetching" || signUpStatus === "fetching" || Boolean(socialLoading);

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

  async function signUpWith(strategy: OAuthStrategy) {
    setError("");
    setSocialLoading(strategy);

    const metadata: Record<string, string> = {};
    if (name.trim()) metadata.markaiName = name.trim();
    if (workspaceName.trim()) metadata.workspaceName = workspaceName.trim();

    try {
      const result = await signUp.sso({
        strategy,
        redirectCallbackUrl: "/sso-callback",
        redirectUrl: "/auth/complete",
        unsafeMetadata: metadata,
      });
      if (result.error) throw new Error(errorMessage(result.error, "Não foi possível continuar com este método."));
    } catch (cause) {
      setSocialLoading(null);
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar o registo externo.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim().toLowerCase();

    try {
      if (mode === "register") {
        const result = await signUp.password({
          emailAddress: email,
          password,
          unsafeMetadata: { markaiName: name.trim(), workspaceName: workspaceName.trim() },
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
      <form className="auth-form auth-verification-form" onSubmit={handleVerify}>
        <div className="auth-verification-head">
          <span className="auth-verification-icon"><Mail size={19} /></span>
          <div>
            <strong>Confirma o teu email</strong>
            <p>Enviámos um código de 6 dígitos. Introduz-o abaixo para ativar a conta.</p>
          </div>
        </div>
        <div className="field">
          <label htmlFor="verificationCode">Código de verificação</label>
          <div className="input-shell auth-code-input">
            <ShieldCheck size={17} />
            <input
              id="verificationCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="button button-primary auth-submit" disabled={loading} type="submit">
          {loading ? <><LoaderCircle size={17} className="spin" /> A verificar...</> : <>Confirmar e continuar <ArrowRight size={17} /></>}
        </button>
        <button className="auth-resend" type="button" disabled={loading} onClick={() => signUp.verifications.sendEmailCode()}>
          Não recebeste? Reenviar código
        </button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {mode === "register" && (
        <div className="auth-social-block">
          <div className="auth-social-grid">
            <button className="auth-social-button auth-social-button-google" type="button" disabled={loading} onClick={() => signUpWith("oauth_google")}>
              <span className="auth-social-icon"><GoogleIcon /></span>
              {socialLoading === "oauth_google" ? <><LoaderCircle size={16} className="spin" /> A abrir Google...</> : "Continuar com Google"}
            </button>
            <button className="auth-social-button" type="button" disabled={loading} onClick={() => signUpWith("oauth_microsoft")}>
              <span className="auth-social-icon"><MicrosoftIcon /></span>
              {socialLoading === "oauth_microsoft" ? <><LoaderCircle size={16} className="spin" /> A abrir...</> : "Microsoft"}
            </button>
          </div>
          <div className="auth-divider"><span>ou cria a conta com email</span></div>
        </div>
      )}

      {mode === "register" && (
        <div className="auth-form-grid">
          <div className="field">
            <label htmlFor="name">O teu nome</label>
            <div className="input-shell">
              <UserRound size={17} />
              <input
                id="name"
                name="name"
                placeholder="Rodrigo Duarte"
                minLength={2}
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="workspaceName">Nome da agência</label>
            <div className="input-shell">
              <Building2 size={17} />
              <input
                id="workspaceName"
                name="workspaceName"
                placeholder="A minha agência"
                minLength={2}
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                required
              />
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
          {mode === "register" && <span>8+ caracteres</span>}
        </div>
        <div className="input-shell">
          <LockKeyhole size={17} />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={mode === "login" ? "A tua palavra-passe" : "Cria uma palavra-passe segura"}
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

      {error && <div className="form-error" role="alert">{error}</div>}

      <button className="button button-primary auth-submit" disabled={loading} type="submit">
        {loading && !socialLoading ? (
          <><LoaderCircle size={17} className="spin" /> A processar...</>
        ) : (
          <>{mode === "login" ? "Entrar no MarkAI" : "Criar conta grátis"} <ArrowRight size={17} /></>
        )}
      </button>

      <div className="auth-security-note">
        <ShieldCheck size={16} />
        <span>{mode === "login" ? "Autenticação protegida pelo Clerk." : "Sem cartão. Autenticação e verificação protegidas pelo Clerk."}</span>
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
