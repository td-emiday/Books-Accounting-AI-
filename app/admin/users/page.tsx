// Cross-workspace user search. Flat view of every profile (≈ every
// signed-up user) with the workspace they belong to and that
// workspace's status — so support can find someone by email and
// click straight to the deep-dive.

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
  workspace: { id: string; name: string; subscription_status: string | null } | { id: string; name: string; subscription_status: string | null }[] | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800",
  pending: "bg-amber-50 text-amber-800",
  past_due: "bg-red-50 text-red-800",
  cancelled: "bg-neutral-100 text-neutral-700",
  non_renewing: "bg-amber-50 text-amber-800",
};

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
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Users</h1>
        <div className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">Not yet wired.</p>
          <p className="mt-2">
            Set <code>PRODUCT_SUPABASE_URL</code> and{" "}
            <code>PRODUCT_SUPABASE_SERVICE_ROLE_KEY</code> in Vercel pointing
            to project <code>yegefmfggpicsmiulfkk</code>, then redeploy.
          </p>
        </div>
      </div>
    );
  }

  const supa = createProductAdminClient();

  // 1. Profiles, filtered by query if present.
  let profileQuery = supa
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q && q.trim()) {
    // Match against email + full_name. PostgREST OR syntax.
    profileQuery = profileQuery.or(
      `email.ilike.%${q}%,full_name.ilike.%${q}%`,
    );
  }
  const { data: profiles, error: pErr } = await profileQuery;
  if (pErr) {
    return (
      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
        {pErr.message}
      </div>
    );
  }
  const profileRows = (profiles ?? []) as ProfileRow[];

  // 2. Memberships → workspace context for each user.
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
    // Prefer OWNER memberships when a user has multiple
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

  // 3. Optional workspace-name filter: if q matches a workspace
  // name, keep users whose workspace matched even if their profile
  // didn't match. (Done client-side here since we already loaded
  // memberships.)
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-neutral-600">
          Every profile, with their primary workspace. Newest first.
          {q ? ` — filtered by "${q}"` : ""}
        </p>
      </div>

      <form className="rounded-2xl bg-white p-3 shadow-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by email, name, or workspace…"
          className="w-full rounded-lg border border-neutral-200 p-2 text-sm"
        />
      </form>

      {visible.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-sm text-neutral-500 shadow-sm">
          No users match.
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-neutral-500">
              <tr className="border-b">
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Workspace</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const ws = wsByUser.get(p.id);
                return (
                  <tr key={p.id} className="border-b last:border-b-0">
                    <td className="px-3 py-3">
                      <p className="font-medium text-neutral-900">
                        {p.full_name ?? p.email.split("@")[0]}
                      </p>
                      <p className="text-xs text-neutral-500">{p.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      {ws ? (
                        <Link
                          href={`/admin/customers/${ws.id}`}
                          className="text-neutral-900 hover:underline"
                        >
                          {ws.name}
                        </Link>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          no workspace
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {ws?.status ? (
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            STATUS_TONE[ws.status] ?? "bg-neutral-100"
                          }`}
                        >
                          {ws.status}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-neutral-700">
                      {ws?.memberRole ?? p.role}
                    </td>
                    <td className="px-3 py-3 text-xs text-neutral-500">
                      {fmtDate(p.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Showing up to 200 most-recent profiles. Use the search box to find
        older users.
      </p>
    </div>
  );
}
