import "dotenv/config";
import { z } from "zod";

/**
 * Fails fast and loudly if a required variable is missing, rather than letting `undefined`
 * silently propagate into a Supabase/Binance client at runtime.
 *
 * Binance credentials are optional at this stage (Session 1 has no B402 logic yet) — they
 * become required once Session 2 wires in the payment flow.
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  BINANCE_AGENT_MCP_URL: z.string().url().default("https://agent.binance.com/mcp/agentic"),
  BINANCE_ENV: z.enum(["testnet", "mainnet"]).default("testnet"),
  BINANCE_TESTNET_CLIENT_ID: z.string().optional(),
  BINANCE_TESTNET_ACCESS_TOKEN: z.string().optional(),
  BINANCE_TESTNET_PRIVATE_KEY_B64: z.string().optional(),
  BINANCE_MAINNET_CLIENT_ID: z.string().optional(),
  BINANCE_MAINNET_ACCESS_TOKEN: z.string().optional(),
  BINANCE_MAINNET_PRIVATE_KEY_B64: z.string().optional()
});

export const env = envSchema.parse(process.env);
