import { SettingsConsole } from "@/components/settings-console";
import { requireAppContext } from "@/lib/auth";
import { getSql } from "@/lib/db";

export const metadata = { title: "Definições" };

export default async function SettingsPage() {
  const context = await requireAppContext();
  const gatewayReady = Boolean(process.env.AI_GATEWAY_BASE_URL && process.env.AI_GATEWAY_API_KEY);
  const sql = getSql();
  const subscriptions = (await sql`
    select current_period_end, cancel_at_period_end
    from subscriptions
    where workspace_id = ${context.workspace_id}
    limit 1
  `) as unknown as Array<{ current_period_end: string; cancel_at_period_end: boolean }>;
  const subscription = subscriptions[0];
  const renewalDate = subscription?.current_period_end
    ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "long" }).format(new Date(subscription.current_period_end))
    : null;

  return (
    <SettingsConsole
      workspaceName={context.workspace_name}
      workspaceSlug={context.workspace_slug}
      email={context.email}
      userName={context.user_name}
      planKey={context.plan_key}
      gatewayReady={gatewayReady}
      renewalDate={renewalDate}
      cancelAtPeriodEnd={Boolean(subscription?.cancel_at_period_end)}
    />
  );
}
