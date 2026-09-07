import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Server-side Supabase client using the service role key. Only ever imported from API route
 * handlers — never bundled into apps/web.
 */
export const supabase =
  env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
      })
    : null;
