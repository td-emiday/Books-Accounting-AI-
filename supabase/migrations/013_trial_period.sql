-- 24-hour free trial on every new workspace. After expiry, /app is
-- locked behind an upgrade prompt unless subscription_status='active'.

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ
    DEFAULT (now() + interval '24 hours');

UPDATE workspaces
  SET trial_ends_at = now() + interval '24 hours'
  WHERE trial_ends_at IS NULL;

NOTIFY pgrst, 'reload schema';
