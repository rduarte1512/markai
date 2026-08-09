import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { getBillingWorkspaceForUser } from "@/lib/workspaces";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const billing = await getBillingWorkspaceForUser(session.userId, session.workspaceId);
    if (!billing) return NextResponse.json({ error: "Workspace inválido." }, { status: 403 });
    if (billing.owner_id !== session.userId) {
      return NextResponse.json({ error: "Só o proprietário pode cancelar o plano desta conta." }, { status: 403 });
    }

    const freePlan = getPlan("free");
    const sql = getSql();
    const now = new Date();
    const walletEnd = new Date(now);
    walletEnd.setMonth(walletEnd.getMonth() + 1);

    const rows = (await sql`
      select plan_key
      from subscriptions
      where workspace_id = ${billing.billing_workspace_id}::uuid
      limit 1
    `) as unknown as Array<{ plan_key: string }>;

    if (!rows[0] || rows[0].plan_key === "free") {
      return NextResponse.json({ error: "Não existe um plano pago ativo para cancelar." }, { status: 400 });
    }

    await sql`
      update workspaces
      set plan_key = 'free', updated_at = now()
      where owner_id = ${billing.owner_id}::uuid
    `;

    await sql`
      update subscriptions
      set plan_key = 'free',
          status = 'canceled',
          provider = 'markai_demo_free',
          cancel_at_period_end = false,
          current_period_end = now(),
          updated_at = now()
      where workspace_id = ${billing.billing_workspace_id}::uuid
    `;

    await sql`
      update credit_wallets
      set monthly_allowance = ${freePlan.credits},
          monthly_balance = least(monthly_balance, ${freePlan.credits}),
          period_start = ${now.toISOString()},
          period_end = ${walletEnd.toISOString()},
          updated_at = now()
      where workspace_id = ${billing.billing_workspace_id}::uuid
    `;

    return NextResponse.json({
      ok: true,
      plan: "free",
      credits: freePlan.credits,
      workspaceLimit: freePlan.workspaceLimit,
    });
  } catch (cause) {
    console.error("Subscription cancellation error:", cause);
    return NextResponse.json({ error: "Não foi possível cancelar o plano." }, { status: 500 });
  }
}
