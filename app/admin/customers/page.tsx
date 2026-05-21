import Link from "next/link";
import { createProductAdminClient } from "@/lib/supabase/product";
import { suspendWorkspace, unsuspendWorkspace } from "./actions";

export const dynamic = "force-dynamic";

interface WorkspaceRow {
  id: string;
  name: string;
  business_type: string;
  jurisdiction: string;
  industry: string | null;
  plan_tier: string;
  subscription_status: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string | null;
  onboarded_at: string | null;
  owner_id: string;
}

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-50 text-green-800",
  pending: "bg-amber-50 text-amber-800",
  past_due: "bg-red-50 text-red-800",
  cancelled: "bg-neutral-100 text-neutral-700",
  non_renewing: "bg-amber-50 text-amber-800",
};

const PLAN_STYLE: Record<string, string> = {
  STARTER: "bg-neutral-100 text-neutral-700",
  GROWTH: "bg-indigo-50 text-indigo-800",
  BUSINESS: "bg-indigo-100 text-indigo-900",
  PRO: "bg-purple-100 text-purple-900",
  FIRM: "bg-pink-100 text-pink-900",
  ENTERPRISE: "bg-black text-white",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  let envOk = true;
  try {
    createProductAdminClient();
  } catch {
    envOk = false;
  }

  if (!envOk) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Customers</h1>
        <div className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">Not yet wired.</p>
          <p className="mt-2">
            Set <code>PRODUCT_SUPABASE_URL</code> and <code>PRODUCT_SUPABASE_SERVICE_ROLE_KEY</code> in
            Vercel pointing to project <code>yegefmfggpicsmiulfkk</code> (EMIDAY ACC), then redeploy.
          </p>
        </div>
      </div>
    );
  }

  const supa = createProductAdminClient();

  let query = supa
    .from("workspaces")
    .select(
      "id,name,business_type,jurisdiction,industry,plan_tier,subscription_status,trial_ends_at,current_period_end,suspended_at,suspended_reason,created_at,onboarded_at,owner_id",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && status !== "all") query = query.eq("subscription_status", status);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data: workspaces, error: wErr } = await query;
  if (wErr) {
    return <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">{wErr.message}</div>;
  }

  const rows = (workspaces ?? []) as WorkspaceRow[];
  const ownerIds = [...new Set(rows.map((r) => r.owner_id))];
  const { data: profiles } = ownerIds.length
    ? await supa.from("profiles").select("id,full_name,email,phone,role,created_at").in("id", ownerIds)
    : { data: [] as ProfileRow[] };
  const profileById = new Map<string, ProfileRow>((profiles ?? []).map((p) => [p.id, p as ProfileRow]));

  const counts = {
    total: rows.length,
    active: rows.filter((r) => r.subscription_status === "active").length,
    pending: rows.filter((r) => r.subscription_status === "pending").length,
    past_due: rows.filter((r) => r.subscription_status === "past_due").length,
    suspended: rows.filter((r) => r.suspended_at).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="text-neutral-600">Workspaces in the Emiday product DB. Newest first.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="All" value={counts.total} active={!status || status === "all"} href="/admin/customers" />
        <Stat label="Active" value={counts.active} tone="green" active={status === "active"} href="/admin/customers?status=active" />
        <Stat label="Pending" value={counts.pending} tone="amber" active={status === "pending"} href="/admin/customers?status=pending" />
        <Stat label="Past due" value={counts.past_due} tone="red" active={status === "past_due"} href="/admin/customers?status=past_due" />
        <Stat label="Suspended" value={counts.suspended} tone="red" />
      </div>

      {/* Search */}
      <form className="rounded-2xl bg-white p-3 shadow-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by workspace name…"
          className="w-full rounded-lg border border-neutral-200 p-2 text-sm"
        />
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-sm text-neutral-500 shadow-sm">
          No customers match.
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-neutral-500">
              <tr className="border-b">
                <th className="px-3 py-2 text-left">Workspace</th>
                <th className="px-3 py-2 text-left">Owner</th>
                <th className="px-3 py-2 text-left">Plan</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Trial / Renewal</th>
                <th className="px-3 py-2 text-left">Joined</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const owner = profileById.get(r.owner_id);
                const suspended = !!r.suspended_at;
                return (
                  <tr key={r.id} className={`border-b last:border-b-0 ${suspended ? "bg-red-50/30" : ""}`}>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/customers/${r.id}`}
                        className="block hover:underline"
                      >
                        <p className="font-medium text-neutral-900">{r.name}</p>
                        <p className="text-xs text-neutral-500">
                          {r.jurisdiction} ·{" "}
                          {r.business_type.replace("_", " ").toLowerCase()}
                          {r.industry ? ` · ${r.industry}` : ""}
                        </p>
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      {owner ? (
                        <>
                          <p className="text-neutral-900">{owner.full_name}</p>
                          <p className="text-xs text-neutral-500">{owner.email}</p>
                        </>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${PLAN_STYLE[r.plan_tier] ?? "bg-neutral-100"}`}>
                        {r.plan_tier}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {r.subscription_status && (
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.subscription_status] ?? "bg-neutral-100"}`}>
                          {r.subscription_status}
                        </span>
                      )}
                      {suspended && (
                        <p className="mt-1 text-xs text-red-700">suspended: {r.suspended_reason ?? "no reason"}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-neutral-600">
                      {r.subscription_status === "active" && r.current_period_end
                        ? `renews ${formatDate(r.current_period_end)}`
                        : r.trial_ends_at
                        ? `trial ends ${formatDate(r.trial_ends_at)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-xs text-neutral-500">
                      {r.created_at ? formatDate(r.created_at) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {suspended ? (
                        <form
                          action={async () => {
                            "use server";
                            await unsuspendWorkspace(r.id);
                          }}
                        >
                          <button type="submit" className="text-xs text-green-700 hover:underline">
                            Unsuspend
                          </button>
                        </form>
                      ) : (
                        <form
                          action={async (fd: FormData) => {
                            "use server";
                            await suspendWorkspace(r.id, String(fd.get("reason") ?? ""));
                          }}
                          className="flex items-center gap-1"
                        >
                          <input
                            name="reason"
                            placeholder="reason"
                            className="rounded border border-neutral-200 px-1 py-0.5 text-xs"
                          />
                          <button type="submit" className="text-xs text-red-700 hover:underline">
                            Suspend
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
  active,
  href,
}: {
  label: string;
  value: number;
  tone?: "neutral" | "green" | "amber" | "red";
  active?: boolean;
  href?: string;
}) {
  const toneClass = {
    neutral: "bg-white text-neutral-900",
    green: "bg-green-50 text-green-900",
    amber: "bg-amber-50 text-amber-900",
    red: "bg-red-50 text-red-900",
  }[tone];
  const inner = (
    <div className={`rounded-2xl p-3 shadow-sm ring-2 ${toneClass} ${active ? "ring-black" : "ring-transparent"}`}>
      <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", day: "2-digit", month: "short", year: "numeric" });
}
