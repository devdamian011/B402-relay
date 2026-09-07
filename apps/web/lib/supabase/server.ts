import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for use in Server Components and Route Handlers.
 *
 * Uses the current getAll/setAll cookie adapter (the per-cookie get/set/remove shape is
 * deprecated and causes stale-session bugs on recent @supabase/ssr versions). `cookies()`
 * is async as of Next.js 15+, so this function must be awaited by its callers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — proxy.ts below handles session refresh.
          }
        }
      }
    }
  );
}
