# ShrubHub Frontend

An AI-powered gardening companion built with Next.js, Supabase, and official ShrubHub branding.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase project set up (see parent directory `Setup-Guide-Supabase.md`)
- API keys for:
  - Plant.id (plant identification)
  - OpenWeather (weather data)
  - Anthropic Claude or OpenAI (AI chat)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` and add your keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   PLANT_ID_API_KEY=your_plant_id_key
   OPENWEATHER_API_KEY=your_openweather_key
   ANTHROPIC_API_KEY=your_anthropic_key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
src/
├── app/                       # Next.js app router
│   ├── (auth)/               # Auth pages (login, signup)
│   ├── (app)/                # Main app pages
│   └── api/                  # API routes
├── components/               # React components
│   ├── ui/                  # Base UI (Button, Input, Card, etc.)
│   ├── layout/              # Layout (Header, Sidebar, BottomNav)
│   ├── plant/               # Plant components
│   └── chat/                # Chat components
├── lib/                     # Utilities
│   ├── supabase/           # Supabase clients
│   └── utils.ts            # Helper functions
└── types/                  # TypeScript types
```

## 🎨 Design System

- **Primary:** `#228B1B` (Deep Forest Green)
- **Ocean Blues:** `#0A6F9C`, `#2DA1C4`, `#66CDE1`
- **Font:** Roboto (400, 500, 700)
- **Radius:** 8-10px (NOT pill-shaped)

## 🛠️ Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## 📚 Learn More

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

Built with 🌱 by ShrubHub
