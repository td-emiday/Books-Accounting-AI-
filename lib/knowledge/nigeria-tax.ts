/**
 * Comprehensive Nigerian Tax & FIRS Regulation Knowledge Base
 * Last updated: March 2026
 *
 * Sources: FIRS circulars, Finance Acts 2019–2024, CITA, PITA, VATA, CGTA,
 * Stamp Duties Act, PAYE regulations, WHT regulations, and TIN Registration guidelines.
 *
 * This is injected into the AI assistant's system prompt so it can answer
 * Nigerian tax questions with authority and accuracy.
 */

// ─────────────────────────────────────────────────────────────
// VAT — Value Added Tax
// ─────────────────────────────────────────────────────────────
export const NIGERIA_VAT = `
## VALUE ADDED TAX (VAT) — Nigeria

### Legal Basis
- Value Added Tax Act (VATA) Cap V1 LFN 2004, as amended by Finance Acts 2019, 2020, 2021, 2023.
- Administered by the Federal Inland Revenue Service (FIRS).

### Current Rate
- **7.5%** on the value of all taxable goods and services (effective 1 February 2020, increased from 5%).

### Who Must Register
- Every company or business that supplies taxable goods or services in Nigeria.
- Non-resident companies making taxable supplies to Nigerian customers must register or appoint a VAT agent.
- **Threshold**: Companies with annual turnover of ₦25 million or less are exempt from VAT collection (Finance Act 2019, Section 15). They are still required to register but do not charge or remit VAT.

### VAT-Exempt Goods & Services (Schedule 1 & 2 of VATA)
**Exempt Goods:**
- Basic food items: rice, beans, yam, cassava, fruits, vegetables, meat, fish, poultry, milk, bread
- Baby products: baby food, baby clothing, diapers
- Medical & pharmaceutical products, including medical equipment
- Books, newspapers, magazines, educational materials
- Agricultural equipment and produce (unprocessed)
- Fertilisers, seeds, and seedlings
- Commercial vehicles (buses with 10+ seats)
- Plant & machinery for use in Export Processing Zones
- Locally manufactured sanitary towels/pads

**Exempt Services:**
- Medical services
- Services rendered by Community Banks, Mortgage Institutions, and Microfinance Banks
- All exported services (zero-rated)
- Plays and performances by educational institutions
- Diplomatic and consular services
- Services of religious organisations (non-commercial)

### Input VAT vs Output VAT
- **Output VAT**: VAT collected on sales/supplies. This is what you charge customers.
- **Input VAT**: VAT paid on purchases/expenses used for business. This can be claimed as a credit.
- **Net VAT payable** = Output VAT − Input VAT. If negative, it becomes a VAT credit carried forward.

### Filing & Payment
- **Monthly filing** by the 21st day of the month following the transaction month.
- File using FIRS TaxProMax portal (https://taxpromax.firs.gov.ng).
- Payment via designated banks or online through the FIRS payment platform.
- Returns must be filed even if no transactions occurred in that period (nil return).

### Penalties
- **Late filing**: ₦50,000 for the first month, ₦25,000 for each subsequent month.
- **Late payment**: Interest at the prevailing Central Bank of Nigeria (CBN) Monetary Policy Rate (MPR) + a spread (typically 10% above the commercial rate per annum, i.e., roughly 21-25% currently).
- **Failure to register**: ₦10,000 for each month of default.
- **Failure to charge VAT**: 150% of the uncollected tax + 5% per annum interest.
- **Issuing fake VAT invoice**: ₦50,000 or 6 months imprisonment.

### Key Rules
- VAT is charged on the invoice at the point of supply.
- Input VAT is only claimable on goods/services directly related to taxable supplies.
- Input VAT on overhead and general admin expenses can be apportioned (partial exemption method) if a business makes both taxable and exempt supplies.
- Reverse charge mechanism: Nigerian recipients of imported services must self-account for and remit VAT.
- E-commerce / digital services: Non-resident digital companies making ₦25M+ from Nigeria must register for VAT (Finance Act 2023).
`;

