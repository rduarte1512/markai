import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchRow = {
  id: string;
  kind: "brand" | "campaign" | "funnel" | "content";
  title: string;
  subtitle: string;
  href: string;
};

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim().slice(0, 80);
  if (query.length < 2) return NextResponse.json({ results: [] });

  const pattern = `%${query}%`;
  const sql = getSql();
  const rows = (await sql`
    select * from (
      select
        b.id::text as id,
        'brand'::text as kind,
        b.name::text as title,
        coalesce(nullif(b.industry, ''), 'Marca')::text as subtitle,
        ('/dashboard/brands/' || b.id::text)::text as href
      from brands b
      where b.workspace_id = ${session.workspaceId}
        and b.status = 'active'
        and (
          b.name ilike ${pattern}
          or coalesce(b.industry, '') ilike ${pattern}
          or coalesce(b.description, '') ilike ${pattern}
        )

      union all

      select
        c.id::text as id,
        'campaign'::text as kind,
        c.name::text as title,
        (coalesce(nullif(c.channel, ''), 'Campanha') || ' · ' || b.name)::text as subtitle,
        '/dashboard/ads'::text as href
      from campaigns c
      join brands b on b.id = c.brand_id
      where b.workspace_id = ${session.workspaceId}
        and (
          c.name ilike ${pattern}
          or coalesce(c.objective, '') ilike ${pattern}
          or coalesce(c.channel, '') ilike ${pattern}
        )

      union all

      select
        f.id::text as id,
        'funnel'::text as kind,
        f.name::text as title,
        ('Funil · ' || b.name)::text as subtitle,
        '/dashboard/funnels'::text as href
      from funnels f
      join brands b on b.id = f.brand_id
      where b.workspace_id = ${session.workspaceId}
        and (
          f.name ilike ${pattern}
          or coalesce(f.template_key, '') ilike ${pattern}
          or coalesce(f.status, '') ilike ${pattern}
        )

      union all

      select
        ci.id::text as id,
        'content'::text as kind,
        ci.title::text as title,
        (coalesce(nullif(ci.content_type, ''), 'Conteúdo') || ' · ' || b.name)::text as subtitle,
        '/dashboard/content'::text as href
      from content_items ci
      join brands b on b.id = ci.brand_id
      where b.workspace_id = ${session.workspaceId}
        and (
          ci.title ilike ${pattern}
          or coalesce(ci.channel, '') ilike ${pattern}
          or coalesce(ci.body, '') ilike ${pattern}
        )
    ) results
    order by kind, title
    limit 14
  `) as unknown as SearchRow[];

  return NextResponse.json({ results: rows });
}
