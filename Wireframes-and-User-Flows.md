# ShrubHub Wireframes & User Flows

**Version:** 1.0 (MVP)
**Platform:** Mobile-first Progressive Web App (PWA)
**Last Updated:** 2025-12-04

---

## Design Principles

**1. Conversation First**
- Chat interface is the primary interaction model
- Traditional UI elements are secondary/supportive
- Make talking to the bot feel natural, not forced

**2. Show, Don't Tell**
- Visual plant cards over text lists
- Photos prominently featured
- Progress and health visible at a glance

**3. Progressive Disclosure**
- Start simple (chat + plant photos)
- Reveal complexity only when needed
- Don't overwhelm new users

**4. Mobile-First, Garden-Second**
- Designed for use while in the garden
- One-handed operation where possible
- Large touch targets, minimal typing

**5. Delight in Details**
- Smooth transitions
- Thoughtful microcopy
- Celebrate milestones (first plant, first harvest)

---

## Core User Flows

### Flow 1: First-Time User Onboarding
### Flow 2: Add New Plant (Primary Journey)
### Flow 3: Daily Check-In
### Flow 4: Log Activity via Chat
### Flow 5: Plant Detail View
### Flow 6: Garden Overview

---

## Flow 1: First-Time User Onboarding

**Goal:** Get user to their first "aha!" moment quickly - identifying and adding a plant.

### Screen 1.1: Welcome / Sign Up

```
┌─────────────────────────────────┐
│                                 │
│         🌱 ShrubHub             │
│                                 │
│   Your AI companion for         │
│   growing closer to your        │
│   plants                        │
│                                 │
│                                 │
│   [Continue with Email]         │
│                                 │
│   [Continue with Google]        │
│                                 │
│                                 │
│   Already have an account?      │
│   Sign in                       │
│                                 │
└─────────────────────────────────┘
```

**UX Notes:**
- Minimal text, clear value prop
- Social auth preferred (fewer barriers)
- No feature tour - learn by doing

---

### Screen 1.2: Permission Requests

