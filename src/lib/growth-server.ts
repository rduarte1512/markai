import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { getGrowthAccess, type GrowthFeatureKey } from "@/lib/feature-access";
import { generateAiText, type AiMessage } from "@/lib/ai";
import type { PlanKey } from "@/lib/types";

export class GrowthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function requireGrowthContext() {
  const session = await getSession();
  if (!session) throw new GrowthError("Sessão expirada.", 401);
  const sql = getSql();
  const rows = (await sql`
    select w.plan_key
    from workspaces w
    join workspace_members wm on wm.workspace_id = w.id
    where w.id = ${session.workspaceId}::uuid and wm.user_id = ${session.userId}::uuid
    limit 1
  `) as unknown as Array<{ plan_key: PlanKey }>;
  const plan = rows[0]?.plan_key;
  if (!plan) throw new GrowthError("Workspace inválido.", 403);
  return { session, sql, plan, access: getGrowthAccess(plan) };
}

export function enforceFeature(plan: PlanKey, feature: GrowthFeatureKey) {
  const rule = getGrowthAccess(plan)[feature];
  if (!rule.enabled) throw new GrowthError("Esta funcionalidade está disponível apenas nos planos pagos.", 403);
  return rule;
}

export function enforceLimit(current: number, limit: number, message: string) {
  if (limit >= 999999) return;
  if (current >= limit) throw new GrowthError(message, 403);
}

export function parsePositive(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function cleanText(value: unknown, max = 4000) {
  return String(value || "").trim().slice(0, max);
}

export async function generateGrowthAi({
  workspaceId,
  userId,
  brandId,
  operation,
  system,
  user,
}: {
  workspaceId: string;
  userId: string;
  brandId?: string | null;
  operation: string;
  system: string;
  user: string;
}) {
  const sql = getSql();
  const modelKey = "gpt-5.6-lua";
  let charged = 0;
  try {
    const chargedRows = (await sql`
      select consume_markai_credits(
        ${workspaceId}::uuid,
        ${userId}::uuid,
        ${brandId || null}::uuid,
        ${modelKey},
        ${operation},
        1,
        ${JSON.stringify({ source: "growth_os" })}::jsonb
      ) as result
    `) as unknown as Array<{ result: { credits_used?: number } }>;
    charged = Number(chargedRows[0]?.result?.credits_used || 0);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "";
    if (message.includes("INSUFFICIENT_CREDITS")) throw new GrowthError("Créditos insuficientes para gerar insights com IA.", 402);
    if (message.includes("MODEL_MONTHLY_LIMIT_REACHED")) throw new GrowthError("Atingiste o limite mensal do modelo usado para insights.", 403);
    if (message.includes("MODEL_NOT_AVAILABLE_FOR_PLAN")) throw new GrowthError("O teu plano não tem acesso ao modelo de insights.", 403);
    throw cause;
  }

  const messages: AiMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  try {
    const generated = await generateAiText({ modelKey, messages, temperature: 0.35, maxTokens: 900, demoKind: "copilot" });
    return { ...generated, creditsUsed: charged };
  } catch (cause) {
    if (charged > 0) {
      try {
        await sql`select refund_markai_credits(${workspaceId}::uuid, ${userId}::uuid, ${modelKey}, ${charged}, ${`${operation}_failed`})`;
      } catch (refundError) {
        console.error("Growth OS refund failed:", refundError);
      }
    }
    throw cause;
  }
}
