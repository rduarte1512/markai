import { AdIntegrationsPanel } from "@/components/ad-integrations-panel";
import { SettingsConsole } from "@/components/settings-console";
import { WorkspaceCreateControl } from "@/components/workspace-create-control";
import { WorkspaceIdentityEditor } from "@/components/workspace-identity-editor";
import { requireAppContext } from "@/lib/auth";
import { parseDemoPaymentProvider } from "@/lib/billing-payment";
import { getSql } from "@/lib/db";

export const metadata = { title: "Definições" };

export default async function SettingsPage() {
  const context = await requireAppContext();
  const gatewayReady = Boolean(process.env.AI_GATEWAY_BASE_URL && process.env.AI_GATEWAY_API_KEY);
  const sql = getSql();
  const [subscriptions, workspaceCounts] = await Promise.all([
    sql`
      select current_period_end, cancel_at_period_end, provider
      from subscriptions
      where workspace_id = ${context.billing_workspace_id}::uuid
      limit 1
    `,
    sql`
      select count(*)::int as count
      from workspaces
      where owner_id = (select owner_id from workspaces where id = ${context.billing_workspace_id}::uuid)
    `,
  ]);
  const subscription = (subscriptions as unknown as Array<{
    current_period_end: string;
    cancel_at_period_end: boolean;
    provider: string | null;
  }>)[0];
  const ownedWorkspaceCount = Number((workspaceCounts as unknown as Array<{ count: number }>)[0]?.count || 1);
  const renewalDate = subscription?.current_period_end
    ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "long" }).format(new Date(subscription.current_period_end))
    : null;
  const paymentMethod = parseDemoPaymentProvider(subscription?.provider);

  return (
    <div className="settings-workspace-stack">
      <WorkspaceIdentityEditor workspaceName={context.workspace_name} workspaceSlug={context.workspace_slug} />
      <WorkspaceCreateControl planKey={context.plan_key} ownedCount={ownedWorkspaceCount} />
      <AdIntegrationsPanel />
      <SettingsConsole
        workspaceName={context.workspace_name}
        workspaceSlug={context.workspace_slug}
        email={context.email}
        userName={context.user_name}
        planKey={context.plan_key}
        gatewayReady={gatewayReady}
        renewalDate={renewalDate}
        cancelAtPeriodEnd={Boolean(subscription?.cancel_at_period_end)}
        paymentMethod={paymentMethod}
      />
    </div>
  );
}