```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│                                 │
│      📸                         │
│                                 │
│   We'd like camera access       │
│   to identify your plants       │
│                                 │
│                                 │
│   [Allow Camera]                │
│                                 │
│   [Not Now]                     │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

**UX Notes:**
- Request permissions in context, not all at once
- Explain WHY we need each permission
- Allow skip (can grant later)

---

### Screen 1.3: Set Your Location

```
┌─────────────────────────────────┐
│                                 │
│      🗺️                         │
│                                 │
│   Where's your garden?          │
│                                 │
│   This helps us give you        │
│   weather-aware care tips       │
│                                 │
│   ┌───────────────────────┐    │
│   │ Portland, OR          │    │
│   └───────────────────────┘    │
│                                 │
│   [Use Current Location]        │
│                                 │
│   [Continue]                    │
│                                 │
└─────────────────────────────────┘
```

**UX Notes:**
- Location critical for care recommendations
- Auto-detect preferred, manual entry fallback
- Show benefit (weather-aware tips)

---

### Screen 1.4: First Bot Interaction

```
┌─────────────────────────────────┐
│  ShrubHub        [Profile Icon] │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐  │
│  │ Hi! I'm your ShrubHub    │  │
│  │ companion. 🌿            │  │
│  │                          │  │
│  │ I'm here to help you     │  │
│  │ connect with your plants │  │
│  │ and remember their care. │  │
│  │                          │  │
│  │ Want to introduce me to  │  │
│  │ your first plant?        │  │
│  └──────────────────────────┘  │
│  Just now                       │
│                                 │
│                                 │
│  ┌──────────────────────────┐  │
│  │ Yes, let's do it!        │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ I'll add plants later    │  │
│  └──────────────────────────┘  │
│                                 │
│                                 │
└─────────────────────────────────┘
│ 💬 Type a message...      [📷] │
└─────────────────────────────────┘
```

**UX Notes:**
- Warm, friendly bot introduction
- Immediate call to action (add first plant)
- Quick reply buttons for common responses
- Camera shortcut always visible
- This is the core interface - chat + quick actions

**Design Decisions:**
- Bot messages on left (standard chat convention)
- User messages will appear on right
- Quick reply buttons reduce typing
- Camera icon in input area for quick photo access

---

## Flow 2: Add New Plant (Critical Path)

This is THE most important flow - it must feel magical.

### Screen 2.1: Take Photo (Native Camera)

```
┌─────────────────────────────────┐
│  ✕                            ✓ │
│                                 │
│                                 │
│                                 │
│         [Plant in frame]        │
│                                 │
│                                 │
│         ┌─────────────┐         │
│         │   Viewfinder│         │
│         │             │         │
│         │      🌿     │         │
│         │             │         │
│         └─────────────┘         │
│                                 │
│                                 │
│          Take a clear photo     │
│          of your plant          │
│                                 │
│                                 │
│             ( 📸 )              │
│                                 │
└─────────────────────────────────┘
```

**UX Notes:**
- Native camera interface
- Simple guidance: "Take a clear photo"
- Large capture button
- Can also choose from photo library

---

### Screen 2.2: AI Identification (Loading)

```
┌─────────────────────────────────┐
│  ShrubHub        [Profile Icon] │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────┐                │
│  │             │                │
│  │   [Photo]   │                │
│  │             │                │
│  └─────────────┘                │
│  You                            │
│                                 │
│                                 │
│  ┌──────────────────────────┐  │
│  │ Great photo! Let me      │  │
│  │ identify this plant...   │  │
│  │                          │  │
│  │      ⏳ Analyzing...     │  │
│  └──────────────────────────┘  │
│  Just now                       │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
│ 💬 Type a message...      [📷] │
└─────────────────────────────────┘
```

**UX Notes:**
- Photo appears in chat (user message)
- Bot acknowledges and shows progress
- Loading spinner/animation
- Usually takes 2-4 seconds

---

### Screen 2.3: Identification Result

```
┌─────────────────────────────────┐
│  ShrubHub        [Profile Icon] │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐  │
│  │ This looks like a        │  │
│  │ Monstera deliciosa! 🌿   │  │
│  │                          │  │
│  │ (Also called Swiss       │  │
│  │ Cheese Plant)            │  │
│  │                          │  │
│  │ Is that right?           │  │
│  └──────────────────────────┘  │
│  Just now                       │
│                                 │
│  ┌──────────────────────────┐  │
│  │ ✓ Yes, that's it!        │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ No, different plant      │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Not sure                 │  │
│  └──────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
│ 💬 Type a message...      [📷] │
└─────────────────────────────────┘
```

**UX Notes:**
- Confident but not pushy ("looks like")
- Common name emphasized, scientific in parentheses
- Clear confirmation options
- Handle uncertainty gracefully

**If user selects "No, different plant":**
```
┌──────────────────────────┐
│ My mistake! Could you    │
│ tell me what kind of     │
│ plant this is?           │
└──────────────────────────┘

