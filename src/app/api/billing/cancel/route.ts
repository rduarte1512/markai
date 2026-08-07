import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
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

    const sql = getSql();
    const rows = (await sql`
      update subscriptions
      set cancel_at_period_end = true,
          updated_at = now()
      where workspace_id = ${billing.billing_workspace_id}::uuid
        and plan_key <> 'free'
      returning current_period_end
    `) as unknown as Array<{ current_period_end: string }>;

    if (!rows[0]) {
      return NextResponse.json({ error: "Não existe um plano pago ativo para cancelar." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, endsAt: rows[0].current_period_end });
  } catch (cause) {
    console.error("Subscription cancellation error:", cause);
    return NextResponse.json({ error: "Não foi possível cancelar o plano." }, { status: 500 });
  }
}
