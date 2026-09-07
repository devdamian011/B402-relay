import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { PaymentPayload, PaymentRequirements } from "@b402-relay/types";
import { verifyPayment, settlePayment, isB402Live } from "../lib/b402-client";
import { logDecision } from "../lib/decision-log";
import { env } from "../lib/env";

/**
 * The "seller" half of the demo: one B402-gated resource. A real product would gate many
 * endpoints — this is one, on purpose, per Session 2's scope (prove the round trip works
 * end to end, not build a catalog of paid endpoints).
 *
 * USDT/permit2-exact chosen as the demo's payment method — it's an arbitrary but reasonable
 * default among the four supported assets, not implied by anything in the docs.
 */
const RESOURCE_PATH = "/api/resource/btc-insight";
const PRICE_SMALLEST_UNIT = "10000"; // 0.01 USDT (6 decimals) — a real micropayment, not a token amount
const USDT_BSC_TESTNET_PLACEHOLDER = "0x0000000000000000000000000000000000TEST"; // see note below

function buildPaymentRequirements(): PaymentRequirements {
  return {
    scheme: "exact",
    // BSC testnet CAIP-2 id — see packages/types/src/b402.ts note: commonly eip155:97,
    // not yet confirmed against a live /supported response.
    network: "eip155:97",
    // USDT's real BSC MAINNET contract is documented (0x55d39...); no testnet contract address
    // was confirmed this session, so this is a clearly-marked placeholder, not a real address.
    asset: USDT_BSC_TESTNET_PLACEHOLDER,
    amount: PRICE_SMALLEST_UNIT,
    payTo: env.DEMO_SELLER_ADDRESS,
    maxTimeoutSeconds: 60,
    extra: { name: "Tether USD", version: "1" }
  };
}

export function registerResourceRoute(app: FastifyInstance) {
  app.get(RESOURCE_PATH, async (request: FastifyRequest, reply: FastifyReply) => {
    const paymentHeader = request.headers["x-payment"] as string | undefined;

    logDecision({
      step: "requested",
      detail: `GET ${RESOURCE_PATH}`,
      mode: isB402Live() ? "sandbox" : "stub"
    });

    if (!paymentHeader) {
      const paymentRequirements = buildPaymentRequirements();

      logDecision({
        step: "402_received",
        detail: "No X-PAYMENT header present — issuing payment requirements",
        amount: paymentRequirements.amount,
        asset: paymentRequirements.asset,
        mode: isB402Live() ? "sandbox" : "stub"
      });

      // Per Binance's current docs, payment requirements go in the 402 response BODY (an
      // earlier legacy version of the same docs said "header" — the current page supersedes
      // that; this route follows the current page).
      return reply.status(402).send({
        x402Version: 2,
        accepts: [paymentRequirements],
        resource: { url: RESOURCE_PATH, description: "A one-line BTC market note", mimeType: "application/json" }
      });
    }

    let paymentPayload: PaymentPayload;
    try {
      paymentPayload = JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf-8"));
    } catch {
      return reply.status(400).send({ error: { message: "Malformed X-PAYMENT header", code: "BAD_PAYMENT_HEADER" } });
    }

    const paymentRequirements = buildPaymentRequirements();

    const verifyResult = await verifyPayment(paymentPayload, paymentRequirements);
    logDecision({
      step: "verified",
      detail: verifyResult.isValid ? "Signature verified" : `Invalid: ${verifyResult.invalidReason}`,
      amount: paymentRequirements.amount,
      asset: paymentRequirements.asset,
      mode: isB402Live() ? "sandbox" : "stub"
    });

    if (!verifyResult.isValid) {
      return reply.status(402).send({ error: { message: "Payment verification failed", code: verifyResult.invalidReason ?? "INVALID_PAYMENT" } });
    }

    const settleResult = await settlePayment(paymentPayload, paymentRequirements);
    logDecision({
      step: settleResult.success ? "settled" : "failed",
      detail: settleResult.success ? `Settled: ${settleResult.transaction}` : `Settle failed: ${settleResult.errorReason}`,
      amount: paymentRequirements.amount,
      asset: paymentRequirements.asset,
      mode: isB402Live() ? "sandbox" : "stub"
    });

    if (!settleResult.success) {
      return reply.status(402).send({ error: { message: "Settlement failed", code: settleResult.errorReason ?? "SETTLE_FAILED" } });
    }

    reply.header("X-PAYMENT-RESPONSE", Buffer.from(JSON.stringify(settleResult)).toString("base64"));

    logDecision({
      step: "delivered",
      detail: "Resource delivered after confirmed settle",
      mode: isB402Live() ? "sandbox" : "stub"
    });

    return reply.send({
      insight: "BTC realized volatility has compressed over the trailing 30 days.",
      paidWith: paymentRequirements.asset,
      settlement: settleResult.transaction
    });
  });
}
