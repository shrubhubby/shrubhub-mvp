# PROJECT CONTEXT (AUTHORITATIVE)

## 1. PROJECT IDENTITY
- Project name: ShrubHub
- Repository purpose: AI-powered garden management app. Users create Sites (physical locations with polygon boundaries), Gardens within sites, and track Plants within gardens. Features include photo-based plant identification, EXIF metadata extraction, AI-powered tag/label reading, polygon boundary drawing, and a conversational AI assistant.
- Primary user(s): Home gardeners managing plants across multiple locations (home, community gardens, etc.)
- Explicit non-goals: Not a social network, not a marketplace, not a real-time collaboration tool. No advanced polygon editing beyond vertex dragging.

## 2. EXECUTION CONSTRAINTS
- Runtime constraints: Node.js serverless functions on Vercel. Client-side rendering for interactive components, server components for data fetching.
- Hosting / platform constraints: Vercel for frontend hosting. Supabase for database, auth, storage, and edge functions. Domain: shrubhub.ai / www.shrubhub.ai
- Language / framework constraints: TypeScript throughout. Next.js 14 App Router for frontend. React Native + Expo for mobile (secondary, root directory of repo).
- Security constraints: Supabase Row-Level Security on all tables. Auth via Supabase Auth with cookie-based sessions. API routes validate auth before any data access.
- Regulatory or compliance constraints: None identified.

## 3. TECH STACK (LOCKED UNLESS OVERRIDDEN)
- Frontend: Next.js 14.2.33, React 18, TailwindCSS 3.4, TypeScript 5.3.3
- Backend: Supabase (PostgreSQL, PostgREST, Auth, Storage, Edge Functions)
- AI: @anthropic-ai/sdk ^0.80.0 (Claude) for tag/label extraction. Plant identification via Supabase Edge Function (proxied through /api/identify-plant).
- Maps: Google Maps JavaScript API (loaded dynamically, no npm package)
- Shared libraries: @supabase/ssr, @supabase/supabase-js ^2.39.0, lucide-react (icons), clsx + tailwind-merge (className utils), exifr ^7.1.3 (EXIF parsing)
- Package managers: npm
- Build tools: Next.js built-in (webpack), Vercel CLI for deployment
- Test tools: None configured
- Lint / format tools: ESLint (via next lint), TypeScript (tsc --noEmit). Both are set to ignoreDuringBuilds in next.config.js due to pre-existing type issues with Supabase generics.

