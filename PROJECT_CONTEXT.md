# PROJECT CONTEXT (AUTHORITATIVE)

## 1. PROJECT IDENTITY
- Project name: ShrubHub Mobile
- Repository purpose: Cross-platform (Web, iOS, Android) gardening application with conversational AI interface for tracking gardens, plants, and care activities. Primary interface is conversational web UI, with mobile apps as secondary.
- Primary user(s): Home gardeners who want to track their plants, log care activities, and receive expert gardening advice from an AI personality named "Early" (a Southern NC master gardener).
- Explicit non-goals: Not a plant identification app, not a social network, not a marketplace. Focus is on personal garden tracking and conversational AI guidance.

## 2. EXECUTION CONSTRAINTS
- Runtime constraints: Web runs on Vercel serverless functions. Mobile apps run via Expo. All API endpoints must respond within 10 seconds (Vercel timeout).
- Hosting / platform constraints: Vercel for web deployment. Supabase for database and auth. Anthropic Claude API for conversational AI (currently Haiku 3).
- Language / framework constraints: TypeScript required. React Native via Expo for cross-platform. No native Swift/Kotlin code allowed (Expo constraints).
- Security constraints: Supabase Row Level Security (RLS) enforced. All API endpoints require Bearer token authentication. CORS enabled for web deployment.
- Regulatory or compliance constraints: None currently. User data stored in Supabase (US region).

## 3. TECH STACK (LOCKED UNLESS OVERRIDDEN)
- Frontend: React Native 0.81.5, React 19.1.0, Expo 54, NativeWind 4 (Tailwind for RN)
- Backend: Vercel Serverless Functions (TypeScript), Supabase (PostgreSQL + Auth)
- Shared libraries: @supabase/supabase-js, @anthropic-ai/sdk, Expo Router
- Package managers: npm (lockfile committed)
- Build tools: Expo CLI, TypeScript 5.9
- Test tools: None currently implemented
- Lint / format tools: None currently configured

## 4. SYSTEM ARCHITECTURE
- High-level flow:
  1. User loads conversational.html (public/conversational.html - primary interface)
  2. User authenticates via Supabase Auth (email/password)
  3. User interacts with Early (AI) via chat interface
  4. Chat messages POST to /api/chat with session token
  5. /api/chat fetches user context (gardens, plants, activities) from Supabase
  6. /api/chat builds dynamic system prompt based on user state
  7. /api/chat calls Claude API with context and conversation history
  8. Response stored in conversation_messages table and returned to UI
  9. User can also use traditional tab-based mobile UI (/app route)