// ─────────────────────────────────────────────────────────────
// WHT — Withholding Tax
// ─────────────────────────────────────────────────────────────
export const NIGERIA_WHT = `
## WITHHOLDING TAX (WHT) — Nigeria

### Legal Basis
- Companies Income Tax Act (CITA) Section 78-83
- Personal Income Tax Act (PITA) Section 69-72
- WHT Regulations (various schedules)

### What is WHT?
An advance payment of income tax deducted at source by the payer. It is NOT a separate tax — it is a credit against the recipient's final income tax liability.

### WHT Rates for Companies (CITA)

| Payment Type | Rate |
|---|---|
| Dividends, interest, rent | 10% |
| Royalties | 10% |
| Commission, consultancy, technical & management fees | 10% |
| Construction & building | 5% |
| Contracts of supply (goods) | 5% |
| Director's fees | 10% |
| All types of contracts to non-residents | 10% |
| Hire of equipment | 10% |

### WHT Rates for Individuals (PITA)

| Payment Type | Rate |
|---|---|
| Dividends, interest, rent | 10% |
| Royalties | 5% |
| Commission, consultancy, technical fees | 5% |
| Construction & building | 5% |
| Contracts of supply (goods) | 5% |
| Director's fees | 10% |
| Hire of equipment | 5% |

### Filing & Remittance
- WHT must be remitted to FIRS within **21 days** from the date of deduction (for companies).
- For individuals, remittance is to the relevant State Internal Revenue Service (SIRS) within 30 days.
- File using FIRS TaxProMax portal with WHT credit notes.

### WHT Credit Notes
- The payer must issue a WHT credit note to the payee.
- The payee uses this credit note to offset against their income tax liability.
- Credit notes are filed alongside the annual tax return.

### Exemptions
- Transactions below ₦10,000 for individuals (PITA).
- Dividends paid out of petroleum profits (subject to Petroleum Profits Tax instead).
- Interest on government securities (treasury bills, FGN bonds) — exempt from WHT.
- Interest on foreign loans with a moratorium period of not less than 2 years (exempt under CITA S.11(2)).

### Penalties
- **Late remittance**: 10% penalty + interest at CBN MPR rate.
- **Failure to deduct**: The payer becomes liable for the full WHT amount + penalties.

### Key Rules
- WHT applies to both resident and non-resident recipients.
- For non-residents, WHT may be the final tax (no further assessment in Nigeria).
- Double Taxation Agreements (DTAs) may reduce WHT rates — Nigeria has DTAs with UK, Canada, China, France, South Africa, and others.
`;

