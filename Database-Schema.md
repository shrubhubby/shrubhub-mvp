# ShrubHub Database Schema

**Version:** 1.0 (MVP)
**Database:** PostgreSQL (via Supabase)
**Last Updated:** 2025-12-04

---

## Design Principles

**1. Start Simple, Design for Growth**
- MVP supports single gardener, single garden
- Schema designed to easily support multiple gardens and co-gardeners later
- No premature optimization

**2. Normalize for Data Integrity**
- Separate plant instances from plant species data
- Activities and observations as separate entities for flexibility
- Clear relationships with foreign keys

**3. Rich Context for AI**
- Store conversation history for continuity
- Capture metadata that AI can use (timestamps, locations, weather)
- Enable natural language queries

**4. Performance Considerations**
- Indexes on frequently queried fields
- Efficient querying of user's plants and recent activities
- Photo storage optimized with Supabase Storage (not in DB)

---

## Entity Relationship Overview

```
gardeners (users)
    |
    └── gardens (1:many)
            |
            ├── plants (1:many)
            |       |
            |       ├── plant_photos (1:many)
            |       ├── activities (1:many)
            |       ├── observations (1:many)
            |       ├── care_reminders (1:many)
            |       └── plant_master (many:1)
            |
            └── garden_photos (1:many)

plants_master (reference data)
    |
    └── plants (1:many)

conversation_history
    |
    └── gardeners (many:1)
```

---

## Core Tables (MVP)

### 1. `gardeners` (User Accounts)

**Purpose:** Store user account information and preferences

```sql
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

-- Indexes
CREATE INDEX idx_gardeners_auth_user_id ON gardeners(auth_user_id);
CREATE INDEX idx_gardeners_location ON gardeners USING GIST (
    ll_to_earth(location_lat, location_lng)
) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;
```

**Design Decisions:**
- `auth_user_id` links to Supabase Auth (separates auth from profile data)
- Location stored as lat/lng for weather API queries and future proximity features
- JSONB for preferences allows flexibility without schema changes
- Soft delete with `deleted_at` preserves data for potential restoration

---

### 2. `gardens`

**Purpose:** Represent physical garden spaces (MVP: one per user, but supports multiple)

```sql
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

-- Indexes
CREATE INDEX idx_gardens_gardener_id ON gardens(gardener_id);
CREATE INDEX idx_gardens_active ON gardens(gardener_id) WHERE archived_at IS NULL;
```

**Design Decisions:**
- Even though MVP is single garden, schema supports multiple
- `is_primary` allows future UI to have a "main" garden
- Garden can have its own location (community garden elsewhere)
- `archived_at` instead of delete preserves history

---

### 3. `plants_master` (Species Reference Data)

**Purpose:** Store species-level information (care guides, characteristics)

```sql
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
    /*
    Example structure:
    {
        "watering": {
            "frequency": "twice_weekly",
            "amount": "moderate",
            "notes": "Allow soil to dry between waterings"
        },
        "sunlight": "full_sun",
        "temperature": {"min_f": 50, "max_f": 85},
        "soil": {"ph_min": 6.0, "ph_max": 7.0, "type": "well_draining"},
        "fertilizing": {"frequency": "monthly", "type": "balanced"},
        "pruning": "as_needed",
        "toxicity": {"pets": true, "humans": false}
    }
    */

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
    /*
    {
        "plant_id": {"id": "xyz", "confidence": 0.95},
        "usda": {"url": "https://..."},
        "manual_override": false
    }
    */

    external_ids JSONB, -- IDs from other systems
    /*
    {
        "plant_id": "abc123",
        "usda_symbol": "SOLY",
        "inaturalist": 456789
    }
    */

    -- Media
    default_image_url TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_plants_master_scientific_name ON plants_master(scientific_name);
CREATE INDEX idx_plants_master_common_names ON plants_master USING GIN(common_names);
CREATE INDEX idx_plants_master_plant_type ON plants_master(plant_type);

-- Full text search on names
CREATE INDEX idx_plants_master_search ON plants_master USING GIN(
    to_tsvector('english',
        scientific_name || ' ' || array_to_string(common_names, ' ')
    )
);
```

