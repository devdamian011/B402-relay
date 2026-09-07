import type { DecisionLogEntry } from "@b402-relay/types";

/**
 * In-memory decision log for this session. Good enough to prove the payment flow's every step
 * is recorded (Section 9.5) and to feed Session 4's dashboard once that exists.
 *
 * Explicitly NOT persisted to Supabase yet — that's a reasonable Session 3/4 candidate once
 * live settles are actually happening, not invented here as unrequested scope (Section 6,
 * rule 4). Resets on server restart; fine for a demo, not fine for production.
 */
const entries: DecisionLogEntry[] = [];

export function logDecision(entry: Omit<DecisionLogEntry, "timestamp">): DecisionLogEntry {
  const full: DecisionLogEntry = { ...entry, timestamp: new Date().toISOString() };
  entries.push(full);
  return full;
}

export function getDecisionLog(): DecisionLogEntry[] {
  return entries;
}
