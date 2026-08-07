import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateAiText, parseJsonFromAi } from "@/lib/ai";
import { getSql } from "@/lib/db";
import { getBillingWorkspaceForUser } from "@/lib/workspaces";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const sql = getSql();
  const billing = await getBillingWorkspaceForUser(session.userId, session.workspaceId);
  if (!billing) return NextResponse.json({ error: "Workspace inválido." }, { status: 403 });

  let charged = 0;
  let modelKey = "";

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const brandId = String(body.brandId || "");
    modelKey = String(body.modelKey || "gpt-5.6-lua");
    const platform = String(body.platform || "meta");
    const objective = String(body.objective || "Conversões");
    const offer = String(body.offer || "").trim();
    const extraContext = String(body.extraContext || "").trim();
    const variations = Math.min(5, Math.max(1, Number(body.variations || 3)));

    if (!brandId || offer.length < 5) return NextResponse.json({ error: "Seleciona uma marca e descreve a oferta." }, { status: 400 });

    const brands = (await sql`
      select id, name, industry, website, description, audience, tone_of_voice,
        primary_color, secondary_color, values, personas
      from brands
      where id = ${brandId}::uuid and workspace_id = ${session.workspaceId}::uuid and status = 'active'
      limit 1
    `) as unknown as Array<Record<string, unknown>>;
    const brand = brands[0];
    if (!brand) return NextResponse.json({ error: "Marca não encontrada." }, { status: 404 });

    const chargeRows = (await sql`
      select consume_markai_credits(
        ${billing.billing_workspace_id}::uuid, ${session.userId}::uuid, ${brandId}::uuid,
        ${modelKey}, 'ads_generation', ${variations},
        ${JSON.stringify({ platform, objective, variations, sourceWorkspaceId: session.workspaceId })}::jsonb
      ) as result
    `) as unknown as Array<{ result: { credits_used: number; balance_remaining: number } }>;
    const charge = chargeRows[0]?.result;
    charged = Number(charge?.credits_used || 0);

    const prompt = `Cria ${variations} anúncios para ${platform}, objetivo ${objective}.\nOferta: ${offer}\nContexto extra: ${extraContext || "nenhum"}\n\nBRAND KIT:\nNome: ${brand.name}\nSetor: ${brand.industry || ""}\nDescrição: ${brand.description || ""}\nPúblico: ${brand.audience || ""}\nTom: ${brand.tone_of_voice || ""}\nValores: ${JSON.stringify(brand.values || [])}\n\nResponde APENAS em JSON válido no formato {"ads":[{"title":"","primaryText":"","description":"","cta":"","angle":""}]}. Usa português europeu e entrega exatamente ${variations} itens.`;

    const ai = await generateAiText({
      modelKey,
      demoKind: "ads",
      temperature: 0.78,
      maxTokens: 2200,
      messages: [
        { role: "system", content: "És um diretor criativo e performance marketer. Escreve copy específica, clara e credível, sem promessas falsas." },
        { role: "user", content: prompt },
      ],
    });

    const parsed = parseJsonFromAi<{ ads?: Array<{ title?: string; primaryText?: string; primary_text?: string; description?: string; cta?: string; angle?: string }> }>(ai.text);
    if (!parsed?.ads?.length) throw new Error("INVALID_AI_JSON");
    const ads = parsed.ads.slice(0, variations).map((ad, index) => ({
      title: ad.title || `Variação ${index + 1}`,
      primaryText: ad.primaryText || ad.primary_text || ai.text,
      description: ad.description || "",
      cta: ad.cta || "Saber mais",
      angle: ad.angle || "",
    }));

    const campaignRows = (await sql`
      insert into campaigns(brand_id, created_by, name, objective, channel, strategy)
      values (${brandId}::uuid, ${session.userId}::uuid, ${`${objective} · ${new Date().toISOString().slice(0, 10)}`}, ${objective}, ${platform}, ${JSON.stringify({ offer, extraContext, modelKey })}::jsonb)
      returning id
    `) as unknown as Array<{ id: string }>;
    const campaignId = campaignRows[0]?.id;

    const savedAds = [] as Array<{ id: string; title: string; primaryText: string; description: string; cta: string; angle: string }>;
    for (let index = 0; index < ads.length; index += 1) {
      const ad = ads[index];
      const rows = (await sql`
        insert into ads(brand_id, campaign_id, created_by, platform, model_key, title, primary_text, description, cta, variant_label, generation_prompt)
        values (${brandId}::uuid, ${campaignId}::uuid, ${session.userId}::uuid, ${platform}, ${modelKey}, ${ad.title}, ${ad.primaryText}, ${ad.description}, ${ad.cta}, ${String.fromCharCode(65 + index)}, ${prompt})
        returning id
      `) as unknown as Array<{ id: string }>;
      savedAds.push({ id: rows[0]?.id, ...ad });
    }

    return NextResponse.json({ ads: savedAds, creditsUsed: charged, balanceRemaining: charge?.balance_remaining, demoMode: ai.demoMode });
  } catch (cause) {
    if (charged > 0 && modelKey) {
      try {
        await sql`select refund_markai_credits(${billing.billing_workspace_id}::uuid, ${session.userId}::uuid, ${modelKey}, ${charged}, 'ads_generation_failed')`;
      } catch (refundError) {
        console.error("Ads refund failed:", refundError);
      }
    }

    const message = cause instanceof Error ? cause.message : "";
    if (message.includes("INSUFFICIENT_CREDITS")) return NextResponse.json({ error: "Não tens créditos suficientes para esta geração." }, { status: 402 });
    if (message.includes("MODEL_NOT_AVAILABLE_FOR_PLAN")) return NextResponse.json({ error: "Este modelo não está disponível no teu plano." }, { status: 403 });
    if (message.includes("MODEL_MONTHLY_LIMIT_REACHED")) return NextResponse.json({ error: "Atingiste o limite mensal deste modelo." }, { status: 429 });
    console.error("Ads generation error:", cause);
    return NextResponse.json({ error: "A geração falhou. Os créditos foram devolvidos." }, { status: 500 });
  }
}
