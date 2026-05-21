import Link from "next/link";
import { notFound } from "next/navigation";
import { createProductAdminClient } from "@/lib/supabase/product";
import {
  compPlan,
  deleteWorkspaceAndOwner,
  extendTrial,
  forceSignOut,
  generateTelegramPairing,
  resendWelcome,
  resetTour,
} from "./actions";
import { suspendWorkspace, unsuspendWorkspace } from "../actions";
import { PairingResultCard } from "./pairing-result";
import { DeleteWorkspaceForm } from "./delete-form";

export const dynamic = "force-dynamic";

interface WorkspaceRow {
  id: string;
  name: string;
  business_type: string;
  jurisdiction: string;
  industry: string | null;
  tin: string | null;
  rc_number: string | null;
  vat_registered: boolean | null;
  vat_number: string | null;
  banks: string[] | null;
  plan_tier: string;
  billing_cycle: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  tour_completed_at: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string | null;
  onboarded_at: string | null;
  owner_id: string;
  paystack_customer_code: string | null;
  paystack_subscription_code: string | null;
  paystack_authorization_code: string | null;
  pending_plan_change: { public_id?: string; cycle?: string; effective_at?: string } | null;
}

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string | null;
}
interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  accepted_at: string | null;
  created_at: string | null;
}
interface ChannelRow {
  id: string;
  provider: string;
  external_id: string;
  username: string | null;
  display_name: string | null;
  created_at: string | null;
}
interface TxnRow {
  id: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  vendor_client: string | null;
  source: string;
  category_id: string | null;
}
interface PaymentRow {
  id: string;
  paystack_reference: string;
  paystack_event: string;
  amount_kobo: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string | null;
}
interface EmailRow {
  id: string;
  template: string;
  to_address: string;
  status: string;
  error: string | null;
  created_at: string | null;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: "Africa/Lagos",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function daysBetween(future: string | null | undefined): number | null {
  if (!future) return null;
  return Math.ceil(
    (new Date(future).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
}
function ngn(n: number, currency = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

const STATUS_TONE: Record<string, "green" | "amber" | "red" | ""> = {
  active: "green",
  pending: "amber",
  past_due: "red",
  cancelled: "",
  non_renewing: "amber",
};

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pair_code?: string; pair_url?: string; msg?: string }>;
}) {
  const { id } = await params;
  const { pair_code, pair_url, msg } = await searchParams;
  const supa = createProductAdminClient();

  const { data: ws, error: wsErr } = await supa
    .from("workspaces")
    .select(
      "id,name,business_type,jurisdiction,industry,tin,rc_number,vat_registered,vat_number,banks,plan_tier,billing_cycle,subscription_status,trial_ends_at,current_period_end,tour_completed_at,suspended_at,suspended_reason,created_at,onboarded_at,owner_id,paystack_customer_code,paystack_subscription_code,paystack_authorization_code,pending_plan_change",
    )
    .eq("id", id)
    .maybeSingle();
  if (wsErr) throw wsErr;
  if (!ws) notFound();
  const w = ws as WorkspaceRow;

  const [
    { data: ownerData },
    { data: memberRows },
    { data: channelRows },
    { data: txnRows },
    { data: paymentRows },
    { data: emailRows },
  ] = await Promise.all([
    supa
      .from("profiles")
      .select("id,full_name,email,phone,role,created_at")
      .eq("id", w.owner_id)
      .maybeSingle(),
    supa
      .from("workspace_members")
      .select("id,user_id,role,accepted_at,created_at")
      .eq("workspace_id", id),
    supa
      .from("workspace_channels")
      .select("id,provider,external_id,username,display_name,created_at")
      .eq("workspace_id", id)
      .order("created_at", { ascending: false }),
    supa
      .from("transactions")
      .select(
        "id,type,amount,currency,date,description,vendor_client,source,category_id",
      )
      .eq("workspace_id", id)
      .order("date", { ascending: false })
      .limit(20),
    supa
      .from("payments")
      .select(
        "id,paystack_reference,paystack_event,amount_kobo,currency,status,paid_at,created_at",
      )
      .eq("workspace_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supa
      .from("email_log")
      .select("id,template,to_address,status,error,created_at")
      .eq("workspace_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const owner = ownerData as ProfileRow | null;
  const members = (memberRows ?? []) as MemberRow[];
  const channels = (channelRows ?? []) as ChannelRow[];
  const txns = (txnRows ?? []) as TxnRow[];
  const payments = (paymentRows ?? []) as PaymentRow[];
  const emails = (emailRows ?? []) as EmailRow[];

  const memberUserIds = [...new Set(members.map((m) => m.user_id))];
  const { data: memberProfilesData } = memberUserIds.length
    ? await supa
        .from("profiles")
        .select("id,email,full_name")
        .in("id", memberUserIds)
    : { data: [] as ProfileRow[] };
  const memberProfileById = new Map<string, ProfileRow>(
    (memberProfilesData ?? []).map((p) => [p.id, p as ProfileRow]),
  );

  const trialDays = daysBetween(w.trial_ends_at);
  const suspended = !!w.suspended_at;
  const subTone = w.subscription_status
    ? STATUS_TONE[w.subscription_status] ?? ""
    : "";

  return (
    <>
      <Link href="/admin/customers" className="adm-back">
        ← Customers
      </Link>

      {msg && <div className="adm-msg">{msg}</div>}
      {pair_code && pair_url && (
        <PairingResultCard code={pair_code} url={pair_url} />
      )}

      <div
        className="adm-page-head"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>{w.name}</h1>
          <p>
            {w.business_type.replace(/_/g, " ").toLowerCase()} · {w.jurisdiction}
            {w.industry ? ` · ${w.industry}` : ""}
          </p>
          {owner && (
            <p style={{ marginTop: 4 }}>
              Owner: {owner.full_name} ·{" "}
              <a
                href={`mailto:${owner.email}`}
                style={{ color: "var(--ink)" }}
              >
                {owner.email}
              </a>
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {w.subscription_status && (
            <span className={`adm-pill ${subTone}`}>{w.subscription_status}</span>
          )}
          <span className="adm-pill indigo">{w.plan_tier}</span>
          {suspended && <span className="adm-pill red">suspended</span>}
          {!w.onboarded_at && (
            <span className="adm-pill amber">onboarding incomplete</span>
          )}
        </div>
      </div>

      <div className="adm-cols">
        <div>
          <section className="adm-section">
            <h2 className="adm-section-head">Identity</h2>
            <div className="adm-fields">
              <Field label="Trading name" v={w.name} />
              <Field
                label="Business type"
                v={w.business_type.replace(/_/g, " ").toLowerCase()}
              />
              <Field label="Jurisdiction" v={w.jurisdiction} />
              <Field label="Industry" v={w.industry ?? "—"} />
              <Field label="TIN" v={w.tin ?? "—"} mono />
              <Field label="RC number" v={w.rc_number ?? "—"} mono />
              <Field
                label="VAT"
                v={
                  w.vat_registered
                    ? `Registered${w.vat_number ? " · " + w.vat_number : ""}`
                    : "Not registered"
                }
              />
              <Field
                label="Banks"
                v={w.banks && w.banks.length ? w.banks.join(", ") : "—"}
              />
              <Field label="Onboarded" v={fmtDate(w.onboarded_at)} />
              <Field label="Created" v={fmtDateTime(w.created_at)} />
            </div>
          </section>

          <section className="adm-section">
            <h2 className="adm-section-head">Subscription</h2>
            <div className="adm-fields">
              <Field label="Plan tier" v={w.plan_tier} />
              <Field label="Billing cycle" v={w.billing_cycle ?? "—"} />
              <Field label="Status" v={w.subscription_status ?? "—"} />
              <Field
                label="Current period ends"
                v={fmtDate(w.current_period_end)}
              />
              {w.pending_plan_change && (
                <Field
                  label="Pending change"
                  v={
                    `→ ${w.pending_plan_change.public_id} ${w.pending_plan_change.cycle} ` +
                    `on ${fmtDate(w.pending_plan_change.effective_at)}`
                  }
                />
              )}
              <Field
                label="Paystack customer"
                v={w.paystack_customer_code ?? "—"}
                mono
              />
              <Field
                label="Paystack subscription"
                v={w.paystack_subscription_code ?? "—"}
                mono
              />
              <Field
                label="Saved authorization"
                v={w.paystack_authorization_code ? "yes" : "no"}
              />
              {suspended && (
                <Field
                  label="Suspended"
                  v={`${fmtDateTime(w.suspended_at)} — ${w.suspended_reason ?? "no reason"}`}
                />
              )}
            </div>
          </section>

          <section className="adm-section">
            <h2 className="adm-section-head">Trial & onboarding</h2>
            <div className="adm-fields">
              <Field label="Trial ends" v={fmtDate(w.trial_ends_at)} />
              <Field
                label="Days left"
                v={
                  trialDays === null
                    ? "—"
                    : trialDays <= 0
                      ? "expired"
                      : `${trialDays} day${trialDays === 1 ? "" : "s"}`
                }
              />
              <Field
                label="Tour completed"
                v={fmtDateTime(w.tour_completed_at)}
              />
            </div>
          </section>

          <section className="adm-section">
            <h2 className="adm-section-head">
              Members ({members.length})
            </h2>
            {members.length === 0 ? (
              <div className="adm-empty">No additional members.</div>
            ) : (
              <Table
                head={["Email", "Role", "Joined"]}
                rows={members.map((m) => {
                  const p = memberProfileById.get(m.user_id);
                  return [
                    p?.email ?? "(unknown)",
                    m.role,
                    fmtDate(m.accepted_at ?? m.created_at),
                  ];
                })}
              />
            )}
          </section>

          <section className="adm-section">
            <h2 className="adm-section-head">
              Telegram / WhatsApp ({channels.length})
            </h2>
            {channels.length === 0 ? (
              <div className="adm-empty">No paired chats.</div>
            ) : (
              <Table
                head={["Provider", "Chat / handle", "Display name", "Paired"]}
                rows={channels.map((c) => [
                  c.provider,
                  c.username ? `@${c.username}` : c.external_id,
                  c.display_name ?? "—",
                  fmtDateTime(c.created_at),
                ])}
              />
            )}
          </section>

          <section className="adm-section">
            <h2 className="adm-section-head">
              Recent transactions ({txns.length})
            </h2>
            {txns.length === 0 ? (
              <div className="adm-empty">No transactions yet.</div>
            ) : (
              <Table
                head={["Date", "Vendor", "Amount", "Source"]}
                rows={txns.map((t) => [
                  t.date,
                  t.vendor_client ?? t.description,
                  (t.type === "EXPENSE" ? "−" : "+") + ngn(t.amount, t.currency),
                  t.source,
                ])}
                numCols={[2]}
              />
            )}
          </section>

          <section className="adm-section">
            <h2 className="adm-section-head">
              Payments ({payments.length})
            </h2>
            {payments.length === 0 ? (
              <div className="adm-empty">No Paystack payments yet.</div>
            ) : (
              <Table
                head={["When", "Reference", "Event", "Amount", "Status"]}
                rows={payments.map((p) => [
                  fmtDateTime(p.paid_at ?? p.created_at),
                  p.paystack_reference,
                  p.paystack_event,
                  ngn(p.amount_kobo / 100, p.currency),
                  p.status,
                ])}
                numCols={[3]}
              />
            )}
          </section>

          <section className="adm-section">
            <h2 className="adm-section-head">
              Email log ({emails.length})
            </h2>
            {emails.length === 0 ? (
              <div className="adm-empty">
                No emails sent to this workspace.
              </div>
            ) : (
              <Table
                head={["When", "Template", "To", "Status"]}
                rows={emails.map((e) => [
                  fmtDateTime(e.created_at),
                  e.template,
                  e.to_address,
                  e.status + (e.error ? ` · ${e.error.slice(0, 40)}` : ""),
                ])}
              />
            )}
          </section>
        </div>

        <aside className="adm-actions">
          <div className="adm-action-group">
            <h3>Trial &amp; billing</h3>
            <form
              action={async () => {
                "use server";
                await extendTrial(id, 7);
              }}
            >
              <button type="submit" className="adm-btn">
                Extend trial +7 days
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await extendTrial(id, 30);
              }}
            >
              <button type="submit" className="adm-btn">
                Extend trial +30 days
              </button>
            </form>
            <form
              action={async (fd: FormData) => {
                "use server";
                await extendTrial(id, Number(fd.get("days") ?? 0));
              }}
              className="adm-row"
              style={{ marginTop: 4 }}
            >
              <input
                name="days"
                type="number"
                min={1}
                max={365}
                placeholder="N"
                className="adm-input"
              />
              <button type="submit" className="adm-btn">
                Extend by N days
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await compPlan(id, 30);
              }}
              style={{ marginTop: 4 }}
            >
              <button type="submit" className="adm-btn primary">
                Comp plan (30 days)
              </button>
            </form>
          </div>

          <div className="adm-action-group">
            <h3>Product state</h3>
            <form
              action={async () => {
                "use server";
                await resetTour(id);
              }}
            >
              <button type="submit" className="adm-btn">
                Reset tour
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await resendWelcome(id);
              }}
            >
              <button type="submit" className="adm-btn">
                Resend welcome email
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                const { code, url } = await generateTelegramPairing(
                  id,
                  w.owner_id,
                );
                const sp = new URLSearchParams({
                  pair_code: code,
                  pair_url: url,
                });
                const { redirect } = await import("next/navigation");
                redirect(`/admin/customers/${id}?${sp.toString()}`);
              }}
            >
              <button type="submit" className="adm-btn">
                Generate Telegram pair code
              </button>
            </form>
          </div>

