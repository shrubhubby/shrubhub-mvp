# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShrubHub is an AI-powered garden management app. Users create **Sites** (physical locations with polygon boundaries), **Gardens** within sites, and track **Plants** within gardens. Features include GPS location, polygon boundary drawing on satellite maps, AI chat (Anthropic Claude), plant identification, and weather-aware care reminders.

## Repository Structure

**CRITICAL — Two active apps exist. Know which one you're editing:**

| Directory | Framework | Deployed to | Status |
|-----------|-----------|-------------|--------|
| **Root (`/`)** | Expo (React Native + web) | EAS Build (mobile) | Active — Expo mobile app |
| **`frontend/`** | Next.js 14 (App Router) | **Vercel → shrubhub.ai** | Active — deployed web app |
| `mobile/` | — | — | **STALE COPY of root. Do NOT edit.** |
| `styling/` | — | — | Brand assets |

- When the user is looking at **shrubhub.ai**, edit files in **`frontend/`**.
- When working on the **Expo mobile app**, edit files at the **root** (`app/`, `components/`, `api/`, `lib/`).
- **`mobile/` is a dead copy of root. Never edit it.**

### Frontend (Next.js) directory structure
```
frontend/
  src/app/(app)/        # Pages (server components by default)
  src/app/api/          # API routes (GET, POST, PUT, DELETE handlers)
  src/components/       # Reusable components (ui/, garden/, plant/, map/, etc.)
  src/lib/              # Utilities (supabase client, utils.ts)
  src/types/            # Generated database types
```

### Deployment
- **shrubhub.ai** = Vercel project `shrubhub-frontend`, root directory `frontend/`, auto-deploys on push to `main`.
- **Expo mobile** = EAS Build from repo root.

## Development Commands

### Frontend (shrubhub.ai)
```bash
cd frontend
npm install
npm run dev            # Dev server (port 3000)
npm run build          # Production build — run this to verify before pushing
```

### Expo App (root)
```bash
npm install
npm start              # Expo dev server
npm run web            # Web browser
```

No test runner is configured in either app.

## UI Component Rules (Frontend / Next.js)

### Server vs Client Components
- Pages in `src/app/(app)/` are **server components** by default (can fetch data with Supabase server client).
- Any component with interactivity (useState, onClick, hover effects) **must be a client component** (`'use client'` at top).
- Pattern: server page fetches data, passes it as props to a `'use client'` component for rendering.

### Component API Reference

**`Card`** (`components/ui/Card.tsx`):
- Props: `children`, `className`, `elevation` (1|2|3), `onClick`
- `cursor-pointer` and `hover:scale` are ONLY applied when `onClick` is provided.
- To make a card clickable, use `onClick` — do NOT wrap in `<Link>` (breaks hover and cursor).

**`Button`** (`components/ui/Button.tsx`):
- Variants: `primary`, `secondary`, `outline`, `ghost`, `icon`
- Sizes: `sm`, `md`, `lg`
- Renders as `<button>` — use `onClick` handler.

**`Badge`** (`components/ui/Badge.tsx`):
- Variants: `healthy`, `attention`, `urgent`, `neutral`
- Sizes: `sm`, `md`

**`Input` / `Textarea`** (`components/ui/Input.tsx`):
- Props: `label`, `error`, `icon`, plus all native input/textarea props.

### Tailwind / CSS Rules

- **Hover visibility**: Use `opacity-0 group-hover:opacity-100` — NOT `text-color/0`.
- **`group-hover`**: The `group` class MUST be on an ancestor that is part of the rendered DOM tree. If using `<Link>` + `<Card>`, `group` on a wrapper div may not propagate. Prefer putting `group` on the `<Card>` itself.
- **Clickable cards**: Use `Card` with `onClick={...}` — this automatically adds `cursor-pointer`. Do NOT rely on `className="cursor-pointer"` on Card.
- **Stop propagation**: When a button is inside a clickable card, use `e.stopPropagation()` to prevent the card's onClick from firing.
- **Custom colors**: `text-coal`, `text-forest`, `bg-soft`, `text-ocean-deep`, `bg-forest`, `text-urgent`, `text-attention`, `text-healthy`. These are defined in `frontend/tailwind.config.ts`.
- **Opacity modifiers**: Use standard Tailwind patterns like `text-coal/60` (60% opacity). Avoid `text-coal/0` — use `opacity-0` instead.