// ─────────────────────────────────────────────────────────────
// PAYE — Pay As You Earn (Personal Income Tax)
// ─────────────────────────────────────────────────────────────
export const NIGERIA_PAYE = `
## PAYE — Pay As You Earn (Employment Income Tax) — Nigeria

### Legal Basis
- Personal Income Tax Act (PITA) Cap P8 LFN 2004, as amended.
- Personal Income Tax (Amendment) Act 2011.
- Finance Act 2019, 2020 amendments.

### Who Pays
- All employees in Nigeria (residents and non-residents earning Nigerian-source income).
- The employer deducts PAYE from salary and remits to the relevant State Internal Revenue Service (SIRS).

### Consolidated Relief Allowance (CRA) — Finance Act 2020
Before applying the graduated rates, every employee gets a CRA:
- **₦200,000** or **1% of gross income** (whichever is higher) + **20% of gross income**.
- Example: If gross annual income = ₦5,000,000:
  - 1% of gross = ₦50,000 → use ₦200,000 (higher)
  - 20% of gross = ₦1,000,000
  - Total CRA = ₦1,200,000
  - Taxable income = ₦5,000,000 − ₦1,200,000 = ₦3,800,000

### Graduated Tax Rates (on taxable income after CRA)

| Taxable Income Band | Rate |
|---|---|
| First ₦300,000 | 7% |
| Next ₦300,000 (₦300,001 – ₦600,000) | 11% |
| Next ₦500,000 (₦600,001 – ₦1,100,000) | 15% |
| Next ₦500,000 (₦1,100,001 – ₦1,600,000) | 19% |
| Next ₦1,600,000 (₦1,600,001 – ₦3,200,000) | 21% |
| Above ₦3,200,000 | 24% |

### Minimum Tax
- If the calculated tax is less than **1% of gross income**, the employee pays 1% of gross income as minimum tax (Finance Act 2019).
- **Exception**: Employees earning minimum wage (₦30,000/month or ₦360,000/year) or less are exempt from minimum tax.

### Other Deductions (before PAYE calculation)
- **Pension (CPS)**: Employee contributes 8% of basic + housing + transport. Employer contributes 10%. Employee's contribution is tax-deductible.
- **National Housing Fund (NHF)**: 2.5% of basic salary. Tax-deductible.
- **National Health Insurance (NHIS)**: Employee's contribution is tax-deductible.
- **Life assurance premium**: Tax-deductible (up to a limit).
- **Gratuity**: Tax-exempt up to a defined limit on retirement.

### Filing & Remittance
- Employer deducts monthly and remits to the SIRS by the **10th day** of the following month.
- Annual PAYE returns (Form H1) must be filed by **31 January** of the following year.
- Employees can also file individual returns if they have other income sources.

### Penalties
- **Late remittance**: 10% penalty + interest at the prevailing MPR rate.
- **Failure to deduct**: Employer becomes liable for the full PAYE amount.
- **Late filing of annual returns**: ₦500,000 for companies, ₦50,000 for individuals + ₦25,000/month of continued default.

### Key Rules
- PAYE is the responsibility of the employer to deduct and remit.
- Benefits-in-kind (cars, housing, etc.) are taxable and must be included in gross emoluments.
- Overtime, bonuses, and 13th month salary are all taxable.
- Severance/redundancy pay: First ₦10M is tax-exempt; excess is taxed at 10%.
- Non-residents are only taxed on Nigerian-source employment income.
`;

// ─────────────────────────────────────────────────────────────
// CIT — Companies Income Tax
// ─────────────────────────────────────────────────────────────
export const NIGERIA_CIT = `
## COMPANIES INCOME TAX (CIT) — Nigeria

### Legal Basis
- Companies Income Tax Act (CITA) Cap C21 LFN 2004, as amended by Finance Acts 2019–2023.

### Tax Rates (Finance Act 2019 onwards)

| Company Size | Turnover | CIT Rate |
|---|---|---|
| Small | ≤ ₦25 million | **0%** (exempt) |
| Medium | > ₦25M to ₦100M | **20%** |
| Large | > ₦100 million | **30%** |

### Tertiary Education Tax (TET)
- 2.5% of assessable profit (renamed from Education Tax by Finance Act 2023).
- Applies to all companies registered in Nigeria (except small companies).

### Information Technology Development Levy
- 1% of profit before tax for companies with turnover of ₦100M+.
- Applies to: telecommunications, banking, insurance, pension management, ICT companies.

### Filing Requirements
- Annual returns filed within **6 months** of the company's financial year-end.
- Self-assessment filing via FIRS TaxProMax.
- Provisional tax (pay-as-you-earn for companies): Payable in instalments (every 3 months).
- New companies: Exempt from CIT in first year of assessment; 2nd year taxed on a deemed basis.

### Key Deductions
- All expenses wholly, exclusively, necessarily, and reasonably incurred for business purposes.
- Capital allowances (depreciation for tax): Buildings (15%), Plant & Machinery (25-95%), Motor Vehicles (25%), Furniture (20%), IT Equipment (25%).
- **Investment allowance**: Additional 10% of qualifying capital expenditure in the year of purchase.
- Donations to approved funds/institutions (up to 10% of assessable profits).
- Research & development expenditure (up to 120% — super deduction for R&D).
- Pioneer status incentive: Tax holiday of 3–5 years for qualifying industries.

### Penalties
- **Late filing**: ₦50,000 for first month + ₦25,000/month of continued default.
- **Late payment**: 10% penalty + interest at CBN rate.
- **Failure to file**: Additional penalty of the amount of tax due.
- **Tax evasion**: Fine of ₦200,000 or imprisonment up to 6 months.

### Transfer Pricing
- Arm's length principle applies to all related-party transactions.
- Transfer pricing documentation required for all companies with related-party transactions exceeding ₦300M.
- Country-by-Country Reporting (CbCR) for multinational groups with consolidated revenue ≥ €750M.
`;

