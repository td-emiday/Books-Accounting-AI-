import { createAgentsAdminClient } from "@/lib/supabase/agents";
import { addFact, toggleFact, deleteFact } from "../actions";

export const dynamic = "force-dynamic";

interface FactRow {
  id: string;
  fact: string;
  category: string | null;
  source: string | null;
  active: boolean;
  created_at: string;
}

const CATEGORIES = ["metric", "feature", "firs", "pricing", "customer", "other"] as const;

export default async function FactsPage() {
  const supa = createAgentsAdminClient();
  const { data, error } = await supa
    .from("facts")
    .select("id,fact,category,source,active,created_at")
    .order("created_at", { ascending: false });

  const facts = (data ?? []) as FactRow[];
  const active = facts.filter((f) => f.active);
  const inactive = facts.filter((f) => !f.active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Approved facts</h1>
        <p className="text-neutral-600">
          Numbers and claims the Content Agent is allowed to reference. Anything not on this list gets flagged for review.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">{error.message}</div>
      )}

      {/* Add form */}
      <form
        action={async (fd: FormData) => {
          "use server";
          await addFact({
            fact: String(fd.get("fact") ?? "").trim(),
            category: String(fd.get("category") ?? "").trim(),
          });
        }}
        className="rounded-2xl bg-white p-5 shadow-sm"
      >
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">Add a fact</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Fact</label>
            <input
              name="fact"
              required
              maxLength={500}
              placeholder="e.g. Emiday automates VAT filings for 312 Nigerian businesses."
              className="w-full rounded-lg border border-neutral-200 p-2 text-sm"
            />
          </div>
          <div className="sm:w-44">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Category</label>
            <select name="category" className="w-full rounded-lg border border-neutral-200 p-2 text-sm">
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Add fact
          </button>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Be specific. &quot;1,200 Lagos SMEs&quot; beats &quot;many SMEs&quot;. The agent quotes these verbatim.
        </p>
      </form>

      {/* Active facts */}
      <Section title={`Active (${active.length})`}>
        {active.length === 0 ? (
          <p className="text-sm text-neutral-500">No approved facts yet. The Content Agent will flag every number it wants to use.</p>
        ) : (
          <ul className="divide-y">
            {active.map((f) => (
              <FactItem key={f.id} fact={f} />
            ))}
          </ul>
        )}
      </Section>

      {/* Inactive */}
      {inactive.length > 0 && (
        <Section title={`Inactive (${inactive.length})`}>
          <ul className="divide-y opacity-60">
            {inactive.map((f) => (
              <FactItem key={f.id} fact={f} />
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">{title}</h2>
      <div className="rounded-2xl bg-white p-3 shadow-sm">{children}</div>
    </section>
  );
}

function FactItem({ fact }: { fact: FactRow }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <div className="flex-1">
        <p className="text-sm text-neutral-900">{fact.fact}</p>
        <p className="mt-1 text-xs text-neutral-500">
          {fact.category && <span className="mr-2 rounded bg-neutral-100 px-1.5 py-0.5">{fact.category}</span>}
          Added {new Date(fact.created_at).toLocaleDateString("en-GB")}
        </p>
      </div>
      <form
        action={async () => {
          "use server";
          await toggleFact(fact.id, !fact.active);
        }}
      >
        <button
          type="submit"
          className="text-xs text-neutral-600 hover:text-black hover:underline"
        >
          {fact.active ? "Deactivate" : "Reactivate"}
        </button>
      </form>
      <form
        action={async () => {
          "use server";
          await deleteFact(fact.id);
        }}
      >
        <button
          type="submit"
          className="text-xs text-red-700 hover:underline"
        >
          Delete
        </button>
      </form>
    </li>
  );
}
