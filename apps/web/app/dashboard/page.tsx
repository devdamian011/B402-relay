import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@b402-relay/ui";
import { createClient } from "../../lib/supabase/server";

/**
 * Protected route shell only. The live 402 → sign → verify → settle view is Session 4's job
 * (see BUILD_ROADMAP.md) — this just proves the auth guard and layout work.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Signed in as {session.user.email}. The payment-flow log (402 → sign → verify → settle)
            renders here starting in Session 4.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
