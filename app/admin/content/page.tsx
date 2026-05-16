import Link from "next/link";
import { createAgentsAdminClient } from "@/lib/supabase/agents";
import { approveAll } from "./actions";

export const dynamic = "force-dynamic";

interface DraftRow {
  id: string;
  channel: string;
  pillar: string;
  copy: string;
  headline: string | null;
  visual_url: string | null;
  status: string;
  scheduled_at: string;
  requires_human_review: boolean;
  review_reason: string | null;
  week_of: string;
}

function thisWeekMonday(): string {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  design_complete: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
  published: "bg-indigo-100 text-indigo-800",
  failed: "bg-red-200 text-red-900",
};

function formatLagos(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ContentDraftsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekOf = week || thisWeekMonday();

  const supa = createAgentsAdminClient();
  const { data, error } = await supa
    .from("content_drafts")
    .select(
      "id,channel,pillar,copy,headline,visual_url,status,scheduled_at,requires_human_review,review_reason,week_of",
    )
    .eq("week_of", weekOf)
    .order("scheduled_at", { ascending: true });

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Content drafts</h1>
        <p className="mt-2 text-red-700">Error loading drafts: {error.message}</p>
        <p className="mt-2 text-sm text-neutral-500">
          Check that AGENTS_SUPABASE_URL and AGENTS_SUPABASE_SERVICE_ROLE_KEY are set in
          this Next.js app&rsquo;s environment.
        </p>
      </div>
    );
  }

  const drafts = (data ?? []) as DraftRow[];
  const flagged = drafts.filter((d) => d.requires_human_review);
  const unflagged = drafts.filter((d) => !d.requires_human_review);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Week of {weekOf}</h1>
          <p className="text-neutral-600">
            {drafts.length} drafts · {flagged.length} flagged for review
          </p>
        </div>
        {drafts.length > 0 && (
          <form
            action={async () => {
              "use server";
              await approveAll(weekOf);
            }}
          >
            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Approve all unflagged
            </button>
          </form>
        )}
      </div>

      {flagged.length > 0 && (
        <Section title="Needs your review" tone="warning" drafts={flagged} />
      )}
      <Section title="Drafts" drafts={unflagged} />

      {drafts.length === 0 && (
        <div className="rounded-2xl bg-white p-12 text-center text-neutral-500 shadow-sm">
          No drafts for this week yet. The Content Agent runs Mondays at 06:00 Lagos.
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  drafts,
  tone,
}: {
  title: string;
  drafts: DraftRow[];
  tone?: "warning";
}) {
  if (!drafts.length) return null;
  return (
    <section>
      <h2
        className={`mb-3 text-sm font-semibold uppercase tracking-wider ${
          tone === "warning" ? "text-amber-700" : "text-neutral-500"
        }`}
      >
        {title}
      </h2>
      <ul className="space-y-3">
        {drafts.map((d) => (
          <li key={d.id}>
            <Link
              href={`/admin/content/${d.id}`}
              className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow"
            >
              {d.visual_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.visual_url}
                  alt=""
                  className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs text-neutral-400">
                  No visual
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {d.channel}
                  </span>
                  <span className="text-xs text-neutral-500">{d.pillar}</span>
                  <span className="text-xs text-neutral-400">·</span>
                  <span className="text-xs text-neutral-500">
                    {formatLagos(d.scheduled_at)}
                  </span>
                  <span
                    className={`ml-auto rounded px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLE[d.status] ?? "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-neutral-800">
                  {d.headline || d.copy}
                </p>
                {d.review_reason && (
                  <p className="mt-1 text-xs text-amber-700">⚠ {d.review_reason}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
