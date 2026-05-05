-- Telegram (and future WhatsApp) integration: per-user channel
-- bindings + time-limited pairing codes + receipts storage bucket.

CREATE TABLE IF NOT EXISTS workspace_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('telegram','whatsapp')),
  external_id TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workspace_channels_provider_external_unique
    UNIQUE (provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_channels_workspace
  ON workspace_channels (workspace_id);

ALTER TABLE workspace_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_channels_select_own ON workspace_channels;
CREATE POLICY workspace_channels_select_own ON workspace_channels
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS workspace_channels_write_service ON workspace_channels;
CREATE POLICY workspace_channels_write_service ON workspace_channels
  FOR ALL
  USING (false) WITH CHECK (false);

CREATE TABLE IF NOT EXISTS channel_pairings (
  code TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('telegram','whatsapp')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_channel_pairings_workspace
  ON channel_pairings (workspace_id);

ALTER TABLE channel_pairings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS channel_pairings_select_own ON channel_pairings;
CREATE POLICY channel_pairings_select_own ON channel_pairings
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS channel_pairings_write_service ON channel_pairings;
CREATE POLICY channel_pairings_write_service ON channel_pairings
  FOR ALL
  USING (false) WITH CHECK (false);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts', 'receipts', false, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS receipts_read_workspace_members ON storage.objects;
CREATE POLICY receipts_read_workspace_members ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM workspace_members WHERE user_id = auth.uid()
    )
  );

NOTIFY pgrst, 'reload schema';