[Shows keyboard for manual entry]
```

**If user selects "Not sure":**
```
┌──────────────────────────┐
│ No problem! We can just  │
│ call it "Houseplant" for │
│ now. Want to give it a   │
│ nickname?                │
└──────────────────────────┘
```

---

### Screen 2.4: Naming the Plant

```
┌─────────────────────────────────┐
│  ShrubHub        [Profile Icon] │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐  │
│  │ Perfect! Would you like  │  │
│  │ to give this Monstera    │  │
│  │ a name?                  │  │
│  │                          │  │
│  │ You can call it          │  │
│  │ "Monstera #1" or give it │  │
│  │ a personal name like     │  │
│  │ "Monty" 😊               │  │
│  └──────────────────────────┘  │
│  Just now                       │
│                                 │
│                                 │
│  ┌──────────────────────────┐  │
│  │ Give it a name           │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Just call it Monstera    │  │
│  └──────────────────────────┘  │
│                                 │
│                                 │
└─────────────────────────────────┘
│ 💬 Type a message...      [📷] │
└─────────────────────────────────┘
```

**UX Notes:**
- Encourage personalization (builds relationship)
- Provide examples
- Show that both options are fine
- Emoji makes it friendly

---

### Screen 2.5: Location in Garden

```
┌─────────────────────────────────┐
│  ShrubHub        [Profile Icon] │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐  │
│  │ "Monty" - I love it! 🌿  │  │
│  │                          │  │
│  │ Where in your garden is  │  │
│  │ Monty growing? You can   │  │
│  │ say something like:      │  │
│  │                          │  │
│  │ • "living room window"   │  │
│  │ • "back porch"           │  │
│  │ • "bedroom shelf"        │  │
│  └──────────────────────────┘  │
│  Just now                       │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
│ 💬 living room window      [📷]│
└─────────────────────────────────┘
```

**UX Notes:**
- Natural language input (not dropdown)
- Examples help users understand level of detail
- Can be vague or specific
- Accepts anything user types

---

### Screen 2.6: Acquisition Source

```
┌─────────────────────────────────┐
│  ShrubHub        [Profile Icon] │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐  │
│  │ Nice! How did Monty come │  │
│  │ into your life?          │  │
│  └──────────────────────────┘  │
│  Just now                       │
│                                 │
│  ┌──────────────────────────┐  │
│  │ 🛒 Bought as a plant     │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 🌱 Grew from seed        │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ ✂️ Propagated/cutting    │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 🎁 Gift from someone     │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 🤷 Not sure              │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
│ 💬 Type a message...      [📷] │
└─────────────────────────────────┘
```

**UX Notes:**
- Quick reply buttons with icons
- Common options + "other"
- Building the plant's story
- Each emoji adds personality

---

### Screen 2.7: Acquisition Date

```
┌─────────────────────────────────┐
│  ShrubHub        [Profile Icon] │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐  │
│  │ When did you get Monty?  │  │
│  └──────────────────────────┘  │
│  Just now                       │
│                                 │
│  ┌──────────────────────────┐  │
│  │ This week                │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ This month               │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ A few months ago         │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Over a year ago          │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Pick a date              │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
│ 💬 Type a message...      [📷] │
└─────────────────────────────────┘
```

**UX Notes:**
- Start with casual time ranges
- "Pick a date" opens date picker for precision
- Most users won't remember exact date
- Approximate is fine

---

### Screen 2.8: Plant Created! (Success)

```
┌─────────────────────────────────┐
│  ShrubHub        [Profile Icon] │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐  │
│  │ 🎉 Awesome!              │  │
│  │                          │  │
│  │ I've created a profile   │  │
│  │ for Monty. Based on your │  │
│  │ location and the season, │  │
│  │ here's what Monty needs: │  │
│  │                          │  │
│  │ 💧 Water: Once a week    │  │
│  │ ☀️ Light: Bright indirect│  │
│  │ 🌡️ Temp: 65-85°F         │  │
│  │                          │  │
│  │ I'll remind you when     │  │
│  │ Monty needs attention!   │  │
│  └──────────────────────────┘  │
│  Just now                       │
│                                 │
│  ┌──────────────────────────┐  │
│  │ Add another plant        │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Go to my garden          │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
│ 💬 Type a message...      [📷] │
└─────────────────────────────────┘
```

**UX Notes:**
- Celebrate the completion (🎉)
- Immediate value: show care tips right away
- Clear next actions
- Sets up expectation of reminders
- Encourages adding more plants

**Design Decision:**
This is the "aha!" moment - user gets instant value from the identification and care guide. This should feel magical and encouraging.

---

## Flow 3: Garden Overview (Home Screen)

After onboarding, this becomes the default landing screen.

### Screen 3.1: Garden View

```
┌─────────────────────────────────┐
│  My Garden    🔔(2)  [Profile]  │
├─────────────────────────────────┤
│                                 │
│  Good morning! 🌤️               │
│  2 plants need attention today  │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Needs Attention (2)     │   │
│  │ ─────────────────────── │   │
│  │ ┌──────┐                │   │
│  │ │[pic] │  Monty          │   │
│  │ │      │  Monstera       │   │
│  │ └──────┘  💧 Water today │   │
│  │                          │   │
│  │ ┌──────┐                │   │
│  │ │[pic] │  Basil          │   │
│  │ │      │  Basil          │   │
│  │ └──────┘  ✂️ Prune soon  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ All Plants (8)          ▼│   │
│  │ ─────────────────────── │   │
│  │ ┌──┐ ┌──┐ ┌──┐ ┌──┐    │   │
│  │ │🌿│ │🌿│ │🌿│ │🌿│    │   │
│  │ └──┘ └──┘ └──┘ └──┘    │   │
│  │ ┌──┐ ┌──┐ ┌──┐ ┌──┐    │   │
│  │ │🌿│ │🌿│ │🌿│ │🌿│    │   │
│  │ └──┘ └──┘ └──┘ └──┘    │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
│    🏡     🌱      💬       👤   │
│   Garden  Add   Chat   Profile  │
└─────────────────────────────────┘
```

**UX Notes:**
- Weather-aware greeting
- Priority section: plants needing attention
- Visual grid of all plants
- Bottom navigation for key actions
- Notification badge shows pending reminders

**Design Decisions:**
- "Needs Attention" section creates urgency and clear action
- Grid view shows many plants at once (scannable)
- Photos are primary visual element
- Tapping any plant goes to detail view
- Bottom nav always accessible

---

### Screen 3.2: Plant Card (in Grid)

```
┌──────────────┐
│              │
│   [Photo]    │
│              │
├──────────────┤
│ Monty        │
│ Monstera     │
│ ─────────    │
│ 💧 3d ago    │
│ ✅ Healthy   │
└──────────────┘
```

**Card Content:**
- Large photo (primary identifier)
- Custom name (if exists) + species common name
- Last activity icon + time
- Health status indicator

**States:**
- ✅ Healthy (green)
- ⚠️ Needs attention (yellow)
- 🆘 Struggling (red)
- 💀 Dead (gray, archived)

---

## Flow 4: Chat Interface (Core Interaction)

### Screen 4.1: Chat Home

```
┌─────────────────────────────────┐
│  Chat         [Profile Icon]    │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐  │
│  │ Hey! How's the garden    │  │
│  │ today? 🌿                │  │
│  │                          │  │
│  │ Monty is due for water   │  │
│  │ soon. Want to log that   │  │
│  │ now, or ask me anything  │  │
│  │ else?                    │  │
│  └──────────────────────────┘  │
│  2 min ago                      │
│                                 │
│  ┌──────────────────────────┐  │
│  │ I watered Monty          │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ What about my basil?     │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Add new observation      │  │
│  └──────────────────────────┘  │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
│ 💬 Type a message...      [📷] │
└─────────────────────────────────┘
```

**UX Notes:**
- Bot proactively suggests actions
- Context-aware (mentions specific plants and their needs)
- Quick replies for common actions
- Can type anything or use suggestions
- Camera always accessible

---

### Screen 4.2: Natural Language Activity Logging

**User types: "I watered Monty"**

```
┌─────────────────────────────────┐
│  Chat         [Profile Icon]    │
├─────────────────────────────────┤
│                                 │
│                                 │
│                                 │
│              ┌──────────────┐   │
│              │ I watered    │   │
│              │ Monty        │   │
│              └──────────────┘   │
│                          You    │
│                     Just now    │
│                                 │
│  ┌──────────────────────────┐  │
│  │ ✓ Got it! Logged         │  │
│  │ watering for Monty.      │  │
│  │                          │  │
│  │ Next watering: ~Dec 11   │  │
│  └──────────────────────────┘  │
│  Just now                       │
│                                 │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
│ 💬 Type a message...      [📷] │
└─────────────────────────────────┘
```

**UX Notes:**
- AI parses natural language
- Confirms action with checkmark
- Provides helpful context (next watering date)
- No forms to fill out
- Feels like texting a friend

**What the AI does behind the scenes:**
1. Identifies intent (logging activity)
2. Extracts entities (plant: "Monty", activity: "watering")
3. Calls function: `log_activity(plant_id, type="watering")`
4. Calculates next reminder based on care schedule
5. Responds naturally

---

### Screen 4.3: Plant Issue Inquiry

**User types: "my basil leaves are turning yellow"**

```
┌─────────────────────────────────┐
│  Chat         [Profile Icon]    │
├─────────────────────────────────┤
│                                 │
│              ┌──────────────┐   │
│              │ my basil     │   │
│              │ leaves are   │   │
│              │ turning      │   │
│              │ yellow       │   │
│              └──────────────┘   │
│                          You    │
│                     Just now    │
│                                 │
│  ┌──────────────────────────┐  │
│  │ Oh no! Let me help       │  │
│  │ troubleshoot. 🔍         │  │
│  │                          │  │
│  │ Yellowing basil leaves   │  │
│  │ usually mean:            │  │
│  │                          │  │
│  │ • Overwatering (most     │  │
│  │   common)                │  │
│  │ • Not enough light       │  │
│  │ • Nutrient deficiency    │  │
│  │                          │  │
│  │ Can you send me a photo? │  │
│  └──────────────────────────┘  │
│  Just now                       │
│                                 │
└─────────────────────────────────┘
│ 💬 Type a message...      [📷] │
└─────────────────────────────────┘
```

**UX Notes:**
- Empathetic response ("Oh no!")
- Structured troubleshooting
- Asks for photo to refine diagnosis
- Actionable information
- Demonstrates AI understanding context

---

### Screen 4.4: Photo-Based Diagnosis

**User sends photo of yellowing basil**

```
┌─────────────────────────────────┐
│  Chat         [Profile Icon]    │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────┐                │
│  │             │                │
│  │   [Photo]   │                │
│  │  yellowing  │                │
│  │   basil     │                │
│  │             │                │
│  └─────────────┘                │
│                          You    │
│                     Just now    │
│                                 │
│  ┌──────────────────────────┐  │
│  │ Thanks for the photo.    │  │
│  │                          │  │
│  │ I can see the yellowing  │  │
│  │ is mostly on lower       │  │
│  │ leaves - this points to  │  │
│  │ overwatering.            │  │
│  │                          │  │
│  │ Looking at your log,     │  │
│  │ you've watered 3x this   │  │
│  │ week. For basil, once    │  │
│  │ a week is usually enough.│  │
│  │                          │  │
│  │ I'll adjust your         │  │
│  │ watering schedule!       │  │
│  └──────────────────────────┘  │
│  Just now                       │
│                                 │
└─────────────────────────────────┘
│ 💬 Anything else?          [📷]│
└─────────────────────────────────┘
```

**UX Notes:**
- AI analyzes photo
- References user's own history (watering log)
- Provides specific diagnosis
- Takes action (adjusts schedule)
- Proactive problem-solving

**This demonstrates the power of AI + data:**
- Photo analysis
- Historical context
- Personalized recommendation
- Automatic adjustment

---

## Flow 5: Plant Detail View

### Screen 5.1: Plant Profile

```
┌─────────────────────────────────┐
│  ←  Monty            ⋮  [Share] │
├─────────────────────────────────┤
│                                 │
│  ╔═════════════════════════╗   │
│  ║                         ║   │
│  ║    [Plant Photo]        ║   │
│  ║                         ║   │
│  ╚═════════════════════════╝   │
│                                 │
│  Monty                          │
│  Monstera deliciosa             │
│  ✅ Healthy • Added Nov 28      │
│                                 │
│  📍 Living room window          │
│  🎁 Gift from friend            │
│                                 │
│  ────────────────────────────   │
│                                 │
│  💬 Ask about Monty             │
│                                 │
│  ────────────────────────────   │
│                                 │
│  📋 Care Schedule               │
│  ┌──────────────────────────┐  │
│  │ 💧 Water                 │  │
│  │    Last: 3 days ago      │  │
│  │    Next: In 4 days       │  │
│  │    [Log watering]        │  │
│  └──────────────────────────┘  │
│                                 │
│ (scroll for more)                │
└─────────────────────────────────┘
```

**Scrolling down reveals:**

```
│  ────────────────────────────   │
│                                 │
│  📸 Photos (4)            [View]│
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│  │   │ │   │ │   │ │   │       │
│  └───┘ └───┘ └───┘ └───┘       │
│                                 │
│  ────────────────────────────   │
│                                 │
│  📓 Recent Activity       [View]│
│  • Watered (3 days ago)         │
│  • Added photo (1 week ago)     │
│  • Pruned dead leaves (2 wks)   │
│                                 │
│  ────────────────────────────   │
│                                 │
│  💭 Observations          [View]│
│  "New leaf unfurling! 🌱"       │
│  Dec 1, 2025                    │
│                                 │
│  ────────────────────────────   │
│                                 │
│  📚 Care Guide                  │
│  ┌──────────────────────────┐  │
│  │ Light: Bright indirect   │  │
│  │ Water: Weekly, let dry   │  │
│  │ Humidity: 60%+           │  │
│  │ Temp: 65-85°F            │  │
│  │ Toxic to pets ⚠️         │  │
│  └──────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**UX Notes:**
- Photo hero (most important visual element)
- Health status prominent
- Plant's "story" (where from, when acquired)
- Quick action: "Ask about Monty" opens chat with context
- Care schedule shows status and quick action
- Progressive disclosure: recent items shown, tap for full history
- All info accessible without chat, but chat is always an option

