import { NextResponse } from "next/server";
import { decryptSecret } from "@/lib/secret-box";
import { cleanText, enforceFeature, enforceLimit, GrowthError, requireGrowthContext } from "@/lib/growth-server";

const providers = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"] as const;
type Provider = (typeof providers)[number];

function integrationProvider(provider: Provider) {
  if (provider === "instagram" || provider === "facebook") return "meta";
  return provider;
}

function parseDate(value: unknown) {
  const text = cleanText(value, 60);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function POST(request: Request) {
  try {
    const { session, sql, plan } = await requireGrowthContext();
    const rule = enforceFeature(plan, "publisher");
    const body = (await request.json()) as Record<string, unknown>;
    const contentItemId = cleanText(body.contentItemId, 80);
    const provider = cleanText(body.provider, 30) as Provider;
    const mode = cleanText(body.mode, 20) || "schedule";
    if (!contentItemId || !providers.includes(provider)) throw new GrowthError("Seleciona conteúdo e plataforma.");

    const countRows = (await sql`
      select count(*)::int as count from social_publications
      where workspace_id = ${session.workspaceId}::uuid and created_at >= date_trunc('month', now()) and status <> 'canceled'
    `) as unknown as Array<{ count: number }>;
    enforceLimit(Number(countRows[0]?.count || 0), rule.limit, `Atingiste o limite do plano: ${rule.label}.`);

    const contentRows = (await sql`
      select ci.id, ci.brand_id, ci.title, ci.body, ci.channel, ci.status, b.name as brand_name
      from content_items ci join brands b on b.id = ci.brand_id
      where ci.id = ${contentItemId}::uuid and b.workspace_id = ${session.workspaceId}::uuid
        and ci.status in ('approved','scheduled','published')
      limit 1
    `) as unknown as Array<{ id: string; brand_id: string; title: string; body?: string; channel?: string; status: string; brand_name: string }>;
    const content = contentRows[0];
    if (!content) throw new GrowthError("O conteúdo precisa de estar aprovado antes de entrar no Publisher.", 409);

    const scheduledFor = parseDate(body.scheduledFor);
    const caption = cleanText(body.caption, 6000) || content.body || content.title;
    const wantsLive = mode === "publish";
    if (wantsLive && !rule.live) throw new GrowthError("Publicação live requer um plano pago.", 403);

    const initialStatus = wantsLive ? "ready" : scheduledFor ? "scheduled" : "ready";
    const created = (await sql`
      insert into social_publications(
        workspace_id, brand_id, content_item_id, created_by, provider, status, scheduled_for, payload
      ) values (
        ${session.workspaceId}::uuid, ${content.brand_id}::uuid, ${content.id}::uuid, ${session.userId}::uuid,
        ${provider}, ${initialStatus}, ${scheduledFor},
        ${JSON.stringify({ caption, title: content.title, originalChannel: content.channel, source: "growth_os" })}::jsonb
      ) returning id, status
    `) as unknown as Array<{ id: string; status: string }>;

    if (!wantsLive) {
      if (scheduledFor) await sql`update content_items set status = 'scheduled', scheduled_for = ${scheduledFor}, updated_at = now() where id = ${content.id}::uuid`;
      return NextResponse.json({ ok: true, publication: created[0], message: scheduledFor ? "Publicação adicionada ao calendário." : "Publicação guardada como pronta." });
    }

    const webhook = process.env.SOCIAL_PUBLISH_WEBHOOK_URL;
    if (!webhook) {
      return NextResponse.json({ ok: true, publication: created[0], message: "Publicação guardada como pronta. Define SOCIAL_PUBLISH_WEBHOOK_URL para ativar o envio live." });
    }

    const integrationKey = integrationProvider(provider);
    const integrationRows = (await sql`
      select credentials_enc, account_label, metadata from ad_integrations
      where workspace_id = ${session.workspaceId}::uuid and provider = ${integrationKey} limit 1
    `) as unknown as Array<{ credentials_enc: string; account_label?: string; metadata?: Record<string, unknown> }>;
    if (!integrationRows[0]) {
      await sql`update social_publications set status = 'ready', error_message = 'Integração não configurada' where id = ${created[0].id}::uuid`;
      throw new GrowthError("Liga primeiro esta plataforma em Definições > Integrações. A publicação ficou guardada como pronta.", 409);
    }

    await sql`update social_publications set status = 'publishing' where id = ${created[0].id}::uuid`;
    const credentials = JSON.parse(decryptSecret(integrationRows[0].credentials_enc)) as Record<string, unknown>;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.SOCIAL_PUBLISH_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.SOCIAL_PUBLISH_WEBHOOK_SECRET}` } : {}),
        },
        body: JSON.stringify({
          provider,
          workspaceId: session.workspaceId,
          brandId: content.brand_id,
          publicationId: created[0].id,
          account: integrationRows[0].account_label,
          integrationMetadata: integrationRows[0].metadata,
          credentials,
          content: { title: content.title, caption },
        }),
        signal: controller.signal,
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({})) as { externalId?: string; externalUrl?: string; error?: string };
      if (!response.ok) {
        await sql`update social_publications set status = 'failed', error_message = ${result.error || `HTTP ${response.status}`} where id = ${created[0].id}::uuid`;
        throw new GrowthError(result.error || "A plataforma recusou a publicação.", 502);
      }
      await sql`
        update social_publications set status = 'published', published_at = now(), external_id = ${result.externalId || null},
          external_url = ${result.externalUrl || null}, error_message = null where id = ${created[0].id}::uuid
      `;
      await sql`update content_items set status = 'published', updated_at = now() where id = ${content.id}::uuid`;
      return NextResponse.json({ ok: true, message: `Publicado em ${provider}.`, externalUrl: result.externalUrl });
    } finally {
      clearTimeout(timeout);
    }
  } catch (cause) {
    const status = cause instanceof GrowthError ? cause.status : 500;
    if (!(cause instanceof GrowthError)) console.error("Social Publisher API failed:", cause);
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Não foi possível processar a publicação." }, { status });
  }
}
