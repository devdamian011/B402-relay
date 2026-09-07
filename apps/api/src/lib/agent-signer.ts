import type { PaymentPayload, PaymentRequirements } from "@b402-relay/types";

/**
 * Builds a **stub** signed payment payload — shape-correct, cryptographically fake. Real
 * EIP-712/Permit2 signing needs a funded testnet wallet and a private key, neither of which
 * exist yet (B402 Sandbox application is still pending — see RESEARCH_BRIEF.md). Binance
 * documents a "Permit2 Signing Guide" with viem/ethers.js reference implementations for this;
 * that guide wasn't read this session, so real signing is explicit follow-up work for Session 3,
 * not silently faked as if it were real (Section 6, rule 3).
 *
 * The agent's own wallet address is also a stub — a fixed placeholder, not a real BSC testnet
 * address, since no wallet has been created yet.
 */
const AGENT_WALLET_STUB = "0x000000000000000000000000000000AgEnT01";

export function buildStubPaymentPayload(requirements: PaymentRequirements): PaymentPayload {
  const now = Math.floor(Date.now() / 1000);

  return {
    x402Version: 2,
    accepted: requirements,
    payload: {
      // Not a real signature — 65-byte-shaped hex filler so downstream code that checks
      // shape/length doesn't choke on an obviously-too-short stub value.
      signature: `0x${"stub".repeat(32)}1b`,
      authorization: {
        from: AGENT_WALLET_STUB,
        to: requirements.payTo,
        value: requirements.amount,
        validAfter: String(now - 60),
        validBefore: String(now + requirements.maxTimeoutSeconds),
        nonce: `0x${Date.now().toString(16).padStart(64, "0")}`
      }
    }
  };
}