**Design Decisions:**
- Traditional detail view exists alongside conversational interface
- Some users prefer visual UI, some prefer chat
- Both paths lead to same data
- "Ask about Monty" button bridges the two interfaces

---

## Flow 6: Daily Check-In Flow

**Goal:** Encourage daily engagement and observation habit

### Screen 6.1: Morning Notification

```
┌─────────────────────────────────┐
│                                 │
│  🌿 ShrubHub                    │
│                                 │
│  Good morning! Your garden      │
│  needs attention today          │
│                                 │
│  • 2 plants to water            │
│  • 1 observation pending        │
│                                 │
│                   [View] [Later]│
└─────────────────────────────────┘
```

**Tapping "View" opens:**

### Screen 6.2: Daily Checklist

```
┌─────────────────────────────────┐
│  ←  Today's Garden Tasks        │
├─────────────────────────────────┤
│                                 │
│  ☀️ Good morning!               │
│  72°F • Partly cloudy           │
│                                 │
│  ────────────────────────────   │
│                                 │
│  To Do (3)                      │
│                                 │
│  ☐ Water Monty                  │
│     Due today                   │
│                                 │
│  ☐ Water Basil                  │
│     Overdue by 1 day            │
│                                 │
│  ☐ Check on Fiddle Leaf Fig     │
│     You mentioned brown spots   │
│                                 │
│  ────────────────────────────   │
│                                 │
│  💬 Quick chat about your       │
│     garden?                     │
│                                 │
│                                 │
└─────────────────────────────────┘
```

