-- ============================================================
-- AI Infrastructure Tables
-- ai_predictions: logs every AI call for training data
-- whatsapp_links: phone-to-workspace linking
-- whatsapp_messages: inbound/outbound message log
-- knowledge_updates: tax news fetched by cron
-- ============================================================

-- AI Predictions (training data collection)
CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  input_hash TEXT,
  input_data JSONB NOT NULL,
  prediction JSONB NOT NULL,
  confidence FLOAT,
  model TEXT NOT NULL,
  prompt_version TEXT,
  needs_review BOOLEAN DEFAULT FALSE,
  -- Human correction fields
  was_corrected BOOLEAN DEFAULT FALSE,
  corrected_data JSONB,
  correction_timestamp TIMESTAMPTZ,
  correction_type TEXT,
  -- Token usage
  input_tokens INTEGER,
  output_tokens INTEGER,
  -- Metadata
  jurisdiction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_predictions_feature ON ai_predictions (feature, was_corrected);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created ON ai_predictions (created_at, jurisdiction);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_hash ON ai_predictions (input_hash);

ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own predictions" ON ai_predictions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on ai_predictions" ON ai_predictions
  FOR ALL USING (auth.role() = 'service_role');

-- WhatsApp Links
CREATE TABLE IF NOT EXISTS whatsapp_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verification_code TEXT,
  code_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_links_phone ON whatsapp_links (phone_number, verified);
CREATE INDEX IF NOT EXISTS idx_whatsapp_links_workspace ON whatsapp_links (workspace_id);

ALTER TABLE whatsapp_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own whatsapp links" ON whatsapp_links
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on whatsapp_links" ON whatsapp_links
  FOR ALL USING (auth.role() = 'service_role');

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT DEFAULT 'text',
  body TEXT,
  media_url TEXT,
  status TEXT DEFAULT 'pending',
  twilio_sid TEXT,
  ai_extraction JSONB,
  transaction_id UUID,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_workspace ON whatsapp_messages (workspace_id, created_at DESC);

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on whatsapp_messages" ON whatsapp_messages
  FOR ALL USING (auth.role() = 'service_role');

-- Knowledge Updates (tax news from cron)
CREATE TABLE IF NOT EXISTS knowledge_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  category TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_updates_fetched ON knowledge_updates (fetched_at DESC);

ALTER TABLE knowledge_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read knowledge_updates" ON knowledge_updates
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service role full access on knowledge_updates" ON knowledge_updates
  FOR ALL USING (auth.role() = 'service_role');
