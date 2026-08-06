import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const sql = getSql();
    const rows = (await sql`
      update subscriptions
      set cancel_at_period_end = true,
          updated_at = now()
      where workspace_id = ${session.workspaceId}
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
