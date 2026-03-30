/**
 * Seed the knowledge base with core Nigerian tax and compliance knowledge.
 * Run with: npx tsx scripts/seed-knowledge-base.ts
 *
 * Requires: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { ingestDocument } from '../lib/ai/rag';

const SEED_DOCUMENTS = [
  {
    title: 'Nigeria VAT Act — Key Provisions',
    content: `
Value Added Tax (VAT) in Nigeria

Rate: VAT is charged at 7.5% on the supply of goods and services in Nigeria (effective February 2020, increased from 5%).

Registration: All businesses with annual turnover above ₦25 million must register for VAT with the Federal Inland Revenue Service (FIRS). Voluntary registration is available for smaller businesses.

VAT-Exempt Items:
- Medical and pharmaceutical products
- Basic food items (unprocessed agricultural produce)
- Books, newspapers, and educational materials
- Baby products (diapers, feeding bottles)
- Exported services and goods (zero-rated)
- Plant, machinery, and equipment purchased for use in Export Processing Zones
- Agricultural equipment and inputs

VAT Filing:
- VAT returns must be filed monthly, by the 21st day of the month following the taxable period.
- Late filing attracts a penalty of ₦50,000 for the first month and ₦25,000 for each subsequent month.
- Interest on late payment: 1.5% per month on the unpaid tax.

Input VAT Credit:
- Businesses can claim input VAT credit on goods and services purchased for business purposes.
- Input VAT on overhead expenses is allowable.
- Input VAT on capital assets is allowable.
- VAT on entertainment expenses is NOT recoverable.

Output VAT:
- Collected from customers on taxable supplies.
- Net VAT payable = Output VAT minus Input VAT.
- If Input VAT exceeds Output VAT, the excess can be carried forward.

Withholding Agents:
- Government agencies, large companies, and oil & gas companies are designated VAT withholding agents.
- They must deduct and remit VAT on behalf of suppliers at the point of payment.
`,
    metadata: {
      sourceDocument: 'Nigeria_VAT_Act_2007_Amended_2020',
      jurisdiction: 'NG',
      category: 'tax_law',
      subCategory: 'vat',
    },
  },
  {
    title: 'Nigeria Company Income Tax (CIT) Rules',
    content: `
Company Income Tax (CIT) in Nigeria

CIT Rates (effective 2023):
- Small companies (turnover ≤ ₦25 million): 0% CIT rate
- Medium companies (turnover > ₦25M but ≤ ₦100M): 20% CIT rate
- Large companies (turnover > ₦100 million): 30% CIT rate

Tertiary Education Tax (TET): 2.5% of assessable profit (applies to all companies regardless of size).

Filing Deadlines:
- CIT returns must be filed within 6 months after the end of the company's accounting year.
- For new companies: 18 months from incorporation OR 6 months after the end of first accounting period, whichever comes first.
- Self-assessment: Companies must file returns with FIRS and pay tax based on self-assessment.

Allowable Deductions:
- Salaries, wages, and other staff costs
- Rent on business premises
- Interest on loans used wholly for business
- Bad debts (specifically written off)
- Depreciation (capital allowances — not accounting depreciation)
- Repairs and maintenance of business assets
- Contributions to approved pension schemes
- Donations to approved charitable organizations (max 10% of assessable profit)

Non-Allowable Expenses:
- Capital expenditure (claimed via capital allowances instead)
- Provisions for future liabilities
- Entertainment expenses (unless wholly for trade purposes)
- Taxes paid on behalf of another person
- Fines and penalties for legal violations

Capital Allowances:
- Building: 15% initial, 10% annual
- Plant & Machinery: 50% initial, 25% annual
- Furniture & Fittings: 25% initial, 20% annual
- Motor Vehicles: 50% initial, 25% annual
- ICT Equipment: 25% initial, 12.5% annual (or accelerated at specific rates)

Minimum Tax:
- If CIT computed is less than minimum tax, the company pays minimum tax.
- Minimum tax = 0.5% of gross turnover (for companies with turnover > ₦25M).
- Exemption: Small companies (turnover ≤ ₦25M) are exempt from minimum tax for first 4 years.

Penalties:
- Late filing: ₦50,000 first month, ₦25,000 each subsequent month.
- Late payment: 10% penalty + interest at prevailing Central Bank rate.
- Failure to file: Additional penalty of ₦100,000.
`,
    metadata: {
      sourceDocument: 'Nigeria_CITA_2004_Amended_2023',
      jurisdiction: 'NG',
      category: 'tax_law',
      subCategory: 'cit',
    },
  },
  {
    title: 'Nigeria Withholding Tax (WHT) Rates and Rules',
    content: `
Withholding Tax (WHT) in Nigeria

WHT is an advance payment of income tax deducted at source from payments to suppliers, contractors, and service providers.

WHT Rates for Companies:
- Dividends, Interest, Rent: 10%
- Royalties: 10%
- Commission and Consultancy: 10%
- Technical and Management Fees: 10%
- Professional Services (legal, accounting, medical): 10%
- Construction: 5% (reduced rate)
- Supply of Goods: 5% (reduced rate)
- All other contracts/services: 10%

WHT Rates for Individuals:
- Dividends, Interest, Rent: 10%
- Royalties: 5%
- Commission: 5%
- Directors' Fees: 10%

Key Rules:
- WHT applies to payments exceeding ₦10,000 for companies.
- The payer (withholding agent) deducts WHT at source and remits to FIRS.
- WHT must be remitted within 21 days after the duty to deduct arises.
- WHT deducted is a credit against the recipient's final tax liability.

Filing Requirements:
- WHT returns are filed quarterly.
- Due by the 21st of the month following the end of the quarter.
- Q1 (Jan-Mar): Due April 21
- Q2 (Apr-Jun): Due July 21
- Q3 (Jul-Sep): Due October 21
- Q4 (Oct-Dec): Due January 21

WHT Credit Notes:
- The payer must issue a WHT credit note to the payee as evidence of deduction.
- Credit notes are used to claim WHT credits against CIT or other tax liabilities.

Non-Resident WHT:
- WHT is the final tax for non-residents without a Nigerian permanent establishment.
- Treaty relief may apply to reduce rates (Nigeria has tax treaties with several countries).

Common Errors:
- Not deducting WHT on rent payments to landlords
- Not deducting WHT on professional service fees
- Applying wrong rate (5% vs 10%)
- Late remittance attracting penalties
`,
    metadata: {
      sourceDocument: 'Nigeria_WHT_Regulations',
      jurisdiction: 'NG',
      category: 'tax_law',
      subCategory: 'wht',
    },
  },
  {
    title: 'Nigeria PAYE — Pay As You Earn Tax Rules',
    content: `
PAYE (Pay As You Earn) in Nigeria

PAYE is the system of income tax deduction from employees' salaries by employers.

Tax Bands (Personal Income Tax Act):
- First ₦300,000: 7%
- Next ₦300,000: 11%
- Next ₦500,000: 15%
- Next ₦500,000: 19%
- Next ₦1,600,000: 21%
- Above ₦3,200,000: 24%

Consolidated Relief Allowance (CRA):
- Higher of ₦200,000 or 1% of gross income
- Plus 20% of gross income
- This is deducted from gross income before applying tax bands.

Statutory Deductions (before CRA):
- Pension Contribution: 8% of basic, housing, and transport allowances (employee's share)
- National Health Insurance Scheme (NHIS): 5% of basic salary
- National Housing Fund (NHF): 2.5% of basic salary

Filing and Remittance:
- Employers must deduct PAYE from employees' salaries monthly.
- Remittance to the State Internal Revenue Service (SIRS) by the 10th of the following month.
- Annual returns (Form H1) due by January 31st of the following year.

Employer Obligations:
- Register with the relevant State Internal Revenue Service
- Deduct correct amount of PAYE from each employee's salary
- Remit deductions by the 10th of each month
- File annual returns by January 31st
- Issue tax deduction cards to employees
- Maintain proper payroll records

State vs Federal:
- PAYE is administered by State Internal Revenue Services (not FIRS).
- Lagos: LIRS (Lagos Internal Revenue Service)
- Other states: Each has its own SIRS.
- Federal employees: FIRS handles their PAYE.

Penalties:
- Late remittance: 10% penalty + interest at prevailing Central Bank rate.
- Failure to deduct: Employer becomes personally liable for the tax.
- Non-filing of annual returns: ₦500,000 for companies, ₦50,000 for individuals.
`,
    metadata: {
      sourceDocument: 'Nigeria_PIT_Act_PAYE_Rules',
      jurisdiction: 'NG',
      category: 'tax_law',
      subCategory: 'paye',
    },
  },
  {
    title: 'FIRS e-Tax Portal — Filing and Payment Guide',
    content: `
FIRS e-Tax Portal Guide

The FIRS e-Tax portal (etax.firs.gov.ng) is the official platform for tax filing and payment in Nigeria.

Registration:
1. Visit etax.firs.gov.ng
2. Click "New Registration" or use your TIN to access your account
3. Complete profile with company details, directors, and bank information
4. Verify via email or phone OTP

Filing Returns:
1. Log in to the e-Tax portal
2. Select "File Returns" from the dashboard
3. Choose the tax type (VAT, CIT, WHT, etc.)
4. Select the filing period
5. Enter your figures (output tax, input tax, etc.)
6. Upload supporting documents if required
7. Review and submit

Payment Process:
1. After filing, the system generates a Payment Reference Number (PRN)
2. Payment methods:
   - Online: Via Remita (remita.net) using the PRN
   - Bank Transfer: To the designated FIRS collection account using PRN
   - USSD: *347*103# (for most Nigerian banks)
   - Over the Counter: At any commercial bank with the PRN
3. Payment confirmation is reflected in your e-Tax account within 24-72 hours

TIN Registration:
- Tax Identification Number is mandatory for all businesses.
- Apply via FIRS office or e-Tax portal.
- Required documents: CAC registration certificate, Memorandum of Association, utility bill, passport photographs of directors.
- Processing time: 3-7 working days.

Important URLs:
- FIRS e-Tax Portal: https://etax.firs.gov.ng
- Remita Payment: https://remita.net
- TIN Verification: https://apps.firs.gov.ng/tinverification
- FIRS Helpline: 0800-CALL-FIRS (0800-2255-3477)

Common Issues:
- Forgot password: Use the "Reset Password" link on the login page
- TIN not found: Visit nearest FIRS office with registration documents
- Payment not reflecting: Allow 24-72 hours; contact FIRS helpdesk if longer
- Filing period locked: Contact FIRS for reopening if you missed a deadline
`,
    metadata: {
      sourceDocument: 'FIRS_eTax_Portal_Guide',
      jurisdiction: 'NG',
      category: 'compliance',
      subCategory: 'filing',
    },
  },
  {
    title: 'Nigerian Accounting Standards — Key Categories for SMEs',
    content: `
Transaction Categorisation Guide for Nigerian Businesses

Revenue Categories:
- Sales Revenue: Income from primary business activities (product sales, service delivery)
- Professional Fees: Income from consulting, advisory, legal, or accounting services
- Rental Income: Income from property or equipment leasing
- Interest Income: Earnings from bank deposits, loans given, or investments
- Commission Income: Earnings from acting as agent or broker
- Grants and Subsidies: Government or institutional grants received

Expense Categories:
- Cost of Goods Sold (COGS): Direct costs of producing goods/services sold
- Salaries and Wages: Employee compensation including allowances
- Office Rent: Rental payments for business premises
- Utilities: Electricity (NEPA/DISCO), water, internet, phone bills
- Professional Services: Legal, accounting, audit fees (WHT applicable at 10%)
- Marketing and Advertising: Promotion, social media ads, printing
- Travel and Transport: Business travel, fuel, vehicle maintenance
- Office Supplies: Stationery, printing, consumables
- Insurance: Business insurance premiums
- Bank Charges: Account maintenance, transfer fees, POS charges
- Depreciation: Capital allowance on fixed assets
- Repairs and Maintenance: Equipment and property maintenance
- Training and Development: Staff training, workshops, conferences
- Subscriptions: Software, professional memberships, publications

Tax Treatment Mapping:
- VAT Standard (7.5%): Most goods and services
- VAT Exempt: Medical, food staples, education
- WHT Services (10%): Professional, technical, management services
- WHT Rent (10%): All rental payments
- WHT Supply (5%): Purchase of goods from suppliers
- Non-Deductible: Personal expenses, entertainment, fines

Common Nigerian Business Expenses:
- Generator diesel/fuel: Deductible, VAT standard
- DSTV/GoTV: Non-deductible if personal
- Data/airtime: Deductible if for business use
- Staff feeding: Deductible as welfare expense
- Aso-ebi/gifts: Generally non-deductible
- Tithes/donations: Deductible up to 10% of assessable profit if to approved organization
`,
    metadata: {
      sourceDocument: 'Nigerian_SME_Accounting_Guide',
      jurisdiction: 'NG',
      category: 'accounting_standards',
      subCategory: 'categorisation',
    },
  },
];

async function main() {
  console.log('🚀 Seeding knowledge base...\n');

  let totalChunks = 0;
  let totalErrors = 0;

  for (const doc of SEED_DOCUMENTS) {
    console.log(`📄 Ingesting: ${doc.title}`);
    const result = await ingestDocument(doc.title, doc.content, doc.metadata);
    console.log(`   ✅ ${result.chunksStored} chunks stored, ${result.errors} errors\n`);
    totalChunks += result.chunksStored;
    totalErrors += result.errors;
  }

  console.log(`\n🎉 Done! Total: ${totalChunks} chunks stored, ${totalErrors} errors`);
}

main().catch(console.error);