## 4. SYSTEM ARCHITECTURE
- High-level flow: Browser -> Next.js middleware (Supabase session refresh) -> App Router pages (server components fetch data via Supabase server client) -> Client components for interactivity -> API routes for mutations and AI calls -> Supabase (PostgREST / Edge Functions)
- Separation of concerns: Server components for data fetching and static rendering. Client components ('use client') for forms, state, interactivity. API routes (/api/*) for authenticated mutations and AI service proxying. Supabase handles all persistence and auth.
- State management strategy: React useState/useCallback hooks in client components. No global state library. Auth state managed by Supabase middleware (cookie-based).
- Error handling strategy: API routes return JSON errors with status codes. Client components display errors inline. TypeScript strict mode enabled but build errors ignored (ignoreBuildErrors: true).
- Logging / observability approach: console.error in API routes. No structured logging or APM configured.

## 5. REPOSITORY STRUCTURE
- Repo root: /home/chris/ShrubHub
- Git: Single repo, remote origin at https://github.com/shrubhubby/shrubhub-mvp, branch: main
- Git config (local): user.email=shrubhubby@users.noreply.github.com, user.name=ShrubHub

### CRITICAL: Two active codebases

| Directory | Framework | Deployed to | Status |
|-----------|-----------|-------------|--------|
| **Root (`/`)** | Expo (React Native + web) | EAS Build (mobile) | Active -- Expo mobile app |
| **`frontend/`** | Next.js 14 (App Router) | **Vercel -> shrubhub.ai** | Active -- deployed web app |
| `mobile/` | -- | -- | **DELETED.** Was a stale copy of root. Removed in this session. |
| `styling/` | -- | -- | Brand assets |

When the user is looking at shrubhub.ai, edit files in `frontend/`.
When working on the Expo mobile app, edit files at the root.

### Key directories and purpose:
```
/home/chris/ShrubHub/
  CLAUDE.md                          # Claude Code guidance (UI rules, component API, patterns)
  PROJECT_CONTEXT_CANONICAL.md       # THIS FILE - authoritative session state
  Database-Schema.md                 # Complete PostgreSQL schema docs
  shrubhub_database_creation.sql     # DB creation script (source of truth for schema)
  frontend/                          # PRIMARY WEB APP - Next.js 14
    src/
      app/
        (app)/                       # Authenticated app routes
          page.tsx                   # Dashboard landing
          plants/
            page.tsx                 # Plant list (server -> PlantList client component)
            add/page.tsx             # Plant intake flow (photo-first)
            [id]/page.tsx            # Plant detail page (server -> PlantDetail client)
          gardens/
            page.tsx                 # Gardens list (server -> GardenCard client)
            [id]/page.tsx            # Garden detail (server -> GardenDetail client)
          sites/page.tsx             # Placeholder (sites table doesn't exist yet)
          activities/page.tsx        # Activity history
          chat/page.tsx              # AI chat
          settings/page.tsx          # Settings + logout
          layout.tsx                 # App shell: flex layout with Sidebar + Header + BottomNav
        (auth)/
          login/page.tsx
          signup/page.tsx
        api/
          plants/route.ts            # GET, POST, PUT, DELETE
          gardens/route.ts           # GET, POST, PUT, DELETE
          activities/route.ts        # GET, POST
          chat/route.ts              # AI chat
          identify-plant/route.ts    # Proxies to Supabase Edge Function
          extract-tag/route.ts       # Claude vision for plant tags
      components/
        ui/                          # Button, Card, Input, Textarea, Avatar, Badge
        layout/                      # Header, Sidebar, BottomNav
        plant/                       # PlantDetail, PlantList, PlantLocationMap, PlantCard, PlantGrid
        garden/                      # GardenCard, GardenDetail
        map/                         # GoogleMapWeb, GardenBoundaryEditor
        chat/                        # ChatMessage, ChatInput, SuggestionPills
      lib/
        supabase/client.ts           # createBrowserClient
        supabase/server.ts           # createServerClient with cookies
        supabase/middleware.ts        # Session refresh
        utils.ts                     # cn(), formatDate, formatRelativeTime, getDaysSince
      types/database.types.ts        # Generated Supabase types
    tailwind.config.js               # Brand colors, custom tokens
    next.config.js                   # ignoreBuildErrors, ignoreESLint, image remotePatterns
  app/                               # Expo mobile app routes (root)
  components/                        # Expo mobile components (root)
  api/                               # Expo API handlers (root)
```

### Entry points:
- Frontend: `frontend/src/app/layout.tsx` (root), `frontend/src/app/(app)/layout.tsx` (app shell)
- Middleware: `frontend/src/middleware.ts`
- API: `frontend/src/app/api/*/route.ts`

### Generated / excluded files:
- `node_modules/`, `.next/`, `.env`, `.env.local`
- `frontend/.vercel/` (Vercel project link)

### Deployment:
- **Auto-deploy**: GitHub webhook triggers Vercel on every push to `main`. Vercel GitHub integration is also connected. Only ONE should be active to avoid duplicate deploys. As of this session, the webhook was removed and the native GitHub integration handles deploys.
- **Vercel root directory setting**: Must be set to `frontend` in Vercel project settings.
- Project: `shrubhub-frontend` under team `chris-larsens-projects`

## 6. API & INTERFACE CONTRACTS

### Internal module boundaries:
- Server components fetch data directly via Supabase server client (no API routes needed for reads)
- Client components call `/api/*` routes for mutations
- Client components use `createClient()` from `lib/supabase/client.ts` for direct Supabase Storage uploads

### External APIs (routes, methods, payloads):

**POST /api/plants** - Create plant
- Body: `{ garden_id, common_name, custom_name?, plant_master_id?, location_in_garden?, location_lat?, location_lng?, acquired_date?, acquisition_source?, acquisition_notes?, status?, health_status?, planted_date?, care_override? }`
- Returns: `{ success: true, plant: {...} }`

**GET /api/plants** - List plants
- Query: garden_id?, status?, search?
- Returns: `{ plants: [...] }`

**PUT /api/plants** - Update plant
- Body: `{ id, common_name?, custom_name?, status?, health_status?, location_in_garden?, acquisition_notes?, ... }`
- Allowed fields: common_name, custom_name, location_in_garden, location_lat, location_lng, acquired_date, planted_date, acquisition_source, acquisition_location, acquisition_notes, status, health_status, care_override
- Returns: `{ success: true, plant: {...} }`

**DELETE /api/plants?id=UUID** - Delete plant
- Returns: `{ success: true }`

**POST /api/gardens** - Create garden
**GET /api/gardens** - List gardens (with optional include_archived)
**PUT /api/gardens** - Update garden (including boundary as WKT, location_lat, location_lng)
**DELETE /api/gardens?id=UUID** - Delete garden (cascades to plants)

**GET/POST /api/activities** - List/create activities

**POST /api/identify-plant** - Plant identification proxy
**POST /api/extract-tag** - Claude vision tag extraction

### Auth boundaries:
- All API routes verify `supabase.auth.getUser()` and gardener ownership
- Middleware refreshes session cookies on every request
- Unauthenticated users redirected to `/login`

## 7. DATA MODELS

### Core entities and relationships:
```
gardeners (1) --< gardens (many)
gardens (1) --< plants (many, ON DELETE CASCADE)
plants_master (1) --< plants (many, via plant_master_id, optional)
plants (1) --< plant_photos (many, ON DELETE CASCADE)
plants (1) --< activities (many)
plants (1) --< observations (many)
plants (1) --< care_reminders (many)
plants (1) --< plants (self-ref via parent_plant_id for lineage)
```

### CRITICAL column name reference (source: shrubhub_database_creation.sql):
- `plants_master.common_names` -- TEXT[] ARRAY. NOT `common_name`.
- `plants.common_name` -- TEXT singular.
- `activities.performed_at` -- TIMESTAMPTZ. NOT `activity_date`.
- `activities` has NO `garden_id` column. Filter via plant_id join.
- `plants` has NO `photo_url` or `last_watered` columns. Photos are in `plant_photos` table.
- `gardens` has NO `boundary` column in the base schema. The Expo app's edit page writes to it, but the column may not exist in production DB. Check before selecting.
- `gardens` has NO `site_id` column in the base schema.
- `sites` table does NOT exist in the base schema (shrubhub_database_creation.sql).

### Key fields:

**gardens**: id, gardener_id, name, description, garden_type (enum), location_lat, location_lng, location_description, sun_exposure, soil_type, is_primary, archived_at

**plants**: id, garden_id, plant_master_id?, parent_plant_id?, common_name, custom_name?, location_in_garden?, location_lat?, location_lng?, acquired_date, acquisition_source (enum), acquisition_notes?, status (enum), health_status (enum), planted_date?, care_override (JSON), editable_id?, clone_number?, registration_batch_id?

**plants_master**: id, scientific_name, common_names[], family, plant_type, care_guide (JSON: {watering, sunlight, temperature, soil, fertilizing, pruning, toxicity}), hardiness_zones[], default_image_url

**plant_photos**: id, plant_id, storage_bucket, storage_path, photo_type (enum), identification_data (JSON), is_primary, display_order, taken_at, mime_type, file_size_bytes

**activities**: id, plant_id, activity_type (enum), notes, quantity, quantity_unit, product_used, performed_at, duration_minutes, created_via

### Persistence: PostgreSQL via Supabase with RLS. Photos in Supabase Storage bucket "plant-photos".

## 8. ENVIRONMENT & SECRETS

### Required environment variables:
| Variable | Scope | Purpose |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Build-time + Runtime | Supabase project endpoint |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Build-time + Runtime | Public Supabase API key |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | Build-time | Google Maps JavaScript API |
| ANTHROPIC_API_KEY | Runtime only | Claude API for tag extraction |
| PLANT_ID_API_KEY | Runtime only | Plant identification service |
| OPENWEATHER_API_KEY | Runtime only | Weather data (not yet used) |

### How secrets are injected in prod:
- Vercel environment variables on project `shrubhub-frontend`
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY must be added to Vercel for maps to work in production

### Files intentionally NOT committed:
- `.env`, `.env.local`, `frontend/.env.local`
- `frontend/.vercel/`
- `node_modules/`

## 9. IMPORTANT DESIGN DECISIONS (DO NOT REVISIT CASUALLY)

### Decision: Two active codebases (root=Expo, frontend/=Next.js)
- Reason: Root is the Expo mobile app. frontend/ is the deployed web app at shrubhub.ai. They share a Supabase backend but are independent.
- mobile/ directory was a stale copy of root and was deleted in this session.

### Decision: Card onClick for clickable items (NOT Link wrapping Card)
- Reason: Card component only applies cursor-pointer when onClick is provided. Wrapping Card in Link breaks hover states and cursor. Use `Card onClick={() => router.push(...)}` with `useRouter()`.
- Rejected alternatives: Link wrapping Card (broke cursor and group-hover).

### Decision: opacity-0 group-hover:opacity-100 for hover-reveal elements
- Reason: Tailwind `text-{color}/0` is not a valid utility. Use opacity classes instead.
- The `group` class must be on the Card/container itself, not a wrapper div.

### Decision: Single Sidebar instance with dual rendering
- Reason: Desktop sidebar is an in-flow flex child (hidden md:flex, sticky). Mobile sidebar is a fixed overlay rendered conditionally when isOpen=true. Layout uses flex, not padding-left offset.
- Rejected alternatives: Two Sidebar instances (caused duplicate navs and scroll issues). Fixed+sticky on same element (conflicting CSS).

### Decision: Photo-first plant intake flow
- Reason: User's core workflow is: take photo -> identify plant -> fill details -> submit.

### Decision: Multi-photo with typed slots (identification, tag_label, general)
- Reason: Tag/label photos need dedicated AI extraction pipeline.

### Decision: TypeScript build errors ignored (ignoreBuildErrors: true)
- Reason: ~100 pre-existing errors from Supabase generic inference. Non-runtime.

### Decision: Auto-deploy via Vercel GitHub integration
- Reason: GitHub webhook was set up but caused duplicate deploys when combined with the native Vercel-GitHub integration. Webhook was deleted. Native integration handles deploys (one per push).

## 10. CURRENT IMPLEMENTATION STATE

### Implemented and working:
- Dashboard with stats (gardens count, plants count, needs attention), quick actions, gardens summary, activity feed
- Plant list page with hover-reveal trash icon for delete, click to view detail
- Plant detail page: plant info (name, species, family, type), care instructions (sunlight, water, fertilizer, temp, soil, pruning), photo gallery with upload, activities tab with type filters, lineage tab with parent chain and offspring
- Plant edit: inline form on detail page (name, nickname, status, health, location, notes)
- Plant photo upload: multi-file, uploads to Supabase Storage, creates plant_photos records
- Plant delete with confirmation dialog
- Gardens list with clickable cards, trash icon on empty gardens
- Garden detail page with inline edit form (name, description, type, location, sun, soil)
- Garden boundary editor: Google Maps satellite view, click-to-draw polygon, draggable vertices, WKT conversion
- Garden delete with cascade warning
- Activities page with date-grouped activity list
- Sites page (placeholder -- sites table doesn't exist yet)
- Navigation: desktop sidebar (in-flow flex child), mobile bottom nav, sticky header, mobile slide-out sidebar
- Auth: login, signup, middleware session refresh, protected routes
- API: full CRUD for plants and gardens, activities GET/POST

### Implemented but incomplete:
- Garden boundary: editor exists but `boundary` column may not exist in production DB
- Plant identification: works when Edge Function is deployed
- Chat page: UI exists but untested with current config
- PlantLocationMap: renders plant dot inside garden polygon, but depends on boundary column existing
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY may not be set in Vercel (maps won't render in prod without it)

### Not yet implemented:
- Site/Location management (DB table doesn't exist)
- Garden create page (/gardens/add)
- Weather integration
- Care reminders
- Plant search/filter
- Pagination on plant/activity lists
- Inventory walk-through mode (designed in Expo app, not ported to frontend)

### Known technical debt:
- ~100 TypeScript errors (Supabase generic inference). Build skips type checking.
- PlantCard and PlantGrid components reference non-existent columns (photo_url, last_watered). Not currently used by any page.
- dashboard-legacy/page.tsx preserved but has same column reference issues.
- No `sites` table in DB despite sites page and nav links existing.

## 11. ACTIVE PROBLEMS & EDGE CASES

### Bugs:
- EXIF lat/lng may not populate from mobile camera (browser strips EXIF). Geolocation API is a fallback.
- Garden `boundary` column may not exist in production DB. Queries selecting it will fail (blank page).

### Performance risks:
- fileToBase64() loads entire image into memory. Large photos (>10MB) could cause issues.
- Plants page fetches ALL plants with no pagination.

### Security concerns:
- No rate limiting on API routes.
- No input sanitization beyond Supabase parameterized queries.

### Known flaky behavior:
- Supabase free tier pauses after 7 days inactivity. Resume in Supabase dashboard if errors occur.
- Vercel root directory must be `frontend` in project settings.

## 12. HOW TO CONTINUE (REQUIRED)

### What to work on next:
1. Verify NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set in Vercel env vars (maps won't work without it)
2. Add `boundary` column to gardens table if it doesn't exist in production
3. Garden create page (/gardens/add)
4. Add pagination to plants list
5. Port inventory walk-through mode from Expo to frontend
6. Clean up TypeScript errors incrementally

### Exact files to start with:
- Check: `frontend/src/components/map/GoogleMapWeb.tsx` (verify maps render in prod)
- New: `frontend/src/app/(app)/gardens/add/page.tsx` (garden creation form)
- Fix: `frontend/src/components/plant/PlantCard.tsx` (references photo_url, last_watered -- not used but should be fixed or deleted)
- Fix: `frontend/src/app/(app)/dashboard-legacy/page.tsx` (same column issues -- consider deleting)

### Commands to run:
```bash
# Development
cd /home/chris/ShrubHub/frontend
npm install
npm run dev

# Build verification (run before pushing)
npm run build

# Deploy (auto-deploys on push to main via GitHub integration)
cd /home/chris/ShrubHub
git add <files>
git commit -m "message

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push origin main
```

### Tests to validate progress:
- No test suite. Validate by:
  1. `npm run build` succeeds with no errors
  2. Visit /plants -- list renders, cards clickable, trash icon on hover
  3. Click plant -- detail page renders with info, photos, care, activities, lineage tabs
  4. Visit /gardens -- cards clickable, empty gardens show trash
  5. Click garden -- detail page with edit form, plant list, boundary editor
  6. Upload photo on plant detail -- appears in gallery

### What must NOT be changed without explicit discussion:
- Supabase project or credentials
- Database schema enum values (status, health_status, acquisition_source, photo_type, activity_type)
- Vercel project linking (shrubhub-frontend under chris-larsens-projects)
- Domain assignment (shrubhub.ai)
- The photo-first plant intake flow design
- Multi-photo typed slot architecture
- Single Sidebar with flex layout pattern
- Card onClick pattern (not Link wrapping Card)

### HARD RULES FOR ALL CHANGES:
1. If an enhancement could affect multiple areas, identify ALL affected files before implementing. If the update could break something, ask before making the change.
2. When creating UI elements, verify no overlap with existing elements (especially fixed/sticky positioned items: header z-50, sidebar z-50, bottom nav z-50, modals z-50).
3. When creating capabilities requiring API/DB calls, verify the query uses correct column names by checking shrubhub_database_creation.sql first. Especially: common_names (array) not common_name on plants_master, performed_at not activity_date on activities, no photo_url or last_watered on plants, no garden_id on activities.
