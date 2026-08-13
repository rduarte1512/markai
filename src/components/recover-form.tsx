"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { clerkErrorMessage } from "@/lib/clerk-ui-errors";

type Step = "email" | "code" | "password";

export function RecoverForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const loading = fetchStatus === "fetching";

  async function sendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S{2,}$/.test(normalizedEmail)) {
      setError("Introduz um email válido.");
      return;
    }

    try {
      const created = await signIn.create({ identifier: normalizedEmail });
      if (created.error) throw new Error(clerkErrorMessage(created.error, "Não foi possível iniciar a recuperação."));
      const sent = await signIn.resetPasswordEmailCode.sendCode();
      if (sent.error) throw new Error(clerkErrorMessage(sent.error, "Não foi possível enviar o código."));
      setStep("code");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar o código de recuperação.");
    }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const result = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
      if (result.error) throw new Error(clerkErrorMessage(result.error, "Código inválido."));
      if (signIn.status !== "needs_new_password") {
        throw new Error("A verificação ainda não ficou concluída.");
      }
      setStep("password");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível validar o código.");
    }
  }

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("A nova palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }

    try {
      const result = await signIn.resetPasswordEmailCode.submitPassword({
        password,
        signOutOfOtherSessions: true,
      });
      if (result.error) throw new Error(clerkErrorMessage(result.error, "Não foi possível alterar a palavra-passe."));

      if (signIn.status !== "complete") {
        throw new Error("A recuperação foi validada, mas existe uma verificação adicional pendente.");
      }

      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            setError("A conta ainda precisa de concluir uma verificação adicional.");
            return;
          }
          const target = decorateUrl("/auth/complete");
          if (target.startsWith("http")) window.location.href = target;
          else router.push(target);
        },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir a recuperação.");
    }
  }

  if (step === "code") {
    return (
      <form className="auth-form auth-verification-form" onSubmit={verifyCode}>
        <div className="auth-verification-head">
          <span className="auth-verification-icon"><Mail size={19} /></span>
          <div><strong>Confirma o código</strong><p>Enviámos um código de recuperação para {email.trim()}.</p></div>
        </div>
        <div className="field">
          <label htmlFor="recover-code">Código de verificação</label>
          <div className="input-shell auth-code-input"><ShieldCheck size={17} /><input id="recover-code" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} required /></div>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="button button-primary auth-submit" disabled={loading} type="submit">{loading ? <><LoaderCircle size={17} className="spin" /> A verificar...</> : <>Confirmar código <ArrowRight size={17} /></>}</button>
        <button className="auth-resend" type="button" disabled={loading} onClick={() => signIn.resetPasswordEmailCode.sendCode()}>Reenviar código</button>
      </form>
    );
  }

  if (step === "password") {
    return (
      <form className="auth-form" onSubmit={submitPassword}>
        <div className="field">
          <div className="field-label-row"><label htmlFor="recover-password">Nova palavra-passe</label><span>8+ caracteres</span></div>
          <div className="input-shell">
            <LockKeyhole size={17} />
            <input id="recover-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Cria uma nova palavra-passe segura" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button className="password-toggle" type="button" aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="button button-primary auth-submit" disabled={loading} type="submit">{loading ? <><LoaderCircle size={17} className="spin" /> A guardar...</> : <>Guardar e entrar <ArrowRight size={17} /></>}</button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={sendCode}>
      <div className="field">
        <label htmlFor="recover-email">Email profissional</label>
        <div className="input-shell"><Mail size={17} /><input id="recover-email" type="email" autoComplete="email" placeholder="tu@agencia.pt" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="button button-primary auth-submit" disabled={loading} type="submit">{loading ? <><LoaderCircle size={17} className="spin" /> A enviar...</> : <>Enviar código <ArrowRight size={17} /></>}</button>
    </form>
  );
}
