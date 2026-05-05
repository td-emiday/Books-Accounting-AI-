-- 008_workspace_metadata.sql
-- Free-form preferences (primary bank, onboarding goals, etc.) live here
-- so we don't need a new migration every time a soft preference is added.

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