**UX Notes:**
- Weather context (affects watering)
- Prioritized list (overdue items first)
- Reminders based on observations (AI recalls context)
- Easy path to chat
- Can check off items or tap for details

---

## Additional Key Screens

### Profile / Settings

```
┌─────────────────────────────────┐
│  ←  Settings                    │
├─────────────────────────────────┤
│                                 │
│  ┌─────┐                        │
│  │ [📸]│  Chris                 │
│  └─────┘  Portland, OR          │
│            Zone 8b              │
│            [Edit Profile]       │
│                                 │
│  ────────────────────────────   │
│                                 │
│  My Garden                      │
│  • 8 active plants              │
│  • 2 archived plants            │
│  • Member since Nov 2025        │
│                                 │
│  ────────────────────────────   │
│                                 │
│  Preferences                    │
│  Notifications         [Toggle] │
│  Measurement System    Imperial │
│  Bot Personality       Casual   │
│                                 │
│  ────────────────────────────   │
│                                 │
│  Data                           │
│  Export my data                 │
│  Delete account                 │
│                                 │
└─────────────────────────────────┘
```

---

### Search / Find Plants

```
┌─────────────────────────────────┐
│  ←  Find Plants                 │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🔍 Search plants...       │ │
│  └───────────────────────────┘ │
│                                 │
│  Filter by:                     │
│  [All] [Needs Attention] [Type] │
│                                 │
│  ────────────────────────────   │
│                                 │
│  Results (8)                    │
│                                 │
│  ┌──────┐                       │
│  │[pic] │  Monty                │
│  │      │  Monstera             │
│  └──────┘  Living room          │
│                                 │
│  ┌──────┐                       │
│  │[pic] │  Basil                │
│  │      │  Basil                │
│  └──────┘  Kitchen window       │
│                                 │
│  (more plants...)               │
│                                 │
└─────────────────────────────────┘
```

