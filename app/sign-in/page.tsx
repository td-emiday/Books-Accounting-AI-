// Sign-in page. Server component that renders a form posting to a
// server action. Errors and "?next=" come back via querystring.

import Link from "next/link";
import { redirect } from "next/navigation";
import { signInAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sign in — Emiday" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  const { error, next } = await searchParams;

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h1>Welcome back.</h1>
        <p className="muted">
          Pick up right where you left off. Your books are quietly waiting.
        </p>

        {error ? <div className="auth-error">{error}</div> : null}

        <form action={signInAction} className="auth-form">
          <input type="hidden" name="next" value={next ?? "/app"} />
          <label>
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              autoFocus
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="auth-primary">
            Sign in
          </button>
        </form>

        <p className="auth-foot">
          New to Emiday?{" "}
          <Link href={`/sign-up${next ? `?next=${encodeURIComponent(next)}` : ""}`}>
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
