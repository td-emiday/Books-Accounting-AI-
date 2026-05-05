"use server";

// Server actions for the auth surface (sign-in, sign-up, sign-out).
// All three accept FormData so they can be wired straight to <form action={...}>.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TIERS, type PublicTierId } from "@/lib/tiers";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");

  if (!email || !password) {
    redirect(`/sign-in?error=${encodeURIComponent("Email and password required")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const planRaw = String(formData.get("plan") ?? "growth").toLowerCase();
  const plan: PublicTierId =
    planRaw in TIERS ? (planRaw as PublicTierId) : "growth";

  if (!email || !password || !fullName) {
    redirect(
      `/sign-up?plan=${plan}&error=${encodeURIComponent("All fields required")}`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Stash plan intent on the user record so onboarding can read it
      // back even if the redirect query string is lost.
      data: { full_name: fullName, role: "SME_OWNER", plan },
      emailRedirectTo:
        (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004") +
        `/auth/callback?next=${encodeURIComponent(`/onboarding?plan=${plan}`)}`,
    },
  });

  if (error) {
    redirect(`/sign-up?plan=${plan}&error=${encodeURIComponent(error.message)}`);
  }

  // If email confirmation is disabled (our setup), Supabase returns a live
  // session and we send the user straight into onboarding. If confirmation
  // is enabled, fall back to the "check your inbox" screen.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(`/onboarding?plan=${plan}`);
  }

  redirect(`/sign-up?plan=${plan}&check_email=1`);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