---

## Conversational UI Patterns

### Pattern 1: Intent Recognition

**User inputs that system should understand:**

```
"I watered my tomatoes"          → log_activity(watering)
"Monty's leaves are drooping"    → create_observation + suggest_diagnosis
"When should I water next?"      → query_care_schedule
"Add a new plant"                → start_plant_onboarding
"Show me my basil"               → navigate_to_plant_detail
"What's wrong with my fern?"     → troubleshoot_plant
"I harvested 3 tomatoes today"   → log_activity(harvesting) + quantity
```

### Pattern 2: Contextual Awareness

**Bot remembers:**
- Last mentioned plant
- Current conversation topic
- Recent activities
- Pending reminders

**Example:**
```
User: "I have a question about my Monstera"
Bot: "Sure! What would you like to know about Monty?"

User: "When did I last water it?"
Bot: "You watered Monty 3 days ago (Dec 1)"

User: "And when should I water again?"
Bot: "Based on the schedule, in about 4 days (Dec 8)"

User: "What about my basil?"
Bot: "Your basil was last watered 5 days ago - it's due for water today!"
```

**Design Decision:** Bot maintains context within a session, references plants by custom names, recalls history.

### Pattern 3: Proactive Suggestions

**Bot initiates conversations based on:**
- Time-based reminders
- Weather events
- Plant health changes
- User patterns

