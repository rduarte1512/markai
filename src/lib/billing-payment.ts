export const BILLING_PAYMENT_METHODS = [
  "card",
  "apple_pay",
  "google_pay",
  "paypal",
  "klarna",
  "link",
  "sepa_debit",
  "ideal",
  "revolut_pay",
] as const;

export type BillingPaymentMethod = (typeof BILLING_PAYMENT_METHODS)[number];

export type BillingPaymentSummary = {
  type: BillingPaymentMethod;
  label: string;
  brand?: string;
  last4?: string;
  expiry?: string;
};

const METHOD_LABELS: Record<BillingPaymentMethod, string> = {
  card: "Cartão",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  paypal: "PayPal",
  klarna: "Klarna",
  link: "Link",
  sepa_debit: "SEPA Direct Debit",
  ideal: "iDEAL",
  revolut_pay: "Revolut Pay",
};

const CARD_BRANDS = new Set([
  "visa",
  "mastercard",
  "amex",
  "discover",
  "jcb",
  "diners",
  "unionpay",
  "maestro",
  "mir",
  "unknown",
]);

export function isBillingPaymentMethod(value: string): value is BillingPaymentMethod {
  return BILLING_PAYMENT_METHODS.includes(value as BillingPaymentMethod);
}

export function sanitizeCardBrand(value: unknown) {
  const brand = String(value || "unknown").toLowerCase();
  return CARD_BRANDS.has(brand) ? brand : "unknown";
}

export function sanitizeLast4(value: unknown) {
  const last4 = String(value || "").replace(/\D/g, "").slice(-4);
  return /^\d{4}$/.test(last4) ? last4 : "";
}

export function sanitizeExpiry(value: unknown) {
  const expiry = String(value || "").trim();
  return /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry) ? expiry : "";
}

export function encodeDemoPaymentProvider(
  type: BillingPaymentMethod,
  details?: { brand?: unknown; last4?: unknown; expiry?: unknown },
) {
  if (type !== "card") return `markai_demo|${type}`;
  const brand = sanitizeCardBrand(details?.brand);
  const last4 = sanitizeLast4(details?.last4);
  const expiry = sanitizeExpiry(details?.expiry);
  return `markai_demo|card|${brand}|${last4}|${expiry}`;
}

export function parseDemoPaymentProvider(provider: string | null | undefined): BillingPaymentSummary | null {
  if (!provider) return null;

  if (provider.startsWith("markai_demo|")) {
    const [, methodRaw, brandRaw = "", last4Raw = "", expiryRaw = ""] = provider.split("|");
    if (!isBillingPaymentMethod(methodRaw)) return null;
    if (methodRaw !== "card") return { type: methodRaw, label: METHOD_LABELS[methodRaw] };
    const brand = sanitizeCardBrand(brandRaw);
    const last4 = sanitizeLast4(last4Raw);
    const expiry = sanitizeExpiry(expiryRaw);
    return {
      type: "card",
      label: METHOD_LABELS.card,
      brand: brand === "unknown" ? undefined : brand,
      last4: last4 || undefined,
      expiry: expiry || undefined,
    };
  }

  // Compatibility with subscriptions created before safe payment metadata was added.
  if (provider.startsWith("markai_demo:")) {
    const methodRaw = provider.slice("markai_demo:".length).split(":")[0];
    if (!isBillingPaymentMethod(methodRaw)) return null;
    return { type: methodRaw, label: METHOD_LABELS[methodRaw] };
  }

  if (provider === "markai_demo") return { type: "card", label: METHOD_LABELS.card };
  return null;
}

export function getBillingPaymentLabel(type: BillingPaymentMethod) {
  return METHOD_LABELS[type];
}
