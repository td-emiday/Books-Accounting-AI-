"use server";

// Onboarding wizard server action.
//
// Single submit at the end of the wizard. Persists every choice the user
// made — plan, billing cycle, business identity, banks, pending invites —
// into workspaces (and metadata for v1 invites).
//
// Plan tier persists to workspaces.plan_tier (DB enum), banks to the new
// workspaces.banks TEXT[] column, and invites stash on metadata.pending_invites
// until we wire a real invitation table.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { planTierFromPublicId, TIERS } from "@/lib/tiers";
import { sendMail } from "@/lib/mail";
import { getSiteOrigin } from "@/lib/site-url";

const ALLOWED_BUSINESS_TYPES = new Set([
  "SOLE_TRADER",
  "LIMITED_COMPANY",
  "PARTNERSHIP",
  "NGO",
  "GOVERNMENT",
]);

const ALLOWED_JURISDICTIONS = new Set(["NG", "GH", "ZA"]);

const ALLOWED_BILLING = new Set(["MONTHLY", "ANNUAL"]);

const ALLOWED_INVITE_ROLES = new Set([
  "ACCOUNTANT",
  "FINANCE_LEAD",
  "BOOKKEEPER",
  "VIEWER",
]);

const KNOWN_BANKS = new Set([
  "GTBank",
  "Zenith",
  "Access",
  "UBA",
  "First Bank",
  "Stanbic IBTC",
  "Wema",
  "Sterling",
  "Fidelity",
  "Union Bank",
  "Ecobank",
  "Polaris",
  "FCMB",
  "Providus",
  "Kuda",
  "Opay",
  "PalmPay",
  "Moniepoint",
]);

export async function completeOnboardingAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Locate the primary workspace (created by the signup trigger).
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership?.workspace_id) {
    redirect(
      "/onboarding?error=" +
        encodeURIComponent("We couldn't find your workspace. Refresh and try again."),
    );
  }

  const trim = (k: string) => String(formData.get(k) ?? "").trim();

  const planRaw = trim("plan");
  const planTier = planTierFromPublicId(planRaw); // returns DB enum or null
  const billingRaw = trim("billing_cycle").toUpperCase();
  const billingCycle = ALLOWED_BILLING.has(billingRaw) ? billingRaw : null;

  const tradingName = trim("trading_name");
  const businessTypeRaw = trim("business_type");
  const jurisdictionRaw = trim("jurisdiction");
  const industry = trim("industry");
  const tin = trim("tin");
  const rcNumber = trim("rc_number");
  const vatRegistered = formData.get("vat_registered") === "on";
  const vatNumber = trim("vat_number");

  // Banks: multi-select. Only persist values from the known catalog.
  const banks = formData
    .getAll("banks")
    .map(String)
    .map((b) => b.trim())
    .filter((b) => KNOWN_BANKS.has(b));

  // Invites: arrive as "email|role" strings.
  const invites = formData
    .getAll("invites")
    .map(String)
    .map((s) => {
      const [email, role] = s.split("|");
      return {
        email: (email ?? "").trim().toLowerCase(),
        role: (role ?? "ACCOUNTANT").trim().toUpperCase(),
        invited_at: new Date().toISOString(),
        status: "pending" as const,
      };
    })
    .filter(
      (i) =>
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.email) &&
        ALLOWED_INVITE_ROLES.has(i.role),
    );

  // Build the patch — only include keys we actually have, so nothing
  // overwrites bootstrap defaults with empty strings.
  const patch: Record<string, unknown> = {
    onboarded_at: new Date().toISOString(),
  };

  if (planTier) patch.plan_tier = planTier;
  if (billingCycle) patch.billing_cycle = billingCycle;

  if (tradingName) patch.name = tradingName;
  if (businessTypeRaw && ALLOWED_BUSINESS_TYPES.has(businessTypeRaw)) {
    patch.business_type = businessTypeRaw;
  }
  if (jurisdictionRaw && ALLOWED_JURISDICTIONS.has(jurisdictionRaw)) {
    patch.jurisdiction = jurisdictionRaw;
  }
  if (industry) patch.industry = industry;
  if (tin) patch.tin = tin;
  if (rcNumber) patch.rc_number = rcNumber;
  patch.vat_registered = vatRegistered;
  if (vatRegistered && vatNumber) patch.vat_number = vatNumber;

  patch.banks = banks;

  // pending_invites + onboarding metadata — preserve any existing keys.
  const { data: existing } = await supabase
    .from("workspaces")
    .select("metadata")
    .eq("id", membership.workspace_id)
    .maybeSingle();

  const meta =
    (existing?.metadata as Record<string, unknown> | null | undefined) ?? {};
  patch.metadata = {
    ...meta,
    pending_invites: invites,
    onboarding: {
      plan: planRaw,
      completed_at: new Date().toISOString(),
    },
  };

  const { error } = await supabase
    .from("workspaces")
    .update(patch)
    .eq("id", membership.workspace_id);

  if (error) {
    redirect(
      "/onboarding?error=" +
        encodeURIComponent(error.message || "Couldn't save your details."),
    );
  }

  // Welcome email — fire-and-forget. We don't await the send result
  // because Resend can take 200-800ms and we don't want to block the
  // user-visible redirect on it. Failures land in email_log + console
  // so we'll see them. Skip on custom plans (sales-handoff path).
  if (planTier !== TIERS.custom.planTier) {
    const toEmail = user.email;
    if (toEmail) {
      const firstName =
        (user.user_metadata?.full_name as string | undefined)?.split(/\s+/)[0] ??
        toEmail.split("@")[0];
      const wsName = (tradingName?.trim() || firstName) + "";
      const appUrl = `${getSiteOrigin()}/app`;
      const telegramBot = process.env.TELEGRAM_BOT_USERNAME?.trim() || undefined;
      void sendMail({
        template: "welcome",
        to: toEmail,
        subject: `Welcome to Emiday, ${firstName} — your 10 days starts now`,
        workspaceId: membership.workspace_id,
        userId: user.id,
        dedupeWithinHours: 24 * 30, // never resend a welcome
        props: {
          firstName,
          workspaceName: wsName,
          appUrl,
          telegramBot,
        },
      });
    }
  }

  // Custom plans: divert to a quote-confirmation page so we can pick up the
  // sales handoff. For now, send them to dashboard with a flag.
  const dest =
    planTier === TIERS.custom.planTier ? "/app?welcome=custom" : "/app?welcome=1";

  revalidatePath("/", "layout");
  redirect(dest);
}
