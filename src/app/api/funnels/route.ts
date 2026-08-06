import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";

type TemplateStep = { type: string; title: string };
type FunnelContent = Record<string, unknown>;

const TEMPLATE_STEPS: Record<string, TemplateStep[]> = {
  leads: [
    { type: "landing", title: "Landing de captação" },
    { type: "form", title: "Formulário de qualificação" },
    { type: "thank_you", title: "Página de obrigado" },
    { type: "email", title: "Sequência de nutrição" },
  ],
  sales: [
    { type: "landing", title: "Página de vendas" },
    { type: "checkout", title: "Checkout" },
    { type: "upsell", title: "Oferta complementar" },
    { type: "thank_you", title: "Confirmação" },
    { type: "email", title: "Follow-up de compra" },
  ],
  webinar: [
    { type: "landing", title: "Registo no evento" },
    { type: "form", title: "Inscrição" },
    { type: "thank_you", title: "Confirmação de presença" },
    { type: "email", title: "Lembretes automáticos" },
    { type: "email", title: "Replay e oferta" },
  ],
  local: [
    { type: "landing", title: "Página do serviço" },
    { type: "form", title: "Pedido de orçamento" },
    { type: "thank_you", title: "Próximos passos" },
    { type: "email", title: "Seguimento comercial" },
  ],
};

