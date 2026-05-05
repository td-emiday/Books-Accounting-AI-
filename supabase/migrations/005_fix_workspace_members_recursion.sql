-- ============================================
-- Migration 005: Fix infinite recursion in workspace_members RLS
--
-- The original "Members can view co-members" policy on workspace_members
-- selects from workspace_members inside its own USING clause, which
-- causes Postgres to detect infinite recursion (error 42P17) on the
-- first read.
--
-- Fix: replace it with a SECURITY DEFINER helper function that
-- bypasses RLS to fetch the current user's workspace ids, then use
-- that helper in the policy. Same effect, no recursion.
-- ============================================

DROP POLICY IF EXISTS "Members can view co-members" ON workspace_members;

CREATE OR REPLACE FUNCTION public.current_user_workspace_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_user_workspace_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_workspace_ids() TO authenticated;

CREATE POLICY "workspace_members_co_visibility" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT public.current_user_workspace_ids())
  );
