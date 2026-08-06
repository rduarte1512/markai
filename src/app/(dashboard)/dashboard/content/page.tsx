import { ContentStudio } from "@/components/content-studio";
import { requireAppContext } from "@/lib/auth";
import { getBrands } from "@/lib/data";
import { getSql } from "@/lib/db";

export const metadata = { title: "Conteúdo" };

export default async function ContentPage() {
  const context = await requireAppContext();
  const sql = getSql();
  const [brands, items] = await Promise.all([
    getBrands(context.workspace_id),
    sql`
      select
        ci.id, ci.brand_id, b.name as brand_name, ci.title, ci.content_type,
        ci.channel, ci.body, ci.status, ci.scheduled_for, ci.created_at
      from content_items ci
      join brands b on b.id = ci.brand_id
      where b.workspace_id = ${context.workspace_id}
        and ci.status <> 'archived'
      order by coalesce(ci.scheduled_for, ci.created_at) desc
      limit 120
    `,
  ]);

  return <ContentStudio brands={brands} initialItems={items as never[]} />;
}
