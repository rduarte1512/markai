import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateAiText, parseJsonFromAi } from "@/lib/ai";
import { getSql } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const sql = getSql();
  const modelKey = "gpt-5.6-lua";
  let charged = 0;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    if (!name || description.length < 10) return NextResponse.json({ error: "Falta contexto suficiente sobre a marca." }, { status: 400 });

    const chargeRows = (await sql`
      select consume_markai_credits(
        ${session.workspaceId}::uuid, ${session.userId}::uuid, null,
        ${modelKey}, 'brand_kit_onboarding', 1,
        ${JSON.stringify({ brandName: name })}::jsonb
      ) as result
    `) as unknown as Array<{ result: { credits_used: number; balance_remaining: number } }>;
    charged = Number(chargeRows[0]?.result?.credits_used || 1);

    const ai = await generateAiText({
      modelKey,
      demoKind: "brand_onboarding",
      temperature: 0.55,
      messages: [
        { role: "system", content: "És um estratega de marca. Responde apenas em JSON válido com audience, toneOfVoice, values (array) e personas (array). Escreve em português europeu." },
        { role: "user", content: `Marca: ${name}\nSetor: ${String(body.industry || "")}\nWebsite: ${String(body.website || "")}\nDescrição: ${description}` },
      ],
    });

    const parsed = parseJsonFromAi<{ audience?: string; toneOfVoice?: string; values?: string[]; personas?: unknown[] }>(ai.text);
    if (!parsed) throw new Error("INVALID_AI_JSON");

    return NextResponse.json({ ...parsed, creditsUsed: charged, demoMode: ai.demoMode });
  } catch (cause) {
    if (charged > 0) {
      try {
        await sql`select refund_markai_credits(${session.workspaceId}::uuid, ${session.userId}::uuid, ${modelKey}, ${charged}, 'brand_kit_generation_failed')`;
      } catch (refundError) {
        console.error("Brand kit refund failed:", refundError);
      }
    }
    const message = cause instanceof Error ? cause.message : "";
    if (message.includes("INSUFFICIENT_CREDITS")) return NextResponse.json({ error: "Não tens créditos suficientes." }, { status: 402 });
    if (message.includes("MODEL_MONTHLY_LIMIT_REACHED")) return NextResponse.json({ error: "Atingiste o limite mensal deste modelo." }, { status: 429 });
    console.error("Brand kit error:", cause);
    return NextResponse.json({ error: "Não foi possível gerar o Brand Kit." }, { status: 500 });
  }
}
