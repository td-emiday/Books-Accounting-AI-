import { listSubscribers, addSubscriber, removeSubscriber, toggleUnsubscribed } from "./actions";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const { contacts, error } = await listSubscribers();
  const active = contacts.filter((c) => !c.unsubscribed);
  const inactive = contacts.filter((c) => c.unsubscribed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Newsletter subscribers</h1>
        <p className="text-neutral-600">
          The Resend audience the weekly newsletter sends to. {contacts.length} total · {active.length} active · {inactive.length} unsubscribed.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">Not yet wired.</p>
          <p className="mt-2">
            Set <code>RESEND_API_KEY</code> and <code>RESEND_AUDIENCE_ID</code> in Vercel, then redeploy.
            Error: <code>{error}</code>
          </p>
        </div>
      )}

      <form
        action={async (fd: FormData) => {
          "use server";
          await addSubscriber({
            email: String(fd.get("email") ?? ""),
            first_name: String(fd.get("first_name") ?? ""),
            last_name: String(fd.get("last_name") ?? ""),
          });
        }}
        className="rounded-2xl bg-white p-5 shadow-sm"
      >
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">Add subscriber</h3>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-lg border border-neutral-200 p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">First name</label>
            <input
              type="text"
              name="first_name"
              className="w-full rounded-lg border border-neutral-200 p-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Last name</label>
            <input
              type="text"
              name="last_name"
              className="w-full rounded-lg border border-neutral-200 p-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Add
          </button>
        </div>
      </form>

      {active.length > 0 && (
        <Section title={`Active (${active.length})`}>
          {active.map((c) => (
            <ContactRow key={c.id} c={c} />
          ))}
        </Section>
      )}

      {inactive.length > 0 && (
        <Section title={`Unsubscribed (${inactive.length})`}>
          {inactive.map((c) => (
            <ContactRow key={c.id} c={c} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">{title}</h2>
      <ul className="divide-y rounded-2xl bg-white shadow-sm">{children}</ul>
    </section>
  );
}

function ContactRow({ c }: { c: { id: string; email: string; first_name?: string; last_name?: string; created_at: string; unsubscribed: boolean } }) {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
  return (
    <li className={`flex items-center gap-3 p-3 ${c.unsubscribed ? "opacity-60" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-neutral-900">{c.email}</p>
        {name && <p className="text-xs text-neutral-500">{name}</p>}
      </div>
      <span className="text-xs text-neutral-400">{new Date(c.created_at).toLocaleDateString("en-GB")}</span>
      <form
        action={async () => {
          "use server";
          await toggleUnsubscribed(c.id, !c.unsubscribed);
        }}
      >
        <button type="submit" className="text-xs text-neutral-600 hover:underline">
          {c.unsubscribed ? "Re-subscribe" : "Unsubscribe"}
        </button>
      </form>
      <form
        action={async () => {
          "use server";
          await removeSubscriber(c.id);
        }}
      >
        <button type="submit" className="text-xs text-red-700 hover:underline">
          Remove
        </button>
      </form>
    </li>
  );
}
