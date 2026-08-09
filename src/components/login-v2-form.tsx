"use client";

import Link from "next/link";
import { useState } from "react";
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

export function LoginV2Form() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

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
