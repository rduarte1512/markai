"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, CreditCard, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles, Wallet } from "lucide-react";
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

type PaymentStage = "form" | "pending" | "accepted";
type CardBrandId = "visa" | "mastercard" | "amex" | "discover" | "jcb" | "diners" | "unionpay" | "maestro" | "mir" | "unknown";

type CardBrand = { id: CardBrandId; label: string; short: string };

const CARD_BRANDS: Record<CardBrandId, CardBrand> = {
  visa: { id: "visa", label: "Visa", short: "VISA" },
  mastercard: { id: "mastercard", label: "Mastercard", short: "MC" },
  amex: { id: "amex", label: "American Express", short: "AMEX" },
  discover: { id: "discover", label: "Discover", short: "DISC" },
  jcb: { id: "jcb", label: "JCB", short: "JCB" },
  diners: { id: "diners", label: "Diners Club", short: "DINERS" },
  unionpay: { id: "unionpay", label: "UnionPay", short: "UP" },
  maestro: { id: "maestro", label: "Maestro", short: "MAESTRO" },
  mir: { id: "mir", label: "Mir", short: "MIR" },
  unknown: { id: "unknown", label: "Cartão", short: "CARD" },
};

const paymentMethods: PaymentMethod[] = [
  { id: "card", label: "Cartão", detail: "Visa, Mastercard, American Express e outras redes", mark: "▰", badge: "PCI-DSS" },
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

function detectCardBrand(value: string): CardBrand {
  const digits = value.replace(/\D/g, "");
  if (!digits) return CARD_BRANDS.unknown;
  if (/^4/.test(digits)) return CARD_BRANDS.visa;
  if (/^3[47]/.test(digits)) return CARD_BRANDS.amex;
  if (/^220[0-4]/.test(digits)) return CARD_BRANDS.mir;
  if (/^(?:2131|1800|35)/.test(digits)) return CARD_BRANDS.jcb;
  if (/^3(?:0[0-5]|[68])/.test(digits)) return CARD_BRANDS.diners;
  if (/^62/.test(digits)) return CARD_BRANDS.unionpay;
  if (/^(?:6011|65|64[4-9])/.test(digits)) return CARD_BRANDS.discover;
  if (/^5[1-5]/.test(digits)) return CARD_BRANDS.mastercard;
  if (digits.length >= 4) {
    const prefix = Number(digits.slice(0, 4));
    if (prefix >= 2221 && prefix <= 2720) return CARD_BRANDS.mastercard;
  }
  if (/^(?:5[06789]|6)/.test(digits)) return CARD_BRANDS.maestro;
  return CARD_BRANDS.unknown;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  const brand = detectCardBrand(digits);
  if (brand.id === "amex") return digits.slice(0, 15).replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "));
  if (brand.id === "diners") return digits.slice(0, 14).replace(/^(\d{0,4})(\d{0,6})(\d{0,4}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "));
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function CheckoutForm({ plan, cycle, email }: { plan: PlanDefinition; cycle: BillingCycle; email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [stage, setStage] = useState<PaymentStage>("form");
  const [pendingProgress, setPendingProgress] = useState(0);
  const [pendingSeconds, setPendingSeconds] = useState(0);
  const price = getPlanPrice(plan, cycle);
  const total = cycle === "annual" ? price * 12 : price;
  const cardBrand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);

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
    setPendingProgress(0);
    setStage("pending");

    const pendingMs = 20_000 + Math.floor(Math.random() * 25_001);
    setPendingSeconds(Math.round(pendingMs / 1000));
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setPendingProgress(Math.min(96, Math.round((elapsed / pendingMs) * 96)));
    }, 250);

    try {
      const responsePromise = fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.key, cycle, paymentMethod }),
      }).then(async (response) => {
        const data = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(data.error || "Não foi possível ativar o plano.");
        return data;
      });

      await Promise.all([responsePromise, wait(pendingMs)]);
      window.clearInterval(interval);
      setPendingProgress(100);
      setStage("accepted");
      await wait(2400);
      router.push(`/dashboard/checkout/success?plan=${plan.key}&cycle=${cycle}&payment=${paymentMethod}`);
      router.refresh();
    } catch (cause) {
      window.clearInterval(interval);
      setStage("form");
      setError(cause instanceof Error ? cause.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (stage === "pending") {
    const message = pendingProgress < 34 ? "A validar o método de pagamento" : pendingProgress < 72 ? "A confirmar a autorização" : "A ativar a tua subscrição";
    return (
      <section className="co-flow-card co-pending-card" aria-live="polite">
        <div className="co-flow-orbit"><span /><span /><LoaderCircle className="co-flow-spinner" size={34}/></div>
        <span className="co-flow-kicker">Pagamento pendente</span>
        <h2>Estamos a confirmar o teu pagamento.</h2>
        <p>{message}. Normalmente demora apenas alguns segundos.</p>
        <div className="co-flow-progress"><span style={{ width: `${pendingProgress}%` }} /></div>
        <div className="co-flow-meta"><span>{pendingProgress}% concluído</span><span>até ~{pendingSeconds}s</span></div>
        <div className="co-flow-steps">
          <span className={pendingProgress >= 8 ? "done" : "active"}><i>{pendingProgress >= 8 ? <Check size={12}/> : "1"}</i>Método recebido</span>
          <span className={pendingProgress >= 45 ? "done" : pendingProgress >= 8 ? "active" : ""}><i>{pendingProgress >= 45 ? <Check size={12}/> : "2"}</i>Autorização</span>
          <span className={pendingProgress >= 90 ? "done" : pendingProgress >= 45 ? "active" : ""}><i>{pendingProgress >= 90 ? <Check size={12}/> : "3"}</i>Ativar plano</span>
        </div>
        <div className="co-flow-security"><ShieldCheck size={15}/> Não feches esta página enquanto terminamos a confirmação.</div>
      </section>
    );
  }

  if (stage === "accepted") {
    return (
      <section className="co-flow-card co-accepted-card" aria-live="polite">
        <div className="co-success-burst"><span /><span /><span /><CheckCircle2 size={44}/></div>
        <span className="co-flow-kicker success">Pagamento aceite</span>
        <h2>Está tudo certo.</h2>
        <p>O plano <strong>{plan.name}</strong> foi ativado. Estamos a preparar o teu workspace com as novas vantagens.</p>
        <div className="co-accepted-plan"><Sparkles size={17}/><span><small>Plano ativo</small><strong>{plan.name}</strong></span><b>{plan.credits.toLocaleString("pt-PT")} créditos/mês</b></div>
      </section>
    );
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
              <input
                className="co-input"
                id="cardNumber"
                type="text"
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                maxLength={23}
                autoComplete="cc-number"
                value={cardNumber}
                onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                required
              />
              <span className={`co-card-brand brand-${cardBrand.id}`}>{cardBrand.short}</span>
            </div>
            <div className="co-card-network-row" aria-label="Redes de cartão reconhecidas">
              {["visa", "mastercard", "amex", "discover", "jcb", "diners", "unionpay", "maestro"].map((id) => {
                const brand = CARD_BRANDS[id as CardBrandId];
                return <span className={cardBrand.id === brand.id ? "active" : ""} key={brand.id}>{brand.short}</span>;
              })}
            </div>
            {cardNumber && <small className="co-card-detected"><CheckCircle2 size={13}/> {cardBrand.id === "unknown" ? "Rede ainda não identificada" : `${cardBrand.label} identificado automaticamente`}</small>}
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