**Examples:**
```
"☀️ It's going to be 85°F today - your outdoor plants
might need extra water!"

"🌧️ Heavy rain expected tomorrow. I'll skip your
outdoor watering reminders."

"🌱 It's been 2 weeks since you added a photo of
Monty. Want to capture its progress?"

"📈 You've logged watering 3 times this week, but
usually do 2x. Everything okay with the plants?"
```

### Pattern 4: Error Handling

**When AI doesn't understand:**

```
User: "jfkdls plant thing water"

Bot: "I'm not quite sure what you mean. Are you trying to:
     • Log watering for a plant
     • Check when to water next
     • Something else?

     You can also try rephrasing!"
```

**When ambiguous:**

```
User: "I watered the plant"

Bot: "Which plant did you water?
     • Monty (Monstera)
     • Basil
     • Fiddle Leaf Fig
     • Other"
```

---

## Mobile Interactions & Gestures

### Swipe Actions on Plant Cards

```
┌────────────────────────┐
│  [Photo]               │
│  Monty                 │
│  Monstera              │
│  💧 3d ago             │
└────────────────────────┘

Swipe right → ✓ Mark as watered
Swipe left  → 📝 Add observation
Tap         → View detail
Long press  → Quick actions menu
```

### Pull to Refresh

```
On Garden overview:
Pull down → Refresh plant statuses
            Check for new reminders
            Update weather
```

### Camera Quick Actions

```
From anywhere:
Long press camera icon → Options:
  • Identify new plant
  • Document existing plant
  • Capture issue/observation
```

---

## Design System Notes

### Color Palette

**Primary:**
- Green: #2D5016 (life, growth)
- Light green: #7CB342 (healthy status)
- Sage: #A8B890 (backgrounds, calm)

**Status colors:**
- Healthy: #4CAF50 (green)
- Attention: #FF9800 (orange)
- Urgent: #F44336 (red)
- Neutral: #757575 (gray)