### Navigation Patterns
- **Card → detail page**: Use `Card` with `onClick={() => router.push(...)}` from `useRouter()`. Not `<Link>`.
- **Buttons linking to pages**: Use `<Link href="..."><Button>...</Button></Link>`.
- **Back navigation**: Use `<Link href="/parent"><button><ArrowLeft /></button></Link>`.

### Modal / Dialog Pattern
No dialog library installed. Use a fixed overlay div:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
  <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4">
    {/* content */}
  </div>
</div>
```

### Delete Pattern
- Items with no dependents: show trash icon directly (e.g., empty gardens).
- Items with dependents: trash icon available but warn about cascade (e.g., garden with plants).
- Always confirm with a modal before deleting.
- Use `e.stopPropagation()` when the trash button is inside a clickable card.

## Database Schema (Key Tables)

Reference: `Database-Schema.md` for full schema.

### Critical column names (common mistakes)
- `plants_master.common_names` — TEXT[] (array), NOT `common_name`
- `plants.common_name` — TEXT (singular)
- `plants.parent_plant_id` — UUID, self-referencing for lineage
- `plants.editable_id` — TEXT, user-assignable ID (from QR codes)
- `gardens.boundary` — TEXT, WKT polygon format
- `plants_master.care_guide` — JSONB with structure: `{ watering: {...}, sunlight: string, temperature: {...}, soil: {...}, fertilizing: {...}, pruning: string, toxicity: {...} }`

### Data Model
`gardeners` → `sites` (polygon boundaries in WKT) → `gardens` (polygon boundaries) → `plants` → `plants_master` (species reference). Row-level security enforced via Supabase Auth.

## Tech Stack

- **Backend:** PostgreSQL via Supabase (PostgREST auto-generated API, Supabase Auth, Supabase Storage for images)
- **AI:** Anthropic Claude SDK (`@anthropic-ai/sdk`) as primary, OpenAI as secondary
- **Maps:** Google Maps JavaScript API (web), react-native-maps (mobile)
- **Styling:** TailwindCSS (frontend), NativeWind (Expo)
- **Deployment:** Vercel (frontend → shrubhub.ai), EAS Build (mobile)

## Brand Guidelines

Authoritative source: `styling/Visual Brand Guidelines.md`

- **Primary green:** `#228B1B`
- **Leaf:** `#A6D856` (light), `#4BA83E` (dark)
- **Ocean palette:** `#0A6F9C`, `#2DA1C4`, `#66CDE1`, `#C5EEF4`
- **Font:** Roboto (400, 500, 700)
- **Border radius:** 8-10px (not pill-shaped)
- **Color coding:** Sites = green, Gardens = blue

## Environment Variables

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `ANTHROPIC_API_KEY`
- `PLANT_ID_API_KEY`, `OPENWEATHER_API_KEY` (optional)

### Expo App (root `.env`)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

## API Route Patterns (Frontend)

All routes in `frontend/src/app/api/` follow this pattern:
1. Authenticate via `supabase.auth.getUser()`
2. Get `gardener.id` from `gardeners` table
3. Verify resource ownership (e.g., plant's garden belongs to gardener)
4. Perform operation
5. Return JSON response

Available endpoints: `/api/plants` (GET, POST, DELETE), `/api/gardens` (GET, POST, PUT, DELETE), `/api/activities` (GET, POST), `/api/chat`, `/api/identify-plant`.

## MCP Servers

Supabase MCP server is configured in `.claude/settings.local.json` for direct database operations (migrations, SQL, type generation, edge functions).

## Key Reference Documents

- `Database-Schema.md` — Complete PostgreSQL schema
- `PROJECT_CONTEXT.md` — Full architecture and design decisions
- `DESIGN_PRINCIPLES.md` — UI/UX philosophy and conversational canvas
- `SITE_DESIGN.md` — Site design specifications
- `BUILD-INSTRUCTIONS.md` — Setup walkthrough
- `styling/Visual Brand Guidelines.md` — Visual brand guide
