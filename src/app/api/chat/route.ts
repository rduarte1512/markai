import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateAiText, type AiContentPart, type AiMessage } from "@/lib/ai";
import { getSql } from "@/lib/db";
import {
  estimateAttachmentBytes,
  getAttachmentCreditCost,
  type AgentAttachment,
} from "@/lib/agent-media";
import { getBillingWorkspaceForUser } from "@/lib/workspaces";

export const runtime = "nodejs";

const TOOL_INSTRUCTIONS: Record<string, string> = {
  strategy: "Age como estratega sénior. Entrega prioridades, hipóteses, riscos, métricas e próximos passos concretos.",
  create_ad: "Age como diretor de performance. Cria copy de anúncio pronta para Meta, Google, TikTok, LinkedIn ou YouTube e recomenda ângulo, CTA, público e teste A/B. Quando útil, indica que o utilizador pode levar o resultado para o Ads Studio.",
  campaign: "Constrói uma campanha completa: objetivo, oferta, público, canais, mensagens, orçamento sugerido, calendário e plano de testes.",
  funnel: "Audita ou desenha o funil completo, identificando fricção, etapas, mensagens, eventos de conversão e testes prioritários.",
  content: "Cria um plano editorial executável com formatos, hooks, canais, frequência e reutilização de conteúdo.",
  analysis: "Cruza o pedido com os dados reais disponíveis no workspace e aponta padrões, lacunas e decisões recomendadas sem inventar métricas.",
};

type ChargeRecord = { modelKey: string; amount: number };

function attachmentLabel(attachment: AgentAttachment) {
  const kb = Math.max(1, Math.round(estimateAttachmentBytes(attachment) / 1024));
  return `${attachment.name} (${kb} KB, ${attachment.mimeType || "ficheiro"})`;
}

