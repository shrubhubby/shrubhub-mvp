# ShrubHub Project Context Document

**Version:** 2025-12-06
**Last Updated:** Current session
**Status:** Active Development

---

## 1) PROJECT OVERVIEW

### App Name
**ShrubHub**

### Description
ShrubHub is a garden management application that helps users organize and track their gardening activities across multiple locations. Users can create "Sites" (physical locations like their home or a community garden) with geographic boundaries, create "Gardens" within those sites (with their own boundaries), and track individual plants within gardens. The application provides location-based features including GPS location capture, address search with autocomplete, polygon boundary drawing on satellite maps, and automatic detection of nearby gardens.

### Target Users
- Home gardeners managing backyard or indoor gardens
- Community garden participants managing plots
- Users with multiple gardening locations (home, community plots, etc.)
- Gardeners who want to track plant care, health status, and location data

### Non-Goals / Explicitly Not Being Built
- Mobile native map implementation (currently web-only for full map features)
- Advanced polygon editing beyond dragging vertices
- Point-based locations (future consideration, currently polygon-focused)
- Real-time collaboration features
- E-commerce or plant marketplace features
- Weather API integration (mentioned as future via shared site data)

---

## 2) CORE REQUIREMENTS

### Functional Requirements
- **Site Management**
  - Create, read, update, delete sites
  - Define site location via GPS, address search, or map click
  - Draw polygon boundaries for sites on satellite imagery
  - Associate multiple gardens with a single site
  - View nearby unassigned gardens within ~5km of site
  - Add existing unassigned gardens to sites
  - Remove gardens from sites (non-destructive, garden persists)

- **Garden Management**
  - Create, read, update, delete gardens
  - Optionally associate gardens with sites
  - Define garden location and polygon boundaries
  - When associated with a site, display site boundary on map (translucent green)
  - Draw garden boundary within or separate from site boundary (blue overlay)
  - Categorize gardens by type (indoor, outdoor, container, raised bed, in-ground, greenhouse, community plot, mixed)
  - Auto-zoom to site boundary when site is selected and no garden boundary exists yet

- **Plant Management**
  - View plant details including care status, health, location
  - Link plants to gardens
  - Track health status (healthy, needs attention, sick)
  - Track watering and acquisition dates
  - Link to plants_master reference data for species information
  - Display plant photos

- **Location Features**
  - GPS-based location capture via browser geolocation API
  - Google Places Autocomplete for address search with typeahead
  - Interactive map with satellite imagery
  - Polygon drawing by clicking points on map
  - Draggable boundary vertices for adjustment
  - Clear boundary function

### Non-Functional Requirements
- **Performance**: Map should load and render polygons efficiently
- **Security**: User authentication via Supabase Auth, row-level security on database
- **Data Integrity**: Polygon boundaries stored in valid WKT format, coordinates validated
- **Usability**: Informative alerts for user actions, loading states for async operations
- **Cross-Platform**: Web interface must work on desktop and mobile browsers, iOS Chrome location permissions handled

### Explicit Assumptions
- Users have modern browsers with geolocation support
- Users grant location permissions when using GPS features
- Google Maps API is available and configured
- Site and garden boundaries are stored as POLYGON geometry in WKT format
- Foreign key relationships in database may not support nested PostgREST queries
- Distance calculations use simple lat/lng Pythagorean approximation (0.01 degrees ≈ 1km)
- Boundaries must have at least 3 points to be saved as polygons
- WKT polygons automatically close by repeating first coordinate

---

## 3) ARCHITECTURE & TECH STACK

### Frontend Framework and Tooling
- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform and toolchain
- **Expo Router**: File-based routing system with dynamic routes (`[id].tsx`)
- **NativeWind**: Tailwind CSS for React Native (utility-first styling)
- **Platform-Specific Files**: `.web.tsx` extensions for web-only implementations
- **TypeScript**: Type safety (interfaces defined inline in components)

### Backend Framework and Tooling
- **Supabase**: Backend-as-a-Service providing:
  - PostgreSQL database
  - PostgREST API (auto-generated REST endpoints)
  - Row-level security (RLS)
  - Authentication

