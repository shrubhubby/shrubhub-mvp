# PROJECT CONTEXT (AUTHORITATIVE)

## 1. PROJECT IDENTITY
- Project name: ShrubHub
- Repository purpose: AI-powered garden management app. Users create Sites (physical locations with polygon boundaries), Gardens within sites, and track Plants within gardens. Features include photo-based plant identification, EXIF metadata extraction, AI-powered tag/label reading, and a conversational AI assistant.
- Primary user(s): Home gardeners managing plants across multiple locations (home, community gardens, etc.)
- Explicit non-goals: Not a social network, not a marketplace, not a real-time collaboration tool. Mobile-native map implementation is web-only. No advanced polygon editing beyond vertex dragging.

## 2. EXECUTION CONSTRAINTS
- Runtime constraints: Node.js serverless functions on Vercel. Client-side rendering for interactive components, server components for data fetching.
- Hosting / platform constraints: Vercel for frontend hosting. Supabase for database, auth, storage, and edge functions. Domain: shrubhub.ai / www.shrubhub.ai
- Language / framework constraints: TypeScript throughout. Next.js 14 App Router for frontend. React Native + Expo for mobile (secondary, not actively developed in this session).
- Security constraints: Supabase Row-Level Security on all tables. Auth via Supabase Auth with cookie-based sessions. API routes validate auth before any data access.
- Regulatory or compliance constraints: None identified.

## 3. TECH STACK (LOCKED UNLESS OVERRIDDEN)
- Frontend: Next.js 14.2.33, React 18, TailwindCSS 3.4, TypeScript 5.3.3
- Backend: Supabase (PostgreSQL, PostgREST, Auth, Storage, Edge Functions)
- AI: @anthropic-ai/sdk ^0.80.0 (Claude) for tag/label extraction. Plant identification via Supabase Edge Function (proxied through /api/identify-plant).
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

### Key directories and purpose:
```
/home/chris/ShrubHub/
  CLAUDE.md                          # Claude Code guidance
  PROJECT_CONTEXT.md                 # Original project context (from mobile era)
  PROJECT_CONTEXT_CANONICAL.md       # THIS FILE - authoritative session state
  Database-Schema.md                 # Complete PostgreSQL schema docs
  DESIGN_PRINCIPLES.md               # UI/UX philosophy
  shrubhub_database_creation.sql     # DB creation script
  .gitignore                         # Unified gitignore
  frontend/                          # PRIMARY - Next.js 14 web app
    src/
      app/
        (app)/                       # Authenticated app routes (wrapped by layout with sidebar/header/bottomnav)
          page.tsx                   # Dashboard landing (server component)
          dashboard-legacy/page.tsx  # Old dashboard (preserved)
          plants/
            page.tsx                 # Plant list (server component, queries all gardens)
            add/page.tsx             # Plant intake flow (client component, photo-first)
          gardens/page.tsx           # Gardens list
          sites/page.tsx             # Sites/Locations list
          activities/page.tsx        # Activity history
          chat/page.tsx              # AI chat
          conversational/page.tsx    # Legacy conversational UI (iframe)
          settings/page.tsx          # Settings
        (auth)/
          login/page.tsx             # Login form
          signup/page.tsx            # Signup form
        api/
          plants/route.ts            # CRUD for plants (POST creates, GET lists)
          gardens/route.ts           # Gardens API
          activities/route.ts        # Activities API
          chat/route.ts              # AI chat API
          identify-plant/route.ts    # Proxies to Supabase Edge Function, normalizes response
          extract-tag/route.ts       # Claude vision - reads plant tags/labels
        layout.tsx                   # Root layout (Roboto font, global styles)
      components/
        ui/                          # Base components: Button, Card, Input, Textarea, Avatar, Badge
        layout/                      # Header, Sidebar, BottomNav
        plant/                       # PlantCard, PlantGrid (legacy, not currently used)
        chat/                        # ChatMessage, ChatInput, SuggestionPills
      lib/
        supabase/
          client.ts                  # Browser Supabase client (createBrowserClient)
          server.ts                  # Server Supabase client (createServerClient with cookies)
          middleware.ts              # Session refresh middleware
        utils.ts                     # cn(), formatDate, formatRelativeTime, getDaysSince, getDaysUntil
      styles/globals.css             # Tailwind imports + base styles
      types/database.types.ts        # Generated Supabase types
      middleware.ts                   # Next.js middleware entry (calls updateSession)
    tailwind.config.js               # Brand colors, custom shadows, border radius
    next.config.js                   # Image remotePatterns, ignoreBuildErrors, ignoreESLint
    package.json                     # Dependencies
    supabase/migrations/             # SQL migration files
  mobile/                            # SECONDARY - React Native + Expo app (not actively modified)
  styling/                           # Brand assets, logos, Visual Brand Guidelines
```

