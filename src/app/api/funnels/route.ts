import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";

const TEMPLATE_STEPS: Record<string, Array<{ type: string; title: string }>> = {
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

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const body = (await request.json()) as { brandId?: string; name?: string; templateKey?: string };
    const brandId = body.brandId?.trim();
    const name = body.name?.trim();
    const templateKey = body.templateKey && TEMPLATE_STEPS[body.templateKey] ? body.templateKey : "leads";
    if (!brandId || !name) return NextResponse.json({ error: "Preenche a marca e o nome do funil." }, { status: 400 });

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

    const created = (await sql`
      insert into funnels (brand_id, created_by, name, template_key, status, settings)
      values (${brandId}, ${session.userId}, ${name}, ${templateKey}, 'draft', ${JSON.stringify({ source: "studio_v2", conversion_goal: templateKey === "sales" ? "purchase" : "lead" })}::jsonb)
      returning id, brand_id, name, template_key, status, settings, created_at
    `) as unknown as Array<Record<string, unknown>>;
    const funnel = created[0];

    const steps = TEMPLATE_STEPS[templateKey];
    for (let index = 0; index < steps.length; index += 1) {
      const step = steps[index];
      await sql`
        insert into funnel_steps (funnel_id, step_type, title, position, content)
        values (${String(funnel.id)}, ${step.type}, ${step.title}, ${index + 1}, ${JSON.stringify({ status: "ready_to_edit" })}::jsonb)
      `;
    }

    return NextResponse.json({
      funnel: {
        ...funnel,
        brand_name: access[0].name,
        step_count: steps.length,
        steps,
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
    const body = (await request.json()) as { funnelId?: string; status?: string };
    if (!body.funnelId || !["draft", "published", "archived"].includes(body.status || "")) {
      return NextResponse.json({ error: "Alteração inválida." }, { status: 400 });
    }
    const sql = getSql();
    const updated = (await sql`
      update funnels f
      set status = ${body.status}, updated_at = now()
      from brands b
      where f.id = ${body.funnelId}
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
