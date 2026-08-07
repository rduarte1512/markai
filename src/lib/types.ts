export type PlanKey = "free" | "starter" | "pro" | "agency";

export type SessionPayload = {
  userId: string;
  workspaceId: string;
  expiresAt: number;
};

export type AppContext = {
  user_id: string;
  user_name: string;
  email: string;
  workspace_id: string;
  workspace_name: string;
  workspace_slug: string;
  billing_workspace_id: string;
  plan_key: PlanKey;
  monthly_balance: number;
  extra_balance: number;
  monthly_allowance: number;
  period_end: string;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  audience: string | null;
  tone_of_voice: string | null;
  primary_color: string;
  secondary_color: string;
  onboarding_completed: boolean;
  created_at: string;
};

export type ModelAccess = {
  key: string;
  display_name: string;
  consumption_group: "very_low" | "low" | "medium" | "high" | "very_high";
  credit_cost: number;
  description: string | null;
  monthly_request_limit: number;
  monthly_requests_used: number;
  available: boolean;
};