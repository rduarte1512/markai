import { Sidebar, MobileMenu } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { requireAppContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await requireAppContext();
  const balance = Number(context.monthly_balance) + Number(context.extra_balance);

  return (
    <div className="dashboard-shell">
      <Sidebar plan={context.plan_key} balance={balance} allowance={Number(context.monthly_allowance)} />
      <div className="dashboard-area">
        <Topbar workspaceName={context.workspace_name} userName={context.user_name} />
        <main className="dashboard-content">{children}</main>
      </div>
      <MobileMenu />
    </div>
  );
}
