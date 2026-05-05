// One-shot script to create Paystack plans and print the codes you need
// to paste into .env.local. Run once per environment (test, then prod).
//
//   PAYSTACK_SECRET_KEY=sk_test_xxx npx tsx scripts/paystack-bootstrap.ts
//
// Idempotent: it queries existing plans by exact name first and reuses
// them if they already exist, so you can re-run safely.

import { createPlan, type Plan } from "../lib/paystack";

const plans = [
  { key: "GROWTH_MONTHLY", name: "Emiday Growth — Monthly", ngn:    85_000, interval: "monthly"  as const },
  { key: "GROWTH_ANNUAL",  name: "Emiday Growth — Annual",  ngn:   850_000, interval: "annually" as const },
  { key: "PRO_MONTHLY",    name: "Emiday Pro — Monthly",    ngn:   150_000, interval: "monthly"  as const },
  { key: "PRO_ANNUAL",     name: "Emiday Pro — Annual",     ngn: 1_500_000, interval: "annually" as const },
];

async function listPlans(): Promise<Plan[]> {
  const res = await fetch("https://api.paystack.co/plan?perPage=100", {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const json = (await res.json()) as { status: boolean; data: Plan[] };
  return json.status ? json.data : [];
}

async function main() {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error("Missing PAYSTACK_SECRET_KEY in env");
    process.exit(1);
  }

  const existing = await listPlans();
  const out: Record<string, string> = {};

  for (const p of plans) {
    const found = existing.find((e) => e.name === p.name);
    if (found) {
      console.log(`✔ ${p.name}: reusing ${found.plan_code}`);
      out[p.key] = found.plan_code;
      continue;
    }
    const created = await createPlan({
      name: p.name,
      amountKobo: p.ngn * 100,
      interval: p.interval,
    });
    console.log(`✚ ${p.name}: created ${created.plan_code}`);
    out[p.key] = created.plan_code;
  }

  console.log("\nPaste these into .env.local:\n");
  for (const [k, v] of Object.entries(out)) {
    console.log(`PAYSTACK_PLAN_${k}=${v}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
