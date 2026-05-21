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
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
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

  // Member profiles, in one fetch
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

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Link
          href="/admin/customers"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          ← Customers
        </Link>
      </div>

      {/* Banner from action results */}
      {msg && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
          {msg}
        </div>
      )}
      {pair_code && pair_url && (
        <PairingResultCard code={pair_code} url={pair_url} />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{w.name}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {w.business_type.replace(/_/g, " ").toLowerCase()} ·{" "}
            {w.jurisdiction}
            {w.industry ? ` · ${w.industry}` : ""}
          </p>
          {owner && (
            <p className="mt-1 text-sm text-neutral-500">
              Owner: {owner.full_name} ·{" "}
              <a
                href={`mailto:${owner.email}`}
                className="text-neutral-700 underline decoration-neutral-300 underline-offset-2"
              >
                {owner.email}
              </a>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill
            label={w.subscription_status ?? "—"}
            tone={
              w.subscription_status === "active"
                ? "green"
                : w.subscription_status === "past_due"
                  ? "red"
                  : w.subscription_status === "cancelled"
                    ? "neutral"
                    : "amber"
            }
          />
          <Pill label={w.plan_tier} tone="indigo" />
          {suspended && <Pill label="suspended" tone="red" />}
          {!w.onboarded_at && <Pill label="onboarding incomplete" tone="amber" />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: data sections */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Identity">
            <Field label="Trading name" value={w.name} />
            <Field
              label="Business type"
              value={w.business_type.replace(/_/g, " ").toLowerCase()}
            />
            <Field label="Jurisdiction" value={w.jurisdiction} />
            <Field label="Industry" value={w.industry ?? "—"} />
            <Field label="TIN" value={w.tin ?? "—"} mono />
            <Field label="RC number" value={w.rc_number ?? "—"} mono />
            <Field
              label="VAT"
              value={
                w.vat_registered
                  ? `Registered${w.vat_number ? " · " + w.vat_number : ""}`
                  : "Not registered"
              }
            />
            <Field
              label="Banks"
              value={
                w.banks && w.banks.length
                  ? w.banks.join(", ")
                  : "—"
              }
            />
            <Field label="Onboarded" value={fmtDate(w.onboarded_at)} />
            <Field label="Created" value={fmtDateTime(w.created_at)} />
          </Section>

          <Section title="Subscription">
            <Field label="Plan tier" value={w.plan_tier} />
            <Field label="Billing cycle" value={w.billing_cycle ?? "—"} />
            <Field
              label="Status"
              value={w.subscription_status ?? "—"}
            />
            <Field
              label="Current period ends"
              value={fmtDate(w.current_period_end)}
            />
            {w.pending_plan_change && (
              <Field
                label="Pending change"
                value={
                  `→ ${w.pending_plan_change.public_id} ${w.pending_plan_change.cycle} ` +
                  `on ${fmtDate(w.pending_plan_change.effective_at)}`
                }
              />
            )}
            <Field
              label="Paystack customer"
              value={w.paystack_customer_code ?? "—"}
              mono
            />
            <Field
              label="Paystack subscription"
              value={w.paystack_subscription_code ?? "—"}
              mono
            />
            <Field
              label="Saved authorization"
              value={w.paystack_authorization_code ? "yes" : "no"}
            />
            {suspended && (
              <Field
                label="Suspended"
                value={`${fmtDateTime(w.suspended_at)} — ${w.suspended_reason ?? "no reason"}`}
              />
            )}
          </Section>

          <Section title="Trial & onboarding">
            <Field label="Trial ends" value={fmtDate(w.trial_ends_at)} />
            <Field
              label="Days left"
              value={
                trialDays === null
                  ? "—"
                  : trialDays <= 0
                    ? "expired"
                    : `${trialDays} day${trialDays === 1 ? "" : "s"}`
              }
            />
            <Field
              label="Tour completed"
              value={fmtDateTime(w.tour_completed_at)}
            />
          </Section>

          <Section title={`Members (${members.length})`}>
            {members.length === 0 ? (
              <Empty>No additional members.</Empty>
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
          </Section>

          <Section title={`Telegram & WhatsApp (${channels.length})`}>
            {channels.length === 0 ? (
              <Empty>No paired chats.</Empty>
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
          </Section>

          <Section title={`Recent transactions (${txns.length})`}>
            {txns.length === 0 ? (
              <Empty>No transactions yet.</Empty>
            ) : (
              <Table
                head={["Date", "Vendor", "Amount", "Source"]}
                rows={txns.map((t) => [
                  t.date,
                  t.vendor_client ?? t.description,
                  (t.type === "EXPENSE" ? "−" : "+") +
                    ngn(t.amount, t.currency),
                  t.source,
                ])}
                rightCols={[2]}
              />
            )}
          </Section>

          <Section title={`Payments (${payments.length})`}>
            {payments.length === 0 ? (
              <Empty>No Paystack payments yet.</Empty>
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
                rightCols={[3]}
              />
            )}
          </Section>

          <Section title={`Email log (${emails.length})`}>
            {emails.length === 0 ? (
              <Empty>No emails sent to this workspace.</Empty>
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
          </Section>
        </div>

        {/* Right: operational actions */}
        <aside className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Trial & billing
            </h3>
            <div className="space-y-2">
              <form
                action={async () => {
                  "use server";
                  await extendTrial(id, 7);
                }}
              >
                <button type="submit" className={btn}>
                  Extend trial +7 days
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await extendTrial(id, 30);
                }}
              >
                <button type="submit" className={btn}>
                  Extend trial +30 days
                </button>
              </form>
              <form
                action={async (fd: FormData) => {
                  "use server";
                  await extendTrial(id, Number(fd.get("days") ?? 0));
                }}
                className="flex gap-2"
              >
                <input
                  name="days"
                  type="number"
                  min={1}
                  max={365}
                  placeholder="N days"
                  className="w-20 rounded border border-neutral-200 px-2 py-1 text-xs"
                />
                <button type="submit" className={btnSmall}>
                  Extend
                </button>
              </form>

              <form
                action={async () => {
                  "use server";
                  await compPlan(id, 30);
                }}
              >
                <button type="submit" className={btnPrimary}>
                  Comp plan (30 days)
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Product state
            </h3>
            <div className="space-y-2">
              <form
                action={async () => {
                  "use server";
                  await resetTour(id);
                }}
              >
                <button type="submit" className={btn}>
                  Reset tour
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await resendWelcome(id);
                }}
              >
                <button type="submit" className={btn}>
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
                  const u = new URL(
                    `/admin/customers/${id}`,
                    "https://placeholder",
                  );
                  u.searchParams.set("pair_code", code);
                  u.searchParams.set("pair_url", url);
                  const { redirect } = await import("next/navigation");
                  redirect(u.pathname + "?" + u.searchParams.toString());
                }}
              >
                <button type="submit" className={btn}>
                  Generate Telegram pairing code
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Access
            </h3>
            <div className="space-y-2">
              {suspended ? (
                <form
                  action={async () => {
                    "use server";
                    await unsuspendWorkspace(id);
                  }}
                >
                  <button type="submit" className={btnPrimary}>
                    Unsuspend workspace
                  </button>
                </form>
              ) : (
                <form
                  action={async (fd: FormData) => {
                    "use server";
                    await suspendWorkspace(id, String(fd.get("reason") ?? ""));
                  }}
                  className="space-y-2"
                >
                  <input
                    name="reason"
                    placeholder="reason (optional)"
                    className="w-full rounded border border-neutral-200 px-2 py-1 text-xs"
                  />
                  <button type="submit" className={btn}>
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
                <button type="submit" className={btn}>
                  Force sign-out
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-700">
              Danger zone
            </h3>
            <p className="mb-3 text-xs text-red-800">
              Permanently delete this workspace and its owning user account.
              Type the workspace name to confirm. Cascades through all
              workspace data; auth user is removed afterwards. This can&apos;t
              be undone.
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
    </div>
  );
}

const btn =
  "w-full rounded border border-neutral-200 bg-white px-3 py-2 text-left text-xs font-medium text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50";
const btnPrimary =
  "w-full rounded bg-black px-3 py-2 text-left text-xs font-medium text-white hover:bg-neutral-800";
const btnSmall =
  "rounded border border-neutral-200 bg-white px-2 py-1 text-xs hover:border-neutral-300";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h2>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-baseline gap-3">
      <span className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      <span
        className={`text-neutral-900 ${
          mono ? "font-mono text-xs" : "text-sm"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded bg-neutral-50 px-3 py-4 text-center text-xs text-neutral-500">
      {children}
    </p>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "amber" | "red" | "neutral" | "indigo";
}) {
  const toneClasses: Record<typeof tone, string> = {
    green: "bg-emerald-50 text-emerald-800",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-800",
    neutral: "bg-neutral-100 text-neutral-700",
    indigo: "bg-indigo-50 text-indigo-800",
  };
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function Table({
  head,
  rows,
  rightCols = [],
}: {
  head: string[];
  rows: (string | React.ReactNode)[][];
  rightCols?: number[];
}) {
  const rightSet = new Set(rightCols);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-[10px] uppercase tracking-wide text-neutral-500">
          <tr className="border-b">
            {head.map((h, i) => (
              <th
                key={i}
                className={`px-2 py-2 ${rightSet.has(i) ? "text-right" : "text-left"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, ri) => (
            <tr key={ri} className="border-b last:border-b-0">
              {cells.map((c, ci) => (
                <td
                  key={ci}
                  className={`px-2 py-2 align-top text-neutral-800 ${rightSet.has(ci) ? "text-right font-mono" : ""}`}
                >
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