### Entry points:
- Frontend: `frontend/src/app/layout.tsx` (root), `frontend/src/app/(app)/page.tsx` (dashboard)
- Middleware: `frontend/src/middleware.ts`
- API: `frontend/src/app/api/*/route.ts`

### Generated / excluded files:
- `node_modules/`, `.next/`, `.expo/`, `.env`, `.env.local`, `._*` files (macOS resource forks)
- `frontend/.vercel/` (Vercel project link - linked to chris-larsens-projects/shrubhub-frontend)

### Intentionally non-standard:
- `next.config.js` has `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` due to ~100 pre-existing type errors from Supabase generics. These are non-runtime and being cleaned up incrementally.
- The `(app)` route group layout includes desktop sidebar, mobile bottom nav, and sticky header. All authenticated pages render inside this shell.
- `dashboard-legacy/page.tsx` is the original homepage preserved during redesign.

## 6. API & INTERFACE CONTRACTS

### Internal module boundaries:
- Server components fetch data directly via Supabase server client (no API routes needed for reads)
- Client components call `/api/*` routes for mutations
- API routes handle auth verification, input validation, and Supabase writes

### External APIs (routes, methods, payloads):

**POST /api/plants**
- Body: `{ garden_id, common_name, custom_name?, plant_master_id?, location_in_garden?, location_lat?, location_lng?, acquired_date?, acquisition_source?, acquisition_notes?, status?, health_status?, planted_date?, care_override? }`
- Defaults: status="vegetative", health_status="healthy", acquisition_source="unknown", acquired_date=today
- Returns: `{ success: true, plant: {...} }` with joined gardens and plants_master
- Validates: garden belongs to authenticated user

**GET /api/plants**
- Query params: garden_id?, status?, search?
- Returns: `{ plants: [...] }` filtered to user's gardens

**POST /api/identify-plant**
- Body: `{ image_base64 }`
- Proxies to Supabase Edge Function `/functions/v1/identify-plant`
- Normalizes response to: `{ suggestions: [{ common_name, scientific_name, confidence, plant_master_id? }] }`
- Handles Plant.id format, custom edge function format, and passthrough
- Returns stub `{ suggestions: [], message: "..." }` if edge function returns 404

**POST /api/extract-tag**
- Body: `{ image_base64 }`
- Uses Claude vision (claude-sonnet-4-20250514) to read plant tag/label photos
- Returns: `{ brand?, variety?, care_instructions?, raw_text? }`
- Returns stub response if ANTHROPIC_API_KEY not configured

### Auth boundaries:
- All API routes verify `supabase.auth.getUser()` and return 401 if not authenticated
- Middleware refreshes session cookies on every request
- Login page at `/login`, signup at `/signup`
- Unauthenticated users redirected to `/login` by server components

### Versioning strategy: None. Single production deployment.

## 7. DATA MODELS

### Core entities and relationships:
```
gardeners (1) --< sites (many)
gardeners (1) --< gardens (many)
sites (1) --< gardens (many, via site_id FK, optional)
gardens (1) --< plants (many)
plants_master (1) --< plants (many, via plant_master_id FK, optional)
plants (1) --< plant_photos (many)
plants (1) --< activities (many)
plants (1) --< observations (many)
plants (1) --< care_reminders (many)
plants (1) --< plants (self-ref via parent_plant_id for clones)
```

