-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  email        TEXT NOT NULL,
  avatar_url   TEXT,
  role         TEXT NOT NULL CHECK (role IN ('SME_OWNER', 'ACCOUNTANT')),
  phone        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- WORKSPACES
-- ============================================
CREATE TABLE workspaces (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  owner_id         UUID NOT NULL REFERENCES profiles(id),
  business_type    TEXT NOT NULL CHECK (business_type IN (
                     'SOLE_TRADER', 'LIMITED_COMPANY', 'PARTNERSHIP',
                     'NGO', 'GOVERNMENT')),
  jurisdiction     TEXT NOT NULL CHECK (jurisdiction IN ('NG', 'GH', 'ZA')),
  industry         TEXT,
  vat_registered   BOOLEAN DEFAULT FALSE,
  vat_number       TEXT,
  tin              TEXT,
  rc_number        TEXT,
  address          TEXT,
  logo_url         TEXT,
  currency         TEXT NOT NULL DEFAULT 'NGN',
  plan_tier        TEXT NOT NULL DEFAULT 'STARTER' CHECK (plan_tier IN (
                     'STARTER', 'GROWTH', 'BUSINESS',
                     'PRO', 'FIRM', 'ENTERPRISE')),
  billing_cycle    TEXT DEFAULT 'MONTHLY' CHECK (billing_cycle IN ('MONTHLY', 'ANNUAL')),
  trial_ends_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- ============================================
-- WORKSPACE MEMBERS
-- ============================================
CREATE TABLE workspace_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles(id),
  role           TEXT NOT NULL CHECK (role IN ('OWNER', 'ACCOUNTANT', 'VIEWER')),
  invited_by     UUID REFERENCES profiles(id),
  accepted_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their workspace memberships" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Members can view co-members" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Workspace RLS (after workspace_members exists)
CREATE POLICY "workspace_isolation" ON workspaces
  FOR ALL USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  parent_id        UUID REFERENCES categories(id),
  tax_treatment    TEXT CHECK (tax_treatment IN (
                     'VAT_STANDARD', 'VAT_EXEMPT', 'WHT_SERVICES',
                     'WHT_RENT', 'PAYE', 'STANDARD', 'NON_DEDUCTIBLE')),
  icon             TEXT,
  color            TEXT,
  is_system        BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_isolation" ON categories
  FOR ALL USING (
    workspace_id IS NULL
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- BANK IMPORTS (must be before transactions)
-- ============================================
CREATE TABLE bank_imports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  filename          TEXT NOT NULL,
  file_url          TEXT NOT NULL,
  bank_name         TEXT,
  account_number    TEXT,
  statement_period  TEXT,
  upload_date       TIMESTAMPTZ DEFAULT NOW(),
  status            TEXT DEFAULT 'PROCESSING' CHECK (status IN (
                      'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL')),
  transaction_count INT DEFAULT 0,
  matched_count     INT DEFAULT 0,
  error_message     TEXT,
  parsed_at         TIMESTAMPTZ,
  created_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bank_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_imports_isolation" ON bank_imports
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  amount            NUMERIC(18, 2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'NGN',
  date              DATE NOT NULL,
  description       TEXT NOT NULL,
  vendor_client     TEXT,
  category_id       UUID REFERENCES categories(id),
  category_confirmed BOOLEAN DEFAULT FALSE,
  source            TEXT NOT NULL CHECK (source IN (
                      'MANUAL', 'PAYSTACK', 'FLUTTERWAVE', 'BANK_IMPORT', 'MONIEPOINT')),
  reference         TEXT,
  notes             TEXT,
  vat_applicable    BOOLEAN DEFAULT FALSE,
  vat_amount        NUMERIC(18, 2),
  wht_applicable    BOOLEAN DEFAULT FALSE,
  wht_rate          NUMERIC(5, 4),
  wht_amount        NUMERIC(18, 2),
  receipt_url       TEXT,
  reconciled        BOOLEAN DEFAULT FALSE,
  bank_import_id    UUID REFERENCES bank_imports(id),
  is_duplicate      BOOLEAN DEFAULT FALSE,
  duplicate_of      UUID REFERENCES transactions(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_workspace_date ON transactions(workspace_id, date DESC);
CREATE INDEX idx_transactions_type ON transactions(workspace_id, type);
CREATE INDEX idx_transactions_category ON transactions(category_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_isolation" ON transactions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- PAYMENT INTEGRATIONS
-- ============================================
CREATE TABLE payment_integrations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL CHECK (provider IN ('PAYSTACK', 'FLUTTERWAVE', 'MONIEPOINT')),
  access_token     TEXT,
  webhook_secret   TEXT,
  last_sync_at     TIMESTAMPTZ,
  sync_status      TEXT DEFAULT 'ACTIVE' CHECK (sync_status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_integrations_isolation" ON payment_integrations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- TAX PERIODS
-- ============================================
CREATE TABLE tax_periods (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  period_type      TEXT NOT NULL CHECK (period_type IN ('VAT', 'PAYE', 'WHT', 'CIT', 'PROVISIONAL')),
  jurisdiction     TEXT NOT NULL CHECK (jurisdiction IN ('NG', 'GH', 'ZA')),
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  due_date         DATE NOT NULL,
  status           TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FILED', 'OVERDUE', 'PAID')),
  gross_amount     NUMERIC(18, 2),
  tax_amount       NUMERIC(18, 2),
  report_url       TEXT,
  notes            TEXT,
  filed_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tax_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tax_periods_isolation" ON tax_periods
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- EMPLOYEES
-- ============================================
CREATE TABLE employees (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  email             TEXT,
  gross_monthly_salary NUMERIC(18, 2) NOT NULL,
  department        TEXT,
  employment_type   TEXT DEFAULT 'FULL_TIME' CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT')),
  start_date        DATE,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_isolation" ON employees
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE subscriptions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id              UUID NOT NULL REFERENCES workspaces(id),
  plan_tier                 TEXT NOT NULL,
  billing_cycle             TEXT NOT NULL CHECK (billing_cycle IN ('MONTHLY', 'ANNUAL')),
  paystack_customer_code    TEXT,
  paystack_subscription_code TEXT,
  paystack_plan_code        TEXT,
  status                    TEXT DEFAULT 'ACTIVE' CHECK (status IN (
                              'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')),
  amount                    NUMERIC(12, 2),
  currency                  TEXT DEFAULT 'NGN',
  current_period_start      TIMESTAMPTZ,
  current_period_end        TIMESTAMPTZ,
  cancelled_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_isolation" ON subscriptions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- CHAT SESSIONS & MESSAGES
-- ============================================
CREATE TABLE chat_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles(id),
  title          TEXT DEFAULT 'New Conversation',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_sessions_isolation" ON chat_sessions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE TABLE chat_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role           TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content        TEXT NOT NULL,
  metadata       JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_isolation" ON chat_messages
  FOR ALL USING (
    session_id IN (
      SELECT id FROM chat_sessions
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- SEED DEFAULT CATEGORIES
-- ============================================
INSERT INTO categories (name, type, tax_treatment, is_system) VALUES
  -- Income categories
  ('Client Invoice Payment', 'INCOME', 'VAT_STANDARD', TRUE),
  ('Product Sales', 'INCOME', 'VAT_STANDARD', TRUE),
  ('Service Revenue', 'INCOME', 'VAT_STANDARD', TRUE),
  ('Rental Income', 'INCOME', 'VAT_EXEMPT', TRUE),
  ('Interest Income', 'INCOME', 'VAT_EXEMPT', TRUE),
  ('Grant / Donation', 'INCOME', 'VAT_EXEMPT', TRUE),
  ('Refund Received', 'INCOME', 'STANDARD', TRUE),
  ('Other Income', 'INCOME', 'STANDARD', TRUE),
  -- Expense categories
  ('Staff Salary', 'EXPENSE', 'PAYE', TRUE),
  ('Generator Fuel', 'EXPENSE', 'STANDARD', TRUE),
  ('Office Rent', 'EXPENSE', 'WHT_RENT', TRUE),
  ('Logistics / Delivery', 'EXPENSE', 'STANDARD', TRUE),
  ('Marketing & Advertising', 'EXPENSE', 'STANDARD', TRUE),
  ('Professional Services', 'EXPENSE', 'WHT_SERVICES', TRUE),
  ('Legal Fees', 'EXPENSE', 'WHT_SERVICES', TRUE),
  ('Accounting Fees', 'EXPENSE', 'WHT_SERVICES', TRUE),
  ('Bank Charges', 'EXPENSE', 'VAT_EXEMPT', TRUE),
  ('Equipment Purchase', 'EXPENSE', 'VAT_STANDARD', TRUE),
  ('Software & Subscriptions', 'EXPENSE', 'VAT_STANDARD', TRUE),
  ('Travel & Transport', 'EXPENSE', 'STANDARD', TRUE),
  ('Meals & Entertainment', 'EXPENSE', 'NON_DEDUCTIBLE', TRUE),
  ('Utilities (Electricity, Water)', 'EXPENSE', 'STANDARD', TRUE),
  ('Internet & Phone', 'EXPENSE', 'STANDARD', TRUE),
  ('Printing & Stationery', 'EXPENSE', 'STANDARD', TRUE),
  ('Security', 'EXPENSE', 'STANDARD', TRUE),
  ('Maintenance & Repairs', 'EXPENSE', 'STANDARD', TRUE),
  ('Stock / Inventory', 'EXPENSE', 'VAT_STANDARD', TRUE),
  ('Insurance Premium', 'EXPENSE', 'VAT_EXEMPT', TRUE),
  ('Tax Payment', 'EXPENSE', 'NON_DEDUCTIBLE', TRUE),
  ('Other Expense', 'EXPENSE', 'STANDARD', TRUE);

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'SME_OWNER')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tax_periods_updated_at BEFORE UPDATE ON tax_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
