/**
 * Shared types used by both apps/web and apps/api.
 *
 * Kept theme-agnostic for Session 1, per the build ruleset (Section 1, principle 3):
 * "Infra before theme." Payment/agent-domain types (B402 payment requirements, decision log
 * entries, etc.) land in Session 2 when that logic is actually built.
 */

export interface HealthCheckResponse {
  status: "ok" | "degraded";
  timestamp: string;
  service: string;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

/** Minimal shape mirroring the fields the app reads off a Supabase auth session. */
export interface AppUser {
  id: string;
  email: string | null;
  createdAt: string;
}
