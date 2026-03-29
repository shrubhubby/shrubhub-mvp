# ShrubHub Design Principles

**Version:** 1.0
**Date:** 2025-12-06
**Philosophy:** AI-First, Conversational, Delightful

---

## Core Philosophy: "The Living Garden Canvas"

**"The garden that talks back"** - A breathing, evolving interface that feels more like conversing with a knowledgeable garden mentor than using software.

---

## Primary Interface Pattern: The Conversational Canvas

### Visual Structure

```
┌─────────────────────────────────────────────┐
│  ☰                              👤  ⚙       │ ← Minimal chrome
│                                             │
│                                             │
│                                             │
│         Your basil hasn't been              │
│         watered in 3 days 💧                │ ← Dynamic center message
│         [Tap anywhere to respond]           │    (clickable, fades in/out)
│                                             │
│                                             │
│                                             │
│                                             │
│  🌱  🏡  📊                                 │ ← Subtle bottom nav
└─────────────────────────────────────────────┘
```

### Interaction States

#### 1. Idle State (The "Living" Part)
Rotating dynamic messages every 8-12 seconds:
- **Data-driven advice**: "Your tomatoes are ready to harvest" (actionable)
- **Environmental insights**: "Rain expected tomorrow - skip watering tonight"
- **Gentle nudges**: "It's been a week since you checked on the greenhouse"
- **Garden wisdom**: "The best fertilizer is the gardener's shadow" (ambient delight)
- **Celebrations**: "6 days since your last plant casualty - streak! 🎉"

#### 2. Activated State (The "Response" Part)
- Click/tap **anywhere on screen** → message smoothly transitions to lighter placeholder
- Cursor appears center-screen (no text box chrome)
- Placeholder examples based on context:
  - "Tell me about your garden..."
  - "What did you just do?"
  - "Need help with something?"
  - "I'm listening..." (if voice activated)

#### 3. Thinking State (The "Personality" Part)
Playful, gardening-themed loading states:
- "Checking the soil..." (for plant health queries)
- "Consulting the almanac..." (for scheduling)
- "Asking the bees..." (for pollination questions)
- Subtle sprouting animation or growth rings expanding

#### 4. Response State (The "Smart Display" Part)
AI chooses response format based on content type:

**Simple confirmations:**
```
     ✓ Watered 3 tomato plants
     Next watering: Sunday morning
```
Fades in, lingers 3s, fades to translucent, then disappears

