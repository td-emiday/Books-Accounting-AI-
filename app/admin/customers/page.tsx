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

const STATUS_TONE: Record<string, "green" | "amber" | "red" | ""> = {
  active: "green",
  pending: "amber",
  past_due: "red",
  cancelled: "",
  non_renewing: "amber",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: "Africa/Lagos",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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
      <>
        <div className="adm-page-head">
          <h1>Customers</h1>
        </div>
        <div className="adm-section">
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Not yet wired.</p>
          <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
            Set <code>PRODUCT_SUPABASE_URL</code> and{" "}
            <code>PRODUCT_SUPABASE_SERVICE_ROLE_KEY</code> in Vercel pointing
            to project <code>yegefmfggpicsmiulfkk</code> (EMIDAY ACC), then
            redeploy.
          </p>
        </div>
      </>
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

  if (status && status !== "all")
    query = query.eq("subscription_status", status);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data: workspaces, error: wErr } = await query;
  if (wErr) {
    return (
      <div className="adm-section" style={{ color: "var(--danger)" }}>
        {wErr.message}
      </div>
    );
  }

  const rows = (workspaces ?? []) as WorkspaceRow[];
  const ownerIds = [...new Set(rows.map((r) => r.owner_id))];
  const { data: profiles } = ownerIds.length
    ? await supa
        .from("profiles")
        .select("id,full_name,email,phone,role,created_at")
        .in("id", ownerIds)
    : { data: [] as ProfileRow[] };
  const profileById = new Map<string, ProfileRow>(
    (profiles ?? []).map((p) => [p.id, p as ProfileRow]),
  );

  const counts = {
    total: rows.length,
    active: rows.filter((r) => r.subscription_status === "active").length,
    pending: rows.filter((r) => r.subscription_status === "pending").length,
    past_due: rows.filter((r) => r.subscription_status === "past_due").length,
    suspended: rows.filter((r) => r.suspended_at).length,
  };

  return (
    <>
      <div className="adm-page-head">
        <h1>Customers</h1>
        <p>Workspaces in the Emiday product DB. Newest first.</p>
      </div>

      <div className="adm-stats">
        <Stat
          label="All"
          n={counts.total}
          active={!status || status === "all"}
          href="/admin/customers"
        />
        <Stat
          label="Active"
          n={counts.active}
          tone="green"
          active={status === "active"}
          href="/admin/customers?status=active"
        />
        <Stat
          label="Pending"
          n={counts.pending}
          tone="amber"
          active={status === "pending"}
          href="/admin/customers?status=pending"
        />
        <Stat
          label="Past due"
          n={counts.past_due}
          tone="red"
          active={status === "past_due"}
          href="/admin/customers?status=past_due"
        />
        <Stat label="Suspended" n={counts.suspended} tone="red" />
      </div>

      <form className="adm-search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by workspace name…"
        />
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      {rows.length === 0 ? (
        <div className="adm-empty">No customers match.</div>
      ) : (
        <div className="adm-section" style={{ padding: 0 }}>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Workspace</th>
                  <th>Owner</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Trial / Renewal</th>
                  <th>Joined</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const owner = profileById.get(r.owner_id);
                  const suspended = !!r.suspended_at;
                  const tone = r.subscription_status
                    ? STATUS_TONE[r.subscription_status] ?? ""
                    : "";
                  return (
                    <tr key={r.id}>
                      <td>
                        <Link
                          href={`/admin/customers/${r.id}`}
                          className="adm-row-link"
                          style={{ display: "block" }}
                        >
                          <div
                            style={{ fontWeight: 600, color: "var(--ink)" }}
                          >
                            {r.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: "var(--ink-2)",
                              marginTop: 2,
                            }}
                          >
                            {r.jurisdiction} ·{" "}
                            {r.business_type.replace(/_/g, " ").toLowerCase()}
                            {r.industry ? ` · ${r.industry}` : ""}
                          </div>
                        </Link>
                      </td>
                      <td>
                        {owner ? (
                          <>
                            <div style={{ color: "var(--ink)" }}>
                              {owner.full_name}
                            </div>
                            <div
                              style={{
                                fontSize: 11.5,
                                color: "var(--ink-2)",
                                marginTop: 2,
                              }}
                            >
                              {owner.email}
                            </div>
                          </>
                        ) : (
                          <span style={{ color: "var(--ink-2)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className="adm-pill indigo">{r.plan_tier}</span>
                      </td>
                      <td>
                        {r.subscription_status && (
                          <span className={`adm-pill ${tone}`}>
                            {r.subscription_status}
                          </span>
                        )}
                        {suspended && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 11.5,
                              color: "var(--danger)",
                            }}
                          >
                            suspended: {r.suspended_reason ?? "no reason"}
                          </div>
                        )}
                      </td>
                      <td
                        style={{ fontSize: 12, color: "var(--ink-2)" }}
                      >
                        {r.subscription_status === "active" &&
                        r.current_period_end
                          ? `renews ${fmtDate(r.current_period_end)}`
                          : r.trial_ends_at
                            ? `trial ends ${fmtDate(r.trial_ends_at)}`
                            : "—"}
                      </td>
                      <td
                        style={{ fontSize: 12, color: "var(--ink-2)" }}
                      >
                        {fmtDate(r.created_at)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {suspended ? (
                          <form
                            action={async () => {
                              "use server";
                              await unsuspendWorkspace(r.id);
                            }}
                          >
                            <button
                              type="submit"
                              style={{
                                background: "transparent",
                                border: 0,
                                color: "var(--positive-deep)",
                                fontFamily: "inherit",
                                fontSize: 12.5,
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                            >
                              Unsuspend
                            </button>
                          </form>
                        ) : (
                          <Link
                            href={`/admin/customers/${r.id}`}
                            style={{
                              fontSize: 12.5,
                              color: "var(--ink-2)",
                              textDecoration: "underline",
                            }}
                          >
                            Manage
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({
  label,
  n,
  tone,
  active,
  href,
}: {
  label: string;
  n: number;
  tone?: "green" | "amber" | "red" | "indigo";
  active?: boolean;
  href?: string;
}) {
  const cls = `adm-stat ${tone ?? ""} ${active ? "on" : ""}`.trim();
  const inner = (
    <>
      <div className="adm-stat-l">{label}</div>
      <div className="adm-stat-n">{n}</div>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
