-- Trial extended from 24 hours → 10 days. New signups get 10 days
-- via the column DEFAULT. Existing test workspaces that haven't paid
-- yet are bumped to "now + 10 days" if their current trial_ends_at
-- would expire sooner.

ALTER TABLE workspaces
  ALTER COLUMN trial_ends_at
  SET DEFAULT (now() + interval '10 days');

UPDATE workspaces
   SET trial_ends_at = now() + interval '10 days'
 WHERE subscription_status IN ('pending','past_due')
   AND (trial_ends_at IS NULL OR trial_ends_at < now() + interval '10 days');

NOTIFY pgrst, 'reload schema';
