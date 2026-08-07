import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { getBillingWorkspaceForUser } from "@/lib/workspaces";
import {
  getImageCreditCost,
  IMAGE_MODELS,
  type ImageModelKey,
  type ImageSize,
} from "@/lib/agent-media";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  const billing = await getBillingWorkspaceForUser(session.userId, session.workspaceId);
  if (!billing) return NextResponse.json({ error: "Workspace inválido." }, { status: 403 });

  const sql = getSql();
  let charged = 0;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const brandId = String(body.brandId || "");
    const prompt = String(body.prompt || "").trim();
    const modelKey = String(body.model || "nano-banana-2") as ImageModelKey;
    const size = String(body.size || "1K") as ImageSize;
    const aspectRatio = String(body.aspectRatio || "1:1");
    const conversationId = body.conversationId ? String(body.conversationId) : null;
    if (!brandId || prompt.length < 3) return NextResponse.json({ error: "Escreve o que queres gerar." }, { status: 400 });
    if (!IMAGE_MODELS[modelKey] || !["1K", "2K", "4K"].includes(size)) return NextResponse.json({ error: "Configuração de imagem inválida." }, { status: 400 });

    const credits = getImageCreditCost(billing.plan_key, modelKey, size);
    if (!credits) return NextResponse.json({ error: "Este modelo de imagem não está disponível no teu plano." }, { status: 403 });

    const brandRows = (await sql`
      select id, name, description, audience, tone_of_voice, primary_color, secondary_color
      from brands where id = ${brandId}::uuid and workspace_id = ${session.workspaceId}::uuid limit 1
    `) as unknown as Array<Record<string, unknown>>;
    const brand = brandRows[0];
    if (!brand) return NextResponse.json({ error: "Marca não encontrada." }, { status: 404 });

    const chargeRows = (await sql`
      select consume_markai_credits(
        ${billing.billing_workspace_id}::uuid, ${session.userId}::uuid, ${brandId}::uuid,
        'gpt-5.6-lua', 'agent_image_generation', ${credits},
        ${JSON.stringify({ modelKey, size, aspectRatio, sourceWorkspaceId: session.workspaceId })}::jsonb
      ) as result
    `) as unknown as Array<{ result: { credits_used: number; balance_remaining: number } }>;
    charged = Number(chargeRows[0]?.result?.credits_used || 0);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_MEDIA_NOT_CONFIGURED");

    const config = IMAGE_MODELS[modelKey];
    const enrichedPrompt = [
      prompt,
      "",
      `Brand: ${brand.name}`,
      brand.description ? `Descrição: ${brand.description}` : "",
      brand.audience ? `Público: ${brand.audience}` : "",
      brand.tone_of_voice ? `Tom: ${brand.tone_of_voice}` : "",
      brand.primary_color ? `Cor principal: ${brand.primary_color}` : "",
      brand.secondary_color ? `Cor secundária: ${brand.secondary_color}` : "",
      "Cria um asset de marketing profissional, sem logótipos de terceiros inventados e com composição utilizável em publicidade.",
    ].filter(Boolean).join("\n");

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model: config.providerModel,
        input: [{ type: "text", text: enrichedPrompt }],
        response_format: { type: "image", mime_type: "image/png", aspect_ratio: aspectRatio, image_size: size },
      }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`GEMINI_IMAGE_${response.status}:${(await response.text()).slice(0, 220)}`);

    const data = (await response.json()) as {
      steps?: Array<{ type?: string; content?: Array<{ type?: string; mime_type?: string; data?: string }> }>;
    };
    const blocks = (data.steps || []).flatMap((step) => step.content || []);
    const image = [...blocks].reverse().find((block) => block.type === "image" && block.data);
    if (!image?.data) throw new Error("GEMINI_IMAGE_EMPTY");
    const mimeType = image.mime_type || "image/png";
    const dataUrl = `data:${mimeType};base64,${image.data}`;

    if (conversationId) {
      const valid = await sql`
        select id from ai_conversations
        where id = ${conversationId}::uuid and workspace_id = ${session.workspaceId}::uuid and user_id = ${session.userId}::uuid
      `;
      if (valid.length) {
        await sql`
          insert into ai_messages(conversation_id, role, content, credits_used, metadata)
          values (${conversationId}::uuid, 'assistant', ${`Imagem gerada com ${config.label} · ${size} · ${aspectRatio}`}, ${charged}, ${JSON.stringify({ mediaKind: "image", model: modelKey, size, aspectRatio })}::jsonb)
        `;
        await sql`update ai_conversations set updated_at = now() where id = ${conversationId}::uuid`;
      }
    }

    return NextResponse.json({ image: dataUrl, mimeType, creditsUsed: charged, balanceRemaining: chargeRows[0]?.result?.balance_remaining });
  } catch (cause) {
    if (charged > 0) {
      try {
        await sql`select refund_markai_credits(${billing.billing_workspace_id}::uuid, ${session.userId}::uuid, 'gpt-5.6-lua', ${charged}, 'agent_image_generation_failed')`;
      } catch (refundError) {
        console.error("Image refund failed:", refundError);
      }
    }
    const message = cause instanceof Error ? cause.message : "";
    if (message.includes("GEMINI_MEDIA_NOT_CONFIGURED")) return NextResponse.json({ error: "A geração de imagem precisa da GEMINI_API_KEY configurada no servidor." }, { status: 503 });
    if (message.includes("INSUFFICIENT_CREDITS")) return NextResponse.json({ error: "Não tens créditos suficientes para gerar esta imagem." }, { status: 402 });
    console.error("Agent image generation failed:", cause);
    return NextResponse.json({ error: "A geração da imagem falhou. Os créditos foram devolvidos." }, { status: 500 });
  }
}
