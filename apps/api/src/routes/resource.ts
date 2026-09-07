import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { PaymentPayload, PaymentRequirements } from "@b402-relay/types";
import { verifyPayment, settlePayment, isB402Live, getSupportedConfigurations } from "../lib/b402-client";
import { checkAndRecordSpend } from "../lib/spend-guard";
import { logDecision } from "../lib/decision-log";
import { env } from "../lib/env";

/**
 * The "seller" half of the demo: one B402-gated resource. A real product would gate many
 * endpoints — this is one, on purpose, per Session 2's scope (prove the round trip works
 * end to end, not build a catalog of paid endpoints).
 *
 * Session 3 correction: payment requirements are now built from `/supported` (cached), with
 * `extra` echoed verbatim, per the quick-start guide's explicit warning — Session 2 hardcoded
 * these fields, which the docs say buyers can't independently reconstruct.
 */
const RESOURCE_PATH = "/api/resource/btc-insight";
const PRICE_SMALLEST_UNIT = "10000"; // 0.01 USDT (6 decimals) — a real micropayment, not a token amount

async function buildPaymentRequirements(): Promise<PaymentRequirements> {
  const supported = await getSupportedConfigurations();
  const kind = supported.kinds[0];

  return {
    scheme: kind.scheme,
    network: kind.network,
    asset: kind.asset,
    amount: PRICE_SMALLEST_UNIT,
    payTo: env.DEMO_SELLER_ADDRESS,
    maxTimeoutSeconds: 60,
    extra: kind.extra // echoed verbatim, per the quick-start's explicit requirement
  };
}

export function registerResourceRoute(app: FastifyInstance) {
  app.get(RESOURCE_PATH, async (request: FastifyRequest, reply: FastifyReply) => {
    const paymentHeader = request.headers["x-payment"] as string | undefined;
    const mode = isB402Live() ? "sandbox" : "stub";

    logDecision({ step: "requested", detail: `GET ${RESOURCE_PATH}`, mode });

    if (!paymentHeader) {
      const paymentRequirements = await buildPaymentRequirements();

      logDecision({
        step: "402_received",
        detail: "No X-PAYMENT header present — issuing payment requirements from /supported",
        amount: paymentRequirements.amount,
        asset: paymentRequirements.asset,
        mode
      });

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

    const paymentRequirements = await buildPaymentRequirements();

    // Section 9.4 — hard numeric limit enforced in code, checked before any verify/settle call.
    const spendCheck = checkAndRecordSpend(paymentRequirements.amount);
    if (!spendCheck.allowed) {
      logDecision({ step: "failed", detail: `Blocked by spend guard: ${spendCheck.reason}`, mode });
      return reply.status(429).send({ error: { message: spendCheck.reason, code: "SPEND_LIMIT_EXCEEDED" } });
    }

    const verifyResult = await verifyPayment(paymentPayload, paymentRequirements);
    logDecision({
      step: "verified",
      detail: verifyResult.isValid ? "Signature verified" : `Invalid: ${verifyResult.invalidReason}`,
      amount: paymentRequirements.amount,
      asset: paymentRequirements.asset,
      mode
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
      mode
    });

    if (!settleResult.success) {
      return reply.status(402).send({ error: { message: "Settlement failed", code: settleResult.errorReason ?? "SETTLE_FAILED" } });
    }

    reply.header("X-PAYMENT-RESPONSE", Buffer.from(JSON.stringify(settleResult)).toString("base64"));
    logDecision({ step: "delivered", detail: "Resource delivered after confirmed settle", mode });

    return reply.send({
      insight: "BTC realized volatility has compressed over the trailing 30 days.",
      paidWith: paymentRequirements.asset,
      settlement: settleResult.transaction
    });
  });
}