// ─────────────────────────────────────────────────────────────
// Stamp Duty
// ─────────────────────────────────────────────────────────────
export const NIGERIA_STAMP_DUTY = `
## STAMP DUTIES — Nigeria

### Legal Basis
- Stamp Duties Act Cap S8 LFN 2004, as amended by Finance Acts 2019–2023.

### Key Rates
| Instrument | Duty |
|---|---|
| Receipts (≥ ₦10,000) | ₦50 flat |
| Electronic transfers/deposits (≥ ₦10,000) | ₦50 flat |
| Tenancy/Lease agreements | 0.78% of annual rent |
| Sale/transfer of shares | Buyer: 0.75%, Seller: 0.075% |
| Debentures, bonds, mortgages | Various (0.375%–1.5%) |
| Insurance policies | ₦1–₦25 per ₦1,000 |
| Power of attorney | ₦1,500 |
| Promissory notes | Various |

### Electronic Stamp Duty
- Since 2020, stamp duties on electronic transactions (bank transfers, POS, etc.) of ₦10,000 and above are collected at ₦50 per transaction by banks/financial institutions.
- FIRS is responsible for duties on instruments between companies; State governments handle individual instruments.

### Key Rules
- An unstamped or insufficiently stamped document is **inadmissible as evidence** in Nigerian courts.
- Stamp duty is a one-time charge at the time of document execution.
- Exemptions: Government instruments, certain cooperative society transactions.
`;

// ─────────────────────────────────────────────────────────────
// Capital Gains Tax
// ─────────────────────────────────────────────────────────────
export const NIGERIA_CGT = `
## CAPITAL GAINS TAX (CGT) — Nigeria

### Legal Basis
- Capital Gains Tax Act (CGTA) Cap C1 LFN 2004, as amended by Finance Act 2023.

### Rate
- **10%** on gains from disposal of chargeable assets.

### Chargeable Assets
- Land, buildings, options, shares/securities, goodwill, copyrights, patents, plant/machinery (if sold above written-down value).

### Exemptions (Finance Act 2023)
- Gains from disposal of shares/stocks traded on the Nigerian Stock Exchange — **fully exempt** (to encourage capital market participation).
- Gains from disposal of a principal private residence (re-invested in another residence within 1 year).
- Bonds, debentures, and other government securities.
- Life insurance policies.
- Compensation for personal injury or death.
- Gains below ₦100,000 per annum (de minimis threshold).

### Filing
- Included in the annual tax return.
- Self-assessment basis.
`;

