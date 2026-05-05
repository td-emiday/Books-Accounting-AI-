// POST /api/paystack/cancel
//
// Cancels the active workspace's Paystack subscription. Paystack's
// /subscription/disable needs both the subscription_code and the
// email_token we stashed during the callback handler.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { disableSubscription } from "@/lib/paystack";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", req.url), 303);
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace:workspaces(id, paystack_subscription_code, paystack_email_token)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  type WsRow = {
    id: string;
    paystack_subscription_code: string | null;
    paystack_email_token: string | null;
  };
  const wsRaw = membership?.workspace as unknown;
  const ws: WsRow | null = Array.isArray(wsRaw)
    ? ((wsRaw[0] as WsRow) ?? null)
    : ((wsRaw as WsRow | null) ?? null);

  if (!ws?.paystack_subscription_code || !ws.paystack_email_token) {
    return NextResponse.redirect(
      new URL("/app/settings?billing=no_active_sub", req.url),
      303,
    );
  }

  try {
    await disableSubscription({
      code: ws.paystack_subscription_code,
      token: ws.paystack_email_token,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "cancel_failed";
    return NextResponse.redirect(
      new URL(`/app/settings?billing=error&reason=${encodeURIComponent(msg)}`, req.url),
      303,
    );
  }

  // Optimistic local update — webhook will confirm.
  await supabase
    .from("workspaces")
    .update({ subscription_status: "non_renewing" })
    .eq("id", ws.id);

  return NextResponse.redirect(
    new URL("/app/settings?billing=cancelled", req.url),
    303,
  );
}