**Complex responses with actions:**
```
┌────────────────────────────────────┐
│ I found 3 tomato plants:           │
│                                    │
│ • Beefsteak (Backyard Garden)      │
│ • Cherry Tom (Patio Pots)          │
│ • Heirloom (Greenhouse)            │
│                                    │
│ Water all? [Yes] [Pick which]     │
└────────────────────────────────────┘
```
Soft translucent background (#000000 20% or warm earth tone)
White/cream text for readability

**Visual responses (progressive disclosure):**
- Photo appears full-width with diagnosis overlay
- Map slides up from bottom showing garden boundary
- Chart/graph for growth tracking
- All with subtle animations, not jarring

---

## Message Priority System

### Dynamic Message Algorithm
The center message is **always intelligent**, chosen from:

**Priority 1: Urgent care needs** (red flag conditions)
- "⚠️ Your fiddle leaf fig is overdue for water by 5 days"
- Clickable → immediately opens confirmation dialog

**Priority 2: Timely recommendations** (optimal timing)
- "🌤️ Perfect weather for repotting today (65°F, cloudy)"
- "Your seedlings are ready to transplant"

**Priority 3: Proactive insights** (AI noticed something)
- "I see you watered the succulents 3x this week - that might be too much"
- "Your tomatoes grew 2 inches since last week! 📈"

**Priority 4: Contextual prompts** (based on time/season/location)
- Morning: "Good morning! What's happening in the garden today?"
- After rain: "I see it rained last night - want to skip watering today?"
- Spring: "Starting any seeds this season?"

**Priority 5: Ambient wisdom** (when nothing urgent)
- Garden quotes, tips, fun facts
- "Did you know? Tomatoes and basil are companion plants 🍅🌿"

---

## Progressive Disclosure Patterns

### Level 1: Pure Conversational (Default for 80% of tasks)

**Quick logging:**
```
User: "watered the herbs"
AI:   ✓ Logged watering for Basil, Thyme, Rosemary
      [undo] [see details]
```

**Natural language adding:**
```
User: "got a new snake plant"
AI:   Nice! Where should I add it?
      • Living Room Garden
      • Create new location
      or just tell me where

User: "living room"
AI:   ✓ Added Snake Plant to Living Room Garden
      Want to set a watering reminder?
```

### Level 2: Inline Assistance (When AI senses complexity)

If user types something ambiguous:
```
User: "I think something's wrong with it"
AI:   Which plant are we talking about?

      Recent plants:
      [Basil] [Tomato #2] [Fiddle Leaf]

      or type the plant name
```

### Level 3: Visual Tools (When conversational isn't enough)

**Trigger patterns:**
- User says "show me" → visual appears
- User struggles 2x with same task → AI offers: "Want to see the plant list instead?"
- User explicitly asks: "I need to draw the garden boundary"

**Visual reveal animations:**
- Slide up from bottom (maps, lists)
- Fade in with backdrop blur (detailed forms)
- Expand from center (photo galleries)

### Level 4: Traditional UI (Escape hatch always available)

**Persistent access methods:**
- Hamburger menu (top left): Traditional nav tree
- Bottom icons: Direct access to Gardens/Plants/Activity views
- Voice: "Show me the old interface"
- Settings: Toggle to "Classic mode" for users who prefer it

---

## Primary Use Cases

### Most Common Actions (80% of usage)
1. **Log an activity** (feeding, watering, changing soil, re-potting, pruning, wiring/bending, germinating, move of location, etc.)
2. **Adding a new plant/garden/site**
3. **Diagnosing problems**
4. **Being advised of recommendations**

---

## Specific Use Case Flows

### Use Case 1: Log Watering (Most Common)

**Fastest path:**
```
User: [tap screen] "watered"
AI:   Who got watered?
User: "tomatoes"
AI:   ✓ Logged for 3 tomato plants
```

**Context-aware shortcut:**
```
[User just added tomatoes yesterday]
User: "watered them"
AI:   ✓ Watered your new tomato plants
```

**Bulk action:**
```
User: "watered everything in the backyard"
AI:   That's 12 plants! Confirming:
      Backyard Garden - all 12 plants watered
      [Yes, all] [Let me pick]
```

### Use Case 2: Add New Plant

**Conversational:**
```
User: "I got a new monstera"
AI:   Exciting! 🌿 Where is it?
User: "bedroom window"
AI:   I don't have a "Bedroom Window" garden yet.
      [Create it] or add to existing garden?

User: [tap Create it]
AI:   [Map slides up]
      Want to mark the location on the map?
      [Yes] [No, just track it]
```

**Quick form option:**
```
User: "add plant"
AI:   [Minimal form appears with smart defaults]

      Plant type: ____________
      Location: [Living Room Garden ▼]

      [That's it] [More details]
```

### Use Case 3: Diagnose Problem

**Photo-first:**
```
User: [tap camera icon] [takes photo]
AI:   [Thinking animation: "Analyzing leaf health..."]

      Looks like spider mites on your pothos 🔍

      Common on pothos when air is dry.

      Try:
      • Spray with neem oil
      • Increase humidity
      • Isolate from other plants

      [Log treatment] [More info] [I'm not sure]
```

**Conversational:**
```
User: "my basil leaves are turning yellow"
AI:   Let's figure this out. A few questions:

      • How often are you watering?
      • Is it getting direct sunlight?
      • Indoor or outdoor?

      or [upload a photo] for faster diagnosis

User: "every day, yes, indoor"
AI:   Ah! Yellow leaves + daily watering = overwatering

      Basil indoors only needs water every 2-3 days
      when top inch of soil is dry.

      [Update watering schedule]
```

### Use Case 4: Get Recommendations

**Proactive (AI initiates):**
```
[Message appears]
"Your basil is getting leggy - time to prune for
bushier growth. Want a reminder?"

[tap message]
AI:   I can remind you to prune weekly.
      Pruning encourages fuller growth.

      [Set reminder] [Show me how to prune] [Not now]
```

**User-initiated:**
```
User: "what should I do today?"
AI:   Based on your garden:

      🌱 Seedlings ready to transplant (tomatoes)
      💧 Due for watering (basil, ferns)
      ✂️ Pruning recommended (monstera)

      What do you want to tackle first?

User: "the seedlings"
AI:   Great choice! Your tomato seedlings are 6" tall
      and have true leaves - perfect for transplanting.

      [Show transplant guide] [Mark as done]
```

---

## Navigation Architecture

### Minimal Persistent Chrome

**Top bar (always visible, subtle):**
```
☰  [fade to nothing]              👤  ⚙
```
- Hamburger: Traditional nav drawer (for escape hatch)
- Profile: Quick plant/garden stats, streak, achievements
- Settings: Preferences, notifications, classic mode toggle

**Bottom bar (icon-only, appears on scroll or gesture):**
```
     🌱        🏡        📊        📸
   Gardens   Plants  Activity  Identify
```
- Tap icon → traditional list/grid view slides up
- Or ask: "show my gardens" → same result

### Gesture Navigation

- **Swipe right**: Back/previous context
- **Swipe left**: Forward (if in nested view)
- **Swipe up from bottom**: Quick actions menu
- **Long press anywhere**: Voice input activated
- **Pinch**: Zoom into detail view (for maps, photos)

---

## Trust & Transparency Mechanisms

### Show Your Work
```
AI: ✓ Watered 3 tomato plants

    Why 3? Last entry was "3 tomato seedlings"
    in Backyard Garden on May 15

    [Not right? Update]
```

### Undo Everything
Every action has a lingering undo:
```
✓ Deleted Basil plant        [Undo ←]
```
Stays visible for 10 seconds, then fades but remains accessible in activity log

### Confirm Destructive Actions
```
User: "delete all my tomatoes"
AI:   ⚠️ This will delete 4 tomato plants
      and 23 activity logs.

      Type "delete tomatoes" to confirm
      or [Cancel]
```

### Explain Recommendations
```
AI: I recommend fertilizing your basil

    Because:
    • Last fertilized 6 weeks ago
    • Basil benefits from feeding every 4 weeks
    • Growing season is peak (June)

    [Fertilize now] [Remind me later]
```

---

## Delight & Personality

### Voice & Tone
- **Encouraging mentor**, not robotic
- "Great job keeping up with watering!" vs "Task completed"
- "Uh oh, that leaf looks sad 😢" vs "Diagnosis: nutrient deficiency"
- Gentle humor: "Watered again? Those are cacti, not fish 🌵"

### Micro-interactions
- Plant emoji reactions when you log care (💧 for water, ✂️ for prune)
- Sprouting animations for growth milestones
- Confetti when you harvest
- Streak counters for consistent care

### Adaptive Background
- Subtle seasonal colors (spring greens, summer golden, fall amber, winter blues)
- Time-of-day gradients (morning light, golden hour, dusk)
- Weather-reactive (cloudy overlay when it's raining IRL)

### Achievements & Gamification (Light Touch)
```
🎉 Milestone: 30 days of consistent watering!
Your plants are thriving ✨
```
Not forced, just gentle celebration of good habits

---

## Technical Enablers

### MCP (Model Context Protocol) Integration
- Real-time access to plant database
- Weather data for recommendations
- Growth tracking across time
- Photo analysis for pest/disease identification

### Model Tuning
- Gardening domain expertise fine-tuning
- User preference learning (tone, detail level)
- Pattern recognition (detects user's typical routines)
- Context retention across sessions

### Sentiment Detection
When user shows frustration signals:
- Multiple rephrasing of same question
- Short, clipped responses
- "I don't understand" or similar
→ AI offers: "Want me to just show you the form instead?"

---

## Implementation Priorities

### Phase 1: Core Conversational Canvas (MVP)
- Blank screen with dynamic center message
- Click-anywhere prompt activation
- Basic activity logging (water, feed, prune)
- Simple confirmations with fade animations
- Escape hatch to traditional list views

### Phase 2: Smart Context & Recommendations
- Message priority system
- Proactive advice based on data
- Photo upload for diagnostics
- Inline quick actions

### Phase 3: Progressive Disclosure Refinement
- Sentiment detection triggers
- Smooth transitions to visual tools
- Gesture navigation
- Voice input

### Phase 4: Polish & Delight
- Seasonal themes
- Achievements
- Advanced animations
- Personality refinement

---

## Example Screen States

### Idle State
```
[Soft sage green gradient background]
[Center of screen, elegant serif font:]

     "The best time to plant a tree was
      20 years ago. The second best
      time is now."

[Tap anywhere to garden →]
```

### Active State
```
[Same background, message fades to 30% opacity]
[Cursor blinking in center]

     What's happening in the garden?_
```

### Response State
```
[Background slightly darkened]
[Response card with soft shadow, translucent white bg:]

┌────────────────────────────────────┐
│  ✓ Watered 3 plants in            │
│    Backyard Garden                 │
│                                    │
│  Next watering: Sunday morning     │
│                                    │
│  [undo] [see details]              │
└────────────────────────────────────┘

[Card fades after 4 seconds, screen returns to idle]
```

---

## Key Design Principles Summary

1. **AI-First, Not AI-Only**: Conversational is primary, but traditional UI is always accessible
2. **Progressive Disclosure**: Start simple, reveal complexity only when needed
3. **Contextual Intelligence**: Messages and responses adapt to user's data, time, season, weather
4. **Minimal Chrome**: Screen real estate dedicated to content, not navigation
5. **Trust Through Transparency**: Always explain reasoning, always allow undo
6. **Delight Without Distraction**: Personality that enhances, doesn't annoy
7. **Respect User Choice**: Never force AI interaction, always provide traditional alternatives
8. **Accessibility First**: Voice input, clear contrast, readable fonts, gesture alternatives

---

**This interface balances AI-first simplicity with progressive access to complexity, creating a unique, delightful experience that feels less like "using software" and more like "tending a living, intelligent garden companion."**
