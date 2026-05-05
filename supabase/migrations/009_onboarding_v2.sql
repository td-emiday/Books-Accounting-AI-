-- 009_onboarding_v2.sql
-- Unified sign-up + onboarding flow.
--
-- Adds first-class columns for two pieces of data the wizard collects
-- and that the rest of the app needs to consume directly:
--
--   * banks         — list of banks the business uses. Driven by the
--                     onboarding multi-select; surfaced on Settings, the
--                     bank-feeds page, and as filter chips on Transactions.
--                     Stored as TEXT[] (small, ordered, easy to query).
--   * pending_invites — teammate invites collected during onboarding before
--                       there's a way to accept them. Email + role + a token
--                       so we can wire acceptance later without another
--                       migration. Lives in metadata JSON to avoid a join
--                       table for v1.

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS banks TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

-- Comment for clarity in the schema browser.
COMMENT ON COLUMN public.workspaces.banks IS
  'Banks the business uses. Captured during onboarding; surfaced on Settings, Bank Feeds, Transactions filters.';

-- pending_invites convention (no schema change — stored under metadata):
--   metadata->''pending_invites'' = jsonb_array_elements(
--     [{ email, role, invited_at, token }]
--   )
-- An accept flow can later move these into workspace_members.
