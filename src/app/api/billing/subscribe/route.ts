import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
import {
  encodeDemoPaymentProvider,
  isBillingPaymentMethod,
  sanitizeCardBrand,
  sanitizeExpiry,
  sanitizeLast4,
} from "@/lib/billing-payment";
import { getPlan } from "@/lib/plans";
import { getBillingWorkspaceForUser } from "@/lib/workspaces";
import type { PlanKey } from "@/lib/types";

const PAID_PLANS: PlanKey[] = ["starter", "pro", "agency"];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const body = (await request.json()) as {
      plan?: string;
      cycle?: string;
      paymentMethod?: string;
      cardBrand?: string;
      cardLast4?: string;
      cardExpiry?: string;
    };
    const planKey = body.plan as PlanKey;
    const cycle = body.cycle === "annual" ? "annual" : "monthly";
    const paymentMethod = String(body.paymentMethod || "card");

    if (!PAID_PLANS.includes(planKey)) {
      return NextResponse.json({ error: "Seleciona um plano pago válido." }, { status: 400 });
    }

    if (!isBillingPaymentMethod(paymentMethod)) {
      if (paymentMethod === "mb_way") {
        return NextResponse.json(
          { error: "MB WAY não suporta renovação automática de subscrições neste fluxo. Escolhe outro método de pagamento." },
          { status: 400 },
        );
      }
      if (paymentMethod === "skrill") {
        return NextResponse.json(
          { error: "Skrill requer uma integração de pagamentos separada antes de poder ser usado neste checkout." },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: "Método de pagamento inválido." }, { status: 400 });
    }

    const billing = await getBillingWorkspaceForUser(session.userId, session.workspaceId);
    if (!billing) return NextResponse.json({ error: "Workspace inválido." }, { status: 403 });
    if (billing.owner_id !== session.userId) {
      return NextResponse.json({ error: "Só o proprietário pode alterar o plano desta conta." }, { status: 403 });
    }

    const safeCardDetails = paymentMethod === "card"
      ? {
          brand: sanitizeCardBrand(body.cardBrand),
          last4: sanitizeLast4(body.cardLast4),
          expiry: sanitizeExpiry(body.cardExpiry),
        }
      : undefined;

    if (paymentMethod === "card" && (!safeCardDetails?.last4 || !safeCardDetails.expiry)) {
      return NextResponse.json({ error: "Confirma o número e a validade do cartão." }, { status: 400 });
    }

    const plan = getPlan(planKey);
    const sql = getSql();
    const now = new Date();
    const subscriptionEnd = new Date(now);
    const walletEnd = new Date(now);
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + (cycle === "annual" ? 12 : 1));
    walletEnd.setMonth(walletEnd.getMonth() + 1);

    await sql`select ensure_monthly_credit_reset(${billing.billing_workspace_id}::uuid)`;

    await sql`
      update workspaces
      set plan_key = ${planKey}, updated_at = now()
      where owner_id = ${billing.owner_id}::uuid
    `;

    const provider = encodeDemoPaymentProvider(paymentMethod, safeCardDetails);

    await sql`
      insert into subscriptions (
        workspace_id, plan_key, status, provider, current_period_start,
        current_period_end, cancel_at_period_end, updated_at
      ) values (
        ${billing.billing_workspace_id}::uuid, ${planKey}, 'active', ${provider}, ${now.toISOString()},
        ${subscriptionEnd.toISOString()}, false, now()
      )
      on conflict (workspace_id) do update set
        plan_key = excluded.plan_key,
        status = 'active',
        provider = excluded.provider,
        current_period_start = excluded.current_period_start,
        current_period_end = excluded.current_period_end,
        cancel_at_period_end = false,
        updated_at = now()
    `;

    await sql`
      update credit_wallets
      set monthly_allowance = ${plan.credits},
          monthly_balance = greatest(monthly_balance, ${plan.credits}),
          period_start = ${now.toISOString()},
          period_end = ${walletEnd.toISOString()},
          updated_at = now()
      where workspace_id = ${billing.billing_workspace_id}::uuid
    `;

    return NextResponse.json({
      ok: true,
      plan: planKey,
      cycle,
      paymentMethod,
      workspaceLimit: plan.workspaceLimit,
    });
  } catch (cause) {
    console.error("Subscription activation error:", cause);
    return NextResponse.json({ error: "Não foi possível ativar o plano." }, { status: 500 });
  }
}
