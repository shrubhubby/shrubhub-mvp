-- ============================================================================
-- ShrubHub Database Creation Script for Supabase
-- Version: 1.0 (MVP)
-- Database: PostgreSQL (via Supabase)
-- Generated: 2025-12-05
-- 
-- IMPORTANT: Run this script in the Supabase SQL Editor
-- Tables are created in order respecting foreign key dependencies
-- ============================================================================

-- ============================================================================
-- EXTENSIONS (if needed)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE; -- For geospatial queries

-- ============================================================================
-- TABLE 1: gardeners (User Accounts)
-- ============================================================================
CREATE TABLE gardeners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication (managed by Supabase Auth)
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    
    -- Location for weather/hardiness zone
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_description TEXT, -- e.g., "Portland, OR"
    hardiness_zone TEXT, -- e.g., "8b"
    timezone TEXT DEFAULT 'UTC',
    
    -- Preferences
    measurement_system TEXT DEFAULT 'imperial' CHECK (measurement_system IN ('imperial', 'metric')),
    notification_preferences JSONB DEFAULT '{"reminders": true, "tips": true, "achievements": false}',
    
    -- Bot personality preferences (for future customization)
    bot_personality_settings JSONB DEFAULT '{"formality": "casual", "verbosity": "balanced"}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ
);

-- Indexes for gardeners
CREATE INDEX idx_gardeners_auth_user_id ON gardeners(auth_user_id);
CREATE INDEX idx_gardeners_location ON gardeners USING GIST (
    ll_to_earth(location_lat, location_lng)
) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- ============================================================================
-- TABLE 2: gardens
-- ============================================================================
CREATE TABLE gardens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ownership
    gardener_id UUID NOT NULL REFERENCES gardeners(id) ON DELETE CASCADE,
    
    -- Garden details
    name TEXT NOT NULL,
    description TEXT,
    
    -- Garden type
    garden_type TEXT DEFAULT 'mixed' CHECK (garden_type IN (
        'indoor',
        'outdoor',
        'container',
        'raised_bed',
        'in_ground',
        'greenhouse',
        'community_plot',
        'mixed'
    )),
    
    -- Location (can override gardener's default location)
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_description TEXT, -- e.g., "backyard raised bed", "south-facing window"
    
    -- Environment characteristics
    sun_exposure TEXT CHECK (sun_exposure IN ('full_sun', 'partial_shade', 'full_shade', 'varies')),
    soil_type TEXT, -- e.g., "clay", "sandy", "loam"
    
    -- Metadata
    is_primary BOOLEAN DEFAULT true, -- For MVP, this is always true
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ, -- Gardens can be archived without deletion
    
    -- Constraints
    UNIQUE(gardener_id, name)
);

-- Indexes for gardens
CREATE INDEX idx_gardens_gardener_id ON gardens(gardener_id);
CREATE INDEX idx_gardens_active ON gardens(gardener_id) WHERE archived_at IS NULL;

-- ============================================================================
-- TABLE 3: plants_master (Species Reference Data)
-- ============================================================================
CREATE TABLE plants_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    scientific_name TEXT UNIQUE NOT NULL,
    common_names TEXT[] NOT NULL, -- Array of common names
    family TEXT, -- e.g., "Solanaceae"
    
    -- Characteristics
    plant_type TEXT CHECK (plant_type IN (
        'vegetable',
        'herb',
        'fruit',
        'flower',
        'tree',
        'shrub',
        'succulent',
        'vine',
        'grass',
        'fern',
        'other'
    )),
    
    -- Care guide data (from Plant.id, USDA, scraped sources)
    care_guide JSONB, -- Structured care information
    
    -- Growing information
    hardiness_zones TEXT[], -- e.g., ["8", "9", "10"]
    growth_rate TEXT CHECK (growth_rate IN ('slow', 'moderate', 'fast')),
    mature_height_inches INT,
    mature_width_inches INT,
    
    -- Additional metadata
    native_region TEXT,
    edibility BOOLEAN DEFAULT false,
    
    -- Data sources
    data_sources JSONB, -- Track where information came from
    external_ids JSONB, -- IDs from other systems
    
    -- Media
    default_image_url TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ
);

