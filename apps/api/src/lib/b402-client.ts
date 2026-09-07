import type {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  SupportedConfigurationsResponse,
  VerifyResponse
} from "@b402-relay/types";
import { env } from "./env";
import { signB402Request } from "./b402-signing";

/**
 * Client for B402's authenticated APIs (/supported, /verify, /settle). Runs in **stub mode**
 * whenever the base URL or credentials aren't set — which is the case right now (Sandbox
 * partner application is still pending, see RESEARCH_BRIEF.md). Every stub response is logged
 * as `mode: "stub"` in the decision log, never silently presented as a real call.
 *
 * Auth corrected this session (Session 3): Session 2 guessed a bearer token. Binance's docs
 * actually specify RSA-SHA256 request signing (X-Tesla-* headers) — see b402-signing.ts.
 */

function isLive(): boolean {
  return Boolean(
    env.BINANCE_B402_BASE_URL &&
      env.BINANCE_TESTNET_CLIENT_ID &&
      env.BINANCE_TESTNET_ACCESS_TOKEN &&
      env.BINANCE_TESTNET_PRIVATE_KEY_B64
  );
}

async function signedPost<T>(path: string, body: unknown): Promise<T> {
  const jsonBody = JSON.stringify(body);
  const headers = signB402Request(
    jsonBody,
    env.BINANCE_TESTNET_CLIENT_ID!,
    env.BINANCE_TESTNET_ACCESS_TOKEN!,
    env.BINANCE_TESTNET_PRIVATE_KEY_B64!
  );

  const res = await fetch(`${env.BINANCE_B402_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: jsonBody
  });

  return res.json() as Promise<T>;
}

// /supported changes infrequently — Binance's own docs say cache it rather than call per
// request. Simple in-memory cache, refreshed at most once per 5 minutes.
let supportedCache: { data: SupportedConfigurationsResponse; fetchedAt: number } | null = null;
const SUPPORTED_CACHE_TTL_MS = 5 * 60 * 1000;

export async function getSupportedConfigurations(): Promise<SupportedConfigurationsResponse> {
  if (supportedCache && Date.now() - supportedCache.fetchedAt < SUPPORTED_CACHE_TTL_MS) {
    return supportedCache.data;
  }

  const data = isLive()
    ? await signedPost<SupportedConfigurationsResponse>("/papi/v2/b402/supported", {})
    : stubSupportedConfigurations();

  supportedCache = { data, fetchedAt: Date.now() };
  return data;
}

function stubSupportedConfigurations(): SupportedConfigurationsResponse {
  return {
    kinds: [
      {
        scheme: "exact",
        network: "eip155:97",
        // Confirmed real BSC MAINNET contract; no testnet address confirmed this session —
        // clearly a stand-in, not asserted as the real testnet address.
        asset: "0x55d398326f99059fF775485246999027B3197955",
        extra: {
          name: "Tether USD",
          version: "1",
          // Field confirmed to exist by the quick-start warning; its exact value spelling
          // (e.g. "permit2-exact" vs "permit2_exact") is not independently confirmed.
          assetTransferMethod: "permit2-exact",
          signerAddress: "0x0000000000000000000000000000000000STUB",
          spenderAddress: "0x0000000000000000000000000000000000STUB"
        }
      }
    ],
    signers: ["0x0000000000000000000000000000000000STUB"]
  };
}

export async function verifyPayment(
  paymentPayload: PaymentPayload,
  paymentRequirements: PaymentRequirements
): Promise<VerifyResponse> {
  if (!isLive()) {
    return { isValid: true, payer: paymentPayload.payload.authorization.from };
  }

  return signedPost<VerifyResponse>("/papi/v2/b402/verify", {
    x402Version: 2,
    paymentPayload,
    paymentRequirements
  });
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

  return signedPost<SettleResponse>("/papi/v2/b402/settle", {
    x402Version: 2,
    paymentPayload,
    paymentRequirements
  });
}

export { isLive as isB402Live };
