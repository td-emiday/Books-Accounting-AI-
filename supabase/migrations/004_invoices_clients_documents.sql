-- ============================================
-- Migration 004: clients, invoices, documents
--
-- Adds the three customer-facing tables that back the
-- /app/clients, /app/invoices, and /app/documents routes.
-- All three follow the existing workspace-isolation RLS
-- pattern from 001_initial_schema.sql.
-- ============================================

-- ============================================
-- CLIENTS
--
-- A workspace's customer list. Operational metrics
-- (reconciled %, AR balance, status) are derived at
-- query time from transactions/invoices, not stored here.
-- ============================================
CREATE TABLE clients (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  initial        TEXT,                      -- single-letter avatar fallback
  sector         TEXT,                      -- "F&B", "Software", etc.
  location       TEXT,                      -- "Lagos", "Abuja"
  email          TEXT,
  phone          TEXT,
  address        TEXT,
  contact_person TEXT,
  owner_id       UUID REFERENCES profiles(id),  -- account manager on our side
  currency       TEXT NOT NULL DEFAULT 'NGN',
  notes          TEXT,
  is_archived    BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_workspace ON clients(workspace_id) WHERE is_archived = FALSE;
CREATE INDEX idx_clients_workspace_name ON clients(workspace_id, name);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_isolation" ON clients
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- INVOICES
--
-- One row per issued invoice. `status` is the source of
-- truth; daysLeft / overdue flags in the UI are computed
-- from due_date + status.
-- ============================================
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  number          TEXT NOT NULL,             -- "INV-2051"
  issue_date      DATE NOT NULL,
  due_date        DATE,                      -- NULL allowed for drafts
  amount          NUMERIC(18, 2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'NGN',
  vat_applicable  BOOLEAN DEFAULT FALSE,
  vat_amount      NUMERIC(18, 2),
  wht_applicable  BOOLEAN DEFAULT FALSE,
  wht_amount      NUMERIC(18, 2),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                    'draft', 'sent', 'overdue', 'paid', 'void')),
  description     TEXT,
  notes           TEXT,
  pdf_url         TEXT,
  paid_at         TIMESTAMPTZ,
  voided_at       TIMESTAMPTZ,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, number)
);

CREATE INDEX idx_invoices_workspace_issued ON invoices(workspace_id, issue_date DESC);
CREATE INDEX idx_invoices_workspace_status ON invoices(workspace_id, status);
CREATE INDEX idx_invoices_client ON invoices(client_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_isolation" ON invoices
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- DOCUMENTS
--
-- Files attached to a workspace. file_url points to
-- Supabase Storage. Optional client_id links the doc
-- to a customer for the "by client" filter.
-- ============================================
CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  storage_path  TEXT,                        -- bucket-relative path for delete/replace
  mime_type     TEXT,
  size_bytes    BIGINT,
  category      TEXT NOT NULL CHECK (category IN (
                  'receipt', 'tax', 'contract', 'report', 'payroll', 'other')),
  source        TEXT NOT NULL CHECK (source IN (
                  'upload', 'whatsapp', 'email', 'generated')),
  uploaded_by   UUID REFERENCES profiles(id),
  metadata      JSONB,                       -- OCR results, extracted fields, etc.
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_workspace_created ON documents(workspace_id, created_at DESC);
CREATE INDEX idx_documents_workspace_category ON documents(workspace_id, category);
CREATE INDEX idx_documents_client ON documents(client_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_isolation" ON documents
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- TRANSACTIONS ↔ CLIENTS link (additive, non-breaking)
--
-- Existing transactions table has free-text `vendor_client`.
-- Add an optional FK so confirmed matches can be linked
-- to a real client row without breaking historical data.
-- ============================================
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_client ON transactions(client_id);
