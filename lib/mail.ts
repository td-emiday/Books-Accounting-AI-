// Single entry point for every transactional email. Renders the
// react-email template, sends via Resend, writes a row to email_log
// for dedup + debugging. Callers never touch Resend directly so we
// can swap providers without changing twenty hook sites.

import { render } from "@react-email/render";
import { Resend } from "resend";
import type { ReactElement } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

import { WelcomeEmail, type WelcomeProps } from "./emails/welcome";
import {
  TrialMidpointEmail,
  type TrialMidpointProps,
} from "./emails/trial-midpoint";
import {
  TrialEndingEmail,
  type TrialEndingProps,
} from "./emails/trial-ending";
import { ReceiptEmail, type ReceiptProps } from "./emails/receipt";
import {
  PaymentFailedEmail,
  type PaymentFailedProps,
} from "./emails/payment-failed";

export type EmailTemplate =
  | "welcome"
  | "trial_midpoint"
  | "trial_ending"
  | "receipt"
  | "payment_failed";

type SendArgs<T extends EmailTemplate> = {
  template: T;
  to: string;
  subject: string;
  workspaceId?: string | null;
  userId?: string | null;
  /** When set, skip if email_log already has a row for
   *  (workspaceId, template) within this many hours. Prevents
   *  the cron from emailing the same user twice if it runs again
   *  before the trial moves on. */
  dedupeWithinHours?: number;
  metadata?: Record<string, unknown>;
  props: PropsFor<T>;
};

type PropsFor<T extends EmailTemplate> = T extends "welcome"
  ? WelcomeProps
  : T extends "trial_midpoint"
    ? TrialMidpointProps
    : T extends "trial_ending"
      ? TrialEndingProps
      : T extends "receipt"
        ? ReceiptProps
        : T extends "payment_failed"
          ? PaymentFailedProps
          : never;

function elementFor<T extends EmailTemplate>(
  template: T,
  props: PropsFor<T>,
): ReactElement {
  switch (template) {
    case "welcome":
      return WelcomeEmail(props as WelcomeProps);
    case "trial_midpoint":
      return TrialMidpointEmail(props as TrialMidpointProps);
    case "trial_ending":
      return TrialEndingEmail(props as TrialEndingProps);
    case "receipt":
      return ReceiptEmail(props as ReceiptProps);
    case "payment_failed":
      return PaymentFailedEmail(props as PaymentFailedProps);
    default: {
      const _exhaustive: never = template;
      throw new Error(`unknown template: ${String(_exhaustive)}`);
    }
  }
}

export type SendResult = {
  ok: boolean;
  status: "sent" | "failed" | "skipped_dedupe";
  resendId?: string;
  reason?: string;
};

export async function sendMail<T extends EmailTemplate>(
  args: SendArgs<T>,
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim() || "Emiday <hello@mail.emiday.io>";
  const replyTo = process.env.MAIL_REPLY_TO?.trim() || undefined;

  const admin = createAdminClient();

  // Dedupe — only when caller asks AND we have a workspace_id.
  if (args.dedupeWithinHours && args.workspaceId) {
    const since = new Date(
      Date.now() - args.dedupeWithinHours * 60 * 60 * 1000,
    ).toISOString();
    const { data: prior } = await admin
      .from("email_log")
      .select("id")
      .eq("workspace_id", args.workspaceId)
      .eq("template", args.template)
      .eq("status", "sent")
      .gte("created_at", since)
      .limit(1)
      .maybeSingle();
    if (prior) {
      await admin.from("email_log").insert({
        workspace_id: args.workspaceId,
        user_id: args.userId ?? null,
        template: args.template,
        to_address: args.to,
        status: "skipped_dedupe",
        metadata: { dedupe_within_hours: args.dedupeWithinHours },
      });
      return { ok: true, status: "skipped_dedupe" };
    }
  }

  if (!apiKey) {
    // Soft-fail when env is missing — we log it so devs notice but
    // we don't break the user-visible flow (e.g. signup completing).
    console.error("[mail] RESEND_API_KEY missing — email skipped", {
      template: args.template,
      to: args.to,
    });
    await admin.from("email_log").insert({
      workspace_id: args.workspaceId ?? null,
      user_id: args.userId ?? null,
      template: args.template,
      to_address: args.to,
      status: "failed",
      error: "RESEND_API_KEY not set",
      metadata: args.metadata ?? {},
    });
    return { ok: false, status: "failed", reason: "missing_api_key" };
  }

  const html = await render(elementFor(args.template, args.props));
  const text = await render(elementFor(args.template, args.props), {
    plainText: true,
  });

  const client = new Resend(apiKey);
  try {
    const { data, error } = await client.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      await admin.from("email_log").insert({
        workspace_id: args.workspaceId ?? null,
        user_id: args.userId ?? null,
        template: args.template,
        to_address: args.to,
        status: "failed",
        error: String(error.message ?? error),
        metadata: args.metadata ?? {},
      });
      console.error("[mail] resend error", {
        template: args.template,
        to: args.to,
        error: error.message,
      });
      return {
        ok: false,
        status: "failed",
        reason: String(error.message ?? "resend_error"),
      };
    }

    await admin.from("email_log").insert({
      workspace_id: args.workspaceId ?? null,
      user_id: args.userId ?? null,
      template: args.template,
      to_address: args.to,
      status: "sent",
      resend_id: data?.id ?? null,
      metadata: args.metadata ?? {},
    });
    return { ok: true, status: "sent", resendId: data?.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    await admin.from("email_log").insert({
      workspace_id: args.workspaceId ?? null,
      user_id: args.userId ?? null,
      template: args.template,
      to_address: args.to,
      status: "failed",
      error: msg,
      metadata: args.metadata ?? {},
    });
    console.error("[mail] threw", {
      template: args.template,
      to: args.to,
      error: msg,
    });
    return { ok: false, status: "failed", reason: msg };
  }
}
