// POST /api/upload/statement
//
// Accepts a multipart upload of a bank statement PDF, extracts the
// transactions via lib/bank-statement.ts, persists them to the
// transactions table with source='BANK_IMPORT', and returns a summary
// the UI shows to the user.
//
// Rate-limited per user (3 statements per 5 minutes) — the OCR call
// is the cost-heavy step here.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractStatementTransactions } from "@/lib/bank-statement";
import { OcrError } from "@/lib/ocr";
import { checkRateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
// Big statements + OCR can take ~10-25s on the model side; leave room.
export const maxDuration = 60;

// 10MB cap — anything bigger almost certainly isn't a single
// statement. Vercel's max request body is ~4.5MB on the free tier
// but ~50MB on Pro; the user is on Pro so 10MB is fine.
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, reason: "unauthenticated" },
      { status: 401 },
    );
  }

  const rl = checkRateLimit({
    key: `stmt:user:${user.id}`,
    max: 3,
    windowMs: 5 * 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        reason: "rate_limited",
        retryAfterMs: rl.retryAfterMs,
        message: "You can upload up to 3 statements every 5 minutes.",
      },
      { status: 429 },
    );
  }

  // Locate the active workspace.
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership?.workspace_id) {
    return NextResponse.json(
      { ok: false, reason: "no_workspace" },
      { status: 404 },
    );
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json(
      { ok: false, reason: "bad_form_data" },
      { status: 400 },
    );
  }

  if (!file) {
    return NextResponse.json(
      { ok: false, reason: "missing_file", message: "No file uploaded." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        reason: "too_large",
        message: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Max is 10MB.`,
      },
      { status: 413 },
    );
  }

  const ct = file.type || "";
  if (ct && !ct.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      {
        ok: false,
        reason: "wrong_type",
        message: "Only PDF statements are supported on this endpoint right now.",
      },
      { status: 415 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let extract;
  try {
    extract = await extractStatementTransactions(buffer);
  } catch (e) {
    const code = e instanceof OcrError ? e.code : "unknown";
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[upload/statement] extract failed", {
      workspace: membership.workspace_id,
      code,
      message,
    });
    return NextResponse.json(
      {
        ok: false,
        reason: code,
        message:
          code === "pdf_no_text"
            ? "This PDF is image-only (scanned). Export it as a text PDF from your bank portal, or send rows as CSV."
            : code === "pdf_parse_failed"
              ? "Couldn't open the PDF. It may be password-protected or corrupted."
              : code === "missing_key"
                ? "Statement parsing isn't switched on in this environment yet."
                : "Couldn't read that statement. Try a fresh PDF export from your bank.",
      },
      { status: 400 },
    );
  }

  if (extract.transactions.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        reason: "no_transactions",
        message:
          "I couldn't find any transactions in that PDF. Make sure you're uploading the statement (not a balance summary or letter).",
      },
      { status: 400 },
    );
  }

  // Bulk insert via service-role client. We map each row to the
  // transactions schema with source='BANK_IMPORT' and
  // category_confirmed=false so they show up as drafts to review.
  const admin = createAdminClient();
  const rows = extract.transactions.map((t) => ({
    workspace_id: membership.workspace_id,
    type: t.type,
    amount: t.amount,
    currency: extract.meta.currency,
    date: t.date,
    description: t.description,
    vendor_client: t.description.slice(0, 80),
    source: "BANK_IMPORT" as const,
    reference: t.reference,
    notes: extract.meta.bank
      ? `Imported from ${extract.meta.bank} statement` +
        (extract.meta.accountNumber
          ? ` (${extract.meta.accountNumber.slice(-4).padStart(4, "•")})`
          : "")
      : null,
    category_confirmed: false,
  }));

  const { error: insertErr } = await admin.from("transactions").insert(rows);
  if (insertErr) {
    console.error("[upload/statement] insert failed", {
      workspace: membership.workspace_id,
      error: insertErr.message,
    });
    return NextResponse.json(
      { ok: false, reason: "db_error", message: insertErr.message },
      { status: 500 },
    );
  }

  // Bust the /app caches so the transactions list reflects the import.
  revalidatePath("/app", "layout");
  revalidatePath("/app/transactions");

  return NextResponse.json({
    ok: true,
    imported: rows.length,
    truncated: extract.truncated,
    meta: extract.meta,
  });
}
