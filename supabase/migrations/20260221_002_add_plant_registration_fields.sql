-- Migration: Add plant registration fields
-- Description: Adds columns to plants table for enhanced registration
-- Date: 2026-02-21

-- Add shrubhub_exchange and user_defined to acquisition_source enum
-- First, drop and recreate the constraint with new values
ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_acquisition_source_check;
ALTER TABLE plants ADD CONSTRAINT plants_acquisition_source_check
  CHECK (acquisition_source IN (
    'seed', 'seedling_purchased', 'mature_purchased', 'gift',
    'propagation', 'field_extraction', 'volunteer', 'unknown',
    'shrubhub_exchange', 'user_defined'
  ));

-- Add new columns for enhanced plant registration
ALTER TABLE plants ADD COLUMN IF NOT EXISTS user_acquisition_source_id UUID
  REFERENCES user_acquisition_sources(id) ON DELETE SET NULL;

-- Clone tracking: sequential number within a batch (Clone #1, #2, etc.)
ALTER TABLE plants ADD COLUMN IF NOT EXISTS clone_number INTEGER;

-- User-editable ID: can be set from QR code, user input, or auto-generated
ALTER TABLE plants ADD COLUMN IF NOT EXISTS editable_id TEXT;

-- Registration batch reference: links plants created in same bulk registration
ALTER TABLE plants ADD COLUMN IF NOT EXISTS registration_batch_id UUID;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_plants_user_acquisition_source
  ON plants(user_acquisition_source_id);
CREATE INDEX IF NOT EXISTS idx_plants_registration_batch
  ON plants(registration_batch_id);
CREATE INDEX IF NOT EXISTS idx_plants_editable_id
  ON plants(editable_id);
CREATE INDEX IF NOT EXISTS idx_plants_parent_plant
  ON plants(parent_plant_id);

-- Add comment documentation
COMMENT ON COLUMN plants.user_acquisition_source_id IS 'Reference to user-defined acquisition source when acquisition_source is user_defined';
COMMENT ON COLUMN plants.clone_number IS 'Sequential number for clones in a batch (e.g., Clone #1, #2)';
COMMENT ON COLUMN plants.editable_id IS 'User-assignable ID, can be from QR code, label, or manual input';
COMMENT ON COLUMN plants.registration_batch_id IS 'Links plants created in same bulk registration session';
