"use server";

// Demo seed action. Wipes the user's workspace clean of clients/transactions/
// invoices/documents and re-inserts the same dataset the mock UI uses, so the
// dashboard looks alive immediately. Idempotent — safe to run multiple times.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CLIENTS } from "@/lib/data/clients";
import { TRANSACTIONS } from "@/lib/data/transactions";
import { INVOICES } from "@/lib/data/invoices";
import { DOCUMENTS } from "@/lib/data/documents";

// mock category slug -> DB default category name (workspace_id IS NULL)
const CATEGORY_NAME_BY_SLUG: Record<string, string> = {
  revenue: "Service Revenue",
  cogs: "Stock / Inventory",
  payroll: "Staff Salary",
  rent: "Office Rent",
  software: "Software & Subscriptions",
  travel: "Travel & Transport",
  prof: "Professional Services",
  tax: "Tax Payment",
};

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "18 Apr" -> "2026-04-18". Returns null for "—" / unparseable.
function parseShortDate(s: string, year = 2026): string | null {
  if (!s || s === "—") return null;
  const m = s.trim().match(/^(\d{1,2})\s+([A-Za-z]{3})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const monthIx = MONTHS_SHORT.indexOf(m[2]);
  if (monthIx < 0) return null;
  const mm = String(monthIx + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// Heuristic: client name lookup keyed by lowercase first word.
function buildClientLookup(map: Map<string, string>) {
  return (mockName: string): string | null => map.get(mockName) ?? null;
}

export async function seedDemoDataAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Resolve active workspace
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const workspaceId = membership?.workspace_id;
  if (!workspaceId) throw new Error("No workspace for user");

  // Resolve default categories (workspace_id IS NULL) by name
  const { data: defaultCats } = await supabase
    .from("categories")
    .select("id, name, type")
    .is("workspace_id", null);

  const catBySlug = new Map<string, string>();
  for (const [slug, name] of Object.entries(CATEGORY_NAME_BY_SLUG)) {
    const row = (defaultCats ?? []).find((c) => c.name === name);
    if (row) catBySlug.set(slug, row.id);
  }

  // 1. Wipe existing demo data for this workspace (in dependency order).
  // documents -> invoices -> transactions -> clients
  await supabase.from("documents").delete().eq("workspace_id", workspaceId);
  await supabase.from("invoices").delete().eq("workspace_id", workspaceId);
  await supabase.from("transactions").delete().eq("workspace_id", workspaceId);
  await supabase.from("clients").delete().eq("workspace_id", workspaceId);

  // 2. Insert clients, capture name -> id map
  const clientRows = CLIENTS.map((c) => ({
    workspace_id: workspaceId,
    name: c.name,
    initial: c.name.charAt(0),
    sector: c.sector,
    location: c.sector.split("·").pop()?.trim() ?? null,
    currency: "NGN",
  }));
  const { data: insertedClients, error: clientErr } = await supabase
    .from("clients")
    .insert(clientRows)
    .select("id, name");
  if (clientErr) throw clientErr;

  const clientIdByName = new Map<string, string>();
  for (const row of insertedClients ?? []) {
    clientIdByName.set(row.name as string, row.id as string);
  }
  const lookupClient = buildClientLookup(clientIdByName);

  // 3. Insert transactions (chunked — there are ~150)
  const txRows = TRANSACTIONS.map((t) => {
    const isIncome = t.amount > 0;
    const slug = t.applied ?? t.suggest;
    const categoryId = catBySlug.get(slug) ?? null;
    return {
      workspace_id: workspaceId,
      type: isIncome ? "INCOME" : "EXPENSE",
      amount: Math.abs(t.amount),
      currency: "NGN",
      date: t.date,
      description: t.merchant,
      vendor_client: t.merchant,
      category_id: categoryId,
      category_confirmed: t.applied != null,
      source: "BANK_IMPORT",
      reference: t.ref,
      reconciled: t.applied != null,
    };
  });
  // Chunk to keep payload size manageable.
  const TX_CHUNK = 80;
  for (let i = 0; i < txRows.length; i += TX_CHUNK) {
    const chunk = txRows.slice(i, i + TX_CHUNK);
    const { error } = await supabase.from("transactions").insert(chunk);
    if (error) throw error;
  }

  // 4. Insert invoices
  const invoiceRows = INVOICES.map((inv) => {
    const issueDate = parseShortDate(inv.issued);
    const dueDate = parseShortDate(inv.due);
    return {
      workspace_id: workspaceId,
      client_id: lookupClient(inv.client),
      number: inv.id,
      issue_date: issueDate ?? "2026-04-01",
      due_date: dueDate,
      amount: inv.amount,
      currency: "NGN",
      status: inv.status,
      created_by: user.id,
    };
  });
  const { error: invErr } = await supabase.from("invoices").insert(invoiceRows);
  if (invErr) throw invErr;

  // 5. Insert documents
  const docRows = DOCUMENTS.map((d) => ({
    workspace_id: workspaceId,
    client_id: d.client ? lookupClient(d.client) : null,
    name: d.name,
    file_url: `https://demo.emiday.io/files/${encodeURIComponent(d.name)}`,
    storage_path: null,
    mime_type: d.name.endsWith(".pdf")
      ? "application/pdf"
      : d.name.endsWith(".jpg")
        ? "image/jpeg"
        : d.name.endsWith(".xlsx")
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/octet-stream",
    size_bytes: null,
    category: d.category,
    source: d.source,
    uploaded_by: user.id,
  }));
  const { error: docErr } = await supabase.from("documents").insert(docRows);
  if (docErr) throw docErr;

  revalidatePath("/app", "layout");
}

export async function clearDemoDataAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const workspaceId = membership?.workspace_id;
  if (!workspaceId) return;

  await supabase.from("documents").delete().eq("workspace_id", workspaceId);
  await supabase.from("invoices").delete().eq("workspace_id", workspaceId);
  await supabase.from("transactions").delete().eq("workspace_id", workspaceId);
  await supabase.from("clients").delete().eq("workspace_id", workspaceId);

  revalidatePath("/app", "layout");
}
