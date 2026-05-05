// Sign-up page — entry point for the unified wizard.
//
// We render the same OnboardingWizard component the post-auth onboarding
// page uses, in mode="signup". Step 0 (Account) is the only interactive
// step here; on submit, signUpAction creates the user and redirects to
// /onboarding to continue at step 1.

import Link from "next/link";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { createClient } from "@/lib/supabase/server";
import { TIERS, type PublicTierId } from "@/lib/tiers";

export const metadata = { title: "Sign up — Emiday" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    check_email?: string;
    plan?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Already signed in → continue onboarding (or land on dashboard if
  // already onboarded — /onboarding handles that branch).
  if (user) redirect("/onboarding");

  const { error, check_email, plan: planRaw } = await searchParams;

  // Email confirmation flow — keep the lightweight "check your inbox" card.
  if (check_email) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <h1>Check your inbox</h1>
          <p className="muted">
            We sent a confirmation link to your email. Click it to finish
            creating your Emiday account — we&apos;ll pick up where you left
            off.
          </p>
          <p className="auth-foot">
            <Link href="/sign-in">Back to sign in</Link>
          </p>
        </div>
      </main>
    );
  }

  const plan: PublicTierId =
    planRaw && planRaw.toLowerCase() in TIERS
      ? (planRaw.toLowerCase() as PublicTierId)
      : "growth";

  return (
    <>
      <OnboardingWizard
        mode="signup"
        firstName="there"
        defaultTradingName=""
        plan={plan}
        error={error}
      />
      <p className="onb-aux-foot">
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </>
  );
}