**Design Decisions:**
- Separate table from plant instances (one species, many instances)
- JSONB for care guide allows flexible, hierarchical data
- Arrays for common names and hardiness zones (natural fit)
- Full-text search index for plant identification queries
- `data_sources` tracks provenance for trust/updates

---

### 4. `plants` (Individual Plant Instances)

**Purpose:** Represent actual plants that gardeners are growing

```sql
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
    /*
    {
        "gps": {"lat": 45.5, "lng": -122.6},
        "habitat": "forest edge",
        "permission_status": "public_land",
        "photos": ["site_photo_url"],
        "notes": "Mother plant was 6ft tall"
    }
    */

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

-- Indexes
CREATE INDEX idx_plants_garden_id ON plants(garden_id);
CREATE INDEX idx_plants_plant_master_id ON plants(plant_master_id);
CREATE INDEX idx_plants_status ON plants(status) WHERE archived_at IS NULL;
CREATE INDEX idx_plants_health ON plants(health_status) WHERE archived_at IS NULL;
CREATE INDEX idx_plants_parent ON plants(parent_plant_id) WHERE parent_plant_id IS NOT NULL;
CREATE INDEX idx_plants_search ON plants USING GIN(search_vector);

-- Active plants view helper
CREATE INDEX idx_plants_active ON plants(garden_id)
    WHERE archived_at IS NULL AND status NOT IN ('dead', 'adopted_out');
```

**Design Decisions:**
- `custom_name` allows personalization ("Frank the Fern")
- Flexible `status` covers lifecycle stages
- `parent_plant_id` enables propagation lineage (future feature)
- Status vs health distinction (dormant but healthy vs. alive but sick)
- Generated `search_vector` for fast full-text search
- Acquisition tracking tells the plant's story

---

### 5. `plant_photos`

**Purpose:** Store plant photos with metadata

```sql
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
    /*
    From Plant.id API:
    {
        "species": "Solanum lycopersicum",
        "common_name": "Tomato",
        "confidence": 0.95,
        "suggestions": [...],
        "health_assessment": {...}
    }
    */

    -- Display
    is_primary BOOLEAN DEFAULT false, -- Main photo for plant profile
    display_order INT DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_plant_photos_plant_id ON plant_photos(plant_id);
CREATE INDEX idx_plant_photos_taken_at ON plant_photos(taken_at DESC);
CREATE INDEX idx_plant_photos_primary ON plant_photos(plant_id, is_primary) WHERE is_primary = true;

-- Ensure only one primary photo per plant
CREATE UNIQUE INDEX idx_plant_photos_one_primary
    ON plant_photos(plant_id)
    WHERE is_primary = true;
```

**Design Decisions:**
- Store path to Supabase Storage, not binary data in DB
- `photo_type` helps organize photos (identification vs. progress)
- `identification_data` stores Plant.id API response
- `is_primary` ensures each plant has a cover photo
- Unique index prevents multiple primary photos

---

### 6. `activities`

**Purpose:** Log care activities performed on plants

```sql
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

    -- Reminder connection
    reminder_id UUID, -- If this completed a reminder (FK added later)

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activities_plant_id ON activities(plant_id);
CREATE INDEX idx_activities_performed_at ON activities(performed_at DESC);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_recent ON activities(plant_id, performed_at DESC);
```

**Design Decisions:**
- Simple, flat structure for easy querying
- `created_via` tracks whether logged manually or through conversation
- Flexible `quantity` + `quantity_unit` for any measurement
- `performed_at` separate from `created_at` (backfill past activities)
- Most queries will be "recent activities for my plants"

---

### 7. `observations`

**Purpose:** Journal entries about plant observations

```sql
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

-- Indexes
CREATE INDEX idx_observations_plant_id ON observations(plant_id);
CREATE INDEX idx_observations_observed_at ON observations(observed_at DESC);
CREATE INDEX idx_observations_sentiment ON observations(sentiment);
CREATE INDEX idx_observations_tags ON observations USING GIN(tags);

-- Full text search on observations
CREATE INDEX idx_observations_search ON observations USING GIN(
    to_tsvector('english', observation_text)
);
```

**Design Decisions:**
- Separate from `activities` (observing vs. doing)
- `sentiment` helps AI understand plant trajectory
- `tags` allow structured searching (all yellowing issues)
- Full-text search for "When did I mention aphids?"
- Photo optional but linkable

