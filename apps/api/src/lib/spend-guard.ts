import { env } from "./env";

/**
 * Section 9.4 — a hard numeric limit, enforced in code, not just documented as a plan. Checked
 * before every verify/settle call in resource.ts. In-memory only (resets on restart), same
 * caveat as decision-log.ts — fine for a demo, not fine for production.
 */
interface DayBucket {
  dateKey: string;
  totalSmallestUnits: bigint;
  callCount: number;
}

let bucket: DayBucket = { dateKey: todayKey(), totalSmallestUnits: 0n, callCount: 0 };

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
}

function currentBucket(): DayBucket {
  const key = todayKey();
  if (bucket.dateKey !== key) {
    bucket = { dateKey: key, totalSmallestUnits: 0n, callCount: 0 };
  }
  return bucket;
}

export function checkAndRecordSpend(amountSmallestUnits: string): { allowed: boolean; reason?: string } {
  const b = currentBucket();
  const amount = BigInt(amountSmallestUnits);

  if (b.callCount + 1 > env.SPEND_LIMIT_MAX_CALLS_PER_DAY) {
    return { allowed: false, reason: `Daily call limit reached (${env.SPEND_LIMIT_MAX_CALLS_PER_DAY}/day)` };
  }
  if (b.totalSmallestUnits + amount > env.SPEND_LIMIT_MAX_AMOUNT_PER_DAY) {
    return {
      allowed: false,
      reason: `Daily spend limit reached (${env.SPEND_LIMIT_MAX_AMOUNT_PER_DAY} smallest-units/day)`
    };
  }

  b.callCount += 1;
  b.totalSmallestUnits += amount;
  return { allowed: true };
}

export function getSpendStatus() {
  const b = currentBucket();
  return {
    date: b.dateKey,
    callCount: b.callCount,
    maxCallsPerDay: env.SPEND_LIMIT_MAX_CALLS_PER_DAY,
    // BigInt doesn't survive JSON.stringify (Fastify's reply.send) — stringify explicitly.
    totalSmallestUnits: b.totalSmallestUnits.toString(),
    maxAmountPerDay: env.SPEND_LIMIT_MAX_AMOUNT_PER_DAY.toString()
  };
}
