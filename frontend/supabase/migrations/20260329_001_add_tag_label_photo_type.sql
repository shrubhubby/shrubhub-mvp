-- Add 'tag_label' to the plant_photos photo_type enum
-- This type is used for photos of plant tags, labels, or packaging
-- that contain care instructions from producers/growers.
ALTER TYPE photo_type ADD VALUE IF NOT EXISTS 'tag_label' AFTER 'identification';