-- Indexes for plants_master
CREATE INDEX idx_plants_master_scientific_name ON plants_master(scientific_name);
CREATE INDEX idx_plants_master_common_names ON plants_master USING GIN(common_names);
CREATE INDEX idx_plants_master_plant_type ON plants_master(plant_type);

-- Full text search on names
CREATE INDEX idx_plants_master_search ON plants_master USING GIN(
    to_tsvector('english',
        scientific_name || ' ' || array_to_string(common_names, ' ')
    )
);

-- ============================================================================
-- TABLE 4: plants (Individual Plant Instances)
-- ============================================================================
CREATE TABLE plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    garden_id UUID NOT NULL REFERENCES gardens(id) ON DELETE CASCADE,
    plant_master_id UUID REFERENCES plants_master(id) ON DELETE SET NULL,
    parent_plant_id UUID REFERENCES plants(id) ON DELETE SET NULL, -- For propagation tracking
    
    -- Identification
    common_name TEXT NOT NULL, -- User can override species common name
    custom_name TEXT, -- e.g., "Frank the Fern", "Big Bertha Tomato"
    
    -- Location within garden
    location_in_garden TEXT, -- e.g., "south raised bed, left side"
    location_lat DECIMAL(10, 8), -- Precise GPS if available
    location_lng DECIMAL(11, 8),
    
    -- Acquisition information
    acquired_date DATE NOT NULL,
    acquisition_source TEXT CHECK (acquisition_source IN (
        'seed',
        'seedling_purchased',
        'mature_purchased',
        'gift',
        'propagation',
        'field_extraction',
        'volunteer', -- Self-seeded
        'unknown'
    )),
    acquisition_location TEXT, -- e.g., "Home Depot", "neighbor", "wild"
    acquisition_notes TEXT,
    
    -- Current status
    status TEXT DEFAULT 'alive' CHECK (status IN (
        'seed',
        'germinating',
        'seedling',
        'vegetative',
        'flowering',
        'fruiting',
        'dormant',
        'alive',
        'struggling',
        'dead',
        'harvested',
        'adopted_out'
    )),
    
    health_status TEXT DEFAULT 'healthy' CHECK (health_status IN (
        'healthy',
        'needs_attention',
        'sick',
        'pest_issue',
        'dead'
    )),
    
    -- Stage/maturity tracking
    planted_date DATE, -- Different from acquired if bought as seedling
    first_bloom_date DATE,
    first_harvest_date DATE,
    
    -- Care preferences (override species defaults)
    care_override JSONB, -- User can customize care for this specific plant
    
    -- Field extraction specific data (future feature)
    field_extraction_data JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ, -- Plant moved, died, or adopted out
    
    -- Search
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english',
            coalesce(custom_name, '') || ' ' ||
            coalesce(common_name, '') || ' ' ||
            coalesce(location_in_garden, '')
        )
    ) STORED
);

-- Indexes for plants
CREATE INDEX idx_plants_garden_id ON plants(garden_id);
CREATE INDEX idx_plants_plant_master_id ON plants(plant_master_id);
CREATE INDEX idx_plants_status ON plants(status) WHERE archived_at IS NULL;
CREATE INDEX idx_plants_health ON plants(health_status) WHERE archived_at IS NULL;
CREATE INDEX idx_plants_parent ON plants(parent_plant_id) WHERE parent_plant_id IS NOT NULL;
CREATE INDEX idx_plants_search ON plants USING GIN(search_vector);

-- Active plants view helper
CREATE INDEX idx_plants_active ON plants(garden_id)
    WHERE archived_at IS NULL AND status NOT IN ('dead', 'adopted_out');

-- ============================================================================
-- TABLE 5: plant_photos
-- ============================================================================
CREATE TABLE plant_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    
    -- Storage (Supabase Storage)
    storage_bucket TEXT NOT NULL DEFAULT 'plant-photos',
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    thumbnail_path TEXT, -- Optimized thumbnail
    
    -- Photo metadata
    taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    file_size_bytes INT,
    mime_type TEXT,
    
    -- Photo context
    photo_type TEXT DEFAULT 'general' CHECK (photo_type IN (
        'identification', -- Initial photo for ID
        'general',
        'progress',
        'issue', -- Problem documentation
        'bloom',
        'harvest',
        'before_after'
    )),
    
    caption TEXT,
    
    -- AI analysis results
    identification_data JSONB,
    
    -- Display
    is_primary BOOLEAN DEFAULT false, -- Main photo for plant profile
    display_order INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for plant_photos
