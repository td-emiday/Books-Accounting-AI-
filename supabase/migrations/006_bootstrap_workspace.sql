-- 006_bootstrap_workspace.sql
-- On signup we auto-create a profile (existing trigger). Extend that flow so
-- every new user also gets a personal workspace and is added as its OWNER
-- member. Also backfill any existing profile that's missing a workspace.

-- 1. Replace handle_new_user to also bootstrap a workspace + membership.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
  resolved_name TEXT;
BEGIN
  resolved_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  -- Profile
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    resolved_name,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'SME_OWNER')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Workspace (named after the user; user can rename later in settings)
  INSERT INTO public.workspaces (
    name, owner_id, business_type, jurisdiction, industry, currency
  )
  VALUES (
    resolved_name || '''s workspace',
    NEW.id,
    'SOLE_TRADER',
    'NG',
    'General',
    'NGN'
  )
  RETURNING id INTO new_workspace_id;

  -- Owner membership
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'OWNER')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Backfill: any profile without a workspace gets one now.
DO $$
DECLARE
  p RECORD;
  new_workspace_id UUID;
BEGIN
  FOR p IN
    SELECT pr.id, pr.full_name, pr.email
    FROM public.profiles pr
    LEFT JOIN public.workspace_members wm ON wm.user_id = pr.id
    WHERE wm.user_id IS NULL
  LOOP
    INSERT INTO public.workspaces (
      name, owner_id, business_type, jurisdiction, industry, currency
    )
    VALUES (
      COALESCE(p.full_name, p.email) || '''s workspace',
      p.id,
      'SOLE_TRADER',
      'NG',
      'General',
      'NGN'
    )
    RETURNING id INTO new_workspace_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (new_workspace_id, p.id, 'OWNER');
  END LOOP;
END $$;
