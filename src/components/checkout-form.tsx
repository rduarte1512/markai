"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, LoaderCircle, LockKeyhole, ShieldCheck, Wallet } from "lucide-react";
import type { BillingCycle, PlanDefinition } from "@/lib/plans";
import { getPlanPrice } from "@/lib/plans";

type PaymentMethodId =
  | "card"
  | "apple_pay"
  | "google_pay"
  | "paypal"
  | "klarna"
  | "link"
  | "sepa_debit"
  | "ideal"
  | "mb_way"
  | "revolut_pay"
  | "skrill";

type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
  detail: string;
  mark: string;
  badge: string;
  disabled?: boolean;
};

const paymentMethods: PaymentMethod[] = [
  { id: "card", label: "Cartão", detail: "Visa, Mastercard, American Express", mark: "▰", badge: "PCI-DSS" },
  { id: "apple_pay", label: "Apple Pay", detail: "Sem digitar o cartão no iPhone e Mac", mark: " Pay", badge: "1 toque" },
  { id: "google_pay", label: "Google Pay", detail: "Pagamento rápido com Google Wallet", mark: "G Pay", badge: "Wallet" },
  { id: "paypal", label: "PayPal", detail: "Conta PayPal ou cartão", mark: "PayPal", badge: "Protegido" },
  { id: "klarna", label: "Klarna", detail: "Paga depois ou em prestações quando elegível", mark: "Klarna", badge: "BNPL" },
  { id: "link", label: "Link", detail: "Checkout rápido da Stripe", mark: "Link", badge: "Stripe" },
  { id: "sepa_debit", label: "SEPA Direct Debit", detail: "Débito direto em contas bancárias europeias", mark: "SEPA", badge: "Recorrente" },
  { id: "ideal", label: "iDEAL", detail: "Método popular nos Países Baixos", mark: "iDEAL", badge: "NL" },
  { id: "mb_way", label: "MB WAY", detail: "Disponível futuramente para pagamentos compatíveis", mark: "MB", badge: "Portugal", disabled: true },
  { id: "revolut_pay", label: "Revolut Pay", detail: "Pagamento rápido para clientes Revolut", mark: "R", badge: "UE" },
  { id: "skrill", label: "Skrill", detail: "Requer provider externo antes da ativação", mark: "S", badge: "Externo", disabled: true },
];

export function CheckoutForm({ plan, cycle, email }: { plan: PlanDefinition; cycle: BillingCycle; email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("card");
  const price = getPlanPrice(plan, cycle);
  const total = cycle === "annual" ? price * 12 : price;

  const selectedMethod = useMemo(
    () => paymentMethods.find((method) => method.id === paymentMethod) || paymentMethods[0],
    [paymentMethod],
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("markai-checkout-method") as PaymentMethodId | null;
      const method = paymentMethods.find((item) => item.id === saved && !item.disabled);
      if (method) setPaymentMethod(method.id);
    } catch {
      // Checkout works normally when local storage is unavailable.
    }
  }, []);

  function chooseMethod(method: PaymentMethod) {
    if (method.disabled) return;
    setPaymentMethod(method.id);
    setError("");
    try { window.localStorage.setItem("markai-checkout-method", method.id); } catch {}
  }

  async function activatePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedMethod.disabled) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.key, cycle, paymentMethod }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível ativar o plano.");
      router.push(`/dashboard/plans?upgraded=1&payment=${paymentMethod}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="co-paycard" onSubmit={activatePlan}>
      <header className="co-paycard-head">
        <h2>Como queres pagar</h2>
        <p>Escolhe o método que preferires — os teus dados ficam encriptados.</p>
      </header>

      <div className="co-method-list">
        {paymentMethods.map((method) => {
          const active = paymentMethod === method.id;
          return (
            <button
              type="button"
              className={`co-method m-${method.id}${active ? " active" : ""}`}
              data-method={method.id}
              aria-pressed={active}
              disabled={method.disabled}
              onClick={() => chooseMethod(method)}
              key={method.id}
            >
              <span className="co-method-mark"><strong>{method.mark}</strong></span>
              <span className="co-method-copy"><strong>{method.label}</strong><small>{method.detail}</small></span>
              <span className="co-method-side">
                <em className="co-method-badge">{method.disabled ? "Em breve" : method.badge}</em>
                <span className="co-radio"><Check size={10} strokeWidth={3.4}/></span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="co-field">
        <label htmlFor="billingEmail">Email de faturação</label>
        <input className="co-input" id="billingEmail" type="email" value={email} readOnly />
      </div>

      {paymentMethod === "card" ? (
        <div className="co-card-fields">
          <div className="co-field">
            <label htmlFor="cardName">Nome no cartão</label>
            <input className="co-input" id="cardName" type="text" placeholder="Nome completo ou empresa" autoComplete="cc-name" required />
          </div>
          <div className="co-field">
            <label htmlFor="cardNumber">Número do cartão</label>
            <div className="co-card-input">
              <CreditCard size={17}/>
              <input className="co-input" id="cardNumber" type="text" inputMode="numeric" placeholder="4242 4242 4242 4242" maxLength={19} autoComplete="cc-number" required />
              <span className="co-card-brand">VISA</span>
            </div>
          </div>
          <div className="co-form-row">
            <div className="co-field">
              <label htmlFor="cardExpiry">Validade</label>
              <input className="co-input" id="cardExpiry" type="text" inputMode="numeric" placeholder="MM/AA" maxLength={5} autoComplete="cc-exp" required />
            </div>
            <div className="co-field">
              <label htmlFor="cardCvc">CVC</label>
              <input className="co-input" id="cardCvc" type="text" inputMode="numeric" placeholder="123" maxLength={4} autoComplete="cc-csc" required />
            </div>
          </div>
        </div>
      ) : (
        <div className="co-provider">
          <Wallet size={18}/>
          <div><strong>Continua com {selectedMethod.label}</strong><p>A autenticação e os dados deste método são recolhidos pelo provider de forma segura. Não partilhamos os teus dados de pagamento.</p></div>
        </div>
      )}

      <label className="co-consent">
        <input type="checkbox" required />
        <span>Autorizo a renovação automática do plano e aceito que o método escolhido seja usado nas próximas renovações quando suportado.</span>
      </label>

      {error && <div className="form-error">{error}</div>}

      <button className={`co-pay${loading ? " loading" : ""}`} type="submit" disabled={loading || selectedMethod.disabled}>
        <span className="co-pay-inner"><LockKeyhole size={16}/><span>{paymentMethod === "card" ? `Pagar ${total.toLocaleString("pt-PT")}€` : `Continuar com ${selectedMethod.label} · ${total.toLocaleString("pt-PT")}€`}</span></span>
        <span className="co-pay-loading"><LoaderCircle className="co-spin" size={17}/> A processar…</span>
      </button>

      <div className="co-security">
        <span><ShieldCheck size={14}/>Pagamento protegido</span>
        <span><LockKeyhole size={14}/>Upgrade imediato</span>
        <span><Check size={14}/>Cancela quando quiseres</span>
      </div>

      <p className="co-demo-note">O checkout mantém a lógica atual da MarkAI. Os métodos apresentados em produção dependem da disponibilidade e configuração do provider de pagamentos.</p>
    </form>
  );
}
