import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request so Server Components always see a
 * valid (non-expired) session. This is boilerplate, not app logic — leave it alone.
 *
 * Named `proxy` (not `middleware`) per Next.js 16's file-convention rename — same behavior,
 * new name, and it now runs on the Node.js runtime instead of Edge.
 *
 * Note: this refreshes cookies only. It is not itself a security boundary — route protection
 * happens server-side in the page/layout (see app/dashboard/page.tsx), not here.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