- Separation of concerns:
  - /public/conversational.html: Standalone conversational UI (vanilla JS, primary interface)
  - /api/*.ts: Vercel serverless API endpoints (TypeScript)
  - /app/: Expo Router mobile UI (React Native, secondary interface)
  - /lib/supabase: Supabase client initialization
  - /types: Generated TypeScript types from Supabase schema

- State management strategy:
  - Conversational UI: No React state, vanilla JS with direct DOM manipulation
  - Mobile UI: React hooks (useState, useEffect), AsyncStorage for session persistence
  - Server: Stateless, all state in Supabase tables

- Error handling strategy:
  - API endpoints: try/catch with 500 status codes, console.error for debugging
  - Frontend: Display user-friendly error messages in chat response
  - No global error boundary currently

- Logging / observability approach:
  - Console.error in API endpoints
  - No structured logging, APM, or error tracking service
  - Conversation history stored in conversation_messages table

## 5. REPOSITORY STRUCTURE
Repo root: /Users/chris.larsen/Documents/personal/ShrubHub/mobile

Key directories and purpose:
- /api: Vercel serverless functions (chat.ts, gardens.ts, plants.ts, activities.ts)
- /app: Expo Router pages (mobile/native UI, secondary interface)
  - /(auth): Login, signup screens
  - /(tabs): Main tab navigation (index, gardens, plants, activities, chat, settings)
  - /gardens/[id]: Dynamic garden detail routes
  - /plants/[id]: Dynamic plant detail routes
- /public: Static web assets
  - conversational.html: PRIMARY INTERFACE - standalone conversational AI UI
- /assets: Static assets copied during build (includes conversational.html)
- /components: Reusable React Native components (ui/, layout/, plant/, chat/)
- /lib: Utility code (supabase client)
- /types: TypeScript types (database.types.ts auto-generated from Supabase)
- /supabase/migrations: Database migration SQL files

Entry points:
- Web: public/conversational.html (index.html after build)
- Mobile: expo-router/entry (app/_layout.tsx)
- API: api/*.ts (Vercel serverless functions)

Generated / excluded files:
- node_modules/, .expo/, .vercel/, dist/
- .env (secrets, not committed)
- .DS_Store (macOS metadata)

Anything intentionally weird or non-standard:
- Build command swaps index.html with conversational.html (vercel.json buildCommand)
- Original Expo web build moved to _app.html, conversational.html becomes root
- Assets folder duplicates conversational.html for mobile bundling
- conversational.html is vanilla JS, not React (intentional for simplicity)

## 6. API & INTERFACE CONTRACTS

Internal module boundaries:
- /api endpoints are stateless, no shared state between requests
- Each endpoint independently verifies auth token and fetches user context
- Conversational UI (public/conversational.html) is completely decoupled from Expo app

External APIs (routes, methods, payloads):
- POST /api/chat
  - Headers: Authorization: Bearer {supabase_token}
  - Body: { message: string, session_id?: string }
  - Response: { success: true, message: string, session_id: string }

- GET /api/gardens
  - Headers: Authorization: Bearer {supabase_token}
  - Response: { gardens: Garden[] }

- POST /api/gardens
  - Headers: Authorization: Bearer {supabase_token}
  - Body: { name: string, description?: string, garden_type: string, ... }
  - Response: { success: true, garden: Garden }

- GET /api/plants
  - Headers: Authorization: Bearer {supabase_token}
  - Query: ?garden_id={uuid} (optional)
  - Response: { plants: Plant[] }

- POST /api/plants
  - Headers: Authorization: Bearer {supabase_token}
  - Body: { garden_id: string, common_name: string, ... }
  - Response: { success: true, plant: Plant }

- GET /api/activities
  - Headers: Authorization: Bearer {supabase_token}
  - Query: ?plant_id={uuid}&activity_type={string}&limit={number}
  - Response: { activities: Activity[] }

- POST /api/activities
  - Headers: Authorization: Bearer {supabase_token}
  - Body: { plant_id: string, activity_type: string, notes?: string, ... }
  - Response: { success: true, activity: Activity }

Auth boundaries:
- All /api endpoints require valid Supabase session token in Authorization header
- Token verified via supabase.auth.getUser(token)
- Gardener ID resolved from auth_user_id before any data access
- Row Level Security (RLS) policies enforce gardener_id filtering in Supabase

Versioning strategy:
- No API versioning currently
- Breaking changes deployed directly (small user base)

## 7. DATA MODELS

Entities:
- gardeners: User profiles linked to auth
- gardens: Garden spaces owned by gardeners
- plants: Individual plants in gardens
- plants_master: Reference data for plant species (not directly user-editable)
- plant_photos: Photos of plants
- activities: Care activities performed on plants (watering, fertilizing, etc)
- observations: Text observations about plants
- care_reminders: Scheduled care tasks
- conversation_sessions: Chat session metadata
- conversation_messages: Individual chat messages

Key fields (see types/database.types.ts for full schema):

gardeners:
- id: uuid (PK)
- auth_user_id: uuid (FK to auth.users)
- email: string
- display_name: string | null
- timezone: string (default UTC)
- measurement_system: 'imperial' | 'metric'
- notification_preferences: json
- bot_personality_settings: json

gardens:
- id: uuid (PK)
- gardener_id: uuid (FK)
- name: string
- garden_type: enum (indoor, outdoor, container, raised_bed, etc)
- location_lat/lng: number | null
- sun_exposure: enum | null
- is_primary: boolean
- archived_at: timestamp | null

plants:
- id: uuid (PK)
- garden_id: uuid (FK)
- plant_master_id: uuid | null (FK to plants_master)
- common_name: string
- custom_name: string | null
- status: enum (seed, germinating, alive, dead, etc)
- health_status: enum (healthy, needs_attention, sick, pest_issue, dead)
- acquired_date: date
- acquisition_source: enum
- archived_at: timestamp | null

activities:
- id: uuid (PK)
- plant_id: uuid (FK)
- activity_type: enum (watering, fertilizing, pruning, etc)
- notes: string | null
- quantity: number | null
- quantity_unit: string | null
- performed_at: timestamp
- created_via: enum (manual, bot, web_app, etc)

conversation_sessions:
- id: uuid (PK)
- gardener_id: uuid (FK)
- created_at: timestamp
- last_message_at: timestamp

conversation_messages:
- id: uuid (PK)
- session_id: uuid (FK)
- role: enum (user, assistant, system)
- content: text
- created_at: timestamp

Relationships:
- gardeners 1:N gardens
- gardens 1:N plants
- plants 1:N activities
- plants 1:N observations
- plants 1:N plant_photos
- plants 1:N care_reminders
- gardeners 1:N conversation_sessions
- conversation_sessions 1:N conversation_messages

Persistence strategy:
- Supabase PostgreSQL database
- Row Level Security (RLS) enabled on all tables
- All queries go through Supabase client (enforces RLS)

Migration strategy:
- SQL migrations in /supabase/migrations/
- Applied manually via Supabase dashboard or CLI
- No automated migration runner in app code

## 8. ENVIRONMENT & SECRETS

Required environment variables:
- EXPO_PUBLIC_SUPABASE_URL: Supabase project URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY: Supabase anon/public API key
- ANTHROPIC_API_KEY: Claude API key for chat endpoint

Scope:
- EXPO_PUBLIC_*: Available in frontend build-time (Expo convention)
- ANTHROPIC_API_KEY: Backend runtime only (Vercel environment variable)

How secrets are injected in prod:
- Frontend: Expo build process injects EXPO_PUBLIC_* vars
- Backend: Vercel injects environment variables at runtime
- API endpoints access via process.env

Files intentionally NOT committed:
- .env: Local development secrets
- .env.local, .env.production: Environment-specific overrides
- .vercel/: Vercel deployment metadata

## 9. IMPORTANT DESIGN DECISIONS (DO NOT REVISIT CASUALLY)

Decision: Use vanilla JS for conversational UI instead of React
Reason: Faster load time, simpler deployment, no build step for primary interface. Conversational UI is standalone page that needs to be extremely fast.
Rejected alternatives: React (too heavy for single page), Vue (unfamiliar to team), Svelte (compiler adds complexity)

Decision: Swap index.html with conversational.html during build
Reason: Primary interface should be at root (/), traditional mobile app at /app. Vercel build command handles swap.
Rejected alternatives: Using React app as root (slower, more complex), subdomain for conversational UI (requires DNS setup)

Decision: Duplicate conversational.html in /public and /assets
Reason: /public for Vercel web deployment, /assets for Expo mobile bundling. Keep in sync with cp command.
Rejected alternatives: Single source with symlink (doesn't work in Vercel), build-time copy (adds complexity)

Decision: Use Claude Haiku (not Sonnet/Opus) for chat
Reason: Cost optimization for high-volume conversational interface. 1024 max_tokens sufficient for chat responses.
Rejected alternatives: Sonnet (too expensive for chat volume), GPT-4 (want Claude's personality), open-source LLM (quality concerns)

Decision: Dynamic system prompt based on user state
Reason: Personalize AI guidance based on onboarding progress (no gardens, no plants, no activities, etc). Better UX than generic responses.
Rejected alternatives: Static system prompt (less helpful), RAG system (overengineered for current scale), fine-tuned model (too expensive)

Decision: Store conversation history in Supabase, not client-side
Reason: Persist across devices, enable future analytics, maintain context in system prompt. Fetch last 20 messages for context.
Rejected alternatives: LocalStorage (doesn't sync), no history (poor UX), infinite history (context length issues)

Decision: Show 2-3 rotating suggestion buttons every 5-20 seconds
Reason: Encourage engagement without overwhelming user. Randomization prevents repetition. State-based suggestions guide onboarding.
Rejected alternatives: Static buttons (boring), all suggestions at once (cluttered), no suggestions (lower engagement)

Decision: Auto-activate input and show suggestions within 3 seconds for users with limited data
Reason: Proactive engagement for new users who might not know what to do. Reduces time to first interaction.
Rejected alternatives: Wait for user click (passive), show suggestions after first message (too late), always auto-activate (annoying for returning users)

Decision: Vanilla JS floating suggestion buttons with CSS animations
Reason: Lightweight, no framework overhead, smooth animations. Text-based links instead of heavy buttons match conversational aesthetic.
Rejected alternatives: React components (overkill), heavy UI library (slow), static text links (less engaging)

## 10. CURRENT IMPLEMENTATION STATE

Implemented and working:
- Conversational UI (public/conversational.html) with auth overlay, input system, chat responses
- AI personality "Early" with Southern NC master gardener tone
- Dynamic system prompt based on user state (brand_new, no_gardens, has_gardens_no_plants, has_plants_no_activities, active, returning)
- Floating suggestion system with 20+ suggestions covering all user states
- Suggestion rotation (2-3 random suggestions every 5-20 seconds)
- Auto-activation of input for users with limited data (within 3 seconds)
- Activity logging suggestions (watering, fertilizing, pruning, observations)
- Auto-submit animation with Enter button visual feedback (1.5s pause, 0.3s fade, 0.4s press)
- API endpoints: /api/chat, /api/gardens, /api/plants, /api/activities
- Session persistence (localStorage conversation_session_id)
- Conversation history (last 20 messages in system prompt)
- User context fetching (gardens, plants, activities for each chat request)
- Message formatting with emphasis on key words
- Glassmorphism design for chat responses (rgba backgrounds, backdrop blur)
- Mobile UI (Expo Router): Login, signup, gardens, plants, activities tabs
- Supabase auth integration (email/password)

Implemented but incomplete:
- Mobile UI is functional but not primary focus (conversational UI is primary)
- Plant photos table exists but no upload UI implemented
- Observations table exists but not integrated into chat
- Care reminders table exists but no reminder system implemented
- plants_master reference data table exists but not populated
- No settings UI for bot_personality_settings or notification_preferences

Not yet implemented:
- Plant identification via photos
- Weather integration for care suggestions
- Push notifications for reminders
- Social features (sharing, community)
- Export/import data
- Dark mode
- Accessibility improvements (screen reader support, keyboard navigation)
- Error tracking service (Sentry, etc)
- Analytics (user behavior, conversation patterns)
- Tests (unit, integration, e2e)

Known technical debt:
- conversational.html is 3600+ lines (should be modularized)
- API endpoints duplicate auth logic (should extract to middleware)
- No rate limiting on API endpoints (vulnerable to abuse)
- No caching strategy (every chat request fetches full context)
- Hardcoded Supabase credentials in conversational.html (should use env vars in build)
- No TypeScript types for API request/response bodies
- Suggestion pool duplicates watering icon/message (should dedupe)
- No cleanup of old conversation sessions (table will grow indefinitely)
- Manual cp command to sync conversational.html between /public and /assets (should automate)

## 11. ACTIVE PROBLEMS & EDGE CASES

Bugs:
- None currently known (suggestions system was not appearing but debug logging resolved it)

Performance risks:
- Fetching gardens, plants, activities on every chat request (3 sequential fetches)
- No limit on conversation_messages table growth (could slow queries over time)
- Claude API calls are sequential, not streamed (user waits for full response)
- Suggestion rotation uses setTimeout recursion (could leak memory if not cleaned up)

Security concerns:
- CORS set to wildcard '*' (should restrict to specific origin in production)
- No rate limiting on chat endpoint (could abuse Claude API quota)
- Supabase anon key exposed in client code (acceptable for RLS-protected data, but consider alternatives)
- No CSRF protection on API endpoints (Vercel functions don't have built-in protection)
- No input sanitization on user messages before storing in database

Known flaky behavior:
- Suggestion rotation interval is random (5-20s), so sometimes two sets appear close together
- Enter button animation timing can feel slow on fast connections (1.5s pause is fixed)
- Chat response dismissal works but no visual feedback for where to click

## 12. HOW TO CONTINUE (REQUIRED)

What to work on next:
1. Performance optimization: Parallelize context fetching in /api/chat (Promise.all for gardens, plants, activities)
2. Caching: Add conversation session caching (store user context in session, refresh every 5 minutes)
3. Modularize conversational.html: Extract suggestion system, auth overlay, chat handling into separate script files
4. API middleware: Extract auth verification into reusable function
5. Rate limiting: Add Vercel rate limiting to /api/chat endpoint
6. Analytics: Track conversation patterns, suggestion clicks, user drop-off points

Exact files to start with:
- /Users/chris.larsen/Documents/personal/ShrubHub/mobile/api/chat.ts (performance optimization)
- /Users/chris.larsen/Documents/personal/ShrubHub/mobile/public/conversational.html (modularization)

Commands to run:
- npm run web: Start local web dev server
- npm start: Start Expo dev server (for mobile testing)
- vercel dev: Test API endpoints locally
- vercel deploy: Deploy to production

Tests to validate progress:
- Manual testing: Load conversational UI, sign up new user, verify suggestions appear within 3 seconds
- Manual testing: Send chat message, verify response includes user context (gardens, plants)
- Manual testing: Click suggestion button, verify auto-submit animation works
- Manual testing: Wait 5-20 seconds, verify suggestions rotate
- Performance testing: Check Network tab for parallel vs sequential API calls

What must NOT be changed without explicit discussion:
- conversational.html must remain vanilla JS (no React conversion)
- Build command in vercel.json (swapping index.html is critical)
- Claude model (Haiku) - cost implications of switching to Sonnet/Opus
- Suggestion rotation timing (5-20s) - carefully tuned for engagement
- Auto-activation timing (3s) - carefully tuned for new user UX
- System prompt structure (state detection logic is core to AI personality)
- Database schema (migrations required, affects all users)
- API endpoint paths (would break existing clients)
- Supabase RLS policies (security implications)