CREATE INDEX idx_plant_photos_plant_id ON plant_photos(plant_id);
CREATE INDEX idx_plant_photos_taken_at ON plant_photos(taken_at DESC);
CREATE INDEX idx_plant_photos_primary ON plant_photos(plant_id, is_primary) WHERE is_primary = true;

-- Ensure only one primary photo per plant
CREATE UNIQUE INDEX idx_plant_photos_one_primary
    ON plant_photos(plant_id)
    WHERE is_primary = true;

-- ============================================================================
-- TABLE 6: activities
-- ============================================================================
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'watering',
        'fertilizing',
        'pruning',
        'repotting',
        'transplanting',
        'harvesting',
        'treating_pests',
        'treating_disease',
        'staking',
        'mulching',
        'soil_amendment',
        'deadheading',
        'thinning',
        'germination',
        'other'
    )),
    
    -- Activity data
    notes TEXT,
    quantity DECIMAL(10, 2), -- e.g., "2.5 gallons water", "1 cup fertilizer"
    quantity_unit TEXT, -- e.g., "gallons", "cups", "ounces"
    
    product_used TEXT, -- e.g., "Miracle-Gro All Purpose"
    
    -- Timing
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_minutes INT, -- How long it took
    
    -- Source tracking
    created_via TEXT DEFAULT 'manual' CHECK (created_via IN (
        'manual', -- User directly logged
        'bot', -- Via conversation
        'reminder', -- Completed from reminder
        'auto', -- Future: IoT sensor auto-log
        'import' -- Bulk import
    )),
    
    -- Reminder connection (FK added after care_reminders table exists)
    reminder_id UUID,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activities
CREATE INDEX idx_activities_plant_id ON activities(plant_id);
CREATE INDEX idx_activities_performed_at ON activities(performed_at DESC);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_recent ON activities(plant_id, performed_at DESC);

-- ============================================================================
-- TABLE 7: observations
-- ============================================================================
CREATE TABLE observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    
    -- Observation content
    observation_text TEXT NOT NULL,
    
    -- Sentiment analysis (from AI)
    sentiment TEXT CHECK (sentiment IN (
        'positive',   -- "Looking great!"
        'neutral',    -- "No change"
        'concerned',  -- "Leaves yellowing"
        'negative'    -- "Plant dying"
    )),
    
    -- Associated media
    photo_id UUID REFERENCES plant_photos(id) ON DELETE SET NULL,
    
    -- Issues detected (for tracking problems over time)
    tags TEXT[], -- e.g., ["yellowing_leaves", "drooping", "new_growth"]
    
    -- Timing
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Source
    created_via TEXT DEFAULT 'manual' CHECK (created_via IN (
        'manual',
        'bot',
        'prompt' -- System prompted user to observe
    )),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for observations
CREATE INDEX idx_observations_plant_id ON observations(plant_id);
CREATE INDEX idx_observations_observed_at ON observations(observed_at DESC);
CREATE INDEX idx_observations_sentiment ON observations(sentiment);
CREATE INDEX idx_observations_tags ON observations USING GIN(tags);

-- Full text search on observations
CREATE INDEX idx_observations_search ON observations USING GIN(
    to_tsvector('english', observation_text)
);

-- ============================================================================
-- TABLE 8: care_reminders
-- ============================================================================
CREATE TABLE care_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    
    -- Reminder details
    reminder_type TEXT NOT NULL CHECK (reminder_type IN (
        'watering',
        'fertilizing',
        'pruning',
        'repotting',
        'checking',
        'harvesting',
        'custom'
    )),
    
    title TEXT NOT NULL, -- e.g., "Water tomato plants"
    description TEXT, -- AI-generated context
    
    -- Scheduling
    due_date DATE,
    due_time TIME, -- Optional specific time
    
    -- Recurrence (future enhancement)
    recurrence_rule TEXT, -- e.g., "FREQ=WEEKLY;INTERVAL=2" (RFC 5545)
    
    -- Priority
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',
        'completed',
        'snoozed',
        'dismissed',
        'expired'
    )),
    
    completed_at TIMESTAMPTZ,
    completed_activity_id UUID REFERENCES activities(id), -- Link to activity if completed
    
    -- Source
    created_by TEXT DEFAULT 'system' CHECK (created_by IN (
        'system',   -- AI-generated based on care needs
        'user',     -- User explicitly created
        'weather',  -- Weather-triggered (e.g., heavy rain, skip watering)
        'issue'     -- Created in response to observation
    )),
    
    -- Smart reminders (future)
    conditions JSONB, -- Weather conditions, plant state, etc.
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from activities to care_reminders now that both tables exist
ALTER TABLE activities 
    ADD CONSTRAINT fk_activities_reminder 
    FOREIGN KEY (reminder_id) 
    REFERENCES care_reminders(id) 
    ON DELETE SET NULL;

