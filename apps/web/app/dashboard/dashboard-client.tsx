"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@b402-relay/ui";
import type { DecisionLogEntry } from "@b402-relay/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

interface SpendStatus {
  date: string;
  callCount: number;
  maxCallsPerDay: number;
  totalSmallestUnits: string;
  maxAmountPerDay: string;
}

const STEP_TONE: Record<DecisionLogEntry["step"], "neutral" | "pending" | "success" | "danger" | "accent"> = {
  requested: "neutral",
  "402_received": "pending",
  signed: "accent",
  verified: "accent",
  settled: "success",
  delivered: "success",
  failed: "danger"
};

/**
 * The actual product demo surface: fires the agent's buy flow and renders the decision log
 * live, per-step, as it comes back from the API — this is the "watch the machine-to-machine
 * payment happen" pitch from RESEARCH_BRIEF.md made visible.
 *
 * Still running against apps/api's stub B402 client (see SESSION_REPORT.md, Session 3) — every
 * entry below will show `mode: stub` until real Sandbox credentials exist. That's shown
 * honestly, not hidden, via the mode badge on each row.
 */
export function DashboardClient() {
  const [log, setLog] = useState<DecisionLogEntry[]>([]);
  const [spend, setSpend] = useState<SpendStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [logRes, spendRes] = await Promise.all([
      fetch(`${API_BASE}/api/agent/decision-log`),
      fetch(`${API_BASE}/api/agent/spend-status`)
    ]);
    if (logRes.ok) setLog((await logRes.json()).entries);
    if (spendRes.ok) setSpend(await spendRes.json());
  }, []);

  useEffect(() => {
    refresh().catch(() => setError("Couldn't reach the API — is it running on " + API_BASE + "?"));
  }, [refresh]);

  async function runPurchase() {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/agent/buy`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Purchase attempt failed");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Agent payment flow</CardTitle>
          <Button onClick={runPurchase} disabled={isRunning} size="sm">
            {isRunning ? "Running…" : "Run agent purchase"}
          </Button>
        </CardHeader>
        <CardContent>
          {spend ? (
            <p className="font-mono-signature text-xs text-muted">
              {spend.callCount}/{spend.maxCallsPerDay} calls today · {spend.totalSmallestUnits}/
              {spend.maxAmountPerDay} smallest-units today
            </p>
          ) : null}
          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decision log</CardTitle>
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-sm text-muted">
              No events yet — run a purchase above to watch the 402 → sign → verify → settle
              flow happen step by step.
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {log.map((entry, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center gap-2 border-b border-border pb-2 font-mono-signature text-xs last:border-b-0 last:pb-0"
                >
                  <span className="text-muted">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <Badge tone={STEP_TONE[entry.step]}>{entry.step}</Badge>
                  <Badge tone={entry.mode === "stub" ? "neutral" : "accent"}>{entry.mode}</Badge>
                  <span className="text-foreground">{entry.detail}</span>
                  {entry.amount ? (
                    <span className="text-muted">
                      {entry.amount} {entry.asset}
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
