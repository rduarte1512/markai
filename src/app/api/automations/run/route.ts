import { NextResponse } from "next/server";
import { runAutomationRules } from "@/lib/automation-engine";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET não configurado." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const sql = getSql();
    const workspaces = (await sql`
      select distinct ar.workspace_id
      from automation_rules ar
      join workspaces w on w.id = ar.workspace_id
      where ar.enabled = true and w.plan_key in ('starter','pro','agency')
      order by ar.workspace_id
      limit 100
    `) as unknown as Array<{ workspace_id: string }>;

    const results = [] as Array<{ workspaceId: string; runs: Awaited<ReturnType<typeof runAutomationRules>> }>;
    for (const workspace of workspaces) {
      const runs = await runAutomationRules(workspace.workspace_id, undefined, false);
      results.push({ workspaceId: workspace.workspace_id, runs });
    }
    return NextResponse.json({ ok: true, workspaces: results.length, results });
  } catch (cause) {
    console.error("Scheduled automations failed:", cause);
    return NextResponse.json({ error: "Falha ao executar automações." }, { status: 500 });
  }
}

export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