-- Indexes for care_reminders
CREATE INDEX idx_reminders_plant_id ON care_reminders(plant_id);
CREATE INDEX idx_reminders_due_date ON care_reminders(due_date) WHERE status = 'pending';
CREATE INDEX idx_reminders_status ON care_reminders(status);
CREATE INDEX idx_reminders_upcoming ON care_reminders(plant_id, due_date)
    WHERE status = 'pending' AND due_date >= CURRENT_DATE;

-- ============================================================================
-- TABLE 9: conversation_history
-- ============================================================================
CREATE TABLE conversation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    gardener_id UUID NOT NULL REFERENCES gardeners(id) ON DELETE CASCADE,
    
    -- Session tracking
    session_id UUID NOT NULL, -- Group related messages
    
    -- Message content
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    message_text TEXT NOT NULL,
    
    -- Context provided to AI
    context_data JSONB,
    
    -- Function calls (OpenAI/Claude function calling)
    function_calls JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Token usage tracking (for cost monitoring)
    tokens_used INT,
    model_used TEXT -- e.g., "claude-3-sonnet", "gpt-4"
);

-- Indexes for conversation_history
CREATE INDEX idx_conversation_gardener ON conversation_history(gardener_id);
CREATE INDEX idx_conversation_session ON conversation_history(session_id, created_at);
CREATE INDEX idx_conversation_recent ON conversation_history(gardener_id, created_at DESC);

-- ============================================================================
-- FUTURE TABLES (Phase 2+) - Commented out for MVP
-- ============================================================================

-- garden_members (Co-gardeners - Phase 2+)
/*
CREATE TABLE garden_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    garden_id UUID NOT NULL REFERENCES gardens(id) ON DELETE CASCADE,
    gardener_id UUID NOT NULL REFERENCES gardeners(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'co_gardener', 'viewer')),
    permissions JSONB DEFAULT '{"can_add_plants": true, "can_edit": true, "can_delete": false}',
    invited_by UUID REFERENCES gardeners(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(garden_id, gardener_id)
);
*/

-- propagation_events (Propagation Tracking - Phase 6)
/*
CREATE TABLE propagation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_plant_id UUID NOT NULL REFERENCES plants(id),
    child_plant_id UUID NOT NULL REFERENCES plants(id),
    method TEXT CHECK (method IN ('cutting', 'seed', 'division', 'layering', 'grafting')),
    propagation_date DATE NOT NULL,
    success_rate DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
*/

-- marketplace_listings (Phase 8)
/*
CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID REFERENCES plants(id),
    gardener_id UUID NOT NULL REFERENCES gardeners(id),
    listing_type TEXT CHECK (listing_type IN ('sale', 'trade', 'free', 'adoption')),
    price_cents INT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
*/

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active Plants by Garden
CREATE VIEW v_active_plants AS
SELECT
    p.*,
    g.name as garden_name,
    g.gardener_id,
    pm.scientific_name,
    pm.care_guide,
    (
        SELECT storage_path
        FROM plant_photos pp
        WHERE pp.plant_id = p.id AND pp.is_primary = true
        LIMIT 1
    ) as primary_photo
FROM plants p
JOIN gardens g ON p.garden_id = g.id
LEFT JOIN plants_master pm ON p.plant_master_id = pm.id
WHERE p.archived_at IS NULL
    AND p.status NOT IN ('dead', 'adopted_out');

-- Recent Activity Summary
CREATE VIEW v_recent_activities AS
SELECT
    a.id,
    a.plant_id,
    p.custom_name,
    p.common_name,
    a.activity_type,
    a.notes,
    a.performed_at,
    g.gardener_id