          <div className="adm-action-group">
            <h3>Access</h3>
            {suspended ? (
              <form
                action={async () => {
                  "use server";
                  await unsuspendWorkspace(id);
                }}
              >
                <button type="submit" className="adm-btn primary">
                  Unsuspend workspace
                </button>
              </form>
            ) : (
              <form
                action={async (fd: FormData) => {
                  "use server";
                  await suspendWorkspace(
                    id,
                    String(fd.get("reason") ?? ""),
                  );
                }}
              >
                <input
                  name="reason"
                  placeholder="reason (optional)"
                  className="adm-input"
                  style={{ marginBottom: 6 }}
                />
                <button type="submit" className="adm-btn">
                  Suspend workspace
                </button>
              </form>
            )}
            <form
              action={async () => {
                "use server";
                await forceSignOut(id);
              }}
            >
              <button type="submit" className="adm-btn">
                Force sign-out
              </button>
            </form>
          </div>

          <div className="adm-danger-card">
            <h3>Danger zone</h3>
            <p>
              Permanently delete this workspace and its owner user.
              Cascades through every workspace-scoped table; auth user is
              removed afterwards. Can&apos;t be undone.
            </p>
            <DeleteWorkspaceForm
              workspaceId={id}
              workspaceName={w.name}
              onDelete={async (formData: FormData) => {
                "use server";
                await deleteWorkspaceAndOwner(
                  id,
                  String(formData.get("confirm") ?? ""),
                );
                const { redirect } = await import("next/navigation");
                redirect("/admin/customers?msg=Workspace+deleted");
              }}
            />
          </div>
        </aside>
      </div>
    </>
  );
}

function Field({ label, v, mono }: { label: string; v: string; mono?: boolean }) {
  return (
    <div className="adm-field">
      <span className="adm-field-l">{label}</span>
      <span className={`adm-field-v${mono ? " mono" : ""}`}>{v}</span>
    </div>
  );
}

function Table({
  head,
  rows,
  numCols = [],
}: {
  head: string[];
  rows: (string | React.ReactNode)[][];
  numCols?: number[];
}) {
  const numSet = new Set(numCols);
  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className={numSet.has(i) ? "num" : ""}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, ri) => (
            <tr key={ri}>
              {cells.map((c, ci) => (
                <td key={ci} className={numSet.has(ci) ? "num" : ""}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
