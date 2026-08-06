import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const sql = getSql();
  const rows = (await sql`
    select
      monthly_balance,
      extra_balance,
      monthly_allowance,
      monthly_balance + extra_balance as balance,
      updated_at
    from credit_wallets
    where workspace_id = ${session.workspaceId}::uuid
    limit 1
  `) as unknown as Array<{
    monthly_balance: number;
    extra_balance: number;
    monthly_allowance: number;
    balance: number;
    updated_at: string;
  }>;

  const wallet = rows[0];
  if (!wallet) {
    return NextResponse.json({ error: "Carteira de créditos não encontrada." }, { status: 404 });
  }

  return NextResponse.json(
    {
      balance: Number(wallet.balance),
      monthlyBalance: Number(wallet.monthly_balance),
      extraBalance: Number(wallet.extra_balance),
      allowance: Number(wallet.monthly_allowance),
      updatedAt: wallet.updated_at,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