// ─────────────────────────────────────────────────────────────
// FIRS Filing Calendar
// ─────────────────────────────────────────────────────────────
export const NIGERIA_TAX_CALENDAR = `
## FIRS TAX FILING CALENDAR — Nigeria

### Monthly Obligations
| Obligation | Due Date | Who Files |
|---|---|---|
| **VAT Returns** | 21st of the following month | All VAT-registered businesses |
| **WHT Remittance** | 21st of the following month | All companies that deducted WHT |
| **PAYE Remittance** | 10th of the following month | All employers |

### Annual Obligations
| Obligation | Due Date | Who Files |
|---|---|---|
| **CIT Returns** (self-assessment) | Within 6 months of year-end | All companies |
| **Annual VAT Returns** | 31 January | All VAT-registered businesses |
| **PAYE Annual Returns (Form H1)** | 31 January | All employers |
| **Annual Tax Audit** | Within 6 months of year-end (with CIT) | Large taxpayers |
| **Transfer Pricing Returns** | Within 18 months of year-end | Companies with related-party transactions |
| **TET (Tertiary Education Tax)** | Due with CIT return | Medium and large companies |
| **IT Levy** | Due with CIT return | Qualifying large companies |

### Other Key Dates
- **TIN Registration**: Must be obtained before any tax filing. Apply via JTB or FIRS.
- **CAC Annual Returns**: Within 42 days of AGM (typically by June 30 for Dec year-end companies).
- **Audited Financial Statements**: Must accompany CIT returns.

### Late Filing Consequences
- Most taxes carry a late filing penalty of ₦50,000 for the first month and ₦25,000 for each subsequent month.
- Interest on unpaid taxes accrues at the CBN Monetary Policy Rate (currently ~27.5% as of early 2026).
`;

// ─────────────────────────────────────────────────────────────
// Finance Act Changes & Recent Updates
// ─────────────────────────────────────────────────────────────
export const NIGERIA_RECENT_UPDATES = `
## RECENT TAX LAW CHANGES — Nigeria

### Finance Act 2023 (Signed January 2024)
- **Capital Gains Tax on shares**: Gains from disposal of shares listed on a recognised exchange remain exempt.
- **VAT on digital services**: Non-resident companies providing digital services to Nigerian customers must register for VAT if their turnover exceeds ₦25M.
- **Excise duty expansion**: Extended to telecommunication services (5% on voice, SMS, data, MMS).
- **Green tax incentives**: Companies investing in renewable energy, gas utilisation, and electric vehicles qualify for additional capital allowances.
- **TET renamed**: Education Tax renamed to Tertiary Education Tax; rate remains 2.5%.
- **Beneficial ownership register**: All companies must file beneficial ownership information with CAC.

### Finance Act 2021/2022 Key Changes
- **Minimum tax**: Changed from 0.5% of gross turnover to 0.5% of gross turnover OR 0.25% of revenue (whichever is higher) for companies with turnover above ₦25M.
- **Thin capitalisation**: Debt-to-equity ratio of 2:1 — interest on excess debt is non-deductible.
- **Electronic invoicing**: FIRS empowered to mandate electronic invoicing for VAT purposes.

### FIRS Administrative Changes
- **TaxProMax**: FIRS's online portal for all tax filings, payments, and TCC applications.
- **Automatic Exchange of Information (AEOI)**: Nigeria participates in the Common Reporting Standard (CRS) — financial institutions report account information of foreign tax residents.
- **Voluntary Assets & Income Declaration Scheme (VAIDS)**: Ended, but FIRS continues aggressive audit campaigns targeting non-compliant taxpayers.
- **e-WHT system**: Electronic WHT credit notes now mandatory.
`;

