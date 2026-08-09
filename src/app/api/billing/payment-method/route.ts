import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  encodeDemoPaymentProvider,
  isBillingPaymentMethod,
  parseDemoPaymentProvider,
  sanitizeCardBrand,
  sanitizeExpiry,
  sanitizeLast4,
} from "@/lib/billing-payment";
import { getSql } from "@/lib/db";
import { getBillingWorkspaceForUser } from "@/lib/workspaces";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const billing = await getBillingWorkspaceForUser(session.userId, session.workspaceId);
    if (!billing) return NextResponse.json({ error: "Workspace inválido." }, { status: 403 });

    const sql = getSql();
    const rows = (await sql`
      select provider
      from subscriptions
      where workspace_id = ${billing.billing_workspace_id}::uuid
      limit 1
    `) as unknown as Array<{ provider: string | null }>;

    return NextResponse.json({ paymentMethod: parseDemoPaymentProvider(rows[0]?.provider) });
  } catch (cause) {
    console.error("Payment method fetch error:", cause);
    return NextResponse.json({ error: "Não foi possível carregar o método de pagamento." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const billing = await getBillingWorkspaceForUser(session.userId, session.workspaceId);
    if (!billing) return NextResponse.json({ error: "Workspace inválido." }, { status: 403 });
    if (billing.owner_id !== session.userId) {
      return NextResponse.json({ error: "Só o proprietário pode alterar o método de pagamento." }, { status: 403 });
    }

    const body = (await request.json()) as {
      paymentMethod?: string;
      cardBrand?: string;
      cardLast4?: string;
      cardExpiry?: string;
    };
    const paymentMethod = String(body.paymentMethod || "");
    if (!isBillingPaymentMethod(paymentMethod)) {
      return NextResponse.json({ error: "Método de pagamento inválido." }, { status: 400 });
    }

    const safeDetails = paymentMethod === "card"
      ? {
          brand: sanitizeCardBrand(body.cardBrand),
          last4: sanitizeLast4(body.cardLast4),
          expiry: sanitizeExpiry(body.cardExpiry),
        }
      : undefined;

    if (paymentMethod === "card" && (!safeDetails?.last4 || !safeDetails.expiry)) {
      return NextResponse.json({ error: "Confirma os últimos 4 dígitos e a validade do cartão." }, { status: 400 });
    }

    const sql = getSql();
    const provider = encodeDemoPaymentProvider(paymentMethod, safeDetails);
    const rows = (await sql`
      update subscriptions
      set provider = ${provider}, updated_at = now()
      where workspace_id = ${billing.billing_workspace_id}::uuid
        and plan_key <> 'free'
      returning provider
    `) as unknown as Array<{ provider: string }>;

    if (!rows[0]) {
      return NextResponse.json({ error: "Não existe uma subscrição paga ativa para editar." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, paymentMethod: parseDemoPaymentProvider(rows[0].provider) });
  } catch (cause) {
    console.error("Payment method update error:", cause);
    return NextResponse.json({ error: "Não foi possível atualizar o método de pagamento." }, { status: 500 });
  }
}