function buildUserContent(message: string, attachments: AgentAttachment[]): AiMessage["content"] {
  if (!attachments.length) return message;
  const parts: AiContentPart[] = [{ type: "text", text: message }];

  for (const attachment of attachments) {
    const label = attachmentLabel(attachment);
    if (attachment.text) {
      parts.push({
        type: "text",
        text: `\n\n--- FICHEIRO ANEXADO: ${label} ---\n${attachment.text.slice(0, 120_000)}\n--- FIM DO FICHEIRO ---`,
      });
      continue;
    }
    if (attachment.dataUrl?.startsWith("data:image/")) {
      parts.push({ type: "text", text: `\nImagem anexada: ${label}` });
      parts.push({ type: "image_url", image_url: { url: attachment.dataUrl } });
      continue;
    }
    parts.push({ type: "text", text: `\nFicheiro anexado: ${label}. O conteúdo binário não foi convertido para texto; usa o nome, tipo e contexto fornecido pelo utilizador.` });
  }
  return parts;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  const sql = getSql();
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  const query = (url.searchParams.get("q") || "").trim();

  if (conversationId) {
    const rows = (await sql`
      select id, brand_id, title, created_at, updated_at
      from ai_conversations
      where id = ${conversationId}::uuid
        and workspace_id = ${session.workspaceId}::uuid
        and user_id = ${session.userId}::uuid
      limit 1
    `) as unknown as Array<{ id: string; brand_id: string | null; title: string; created_at: string; updated_at: string }>;
    const conversation = rows[0];
    if (!conversation) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });

    const messages = (await sql`
      select id, role, content, model_key, credits_used, metadata, created_at
      from ai_messages
      where conversation_id = ${conversationId}::uuid
      order by created_at asc
    `) as unknown as Array<Record<string, unknown>>;
    return NextResponse.json({ conversation, messages });
  }

  const conversations = query
    ? await sql`
        select c.id, c.brand_id, c.title, c.created_at, c.updated_at, b.name as brand_name,
          coalesce((select content from ai_messages m where m.conversation_id = c.id order by m.created_at desc limit 1), '') as preview
        from ai_conversations c
        left join brands b on b.id = c.brand_id
        where c.workspace_id = ${session.workspaceId}::uuid
          and c.user_id = ${session.userId}::uuid
          and (c.title ilike ${`%${query}%`} or exists (
            select 1 from ai_messages m where m.conversation_id = c.id and m.content ilike ${`%${query}%`}
          ))
        order by c.updated_at desc
        limit 50
      `
    : await sql`
        select c.id, c.brand_id, c.title, c.created_at, c.updated_at, b.name as brand_name,
          coalesce((select content from ai_messages m where m.conversation_id = c.id order by m.created_at desc limit 1), '') as preview
        from ai_conversations c
        left join brands b on b.id = c.brand_id
        where c.workspace_id = ${session.workspaceId}::uuid
          and c.user_id = ${session.userId}::uuid
        order by c.updated_at desc
        limit 50
      `;

  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const sql = getSql();
  const billing = await getBillingWorkspaceForUser(session.userId, session.workspaceId);
  if (!billing) return NextResponse.json({ error: "Workspace inválido." }, { status: 403 });

  const charges: ChargeRecord[] = [];
  let modelKey = "";

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const brandId = String(body.brandId || "");
    modelKey = String(body.modelKey || "gpt-5.6-lua");
    const message = String(body.message || "").trim();
    const tool = String(body.tool || "").trim();
    const attachments = (Array.isArray(body.attachments) ? body.attachments : []).slice(0, 5) as AgentAttachment[];
    let conversationId = body.conversationId ? String(body.conversationId) : null;

    if (!brandId || (message.length < 2 && !attachments.length)) {
      return NextResponse.json({ error: "Seleciona uma marca e escreve uma mensagem ou anexa um ficheiro." }, { status: 400 });
    }

    let totalAttachmentBytes = 0;
    let attachmentCredits = 0;
    for (const attachment of attachments) {
      const bytes = estimateAttachmentBytes(attachment);
      if (bytes > 6 * 1024 * 1024) return NextResponse.json({ error: `O ficheiro ${attachment.name} ultrapassa o limite de 6 MB.` }, { status: 413 });
      totalAttachmentBytes += bytes;
      attachmentCredits += getAttachmentCreditCost(bytes);
    }
    if (totalAttachmentBytes > 12 * 1024 * 1024) return NextResponse.json({ error: "Os anexos ultrapassam o limite total de 12 MB." }, { status: 413 });

    const brands = (await sql`
      select id, name, industry, website, description, audience, tone_of_voice, values, personas, competitors
      from brands where id = ${brandId}::uuid and workspace_id = ${session.workspaceId}::uuid limit 1
    `) as unknown as Array<Record<string, unknown>>;
    const brand = brands[0];
    if (!brand) return NextResponse.json({ error: "Marca não encontrada." }, { status: 404 });

    if (conversationId) {
      const valid = await sql`
        select id from ai_conversations
        where id = ${conversationId}::uuid
          and workspace_id = ${session.workspaceId}::uuid
          and brand_id = ${brandId}::uuid
          and user_id = ${session.userId}::uuid
      `;
      if (!valid.length) conversationId = null;
    }

    if (!conversationId) {
      const titleSource = message || attachments[0]?.name || "Nova conversa";
      const rows = (await sql`
        insert into ai_conversations(workspace_id, brand_id, user_id, title)
        values (${session.workspaceId}::uuid, ${brandId}::uuid, ${session.userId}::uuid, ${titleSource.slice(0, 70)})
        returning id
      `) as unknown as Array<{ id: string }>;
      conversationId = rows[0]?.id || null;
    }
    if (!conversationId) throw new Error("CONVERSATION_CREATE_FAILED");

    const history = (await sql`
      select role, content from ai_messages
      where conversation_id = ${conversationId}::uuid
      order by created_at desc limit 16
    `) as unknown as Array<{ role: "user" | "assistant"; content: string }>;

    const baseChargeRows = (await sql`
      select consume_markai_credits(
        ${billing.billing_workspace_id}::uuid, ${session.userId}::uuid, ${brandId}::uuid,
        ${modelKey}, 'marketing_copilot', 1,
        ${JSON.stringify({ conversationId, tool: tool || null, sourceWorkspaceId: session.workspaceId })}::jsonb
      ) as result
    `) as unknown as Array<{ result: { credits_used: number; balance_remaining: number } }>;
    const baseCharge = baseChargeRows[0]?.result;
    const baseCredits = Number(baseCharge?.credits_used || 0);
    if (baseCredits) charges.push({ modelKey, amount: baseCredits });
    let balanceRemaining = Number(baseCharge?.balance_remaining || 0);

    if (attachmentCredits > 0) {
      const attachmentRows = (await sql`
        select consume_markai_credits(
          ${billing.billing_workspace_id}::uuid, ${session.userId}::uuid, ${brandId}::uuid,
          'gpt-5.6-lua', 'agent_attachment_processing', ${attachmentCredits},
          ${JSON.stringify({ conversationId, files: attachments.map((item) => ({ name: item.name, mimeType: item.mimeType, bytes: estimateAttachmentBytes(item) })), sourceWorkspaceId: session.workspaceId })}::jsonb
        ) as result
      `) as unknown as Array<{ result: { credits_used: number; balance_remaining: number } }>;
      const attachmentCharge = attachmentRows[0]?.result;
      const used = Number(attachmentCharge?.credits_used || 0);
      if (used) charges.push({ modelKey: "gpt-5.6-lua", amount: used });
      balanceRemaining = Number(attachmentCharge?.balance_remaining ?? balanceRemaining);
    }

    const storedMessage = [
      message,
      attachments.length ? `\n\nAnexos: ${attachments.map(attachmentLabel).join(", ")}` : "",
    ].join("").trim();

    await sql`
      insert into ai_messages(conversation_id, role, content, model_key, metadata)
      values (
        ${conversationId}::uuid, 'user', ${storedMessage || "Ficheiro anexado"}, ${modelKey},
        ${JSON.stringify({ tool: tool || null, attachments: attachments.map((item) => ({ name: item.name, mimeType: item.mimeType, bytes: estimateAttachmentBytes(item), credits: getAttachmentCreditCost(estimateAttachmentBytes(item)) })) })}::jsonb
      )
    `;

    const [campaigns, ads, funnels, contentItems] = await Promise.all([
      sql`select to_jsonb(c) as item from campaigns c where c.brand_id = ${brandId}::uuid order by c.updated_at desc limit 12`,
      sql`select to_jsonb(a) - 'generation_prompt' as item from ads a where a.brand_id = ${brandId}::uuid order by a.created_at desc limit 16`,
      sql`select to_jsonb(f) as item from funnels f where f.brand_id = ${brandId}::uuid order by f.updated_at desc limit 10`,
      sql`select to_jsonb(ci) as item from content_items ci where ci.brand_id = ${brandId}::uuid order by ci.updated_at desc limit 16`,
    ]);

    const brandContext = `BRAND KIT\nNome: ${brand.name}\nSetor: ${brand.industry || ""}\nWebsite: ${brand.website || ""}\nDescrição: ${brand.description || ""}\nPúblico: ${brand.audience || ""}\nTom: ${brand.tone_of_voice || ""}\nValores: ${JSON.stringify(brand.values || [])}\nPersonas: ${JSON.stringify(brand.personas || [])}\nConcorrentes: ${JSON.stringify(brand.competitors || [])}`;
    const operationContext = `DADOS REAIS DO WORKSPACE PARA ESTA MARCA\nCampanhas recentes: ${JSON.stringify(campaigns.map((row) => row.item))}\nAnúncios recentes: ${JSON.stringify(ads.map((row) => row.item))}\nFunis recentes: ${JSON.stringify(funnels.map((row) => row.item))}\nConteúdo recente: ${JSON.stringify(contentItems.map((row) => row.item))}`;
    const toolInstruction = TOOL_INSTRUCTIONS[tool] || "Ajuda o utilizador a tomar decisões e executar trabalho dentro da MarkAI, usando os dados reais disponíveis.";

    const userContent = buildUserContent(message || "Analisa o ficheiro anexado e ajuda-me com a próxima ação.", attachments);
    const aiMessages: AiMessage[] = [
      {
        role: "system",
        content: `És o MarkAI Strategist, agente residente de marketing com acesso ao contexto operacional da aplicação. Responde em português europeu. Usa os dados reais abaixo para ajudar em anúncios, campanhas, funis, conteúdo e estratégia. Não inventes métricas nem estados que não estejam presentes. Quando o utilizador pede execução, entrega algo pronto a usar e indica claramente o próximo passo dentro da app.\n\n${brandContext}\n\n${operationContext}\n\nFERRAMENTA ATIVA: ${toolInstruction}`,
      },
      ...history.reverse().map((item) => ({ role: item.role, content: item.content } as AiMessage)),
      { role: "user", content: userContent },
    ];

    const ai = await generateAiText({
      modelKey,
      demoKind: "copilot",
      temperature: 0.62,
      maxTokens: 2200,
      messages: aiMessages,
    });

    const totalCredits = charges.reduce((sum, charge) => sum + charge.amount, 0);
    await sql`
      insert into ai_messages(conversation_id, role, content, model_key, credits_used, metadata)
      values (${conversationId}::uuid, 'assistant', ${ai.text}, ${modelKey}, ${totalCredits}, ${JSON.stringify({ demoMode: ai.demoMode, tool: tool || null, attachmentCredits })}::jsonb)
    `;
    await sql`update ai_conversations set updated_at = now() where id = ${conversationId}::uuid`;

    return NextResponse.json({
      content: ai.text,
      conversationId,
      creditsUsed: totalCredits,
      attachmentCredits,
      balanceRemaining,
      demoMode: ai.demoMode,
    });
  } catch (cause) {
    for (const charge of charges.reverse()) {
      try {
        await sql`select refund_markai_credits(${billing.billing_workspace_id}::uuid, ${session.userId}::uuid, ${charge.modelKey}, ${charge.amount}, 'copilot_generation_failed')`;
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
