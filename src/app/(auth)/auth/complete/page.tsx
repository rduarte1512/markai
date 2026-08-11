import { redirect } from "next/navigation";
import { getSql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export default async function AuthCompletePage() {
  const session = await getSession();
  if (!session) redirect("/login?clerk_error=session_sync_failed");

  const sql = getSql();
  const rows = (await sql`
    select exists(
      select 1
      from brands
      where workspace_id = ${session.workspaceId}::uuid
        and status = 'active'
    ) as has_brand
  `) as unknown as Array<{ has_brand: boolean }>;

  redirect(rows[0]?.has_brand ? "/dashboard" : "/onboarding");
}
