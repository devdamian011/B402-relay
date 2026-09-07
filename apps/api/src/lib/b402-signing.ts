import { createSign } from "node:crypto";

/**
 * B402's authenticated APIs (/supported, /verify, /settle) require every request signed with
 * RSA-SHA256 using a 1024-bit RSA key pair the merchant generates and registers during
 * onboarding — confirmed against developers.binance.com/en/docs/products/onchainpay-x402/
 * basics/3.request-signing this session (not the bearer-token scheme Session 2 guessed).
 *
 * Signing payload = jsonBody + timestamp (plain string concatenation, UTF-8), signed with the
 * merchant's PKCS#8 private key, Base64-encoded. Server accepts a timestamp within 5 minutes
 * of its own clock. Uses Node's built-in `crypto` — Binance's own Node.js reference sample
 * needs no external signing library either.
 */
export interface SignedRequestHeaders {
  "Content-Type": "application/json";
  "X-Tesla-ClientId": string;
  "X-Tesla-SignAccessToken": string;
  "X-Tesla-Timestamp": string;
  "X-Tesla-Signature": string;
}

export function signB402Request(
  jsonBody: string,
  clientId: string,
  accessToken: string,
  privateKeyB64: string
): SignedRequestHeaders {
  const timestamp = Date.now().toString();
  const payload = jsonBody + timestamp;

  const privateKeyPem = derToPem(privateKeyB64);
  const signature = createSign("RSA-SHA256").update(payload, "utf-8").sign(privateKeyPem, "base64");

  return {
    "Content-Type": "application/json",
    "X-Tesla-ClientId": clientId,
    "X-Tesla-SignAccessToken": accessToken,
    "X-Tesla-Timestamp": timestamp,
    "X-Tesla-Signature": signature
  };
}

/** Node's crypto wants PEM, not a raw Base64 DER blob — wrap it in PKCS#8 PEM armor. */
function derToPem(privateKeyB64: string): string {
  const lines = privateKeyB64.match(/.{1,64}/g) ?? [privateKeyB64];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`;
}
