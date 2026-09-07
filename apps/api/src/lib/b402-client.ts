import type { PaymentPayload, PaymentRequirements, SettleResponse, VerifyResponse } from "@b402-relay/types";
import { env } from "./env";

/**
 * Thin client for B402's /verify and /settle. Runs in **stub mode** whenever the base URL or
 * credentials aren't set — which is the case right now (Sandbox partner application is still
 * pending, see RESEARCH_BRIEF.md). This is a declared, labeled stand-in, not a mock pretending
 * to be real (Section 6, rule 3): every stub response is logged as `mode: "stub"` in the
 * decision log, never silently presented as a real settle.
 *
 * Session 3's job (per BUILD_ROADMAP.md) is flipping this to live calls once credentials land —
 * nothing here should need to change except `isLive()` returning true.
 */

function isLive(): boolean {
  return Boolean(env.BINANCE_B402_BASE_URL && env.BINANCE_TESTNET_ACCESS_TOKEN);
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    // Field name (Bearer vs custom header, clientId placement) is not yet confirmed against
    // a real request — Binance's docs describe clientId + accessToken as issued credentials
    // but the exact header wiring wasn't captured this session. Confirm before Session 3 relies
    // on this being correct.
    Authorization: `Bearer ${env.BINANCE_TESTNET_ACCESS_TOKEN ?? ""}`
  };
}

export async function verifyPayment(
  paymentPayload: PaymentPayload,
  paymentRequirements: PaymentRequirements
): Promise<VerifyResponse> {
  if (!isLive()) {
    return {
      isValid: true,
      payer: paymentPayload.payload.authorization.from
    };
  }

  const res = await fetch(`${env.BINANCE_B402_BASE_URL}/papi/v2/b402/verify`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ x402Version: 2, paymentPayload, paymentRequirements })
  });

  return res.json() as Promise<VerifyResponse>;
}

export async function settlePayment(
  paymentPayload: PaymentPayload,
  paymentRequirements: PaymentRequirements
): Promise<SettleResponse> {
  if (!isLive()) {
    return {
      success: true,
      transaction: `stub-0x${Date.now().toString(16)}`,
      network: paymentRequirements.network,
      payer: paymentPayload.payload.authorization.from
    };
  }

  const res = await fetch(`${env.BINANCE_B402_BASE_URL}/papi/v2/b402/settle`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ x402Version: 2, paymentPayload, paymentRequirements })
  });

  return res.json() as Promise<SettleResponse>;
}

export { isLive as isB402Live };
