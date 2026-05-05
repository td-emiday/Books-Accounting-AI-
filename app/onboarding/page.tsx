// Post-auth onboarding wizard. The proxy guards this route as authed.
// If the user has already finished, we send them straight to /app.

import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { getWorkspaceContext } from "@/lib/queries/workspace";
import { TIERS, type PublicTierId } from "@/lib/tiers";

export const metadata = { title: "Welcome — Emiday" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; plan?: string }>;
}) {
  const ctx = await getWorkspaceContext();
  if (ctx.onboarded) redirect("/app");

  const { error, plan: planRaw } = await searchParams;

  // Plan picked on landing → ?plan=. Falls back to whatever's stashed on
  // the user's auth metadata (signUpAction puts it there) → finally to
  // "growth" so the wizard always has a sensible default.
  const fallback =
    (ctx.user as unknown as { plan?: string })?.plan ?? "growth";
  const planCandidate = (planRaw ?? fallback).toLowerCase();
  const plan: PublicTierId =
    planCandidate in TIERS ? (planCandidate as PublicTierId) : "growth";

  // Default trading name = the placeholder workspace name from the trigger,
  // stripped of the "'s workspace" suffix so it reads cleanly in the input.
  const defaultTradingName = ctx.workspace.name
    .replace(/['’]s workspace$/i, "")
    .trim();

  return (
    <OnboardingWizard
      mode="onboarding"
      firstName={ctx.firstName}
      defaultTradingName={defaultTradingName}
      plan={plan}
      defaultBanks={ctx.workspace.banks ?? []}
      error={error}
    />
  );
}
