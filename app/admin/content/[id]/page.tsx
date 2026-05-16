import Link from "next/link";
import { notFound } from "next/navigation";
import { createAgentsAdminClient } from "@/lib/supabase/agents";
import { approveDraft, rejectDraft, updateDraftCopy, markPostedManually } from "../actions";
import { ManualPostPanel } from "./manual-post-panel";

export const dynamic = "force-dynamic";

interface DraftRow {
  id: string;
  channel: string;
  pillar: string;
  copy: string;
  headline: string | null;
  subheadline: string | null;
  visual_url: string | null;
  visual_brief: string | null;
  hashtags: string[] | null;
  thread_parts: Array<{ order: number; text: string }> | null;
  status: string;
  scheduled_at: string;
  requires_human_review: boolean;
  review_reason: string | null;
  week_of: string;
  auto_publish: boolean;
  blog_slug: string | null;
  blog_category: string | null;
  blog_description: string | null;
}

export default async function DraftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supa = createAgentsAdminClient();
  const { data, error } = await supa
    .from("content_drafts")
    .select(
      "id,channel,pillar,copy,headline,subheadline,visual_url,visual_brief,hashtags,thread_parts,status,scheduled_at,requires_human_review,review_reason,week_of,auto_publish,blog_slug,blog_category,blog_description",
    )
    .eq("id", id)
    .single();

  if (error || !data) notFound();
  const draft = data as DraftRow;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/content?week=${draft.week_of}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Back to week
        </Link>
      </div>

      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold capitalize">
            {draft.channel} · {draft.pillar.replace("_", " ")}
          </h1>
          <p className="text-neutral-600">
            Scheduled{" "}
            {new Date(draft.scheduled_at).toLocaleString("en-GB", {
              timeZone: "Africa/Lagos",
              dateStyle: "full",
              timeStyle: "short",
            })}{" "}
            Lagos
          </p>
        </div>
        <div className="flex gap-2">
          {draft.status !== "approved" && (
            <form
              action={async () => {
                "use server";
                await approveDraft(draft.id);
              }}
            >
              <button
                type="submit"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Approve
              </button>
            </form>
          )}
          {draft.status !== "rejected" && (
            <form
              action={async () => {
                "use server";
                await rejectDraft(draft.id);
              }}
            >
              <button
                type="submit"
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50"
              >
                Reject
              </button>
            </form>
          )}
        </div>
      </div>

      {draft.requires_human_review && (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <strong>Flagged for review:</strong> {draft.review_reason || "no reason given"}
        </div>
      )}

      {!draft.auto_publish && draft.status === "approved" && (
        <ManualPostPanel
          draftId={draft.id}
          channel={draft.channel}
          copy={draft.copy}
          threadParts={draft.thread_parts}
          hashtags={draft.hashtags}
          visualUrl={draft.visual_url}
        />
      )}

      {draft.channel === "blog" && (
        <div className="rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-900 ring-1 ring-indigo-200">
          <strong>Blog post.</strong> On approval, this is committed to{" "}
          <code className="rounded bg-white/60 px-1">content/blog/{draft.blog_slug}.md</code> on{" "}
          <code className="rounded bg-white/60 px-1">td-emiday/Books-Accounting-AI-</code> and the site
          rebuilds. Category: {draft.blog_category}.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <form
          action={async (fd: FormData) => {
            "use server";
            await updateDraftCopy(draft.id, {
              copy: String(fd.get("copy") ?? ""),
              headline: (fd.get("headline") as string) || null,
              subheadline: (fd.get("subheadline") as string) || null,
              hashtags: ((fd.get("hashtags") as string) || "")
                .split(/\s+/)
                .filter((h) => h.startsWith("#")),
            });
          }}
          className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"
        >
          {(draft.channel === "instagram" || draft.channel === "email") && (
            <Field label="Headline" name="headline" defaultValue={draft.headline || ""} />
          )}
          {(draft.channel === "instagram" || draft.channel === "email") && (
            <Field
              label="Subheadline"
              name="subheadline"
              defaultValue={draft.subheadline || ""}
            />
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Copy</label>
            <textarea
              name="copy"
              defaultValue={draft.copy}
              rows={Math.max(6, draft.copy.split("\n").length + 1)}
              className="w-full rounded-lg border border-neutral-200 p-3 font-mono text-sm"
            />
          </div>
          {draft.thread_parts && draft.thread_parts.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium">Thread (read-only)</label>
              <ol className="space-y-2 rounded-lg bg-neutral-50 p-3 text-sm">
                {draft.thread_parts
                  .sort((a, b) => a.order - b.order)
                  .map((t) => (
                    <li key={t.order}>
                      <span className="mr-2 text-neutral-400">{t.order}.</span>
                      {t.text}
                    </li>
                  ))}
              </ol>
            </div>
          )}
          <Field
            label="Hashtags (space-separated)"
            name="hashtags"
            defaultValue={(draft.hashtags ?? []).join(" ")}
          />
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Save edits
          </button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Visual
            </h3>
            {draft.visual_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.visual_url} alt="" className="w-full rounded-lg" />
            ) : (
              <div className="rounded-lg bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                No visual yet
              </div>
            )}
          </div>
          {draft.visual_brief && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                Visual brief
              </h3>
              <p className="text-sm text-neutral-700">{draft.visual_brief}</p>
            </div>
          )}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Metadata
            </h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Status</dt>
                <dd>{draft.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Pillar</dt>
                <dd>{draft.pillar}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Channel</dt>
                <dd>{draft.channel}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-neutral-200 p-2 text-sm"
      />
    </div>
  );
}
