"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@b402-relay/ui";
import { createClient } from "../../../lib/supabase/client";

export default function SignUpPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signUpError } = await supabase.auth.signUp({ email, password });

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setConfirmationSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent>
          {confirmationSent ? (
            <p className="text-sm text-slate-600">
              Check {email} for a confirmation link, then sign in.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password (min 8 characters)"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>
              <p className="text-sm text-slate-500">
                Already have one?{" "}
                <Link href="/sign-in" className="text-slate-900 underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