**Backgrounds:**
- Primary: #FFFFFF (white)
- Secondary: #F5F5F5 (off-white)
- Accents: #FAFAF6 (warm neutral)

### Typography

**Headings:**
- H1: 28px, Semibold
- H2: 22px, Semibold
- H3: 18px, Medium

**Body:**
- Regular: 16px
- Small: 14px
- Caption: 12px

**Font:** System font (San Francisco on iOS, Roboto on Android)

### Spacing

- Base unit: 8px
- Small: 8px
- Medium: 16px
- Large: 24px
- XLarge: 32px

### Components

**Plant Card:**
- Aspect ratio: 3:4 (portrait)
- Corner radius: 12px
- Shadow: subtle (elevation 2)

**Chat Bubbles:**
- Max width: 80% of screen
- Corner radius: 18px
- Padding: 12px 16px

**Buttons:**
- Primary: Filled green, white text
- Secondary: Outlined, green border
- Height: 48px (touch-friendly)
- Corner radius: 24px (pill-shaped)

---

## Accessibility Considerations

**Screen Reader Support:**
- All images have alt text
- Plant cards announce status ("Monty, Monstera, needs water")
- Chat messages read in order
- Form inputs properly labeled

**Touch Targets:**
- Minimum 44x44 points (iOS guidelines)
- Adequate spacing between interactive elements
- Swipe gestures have fallback tap actions

**Color Contrast:**
- All text meets WCAG AA standards (4.5:1 minimum)
- Status indicators use icons + color
- Never rely on color alone

**Voice Input:**
- Microphone button in chat input
- Speech-to-text for observations
- Works well with voice control

---

## Progressive Web App Features

**Install Prompt:**
```
┌─────────────────────────────────┐
│                                 │
│  🌿 Install ShrubHub            │
│                                 │
│  Add to your home screen for    │
│  quick access and notifications │
│                                 │
│  [Install]         [Not Now]    │
│                                 │
└─────────────────────────────────┘
```

**Offline Support:**
- View existing plants and data
- Browse photos
- Queue activities for sync when online
- Cache plant care guides

**Notification Permissions:**
- Request after first successful plant addition
- Explain benefit: "Get reminders for plant care"
- Respect user choice

---

## Animation & Microinteractions

**Plant onboarding success:**
- Confetti animation when first plant added
- Check mark animation when activity logged
- Smooth transitions between screens

**Photo capture:**
- Flash effect on capture
- Loading spinner during identification
- Reveal animation for results

**Chat:**
- Typing indicator when bot is thinking
- Messages fade in
- Quick reply buttons slide up

**Pull to refresh:**
- Plant icon spins while loading
- Bounce animation on release

---

## Next Steps

**To turn these wireframes into reality:**

1. **Create high-fidelity mockups** in Figma
   - Apply design system
   - Add real content
   - Show all states (loading, error, success)

2. **Build interactive prototype**
   - Link screens together
   - Test flows with users
   - Validate assumptions

3. **User test the flows**
   - 5 users walk through onboarding
   - Observe pain points
   - Iterate based on feedback

4. **Begin development**
   - Start with plant onboarding flow (critical path)
   - Build chat interface
   - Integrate AI

---

## Questions to Validate

Before building, test these assumptions:

1. **Is conversational UI actually better than forms?**
   - Or do users prefer traditional input?
   - Maybe offer both?

2. **Do users want proactive bot messages?**
   - Or does it feel annoying/spammy?
   - How frequent is too frequent?

3. **Is plant identification the hook?**
   - Or is reminder system more valuable?
   - What brings users back daily?

4. **How much personalization matters?**
   - Do people name their plants?
   - Or prefer simple labels?

5. **Photo-first vs. list-first?**
   - Grid of photos vs. text list
   - What's faster to scan?

**Test these in your user interviews!**

---

**These wireframes represent the MVP ShrubHub experience: conversational, visual, proactive, and delightful. The flows prioritize the "add plant" journey as the critical path to first value.**

Ready to create high-fidelity mockups, prototype, or start building?
