import { createAgentsAdminClient } from "@/lib/supabase/agents";

export const dynamic = "force-dynamic";

interface ArchiveRow {
  id: string;
  channel: string;
  pillar: string;
  copy: string;
  visual_url: string | null;
  platform_post_url: string | null;
  published_at: string;
  posted_manually: boolean | null;
}

export default async function ArchivePage() {
  const supa = createAgentsAdminClient();
  const { data, error } = await supa
    .from("content_archive")
    .select("id,channel,pillar,copy,visual_url,platform_post_url,published_at,posted_manually")
    .order("published_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as ArchiveRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Archive</h1>
        <p className="text-neutral-600">Last 100 published pieces. Auto-published and manually-posted are mixed.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">{error.message}</div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-neutral-500 shadow-sm">
          Nothing published yet. Once content ships, you&apos;ll see it here.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm">
              {r.visual_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.visual_url} alt="" className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-neutral-100" />
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{r.channel}</span>
                  <span className="text-xs text-neutral-500">{r.pillar}</span>
                  {r.posted_manually && (
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-800">manual</span>
                  )}
                  <span className="ml-auto text-xs text-neutral-400">
                    {new Date(r.published_at).toLocaleString("en-GB", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-neutral-800">{r.copy}</p>
                {r.platform_post_url && (
                  <a href={r.platform_post_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-indigo-600 hover:underline">
                    View post ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