// ─────────────────────────────────────────────────────────────
// Practical Guidance
// ─────────────────────────────────────────────────────────────
export const NIGERIA_PRACTICAL_GUIDANCE = `
## PRACTICAL TAX GUIDANCE FOR NIGERIAN BUSINESSES

### Starting a New Business — Tax Obligations Checklist
1. Register with CAC (obtain RC Number)
2. Obtain Tax Identification Number (TIN) from FIRS or JTB
3. Register for VAT with FIRS (even if below ₦25M threshold)
4. Register for PAYE with your State IRS (if you have employees)
5. Open a dedicated business bank account
6. Set up proper bookkeeping from day one

### Common Mistakes to Avoid
1. **Not separating personal and business expenses** — FIRS can disallow deductions for mixed expenses.
2. **Forgetting to file nil returns** — You must file VAT returns even if you had no transactions.
3. **Not deducting WHT** — If you pay for services (consulting, rent, etc.), you MUST deduct WHT.
4. **Missing the 21-day VAT/WHT deadline** — Penalties accumulate monthly.
5. **Not claiming input VAT** — Many businesses overpay VAT by not tracking input VAT on purchases.
6. **Not obtaining WHT credit notes** — Without credit notes, you can't offset WHT against your CIT.
7. **Ignoring the ₦25M threshold** — Small companies (≤₦25M turnover) are exempt from CIT and VAT collection.

### Tax Compliance Checklist (Monthly)
- [ ] Collect and record all invoices (sales and purchases)
- [ ] Calculate output VAT on sales
- [ ] Calculate input VAT on purchases
- [ ] File VAT return by the 21st
- [ ] Deduct and remit WHT by the 21st
- [ ] Deduct and remit PAYE by the 10th
- [ ] Reconcile bank statements with accounting records

### Getting a Tax Clearance Certificate (TCC)
- Required for: government contracts, loan applications, forex transactions, import/export licences.
- Apply via TaxProMax after filing all outstanding returns.
- FIRS must issue within 2 weeks of application (if all taxes are up to date).
- Valid for 1 year from date of issue.

### Handling FIRS Audits
- FIRS can audit any company within 6 years of the relevant assessment year.
- Keep all records for at least 6 years.
- During an audit: cooperate fully, provide requested documents, do not volunteer unnecessary information.
- You have the right to appeal any additional assessment to the Tax Appeal Tribunal (TAT).
`;

// ─────────────────────────────────────────────────────────────
// Export combined knowledge base
// ─────────────────────────────────────────────────────────────
export const FULL_NIGERIA_TAX_KNOWLEDGE = [
  NIGERIA_VAT,
  NIGERIA_WHT,
  NIGERIA_PAYE,
  NIGERIA_CIT,
  NIGERIA_STAMP_DUTY,
  NIGERIA_CGT,
  NIGERIA_TAX_CALENDAR,
  NIGERIA_RECENT_UPDATES,
  NIGERIA_PRACTICAL_GUIDANCE,
].join('\n\n');

/**
 * Returns a topic-specific subset of the knowledge base based on keywords in the user's message.
 * This keeps token usage lower by only injecting relevant sections.
 */
export function getRelevantKnowledge(message: string): string {
  const lower = message.toLowerCase();
  const sections: string[] = [];

  // Always include practical guidance (it's short and universally useful)
  sections.push(NIGERIA_PRACTICAL_GUIDANCE);

  if (/vat|value.?added|7\.5|output.?tax|input.?tax/.test(lower)) {
    sections.push(NIGERIA_VAT);
  }
  if (/wht|withholding|deduct.*(source|payment)|credit.?note/.test(lower)) {
    sections.push(NIGERIA_WHT);
  }
  if (/paye|pay.?as.?you.?earn|salary|employee|pension|cra|relief.?allowance|gross.?income/.test(lower)) {
    sections.push(NIGERIA_PAYE);
  }
  if (/cit|company.?income|corporate.?tax|assessable.?profit|capital.?allowance|pioneer/.test(lower)) {
    sections.push(NIGERIA_CIT);
  }
  if (/stamp.?dut|receipt|electronic.?transfer/.test(lower)) {
    sections.push(NIGERIA_STAMP_DUTY);
  }
  if (/capital.?gain|cgt|disposal|chargeable.?asset/.test(lower)) {
    sections.push(NIGERIA_CGT);
  }
  if (/deadline|calendar|filing.?date|when.*(file|pay|due)|late|penalty|overdue/.test(lower)) {
    sections.push(NIGERIA_TAX_CALENDAR);
  }
  if (/finance.?act|recent|new.?law|change|update|2023|2024|digital|taxpromax/.test(lower)) {
    sections.push(NIGERIA_RECENT_UPDATES);
  }

  // If no specific topic matched, include everything
  if (sections.length <= 1) {
    return FULL_NIGERIA_TAX_KNOWLEDGE;
  }

  // Deduplicate
  return [...new Set(sections)].join('\n\n');
}