### Key fields:

**gardeners**: id, auth_user_id, email, display_name, hardiness_zone, timezone, measurement_system

**sites**: id, gardener_id, name, address, description, location_lat, location_lng, boundary (WKT polygon text)

**gardens**: id, gardener_id, site_id?, name, description, garden_type (enum: indoor/outdoor/container/raised_bed/in_ground/greenhouse/community_plot/mixed), location_lat, location_lng, sun_exposure, is_primary

**plants**: id, garden_id, plant_master_id?, parent_plant_id?, common_name, custom_name?, location_in_garden?, location_lat?, location_lng?, acquired_date, acquisition_source (enum: seed/seedling_purchased/mature_purchased/gift/propagation/field_extraction/volunteer/shrubhub_exchange/user_defined/unknown), status (enum: seed/germinating/seedling/vegetative/flowering/fruiting/dormant/alive/struggling/dead/harvested/adopted_out), health_status (enum: healthy/needs_attention/sick/pest_issue/dead), field_extraction_data (JSON), care_override (JSON)

**plants_master**: id, scientific_name, common_names[], family, plant_type, care_guide (JSON), hardiness_zones[], default_image_url

**plant_photos**: id, plant_id, storage_bucket, storage_path, photo_type (enum: identification/tag_label/general/progress/issue/bloom/harvest/before_after), identification_data (JSON - stores tag extraction results), is_primary, display_order, taken_at, mime_type, file_size_bytes

**activities**: id, plant_id, activity_type (enum: watering/fertilizing/pruning/repotting/transplanting/harvesting/treating_pests/treating_disease/staking/mulching/soil_amendment/deadheading/thinning/germination/other), notes, performed_at

### Persistence strategy: PostgreSQL via Supabase. Row-Level Security on all tables. Photos stored in Supabase Storage bucket "plant-photos" at path `plants/{plant_id}/{type}_{timestamp}_{index}.{ext}`.

### Migration strategy: SQL migration files in `frontend/supabase/migrations/` and `mobile/supabase/migrations/`. Applied via Supabase MCP server or dashboard. Pending migration: `20260329_001_add_tag_label_photo_type.sql` (adds 'tag_label' to photo_type enum).

## 8. ENVIRONMENT & SECRETS

### Required environment variables:
| Variable | Scope | Purpose |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Build-time + Runtime | Supabase project endpoint |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Build-time + Runtime | Public Supabase API key |
| ANTHROPIC_API_KEY | Runtime only | Claude API for tag extraction |
| PLANT_ID_API_KEY | Runtime only | Plant identification service |
| OPENWEATHER_API_KEY | Runtime only | Weather data (not yet used in frontend) |

### How secrets are injected in prod:
- Vercel environment variables on project `shrubhub-frontend` under team `chris-larsens-projects`
- Set via `vercel env add` CLI (team scope, not personal account)
- All 5 vars are set for Production environment

### Files intentionally NOT committed:
- `.env`, `.env.local` (contain real keys)
- `frontend/.vercel/` (project link)
- `node_modules/`

### Vercel deployment notes:
- Project: `chris-larsens-projects/shrubhub-frontend`
- Vercel CLI authenticated as `hello-6666` user
- Team `chris-larsens-projects` is the owner (NOT the personal account)
- Deploy command: `cd frontend && npx vercel --prod --yes`
- Must deploy from `frontend/` directory (Root Directory in dashboard should be blank)
- The `.vercel` link file in `frontend/` points to `shrubhub-frontend` project
- Domain `shrubhub.ai` and `www.shrubhub.ai` assigned to this project
- Supabase project ID in URL: `pfkxhoqlfflgjlovgenc` (free tier, may pause after inactivity - check dashboard if DNS errors occur)

## 9. IMPORTANT DESIGN DECISIONS (DO NOT REVISIT CASUALLY)

