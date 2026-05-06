-- Append-only log of every transactional email we sent (or tried to).
-- Two jobs: dedupe (don't send the same trial reminder twice) and
-- debug deliverability when a user says "I never got it".

CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  template TEXT NOT NULL,
  to_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent','failed','skipped_dedupe')),
  resend_id TEXT,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_dedupe
  ON email_log (workspace_id, template, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_user
  ON email_log (user_id, created_at DESC);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_log_select_own ON email_log;
CREATE POLICY email_log_select_own ON email_log
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS email_log_write_service ON email_log;
CREATE POLICY email_log_write_service ON email_log
  FOR ALL
  USING (false) WITH CHECK (false);

NOTIFY pgrst, 'reload schema';
