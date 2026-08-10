import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getGrowthAccess } from "@/lib/feature-access";
import type { PlanKey } from "@/lib/types";

const EVENT_TYPES = ["view", "click", "submit", "checkout", "purchase"] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hash(value: string) {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) result = (result * 31 + value.charCodeAt(i)) >>> 0;
  return result;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const funnelId = String(body.funnelId || "");
    const stepId = String(body.stepId || "");
    const eventType = String(body.eventType || "") as (typeof EVENT_TYPES)[number];
    const sessionKey = String(body.sessionKey || "anonymous").slice(0, 160);
    if (!UUID_RE.test(funnelId) || (stepId && !UUID_RE.test(stepId)) || !EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
    }

    const sql = getSql();
    const rows = (await sql`
      select f.id, f.settings, b.workspace_id, w.plan_key
      from funnels f
      join brands b on b.id = f.brand_id
      join workspaces w on w.id = b.workspace_id
      where f.id = ${funnelId}::uuid and f.status = 'published'
      limit 1
    `) as unknown as Array<{ id: string; settings?: Record<string, unknown>; workspace_id: string; plan_key: PlanKey }>;
    const funnel = rows[0];
    if (!funnel) return NextResponse.json({ error: "Funil não disponível." }, { status: 404 });

    const rule = getGrowthAccess(funnel.plan_key).funnelAnalytics;
    if (!rule.enabled) return NextResponse.json({ error: "Funnel Analytics não está incluído neste plano." }, { status: 403 });

    if (rule.limit < 999999) {
      const usedRows = (await sql`
        select distinct fe.funnel_id
        from funnel_events fe
        join funnels f on f.id = fe.funnel_id
        join brands b on b.id = f.brand_id
        where b.workspace_id = ${funnel.workspace_id}::uuid
        order by fe.funnel_id
        limit ${rule.limit}
      `) as unknown as Array<{ funnel_id: string }>;
      const alreadyTracked = usedRows.some((item) => item.funnel_id === funnelId);
      if (!alreadyTracked && usedRows.length >= rule.limit) {
        return NextResponse.json({ error: `O plano atual permite analytics em ${rule.limit} funil(s).` }, { status: 403 });
      }
    }

    if (stepId) {
      const step = await sql`select id from funnel_steps where id = ${stepId}::uuid and funnel_id = ${funnelId}::uuid limit 1`;
      if (!step[0]) return NextResponse.json({ error: "Etapa inválida." }, { status: 400 });
    }

    const ab = ((funnel.settings || {}).ab_test || {}) as Record<string, unknown>;
    const trafficB = Math.min(90, Math.max(10, Number(ab.traffic_b || 50)));
    const requestedVariant = String(body.variant || "").toUpperCase();
    const variant = requestedVariant === "A" || requestedVariant === "B"
      ? requestedVariant
      : ab.active ? (hash(`${funnelId}:${sessionKey}`) % 100 < trafficB ? "B" : "A") : "A";
    const rawValue = Number(body.value || 0);
    const value = Number.isFinite(rawValue) && rawValue >= 0 ? rawValue : null;
    const metadata = typeof body.metadata === "object" && body.metadata ? body.metadata : {};

    await sql`
      insert into funnel_events(funnel_id, step_id, session_key, event_type, variant_key, value, metadata)
      values (${funnelId}::uuid, ${stepId || null}::uuid, ${sessionKey}, ${eventType}, ${variant}, ${value}, ${JSON.stringify(metadata)}::jsonb)
    `;
    return NextResponse.json({ ok: true, variant });
  } catch (cause) {
    console.error("Funnel tracking failed:", cause);
    return NextResponse.json({ error: "Não foi possível registar o evento." }, { status: 500 });
  }
}