### Runtime Environment
- **Web**: Browser-based (Chrome, Safari, etc.)
- **Development Server**: Expo development server
- **Node.js**: For build tooling and scripts

### Data Storage
- **Database**: PostgreSQL (via Supabase)
- **Geometry Format**: WKT (Well-Known Text) for polygon boundaries
  - Format: `POLYGON((lng lat, lng lat, ...))`
  - Coordinates stored as longitude-latitude pairs
  - First coordinate repeated at end to close polygon
- **Image Storage**: URLs stored in database (photo_url fields)

### API Patterns
- **PostgREST REST API**: Auto-generated from database schema
- **Separate Queries**: Individual queries for related data instead of nested queries
  - Reason: Nested PostgREST queries require proper foreign key relationships and fail with 400 errors otherwise
  - Pattern: Fetch main entity first, then fetch related entities separately using foreign keys
- **Google Maps JavaScript API**: Browser-based mapping with satellite view
- **Google Places Autocomplete API**: Address search with typeahead

### Auth Approach
- **Supabase Auth**: User authentication with auth_user_id
- **Gardeners Table**: Links auth users to application data via `auth_user_id` field
- **RLS**: Database-level security (implied, not explicitly configured in conversation)

### Deployment Model
- **Vercel**: Static site deployment with automatic HTTPS
- **Domain**: shrubhub.ai
- **Environment**: Production builds deployed via git push

---

## 4) DIRECTORY / REPO STRUCTURE

### Root Directory
```
/Users/chris.larsen/Documents/personal/ShrubHub/mobile/
```

### Major Subdirectories

```
mobile/
├── app/                          # Expo Router pages (file-based routing)
│   ├── (auth)/                   # Authentication pages
│   │   └── login.tsx
│   ├── sites/                    # Site management
│   │   ├── [id].tsx             # Site detail page (view/edit/delete)
│   │   └── add.tsx              # Create new site
│   ├── gardens/                  # Garden management
│   │   ├── [id]/
│   │   │   └── edit.tsx         # Edit garden page
│   │   ├── [id].tsx             # Garden detail page (if exists)
│   │   └── add.tsx              # Create new garden
│   └── plants/                   # Plant management
│       └── [id].tsx             # Plant detail page
│
├── components/                   # React components
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   └── BottomNav.tsx
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Badge.tsx
│   ├── map/                      # Map-related components
│   │   ├── GoogleMapWeb.tsx     # Google Maps wrapper for web
│   │   ├── SiteLocationPicker.web.tsx    # Site location/boundary picker
│   │   ├── GardenLocationPicker.web.tsx  # Garden location/boundary picker
│   │   └── AddressPicker.web.tsx         # Address autocomplete
│   └── [other components]/
│
├── lib/                          # Utilities and clients
│   ├── supabase/
│   │   └── client.ts            # Supabase client configuration
│   └── utils.ts                 # Utility functions (e.g., getDaysSince)
│
├── assets/                       # Static assets
│   └── fonts/                   # Custom fonts
│
└── [config files]               # package.json, tsconfig.json, etc.
```

### Additional Working Directories
- `/Users/chris.larsen/Documents/personal/ShrubHub/frontend/` (mentioned but not actively used in this session)
- `/Users/chris.larsen/Downloads/` (contains shapefile processing scripts, not part of main app)

### Version Control Notes
- `.env` files should NOT be committed (contains API keys)
- `node_modules/` excluded
- `.expo/` cache directory excluded

---

## 5) DATA MODELS & SCHEMAS

### Entity: gardeners
**Purpose**: Links authenticated users to application data

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PRIMARY KEY | Auto-generated |
| auth_user_id | uuid | FOREIGN KEY → auth.users | Links to Supabase auth |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | | |

### Entity: sites
**Purpose**: Physical locations where gardens are located

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PRIMARY KEY | Auto-generated |
| gardener_id | uuid | FOREIGN KEY → gardeners(id) | Owner of site |
| name | text | NOT NULL | Display name |
| description | text | NULLABLE | Optional notes |
| location_description | text | NULLABLE | Human-readable location |
| location_lat | numeric | NULLABLE | Latitude |
| location_lng | numeric | NULLABLE | Longitude |
| boundary | text | NULLABLE | WKT POLYGON format |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | | |

**Boundary Format**: `POLYGON((lng lat, lng lat, lng lat, lng lat))`
**Example**: `POLYGON((-122.4194 37.7749, -122.4184 37.7749, -122.4184 37.7739, -122.4194 37.7739, -122.4194 37.7749))`

### Entity: gardens
**Purpose**: Gardens within sites or standalone

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PRIMARY KEY | Auto-generated |
| gardener_id | uuid | FOREIGN KEY → gardeners(id) | Owner of garden |
| site_id | uuid | FOREIGN KEY → sites(id), NULLABLE | Optional site association |
| name | text | NOT NULL | Display name |
| description | text | NULLABLE | Optional notes |
| location_description | text | NULLABLE | E.g., "Backyard", "South Window" |
| location_lat | numeric | NULLABLE | Latitude |
| location_lng | numeric | NULLABLE | Longitude |
| boundary | text | NULLABLE | WKT POLYGON format |
| garden_type | text | DEFAULT 'mixed' | See GARDEN_TYPES below |
| is_primary | boolean | DEFAULT false | Primary garden flag |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | | |

**GARDEN_TYPES**:
- `indoor` (🏠 Indoor)
- `outdoor` (🌳 Outdoor)
- `container` (🪴 Container)
- `raised_bed` (📦 Raised Bed)
- `in_ground` (🌱 In Ground)
- `greenhouse` (🏡 Greenhouse)
- `community_plot` (👥 Community Plot)
- `mixed` (🌿 Mixed)

### Entity: plants
**Purpose**: Individual plants within gardens

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PRIMARY KEY | Auto-generated |
| garden_id | uuid | FOREIGN KEY → gardens(id) | Parent garden |
| plants_master_id | uuid | FOREIGN KEY → plants_master(id), NULLABLE | Species reference |
| custom_name | text | NULLABLE | User's nickname for plant |
| health_status | text | DEFAULT 'healthy' | healthy, needs_attention, sick |
| location_in_garden | text | NULLABLE | E.g., "Northwest corner" |
| last_watered | date | NULLABLE | Most recent watering |
| acquired_date | date | NULLABLE | When plant was acquired |
| acquisition_notes | text | NULLABLE | Notes about acquisition |
| photo_url | text | NULLABLE | URL to plant photo |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | | |

### Entity: plants_master
**Purpose**: Reference data for plant species

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | uuid | PRIMARY KEY | Auto-generated |
| common_names | text[] | NULLABLE | Array of common names |
| scientific_name | text | NULLABLE | Binomial nomenclature |
| sunlight_min | numeric | NULLABLE | Min hours of sunlight |
| sunlight_max | numeric | NULLABLE | Max hours of sunlight |
| hardiness_zone_min | text | NULLABLE | USDA hardiness zone min |
| hardiness_zone_max | text | NULLABLE | USDA hardiness zone max |

### Relationships
```
gardeners (1) ──< (many) sites
gardeners (1) ──< (many) gardens
sites (1) ──< (many) gardens
gardens (1) ──< (many) plants
plants_master (1) ──< (many) plants
```

### Validation & Constraints
- Polygon boundaries must have at least 3 points to be stored
- Boundary coordinates are stored as longitude-latitude pairs (WKT standard)
- WKT polygons must be closed (first point repeated at end)
- Site and garden boundaries are optional (can be NULL)
- Gardens can exist without a site (site_id NULL)
- Plants can exist without plants_master reference (custom plants)

---

## 6) ENVIRONMENT CONFIGURATION

### Required Environment Variables

| Variable | Used By | When | Purpose |
|----------|---------|------|---------|
| EXPO_PUBLIC_GOOGLE_MAPS_API_KEY | Frontend | Build-time & Runtime | Google Maps JavaScript API and Places API |
| Supabase URL | Frontend | Runtime | Supabase project endpoint |
| Supabase Anon Key | Frontend | Runtime | Public API key for Supabase |

