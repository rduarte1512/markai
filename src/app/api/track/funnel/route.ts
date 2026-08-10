import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

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
      select id, settings from funnels where id = ${funnelId}::uuid and status = 'published' limit 1
    `) as unknown as Array<{ id: string; settings?: Record<string, unknown> }>;
    if (!rows[0]) return NextResponse.json({ error: "Funil não disponível." }, { status: 404 });

    if (stepId) {
      const step = await sql`select id from funnel_steps where id = ${stepId}::uuid and funnel_id = ${funnelId}::uuid limit 1`;
      if (!step[0]) return NextResponse.json({ error: "Etapa inválida." }, { status: 400 });
    }

    const ab = ((rows[0].settings || {}).ab_test || {}) as Record<string, unknown>;
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
