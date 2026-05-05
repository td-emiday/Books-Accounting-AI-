// Trial-state helpers. Single rulebook for what counts as locked,
// trialing, or unlocked — read by the middleware-style gate, the
// in-app banner, and the lock page itself.
//
// Rules:
//   subscription_status === 'active' OR 'non_renewing'  → unlocked
//   no trial_ends_at                                    → unlocked (legacy)
//   trial_ends_at > now()                               → trialing
//   else                                                → locked
//
// "Custom" plan workspaces (ENTERPRISE) are billed manually so they're
// always unlocked regardless of subscription_status.

export type TrialState = {
  status: "unlocked" | "trialing" | "locked";
  trialEndsAt: string | null;
  msLeft: number;          // 0 once trial has ended
};

export function trialStateFor(input: {
  subscriptionStatus: string | null | undefined;
  trialEndsAt: string | null | undefined;
  planTier: string | null | undefined;
  now?: Date;
}): TrialState {
  const now = input.now ?? new Date();
  const sub = (input.subscriptionStatus ?? "").toLowerCase();
  const tier = (input.planTier ?? "").toUpperCase();

  // Paid workspaces — including the grace window after a cancel — are
  // unlocked. Custom plans are billed manually (no checkout flow).
  if (sub === "active" || sub === "non_renewing" || tier === "ENTERPRISE") {
    return { status: "unlocked", trialEndsAt: input.trialEndsAt ?? null, msLeft: 0 };
  }

  if (!input.trialEndsAt) {
    return { status: "unlocked", trialEndsAt: null, msLeft: 0 };
  }

  const ends = new Date(input.trialEndsAt).getTime();
  const msLeft = ends - now.getTime();
  return {
    status: msLeft > 0 ? "trialing" : "locked",
    trialEndsAt: input.trialEndsAt,
    msLeft: Math.max(0, msLeft),
  };
}

/** "23h 14m" / "47m" / "Trial ends in 38s" — for the banner. */
export function formatTrialLeft(msLeft: number): string {
  if (msLeft <= 0) return "Trial ended";
  const sec = Math.floor(msLeft / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  if (hr >= 1) return `${hr}h ${min % 60}m left`;
  if (min >= 1) return `${min}m left`;
  return `${sec}s left`;
}
