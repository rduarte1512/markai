import { GrowthOS } from "@/components/growth-os";
import { requireAppContext } from "@/lib/auth";
import { getGrowthDashboardData } from "@/lib/growth-data";
import { getGrowthAccess } from "@/lib/feature-access";

export const metadata = { title: "Growth OS" };

export default async function GrowthPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const context = await requireAppContext();
  const query = await searchParams;
  const data = await getGrowthDashboardData(context.workspace_id);

  return (
    <GrowthOS
      data={data as never}
      plan={context.plan_key}
      access={getGrowthAccess(context.plan_key)}
      initialTab={query.tab || "performance"}
    />
  );
}
