import { GrowthOS } from "@/components/growth-os";
import { requireAppContext } from "@/lib/auth";
import { getGrowthDashboardData } from "@/lib/growth-data";
import { getGrowthAccess } from "@/lib/feature-access";

export const metadata = { title: "Growth OS" };

export default async function GrowthPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const context = await requireAppContext();
  const query = await searchParams;
  const access = getGrowthAccess(context.plan_key);
  const data = await getGrowthDashboardData(context.workspace_id, access.performance.windowDays || 7, access.funnelAnalytics.limit);

  return (
    <GrowthOS
      data={data as never}
      plan={context.plan_key}
      access={access}
      initialTab={query.tab || "performance"}
    />
  );
}
