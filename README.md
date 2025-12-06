# ShrubHub Mobile

React Native app for Web, iOS, and Android using Expo + NativeWind + Supabase.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- For iOS: Xcode (Mac only)
- For Android: Android Studio

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the app:**

   **Web:**
   ```bash
   npm run web
   ```

   **iOS (Mac only):**
   ```bash
   npm run ios
   ```

   **Android:**
   ```bash
   npm run android
   ```

## 📁 Project Structure

```
mobile/
├── app/                      # Expo Router pages
│   ├── (auth)/              # Auth pages (login, signup)
│   ├── (tabs)/              # Main app tabs
│   └── _layout.tsx          # Root layout
├── components/              # React Native components
│   ├── ui/                 # Base UI (Button, Input, Card, etc.)
│   ├── layout/             # Layout (Header, BottomNav)
│   ├── plant/              # Plant components
│   └── chat/               # Chat components
├── lib/                    # Utilities
│   ├── supabase/          # Supabase client
│   └── utils.ts           # Helper functions
├── types/                 # TypeScript types
└── assets/               # Images, fonts, etc.
```

## 🎨 Design System

Built with **NativeWind** (Tailwind for React Native):

- **Primary:** `#228B1B` (Deep Forest Green)
- **Ocean Blues:** `#0A6F9C`, `#2DA1C4`, `#66CDE1`
- **Font:** Roboto (400, 500, 700) - Loaded via `@expo-google-fonts/roboto`
- **Radius:** 10px (rounded-md)

## 🔌 Features

- ✅ **Cross-platform:** Web, iOS, Android
- ✅ **NativeWind:** Tailwind-like styling
- ✅ **Expo Router:** File-based routing
- ✅ **Supabase:** Backend & Auth
- ✅ **TypeScript:** Full type safety
- ✅ **Official ShrubHub branding**

## 🛠️ Development

### Available Scripts

- `npm start` - Start Expo dev server
- `npm run web` - Run on web
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator

### Database Types

If you update your Supabase schema, regenerate types:

```bash
npx supabase gen types typescript --project-id your-project-id > types/database.types.ts
```

## 📱 Platform-Specific Notes

### Web
- Uses custom bottom nav component
- Responsive design
- Progressive Web App (PWA) ready

### iOS
- Native tab bar
- Safe area handling
- Optimized for iPhone & iPad

### Android
- Material Design components
- Edge-to-edge display
- Android navigation gestures

## 🔗 Related Projects

- **Frontend (Next.js):** `/frontend` - Web-only version
- **Styling Guide:** `/styling` - Official brand guidelines
- **Backend:** Supabase (shared with frontend)

## 📚 Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [NativeWind](https://www.nativewind.dev/)
- [React Native](https://reactnative.dev/)
- [Supabase](https://supabase.com/docs)

## 🚢 Deployment

### Web (Vercel/Netlify)
```bash
expo export:web
# Deploy the web-build folder
```

### iOS (App Store)
```bash
eas build --platform ios
```

### Android (Play Store)
```bash
eas build --platform android
```

---

Built with 🌱 by ShrubHub