**Note**: Supabase configuration is in `/lib/supabase/client.ts` but specific env var names not shown in conversation.

### Configuration Layer Usage
- **Frontend Build-Time**: Variables prefixed with `EXPO_PUBLIC_` are embedded in build
- **Frontend Runtime**: Accessed via `process.env.EXPO_PUBLIC_*` in browser
- **Backend Runtime**: N/A (Supabase handles backend)

### Secret Management
- Secrets stored in `.env` file (NOT committed to git)
- Production secrets configured in Vercel environment variables
- Google Maps API key should be restricted by domain/IP in Google Cloud Console
- Supabase anon key is safe to expose (protected by RLS)

---

## 7) KEY DESIGN DECISIONS & RATIONALE

### 1. WKT Format for Polygon Storage
**Decision**: Store polygon boundaries as WKT text strings in format `POLYGON((lng lat, lng lat, ...))`

**Rationale**:
- Standard geospatial format supported by PostgreSQL/PostGIS
- Easy to parse and convert to/from JavaScript objects
- Human-readable in database queries
- Coordinates in longitude-latitude order (WKT standard)

**Tradeoffs**:
- Manual parsing required (not using PostGIS geometry type directly)
- Must manually close polygons (repeat first coordinate)
- Could use PostGIS geometry column instead, but WKT is simpler for initial implementation

### 2. Separate Database Queries Instead of Nested PostgREST Queries
**Decision**: Fetch related entities with separate queries instead of using PostgREST nested query syntax

**Example**:
```typescript
// AVOID - This fails with 400 Bad Request
const { data } = await supabase
  .from('plants')
  .select('*, plants_master(*), gardens(*)')
  .eq('id', id)

// USE - Separate queries
const { data: plant } = await supabase.from('plants').select('*').eq('id', id)
const { data: master } = await supabase.from('plants_master').select('*').eq('id', plant.plants_master_id)
const { data: garden } = await supabase.from('gardens').select('*').eq('id', plant.garden_id)
```

**Rationale**:
- PostgREST nested queries require properly configured foreign key relationships in database
- Encountered 400 Bad Request errors when foreign keys weren't set up correctly
- Separate queries are more resilient and explicit
- Minor performance impact acceptable for current scale

**Tradeoffs**:
- More code and multiple network requests
- Slightly higher latency
- But: More reliable and debuggable

### 3. Platform-Specific Files for Web (.web.tsx)
**Decision**: Use `.web.tsx` extensions for web-specific implementations of map components

**Rationale**:
- React Native doesn't have native equivalent to Google Maps JavaScript API
- Web implementation uses browser-specific APIs (HTML input, Google Maps SDK)
- Mobile implementation would need different approach (react-native-maps)
- Expo's platform-specific extensions keep code organized

**Tradeoffs**:
- Duplicate component names (GardenLocationPicker vs GardenLocationPicker.web)
- Mobile version needs separate implementation
- But: Clean separation of concerns

