-- Migration: Add 'inventory' to batch_type constraint
-- Description: Supports garden inventory walk-through mode
-- Date: 2026-04-05

ALTER TABLE plant_registration_batches
  DROP CONSTRAINT IF EXISTS plant_registration_batches_batch_type_check;

ALTER TABLE plant_registration_batches
  ADD CONSTRAINT plant_registration_batches_batch_type_check
  CHECK (batch_type IN ('clone', 'seed', 'purchase', 'mixed', 'inventory'));
