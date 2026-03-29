# ShrubHub Frontend Setup Guide

**Complete Next.js + Supabase + AI Integration**

---

## Prerequisites

✅ Supabase project created (see Setup-Guide-Supabase.md)
✅ Node.js 18+ installed
✅ npm or yarn installed

---

## Step 1: Install Dependencies

In the `frontend/` directory:

```bash
cd ~/Documents/personal/ShrubHub/frontend

# Core dependencies
npm install next@latest react@latest react-dom@latest typescript@latest

# Supabase
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# UI & Styling
npm install tailwindcss@latest postcss@latest autoprefixer@latest
npm install class-variance-authority clsx tailwind-merge lucide-react

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# AI & APIs
npm install ai openai @anthropic-ai/sdk

# Dev dependencies
npm install -D @types/node @types/react @types/react-dom
npm install -D eslint eslint-config-next
```

---

## Step 2: Initialize Tailwind CSS

```bash
npx tailwindcss init -p
```

This creates:
- `tailwind.config.js`
- `postcss.config.js`

---

## Step 3: Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home/dashboard
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── garden/
│   │   │   └── page.tsx
│   │   ├── chat/
│   │   │   └── page.tsx
│   │   ├── plant/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── chat/
│   │       │   └── route.ts     # AI chat endpoint
│   │       ├── identify-plant/
│   │       │   └── route.ts     # Plant.id integration
│   │       └── weather/
│   │           └── route.ts     # Weather API
│   ├── components/
│   │   ├── ui/                  # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Badge.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── plant/
│   │   │   ├── PlantCard.tsx
│   │   │   ├── PlantDetail.tsx
│   │   │   └── AddPlantFlow.tsx
│   │   ├── chat/
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── SuggestionPill.tsx
│   │   └── garden/
│   │       ├── GardenOverview.tsx
│   │       └── PlantGrid.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser client
│   │   │   ├── server.ts        # Server client
│   │   │   └── middleware.ts    # Auth middleware
│   │   ├── ai/
│   │   │   ├── chat.ts          # AI chat logic
│   │   │   └── intent.ts        # Intent detection
│   │   ├── api/
│   │   │   ├── plantid.ts       # Plant.id API
│   │   │   └── weather.ts       # Weather API
│   │   └── utils.ts             # Utility functions
│   ├── hooks/
│   │   ├── useSupabase.ts
│   │   ├── usePlants.ts
│   │   └── useChat.ts
│   ├── types/
│   │   └── database.types.ts    # Generated from Supabase
│   └── styles/
│       └── globals.css
├── public/
│   ├── shrubhub_logo.svg
│   └── shrubhub.png
├── .env.local                   # Environment variables
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

We'll create all of these files step by step.

---

## Step 4: Key Configuration Files

I'll create these in separate files in the codebase.

---

## Step 5: Get API Keys

### Plant.id API

1. Go to [plant.id](https://web.plant.id/plant-identification-api/)
2. Sign up for free account
3. Get API key from dashboard
4. Free tier: 100 requests/month

### OpenWeather API

1. Go to [openweathermap.org/api](https://openweathermap.org/api)
2. Sign up
3. Get API key
4. Free tier: 1000 calls/day

### Anthropic Claude API (or OpenAI)

**Option A: Anthropic Claude**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up
3. Get API key
4. $5 free credit

**Option B: OpenAI**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up
3. Get API key
4. Pay-as-you-go pricing

---

## Step 6: Environment Variables

Create `.env.local`:

```bash
# Supabase (from Step 1.3 of Supabase setup)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Plant.id
PLANT_ID_API_KEY=your_plant_id_key

# Weather
OPENWEATHER_API_KEY=your_weather_key

# AI (choose one)
ANTHROPIC_API_KEY=your_claude_key
# OR
OPENAI_API_KEY=your_openai_key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 7: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Architecture Overview

### Authentication Flow

```
1. User visits app
2. Supabase checks for session
3. If no session → redirect to /login
4. User signs up/in
5. Supabase creates auth.users record
6. Trigger creates gardeners record
7. Redirect to dashboard
```

### Data Flow

```
Component → Hook → Supabase Client → Database
         ← Hook ← Supabase Client ← Database
```

### AI Chat Flow

```
User types message
→ Frontend sends to /api/chat
→ Intent detection analyzes message
→ Claude/GPT generates response + function calls
→ Execute functions (log activity, query data, etc.)
→ Return response to frontend
→ Update UI
```

### Plant Identification Flow

```
User takes photo
→ Upload to Supabase Storage
→ Call /api/identify-plant
→ Send image to Plant.id
→ Get species + confidence
→ Match or create plants_master record
→ Return to frontend
→ Guide user through plant onboarding
```

---

## Development Workflow

### 1. Start with Authentication

- [ ] Create login page
- [ ] Implement Supabase Auth
- [ ] Test sign up/sign in flow
- [ ] Create protected routes

### 2. Build Core UI

- [ ] Implement design system components
- [ ] Build layout (header, nav, sidebar)
- [ ] Test responsive design

### 3. Plant Management

- [ ] Garden overview page
- [ ] Add plant flow
- [ ] Plant detail view
- [ ] Activity logging

### 4. AI Integration

- [ ] Chat interface
- [ ] Intent detection
- [ ] Function calling
- [ ] Conversation persistence

### 5. API Integrations

- [ ] Plant.id for identification
- [ ] Weather API for recommendations
- [ ] Photo uploads to Supabase Storage

---

## Testing Checklist

### Authentication
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Sign out
- [ ] Protected routes redirect
- [ ] Session persistence

### Database
- [ ] Create garden
- [ ] Add plant
- [ ] Log activity
- [ ] Add observation
- [ ] View plant history

### Storage
- [ ] Upload plant photo
- [ ] Set primary photo
- [ ] Delete photo
- [ ] View photo in UI

### AI Chat
- [ ] Send message
- [ ] Receive response
- [ ] Execute function call
- [ ] Maintain conversation context
- [ ] Handle errors

### Plant Identification
- [ ] Upload photo
- [ ] Get identification
- [ ] Create plant from ID
- [ ] Handle low confidence
- [ ] Manual override

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Environment Variables in Production

Add all `.env.local` variables to Vercel:
1. Go to project settings
2. Environment Variables
3. Add each variable
4. Redeploy

---

## Troubleshooting

### Issue: Supabase client errors

**Solution:**
- Verify environment variables are set
- Check NEXT_PUBLIC_ prefix for client-side vars
- Restart dev server after adding env vars

### Issue: RLS blocking queries

**Solution:**
- Ensure user is authenticated
- Check RLS policies match your queries
- Verify auth token is being passed

### Issue: AI responses are slow

**Solution:**
- Implement streaming responses
- Show typing indicator
- Cache common responses
- Use faster models for simple queries

### Issue: Image uploads failing

**Solution:**
- Check file size < 50MB
- Verify MIME type is allowed
- Check storage bucket policies
- Verify signed URL generation

---

## Next Steps

Once setup is complete:

1. ✅ Run the app locally
2. ✅ Create test account
3. ✅ Add first plant
4. ✅ Test AI chat
5. ✅ Upload plant photo
6. ✅ Log activities
7. ✅ Verify all features work

Then we'll polish the UI and add advanced features!

---

**Ready to start building? Let me create all the necessary files!**
