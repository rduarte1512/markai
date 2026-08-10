import { getSql } from "@/lib/db";

export type AutomationRunResult = {
  ruleId: string;
  name: string;
  executed: boolean;
  reason: string;
  action?: string;
};

type Rule = {
  id: string;
  workspace_id: string;
  brand_id?: string | null;
  name: string;
  trigger_key: "daily_summary" | "cpa_threshold" | "content_approved" | "funnel_dropoff";
  trigger_config?: Record<string, unknown>;
  action_key: "create_report" | "create_content_idea" | "create_decision" | "clone_winning_ad";
  action_config?: Record<string, unknown>;
  last_run_at?: string | null;
};

function num(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function resolveBrand(sql: ReturnType<typeof getSql>, workspaceId: string, requested?: string | null) {
  const rows = (await sql`
    select id, name from brands
    where workspace_id = ${workspaceId}::uuid and status = 'active'
      and (${requested || null}::uuid is null or id = ${requested || null}::uuid)
    order by created_at asc limit 1
  `) as unknown as Array<{ id: string; name: string }>;
  return rows[0] || null;
}

async function evaluate(rule: Rule, force: boolean) {
  const sql = getSql();
  if (force) return { matched: true, reason: "Execução manual", metrics: {} as Record<string, unknown> };
  const threshold = num(rule.trigger_config?.threshold, rule.trigger_key === "funnel_dropoff" ? 60 : 20);

  if (rule.trigger_key === "daily_summary") {
    const last = rule.last_run_at ? new Date(rule.last_run_at) : null;
    const today = new Date().toISOString().slice(0, 10);
    return { matched: !last || last.toISOString().slice(0, 10) !== today, reason: "Resumo diário", metrics: {} };
  }

  if (rule.trigger_key === "cpa_threshold") {
    const rows = (await sql`
      select coalesce(sum(cs.spend),0)::numeric as spend, coalesce(sum(cs.conversions),0)::numeric as conversions
      from campaign_snapshots cs
      join campaigns c on c.id = cs.campaign_id
      join brands b on b.id = c.brand_id
      where b.workspace_id = ${rule.workspace_id}::uuid
        and (${rule.brand_id || null}::uuid is null or b.id = ${rule.brand_id || null}::uuid)
        and cs.created_at >= now() - interval '7 days'
    `) as unknown as Array<{ spend: string | number; conversions: string | number }>;
    const spend = num(rows[0]?.spend);
    const conversions = num(rows[0]?.conversions);
    const cpa = conversions > 0 ? spend / conversions : 0;
    return { matched: conversions > 0 && cpa >= threshold, reason: `CPA ${cpa.toFixed(2)}€ / limite ${threshold.toFixed(2)}€`, metrics: { spend, conversions, cpa, threshold } };
  }

  if (rule.trigger_key === "content_approved") {
    const since = rule.last_run_at || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const rows = (await sql`
      select count(*)::int as count from content_items ci join brands b on b.id = ci.brand_id
      where b.workspace_id = ${rule.workspace_id}::uuid
        and (${rule.brand_id || null}::uuid is null or b.id = ${rule.brand_id || null}::uuid)
        and ci.status = 'approved' and ci.updated_at > ${since}::timestamptz
    `) as unknown as Array<{ count: number }>;
    const count = Number(rows[0]?.count || 0);
    return { matched: count > 0, reason: `${count} conteúdos aprovados desde a última execução`, metrics: { approved: count } };
  }

  const rows = (await sql`
    select
      count(*) filter (where fe.event_type = 'view')::int as views,
      count(*) filter (where fe.event_type = 'purchase')::int as purchases
    from funnel_events fe
    join funnels f on f.id = fe.funnel_id
    join brands b on b.id = f.brand_id
    where b.workspace_id = ${rule.workspace_id}::uuid
      and (${rule.brand_id || null}::uuid is null or b.id = ${rule.brand_id || null}::uuid)
      and fe.created_at >= now() - interval '7 days'
  `) as unknown as Array<{ views: number; purchases: number }>;
  const views = Number(rows[0]?.views || 0);
  const purchases = Number(rows[0]?.purchases || 0);
  const conversion = views > 0 ? purchases / views * 100 : 0;
  const dropoff = views > 0 ? 100 - conversion : 0;
  return { matched: views > 0 && dropoff >= threshold, reason: `Drop-off ${dropoff.toFixed(1)}% / limite ${threshold.toFixed(1)}%`, metrics: { views, purchases, conversion, dropoff, threshold } };
}

async function executeAction(rule: Rule, reason: string, metrics: Record<string, unknown>) {
  const sql = getSql();
  const brand = await resolveBrand(sql, rule.workspace_id, rule.brand_id);
  if (!brand) return { ok: false, detail: "Sem marca ativa para executar a ação." };
  const now = new Date();

  if (rule.action_key === "create_decision") {
    await sql`
      insert into brand_decisions(brand_id, title, decision, rationale, outcome, tags)
      values (${brand.id}::uuid, ${`Automation · ${rule.name}`}, ${reason}, ${JSON.stringify(metrics)}, 'Aguardando revisão da equipa', '["automation","growth_os"]'::jsonb)
    `;
    return { ok: true, detail: "Alerta criado no histórico de decisões." };
  }

  if (rule.action_key === "create_content_idea") {
    await sql`
      insert into content_items(brand_id, title, content_type, channel, body, status, metadata)
      values (${brand.id}::uuid, ${`Ideia automática · ${rule.name}`}, 'post', 'Multicanal', ${`Criada pela automação porque: ${reason}`}, 'idea', ${JSON.stringify({ source: "automation", ruleId: rule.id, metrics })}::jsonb)
    `;
    return { ok: true, detail: "Ideia adicionada ao Content OS." };
  }

  if (rule.action_key === "create_report") {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const end = now.toISOString().slice(0, 10);
    await sql`
      insert into reports(brand_id, title, period_start, period_end, metrics, ai_insights, status)
      values (${brand.id}::uuid, ${`Automation Report · ${rule.name}`}, ${start}::date, ${end}::date, ${JSON.stringify(metrics)}::jsonb, ${`Regra: ${reason}\nAção criada automaticamente para revisão.`}, 'ready')
    `;
    return { ok: true, detail: "Relatório automático criado." };
  }

  const winning = (await sql`
    select a.* from ads a
    where a.brand_id = ${brand.id}::uuid and a.status in ('approved','published')
    order by coalesce(nullif(a.performance->>'roas','')::numeric, 0) desc, a.updated_at desc
    limit 1
  `) as unknown as Array<Record<string, unknown>>;
  if (!winning[0]) return { ok: false, detail: "Não existe anúncio aprovado para clonar." };
  const ad = winning[0];
  await sql`
    insert into ads(brand_id, campaign_id, platform, model_key, title, primary_text, description, cta, creative_url, variant_label, generation_prompt, status, performance)
    values (
      ${brand.id}::uuid, ${ad.campaign_id || null}::uuid, ${String(ad.platform || "other")}, ${ad.model_key || null},
      ${`${String(ad.title || "Anúncio")} · Auto variant`}, ${String(ad.primary_text || "")}, ${ad.description || null},
      ${ad.cta || null}, ${ad.creative_url || null}, 'Automation clone', ${`Clonado por ${rule.name}: ${reason}`}, 'draft', '{}'::jsonb
    )
  `;
  return { ok: true, detail: "Variação do anúncio vencedor criada como draft." };
}

export async function runAutomationRules(workspaceId: string, ruleId?: string, force = false): Promise<AutomationRunResult[]> {
  const sql = getSql();
  const rules = (await sql`
    select id, workspace_id, brand_id, name, trigger_key, trigger_config, action_key, action_config, last_run_at
    from automation_rules
    where workspace_id = ${workspaceId}::uuid and enabled = true
      and (${ruleId || null}::uuid is null or id = ${ruleId || null}::uuid)
    order by created_at asc
  `) as unknown as Rule[];

  const results: AutomationRunResult[] = [];
  for (const rule of rules) {
    try {
      const check = await evaluate(rule, force);
      if (!check.matched) {
        results.push({ ruleId: rule.id, name: rule.name, executed: false, reason: check.reason });
        continue;
      }
      const action = await executeAction(rule, check.reason, check.metrics);
      const resultPayload = { matched: true, reason: check.reason, action: action.detail, ok: action.ok, at: new Date().toISOString() };
      await sql`update automation_rules set last_run_at = now(), last_result = ${JSON.stringify(resultPayload)}::jsonb, updated_at = now() where id = ${rule.id}::uuid`;
      results.push({ ruleId: rule.id, name: rule.name, executed: action.ok, reason: check.reason, action: action.detail });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro inesperado";
      await sql`update automation_rules set last_run_at = now(), last_result = ${JSON.stringify({ ok: false, error: message, at: new Date().toISOString() })}::jsonb, updated_at = now() where id = ${rule.id}::uuid`;
      results.push({ ruleId: rule.id, name: rule.name, executed: false, reason: message });
    }
  }
  return results;
}
