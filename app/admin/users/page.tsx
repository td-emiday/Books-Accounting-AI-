// Cross-workspace user search. Flat list of every profile with the
// workspace they belong to and that workspace's status.

import Link from "next/link";
import { createProductAdminClient } from "@/lib/supabase/product";

export const dynamic = "force-dynamic";

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string | null;
}

interface MemberRow {
  user_id: string;
  workspace_id: string;
  role: string;
  workspace:
    | { id: string; name: string; subscription_status: string | null }
    | { id: string; name: string; subscription_status: string | null }[]
    | null;
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

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

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
          <h1>Users</h1>
        </div>
        <div className="adm-section">
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Not yet wired.</p>
          <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
            Set <code>PRODUCT_SUPABASE_URL</code> and{" "}
            <code>PRODUCT_SUPABASE_SERVICE_ROLE_KEY</code> in Vercel, then
            redeploy.
          </p>
        </div>
      </>
    );
  }

  const supa = createProductAdminClient();

  let profileQuery = supa
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q && q.trim()) {
    profileQuery = profileQuery.or(
      `email.ilike.%${q}%,full_name.ilike.%${q}%`,
    );
  }
  const { data: profiles, error: pErr } = await profileQuery;
  if (pErr) {
    return (
      <div className="adm-section" style={{ color: "var(--danger)" }}>
        {pErr.message}
      </div>
    );
  }
  const profileRows = (profiles ?? []) as ProfileRow[];

  const userIds = profileRows.map((p) => p.id);
  const { data: memberships } = userIds.length
    ? await supa
        .from("workspace_members")
        .select(
          "user_id,workspace_id,role,workspace:workspaces(id,name,subscription_status)",
        )
        .in("user_id", userIds)
    : { data: [] as MemberRow[] };

  const wsByUser = new Map<
    string,
    { id: string; name: string; status: string | null; memberRole: string }
  >();
  for (const m of (memberships ?? []) as MemberRow[]) {
    const ws = Array.isArray(m.workspace) ? m.workspace[0] : m.workspace;
    if (!ws) continue;
    const existing = wsByUser.get(m.user_id);
    if (!existing || m.role === "OWNER") {
      wsByUser.set(m.user_id, {
        id: ws.id,
        name: ws.name,
        status: ws.subscription_status,
        memberRole: m.role,
      });
    }
  }

  let visible = profileRows;
  if (q && q.trim()) {
    const lq = q.toLowerCase();
    visible = profileRows.filter((p) => {
      const ws = wsByUser.get(p.id);
      return (
        p.email.toLowerCase().includes(lq) ||
        (p.full_name ?? "").toLowerCase().includes(lq) ||
        (ws?.name ?? "").toLowerCase().includes(lq)
      );
    });
  }

  return (
    <>
      <div className="adm-page-head">
        <h1>Users</h1>
        <p>
          Every profile, with their primary workspace. Newest first.
          {q ? ` — filtered by "${q}"` : ""}
        </p>
      </div>

      <form className="adm-search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by email, name, or workspace…"
        />
      </form>

      {visible.length === 0 ? (
        <div className="adm-empty">No users match.</div>
      ) : (
        <div className="adm-section" style={{ padding: 0 }}>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Workspace</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const ws = wsByUser.get(p.id);
                  const tone = ws?.status
                    ? STATUS_TONE[ws.status] ?? ""
                    : "";
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                          {p.full_name ?? p.email.split("@")[0]}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: "var(--ink-2)",
                            marginTop: 2,
                          }}
                        >
                          {p.email}
                        </div>
                      </td>
                      <td>
                        {ws ? (
                          <Link
                            href={`/admin/customers/${ws.id}`}
                            className="adm-row-link"
                          >
                            {ws.name}
                          </Link>
                        ) : (
                          <span style={{ color: "var(--ink-2)" }}>
                            no workspace
                          </span>
                        )}
                      </td>
                      <td>
                        {ws?.status ? (
                          <span className={`adm-pill ${tone}`}>
                            {ws.status}
                          </span>
                        ) : (
                          <span style={{ color: "var(--ink-2)" }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--ink-2)" }}>
                        {ws?.memberRole ?? p.role}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--ink-2)" }}>
                        {fmtDate(p.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p
        style={{
          marginTop: 16,
          fontSize: 12,
          color: "var(--ink-2)",
        }}
      >
        Showing up to 200 most-recent profiles. Use search to find older
        users.
      </p>
    </>
  );
}
