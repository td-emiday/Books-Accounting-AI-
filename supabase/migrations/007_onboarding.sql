-- 007_onboarding.sql
-- Track when a workspace finishes the onboarding wizard. NULL means the
-- owner hasn't completed it yet — the dashboard shell redirects them to
-- /onboarding. Backfills existing rows so current users skip the wizard.

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

UPDATE public.workspaces
SET onboarded_at = NOW()
WHERE onboarded_at IS NULL;