---

### 8. `care_reminders`

**Purpose:** Scheduled and dynamic care reminders

```sql
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
    /*
    {
        "skip_if": {"recent_rain": true, "amount_inches": 0.5},
        "advance_if": {"temperature_f_above": 90}
    }
    */

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reminders_plant_id ON care_reminders(plant_id);
CREATE INDEX idx_reminders_due_date ON care_reminders(due_date) WHERE status = 'pending';
CREATE INDEX idx_reminders_status ON care_reminders(status);
CREATE INDEX idx_reminders_upcoming ON care_reminders(plant_id, due_date)
    WHERE status = 'pending' AND due_date >= CURRENT_DATE;
```

**Design Decisions:**
- Flexible enough for simple "water every 3 days" and complex weather-based rules
- `conditions` JSONB allows future smart reminders without schema change
- Links back to activity when completed (tracking closed loop)
- `recurrence_rule` uses standard iCal format for compatibility
- Multiple status states handle real-world behavior (snoozed, dismissed)

---

### 9. `conversation_history`

**Purpose:** Store AI chat history for context and learning

```sql
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
    /*
    What information was available when generating this message:
    {
        "active_garden_id": "uuid",
        "mentioned_plants": ["uuid1", "uuid2"],
        "current_weather": {...},
        "recent_activities": [...],
        "user_intent": "log_watering"
    }
    */

    -- Function calls (OpenAI/Claude function calling)
    function_calls JSONB,
    /*
    {
        "name": "log_activity",
        "arguments": {"plant_id": "uuid", "type": "watering", ...},
        "result": {...}
    }
    */

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Token usage tracking (for cost monitoring)
    tokens_used INT,
    model_used TEXT -- e.g., "claude-3-sonnet", "gpt-4"
);

-- Indexes
CREATE INDEX idx_conversation_gardener ON conversation_history(gardener_id);
CREATE INDEX idx_conversation_session ON conversation_history(session_id, created_at);
CREATE INDEX idx_conversation_recent ON conversation_history(gardener_id, created_at DESC);

-- Partitioning by time (future optimization)
-- Could partition by month for performance as data grows
```

**Design Decisions:**
- Store full conversation for AI context (last N messages)
- `context_data` allows understanding what AI "knew"
- `function_calls` tracks actions taken (debugging, analytics)
- `session_id` groups related messages (one conversation)
- `tokens_used` for cost monitoring and optimization
- Will need retention policy (delete old conversations)

---

## Additional Tables (Future Phases)

These are designed but not implemented in MVP:

### `garden_members` (Co-gardeners - Phase 2+)

```sql
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
```

### `plant_lineage` (Propagation Tracking - Phase 6)

Already supported via `parent_plant_id` in plants table, but could add:

```sql
CREATE TABLE propagation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_plant_id UUID NOT NULL REFERENCES plants(id),
    child_plant_id UUID NOT NULL REFERENCES plants(id),
    method TEXT CHECK (method IN ('cutting', 'seed', 'division', 'layering', 'grafting')),
    propagation_date DATE NOT NULL,
    success_rate DECIMAL(5,2), -- If multiple attempts
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `marketplace_listings` (Phase 8)

```sql
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
```

---

## Views (Helper Queries)

### Active Plants by Garden

```sql
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
```

### Recent Activity Summary

```sql
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
```

### Upcoming Reminders

```sql
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
```

---

## Row Level Security (Supabase RLS)

**Why RLS matters:**
Supabase automatically enforces these policies at the database level, ensuring users can only access their own data even if client-side code is compromised.

### Gardeners Table

```sql
-- Users can read their own profile
CREATE POLICY "Gardeners can view own profile"
ON gardeners FOR SELECT
USING (auth.uid() = auth_user_id);

-- Users can update their own profile
CREATE POLICY "Gardeners can update own profile"
ON gardeners FOR UPDATE
USING (auth.uid() = auth_user_id);
```

### Gardens Table

```sql
-- Gardeners can view their own gardens
CREATE POLICY "Gardeners can view own gardens"
ON gardens FOR SELECT
USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
));

