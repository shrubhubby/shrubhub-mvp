# ShrubHub - Build Instructions

**Quick start guide to get your app running**

---

## Current Status

✅ Product planning complete
✅ Database schema designed
✅ Wireframes and user flows complete
✅ Design specifications with official brand guidelines
✅ Working HTML mockup reference

## What We're Building

**ShrubHub - "Grow with the Flow"**

An AI-powered gardening companion that helps you:
- Track plants with photos and care history
- Get AI recommendations via conversational chat
- Identify plants automatically
- Receive weather-aware care reminders
- Build a plant care journal

---

## Setup Sequence

### Phase 1: Backend Setup (30-45 minutes)

**Follow: `Setup-Guide-Supabase.md`**

1. ✅ Create Supabase account
2. ✅ Run database migration script
3. ✅ Set up storage bucket for photos
4. ✅ Configure authentication
5. ✅ Seed initial plant data
6. ✅ Save environment variables

**You should have:**
- Supabase project URL
- Anon key
- Service role key
- 9 database tables created
- Storage bucket configured
- RLS policies in place

---

### Phase 2: Frontend Setup (15-30 minutes)

**Follow: `Frontend-Setup-Guide.md`**

1. Install dependencies:
```bash
cd ~/Documents/personal/ShrubHub/frontend
npm install
```

2. Create `.env.local` with your keys:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Plus API keys for Plant.id, Weather, Claude/OpenAI
```

3. Copy brand assets:
```bash
cp ../styling/shrubhub_logo.svg public/
cp ../styling/shrubhub.png public/
```

---

### Phase 3: Core Files Creation (1-2 hours)

I'll create these files for you:

**Configuration:**
- [x] package.json
- [ ] tsconfig.json
- [ ] tailwind.config.js
- [ ] next.config.js
- [ ] .gitignore

**Core App:**
- [ ] src/app/layout.tsx
- [ ] src/app/page.tsx
- [ ] src/styles/globals.css

**Supabase Integration:**
- [ ] src/lib/supabase/client.ts
- [ ] src/lib/supabase/server.ts
- [ ] src/types/database.types.ts

**UI Components (from official design):**
- [ ] src/components/ui/Button.tsx
- [ ] src/components/ui/Input.tsx
- [ ] src/components/ui/Card.tsx
- [ ] src/components/layout/Header.tsx
- [ ] src/components/layout/BottomNav.tsx

**Plant Components:**
- [ ] src/components/plant/PlantCard.tsx
- [ ] src/components/plant/PlantGrid.tsx

**Chat Components:**
- [ ] src/components/chat/ChatMessage.tsx
- [ ] src/components/chat/ChatInput.tsx

**API Routes:**
- [ ] src/app/api/chat/route.ts
- [ ] src/app/api/identify-plant/route.ts

---

## File Creation Strategy

Since there are many files, I'll create them in priority order:

### Priority 1: Get App Running (Basic)
1. Config files (TypeScript, Tailwind, Next.js)
2. Basic layout
3. Homepage with brand styling
4. Supabase connection

### Priority 2: Authentication
5. Login page
6. Auth flow
7. Protected routes

### Priority 3: Core Features
8. Garden overview
9. Plant cards with real data
10. Add plant flow

### Priority 4: AI Integration
11. Chat interface
12. AI endpoint
13. Intent detection
14. Function calling

### Priority 5: Polish
15. All pages
16. Responsive design
17. Error handling
18. Loading states

---

## Quick Start Commands

**After all files are created:**

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
# http://localhost:3000
```

---

## What You Need to Provide

### Required API Keys

1. **Supabase** (from setup):
   - Project URL
   - Anon key
   - Service role key

2. **Plant.id** (for plant identification):
   - Sign up: https://web.plant.id/
   - Free tier: 100 requests/month
   - Add to `.env.local`: `PLANT_ID_API_KEY=...`

3. **OpenWeather** (for care recommendations):
   - Sign up: https://openweathermap.org/api
   - Free tier: 1000 calls/day
   - Add to `.env.local`: `OPENWEATHER_API_KEY=...`

4. **Anthropic Claude** OR **OpenAI** (for AI chat):
   - Claude: https://console.anthropic.com ($5 free credit)
   - OpenAI: https://platform.openai.com (pay-as-you-go)
   - Add to `.env.local`: `ANTHROPIC_API_KEY=...` OR `OPENAI_API_KEY=...`

---

## Development Workflow

### 1. Run Supabase Setup (Do This First)
```bash
# Follow Setup-Guide-Supabase.md
# This creates your database
```

### 2. Get API Keys
```bash
# Sign up for Plant.id, Weather, and AI services
# Save keys to .env.local
```

### 3. Install & Run
```bash
cd frontend
npm install
npm run dev
```

### 4. Test Features
- [ ] Sign up
- [ ] Create garden
- [ ] Add plant (with photo)
- [ ] Chat with AI
- [ ] Log activity
- [ ] View plant detail

---

## Reference Documents

**Product & Planning:**
- `ShrubHub-Origin.md` - Original vision
- `User-Interview-Guide.md` - How to validate with users

**Design:**
- `styling/Visual Brand Guidelines.md` - **THE KING** (authoritative)
- `Design-Specifications.md` - Implementation guide
- `Wireframes-and-User-Flows.md` - UX flows
- `styling/shrubhub-mockup.html` - Working prototype

**Technical:**
- `Database-Schema.md` - Database design
- `Setup-Guide-Supabase.md` - Backend setup
- `Frontend-Setup-Guide.md` - Frontend setup

---

## Timeline Estimate

**Total: 6-12 hours to working MVP**

- Backend setup: 45 min ✅
- Frontend setup: 30 min
- Core files creation: 2 hours
- Authentication: 1 hour
- Plant features: 2 hours
- AI integration: 2 hours
- Testing & polish: 2 hours

---

## Next Immediate Steps

**What you should do right now:**

1. **Follow Setup-Guide-Supabase.md** completely
   - Create Supabase project
   - Run the big SQL script
   - Set up storage
   - Test with a user

2. **Get your API keys:**
   - Plant.id
   - OpenWeather
   - Anthropic or OpenAI

3. **Tell me when ready**, and I'll create all the frontend files

OR

4. **If you want to dive in now**, I can start creating the configuration files and core components while you work on Supabase setup

---

## What I'll Create Next

Once you're ready, I'll generate:

1. All TypeScript/Next.js config files
2. Tailwind setup with official ShrubHub colors
3. Supabase client utilities
4. Base UI components (Button, Input, Card, etc.)
5. Layout components (Header, Nav, Sidebar)
6. Plant components (Card, Grid, Detail)
7. Chat interface
8. API routes for AI and plant identification
9. All necessary pages (login, garden, chat, etc.)

**Every component will use the official ShrubHub brand guidelines!**

---

## Questions?

**Common questions:**

**Q: Can I start without all API keys?**
A: Yes! You can build and test without Plant.id/Weather/AI. Just mock the responses initially.

**Q: Can I use the HTML mockup?**
A: Yes! It's in `styling/shrubhub-mockup.html`. You can extract React components from it.

**Q: What if I get stuck?**
A: Each setup guide has a troubleshooting section. Also check Supabase docs.

**Q: Can I change the design?**
A: Please follow Visual Brand Guidelines.md for consistency. Colors, fonts, etc. are specified there.

---

**Ready to build ShrubHub? Let's go! 🌿**

Tell me:
1. Have you completed Supabase setup?
2. Do you have your API keys?
3. Should I start creating all the frontend files?
