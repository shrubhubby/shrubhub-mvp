-- Migration: Create plant_registration_batches table
-- Description: Tracks bulk plant registration sessions
-- Date: 2026-02-21

-- Create the table
CREATE TABLE IF NOT EXISTS plant_registration_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gardener_id UUID NOT NULL REFERENCES gardeners(id) ON DELETE CASCADE,
  garden_id UUID REFERENCES gardens(id) ON DELETE SET NULL,
  parent_plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,

  -- Batch metadata
  batch_type TEXT NOT NULL CHECK (batch_type IN ('clone', 'seed', 'purchase', 'mixed')),
  total_count INTEGER NOT NULL,
  registered_count INTEGER DEFAULT 0,

  -- Photo method used for registration
  photo_method TEXT CHECK (photo_method IN ('group_photo', 'individual', 'qr_scan', 'no_photo')),

  -- Status tracking
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),

  -- Store any additional metadata (AI crop results, etc.)
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Constraint: registered_count should not exceed total_count
  CONSTRAINT check_registered_count CHECK (registered_count <= total_count)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plant_registration_batches_gardener
  ON plant_registration_batches(gardener_id);
CREATE INDEX IF NOT EXISTS idx_plant_registration_batches_status
  ON plant_registration_batches(status);
CREATE INDEX IF NOT EXISTS idx_plant_registration_batches_parent_plant
  ON plant_registration_batches(parent_plant_id);

-- Enable RLS
ALTER TABLE plant_registration_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own registration batches"
  ON plant_registration_batches FOR SELECT
  USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own registration batches"
  ON plant_registration_batches FOR INSERT
  WITH CHECK (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update own registration batches"
  ON plant_registration_batches FOR UPDATE
  USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own registration batches"
  ON plant_registration_batches FOR DELETE
  USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
  ));

-- Add foreign key reference from plants table
ALTER TABLE plants ADD CONSTRAINT fk_plants_registration_batch
  FOREIGN KEY (registration_batch_id) REFERENCES plant_registration_batches(id)
  ON DELETE SET NULL;

-- Function to auto-complete batch when all plants registered
CREATE OR REPLACE FUNCTION check_batch_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a plant is inserted with a registration_batch_id, increment the count
  IF TG_OP = 'INSERT' AND NEW.registration_batch_id IS NOT NULL THEN
    UPDATE plant_registration_batches
    SET
      registered_count = registered_count + 1,
      completed_at = CASE
        WHEN registered_count + 1 >= total_count THEN now()
        ELSE completed_at
      END,
      status = CASE
        WHEN registered_count + 1 >= total_count THEN 'completed'
        ELSE status
      END
    WHERE id = NEW.registration_batch_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_batch_completion
  AFTER INSERT ON plants
  FOR EACH ROW
  EXECUTE FUNCTION check_batch_completion();

-- Add comments
COMMENT ON TABLE plant_registration_batches IS 'Tracks bulk plant registration sessions (clones, seeds, etc.)';
COMMENT ON COLUMN plant_registration_batches.photo_method IS 'How photos were captured: group_photo, individual, qr_scan, or no_photo';
COMMENT ON COLUMN plant_registration_batches.metadata IS 'JSON storage for AI results, crop bounds, etc.';
