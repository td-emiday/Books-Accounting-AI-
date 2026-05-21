// Narration → category resolver.
//
// Bank statement rows and receipt descriptions arrive as free-text
// noise: "POS PURCH/EBEANO SUPERMARKET LEKKI", "FIRS-VAT REMITTANCE
// APR 2026", "SALARY/ADAEZE O/MAY 2026". To turn each one into a
// useful book entry we need to assign a category — VAT goes against
// Tax Payment, EBEANO against Stock / Inventory, payroll against
// Staff Salary, and so on.
//
// Approach: deterministic pattern library with Nigerian-context
// vendor lists. Fast, free, predictable. Returns the category NAME
// (matching the names in the categories table). The caller resolves
// name → id once per workspace via lookupCategoryIds().
//
// This is intentionally not LLM-based for v1 — the category surface
// is small (~25 categories), and confidently mapping known vendors
// is more valuable than asking an LLM "what category is FIRS-VAT?"
// every time. Unknown narrations fall through to "Uncategorised"
// (null id) so the user can review them in /app/transactions.

import type { SupabaseClient } from "@supabase/supabase-js";

/** Category names exactly as they appear in the categories table. */
export type IncomeCategory =
  | "Client Invoice Payment"
  | "Product Sales"
  | "Service Revenue"
  | "Rental Income"
  | "Interest Income"
  | "Grant / Donation"
  | "Refund Received"
  | "Other Income";

export type ExpenseCategory =
  | "Staff Salary"
  | "Generator Fuel"
  | "Office Rent"
  | "Logistics / Delivery"
  | "Marketing & Advertising"
  | "Professional Services"
  | "Legal Fees"
  | "Accounting Fees"
  | "Bank Charges"
  | "Equipment Purchase"
  | "Software & Subscriptions"
  | "Travel & Transport"
  | "Meals & Entertainment"
  | "Utilities (Electricity, Water)"
  | "Internet & Phone"
  | "Printing & Stationery"
  | "Security"
  | "Maintenance & Repairs"
  | "Stock / Inventory"
  | "Insurance Premium"
  | "Tax Payment"
  | "Other Expense";

export type Category = IncomeCategory | ExpenseCategory;

type Rule = { name: Category; match: RegExp };

// Expense rules. Order matters — first match wins, so put the
// specific patterns above the generic catch-alls.
const EXPENSE_RULES: Rule[] = [
  // Tax — must come before "VAT" appearing in random narrations
  { name: "Tax Payment", match: /\b(firs|lirs|lasg|pencom|nsitf|paye|cit|wht|withholding|vat[- ]?remit|tax[- ]?remit|tax payment|stamp duty|witholding)\b/i },

  // Bank fees + charges
  { name: "Bank Charges", match: /\b(maint(\.|enance)? fee|cot\b|sms (?:fee|alert)|account (?:fee|maintenance)|atm (?:withdrawal|fee)|bank charges?|interest charge|levy)\b/i },

  // Payroll
  { name: "Staff Salary", match: /\b(salary|payroll|wages|stipend|hr\/pay|emolument)\b/i },

  // Rent (specifically office/shop — distinct from generator fuel "rent" of a genny if it ever appears)
  { name: "Office Rent", match: /\b(office rent|shop rent|rent[- ](?:lekki|ikoyi|vi|surulere|yaba|ikeja|ajah|lagos|abuja)|properties? ltd|landlord|leasehold|tenancy)\b/i },

  // Generator fuel (Lagos genny life)
  { name: "Generator Fuel", match: /\b(diesel|gen(?:erator|ny)? fuel|gen(?:erator|ny)? servic|ago[ -]?diesel|ap diesel|ibeto petrol)\b/i },

  // Vehicle fuel + transport
  { name: "Travel & Transport", match: /\b(uber|bolt|gokada|max\.?ng|indriver|lagride|fuel\/(?:totalenergies|oando|mobil|nnpc|ardova|conoil)|petrol\b|pms\b|trip|flight|airfare|hotel|arik|air peace|dana)\b/i },

  // Internet & telephony
  { name: "Internet & Phone", match: /\b(spectranet|smile\b|tizeti|swift networks?|9mobile|mtn(?:\s*data|\s*airtime|\s*recharge)|airtel(?:\s*data|\s*recharge)|glo\s*(?:data|recharge)|internet sub|airtime|recharge)\b/i },

  // Utilities (power & water — distinct from genny fuel)
  { name: "Utilities (Electricity, Water)", match: /\b(ikedc|aedc|ekedc|kedco|phcn|nepa|abuja electricity|eko electricity|prepaid (?:meter|unit)|water (?:bill|board)|lswma)\b/i },

  // Software & SaaS
  { name: "Software & Subscriptions", match: /\b(google\s*workspace|google\s*suite|microsoft|m365|office\s*365|slack technolog|notion labs|zoom video|github|aws\b|amazon web|figma|stripe (?:sub|pay)|saas|web sub\/|quickbooks)\b/i },

  // Marketing & ads
  { name: "Marketing & Advertising", match: /\b(facebook ads?|meta ads?|instagram ads?|google ads?|adwords|tiktok ads?|x ads?|twitter ads?|adsense|marketing|influencer|seo|sem|campaign)\b/i },

  // Logistics / delivery
  { name: "Logistics / Delivery", match: /\b(courier|logistics|dhl\b|gig\s*log|kwik\b|sendbox|fez delivery|terminal africa|shipping|freight|haulage)\b/i },

  // Professional services
  { name: "Legal Fees", match: /\b(legal|law(?:yer)?\b|barrister|sol(?:icitor)|chambers|legal advisory)\b/i },
  { name: "Accounting Fees", match: /\b(account(?:ant|ing) fees?|bookkeep|audit fee|tax consult)\b/i },
  { name: "Professional Services", match: /\b(pwc\b|kpmg|deloitte|ernst\s*&\s*young|ey\b|consult(?:ant|ancy|ing)?\b|advisory|professional services?)\b/i },

  // Insurance
  { name: "Insurance Premium", match: /\b(insurance|leadway|axa mansard|aiico|cornerstone|sovereign trust|niger insurance|premium\/ins)\b/i },

  // Security
  { name: "Security", match: /\b(security guard|guard fee|cctv|safe house|hallogen|halogen security|tigerwheel)\b/i },

  // Maintenance + repairs
  { name: "Maintenance & Repairs", match: /\b(maint(?:enance)? \/ ?repair|service\/(?:car|gen|laptop)|spare parts?|mechanic|repair work|fix|servicing)\b/i },

  // Equipment
  { name: "Equipment Purchase", match: /\b(laptop|macbook|monitor|desktop|workstation|projector|printer|chair|desk|furniture|equipment|capex)\b/i },

  // Stock / Inventory — Nigerian retailers + markets
  { name: "Stock / Inventory", match: /\b(shoprite|ebeano|sahad|spar|hubmart|prince ebeano|jendol|grocery|wholesal|mile 12|alaba|balogun market|trade fair|oyingbo|aswani|oloworo|obj farms|poultry|butchery|cold room|inventory|stock\/)\b/i },

  // Printing
  { name: "Printing & Stationery", match: /\b(printing|stationer|biros?\b|paper rim|cardboard|business cards|brochure|flyer)\b/i },

  // Meals (catering business should pick this LAST — most food spend is COGS)
  { name: "Meals & Entertainment", match: /\b(restaurant|lunch|dinner|kfc|chicken republic|foodco|terra kulture|cinema|club|bar|drinks?)\b/i },
];

