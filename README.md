# b402-relay

An AI agent that autonomously discovers a B402-gated resource, signs and settles the
micropayment itself, and shows every step of that machine-to-machine transaction live on a
dashboard — buyer and seller both running in the same demo.

Built for the **Binance Agent OS Mini Hackathon** — Payment Workflows (Track A), on B402
(Binance's x402 implementation) over BNB Smart Chain.

## What this actually demonstrates

Click **"Run agent purchase"** on the dashboard and watch, in real time:

1. The agent requests a paid resource (`GET /api/resource/btc-insight`) with no payment attached.
2. The seller responds `402 Payment Required`, with payment terms sourced live from B402's
   `/supported` configuration (not hardcoded — see "What's real vs. simulated" below).
3. The agent builds and signs an EIP-712 payment authorization.
4. It resubmits the request with the signed payment attached.
5. The seller verifies the signature, settles the payment on-chain via B402, and delivers
   the resource.

Every one of those five steps appears as its own timestamped row in the decision log, tagged
with which mode it ran in (`stub` or `sandbox`) — nothing is hidden or glossed over.

## What's real vs. simulated, honestly

This was built against Binance's B402 documentation with credential approval still pending at
submission time (Sandbox partner accounts are manually reviewed, not self-serve — see
`RESEARCH_BRIEF.md`). Rather than fake a "successful" demo, every simulated step says so:

| Piece | Status |
|---|---|
| Full monorepo, auth, deploy pipeline | Real, working |
| B402 request-signing (RSA-SHA256, `X-Tesla-*` headers) | Real implementation, unexercised against a live endpoint (no credentials yet) |
| `/supported` → build payment requirements → echo `extra` verbatim | Real logic; running against a shape-correct stub response until a live `/supported` call is possible |
| Buyer-side EIP-712/Permit2 signature | Cryptographically fake (shape-correct), pending a proper read of Binance's Permit2 Signing Guide + a funded testnet wallet |
| Spend/frequency guardrails (Section 9.4) | Real, enforced in code, active right now |
| Decision log | Real, live, in-memory |

Flipping from stub to live is a config change, not a rewrite: set `BINANCE_B402_BASE_URL`,
`BINANCE_TESTNET_CLIENT_ID`, `BINANCE_TESTNET_ACCESS_TOKEN`, and
`BINANCE_TESTNET_PRIVATE_KEY_B64` once Sandbox access is granted, and
`apps/api/src/lib/b402-client.ts` starts making real signed calls instead of returning stubs.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Web:** `apps/web` — Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4
- **API:** `apps/api` — Fastify 5 + TypeScript
- **Shared:** `packages/types`, `packages/ui`, `packages/config`
- **Auth/DB:** Supabase
- **Payments:** Binance B402 (x402 on BNB Smart Chain) — direct signed REST calls, not MCP

## Getting started

This repo was built in a sandboxed environment with no network access, so dependencies are
declared but not installed. Locally:

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
pnpm dev
```

- Web: http://localhost:3000 — sign up, then visit `/dashboard`
- API: http://localhost:4000 — health check at `/health`

No credentials are required to see the full flow run — it runs in stub mode out of the box.

## Environment variables

Names only — no values or secrets live in this repo.

**`apps/web/.env.example`:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_API_BASE_URL`

**`apps/api/.env.example`:** Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`), Binance
testnet/mainnet credential sets (empty by default — mainnet untouched per the build ruleset's
Section 9.2), `BINANCE_B402_BASE_URL` (issued privately by Binance on approval, not public),
`DEMO_SELLER_ADDRESS`, and the two `SPEND_LIMIT_*` guardrail values.

## Project docs

- `RESEARCH_BRIEF.md` — event rules, feasibility findings, the B402 credential-gating discovery
- `BUILD_ROADMAP.md` — the session plan this was built against
- `SESSION_REPORT.md` — cumulative build log, session by session, including every correction
  made along the way (Session 2's auth guess, corrected in Session 3, is left in the log rather
  than erased — that's the point of keeping it)

## Status

All 5 planned sessions complete. Running in stub mode pending B402 Sandbox credential approval.
