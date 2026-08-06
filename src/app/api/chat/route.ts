import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateAiText } from "@/lib/ai";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const sql = getSql();
  let charged = 0;
  let modelKey = "";

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const brandId = String(body.brandId || "");
    modelKey = String(body.modelKey || "gpt-5.6-lua");
    const message = String(body.message || "").trim();
    let conversationId = body.conversationId ? String(body.conversationId) : null;
    if (!brandId || message.length < 2) return NextResponse.json({ error: "Seleciona uma marca e escreve uma mensagem." }, { status: 400 });

    const brands = (await sql`
      select id, name, industry, website, description, audience, tone_of_voice, values, personas, competitors
      from brands where id = ${brandId}::uuid and workspace_id = ${session.workspaceId}::uuid limit 1
    `) as unknown as Array<Record<string, unknown>>;
    const brand = brands[0];
    if (!brand) return NextResponse.json({ error: "Marca não encontrada." }, { status: 404 });

    if (conversationId) {
      const valid = await sql`select id from ai_conversations where id = ${conversationId}::uuid and workspace_id = ${session.workspaceId}::uuid and brand_id = ${brandId}::uuid`;
      if (!valid.length) conversationId = null;
    }

    if (!conversationId) {
      const rows = (await sql`
        insert into ai_conversations(workspace_id, brand_id, user_id, title)
        values (${session.workspaceId}::uuid, ${brandId}::uuid, ${session.userId}::uuid, ${message.slice(0, 70)})
        returning id
      `) as unknown as Array<{ id: string }>;
      conversationId = rows[0]?.id || null;
    }
    if (!conversationId) throw new Error("CONVERSATION_CREATE_FAILED");

    const chargeRows = (await sql`
      select consume_markai_credits(
        ${session.workspaceId}::uuid, ${session.userId}::uuid, ${brandId}::uuid,
        ${modelKey}, 'marketing_copilot', 1,
        ${JSON.stringify({ conversationId })}::jsonb
      ) as result
    `) as unknown as Array<{ result: { credits_used: number; balance_remaining: number } }>;
    const charge = chargeRows[0]?.result;
    charged = Number(charge?.credits_used || 0);

    await sql`insert into ai_messages(conversation_id, role, content, model_key) values (${conversationId}::uuid, 'user', ${message}, ${modelKey})`;

    const history = (await sql`
      select role, content from ai_messages
      where conversation_id = ${conversationId}::uuid
      order by created_at desc limit 10
    `) as unknown as Array<{ role: "user" | "assistant"; content: string }>;

    const brandContext = `BRAND KIT\nNome: ${brand.name}\nSetor: ${brand.industry || ""}\nWebsite: ${brand.website || ""}\nDescrição: ${brand.description || ""}\nPúblico: ${brand.audience || ""}\nTom: ${brand.tone_of_voice || ""}\nValores: ${JSON.stringify(brand.values || [])}\nPersonas: ${JSON.stringify(brand.personas || [])}\nConcorrentes: ${JSON.stringify(brand.competitors || [])}`;

    const ai = await generateAiText({
      modelKey,
      demoKind: "copilot",
      temperature: 0.62,
      maxTokens: 1800,
      messages: [
        { role: "system", content: `És o agente de marketing residente desta marca. Responde em português europeu, de forma prática, com recomendações específicas e sem inventar métricas. ${brandContext}` },
        ...history.reverse().map((item) => ({ role: item.role, content: item.content })),
      ],
    });

    await sql`
      insert into ai_messages(conversation_id, role, content, model_key, credits_used, metadata)
      values (${conversationId}::uuid, 'assistant', ${ai.text}, ${modelKey}, ${charged}, ${JSON.stringify({ demoMode: ai.demoMode })}::jsonb)
    `;
    await sql`update ai_conversations set updated_at = now() where id = ${conversationId}::uuid`;

    return NextResponse.json({ content: ai.text, conversationId, creditsUsed: charged, balanceRemaining: charge?.balance_remaining, demoMode: ai.demoMode });
  } catch (cause) {
    if (charged > 0 && modelKey) {
      try {
        await sql`select refund_markai_credits(${session.workspaceId}::uuid, ${session.userId}::uuid, ${modelKey}, ${charged}, 'copilot_generation_failed')`;
      } catch (refundError) {
        console.error("Copilot refund failed:", refundError);
      }
    }
    const message = cause instanceof Error ? cause.message : "";
    if (message.includes("INSUFFICIENT_CREDITS")) return NextResponse.json({ error: "Não tens créditos suficientes." }, { status: 402 });
    if (message.includes("MODEL_NOT_AVAILABLE_FOR_PLAN")) return NextResponse.json({ error: "Este modelo não está disponível no teu plano." }, { status: 403 });
    if (message.includes("MODEL_MONTHLY_LIMIT_REACHED")) return NextResponse.json({ error: "Atingiste o limite mensal deste modelo." }, { status: 429 });
    console.error("Chat error:", cause);
    return NextResponse.json({ error: "O agente não conseguiu responder. Os créditos foram devolvidos." }, { status: 500 });
  }
}
