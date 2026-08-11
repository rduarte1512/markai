"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import styles from "./login-v2.module.css";
import oauthStyles from "./login-oauth.module.css";

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

const oauthErrors: Record<string, string> = {
  not_configured: "Este método de login ainda não está configurado no servidor.",
  cancelled: "O login externo foi cancelado.",
  invalid_state: "A sessão de login expirou. Tenta novamente.",
  token_exchange_failed: "Não foi possível validar o login com o fornecedor.",
  profile_failed: "Não foi possível obter o perfil da tua conta.",
  email_unavailable: "Esta conta não disponibilizou um email válido ao MarkAI.",
  email_unverified: "O email desta conta Google ainda não está verificado.",
  oauth_failed: "Não foi possível concluir o login externo. Tenta novamente.",
};

export function LoginV2Form() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("oauth_error");
    const provider = params.get("provider");
    if (!code) return;
    const label = provider === "microsoft" ? "Microsoft" : provider === "google" ? "Google" : "fornecedor";
    setFormError(`${label}: ${oauthErrors[code] || oauthErrors.oauth_failed}`);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError("");
    setPasswordError("");
    setFormError("");

    const normalizedEmail = email.trim();
    const validEmail = /^\S+@\S+\.\S{2,}$/.test(normalizedEmail);
    let valid = true;

    if (!validEmail) {
      setEmailError("Introduz um email válido.");
      valid = false;
    }
    if (password.length < 8) {
      setPasswordError("A palavra-passe deve ter pelo menos 8 caracteres.");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const data = (await response.json()) as { error?: string; next?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível iniciar sessão.");

      router.push(data.next || "/dashboard");
      router.refresh();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={oauthStyles.oauthBlock}>
        <div className={oauthStyles.providers}>
          <a className={oauthStyles.providerButton} href="/api/auth/oauth/google">
            <span className={oauthStyles.providerIcon}><GoogleIcon /></span>
            Continuar com Google
          </a>
          <a className={oauthStyles.providerButton} href="/api/auth/oauth/microsoft">
            <span className={oauthStyles.providerIcon}><MicrosoftIcon /></span>
            Continuar com Microsoft
          </a>
        </div>
        <div className={oauthStyles.divider}><span>ou entra com email</span></div>
      </div>

      <div className={`${styles.field} ${emailError ? styles.invalid : ""}`}>
        <label htmlFor="login-email">Email profissional</label>
        <div className={styles.inputShell}>
          <Mail size={17} aria-hidden="true" />
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@agencia.pt"
            value={email}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "login-email-error" : undefined}
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailError("");
              setFormError("");
            }}
          />
        </div>
        {emailError && (
          <p className={styles.fieldError} id="login-email-error" role="alert">
            <CircleAlert size={14} aria-hidden="true" /> {emailError}
          </p>
        )}
      </div>

      <div className={`${styles.field} ${passwordError ? styles.invalid : ""}`}>
        <div className={styles.fieldTop}>
          <label htmlFor="login-password">Palavra-passe</label>
          <Link className={styles.forgot} href="/recover">Esqueceste-te da palavra-passe?</Link>
        </div>
        <div className={styles.inputShell}>
          <LockKeyhole size={17} aria-hidden="true" />
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="A tua palavra-passe"
            minLength={8}
            value={password}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? "login-password-error" : undefined}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError("");
              setFormError("");
            }}
          />
          <button
            className={styles.passwordToggle}
            type="button"
            aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {passwordError && (
          <p className={styles.fieldError} id="login-password-error" role="alert">
            <CircleAlert size={14} aria-hidden="true" /> {passwordError}
          </p>
        )}
      </div>

      {formError && <div className={styles.formError} role="alert"><CircleAlert size={15} /> {formError}</div>}

      <button className={styles.submit} type="submit" disabled={loading} aria-busy={loading}>
        {loading ? <><LoaderCircle className={styles.spin} size={17} /> A entrar…</> : <>Entrar no MarkAI <ArrowRight size={17} /></>}
      </button>

      <p className={styles.secureNote}><ShieldCheck size={14} /> Os teus dados e marcas ficam protegidos.</p>

      <p className={styles.signupRow}>Ainda não tens conta? <Link href="/register">Criar conta gratuitamente</Link></p>

      <div className={styles.trustRow}>
        <span><Check size={12} /> Ligação segura</span>
        <span><Check size={12} /> Dados protegidos</span>
      </div>
    </form>
  );
}
