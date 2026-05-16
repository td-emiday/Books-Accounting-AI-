import { createAgentsAdminClient } from "@/lib/supabase/agents";
import { setRuleActive } from "../actions";

export const dynamic = "force-dynamic";

interface RuleRow {
  id: string;
  channel: string | null;
  rule_type: string;
  rule_text: string;
  confidence_score: number;
  active: boolean;
  source: string;
  updated_at: string;
}

const TYPE_COLOURS: Record<string, string> = {
  hook_style: "bg-indigo-50 text-indigo-800",
  format: "bg-blue-50 text-blue-800",
  topic: "bg-purple-50 text-purple-800",
  avoid: "bg-red-50 text-red-800",
  visual: "bg-pink-50 text-pink-800",
  timing: "bg-amber-50 text-amber-800",
};

export default async function RulesPage() {
  const supa = createAgentsAdminClient();
  const { data, error } = await supa
    .from("content_rules")
    .select("id,channel,rule_type,rule_text,confidence_score,active,source,updated_at")
    .order("active", { ascending: false })
    .order("confidence_score", { ascending: false });

  const rules = (data ?? []) as RuleRow[];

  const grouped = new Map<string, RuleRow[]>();
  for (const r of rules) {
    const key = r.channel ?? "universal";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content rules</h1>
        <p className="text-neutral-600">
          The Content Agent reads these every time it writes. The Learning Agent updates them weekly based on performance.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">{error.message}</div>
      )}

      {[...grouped.entries()].map(([key, list]) => (
        <section key={key}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            {key === "universal" ? "Universal (all channels)" : key}
          </h2>
          <ul className="space-y-2">
            {list.map((r) => (
              <li
                key={r.id}
                className={`rounded-2xl bg-white p-4 shadow-sm ${r.active ? "" : "opacity-50"}`}
              >
                <div className="flex flex-wrap items-start gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_COLOURS[r.rule_type] ?? "bg-neutral-100"}`}>
                    {r.rule_type}
                  </span>
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-mono">
                    conf {r.confidence_score.toFixed(2)}
                  </span>
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                    {r.source}
                  </span>
                  <span className="ml-auto text-xs text-neutral-400">
                    {new Date(r.updated_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-800">{r.rule_text}</p>
                <div className="mt-2 flex items-center gap-3">
                  <ConfidenceBar value={r.confidence_score} />
                  <form
                    action={async () => {
                      "use server";
                      await setRuleActive(r.id, !r.active);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs text-neutral-600 hover:text-black hover:underline"
                    >
                      {r.active ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const colour = value < 0.3 ? "bg-red-500" : value < 0.6 ? "bg-amber-500" : "bg-green-500";
  return (
    <div className="flex-1 max-w-xs">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div className={`h-full ${colour}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