### Decision: Separate Next.js frontend from mobile Expo app
- Reason: The conversational UI (mobile/Expo) was too buggy. User wanted a traditional, responsive web interface accessible from both laptop and mobile browsers.
- Rejected alternatives: Fixing the Expo web export, using a single shared codebase.

### Decision: Photo-first plant intake flow
- Reason: User's core workflow is: take photo -> identify plant -> fill details -> submit. Background processing (ID + EXIF) runs while user types.
- Rejected alternatives: Mode selection (camera/search/manual) from old UI.

### Decision: Multi-photo with typed slots (identification, tag_label, general)
- Reason: Tag/label photos serve a distinct purpose (AI-extracted care instructions from producer). They need their own photo_type in the DB and a dedicated AI extraction pipeline.
- Rejected alternatives: Single photo only, untyped additional photos.

### Decision: exifr library for EXIF extraction
- Reason: Hand-rolled EXIF parser failed on real-world images (HEIC, varied JPEG structures). exifr handles all formats reliably.
- Rejected alternatives: Custom DataView parser (was the original implementation, broke in production).

### Decision: Browser geolocation fallback for GPS
- Reason: Many mobile browsers strip EXIF GPS data from camera captures for privacy. Geolocation API provides a fallback.
- Rejected alternatives: Requiring GPS in EXIF only.

### Decision: TypeScript build errors ignored (ignoreBuildErrors: true)
- Reason: ~100 pre-existing errors from Supabase generic type inference (gardener?.id produces 'never' type). Non-runtime issues. Being cleaned up incrementally.
- Rejected alternatives: Fixing all types before deploying (too slow for MVP).

### Decision: Plant status default is 'vegetative', acquisition_source default is 'unknown'
- Reason: 'active' was not a valid DB enum value and caused insert failures. 'vegetative' is the most common state for newly acquired plants.
- Rejected alternatives: 'alive' (less specific).

### Decision: Unified git repo at project root
- Reason: Previously frontend/ and mobile/ had separate .git dirs with 1 commit each. Unified for coherent history and single GitHub repo.
- Rejected alternatives: Keeping separate repos.

## 10. CURRENT IMPLEMENTATION STATE

### Implemented and working:
- Dashboard landing page with stats, quick actions, gardens summary, activity feed
- Prominent "Add Plant" CTA on homepage
- Plant intake flow: multi-photo (plant photo, tag/label, additional), async identification, EXIF extraction with geolocation fallback, form with auto-fill, submission to DB
- Plant identification API (proxies to Supabase Edge Function, normalizes response)
- Tag/label AI extraction API (Claude vision reads care instructions)
- Plant photos uploaded to Supabase Storage with plant_photos records
- My Plants list page (queries across all gardens)
- Gardens list page with plant counts
- Sites/Locations list page with garden counts
- Navigation: sidebar (desktop) with Home, Plants, Gardens, Locations, AI Assistant, Activities; bottom nav (mobile) with Home, Plants, Gardens, Locations, Chat
- Auth: login, signup pages, middleware session refresh, protected routes
- Responsive layout: sidebar on desktop, bottom nav on mobile, sticky header

### Implemented but incomplete:
- Plant identification: works when Edge Function is deployed and returns data, but response normalization may need tuning for actual Edge Function response shape
- Chat page: UI exists but chat API may need testing with current Supabase config
- Activities page: renders but has type issues and references non-existent columns (photo_url on plants)
- Settings page: basic UI only
- PlantCard/PlantGrid components: exist but reference non-existent columns (photo_url, last_watered, notes on plants table). Not currently used - plants page uses inline list.

### Not yet implemented:
- Garden create/edit forms (/gardens/add route referenced but no page)
- Site create/edit forms (/sites/add route referenced but no page)
- Plant detail page (/plants/[id])
- Photo display on plant cards (need to query plant_photos for primary photo)
- Care instructions display from tag extraction results
- Weather integration
- Care reminders
- Activity logging from frontend
- Search/filter on plants page

