"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  CreditCard,
  Landmark,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
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
  mark?: string;
  badge?: string;
  disabled?: boolean;
  note?: string;
  icon?: "card" | "wallet" | "bank";
};

const paymentGroups: Array<{ label: string; methods: PaymentMethod[] }> = [
  {
    label: "Cartões e carteiras",
    methods: [
      { id: "card", label: "Cartão", detail: "Visa · Mastercard · Amex", icon: "card", badge: "Global" },
      { id: "apple_pay", label: "Apple Pay", detail: "Pagamento rápido em dispositivos Apple", mark: "", badge: "Wallet" },
      { id: "google_pay", label: "Google Pay", detail: "Pagamento rápido com Google Wallet", mark: "G", badge: "Wallet" },
      { id: "link", label: "Link", detail: "Checkout rápido da Stripe", mark: "L", badge: "Stripe" },
      { id: "paypal", label: "PayPal", detail: "Conta PayPal e pagamentos recorrentes elegíveis", mark: "P", badge: "Recorrente" },
      { id: "revolut_pay", label: "Revolut Pay", detail: "Wallet Revolut para clientes UK e UE", mark: "R", badge: "UE" },
    ],
  },
  {
    label: "Pagar depois",
    methods: [
      { id: "klarna", label: "Klarna", detail: "Pagar depois ou em prestações, quando elegível", mark: "K", badge: "BNPL" },
    ],
  },
  {
    label: "Débito bancário",
    methods: [
      { id: "sepa_debit", label: "SEPA Direct Debit", detail: "Débito direto em contas bancárias europeias", icon: "bank", badge: "Recorrente" },
      { id: "ideal", label: "iDEAL", detail: "Popular nos Países Baixos; recorrência via SEPA", mark: "iD", badge: "NL" },
    ],
  },
  {
    label: "Métodos locais e adicionais",
    methods: [
      {
        id: "mb_way",
        label: "MB WAY",
        detail: "Wallet portuguesa por número de telemóvel",
        mark: "MB",
        badge: "Portugal",
        disabled: true,
        note: "A Stripe não suporta MB WAY para renovações automáticas de subscrições. Mantemos a opção visível para uma futura modalidade de pagamento único/manual.",
      },
      {
        id: "skrill",
        label: "Skrill",
        detail: "Wallet digital internacional",
        mark: "S",
        badge: "Externo",
        disabled: true,
        note: "Skrill não é um método nativo da Stripe e precisa de uma integração de provider separada antes de poder cobrar de forma segura.",
      },
    ],
  },
];

function MethodMark({ method }: { method: PaymentMethod }) {
  if (method.icon === "card") return <CreditCard size={19} />;
  if (method.icon === "wallet") return <Wallet size={19} />;
  if (method.icon === "bank") return <Landmark size={19} />;
  return <strong>{method.mark}</strong>;
}

export function CheckoutForm({ plan, cycle, email }: { plan: PlanDefinition; cycle: BillingCycle; email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("card");
  const price = getPlanPrice(plan, cycle);
  const total = cycle === "annual" ? price * 12 : price;

  const selectedMethod = useMemo(
    () => paymentGroups.flatMap((group) => group.methods).find((method) => method.id === paymentMethod) || paymentGroups[0].methods[0],
    [paymentMethod],
  );

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
    <form className="checkout-form-card payment-checkout-v2" onSubmit={activatePlan}>
      <div className="checkout-form-heading">
        <span><CreditCard size={19}/></span>
        <div><h2>Escolhe como queres pagar</h2><p>Métodos globais, europeus e locais num único checkout.</p></div>
      </div>

      <div className="checkout-payment-groups">
        {paymentGroups.map((group) => (
          <section className="checkout-payment-group" key={group.label}>
            <div className="checkout-payment-group-title"><span>{group.label}</span><small>{group.methods.length} {group.methods.length === 1 ? "opção" : "opções"}</small></div>
            <div className="checkout-payment-method-grid">
              {group.methods.map((method) => {
                const active = paymentMethod === method.id;
                return (
                  <button
                    aria-pressed={active}
                    className={`checkout-payment-method method-${method.id}${active ? " active" : ""}${method.disabled ? " disabled" : ""}`}
                    disabled={method.disabled}
                    key={method.id}
                    onClick={() => !method.disabled && setPaymentMethod(method.id)}
                    type="button"
                  >
                    <span className="checkout-payment-method-mark"><MethodMark method={method} /></span>
                    <span className="checkout-payment-method-copy">
                      <strong>{method.label}</strong>
                      <small>{method.detail}</small>
                    </span>
                    <span className="checkout-payment-method-side">
                      <em>{method.badge}</em>
                      {active && <CheckCircle2 size={16} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="checkout-selected-method">
        <span className="checkout-selected-icon"><MethodMark method={selectedMethod} /></span>
        <div>
          <small>Método selecionado</small>
          <strong>{selectedMethod.label}</strong>
          <p>{selectedMethod.detail}</p>
        </div>
        <span className="checkout-selected-secure"><LockKeyhole size={13}/> Seguro</span>
      </div>

      <div className="field"><label>Email de faturação</label><input className="input" value={email} readOnly /></div>

      {paymentMethod === "card" ? (
        <div className="checkout-card-fields">
          <div className="field"><label>Nome no cartão</label><input className="input" placeholder="Nome completo ou empresa" required /></div>
          <div className="field">
            <label>Número do cartão</label>
            <div className="checkout-card-input"><CreditCard size={17}/><input inputMode="numeric" placeholder="4242 4242 4242 4242" maxLength={19} required/><span>VISA</span></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Validade</label><input className="input" placeholder="MM/AA" maxLength={5} required /></div>
            <div className="field"><label>CVC</label><input className="input" placeholder="123" maxLength={4} required /></div>
          </div>
        </div>
      ) : (
        <div className="checkout-provider-message">
          <Wallet size={18}/>
          <div>
            <strong>Continua com {selectedMethod.label}</strong>
            <p>Num checkout Stripe em produção, a autenticação e os dados específicos deste método são recolhidos pelo provider de forma segura.</p>
          </div>
        </div>
      )}

      <label className="checkout-consent"><input type="checkbox" required/><span>Autorizo a renovação automática do plano e aceito que o método escolhido seja usado nas próximas renovações quando suportado.</span></label>

      {error && <div className="form-error">{error}</div>}

      <button className="button button-primary checkout-pay-button" disabled={loading || selectedMethod.disabled} type="submit">
        {loading ? <><LoaderCircle className="spin" size={17}/> A processar...</> : <><LockKeyhole size={16}/> Continuar com {selectedMethod.label} · {total}€</>}
      </button>

      <div className="checkout-security-grid">
        <span><ShieldCheck size={15}/> Pagamento protegido</span>
        <span><Sparkles size={15}/> Upgrade imediato</span>
        <span><Check size={15}/> Cancela quando quiseres</span>
      </div>

      <div className="checkout-method-availability-note">
        <ShieldCheck size={16}/>
        <p><strong>Disponibilidade inteligente.</strong> Em produção, a Stripe apresenta apenas os métodos elegíveis para o país, moeda, dispositivo e tipo de subscrição do cliente. MB WAY e Skrill ficam identificados acima com as respetivas limitações.</p>
      </div>
      <p className="checkout-demo-note">Nesta fase, o checkout continua em modo de demonstração e não faz uma cobrança real. A seleção do método já fica preparada na experiência e no backend, mas nenhuma credencial de pagamento é guardada.</p>
    </form>
  );
}