-- Gardeners can create gardens
CREATE POLICY "Gardeners can create gardens"
ON gardens FOR INSERT
WITH CHECK (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
));

-- Gardeners can update their own gardens
CREATE POLICY "Gardeners can update own gardens"
ON gardens FOR UPDATE
USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
));
```

### Plants Table

```sql
-- Gardeners can view plants in their gardens
CREATE POLICY "Gardeners can view own plants"
ON plants FOR SELECT
USING (garden_id IN (
    SELECT id FROM gardens WHERE gardener_id IN (
        SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
    )
));

-- Similar policies for INSERT, UPDATE, DELETE
```

### Conversation History

```sql
-- Users can only access their own conversation history
CREATE POLICY "Gardeners can view own conversations"
ON conversation_history FOR SELECT
USING (gardener_id IN (
    SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
));
```

---

## Example Queries

### Get gardener's active plants with recent activity

```sql
SELECT
    p.id,
    p.custom_name,
    p.common_name,
    p.status,
    p.health_status,
    pp.storage_path as photo_url,
    COUNT(DISTINCT a.id) as activity_count_30d,
    MAX(a.performed_at) as last_activity_at,
    COUNT(DISTINCT o.id) as observation_count_30d
FROM plants p
LEFT JOIN plant_photos pp ON p.id = pp.plant_id AND pp.is_primary = true
LEFT JOIN activities a ON p.id = a.plant_id
    AND a.performed_at >= NOW() - INTERVAL '30 days'
LEFT JOIN observations o ON p.id = o.plant_id
    AND o.observed_at >= NOW() - INTERVAL '30 days'
WHERE p.garden_id IN (
    SELECT id FROM gardens WHERE gardener_id = $1
)
AND p.archived_at IS NULL
GROUP BY p.id, pp.storage_path
ORDER BY last_activity_at DESC NULLS LAST;
```

### Get plant detail with care schedule

```sql
SELECT
    p.*,
    pm.scientific_name,
    pm.care_guide,
    pm.hardiness_zones,
    json_agg(DISTINCT pp.*) FILTER (WHERE pp.id IS NOT NULL) as photos,
    json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL)
        as recent_activities,
    json_agg(DISTINCT r.*) FILTER (WHERE r.id IS NOT NULL)
        as upcoming_reminders
FROM plants p
LEFT JOIN plants_master pm ON p.plant_master_id = pm.id
LEFT JOIN plant_photos pp ON p.id = pp.plant_id
LEFT JOIN activities a ON p.id = a.plant_id
    AND a.performed_at >= NOW() - INTERVAL '60 days'
LEFT JOIN care_reminders r ON p.id = r.plant_id
    AND r.status = 'pending'
WHERE p.id = $1
GROUP BY p.id, pm.scientific_name, pm.care_guide, pm.hardiness_zones;
```

### Check if plant needs watering (for AI)

```sql
WITH last_watering AS (
    SELECT
        plant_id,
        MAX(performed_at) as last_watered_at
    FROM activities
    WHERE activity_type = 'watering'
    GROUP BY plant_id
)
SELECT
    p.id,
    p.custom_name,
    p.common_name,
    lw.last_watered_at,
    EXTRACT(EPOCH FROM (NOW() - lw.last_watered_at))/86400 as days_since_water,
    (pm.care_guide->>'watering'->>'frequency') as recommended_frequency
FROM plants p
LEFT JOIN last_watering lw ON p.id = lw.plant_id
LEFT JOIN plants_master pm ON p.plant_master_id = pm.id
WHERE p.garden_id IN (
    SELECT id FROM gardens WHERE gardener_id = $1
)
AND p.archived_at IS NULL
ORDER BY days_since_water DESC NULLS FIRST;
```

---

## Migration Strategy

### Initial Setup (Supabase)

1. **Create tables in order** (respecting foreign key dependencies):
   ```
   gardeners → gardens → plants_master → plants →
   plant_photos, activities, observations, care_reminders, conversation_history
   ```

2. **Enable RLS on all tables**:
   ```sql
   ALTER TABLE gardeners ENABLE ROW LEVEL SECURITY;
   ALTER TABLE gardens ENABLE ROW LEVEL SECURITY;
   -- etc.
   ```

3. **Create policies** as documented above

4. **Create indexes** for performance

5. **Create views** for common queries

### Seed Data (Optional)

**Plants Master Data:**
- Import USDA plant database subset
- Import common houseplants from Plant.id
- Start with ~100 most common species

**Example seed script:**
```sql
INSERT INTO plants_master (scientific_name, common_names, care_guide, plant_type)
VALUES
('Solanum lycopersicum', ARRAY['Tomato', 'Garden Tomato'],
 '{"watering": {"frequency": "twice_weekly"}, "sunlight": "full_sun"}',
 'vegetable'),
