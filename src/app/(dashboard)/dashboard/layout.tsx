import { redirect } from "next/navigation";
import { MobileMenu } from "@/components/sidebar";
import { LiveSidebar } from "@/components/live-sidebar";
import { Topbar } from "@/components/topbar";
import { UpgradePopup } from "@/components/upgrade-popup";
import { CommandCenter } from "@/components/command-center";
import { requireAppContext } from "@/lib/auth";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await requireAppContext();
  const sql = getSql();
  const brands = (await sql`
    select count(*)::int as count
    from brands
    where workspace_id = ${context.workspace_id}
      and status = 'active'
  `) as unknown as Array<{ count: number }>;

  if (Number(brands[0]?.count || 0) === 0) redirect("/onboarding");

  const workspaces = (await sql`
    select w.id, w.name, w.slug, wm.role
    from workspace_members wm
    join workspaces w on w.id = wm.workspace_id
    where wm.user_id = ${context.user_id}
    order by case when w.id = ${context.workspace_id} then 0 else 1 end, w.name asc
  `) as unknown as Array<{ id: string; name: string; slug: string; role: string }>;

  const balance = Number(context.monthly_balance) + Number(context.extra_balance);
  const allowance = Number(context.monthly_allowance);

  return (
    <div className="dashboard-shell premium-dashboard-shell studio-v2-shell">
      <LiveSidebar plan={context.plan_key} balance={balance} allowance={allowance} />
      <div className="dashboard-area">
        <Topbar
          workspaceName={context.workspace_name}
          workspaceId={context.workspace_id}
          userName={context.user_name}
          userEmail={context.email}
          planKey={context.plan_key}
          workspaces={workspaces}
        />
        <main className="dashboard-content premium-dashboard-content studio-v2-content">{children}</main>
      </div>
      <MobileMenu />
      <CommandCenter />
      <UpgradePopup plan={context.plan_key} balance={balance} allowance={allowance} />
    </div>
  );
}
