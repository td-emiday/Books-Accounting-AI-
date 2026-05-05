-- Tour state + Paystack stored auth + scheduled plan change.

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS tour_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paystack_authorization_code TEXT,
  ADD COLUMN IF NOT EXISTS pending_plan_change JSONB;

CREATE INDEX IF NOT EXISTS idx_workspaces_pending_plan_change_effective
  ON workspaces ((pending_plan_change->>'effective_at'))
  WHERE pending_plan_change IS NOT NULL;

NOTIFY pgrst, 'reload schema';