FROM activities a
JOIN plants p ON a.plant_id = p.id
JOIN gardens g ON p.garden_id = g.id
WHERE a.performed_at >= NOW() - INTERVAL '30 days'
ORDER BY a.performed_at DESC;

-- Upcoming Reminders
CREATE VIEW v_upcoming_reminders AS
SELECT
    r.id,
    r.plant_id,
    p.custom_name,
    p.common_name,
    r.reminder_type,
    r.title,
    r.due_date,
    r.priority,
    g.gardener_id
FROM care_reminders r
JOIN plants p ON r.plant_id = p.id
JOIN gardens g ON p.garden_id = g.id
WHERE r.status = 'pending'
    AND r.due_date >= CURRENT_DATE
    AND r.due_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY r.due_date, r.priority DESC;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE gardeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE gardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: gardeners
-- ============================================================================
CREATE POLICY "gardeners_select_own"
ON gardeners FOR SELECT
USING (auth.uid() = auth_user_id);

CREATE POLICY "gardeners_update_own"
ON gardeners FOR UPDATE
USING (auth.uid() = auth_user_id);

CREATE POLICY "gardeners_insert_own"
ON gardeners FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "gardeners_delete_own"
ON gardeners FOR DELETE
USING (auth.uid() = auth_user_id);

-- ============================================================================
-- RLS POLICIES: gardens
-- ============================================================================
CREATE POLICY "gardens_select_own"
ON gardens FOR SELECT
USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
));

CREATE POLICY "gardens_insert_own"
ON gardens FOR INSERT
WITH CHECK (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
));

CREATE POLICY "gardens_update_own"
ON gardens FOR UPDATE
USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
));

CREATE POLICY "gardens_delete_own"
ON gardens FOR DELETE
USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
));

-- ============================================================================
-- RLS POLICIES: plants_master (reference data - read only for all users)
-- ============================================================================
CREATE POLICY "plants_master_select_all"
ON plants_master FOR SELECT
USING (true);

-- ============================================================================
-- RLS POLICIES: plants
-- ============================================================================
CREATE POLICY "plants_select_own"
ON plants FOR SELECT
USING (garden_id IN (
    SELECT id FROM gardens WHERE gardener_id IN (
        SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
    )
));

CREATE POLICY "plants_insert_own"
ON plants FOR INSERT
WITH CHECK (garden_id IN (
    SELECT id FROM gardens WHERE gardener_id IN (
        SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
    )
));

CREATE POLICY "plants_update_own"
ON plants FOR UPDATE
USING (garden_id IN (
    SELECT id FROM gardens WHERE gardener_id IN (
        SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
    )
));

CREATE POLICY "plants_delete_own"
ON plants FOR DELETE
USING (garden_id IN (
    SELECT id FROM gardens WHERE gardener_id IN (
        SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
    )
));

