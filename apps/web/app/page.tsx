import Link from "next/link";
import { Button } from "@b402-relay/ui";

/**
 * Routing shell only — this is Session 1 (core infrastructure), theme-agnostic per the build
 * ruleset. The real landing page / payment dashboard design happens in Session 4.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">b402-relay</h1>
        <p className="text-slate-600">
          Core infrastructure is scaffolded. The agent, the payment flow, and the live dashboard
          are not built yet — those land in later sessions.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/sign-up">Create account</Link>
        </Button>
      </div>
    </main>
  );
}
