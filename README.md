# b402-relay

An AI agent that autonomously discovers a B402-gated resource, signs and settles the
micropayment itself, and shows every step of that machine-to-machine transaction live on a
dashboard — buyer and seller both running in the same demo.

Built for the **Binance Agent OS Mini Hackathon** — Payment Workflows track (B402 / x402 on BNB
Smart Chain), Track A.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Web:** `apps/web` — Next.js (App Router) + TypeScript + Tailwind CSS
- **API:** `apps/api` — Fastify + TypeScript
- **Shared:** `packages/types`, `packages/ui`, `packages/config`
- **Auth/DB:** Supabase
- **Agent connectivity:** Binance Agent OS MCP server (`https://agent.binance.com/mcp/agentic`)
  and Binance B402 Open APIs (`/papi/v2/b402/*`) — wired in from Session 2 onward, not in this
  scaffold

## Getting started

This repo was scaffolded in a sandboxed environment with no network access, so dependencies are
declared in each `package.json` but **not installed**. Run this locally first:

```bash
pnpm install
```

Then copy the env templates and fill in real values (see "Environment variables" below):

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

Run everything in dev mode:

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000 (health check at `/health`)

## Environment variables

Names only — no values or secrets live in this repo, per the build ruleset's key-management rule.

**`apps/web/.env.example`**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL`

**`apps/api/.env.example`**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT`
- `BINANCE_TESTNET_CLIENT_ID` / `BINANCE_TESTNET_ACCESS_TOKEN` / `BINANCE_TESTNET_PRIVATE_KEY_B64`
- `BINANCE_MAINNET_CLIENT_ID` / `BINANCE_MAINNET_ACCESS_TOKEN` / `BINANCE_MAINNET_PRIVATE_KEY_B64`
  (not touched until the explicit go-live session — see the build ruleset, Section 9.2)

## Project docs

- `AGENT_BUILD_RULESET.md`, `RESEARCH_BRIEF.md`, `BUILD_ROADMAP.md` — kept in the Claude Project
  Knowledge Base, not in this repo (they govern the build process, not the product itself).
- `SESSION_REPORT.md` — cumulative state of the build, updated every session. Read this before
  starting any new session.

## Status

Session 1 of 5 complete: core infrastructure only. No B402/payment logic exists yet — that starts
in Session 2.
