import { createAgentsAdminClient } from "@/lib/supabase/agents";
import { addAdmin, setAdminActive } from "./actions";

export const dynamic = "force-dynamic";

interface AdminRow {
  id: string;
  email: string;
  full_name: string | null;
  added_by: string | null;
  active: boolean;
  created_at: string;
}

export default async function AdminsPage() {
  const supa = createAgentsAdminClient();
  const { data, error } = await supa
    .from("admin_users")
    .select("id,email,full_name,added_by,active,created_at")
    .order("active", { ascending: false })
    .order("created_at", { ascending: true });

  const admins = (data ?? []) as AdminRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admins</h1>
        <p className="text-neutral-600">
          People who can sign in to ops.emiday.io. They need a Supabase auth account at this domain too —
          adding an email here just permits access; they still have to sign in with that email.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">{error.message}</div>
      )}

      <form
        action={async (fd: FormData) => {
          "use server";
          await addAdmin({
            email: String(fd.get("email") ?? ""),
            full_name: String(fd.get("full_name") ?? ""),
          });
        }}
        className="rounded-2xl bg-white p-5 shadow-sm"
      >
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">Add admin</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="teammate@emiday.io"
              className="w-full rounded-lg border border-neutral-200 p-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Name (optional)</label>
            <input
              type="text"
              name="full_name"
              placeholder="First Last"
              className="w-full rounded-lg border border-neutral-200 p-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Add admin
          </button>
        </div>
      </form>

      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Added by</th>
              <th className="px-3 py-2 text-left">Added</th>
              <th className="px-3 py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className={`border-t ${a.active ? "" : "opacity-50"}`}>
                <td className="px-3 py-2 font-mono">{a.email}</td>
                <td className="px-3 py-2">{a.full_name ?? "—"}</td>
                <td className="px-3 py-2 text-xs text-neutral-500">{a.added_by ?? "—"}</td>
                <td className="px-3 py-2 text-xs text-neutral-500">{new Date(a.created_at).toLocaleDateString("en-GB")}</td>
                <td className="px-3 py-2 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await setAdminActive(a.id, !a.active);
                    }}
                  >
                    <button
                      type="submit"
                      className={
                        a.active
                          ? "text-xs text-red-700 hover:underline"
                          : "text-xs text-green-700 hover:underline"
                      }
                    >
                      {a.active ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
        <strong>Safety net:</strong> if the agents DB is unreachable, <code>td@emiday.io</code> can
        still sign in (hardcoded fallback in <code>lib/admin-auth.ts</code>). Edit that file if you
        ever change the bootstrap account.
      </div>
    </div>
  );
}
