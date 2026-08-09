"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CreditCard, LoaderCircle, LockKeyhole, X } from "lucide-react";
import type { BillingPaymentMethod, BillingPaymentSummary } from "@/lib/billing-payment";
import { getBillingPaymentLabel } from "@/lib/billing-payment";

const METHODS: BillingPaymentMethod[] = [
  "card",
  "apple_pay",
  "google_pay",
  "paypal",
  "klarna",
  "link",
  "sepa_debit",
  "ideal",
  "revolut_pay",
];

const BRAND_LABELS: Record<string, string> = {
  visa: "VISA",
  mastercard: "MASTERCARD",
  amex: "AMEX",
  discover: "DISCOVER",
  jcb: "JCB",
  diners: "DINERS",
  unionpay: "UNIONPAY",
  maestro: "MAESTRO",
  mir: "MIR",
};

function detectBrand(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^220[0-4]/.test(digits)) return "mir";
  if (/^(?:2131|1800|35)/.test(digits)) return "jcb";
  if (/^3(?:0[0-5]|[68])/.test(digits)) return "diners";
  if (/^62/.test(digits)) return "unionpay";
  if (/^(?:6011|65|64[4-9])/.test(digits)) return "discover";
  if (/^5[1-5]/.test(digits)) return "mastercard";
  if (digits.length >= 4) {
    const prefix = Number(digits.slice(0, 4));
    if (prefix >= 2221 && prefix <= 2720) return "mastercard";
  }
  if (/^(?:5[06789]|6)/.test(digits)) return "maestro";
  return "unknown";
}

function formatCard(value: string) {
  return value.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function BillingPaymentMethodPanel({
  initialPaymentMethod,
  active,
}: {
  initialPaymentMethod: BillingPaymentSummary | null;
  active: boolean;
}) {
  const [paymentMethod, setPaymentMethod] = useState<BillingPaymentSummary | null>(initialPaymentMethod);
  const [editing, setEditing] = useState(false);
  const [method, setMethod] = useState<BillingPaymentMethod>(initialPaymentMethod?.type || "card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState(initialPaymentMethod?.expiry || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const brand = useMemo(() => detectBrand(cardNumber), [cardNumber]);

  const displayBrand = paymentMethod?.type === "card"
    ? BRAND_LABELS[paymentMethod.brand || ""] || "CARTÃO"
    : paymentMethod ? getBillingPaymentLabel(paymentMethod.type).toUpperCase() : "—";

  async function savePaymentMethod() {
    setLoading(true);
    setMessage("");
    try {
      const digits = cardNumber.replace(/\D/g, "");
      const response = await fetch("/api/billing/payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: method,
          cardBrand: method === "card" ? brand : undefined,
          cardLast4: method === "card" ? digits.slice(-4) : undefined,
          cardExpiry: method === "card" ? expiry : undefined,
        }),
      });
      const data = (await response.json()) as { error?: string; paymentMethod?: BillingPaymentSummary };
      if (!response.ok) throw new Error(data.error || "Não foi possível atualizar o método.");
      if (data.paymentMethod) setPaymentMethod(data.paymentMethod);
      setCardNumber("");
      setMessage("Método de pagamento atualizado.");
      setEditing(false);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="settings-surface billing-payment-panel">
      <header>
        <div><CreditCard size={17}/><span><strong>Método de pagamento</strong><small>{active ? "Usado para renovações e créditos extra." : "O plano Free não precisa de método de pagamento."}</small></span></div>
        {active && <button type="button" onClick={() => { setEditing((value) => !value); setMessage(""); }}>
          {editing ? <><X size={14}/> Fechar</> : "Editar"}
        </button>}
      </header>

      {!active ? (
        <div className="billing-payment-empty">
          <CreditCard size={20}/>
          <div><strong>Nenhum método necessário</strong><small>Quando fizeres upgrade, o método escolhido no checkout aparecerá aqui.</small></div>
        </div>
      ) : !editing && (
        paymentMethod ? (
          <div className="payment-method billing-real-method">
            <span>{displayBrand}</span>
            <div>
              <strong>{paymentMethod.type === "card" ? (paymentMethod.last4 ? `•••• •••• •••• ${paymentMethod.last4}` : "Cartão protegido pelo provider") : paymentMethod.label}</strong>
              <small>{paymentMethod.type === "card" ? (paymentMethod.expiry ? `Expira ${paymentMethod.expiry}` : "Validade não disponível") : "Método associado à subscrição"}</small>
            </div>
            <CheckCircle2 size={16}/>
          </div>
        ) : (
          <div className="billing-payment-empty">
            <CreditCard size={20}/>
            <div><strong>Método ainda não configurado</strong><small>Não mostramos dados de cartão fictícios. Edita para associar um método.</small></div>
          </div>
        )
      )}

      {active && editing && (
        <div className="billing-payment-editor">
          <label>
            <span>Método</span>
            <select value={method} onChange={(event) => setMethod(event.target.value as BillingPaymentMethod)}>
              {METHODS.map((item) => <option value={item} key={item}>{getBillingPaymentLabel(item)}</option>)}
            </select>
          </label>

          {method === "card" && <>
            <label>
              <span>Novo número do cartão</span>
              <div className="billing-card-editor-input">
                <input
                  value={cardNumber}
                  onChange={(event) => setCardNumber(formatCard(event.target.value))}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="0000 0000 0000 0000"
                  maxLength={23}
                />
                <em>{BRAND_LABELS[brand] || "CARTÃO"}</em>
              </div>
            </label>
            <label>
              <span>Validade</span>
              <input
                value={expiry}
                onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/AA"
                maxLength={5}
              />
            </label>
          </>}

          <div className="billing-payment-security"><LockKeyhole size={14}/> Só guardamos método, bandeira, últimos 4 dígitos e validade. Nunca guardamos o número completo nem o CVC.</div>
          {message && <div className={message.includes("atualizado") ? "studio-success-banner" : "form-error"}>{message}</div>}
          <button className="button button-primary" type="button" disabled={loading || (method === "card" && (cardNumber.replace(/\D/g, "").length < 12 || expiry.length !== 5))} onClick={savePaymentMethod}>
            {loading ? <><LoaderCircle className="spin" size={15}/> A guardar</> : "Guardar método"}
          </button>
        </div>
      )}

      {active && !editing && message && <div className="studio-success-banner">{message}</div>}
    </section>
  );
}
