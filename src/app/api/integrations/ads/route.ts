import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { encryptSecret } from "@/lib/secret-box";

export const runtime = "nodejs";

const PROVIDERS = ["meta", "google_ads", "tiktok", "linkedin", "youtube"] as const;
type Provider = (typeof PROVIDERS)[number];

function isProvider(value: string): value is Provider {
  return PROVIDERS.includes(value as Provider);
}

async function canManage(sql: ReturnType<typeof getSql>, workspaceId: string, userId: string) {
  const rows = (await sql`
    select role from workspace_members
    where workspace_id = ${workspaceId}::uuid and user_id = ${userId}::uuid
    limit 1
  `) as unknown as Array<{ role: string }>;
  return rows[0] && ["owner", "admin"].includes(rows[0].role);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  const sql = getSql();

  try {
    const rows = await sql`
      select provider, account_label, status, metadata, updated_at
      from ad_integrations
      where workspace_id = ${session.workspaceId}::uuid
      order by provider
    `;
    return NextResponse.json({
      integrations: rows.map((row) => ({
        provider: row.provider,
        accountLabel: row.account_label || "",
        status: row.status,
        metadata: row.metadata || {},
        updatedAt: row.updated_at,
        configured: true,
      })),
    });
  } catch (cause) {
    console.error("Load ad integrations failed:", cause);
    return NextResponse.json({ error: "Não foi possível carregar as integrações de publicidade." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  const sql = getSql();
  if (!(await canManage(sql, session.workspaceId, session.userId))) {
    return NextResponse.json({ error: "Só proprietários e administradores podem gerir credenciais." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const provider = String(body.provider || "");
    const accessToken = String(body.accessToken || "").trim();
    const apiKey = String(body.apiKey || "").trim();
    const clientId = String(body.clientId || "").trim();
    const clientSecret = String(body.clientSecret || "").trim();
    const developerToken = String(body.developerToken || "").trim();
    const accountLabel = String(body.accountLabel || "").trim().slice(0, 120);
    const accountId = String(body.accountId || "").trim().slice(0, 160);

    if (!isProvider(provider)) return NextResponse.json({ error: "Plataforma inválida." }, { status: 400 });
    if (![accessToken, apiKey, clientSecret, developerToken].some(Boolean)) {
      return NextResponse.json({ error: "Adiciona pelo menos uma credencial válida." }, { status: 400 });
    }

    const encrypted = encryptSecret(JSON.stringify({ accessToken, apiKey, clientId, clientSecret, developerToken, accountId }));
    await sql`
      insert into ad_integrations(workspace_id, provider, credentials_enc, account_label, status, metadata)
      values (
        ${session.workspaceId}::uuid, ${provider}, ${encrypted}, ${accountLabel || accountId || null}, 'configured',
        ${JSON.stringify({ hasAccessToken: Boolean(accessToken), hasApiKey: Boolean(apiKey), hasClientId: Boolean(clientId), hasClientSecret: Boolean(clientSecret), hasDeveloperToken: Boolean(developerToken), accountId: accountId || null })}::jsonb
      )
      on conflict (workspace_id, provider) do update
      set credentials_enc = excluded.credentials_enc,
          account_label = excluded.account_label,
          status = 'configured',
          metadata = excluded.metadata,
          updated_at = now()
    `;

    return NextResponse.json({ ok: true, provider, configured: true, accountLabel: accountLabel || accountId });
  } catch (cause) {
    console.error("Save ad integration failed:", cause);
    return NextResponse.json({ error: "Não foi possível guardar as credenciais em segurança." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  const sql = getSql();
  if (!(await canManage(sql, session.workspaceId, session.userId))) {
    return NextResponse.json({ error: "Só proprietários e administradores podem gerir credenciais." }, { status: 403 });
  }

  const provider = new URL(request.url).searchParams.get("provider") || "";
  if (!isProvider(provider)) return NextResponse.json({ error: "Plataforma inválida." }, { status: 400 });
  await sql`delete from ad_integrations where workspace_id = ${session.workspaceId}::uuid and provider = ${provider}`;
  return NextResponse.json({ ok: true });
}
