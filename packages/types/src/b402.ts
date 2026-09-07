/**
 * B402 (Binance's x402 implementation) domain types.
 *
 * Field shapes verified against developers.binance.com/en/docs/products/onchainpay-x402/
 * (introduction, quick-start, change-log) on 2026-09-05, not assumed from the generic x402
 * spec. Binance's own docs state the V2 PaymentPayload is "CDP wire-shape compatible... match
 * field-for-field," so this mirrors Coinbase's x402 v2 REST schema, with two B402-specific
 * `extra` fields the change log calls out explicitly: `signerAddress` + `spenderAddress`
 * (replacing an older, overloaded `facilitatorAddress` field).
 *
 * NOT yet independently confirmed against a live call (Sandbox credentials are pending —
 * see RESEARCH_BRIEF.md) — treat the exact `extra` contents and the BSC testnet CAIP-2 id as
 * "best documented understanding," not "verified against a real response." Reconcile against
 * a real `/papi/v2/b402/supported` response the moment Sandbox credentials land (Session 3).
 */

export type B402Scheme = "exact" | "upto";

/** BSC mainnet = eip155:56 (well-known public chain id). BSC testnet is commonly eip155:97 —
 *  confirm this against a live /supported response once Sandbox credentials arrive. */
export type Caip2Network = "eip155:56" | "eip155:97";

export interface B402Extra {
  /** EIP-712 domain name of the token contract, e.g. "Tether USD". */
  name?: string;
  /** EIP-712 domain version of the token contract. */
  version?: string;
  /** Confirmed to exist by the quick-start's "echo extra verbatim" warning; exact string
   *  values (e.g. "permit2-exact" vs "permit2_exact") not independently confirmed. */
  assetTransferMethod?: string;
  /** Permit2 flows only (permit2-exact / permit2-upto): address that signs the Permit2 message. */
  signerAddress?: string;
  /** Permit2 flows only: the spender address the Permit2 allowance is scoped to (B402 itself). */
  spenderAddress?: string;
}

export interface PaymentRequirements {
  scheme: B402Scheme;
  network: Caip2Network;
  /** ERC-20 contract address of the payment asset on BSC. */
  asset: string;
  /** Smallest-unit amount required, as a string (matches the token's own decimals). */
  amount: string;
  /** Address funds settle to — the seller's wallet. */
  payTo: string;
  maxTimeoutSeconds: number;
  extra: B402Extra;
}

export interface Eip3009Authorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

export interface PaymentPayloadPayload {
  signature: string;
  authorization: Eip3009Authorization;
}

export interface PaymentPayload {
  x402Version: 2;
  accepted: PaymentRequirements;
  payload: PaymentPayloadPayload;
  resource?: {
    url: string;
    description?: string;
    mimeType?: string;
  };
}

export type VerifyInvalidReason =
  | "insufficient_funds"
  | "invalid_scheme"
  | "invalid_network"
  | "invalid_x402_version"
  | "invalid_payment_requirements"
  | "invalid_payload"
  | "invalid_signature";

export interface VerifyResponse {
  isValid: boolean;
  payer?: string;
  invalidReason?: VerifyInvalidReason;
}

export type SettleErrorReason =
  | "unsupported_scheme"
  | "unsupported_network"
  | "unsupported_asset"
  | "invalid_payload"
  | "address_mismatch"
  | "amount_mismatch"
  | "invalid_signature"
  | "authorization_expired"
  | "insufficient_balance"
  | "nonce_already_used";

export interface SettleResponse {
  success: boolean;
  transaction: string;
  network: Caip2Network;
  payer?: string;
  errorReason?: SettleErrorReason;
}

/**
 * `/papi/v2/b402/supported` response shape. Confirmed field names: top-level `kinds`,
 * `extensions`, `signers` (per Quick Start: "returns 200 and a JSON body with kinds,
 * extensions, and signers"), and `kinds[].extra` containing `name`, `version`,
 * `assetTransferMethod`, `signerAddress`, and (for permit2-* methods) `spenderAddress` — the
 * quick-start guide explicitly requires echoing this object verbatim into a 402 response's
 * `paymentRequirements.extra`. The remaining fields on each `kind` (scheme/network/asset/
 * amount bounds) are inferred from what a seller needs to build `PaymentRequirements` from
 * this response, NOT individually confirmed field-by-field against a real response — reconcile
 * once Sandbox credentials allow a real `/supported` call.
 */
export interface SupportedKind {
  scheme: B402Scheme;
  network: Caip2Network;
  asset: string;
  extra: Required<B402Extra>;
}

export interface SupportedConfigurationsResponse {
  kinds: SupportedKind[];
  extensions?: Record<string, unknown>;
  signers?: string[];
}


export interface DecisionLogEntry {
  timestamp: string;
  step: "requested" | "402_received" | "signed" | "verified" | "settled" | "delivered" | "failed";
  detail: string;
  amount?: string;
  asset?: string;
  mode: "stub" | "sandbox" | "mainnet";
}
