// Seed data script for Emiday Books development
// Run with: npx tsx supabase/seed.ts

const DEMO_WORKSPACE = {
  name: 'Emiday Demo Company',
  industry: 'Technology',
  business_type: 'LIMITED_COMPANY',
  jurisdiction: 'NG',
  currency: 'NGN',
  vat_number: 'VAT-000001',
  tin: '12345678-0001',
  rc_number: 'RC-123456',
  plan: 'GROWTH',
};

const DEMO_TRANSACTIONS = [
  { type: 'INCOME', amount: 2500000, description: 'Website Development - Acme Ltd', date: '2026-01-15', category_name: 'Consulting Income', vat_applicable: true },
  { type: 'INCOME', amount: 1800000, description: 'Mobile App Project - Beta Corp', date: '2026-01-22', category_name: 'Consulting Income', vat_applicable: true },
  { type: 'EXPENSE', amount: 350000, description: 'Office Rent - January', date: '2026-01-05', category_name: 'Rent & Lease', vat_applicable: false },
  { type: 'EXPENSE', amount: 120000, description: 'Internet & Hosting - AWS', date: '2026-01-10', category_name: 'Internet & Hosting', vat_applicable: true },
  { type: 'INCOME', amount: 3200000, description: 'ERP Implementation - Gamma Inc', date: '2026-02-01', category_name: 'Consulting Income', vat_applicable: true },
  { type: 'EXPENSE', amount: 450000, description: 'Staff Salary - John Doe', date: '2026-02-01', category_name: 'Salaries & Wages', vat_applicable: false },
  { type: 'EXPENSE', amount: 450000, description: 'Staff Salary - Jane Smith', date: '2026-02-01', category_name: 'Salaries & Wages', vat_applicable: false },
  { type: 'EXPENSE', amount: 85000, description: 'Software Licenses - Figma, GitHub', date: '2026-02-05', category_name: 'Software & Subscriptions', vat_applicable: true },
  { type: 'INCOME', amount: 950000, description: 'Maintenance Contract - Delta Ltd', date: '2026-02-15', category_name: 'Consulting Income', vat_applicable: true },
  { type: 'EXPENSE', amount: 350000, description: 'Office Rent - February', date: '2026-02-05', category_name: 'Rent & Lease', vat_applicable: false },
  { type: 'EXPENSE', amount: 75000, description: 'Office Supplies', date: '2026-02-10', category_name: 'Office Supplies', vat_applicable: true },
  { type: 'INCOME', amount: 1500000, description: 'Data Analytics Project - Epsilon Co', date: '2026-03-01', category_name: 'Consulting Income', vat_applicable: true },
  { type: 'EXPENSE', amount: 200000, description: 'Marketing - Google Ads', date: '2026-03-05', category_name: 'Advertising', vat_applicable: true },
  { type: 'EXPENSE', amount: 350000, description: 'Office Rent - March', date: '2026-03-05', category_name: 'Rent & Lease', vat_applicable: false },
  { type: 'EXPENSE', amount: 450000, description: 'Staff Salary - John Doe', date: '2026-03-01', category_name: 'Salaries & Wages', vat_applicable: false },
  { type: 'EXPENSE', amount: 450000, description: 'Staff Salary - Jane Smith', date: '2026-03-01', category_name: 'Salaries & Wages', vat_applicable: false },
  { type: 'EXPENSE', amount: 65000, description: 'Legal Fees - Contract Review', date: '2026-03-10', category_name: 'Legal & Professional', vat_applicable: true },
  { type: 'INCOME', amount: 4200000, description: 'Platform Build - Zeta Group', date: '2026-03-15', category_name: 'Consulting Income', vat_applicable: true },
];

const DEMO_EMPLOYEES = [
  { name: 'John Doe', email: 'john@emiday.com', role: 'Senior Developer', annual_gross: 5400000, pension_contribution: 0.08, nhf_contribution: 0.025 },
  { name: 'Jane Smith', email: 'jane@emiday.com', role: 'Product Designer', annual_gross: 5400000, pension_contribution: 0.08, nhf_contribution: 0.025 },
  { name: 'Chidi Okafor', email: 'chidi@emiday.com', role: 'Backend Engineer', annual_gross: 4800000, pension_contribution: 0.08, nhf_contribution: 0.025 },
  { name: 'Amara Nwankwo', email: 'amara@emiday.com', role: 'Marketing Lead', annual_gross: 4200000, pension_contribution: 0.08, nhf_contribution: 0.025 },
];

console.log('=== Emiday Books Seed Data ===');
console.log('');
console.log('To seed your database, run these SQL statements in Supabase SQL Editor:');
console.log('');
console.log('-- 1. Create demo workspace (replace USER_ID with your actual user ID)');
console.log(`INSERT INTO workspaces (name, industry, business_type, jurisdiction, currency, vat_number, tin, rc_number, plan, owner_id)`);
console.log(`VALUES ('${DEMO_WORKSPACE.name}', '${DEMO_WORKSPACE.industry}', '${DEMO_WORKSPACE.business_type}', '${DEMO_WORKSPACE.jurisdiction}', '${DEMO_WORKSPACE.currency}', '${DEMO_WORKSPACE.vat_number}', '${DEMO_WORKSPACE.tin}', '${DEMO_WORKSPACE.rc_number}', '${DEMO_WORKSPACE.plan}', 'YOUR_USER_ID')`);
console.log(`RETURNING id;`);
console.log('');
console.log('-- 2. Add workspace member');
console.log(`INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ('WORKSPACE_ID', 'YOUR_USER_ID', 'OWNER');`);
console.log('');
console.log('-- 3. Insert demo transactions (replace WORKSPACE_ID and CATEGORY_ID)');

DEMO_TRANSACTIONS.forEach((tx) => {
  console.log(`INSERT INTO transactions (workspace_id, type, amount, description, date, currency, source, vat_applicable, wht_applicable, category_confirmed, reconciled, is_duplicate)`);
  console.log(`VALUES ('WORKSPACE_ID', '${tx.type}', ${tx.amount}, '${tx.description}', '${tx.date}', 'NGN', 'MANUAL', ${tx.vat_applicable}, false, true, false, false);`);
});

console.log('');
console.log('-- 4. Insert demo employees');
DEMO_EMPLOYEES.forEach((emp) => {
  console.log(`INSERT INTO employees (workspace_id, name, email, role, annual_gross, pension_contribution, nhf_contribution)`);
  console.log(`VALUES ('WORKSPACE_ID', '${emp.name}', '${emp.email}', '${emp.role}', ${emp.annual_gross}, ${emp.pension_contribution}, ${emp.nhf_contribution});`);
});

console.log('');
console.log('=== Done! Replace WORKSPACE_ID and YOUR_USER_ID with actual values ===');
