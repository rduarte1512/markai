import { FunnelsManager } from "@/components/funnels-manager";
import { requireAppContext } from "@/lib/auth";
import { getBrands } from "@/lib/data";
import { getSql } from "@/lib/db";

export const metadata = { title: "Funis" };

export default async function FunnelsPage() {
  const context = await requireAppContext();
  const sql = getSql();
  const [brands, funnels] = await Promise.all([
    getBrands(context.workspace_id),
    sql`
      select
        f.id, f.brand_id, b.name as brand_name, f.name, f.template_key,
        f.status, f.settings, f.created_at, count(fs.id)::int as step_count
      from funnels f
      join brands b on b.id = f.brand_id
      left join funnel_steps fs on fs.funnel_id = f.id
      where b.workspace_id = ${context.workspace_id}
        and f.status <> 'archived'
      group by f.id, b.name
      order by f.updated_at desc
    `,
  ]);

  return <FunnelsManager brands={brands} initialFunnels={funnels as never[]} />;
}
