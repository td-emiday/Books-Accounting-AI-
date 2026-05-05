-- Paystack billing columns on workspaces + payments table.
-- Subscription status drives the in-app billing banner and feature gates.

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT,
  ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT,
  ADD COLUMN IF NOT EXISTS paystack_email_token TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT
    CHECK (subscription_status IN ('pending','active','past_due','cancelled','non_renewing'))
    DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_workspaces_paystack_customer
  ON workspaces (paystack_customer_code);
CREATE INDEX IF NOT EXISTS idx_workspaces_paystack_subscription
  ON workspaces (paystack_subscription_code);

-- Payments / receipts. Append-only; webhook is the writer.
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  paystack_reference TEXT NOT NULL UNIQUE,
  paystack_event TEXT NOT NULL,
  amount_kobo BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL,
  channel TEXT,
  paid_at TIMESTAMPTZ,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_workspace ON payments (workspace_id, created_at DESC);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_select_own ON payments;
CREATE POLICY payments_select_own ON payments
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS payments_insert_service ON payments;
CREATE POLICY payments_insert_service ON payments
  FOR INSERT
  WITH CHECK (false);

NOTIFY pgrst, 'reload schema';