('Monstera deliciosa', ARRAY['Monstera', 'Swiss Cheese Plant'],
 '{"watering": {"frequency": "weekly"}, "sunlight": "indirect"}',
 'houseplant');
```

### Future Migrations

**Version control migrations:**
- Use Supabase migrations or a tool like `dbmate`
- Each migration file: `YYYYMMDD_description.sql`

**Example migration (adding field extraction):
```sql
-- 20250315_add_field_extraction.sql
ALTER TABLE plants
ADD COLUMN field_extraction_data JSONB;

CREATE INDEX idx_plants_field_extracted
ON plants((field_extraction_data->>'extracted'))
WHERE field_extraction_data IS NOT NULL;
```

---

## Performance Considerations

### Expected Query Patterns

**Hot paths (optimize these):**
1. Get gardener's plants with status (dashboard)
2. Get plant detail with recent activity
3. Get upcoming reminders
4. Recent conversation history (last 10 messages)
5. Search plants by name

**Cold paths (acceptable to be slower):**
1. Full-text search across all observations
2. Lineage tree traversal (future)
3. Historical analytics

### Scaling Considerations

**MVP (0-1000 users):**
- Default Supabase free tier sufficient
- All indexes in place
- No special optimization needed

**Growth (1000-10,000 users):**
- Add partitioning on `conversation_history` by month
- Consider read replicas for analytics queries
- Implement conversation history retention (delete > 6 months)

**Scale (10,000+ users):**
- Partition large tables (`activities`, `observations`)
- Move photo metadata to separate service
- Implement caching layer (Redis)
- Consider sharding by gardener_id

---

## Data Retention & Privacy

### Retention Policies

**Conversation history:**
- Keep last 3 months for AI context
- Archive 3-12 months (compressed)
- Delete > 12 months (with user consent)

**Activities/Observations:**
- Keep indefinitely (core data)
- User can manually delete

**Photos:**
- Keep until plant archived
- Archived plant photos: keep 1 year, then delete (unless user explicitly saves)

### GDPR Compliance

**User data export:**
```sql
-- Generate complete user data export
SELECT json_build_object(
    'profile', (SELECT row_to_json(g.*) FROM gardeners g WHERE id = $1),
    'gardens', (SELECT json_agg(g.*) FROM gardens g WHERE gardener_id = $1),
    'plants', (SELECT json_agg(p.*) FROM plants p JOIN gardens g ON p.garden_id = g.id WHERE g.gardener_id = $1),
    'activities', (...),
    'observations', (...),
    'photos', (...)
);
```

**User deletion:**
- All data CASCADE deletes via foreign keys
- Photos deleted from storage
- Anonymous analytics retained (plant count trends, etc.)

---

## Next Steps

1. **Set up Supabase project**
   - Create new project
   - Run migration scripts

2. **Create migration files**
   - One file per table
   - Test locally first

3. **Implement RLS policies**
   - Start restrictive, open up as needed

4. **Seed plants_master**
   - Start with 50-100 common species

5. **Test queries**
   - Verify performance of common queries
   - Ensure RLS works correctly

---

## Questions to Consider

Before implementing, decide:

1. **Photo storage limits**: Max file size? Max photos per plant?
2. **Conversation retention**: How long to keep chat history?
3. **Reminder generation**: When/how to auto-create reminders?
4. **Plants_master population**: Manual curation vs. auto-populate from API?
5. **Timezone handling**: Store in UTC, display in user's timezone?

---

**This schema balances MVP simplicity with future extensibility. It supports the core "Plant Companion" experience while having clear paths to add social features, marketplace, lineage tracking, and more.**

Ready to set up Supabase and implement this schema?
