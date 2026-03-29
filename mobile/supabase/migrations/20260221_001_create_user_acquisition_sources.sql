-- Migration: Create user_acquisition_sources table
-- Description: Stores user-defined acquisition sources for plants
-- Date: 2026-02-21

-- Create the table
CREATE TABLE IF NOT EXISTS user_acquisition_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gardener_id UUID NOT NULL REFERENCES gardeners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(gardener_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_acquisition_sources_gardener_id
  ON user_acquisition_sources(gardener_id);
CREATE INDEX IF NOT EXISTS idx_user_acquisition_sources_usage
  ON user_acquisition_sources(gardener_id, usage_count DESC);

-- Enable RLS
ALTER TABLE user_acquisition_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can manage their own acquisition sources
CREATE POLICY "Users can view own acquisition sources"
  ON user_acquisition_sources FOR SELECT
  USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own acquisition sources"
  ON user_acquisition_sources FOR INSERT
  WITH CHECK (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update own acquisition sources"
  ON user_acquisition_sources FOR UPDATE
  USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own acquisition sources"
  ON user_acquisition_sources FOR DELETE
  USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
  ));

-- Admin policy: Admins can view all user-submitted sources
CREATE POLICY "Admins can view all acquisition sources"
  ON user_acquisition_sources FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_user_acquisition_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_acquisition_sources_updated_at
  BEFORE UPDATE ON user_acquisition_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_user_acquisition_sources_updated_at();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_acquisition_source_usage(source_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_acquisition_sources
  SET usage_count = usage_count + 1
  WHERE id = source_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
