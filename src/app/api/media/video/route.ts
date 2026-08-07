import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { getBillingWorkspaceForUser } from "@/lib/workspaces";
import {
  getVideoCreditCost,
  VIDEO_MODELS,
  type VideoDuration,
  type VideoModelKey,
  type VideoResolution,
} from "@/lib/agent-media";

export const runtime = "nodejs";

function extractVideoUri(payload: unknown) {
  const data = payload as {
    output_video?: { uri?: string };
    steps?: Array<{ content?: Array<{ type?: string; uri?: string }> }>;
  };
  if (data.output_video?.uri) return data.output_video.uri;
  const blocks = (data.steps || []).flatMap((step) => step.content || []);
  return [...blocks].reverse().find((block) => block.type === "video" && block.uri)?.uri || null;
}

function fileIdFromUri(uri: string) {
  return uri.match(/files\/([^:/?]+)/)?.[1] || null;
}

async function refundJob(sql: ReturnType<typeof getSql>, job: { id: string; billing_workspace_id: string; user_id: string; credits_charged: number }, reason: string) {
  const changed = await sql`
    update media_jobs
    set status = 'failed', error = ${reason.slice(0, 500)}, updated_at = now()
    where id = ${job.id}::uuid and status = 'processing'
    returning id
  `;
  if (!changed.length || job.credits_charged <= 0) return;
  await sql`select refund_markai_credits(${job.billing_workspace_id}::uuid, ${job.user_id}::uuid, 'gpt-5.6-lua', ${job.credits_charged}, 'agent_video_generation_failed')`;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  const billing = await getBillingWorkspaceForUser(session.userId, session.workspaceId);
  if (!billing) return NextResponse.json({ error: "Workspace inválido." }, { status: 403 });
  if (billing.plan_key === "free") return NextResponse.json({ error: "A geração de vídeo está disponível apenas em planos pagos." }, { status: 403 });

  const sql = getSql();
  let charged = 0;
  let jobId: string | null = null;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const brandId = String(body.brandId || "");
    const prompt = String(body.prompt || "").trim();
    const modelKey = String(body.model || "veo-3.1-lite") as VideoModelKey;
    const duration = Number(body.duration || 4) as VideoDuration;
    const resolution = String(body.resolution || "720p") as VideoResolution;
    const aspectRatio = String(body.aspectRatio || "16:9");
    const conversationId = body.conversationId ? String(body.conversationId) : null;

    if (!brandId || prompt.length < 4) return NextResponse.json({ error: "Descreve o vídeo que queres gerar." }, { status: 400 });
    const model = VIDEO_MODELS[modelKey];
    if (!model || ![4, 6, 8].includes(duration) || !["16:9", "9:16"].includes(aspectRatio)) {
      return NextResponse.json({ error: "Configuração de vídeo inválida." }, { status: 400 });
    }
    const credits = getVideoCreditCost(billing.plan_key, modelKey, duration, resolution);
    if (!credits) return NextResponse.json({ error: "Esta combinação de modelo, resolução e duração não está disponível no teu plano." }, { status: 403 });

    const brands = (await sql`
      select id, name, description, audience, tone_of_voice, primary_color, secondary_color
      from brands where id = ${brandId}::uuid and workspace_id = ${session.workspaceId}::uuid limit 1
    `) as unknown as Array<Record<string, unknown>>;
    const brand = brands[0];
    if (!brand) return NextResponse.json({ error: "Marca não encontrada." }, { status: 404 });

    if (conversationId) {
      const valid = await sql`
        select id from ai_conversations
        where id = ${conversationId}::uuid and workspace_id = ${session.workspaceId}::uuid and user_id = ${session.userId}::uuid
      `;
      if (!valid.length) return NextResponse.json({ error: "Conversa inválida." }, { status: 404 });
    }

    const chargeRows = (await sql`
      select consume_markai_credits(
        ${billing.billing_workspace_id}::uuid, ${session.userId}::uuid, ${brandId}::uuid,
        'gpt-5.6-lua', 'agent_video_generation', ${credits},
        ${JSON.stringify({ modelKey, duration, resolution, aspectRatio, sourceWorkspaceId: session.workspaceId })}::jsonb
      ) as result
    `) as unknown as Array<{ result: { credits_used: number; balance_remaining: number } }>;
    const charge = chargeRows[0]?.result;
    charged = Number(charge?.credits_used || 0);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_MEDIA_NOT_CONFIGURED");

    const enrichedPrompt = [
      prompt,
      "",
      `Cria um vídeo publicitário profissional com exatamente ${duration} segundos.`,
      `Marca: ${brand.name}`,
      brand.description ? `Descrição da marca: ${brand.description}` : "",
      brand.audience ? `Público: ${brand.audience}` : "",
      brand.tone_of_voice ? `Tom: ${brand.tone_of_voice}` : "",
      brand.primary_color ? `Cor principal: ${brand.primary_color}` : "",
      brand.secondary_color ? `Cor secundária: ${brand.secondary_color}` : "",
      "Evita logótipos de terceiros inventados. Mantém composição e texto adequados a publicidade digital.",
    ].filter(Boolean).join("\n");

    let providerOperation = "";
    let outputUri: string | null = null;

    if (model.provider === "veo") {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.providerModel}:predictLongRunning`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          instances: [{ prompt: enrichedPrompt }],
          parameters: {
            aspectRatio,
            durationSeconds: String(duration),
            resolution,
          },
        }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`GEMINI_VIDEO_${response.status}:${(await response.text()).slice(0, 260)}`);
      const data = (await response.json()) as { name?: string };
      if (!data.name) throw new Error("GEMINI_VIDEO_OPERATION_MISSING");
      providerOperation = data.name;
    } else {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          model: model.providerModel,
          input: enrichedPrompt,
          response_format: { type: "video", aspect_ratio: aspectRatio, delivery: "uri" },
          background: false,
          store: false,
          stream: false,
        }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`GEMINI_OMNI_${response.status}:${(await response.text()).slice(0, 260)}`);
      const data = await response.json();
      outputUri = extractVideoUri(data);
      if (!outputUri) throw new Error("GEMINI_OMNI_VIDEO_URI_MISSING");
      providerOperation = `files/${fileIdFromUri(outputUri) || "unknown"}`;
    }

    const rows = (await sql`
      insert into media_jobs(
        workspace_id, billing_workspace_id, brand_id, user_id, conversation_id,
        kind, provider_model, provider_operation, status, prompt, resolution,
        duration_seconds, aspect_ratio, credits_charged, output_uri, metadata
      ) values (
        ${session.workspaceId}::uuid, ${billing.billing_workspace_id}::uuid, ${brandId}::uuid, ${session.userId}::uuid,
        ${conversationId}::uuid, 'video', ${modelKey}, ${providerOperation}, 'processing', ${prompt}, ${resolution},
        ${duration}, ${aspectRatio}, ${charged}, ${outputUri}, ${JSON.stringify({ provider: model.provider, providerModel: model.providerModel })}::jsonb
      ) returning id
    `) as unknown as Array<{ id: string }>;
    jobId = rows[0]?.id || null;
    if (!jobId) throw new Error("MEDIA_JOB_CREATE_FAILED");

    if (conversationId) {
      await sql`
        insert into ai_messages(conversation_id, role, content, credits_used, metadata)
        values (${conversationId}::uuid, 'assistant', ${`Vídeo em geração · ${model.label} · ${resolution} · ${duration}s`}, ${charged}, ${JSON.stringify({ mediaKind: "video", jobId, model: modelKey, resolution, duration, aspectRatio })}::jsonb)
      `;
      await sql`update ai_conversations set updated_at = now() where id = ${conversationId}::uuid`;
    }

    return NextResponse.json({ jobId, status: "processing", creditsUsed: charged, balanceRemaining: charge?.balance_remaining });
  } catch (cause) {
    if (charged > 0 && !jobId) {
      try {
        await sql`select refund_markai_credits(${billing.billing_workspace_id}::uuid, ${session.userId}::uuid, 'gpt-5.6-lua', ${charged}, 'agent_video_generation_failed')`;
      } catch (refundError) {
        console.error("Video refund failed:", refundError);
      }
    }
    const message = cause instanceof Error ? cause.message : "";
    if (message.includes("GEMINI_MEDIA_NOT_CONFIGURED")) return NextResponse.json({ error: "A geração de vídeo precisa da GEMINI_API_KEY configurada no servidor." }, { status: 503 });
    if (message.includes("INSUFFICIENT_CREDITS")) return NextResponse.json({ error: "Não tens créditos suficientes para gerar este vídeo." }, { status: 402 });
    console.error("Agent video generation failed:", cause);
    return NextResponse.json({ error: "A geração de vídeo não arrancou. Os créditos foram devolvidos." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  const sql = getSql();
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  const download = url.searchParams.get("download") === "1";
  if (!jobId) return NextResponse.json({ error: "jobId em falta." }, { status: 400 });

  const rows = (await sql`
    select id, workspace_id, billing_workspace_id, user_id, conversation_id, provider_model,
      provider_operation, status, credits_charged, output_uri, error, metadata
    from media_jobs
    where id = ${jobId}::uuid and workspace_id = ${session.workspaceId}::uuid and user_id = ${session.userId}::uuid
    limit 1
  `) as unknown as Array<{
    id: string;
    workspace_id: string;
    billing_workspace_id: string;
    user_id: string;
    conversation_id: string | null;
    provider_model: string;
    provider_operation: string | null;
    status: string;
    credits_charged: number;
    output_uri: string | null;
    error: string | null;
    metadata: { provider?: string };
  }>;
  const job = rows[0];
  if (!job) return NextResponse.json({ error: "Vídeo não encontrado." }, { status: 404 });
  if (job.status === "failed") return NextResponse.json({ status: "failed", error: job.error || "A geração falhou." }, { status: 500 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "A geração de vídeo não está configurada no servidor." }, { status: 503 });

  if (download) {
    if (job.status !== "completed" || !job.output_uri) return NextResponse.json({ error: "O vídeo ainda não está pronto." }, { status: 409 });
    const response = await fetch(job.output_uri, { headers: { "x-goog-api-key": apiKey }, redirect: "follow", cache: "no-store" });
    if (!response.ok || !response.body) return NextResponse.json({ error: "Não foi possível descarregar o vídeo." }, { status: 502 });
    return new Response(response.body, {
      headers: {
        "content-type": response.headers.get("content-type") || "video/mp4",
        "content-disposition": `inline; filename="markai-${job.id}.mp4"`,
        "cache-control": "private, max-age=300",
      },
    });
  }

  if (job.status === "completed") {
    return NextResponse.json({ status: "completed", downloadUrl: `/api/media/video?jobId=${job.id}&download=1` });
  }

  try {
    if (job.metadata?.provider === "veo") {
      if (!job.provider_operation) throw new Error("VIDEO_OPERATION_MISSING");
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${job.provider_operation}`, {
        headers: { "x-goog-api-key": apiKey },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`VEO_POLL_${response.status}:${(await response.text()).slice(0, 220)}`);
      const data = (await response.json()) as {
        done?: boolean;
        error?: { message?: string };
        response?: { generateVideoResponse?: { generatedSamples?: Array<{ video?: { uri?: string } }> } };
      };
      if (!data.done) return NextResponse.json({ status: "processing" });
      if (data.error) throw new Error(data.error.message || "VEO_GENERATION_FAILED");
      const uri = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      if (!uri) throw new Error("VEO_VIDEO_URI_MISSING");
      await sql`update media_jobs set status = 'completed', output_uri = ${uri}, updated_at = now() where id = ${job.id}::uuid`;
    } else {
      const fileId = job.output_uri ? fileIdFromUri(job.output_uri) : job.provider_operation?.replace(/^files\//, "");
      if (!fileId) throw new Error("OMNI_FILE_ID_MISSING");
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${fileId}`, {
        headers: { "x-goog-api-key": apiKey },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`OMNI_POLL_${response.status}:${(await response.text()).slice(0, 220)}`);
      const data = (await response.json()) as { state?: string; error?: { message?: string } };
      if (data.state === "FAILED") throw new Error(data.error?.message || "OMNI_GENERATION_FAILED");
      if (data.state !== "ACTIVE") return NextResponse.json({ status: "processing" });
      await sql`update media_jobs set status = 'completed', updated_at = now() where id = ${job.id}::uuid`;
    }

    return NextResponse.json({ status: "completed", downloadUrl: `/api/media/video?jobId=${job.id}&download=1` });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "VIDEO_GENERATION_FAILED";
    try {
      await refundJob(sql, job, message);
    } catch (refundError) {
      console.error("Video job refund failed:", refundError);
    }
    console.error("Video poll failed:", cause);
    return NextResponse.json({ status: "failed", error: "A geração de vídeo falhou. Os créditos foram devolvidos." }, { status: 500 });
  }
}
