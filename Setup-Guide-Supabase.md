# ShrubHub Supabase Setup Guide

**Complete step-by-step guide to set up your ShrubHub backend**

---

## Step 1: Create Supabase Project

### 1.1 Sign Up / Log In

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (recommended) or email

### 1.2 Create New Project

1. Click "New Project"
2. Select your organization (or create one)
3. Fill in project details:
   - **Name:** ShrubHub
   - **Database Password:** Generate a strong password (SAVE THIS!)
   - **Region:** Choose closest to you (e.g., US West)
   - **Pricing Plan:** Free tier is fine for MVP

4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

### 1.3 Save Your Credentials

Once ready, go to **Settings > API**

Copy and save these (you'll need them):
```
Project URL: https://[your-project-ref].supabase.co
anon/public key: eyJ... (long string)
service_role key: eyJ... (long string - keep secret!)
```

---

## Step 2: Run Database Migrations

### 2.1 Enable SQL Editor

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**

### 2.2 Create Tables

**Copy and paste this entire script into the SQL editor:**

```sql
-- ============================================
-- SHRUBHUB DATABASE SCHEMA
-- Based on Database-Schema.md
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- TABLES
-- ============================================

-- 1. GARDENERS (Users)
CREATE TABLE gardeners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Authentication (links to Supabase Auth)
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Profile
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,

    -- Location for weather/hardiness zone
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_description TEXT,
    hardiness_zone TEXT,
    timezone TEXT DEFAULT 'UTC',

    -- Preferences
    measurement_system TEXT DEFAULT 'imperial' CHECK (measurement_system IN ('imperial', 'metric')),
    notification_preferences JSONB DEFAULT '{"reminders": true, "tips": true, "achievements": false}',
    bot_personality_settings JSONB DEFAULT '{"formality": "casual", "verbosity": "balanced"}',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 2. GARDENS
CREATE TABLE gardens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Ownership
    gardener_id UUID NOT NULL REFERENCES gardeners(id) ON DELETE CASCADE,

    -- Garden details
    name TEXT NOT NULL,
    description TEXT,
    garden_type TEXT DEFAULT 'mixed' CHECK (garden_type IN (
        'indoor', 'outdoor', 'container', 'raised_bed',
        'in_ground', 'greenhouse', 'community_plot', 'mixed'
    )),

    -- Location
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_description TEXT,

    -- Environment
    sun_exposure TEXT CHECK (sun_exposure IN ('full_sun', 'partial_shade', 'full_shade', 'varies')),
    soil_type TEXT,

    -- Metadata
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ,

    UNIQUE(gardener_id, name)
);

-- 3. PLANTS_MASTER (Species Reference)
CREATE TABLE plants_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    scientific_name TEXT UNIQUE NOT NULL,
    common_names TEXT[] NOT NULL,
    family TEXT,

    -- Type
    plant_type TEXT CHECK (plant_type IN (
        'vegetable', 'herb', 'fruit', 'flower', 'tree',
        'shrub', 'succulent', 'vine', 'grass', 'fern', 'other'
    )),

    -- Care guide (from Plant.id, USDA, etc.)
    care_guide JSONB,

    -- Growing info
    hardiness_zones TEXT[],
    growth_rate TEXT CHECK (growth_rate IN ('slow', 'moderate', 'fast')),
    mature_height_inches INT,
    mature_width_inches INT,
    native_region TEXT,
    edibility BOOLEAN DEFAULT false,

    -- Data sources
    data_sources JSONB,
    external_ids JSONB,
    default_image_url TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ
);

-- 4. PLANTS (Individual Plant Instances)
CREATE TABLE plants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    garden_id UUID NOT NULL REFERENCES gardens(id) ON DELETE CASCADE,
    plant_master_id UUID REFERENCES plants_master(id) ON DELETE SET NULL,
    parent_plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,

    -- Names
    common_name TEXT NOT NULL,
    custom_name TEXT,

    -- Location
    location_in_garden TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),

    -- Acquisition
    acquired_date DATE NOT NULL,
    acquisition_source TEXT CHECK (acquisition_source IN (
        'seed', 'seedling_purchased', 'mature_purchased', 'gift',
        'propagation', 'field_extraction', 'volunteer', 'unknown'
    )),
    acquisition_location TEXT,
    acquisition_notes TEXT,

    -- Status
    status TEXT DEFAULT 'alive' CHECK (status IN (
        'seed', 'germinating', 'seedling', 'vegetative', 'flowering',
        'fruiting', 'dormant', 'alive', 'struggling', 'dead',
        'harvested', 'adopted_out'
    )),
    health_status TEXT DEFAULT 'healthy' CHECK (health_status IN (
        'healthy', 'needs_attention', 'sick', 'pest_issue', 'dead'
    )),

    -- Lifecycle dates
    planted_date DATE,
    first_bloom_date DATE,
    first_harvest_date DATE,

    -- Care overrides
    care_override JSONB,
    field_extraction_data JSONB,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

-- 5. PLANT_PHOTOS
CREATE TABLE plant_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,

    -- Storage (Supabase Storage)
    storage_bucket TEXT NOT NULL DEFAULT 'plant-photos',
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,

    -- Metadata
    taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    file_size_bytes INT,
    mime_type TEXT,

    -- Context
    photo_type TEXT DEFAULT 'general' CHECK (photo_type IN (
        'identification', 'general', 'progress', 'issue',
        'bloom', 'harvest', 'before_after'
    )),
    caption TEXT,

    -- AI analysis
    identification_data JSONB,

    -- Display
    is_primary BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACTIVITIES
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,

    -- Activity details
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'watering', 'fertilizing', 'pruning', 'repotting', 'transplanting',
        'harvesting', 'treating_pests', 'treating_disease', 'staking',
        'mulching', 'soil_amendment', 'deadheading', 'thinning',
        'germination', 'other'
    )),

    notes TEXT,
    quantity DECIMAL(10, 2),
    quantity_unit TEXT,
    product_used TEXT,

    -- Timing
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_minutes INT,

    -- Source
    created_via TEXT DEFAULT 'manual' CHECK (created_via IN (
        'manual', 'bot', 'reminder', 'auto', 'import'
    )),
    reminder_id UUID,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. OBSERVATIONS
CREATE TABLE observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,

    -- Content
    observation_text TEXT NOT NULL,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'concerned', 'negative')),

    -- Media
    photo_id UUID REFERENCES plant_photos(id) ON DELETE SET NULL,

    -- Tags
    tags TEXT[],

    -- Timing
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_via TEXT DEFAULT 'manual' CHECK (created_via IN ('manual', 'bot', 'prompt')),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CARE_REMINDERS
CREATE TABLE care_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,

    -- Details
    reminder_type TEXT NOT NULL CHECK (reminder_type IN (
        'watering', 'fertilizing', 'pruning', 'repotting',
        'checking', 'harvesting', 'custom'
    )),
    title TEXT NOT NULL,
    description TEXT,

    -- Schedule
    due_date DATE,
    due_time TIME,
    recurrence_rule TEXT,

    -- Priority
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'completed', 'snoozed', 'dismissed', 'expired'
    )),
    completed_at TIMESTAMPTZ,
    completed_activity_id UUID REFERENCES activities(id),

    -- Source
    created_by TEXT DEFAULT 'system' CHECK (created_by IN (
        'system', 'user', 'weather', 'issue'
    )),
    conditions JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CONVERSATION_HISTORY
CREATE TABLE conversation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    gardener_id UUID NOT NULL REFERENCES gardeners(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,

    -- Message
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    message_text TEXT NOT NULL,

    -- Context
    context_data JSONB,
    function_calls JSONB,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tokens_used INT,
    model_used TEXT
);

-- ============================================
-- INDEXES
-- ============================================

-- Gardeners
CREATE INDEX idx_gardeners_auth_user ON gardeners(auth_user_id);
CREATE INDEX idx_gardeners_email ON gardeners(email);

-- Gardens
CREATE INDEX idx_gardens_gardener ON gardens(gardener_id);
CREATE INDEX idx_gardens_active ON gardens(gardener_id) WHERE archived_at IS NULL;

-- Plants Master
CREATE INDEX idx_plants_master_scientific ON plants_master(scientific_name);
CREATE INDEX idx_plants_master_common ON plants_master USING GIN(common_names);
CREATE INDEX idx_plants_master_type ON plants_master(plant_type);

-- Plants
CREATE INDEX idx_plants_garden ON plants(garden_id);
CREATE INDEX idx_plants_master_ref ON plants(plant_master_id);
CREATE INDEX idx_plants_status ON plants(status) WHERE archived_at IS NULL;
CREATE INDEX idx_plants_health ON plants(health_status) WHERE archived_at IS NULL;
CREATE INDEX idx_plants_parent ON plants(parent_plant_id) WHERE parent_plant_id IS NOT NULL;
CREATE INDEX idx_plants_active ON plants(garden_id)
    WHERE archived_at IS NULL AND status NOT IN ('dead', 'adopted_out');

-- Plant Photos
CREATE INDEX idx_plant_photos_plant ON plant_photos(plant_id);
CREATE INDEX idx_plant_photos_taken_at ON plant_photos(taken_at DESC);
CREATE INDEX idx_plant_photos_primary ON plant_photos(plant_id, is_primary)
    WHERE is_primary = true;
CREATE UNIQUE INDEX idx_plant_photos_one_primary ON plant_photos(plant_id)
    WHERE is_primary = true;

-- Activities
CREATE INDEX idx_activities_plant ON activities(plant_id);
CREATE INDEX idx_activities_performed_at ON activities(performed_at DESC);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_recent ON activities(plant_id, performed_at DESC);

-- Observations
CREATE INDEX idx_observations_plant ON observations(plant_id);
CREATE INDEX idx_observations_observed_at ON observations(observed_at DESC);
CREATE INDEX idx_observations_sentiment ON observations(sentiment);
CREATE INDEX idx_observations_tags ON observations USING GIN(tags);

-- Care Reminders
CREATE INDEX idx_reminders_plant ON care_reminders(plant_id);
CREATE INDEX idx_reminders_due_date ON care_reminders(due_date) WHERE status = 'pending';
CREATE INDEX idx_reminders_status ON care_reminders(status);
CREATE INDEX idx_reminders_upcoming ON care_reminders(plant_id, due_date)
    WHERE status = 'pending' AND due_date >= CURRENT_DATE;

-- Conversation History
CREATE INDEX idx_conversation_gardener ON conversation_history(gardener_id);
CREATE INDEX idx_conversation_session ON conversation_history(session_id, created_at);
CREATE INDEX idx_conversation_recent ON conversation_history(gardener_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE gardeners ENABLE ROW LEVEL SECURITY;
ALTER TABLE gardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

-- Gardeners policies
CREATE POLICY "Users can view own profile"
    ON gardeners FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
    ON gardeners FOR UPDATE
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile"
    ON gardeners FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

-- Gardens policies
CREATE POLICY "Users can view own gardens"
    ON gardens FOR SELECT
    USING (gardener_id IN (
        SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can create gardens"
    ON gardens FOR INSERT
    WITH CHECK (gardener_id IN (
        SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update own gardens"
    ON gardens FOR UPDATE
    USING (gardener_id IN (
        SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete own gardens"
    ON gardens FOR DELETE
    USING (gardener_id IN (
        SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
    ));

-- Plants policies
CREATE POLICY "Users can view plants in their gardens"
    ON plants FOR SELECT
    USING (garden_id IN (
        SELECT g.id FROM gardens g
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can create plants in their gardens"
    ON plants FOR INSERT
    WITH CHECK (garden_id IN (
        SELECT g.id FROM gardens g
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their plants"
    ON plants FOR UPDATE
    USING (garden_id IN (
        SELECT g.id FROM gardens g
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their plants"
    ON plants FOR DELETE
    USING (garden_id IN (
        SELECT g.id FROM gardens g
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

-- Plants Master - public read, authenticated insert
CREATE POLICY "Anyone can view plants_master"
    ON plants_master FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert plants_master"
    ON plants_master FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Plant Photos policies
CREATE POLICY "Users can view photos of their plants"
    ON plant_photos FOR SELECT
    USING (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can add photos to their plants"
    ON plant_photos FOR INSERT
    WITH CHECK (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their plant photos"
    ON plant_photos FOR UPDATE
    USING (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their plant photos"
    ON plant_photos FOR DELETE
    USING (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

-- Activities policies (same pattern)
CREATE POLICY "Users can view activities for their plants"
    ON activities FOR SELECT
    USING (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can log activities for their plants"
    ON activities FOR INSERT
    WITH CHECK (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their activities"
    ON activities FOR UPDATE
    USING (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their activities"
    ON activities FOR DELETE
    USING (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

-- Observations policies
CREATE POLICY "Users can view observations for their plants"
    ON observations FOR SELECT
    USING (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can create observations for their plants"
    ON observations FOR INSERT
    WITH CHECK (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their observations"
    ON observations FOR UPDATE
    USING (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their observations"
    ON observations FOR DELETE
    USING (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

-- Care Reminders policies
CREATE POLICY "Users can view reminders for their plants"
    ON care_reminders FOR SELECT
    USING (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can create reminders for their plants"
    ON care_reminders FOR INSERT
    WITH CHECK (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their reminders"
    ON care_reminders FOR UPDATE
    USING (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their reminders"
    ON care_reminders FOR DELETE
    USING (plant_id IN (
        SELECT p.id FROM plants p
        JOIN gardens g ON p.garden_id = g.id
        JOIN gardeners gr ON g.gardener_id = gr.id
        WHERE gr.auth_user_id = auth.uid()
    ));

-- Conversation History policies
CREATE POLICY "Users can view own conversation history"
    ON conversation_history FOR SELECT
    USING (gardener_id IN (
        SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can insert conversation history"
    ON conversation_history FOR INSERT
    WITH CHECK (gardener_id IN (
        SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
    ));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_gardeners_updated_at BEFORE UPDATE ON gardeners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gardens_updated_at BEFORE UPDATE ON gardens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON plants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plants_master_updated_at BEFORE UPDATE ON plants_master
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_reminders_updated_at BEFORE UPDATE ON care_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

3. Click **Run** (or press Cmd/Ctrl + Enter)
4. You should see "Success. No rows returned"

### 2.3 Verify Tables Created

1. Click **Table Editor** (left sidebar)
2. You should see all 9 tables:
   - gardeners
   - gardens
   - plants_master
   - plants
   - plant_photos
   - activities
   - observations
   - care_reminders
   - conversation_history

---

## Step 3: Set Up Storage for Photos

### 3.1 Create Storage Bucket

1. Click **Storage** (left sidebar)
2. Click **New bucket**
3. Name: `plant-photos`
4. **Public bucket:** Yes (so plant photos are accessible)
5. Click **Create bucket**

### 3.2 Set Up Storage Policies

1. Click on the `plant-photos` bucket
2. Go to **Policies** tab
3. Click **New policy**

**Policy 1: Public Read**
```sql
CREATE POLICY "Public can view plant photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'plant-photos');
```

**Policy 2: Authenticated Upload**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'plant-photos');
```

**Policy 3: Users can update their photos**
```sql
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Policy 4: Users can delete their photos**
```sql
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Step 4: Configure Authentication

### 4.1 Enable Email Auth

1. Click **Authentication** (left sidebar)
2. Click **Providers**
3. **Email** should be enabled by default
4. Configure email settings:
   - **Enable email confirmations:** On (for production)
   - **Secure email change:** On
   - **Secure password change:** On

### 4.2 (Optional) Enable OAuth Providers

For "Continue with Google" etc:

1. Click **Providers**
2. Enable desired providers (Google, GitHub, etc.)
3. Add OAuth credentials from respective platforms

### 4.3 Configure Email Templates

1. Click **Email Templates**
2. Customize the emails (optional for MVP):
   - Confirmation
   - Magic Link
   - Change Email
   - Reset Password

---

## Step 5: Seed Initial Data (Optional)

### 5.1 Add Common Plants to plants_master

Go to SQL Editor and run:

```sql
-- Seed common houseplants and vegetables
INSERT INTO plants_master (scientific_name, common_names, plant_type, care_guide, hardiness_zones) VALUES
('Monstera deliciosa', ARRAY['Monstera', 'Swiss Cheese Plant'], 'other',
 '{"watering": {"frequency": "weekly", "notes": "Let soil dry between waterings"}, "sunlight": "indirect", "humidity": "60%+"}',
 ARRAY['10', '11', '12']),

('Epipremnum aureum', ARRAY['Pothos', 'Devils Ivy'], 'other',
 '{"watering": {"frequency": "weekly"}, "sunlight": "low to bright indirect", "toxicity": {"pets": true}}',
 ARRAY['10', '11', '12']),

('Ocimum basilicum', ARRAY['Sweet Basil', 'Basil'], 'herb',
 '{"watering": {"frequency": "when soil dry"}, "sunlight": "full sun", "temperature": {"min_f": 50, "max_f": 90}}',
 ARRAY['2', '3', '4', '5', '6', '7', '8', '9', '10', '11']),

('Solanum lycopersicum', ARRAY['Tomato', 'Garden Tomato'], 'vegetable',
 '{"watering": {"frequency": "daily in summer"}, "sunlight": "full sun", "support": "staking required"}',
 ARRAY['2', '3', '4', '5', '6', '7', '8', '9', '10', '11']),

('Aloe vera', ARRAY['Aloe Vera', 'Aloe'], 'succulent',
 '{"watering": {"frequency": "every 2-3 weeks"}, "sunlight": "bright indirect", "soil": "well-draining"}',
 ARRAY['8', '9', '10', '11', '12']),

('Nephrolepis exaltata', ARRAY['Boston Fern', 'Fern'], 'fern',
 '{"watering": {"frequency": "keep moist"}, "sunlight": "indirect", "humidity": "high"}',
 ARRAY['9', '10', '11']),

('Rosa', ARRAY['Rose', 'Garden Rose'], 'flower',
 '{"watering": {"frequency": "twice weekly"}, "sunlight": "full sun", "pruning": "regular"}',
 ARRAY['3', '4', '5', '6', '7', '8', '9', '10']);
```

---

## Step 6: Test Your Setup

### 6.1 Create a Test User

1. Go to **Authentication > Users**
2. Click **Add user**
3. Enter:
   - Email: your-test-email@example.com
   - Password: TestPassword123!
   - Auto-confirm: Yes
4. Click **Create user**

### 6.2 Test with SQL

```sql
-- Create a test gardener profile
INSERT INTO gardeners (auth_user_id, email, display_name, location_description, hardiness_zone)
SELECT
    id,
    email,
    'Test Gardener',
    'Portland, OR',
    '8b'
FROM auth.users
WHERE email = 'your-test-email@example.com'
LIMIT 1;

-- Create a test garden
INSERT INTO gardens (gardener_id, name, description, garden_type)
SELECT
    id,
    'My First Garden',
    'Testing ShrubHub',
    'indoor'
FROM gardeners
WHERE email = 'your-test-email@example.com'
LIMIT 1;

-- Verify
SELECT g.name as garden_name, gr.display_name as gardener_name
FROM gardens g
JOIN gardeners gr ON g.gardener_id = gr.id;
```

Should return your test garden!

---

## Step 7: Save Environment Variables

Create a `.env.local` file in your project (we'll use this in Next.js):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Keep secret! Server-side only

# API Keys (we'll add these later)
PLANT_ID_API_KEY=your_plant_id_key
OPENWEATHER_API_KEY=your_weather_key
ANTHROPIC_API_KEY=your_claude_key # OR OPENAI_API_KEY
```

**Important:** Never commit `.env.local` to git!
Add to `.gitignore`:
```
.env.local
.env*.local
```

---

## Step 8: Next Steps

✅ Supabase project created
✅ Database schema deployed
✅ Storage bucket configured
✅ Authentication enabled
✅ RLS policies in place
✅ Test data added

**You're ready to build the frontend!**

Next, we'll:
1. Create the Next.js project
2. Install Supabase client
3. Set up authentication
4. Connect to database
5. Build the UI components

---

## Troubleshooting

### Issue: RLS Blocking Queries

**Symptom:** Can't insert/read data even though you're authenticated

**Solution:**
1. Check you're passing the correct auth token
2. Verify RLS policies match your use case
3. Temporarily disable RLS for testing (not production!):
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

### Issue: Can't Upload Photos

**Symptom:** Storage upload fails

**Solution:**
1. Verify bucket exists and is public
2. Check storage policies are created
3. Verify file size < 50MB (default limit)
4. Check MIME type is allowed

### Issue: Foreign Key Violations

**Symptom:** Can't insert related data

**Solution:**
- Ensure parent records exist first
- Check gardener exists before creating garden
- Check garden exists before creating plant

---

## Useful SQL Queries

### View all plants with garden info
```sql
SELECT
    p.custom_name,
    p.common_name,
    p.status,
    g.name as garden_name,
    gr.display_name as gardener_name
FROM plants p
JOIN gardens g ON p.garden_id = g.id
JOIN gardeners gr ON g.gardener_id = gr.id
WHERE p.archived_at IS NULL;
```

### Recent activities
```sql
SELECT
    p.custom_name || ' (' || p.common_name || ')' as plant,
    a.activity_type,
    a.performed_at,
    a.notes
FROM activities a
JOIN plants p ON a.plant_id = p.id
ORDER BY a.performed_at DESC
LIMIT 20;
```

### Plants needing water
```sql
SELECT
    p.custom_name,
    p.common_name,
    MAX(a.performed_at) as last_watered,
    EXTRACT(days FROM NOW() - MAX(a.performed_at)) as days_ago
FROM plants p
LEFT JOIN activities a ON p.id = a.plant_id AND a.activity_type = 'watering'
WHERE p.archived_at IS NULL
GROUP BY p.id, p.custom_name, p.common_name
ORDER BY days_ago DESC;
```

---

**Your Supabase backend is now ready! Let's build the frontend next.**
