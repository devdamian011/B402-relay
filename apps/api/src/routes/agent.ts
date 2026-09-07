import type { FastifyInstance } from "fastify";
import type { PaymentRequirements } from "@b402-relay/types";
import { buildStubPaymentPayload } from "../lib/agent-signer";
import { logDecision, getDecisionLog } from "../lib/decision-log";
import { getSpendStatus } from "../lib/spend-guard";

const RESOURCE_PATH = "/api/resource/btc-insight";

/**
 * The "buyer" half of the demo: an agent that discovers the gated resource, handles the 402
 * challenge, signs (stub) and resubmits payment, and consumes the resource — the autonomous
 * side of the pitch in RESEARCH_BRIEF.md. Uses Fastify's `inject` to call the resource route
 * in-process rather than a real HTTP round trip to itself.
 */
export function registerAgentRoute(app: FastifyInstance) {
  app.post("/api/agent/buy", async (_request, reply) => {
    const firstAttempt = await app.inject({ method: "GET", url: RESOURCE_PATH });

    if (firstAttempt.statusCode !== 402) {
      return reply.status(502).send({
        error: { message: `Expected 402 from resource, got ${firstAttempt.statusCode}`, code: "UNEXPECTED_STATUS" }
      });
    }

    const { accepts } = firstAttempt.json() as { accepts: PaymentRequirements[] };
    const requirements = accepts[0];

    const paymentPayload = buildStubPaymentPayload(requirements);
    logDecision({
      step: "signed",
      detail: "Built (stub) signed payment payload in response to 402",
      amount: requirements.amount,
      asset: requirements.asset,
      mode: "stub"
    });

    const paidAttempt = await app.inject({
      method: "GET",
      url: RESOURCE_PATH,
      headers: {
        "x-payment": Buffer.from(JSON.stringify(paymentPayload)).toString("base64")
      }
    });

    if (paidAttempt.statusCode !== 200) {
      return reply.status(502).send({
        error: { message: "Resource did not accept the payment", code: "PAYMENT_REJECTED" },
        detail: paidAttempt.json()
      });
    }

    return reply.send({
      resource: paidAttempt.json(),
      decisionLog: getDecisionLog()
    });
  });

  app.get("/api/agent/decision-log", async () => ({ entries: getDecisionLog() }));
  app.get("/api/agent/spend-status", async () => getSpendStatus());
}