### Known technical debt:
- ~100 TypeScript errors (Supabase generic inference). Build skips type checking.
- ESLint warnings suppressed during build.
- PlantCard and PlantGrid components reference columns that don't exist in the plants table (photo_url, last_watered, notes). These components are not actively used.
- Activities page references garden_id on activities table (activities use plant_id) and photo_url on plants.
- dashboard-legacy/page.tsx preserved but has same type issues.
- Old Vercel projects (mobile, frontend) still exist under chris-larsens-projects team - could be cleaned up.
- `mobile/vercel.json` still has old Expo build config.

## 11. ACTIVE PROBLEMS & EDGE CASES

### Bugs:
- EXIF lat/lng and datetime may not populate if: (a) photo taken directly via mobile camera (browser strips EXIF), (b) image is HEIC without EXIF block, (c) exifr fails silently. Geolocation fallback mitigates GPS issue but not datetime.
- Plant identification suggestions may not display if Edge Function returns unexpected shape not covered by normalization logic.

### Performance risks:
- fileToBase64() loads entire image into memory as base64 string before sending to API. Large photos (>10MB) could cause issues on mobile devices.
- Plants page fetches ALL plants with no pagination. Will degrade with many plants.

### Security concerns:
- NEXT_PUBLIC_SUPABASE_ANON_KEY is exposed to client (by design, Supabase RLS protects data).
- No rate limiting on API routes.
- No input sanitization on plant names or notes (relies on Supabase parameterized queries for SQL injection protection).

### Known flaky behavior:
- Supabase free tier pauses after 7 days of inactivity. If DNS resolution fails for pfkxhoqlfflgjlovgenc.supabase.co, resume the project in Supabase dashboard.
- Vercel deployment must be run from `frontend/` directory. Running from repo root causes broken deployments (uploads raw files without building).
- The `.vercel` link file can get lost or point to wrong project. If deploy fails with "project not found", run: `cd frontend && npx vercel link --project shrubhub-frontend --yes`

## 12. HOW TO CONTINUE (REQUIRED)

### What to work on next:
1. Garden and Site create/edit pages (forms at /gardens/add, /sites/add)
2. Plant detail page (/plants/[id]) showing all photos, care instructions from tag extraction, activities
3. Fix Activities page to use correct schema (plant_id not garden_id, no photo_url)
4. Add pagination to plants list
5. Clean up TypeScript errors incrementally (start with most-used pages)

### Exact files to start with:
- New: `frontend/src/app/(app)/gardens/add/page.tsx`
- New: `frontend/src/app/(app)/sites/add/page.tsx`
- New: `frontend/src/app/(app)/plants/[id]/page.tsx`
- Fix: `frontend/src/app/(app)/activities/page.tsx`
- Fix: `frontend/src/types/database.types.ts` (add sites table if missing)

### Commands to run:
```bash
# Development
cd /home/chris/ShrubHub/frontend
npm install
npm run dev

# Type check (expect ~100 errors, fix incrementally)
npm run type-check

# Deploy
cd /home/chris/ShrubHub/frontend
npx vercel link --project shrubhub-frontend --yes  # only if .vercel is missing
npx vercel --prod --yes

# Git
cd /home/chris/ShrubHub
git add <files>
git commit -m "message

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push
```

### Tests to validate progress:
- No test suite exists. Validate by:
  1. `npm run dev` starts without crash
  2. Visit localhost:3000/login - login form renders
  3. After login, dashboard shows stats
  4. /plants/add - photo upload triggers identification + EXIF extraction
  5. Submit plant - appears in /plants list
  6. /gardens and /sites pages render with data

### What must NOT be changed without explicit discussion:
- Supabase project or credentials
- Database schema (especially enum values for status, health_status, acquisition_source, photo_type)
- Vercel project linking (shrubhub-frontend under chris-larsens-projects)
- Domain assignment (shrubhub.ai)
- The photo-first plant intake flow design
- Multi-photo typed slot architecture (identification, tag_label, general)