-- ============================================================================
-- RLS POLICIES: plant_photos
-- ============================================================================
CREATE POLICY "plant_photos_select_own"
ON plant_photos FOR SELECT
USING (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

CREATE POLICY "plant_photos_insert_own"
ON plant_photos FOR INSERT
WITH CHECK (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

CREATE POLICY "plant_photos_update_own"
ON plant_photos FOR UPDATE
USING (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

CREATE POLICY "plant_photos_delete_own"
ON plant_photos FOR DELETE
USING (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

-- ============================================================================
-- RLS POLICIES: activities
-- ============================================================================
CREATE POLICY "activities_select_own"
ON activities FOR SELECT
USING (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

CREATE POLICY "activities_insert_own"
ON activities FOR INSERT
WITH CHECK (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

CREATE POLICY "activities_update_own"
ON activities FOR UPDATE
USING (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

CREATE POLICY "activities_delete_own"
ON activities FOR DELETE
USING (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

-- ============================================================================
-- RLS POLICIES: observations
-- ============================================================================
CREATE POLICY "observations_select_own"
ON observations FOR SELECT
USING (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

CREATE POLICY "observations_insert_own"
ON observations FOR INSERT
WITH CHECK (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

CREATE POLICY "observations_update_own"
ON observations FOR UPDATE
USING (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

CREATE POLICY "observations_delete_own"
ON observations FOR DELETE
USING (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

-- ============================================================================
-- RLS POLICIES: care_reminders
-- ============================================================================
CREATE POLICY "care_reminders_select_own"
ON care_reminders FOR SELECT
USING (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

CREATE POLICY "care_reminders_insert_own"
ON care_reminders FOR INSERT
WITH CHECK (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

CREATE POLICY "care_reminders_update_own"
ON care_reminders FOR UPDATE
USING (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

CREATE POLICY "care_reminders_delete_own"
ON care_reminders FOR DELETE
USING (plant_id IN (
    SELECT id FROM plants WHERE garden_id IN (
        SELECT id FROM gardens WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    )
));

-- ============================================================================
-- RLS POLICIES: conversation_history
-- ============================================================================
CREATE POLICY "conversation_history_select_own"
ON conversation_history FOR SELECT
USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
));

CREATE POLICY "conversation_history_insert_own"
ON conversation_history FOR INSERT
WITH CHECK (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
));

CREATE POLICY "conversation_history_update_own"
ON conversation_history FOR UPDATE
USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
));

CREATE POLICY "conversation_history_delete_own"
ON conversation_history FOR DELETE
USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
));

-- ============================================================================
-- TRIGGER FUNCTIONS for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_gardeners_updated_at
    BEFORE UPDATE ON gardeners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gardens_updated_at
    BEFORE UPDATE ON gardens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plants_master_updated_at
    BEFORE UPDATE ON plants_master
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plants_updated_at
    BEFORE UPDATE ON plants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_reminders_updated_at
    BEFORE UPDATE ON care_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Sample plants_master entries (optional)
-- ============================================================================
INSERT INTO plants_master (scientific_name, common_names, care_guide, plant_type, hardiness_zones, growth_rate, edibility)
VALUES
    ('Solanum lycopersicum', ARRAY['Tomato', 'Garden Tomato'], 
     '{"watering": {"frequency": "twice_weekly", "amount": "moderate"}, "sunlight": "full_sun", "temperature": {"min_f": 50, "max_f": 85}}',
     'vegetable', ARRAY['4', '5', '6', '7', '8', '9', '10', '11'], 'fast', true),
    
    ('Monstera deliciosa', ARRAY['Monstera', 'Swiss Cheese Plant'], 
     '{"watering": {"frequency": "weekly", "amount": "moderate"}, "sunlight": "indirect", "temperature": {"min_f": 60, "max_f": 80}}',
     'other', ARRAY['10', '11', '12'], 'moderate', false),
    
    ('Ocimum basilicum', ARRAY['Basil', 'Sweet Basil'], 
     '{"watering": {"frequency": "daily", "amount": "light"}, "sunlight": "full_sun", "temperature": {"min_f": 50, "max_f": 90}}',
     'herb', ARRAY['4', '5', '6', '7', '8', '9', '10', '11'], 'fast', true),
    
    ('Mentha spicata', ARRAY['Spearmint', 'Mint'], 
     '{"watering": {"frequency": "twice_weekly", "amount": "moderate"}, "sunlight": "partial_shade", "temperature": {"min_f": 40, "max_f": 90}}',
     'herb', ARRAY['3', '4', '5', '6', '7', '8', '9', '10', '11'], 'fast', true),
    
    ('Capsicum annuum', ARRAY['Bell Pepper', 'Sweet Pepper', 'Pepper'], 
     '{"watering": {"frequency": "twice_weekly", "amount": "moderate"}, "sunlight": "full_sun", "temperature": {"min_f": 60, "max_f": 85}}',
     'vegetable', ARRAY['4', '5', '6', '7', '8', '9', '10', '11'], 'moderate', true);

-- ============================================================================
-- GRANT PERMISSIONS (for service role access if needed)
-- ============================================================================
-- Note: In Supabase, the service_role has full access by default
-- These grants are for completeness

-- ============================================================================
-- STORAGE BUCKET SETUP (run in Supabase dashboard or via API)
-- ============================================================================
-- Note: Storage buckets need to be created via Supabase dashboard or API
-- Bucket name: 'plant-photos'
-- Public access: false (use signed URLs)

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- 
-- Next Steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Create storage bucket 'plant-photos' in Supabase Storage
-- 3. Configure storage policies for the bucket
-- 4. Test with a sample user
-- ============================================================================