function buildStepContent(step: TemplateStep, data: {
  funnelName: string;
  objective: string;
  audience: string;
  offer: string;
  cta: string;
  heroImageUrl: string;
  videoUrl: string;
}): FunnelContent {
  const base = {
    status: "ready_to_edit",
    eyebrow: data.objective || "Uma experiência criada para converter",
    headline: step.type === "landing" ? data.funnelName : step.title,
    body: data.offer || `Completa o conteúdo da etapa “${step.title}”.`,
    audience: data.audience,
    button_label: data.cta || (step.type === "checkout" ? "Finalizar compra" : "Quero saber mais"),
    image_url: step.type === "landing" ? data.heroImageUrl : "",
    video_url: step.type === "landing" ? data.videoUrl : "",
    theme: "premium-dark",
  };

  if (step.type === "form") {
    return {
      ...base,
      headline: "Conta-nos um pouco sobre ti",
      body: "Usa este formulário para qualificar o contacto antes do próximo passo.",
      fields: ["Nome", "Email", "Telefone"],
      button_label: data.cta || "Continuar",
    };
  }
  if (step.type === "checkout") {
    return {
      ...base,
      headline: data.offer || "Confirma a tua encomenda",
      body: "Pagamento seguro e confirmação imediata.",
      price: "99€",
      guarantee: "Garantia de 14 dias",
    };
  }
  if (step.type === "upsell") {
    return {
      ...base,
      eyebrow: "Oferta exclusiva",
      headline: "Adiciona mais valor à tua compra",
      body: "Apresenta aqui uma oferta complementar simples e relevante.",
      price: "+29€",
      button_label: "Adicionar à encomenda",
    };
  }
  if (step.type === "thank_you") {
    return {
      ...base,
      eyebrow: "Tudo concluído",
      headline: "Obrigado — está confirmado.",
      body: "Explica o que acontece a seguir e reduz qualquer incerteza.",
      button_label: "Voltar ao início",
    };
  }
  if (step.type === "email") {
    return {
      ...base,
      subject: `Próximo passo: ${data.funnelName}`,
      headline: "Mantém a conversa em movimento",
      body: data.offer || "Escreve a mensagem de seguimento desta etapa.",
      button_label: data.cta || "Continuar",
    };
  }
  return base;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const funnelId = new URL(request.url).searchParams.get("funnelId")?.trim();
  if (!funnelId) return NextResponse.json({ error: "Funil em falta." }, { status: 400 });

  try {
    const sql = getSql();
    const funnels = (await sql`
      select f.id, f.brand_id, b.name as brand_name, f.name, f.template_key,
        f.status, f.settings, f.created_at
      from funnels f
      join brands b on b.id = f.brand_id
      where f.id = ${funnelId}
        and b.workspace_id = ${session.workspaceId}
      limit 1
    `) as unknown as Array<Record<string, unknown>>;
    if (!funnels[0]) return NextResponse.json({ error: "Funil não encontrado." }, { status: 404 });

    const steps = (await sql`
      select fs.id, fs.funnel_id, fs.step_type, fs.title, fs.position, fs.content
      from funnel_steps fs
      join funnels f on f.id = fs.funnel_id
      join brands b on b.id = f.brand_id
      where fs.funnel_id = ${funnelId}
        and b.workspace_id = ${session.workspaceId}
      order by fs.position asc
    `) as unknown as Array<Record<string, unknown>>;

    return NextResponse.json({ funnel: { ...funnels[0], step_count: steps.length }, steps });
  } catch (cause) {
    console.error("Read funnel error:", cause);
    return NextResponse.json({ error: "Não foi possível abrir o funil." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const body = (await request.json()) as {
      brandId?: string;
      name?: string;
      templateKey?: string;
      objective?: string;
      audience?: string;
      offer?: string;
      cta?: string;
      heroImageUrl?: string;
      videoUrl?: string;
    };
    const brandId = body.brandId?.trim();
    const name = body.name?.trim();
    const templateKey = body.templateKey && TEMPLATE_STEPS[body.templateKey] ? body.templateKey : "leads";
    if (!brandId || !name) return NextResponse.json({ error: "Preenche a marca e o nome do funil." }, { status: 400 });

    const details = {
      funnelName: name,
      objective: body.objective?.trim() || "",
      audience: body.audience?.trim() || "",
      offer: body.offer?.trim() || "",
      cta: body.cta?.trim() || "",
      heroImageUrl: body.heroImageUrl?.trim() || "",
      videoUrl: body.videoUrl?.trim() || "",
    };

    const sql = getSql();
    const access = (await sql`
      select b.id, b.name
      from brands b
      where b.id = ${brandId}
        and b.workspace_id = ${session.workspaceId}
        and b.status = 'active'
      limit 1
    `) as unknown as Array<{ id: string; name: string }>;
    if (!access[0]) return NextResponse.json({ error: "Marca inválida para este workspace." }, { status: 403 });

    const settings = {
      source: "studio_v3",
      conversion_goal: templateKey === "sales" ? "purchase" : "lead",
      objective: details.objective,
      audience: details.audience,
      offer: details.offer,
      primary_cta: details.cta,
    };
    const created = (await sql`
      insert into funnels (brand_id, created_by, name, template_key, status, settings)
      values (${brandId}, ${session.userId}, ${name}, ${templateKey}, 'draft', ${JSON.stringify(settings)}::jsonb)
      returning id, brand_id, name, template_key, status, settings, created_at
    `) as unknown as Array<Record<string, unknown>>;
    const funnel = created[0];

    const steps = TEMPLATE_STEPS[templateKey];
    for (let index = 0; index < steps.length; index += 1) {
      const step = steps[index];
      const content = buildStepContent(step, details);
      await sql`
        insert into funnel_steps (funnel_id, step_type, title, position, content)
        values (${String(funnel.id)}, ${step.type}, ${step.title}, ${index + 1}, ${JSON.stringify(content)}::jsonb)
      `;
    }

    return NextResponse.json({
      funnel: {
        ...funnel,
        brand_name: access[0].name,
        step_count: steps.length,
      },
    });
  } catch (cause) {
    console.error("Create funnel error:", cause);
    return NextResponse.json({ error: "Não foi possível criar o funil." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const body = (await request.json()) as {
      funnelId?: string;
      status?: string;
      stepId?: string;
      title?: string;
      content?: FunnelContent;
    };
    const funnelId = body.funnelId?.trim();
    if (!funnelId) return NextResponse.json({ error: "Funil em falta." }, { status: 400 });

    const sql = getSql();
    if (body.stepId && body.content && typeof body.content === "object") {
      const updated = (await sql`
        update funnel_steps fs
        set title = ${body.title?.trim() || "Etapa sem título"},
            content = ${JSON.stringify(body.content)}::jsonb
        from funnels f, brands b
        where fs.id = ${body.stepId}
          and fs.funnel_id = f.id
          and f.id = ${funnelId}
          and b.id = f.brand_id
          and b.workspace_id = ${session.workspaceId}
        returning fs.id, fs.title, fs.content
      `) as unknown as Array<Record<string, unknown>>;
      if (!updated[0]) return NextResponse.json({ error: "Etapa não encontrada." }, { status: 404 });
      await sql`update funnels set updated_at = now() where id = ${funnelId}`;
      return NextResponse.json({ ok: true, step: updated[0] });
    }

    if (!["draft", "published", "archived"].includes(body.status || "")) {
      return NextResponse.json({ error: "Alteração inválida." }, { status: 400 });
    }
    const updated = (await sql`
      update funnels f
      set status = ${body.status}, updated_at = now()
      from brands b
      where f.id = ${funnelId}
        and b.id = f.brand_id
        and b.workspace_id = ${session.workspaceId}
      returning f.id, f.status
    `) as unknown as Array<{ id: string; status: string }>;
    if (!updated[0]) return NextResponse.json({ error: "Funil não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true, ...updated[0] });
  } catch (cause) {
    console.error("Update funnel error:", cause);
    return NextResponse.json({ error: "Não foi possível atualizar o funil." }, { status: 500 });
  }
}
