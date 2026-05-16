import Link from "next/link";
import { createAgentsAdminClient } from "@/lib/supabase/agents";
import { runContentAgent, runDesignAgent, runDistribution, runWeeklyCycle } from "./actions";

export const dynamic = "force-dynamic";

function thisWeekMonday(): string {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  if (day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

interface StatusCounts {
  draft: number;
  design_complete: number;
  approved: number;
  rejected: number;
  published: number;
  posted_manually: number;
  failed: number;
}

export default async function AdminOverviewPage() {
  const supa = createAgentsAdminClient();
  const week = thisWeekMonday();

  const [draftsRes, activeFactsRes, activeRulesRes, lastReflectionRes, lastArchiveRes] = await Promise.all([
    supa.from("content_drafts").select("status,requires_human_review,channel,auto_publish").eq("week_of", week),
    supa.from("facts").select("id", { count: "exact", head: true }).eq("active", true),
    supa.from("content_rules").select("id", { count: "exact", head: true }).eq("active", true),
    supa.from("weekly_reflections").select("week_start,summary,rules_updated,rules_added").order("week_start", { ascending: false }).limit(1).maybeSingle(),
    supa.from("content_archive").select("id,channel,copy,published_at,platform_post_url").order("published_at", { ascending: false }).limit(5),
  ]);

  const drafts = draftsRes.data ?? [];
  const counts: StatusCounts = {
    draft: 0, design_complete: 0, approved: 0, rejected: 0, published: 0, posted_manually: 0, failed: 0,
  };
  for (const d of drafts) counts[d.status as keyof StatusCounts] = (counts[d.status as keyof StatusCounts] ?? 0) + 1;
  const flaggedCount = drafts.filter((d) => d.requires_human_review).length;
  const manualPending = drafts.filter((d) => !d.auto_publish && d.status === "approved").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Content engine</h1>
        <p className="text-neutral-600">Week of {week} — Lagos time.</p>
      </div>

      {/* Status grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="Draft" value={counts.draft} tone="neutral" />
        <Stat label="Designed" value={counts.design_complete} tone="amber" />
        <Stat label="Approved" value={counts.approved} tone="green" />
        <Stat label="Published" value={counts.published} tone="indigo" />
        <Stat label="Manual ready" value={manualPending} tone="indigo" hint="X / LinkedIn waiting for you" />
        <Stat label="Flagged" value={flaggedCount} tone={flaggedCount > 0 ? "amber" : "neutral"} hint="needs review" />
        <Stat label="Failed" value={counts.failed} tone={counts.failed > 0 ? "red" : "neutral"} />
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">Run agents</h2>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <ActionButton
              action={async () => {
                "use server";
                await runWeeklyCycle();
              }}
              label="Run weekly cycle"
              tone="primary"
              hint="Learning → Content → Design"
            />
            <ActionButton
              action={async () => {
                "use server";
                await runContentAgent();
              }}
              label="Generate drafts"
            />
            <ActionButton
              action={async () => {
                "use server";
                await runContentAgent({ dryRun: true });
              }}
              label="Generate (dry run)"
            />
            <ActionButton
              action={async () => {
                "use server";
                await runDesignAgent();
              }}
              label="Render visuals"
            />
            <ActionButton
              action={async () => {
                "use server";
                await runDistribution();
              }}
              label="Publish approved"
              hint="email + blog only"
            />
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Cron runs these automatically (Mon 04:45 UTC for weekly cycle, every 30 min Mon-Sat for distribution).
            Buttons above are for manual triggers.
          </p>
        </div>
      </section>

      {/* Counters + cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Knowledge base">
          <Row label="Approved facts" value={activeFactsRes.count ?? 0} href="/admin/facts" />
          <Row label="Active content rules" value={activeRulesRes.count ?? 0} href="/admin/rules" />
          <p className="mt-3 text-xs text-neutral-500">
            Add facts so the Content Agent stops flagging numbers. Rules update themselves as performance data comes in.
          </p>
        </Card>

        <Card title="Last weekly reflection">
          {lastReflectionRes.data ? (
            <>
              <p className="text-xs text-neutral-500">Week of {lastReflectionRes.data.week_start}</p>
              <p className="mt-2 text-sm text-neutral-800 line-clamp-6">{lastReflectionRes.data.summary}</p>
              <p className="mt-2 text-xs text-neutral-500">
                {lastReflectionRes.data.rules_added} rule(s) added · {lastReflectionRes.data.rules_updated} updated
              </p>
            </>
          ) : (
            <p className="text-sm text-neutral-500">No reflections yet — first one writes after the first week of performance data is in.</p>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">Recently published</h2>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          {(lastArchiveRes.data ?? []).length === 0 ? (
            <p className="text-sm text-neutral-500">Nothing has shipped yet.</p>
          ) : (
            <ul className="divide-y">
              {(lastArchiveRes.data ?? []).map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-2">
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{a.channel}</span>
                  <span className="flex-1 truncate text-sm text-neutral-700">{a.copy.split("\n")[0].slice(0, 120)}</span>
                  <span className="text-xs text-neutral-400">{new Date(a.published_at).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos" })}</span>
                  {a.platform_post_url && (
                    <a href={a.platform_post_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">↗</a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone, hint }: { label: string; value: number; tone: "neutral" | "amber" | "green" | "indigo" | "red"; hint?: string }) {
  const toneClass = {
    neutral: "bg-white text-neutral-900",
    amber: "bg-amber-50 text-amber-900",
    green: "bg-green-50 text-green-900",
    indigo: "bg-indigo-50 text-indigo-900",
    red: "bg-red-50 text-red-900",
  }[tone];
  return (
    <div className={`rounded-2xl p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs opacity-70">{hint}</p>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <div className="flex items-center justify-between border-b py-2 last:border-b-0">
      <span className="text-sm text-neutral-700">{label}</span>
      <span className="font-mono text-sm font-semibold">{value}</span>
    </div>
  );
  return href ? <Link href={href} className="block hover:bg-neutral-50">{inner}</Link> : inner;
}

function ActionButton({ action, label, tone, hint }: { action: () => Promise<void>; label: string; tone?: "primary"; hint?: string }) {
  return (
    <form action={action}>
      <button
        type="submit"
        className={
          tone === "primary"
            ? "rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            : "rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50"
        }
        title={hint}
      >
        {label}
      </button>
    </form>
  );
}
