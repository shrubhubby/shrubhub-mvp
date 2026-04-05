# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShrubHub is an AI-powered garden management app. Users create **Sites** (physical locations with polygon boundaries), **Gardens** within sites, and track **Plants** within gardens. Features include GPS location, polygon boundary drawing on satellite maps, AI chat (Anthropic Claude), plant identification, and weather-aware care reminders.

## Repository Structure

**IMPORTANT: The root directory IS the primary Expo app.** The `app/`, `components/`, `api/`, `lib/` directories at the repo root are the active, deployed code. Do NOT edit files in `mobile/` or `frontend/` — those are stale copies and are not deployed.

- **Root (`/`)** — **Primary app (ACTIVE).** React Native + Expo (SDK 54) with Expo Router (file-based routing) and NativeWind (Tailwind for RN). Targets iOS, Android, and web. Deployed to shrubhub.ai.
- **`mobile/`** — **STALE COPY. Do not edit.** Old duplicate of the root Expo app.
- **`frontend/`** — **STALE COPY. Do not edit.** Old Next.js web app, superseded by the root Expo app.
- **`styling/`** — Brand assets, logos, and Visual Brand Guidelines.
- Root-level `.md` files — Architecture docs, database schema, setup guides.

## Development Commands

### Primary App (root directory)
```bash
npm install
npm start              # Expo dev server
npm run web            # Web browser
npm run ios            # iOS simulator
npm run android        # Android emulator
npx expo install <pkg> # Add Expo-compatible dependency
```

No test runner is currently configured.

## Tech Stack

- **Backend:** PostgreSQL via Supabase (PostgREST auto-generated API, Supabase Auth, Supabase Storage for images)
- **AI:** Anthropic Claude SDK (`@anthropic-ai/sdk`) as primary, OpenAI as secondary
- **Maps:** Google Maps (web), react-native-maps (mobile), Leaflet
- **Styling:** TailwindCSS / NativeWind with shared brand color tokens
- **Deployment:** Vercel (web), EAS Build (mobile)

## Architecture Patterns

### Data Model
`gardeners` → `sites` (polygon boundaries in WKT) → `gardens` (polygon boundaries) → `plants` → `plants_master` (species reference). Row-level security enforced via Supabase Auth.

### API Layer
- **Supabase PostgREST** for standard CRUD operations
- **Vercel serverless functions** (frontend `src/app/api/`) for complex logic
- **Mobile `api/` directory** contains server-side handlers for chat, plant identification, etc.

### Key Technical Decisions
- **Separate queries over nested PostgREST joins** — avoids foreign key dependency issues
- **WKT format for polygon boundaries** — stored as text, PostGIS-compatible
- **Pythagorean distance approximation** for nearby garden detection (~5km radius)
- **Platform-specific files** use `.web.tsx` extension for web-only implementations
- **AsyncStorage** for mobile session persistence with Supabase Auth

### Conversational UI
The chat interface uses dynamic rotating center messages (8-12s interval), tap-to-respond activation, and playful loading states ("Checking the soil...", "Consulting the almanac...").

## Brand Guidelines

Authoritative source: `styling/Visual Brand Guidelines.md`

- **Primary green:** `#228B1B`
- **Leaf:** `#A6D856` (light), `#4BA83E` (dark)
- **Ocean palette:** `#0A6F9C`, `#2DA1C4`, `#66CDE1`, `#C5EEF4`
- **Font:** Roboto (400, 500, 700)
- **Border radius:** 8-10px (not pill-shaped)
- **Color coding:** Sites = green, Gardens = blue

## Environment Variables

Both apps need `.env.local` (frontend) or `.env` (mobile) with:
- `EXPO_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- `PLANT_ID_API_KEY`, `OPENWEATHER_API_KEY` (optional)

## MCP Servers

Supabase MCP server is configured in `.claude/settings.local.json` for direct database operations (migrations, SQL, type generation, edge functions).

## Key Reference Documents

- `PROJECT_CONTEXT.md` — Full architecture and design decisions
- `DESIGN_PRINCIPLES.md` — UI/UX philosophy and conversational canvas
- `Database-Schema.md` — Complete PostgreSQL schema
- `SITE_DESIGN.md` — Site design specifications
- `BUILD-INSTRUCTIONS.md` — Setup walkthrough