### 4. Visual Distinction: Blue for Garden, Green for Site
**Decision**:
- Site boundaries: Green (#228B1B), opacity 0.15, non-interactive
- Garden boundaries: Blue (#2563EB), opacity 0.35, draggable markers

**Rationale**:
- Clear visual hierarchy (site is context, garden is focus)
- Site boundary less opaque to not obscure satellite imagery
- Garden boundary more prominent as it's what user is editing
- Color-blind friendly color combination

**Tradeoffs**:
- Fixed colors may not suit all preferences
- Could add theme customization later

### 5. Simple Distance Calculation for Nearby Gardens
**Decision**: Use Pythagorean theorem on lat/lng coordinates with approximation 0.01 degrees ≈ 1km

```typescript
const latDiff = Math.abs(garden.location_lat - site.location_lat)
const lngDiff = Math.abs(garden.location_lng - site.location_lng)
const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)
const isNearby = distance < 0.05 // ~5km
```

**Rationale**:
- Simple and fast for initial implementation
- Accurate enough for "nearby" detection within ~5km
- Avoids need for complex geospatial libraries or PostGIS functions

**Tradeoffs**:
- Not accurate for large distances or high latitudes
- Doesn't account for Earth's curvature
- Could use Haversine formula or PostGIS ST_Distance for accuracy
- Acceptable for current use case (local area detection)

### 6. Boundary Dragging UX
**Decision**: All boundary vertices are draggable circles, click map to add new vertices

**Rationale**:
- Intuitive interaction model (drag to adjust, click to add)
- Visible markers make vertices easy to find and modify
- "Finish Drawing" button provides clear completion action
- "Clear Boundary" allows starting over

**Tradeoffs**:
- No vertex deletion (must clear and redraw)
- No edge insertion (must click in sequence)
- Could add advanced editing features later

### 7. Auto-Zoom to Site Boundary
**Decision**: When a site is selected for a new garden and site has a boundary, automatically calculate center and zoom to fit site boundary

**Rationale**:
- Reduces user friction (don't have to search for site on map)
- Provides immediate context for where to draw garden boundary
- Only applies when garden has no existing location (respects user's previous choices)

**Tradeoffs**:
- Zoom level fixed at 17 (could calculate optimal zoom to fit bounds)
- Center calculated as simple average of coordinates (could use proper bounds fitting)

---

## 8) CURRENT STATE

### Fully Implemented

**Sites**
- ✅ Create site with name, description, location
- ✅ Address search with Google Places Autocomplete
- ✅ GPS location capture via browser geolocation
- ✅ Draw site boundary on satellite map
- ✅ View site details with associated gardens
- ✅ Edit site (inline editing on detail page)
- ✅ Delete site
- ✅ View nearby unassigned gardens (within ~5km)
- ✅ Add existing gardens to site
- ✅ Remove gardens from site (non-destructive)
- ✅ Create new garden from site detail page

**Gardens**
- ✅ Create garden with name, description, location, type
- ✅ Site selection during garden creation
- ✅ GPS location capture
- ✅ Draw garden boundary on map
- ✅ Display site boundary (green) when garden associated with site
- ✅ Garden boundary overlay (blue) on top of site boundary
- ✅ Auto-zoom to site boundary when site selected
- ✅ Edit garden with all features above
- ✅ Save/load boundaries in WKT format
- ✅ Eight garden type categories with emoji icons
- ✅ Draggable boundary vertices

**Plants**
- ✅ View plant detail page
- ✅ Display plant photo or emoji placeholder
- ✅ Show health status with color-coded badges
- ✅ Display care status (days since watering, age)
- ✅ Link to garden and species (plants_master)
- ✅ Show plant information (sunlight, hardiness zone)
- ✅ Navigate from plant card to detail page

**UI/UX**
- ✅ Header with back navigation
- ✅ Bottom navigation
- ✅ Card-based layout
- ✅ Button variants (primary, outline)
- ✅ Badge variants for health status (healthy, attention, urgent, neutral)
- ✅ Loading states
- ✅ Alert dialogs for confirmations
- ✅ Responsive ScrollView layouts

**Map Features (Web Only)**
- ✅ Google Maps satellite view
- ✅ Polygon drawing
- ✅ Marker dragging
- ✅ Map click to add vertices
- ✅ Dual boundary display (site + garden)
- ✅ Address autocomplete integration

### Partially Implemented

**Plants**
- ⚠️ "Water Now" button present but non-functional (line 254 in `/app/plants/[id].tsx`)
- ⚠️ Plant creation flow not visible in conversation (may exist elsewhere)

**Mobile Maps**
- ⚠️ Map components only implemented for web (.web.tsx)
- ⚠️ Mobile native implementation not started
- ⚠️ Tip message shown: "For full satellite imagery and polygon drawing, use the mobile app. Web maps are coming soon!" (inverted - web has it, mobile doesn't)

**Error Handling**
- ⚠️ Basic try-catch with console.error and window.alert
- ⚠️ No global error boundary
- ⚠️ No toast notification system

### Planned But Not Started

**Sites**
- 🔲 Point-based locations (mentioned as future consideration)
- 🔲 Weather/environmental data sharing across site

**Gardens**
- 🔲 Advanced boundary editing (delete vertices, insert on edges)
- 🔲 Boundary validation (check if within site boundary)

**Plants**
- 🔲 Water tracking functionality
- 🔲 Plant creation/edit flows
- 🔲 Care schedule/reminders
- 🔲 Plant photo upload

**General**
- 🔲 Mobile native map implementation
- 🔲 Offline support
- 🔲 Data export
- 🔲 Sharing/collaboration features

---

## 9) KNOWN ISSUES / RISKS / OPEN QUESTIONS

### Technical Risks

**PostgREST Foreign Key Dependency**
- **Issue**: Nested queries fail with 400 Bad Request if foreign keys not properly configured
- **Current Mitigation**: Use separate queries for related data
- **Long-term Risk**: If database schema changes without updating queries, silent failures possible
- **Recommendation**: Add database migration tracking and test foreign key relationships

**Google Maps API Costs**
- **Issue**: Maps JavaScript API and Places API have usage quotas and costs
- **Current Mitigation**: Unknown (API key restrictions not mentioned)
- **Risk**: Unexpected costs if traffic scales
- **Recommendation**: Set up billing alerts and usage quotas in Google Cloud Console

**WKT Parsing Robustness**
- **Issue**: Manual regex parsing of WKT strings could break with unexpected formats
- **Current Mitigation**: Specific regex pattern `\(\((.*?)\)\)` for POLYGON
- **Risk**: If database stores different geometry types (POINT, MULTIPOLYGON), parsing will fail
- **Recommendation**: Add validation and error handling for boundary parsing

**Simple Distance Calculation Accuracy**
- **Issue**: Pythagorean distance on lat/lng coordinates inaccurate at scale or high latitudes
- **Current Mitigation**: Only used for "nearby" detection within ~5km
- **Risk**: False positives/negatives for gardens near 5km threshold
- **Recommendation**: Consider Haversine formula or PostGIS ST_DWithin for production

### Product Uncertainties

**Mobile vs Web Priority**
- **Observation**: Code comments suggest mobile is primary ("use mobile app for full features") but web has all map features, mobile has none
- **Question**: What is true platform priority? Should mobile native maps be next focus?

**Boundary Validation**
- **Question**: Should gardens be required to fit within site boundaries?
- **Current State**: No validation, gardens can be drawn anywhere
- **Decision Needed**: Add validation or keep flexible?

**Plant Ownership Model**
- **Question**: Can plants belong to gardens in different sites? Can they move between gardens?
- **Current State**: Plants have fixed garden_id, no transfer mechanism
- **Decision Needed**: Support plant transfers or keep static?

### Areas Needing Future Clarification

**Authentication & Authorization**
- **Unclear**: Is multi-user sharing planned? Can multiple gardeners co-own a site/garden?
- **Current State**: Single gardener_id owner per entity
- **Impact**: Database schema would need junction tables for multi-owner support

**Data Model for Site-less Gardens**
- **Unclear**: Should standalone gardens (no site_id) have different UI/features?
- **Current State**: Same UI for both, site selection is optional
- **Decision Needed**: Different workflows or keep unified?

**Boundary Complexity Limits**
- **Question**: Is there a max number of vertices for boundaries? Performance implications?
- **Current State**: No limits enforced
- **Risk**: Very complex polygons could impact map rendering performance

**Hardiness Zones Data Source**
- **Observation**: plants_master has hardiness_zone_min/max fields (text type)
- **Question**: Where does this data come from? Is it editable by users or reference data?
- **Current State**: Reference data table, not clear if user-editable

---

## 10) HOW TO CONTINUE WORK

### For a New Assistant Taking Over

**Immediate Context Files to Inspect**

1. **Start Here**: Read these files to understand current implementation
   ```
   /Users/chris.larsen/Documents/personal/ShrubHub/mobile/app/gardens/add.tsx
   /Users/chris.larsen/Documents/personal/ShrubHub/mobile/app/gardens/[id]/edit.tsx
   /Users/chris.larsen/Documents/personal/ShrubHub/mobile/components/map/GardenLocationPicker.web.tsx
   /Users/chris.larsen/Documents/personal/ShrubHub/mobile/components/map/GoogleMapWeb.tsx
   ```

2. **Database Schema**: Understand data model by querying Supabase or reading schema
   - Tables: gardeners, sites, gardens, plants, plants_master
   - Focus on WKT boundary fields and foreign key relationships

3. **Environment Setup**: Check for `.env` file with Google Maps API key
   - If missing, request key setup instructions from user
   - Verify Supabase connection configuration in `/lib/supabase/client.ts`

### What Files to Modify Next (By Priority)

**High Priority**
1. **Plant water functionality**: `/app/plants/[id].tsx` line 253-254
   - "Water Now" button exists but has empty onPress handler
   - Add database update to set `last_watered = CURRENT_DATE`
   - Update UI to show updated "days since watering"

2. **Mobile map implementation**: Create native versions without `.web.tsx` extension
   - Research react-native-maps or similar library
   - Implement polygon drawing on mobile
   - May need different UX pattern (mobile-optimized)

3. **Boundary validation**: Add check in GardenLocationPicker
   - When site boundary exists, validate garden boundary points are within site
   - Use point-in-polygon algorithm or PostGIS ST_Within
   - Show visual feedback or warning if invalid

**Medium Priority**
4. **Error boundary**: Add global error catching
   - Wrap app in React error boundary component
   - Replace window.alert with toast notification system
   - Add Sentry or similar error tracking

5. **Plant CRUD**: Create plant creation and editing flows
   - Follow pattern established by gardens (add.tsx, edit.tsx)
   - Include photo upload capability
   - Link to garden via garden_id

**Low Priority**
6. **Optimize distance calculation**: Replace simple Pythagorean with Haversine
   - More accurate for "nearby gardens" detection
   - Or use PostGIS ST_DWithin if available

7. **Advanced boundary editing**: Add vertex deletion and edge insertion
   - Click vertex to delete
   - Click edge midpoint to insert new vertex
   - Requires more complex state management in map components

### What NOT to Change Without Reconsideration

**Do Not Modify Without Discussion**

1. **WKT Format**: Do not change from `POLYGON((lng lat, ...))` format
   - Database may have existing boundaries in this format
   - Coordinate order (lng, lat) is WKT standard
   - Changing would require data migration

2. **Separate Query Pattern**: Do not switch back to nested PostgREST queries
   - This was specifically chosen to avoid 400 errors
   - Only change if foreign keys are verified in database schema
   - Test thoroughly with foreign key validation

3. **Color Scheme for Boundaries**: Do not change blue/green without user request
   - Site = green (#228B1B), Garden = blue (#2563EB)
   - Opacity levels carefully chosen (site 0.15, garden 0.35)
   - Accessibility-tested color combination

4. **Platform-Specific File Structure**: Do not consolidate .web.tsx files
   - Expo relies on this convention for platform detection
   - Web and mobile implementations are fundamentally different
   - Merging would require runtime platform checks (less clean)

5. **Database Schema**: Do not add/modify columns without migration plan
   - Existing data in production database (shrubhub.ai deployed)
   - Schema changes need careful migration strategy
   - Check with user about database state before schema changes

### Development Workflow

**Running the App Locally**
```bash
cd /Users/chris.larsen/Documents/personal/ShrubHub/mobile
npx expo start --clear  # Start dev server
# Press 'w' for web browser
# Scan QR for mobile (if Expo Go app installed)
```

**Deployment to Production**
- Deployment via Vercel (automatic on git push)
- Production URL: https://www.shrubhub.ai
- Verify changes locally before deploying

**Testing Changes**
1. Test on web browser first (easiest to debug)
2. Verify map interactions work with Google Maps API
3. Check database writes in Supabase dashboard
4. Test location permissions in browser (especially iOS Chrome)
5. Verify WKT polygon format in database after boundary save

### Common Pitfalls to Avoid

**Geography-Related**
- Don't confuse latitude/longitude order (WKT uses lng/lat)
- Don't forget to close polygons (repeat first coordinate)
- Don't use negative array indices when parsing coordinates

**React Native Specific**
- Don't use web-only APIs in non-.web.tsx files
- Don't forget `typeof window !== 'undefined'` checks before using browser APIs
- Don't mix React Native components with HTML elements

**Database Queries**
- Don't assume nested queries work without testing
- Don't forget to handle null foreign keys (plants without plants_master_id)
- Don't use `.single()` without error handling (throws if no rows found)

**State Management**
- Don't forget to initialize state from loaded data (especially for edit forms)
- Don't forget to update both state and database on user actions
- Don't forget to call onLocationChange/onBoundaryChange callbacks in map components

### Questions to Ask User Before Major Changes

1. **Before changing data model**: "I need to modify the database schema to add [feature]. This may require a data migration. Should I proceed?"

2. **Before switching libraries**: "I recommend replacing [current library] with [new library] for [reason]. This would require refactoring [components]. Is this acceptable?"

3. **Before removing features**: "The current implementation of [feature] conflicts with [new requirement]. Should I remove it or find a way to support both?"

4. **Before major UX changes**: "I propose changing [interaction pattern] to [new pattern] because [reason]. Can you review this approach before I implement?"

---

## APPENDIX: Code Patterns Reference

### WKT Conversion Functions

**Coordinates to WKT**
```typescript
interface Coordinate {
  latitude: number
  longitude: number
}

const convertBoundaryToWKT = (coords: Coordinate[]): string | null => {
  if (coords.length < 3) return null
  const coordStrings = coords.map(c => `${c.longitude} ${c.latitude}`)
  coordStrings.push(coordStrings[0]) // Close polygon
  return `POLYGON((${coordStrings.join(', ')}))`
}
```

**WKT to Coordinates**
```typescript
const parseBoundaryFromWKT = (wkt: string): Coordinate[] => {
  const coordString = wkt.match(/\(\((.*?)\)\)/)?.[1]
  if (!coordString) return []

  const coords = coordString.split(',').map((pair: string) => {
    const [lng, lat] = pair.trim().split(' ').map(Number)
    return { latitude: lat, longitude: lng }
  })

  // Remove last coordinate if duplicate of first (closing point)
  if (coords.length > 1 &&
      coords[0].latitude === coords[coords.length - 1].latitude &&
      coords[0].longitude === coords[coords.length - 1].longitude) {
    coords.pop()
  }

  return coords
}
```

### Separate Query Pattern for Related Data

```typescript
// Load main entity
const { data: garden } = await supabase
  .from('gardens')
  .select('*')
  .eq('id', gardenId)
  .single()

// Load related entities separately
let gardenWithRelations = { ...garden }

if (garden.site_id) {
  const { data: site } = await supabase
    .from('sites')
    .select('name, boundary')
    .eq('id', garden.site_id)
    .single()

  if (site) {
    gardenWithRelations.site = site
  }
}

return gardenWithRelations
```

### Nearby Gardens Distance Calculation

```typescript
const nearby = allGardens.filter((garden) => {
  if (!garden.location_lat || !garden.location_lng) return false

  const latDiff = Math.abs(garden.location_lat - site.location_lat)
  const lngDiff = Math.abs(garden.location_lng - site.location_lng)
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)

  return distance < 0.05 // ~5km threshold
})
```

### Map Component Usage Pattern

```typescript
<GardenLocationPicker
  siteId={selectedSiteId}              // Optional: displays site boundary
  onLocationChange={(lat, lng) => {
    setLocationLat(lat)
    setLocationLng(lng)
  }}
  onBoundaryChange={(coords) => {
    setBoundary(coords)
  }}
  initialLocation={                     // Optional: for edit mode
    locationLat && locationLng
      ? { latitude: locationLat, longitude: locationLng }
      : undefined
  }
  initialBoundary={initialBoundary}     // Optional: for edit mode
/>
```

---

**END OF DOCUMENT**

This document represents the complete state of the ShrubHub project as of 2025-12-06. Any assistant should be able to continue development using this as the sole source of truth.
