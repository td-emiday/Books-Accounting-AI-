-- Admin Infrastructure Migration
-- Adds superadmin support, audit logging, system settings, and workspace suspension

-- 1. Add superadmin flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT FALSE;

-- 2. Add suspension fields to workspaces
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- 3. Create admin audit logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES profiles(id),
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   TEXT,
  metadata    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON admin_audit_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON admin_audit_logs(target_type, target_id);

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create system settings table (key-value store)
CREATE TABLE IF NOT EXISTS system_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_by  UUID REFERENCES profiles(id),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system settings" ON system_settings
  FOR SELECT USING (true);

-- 5. Seed default system settings
INSERT INTO system_settings (key, value) VALUES
  ('maintenance_mode', '{"enabled": false, "message": ""}'),
  ('announcement_banner', '{"enabled": false, "message": "", "type": "info"}'),
  ('feature_flags', '{"whatsapp_integration": true, "ai_chat": true, "bank_import": true}')
ON CONFLICT (key) DO NOTHING;
