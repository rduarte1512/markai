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

  const balance = Number(context.monthly_balance) + Number(context.extra_balance);
  const allowance = Number(context.monthly_allowance);

  return (
    <div className="dashboard-shell premium-dashboard-shell studio-v2-shell">
      <LiveSidebar plan={context.plan_key} balance={balance} allowance={allowance} />
      <div className="dashboard-area">
        <Topbar workspaceName={context.workspace_name} userName={context.user_name} />
        <main className="dashboard-content premium-dashboard-content studio-v2-content">{children}</main>
      </div>
      <MobileMenu />
      <CommandCenter />
      <UpgradePopup plan={context.plan_key} balance={balance} allowance={allowance} />
    </div>
  );
}