// Income rules
const INCOME_RULES: Rule[] = [
  // Delivery platform settlements — usually for catering/food SMEs
  { name: "Service Revenue", match: /\b(uber eats|chowdeck|jumia food|glovo|heello)\b/i },

  // Generic payment processors → service revenue (most common for SMEs)
  { name: "Service Revenue", match: /\b(paystack(?:\/|\s)|flutterwave|stripe|interswitch|monnify|sterling alat|opay merchant)\b/i },

  // Refunds
  { name: "Refund Received", match: /\b(refund|reversal|chargeback reversal)\b/i },

  // Interest
  { name: "Interest Income", match: /\b(interest|cit interest|savings interest|account interest)\b/i },

  // Rental
  { name: "Rental Income", match: /\b(rent received|rental income|tenant payment)\b/i },

  // Grants
  { name: "Grant / Donation", match: /\b(grant\b|donation|cbn grant|tony elumelu|disbursement)\b/i },

  // Inbound NIP transfers — often invoice payments or product sales
  { name: "Client Invoice Payment", match: /\b(nip[\s\/]in\/|inward (?:transfer|wire)|invoice|inv-?\d+|payment for|catering inv|consulting inv)\b/i },

  // Product sales — keywords typical of retail/e-com inflows
  { name: "Product Sales", match: /\b(product sale|sale\/|order\s*#|customer purchase|jumia\b|konga\b|shopify)\b/i },
];

/**
 * Pick a category for a transaction based on its description + amount
 * sign. Returns `null` when no rule matches confidently — caller
 * leaves category_id null and the row stays "Uncategorised" for the
 * user to fix in /app/transactions.
 */
export function categorize(
  description: string,
  type: "INCOME" | "EXPENSE",
): Category | null {
  const text = description ?? "";
  const rules = type === "INCOME" ? INCOME_RULES : EXPENSE_RULES;
  for (const r of rules) {
    if (r.match.test(text)) return r.name;
  }
  return null;
}

/**
 * Resolve a list of category names to their UUIDs in one round-trip.
 * Categories are global (workspace_id IS NULL), so the same lookup
 * works for every workspace. Returns a Map keyed by category name.
 */
export async function lookupCategoryIds(
  client: SupabaseClient,
  names: ReadonlyArray<Category>,
): Promise<Map<Category, string>> {
  const unique = Array.from(new Set(names));
  if (unique.length === 0) return new Map();
  const { data, error } = await client
    .from("categories")
    .select("id, name")
    .is("workspace_id", null)
    .in("name", unique as string[]);
  if (error) {
    console.error("[categorize] lookupCategoryIds failed", error.message);
    return new Map();
  }
  const m = new Map<Category, string>();
  for (const row of (data ?? []) as { id: string; name: string }[]) {
    m.set(row.name as Category, row.id);
  }
  return m;
}
