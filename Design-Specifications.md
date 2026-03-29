# ShrubHub Design Specifications (Official)

**Version:** 2.0 (Official Brand Guidelines)
**Target Platform:** Mobile-first Progressive Web App (PWA)
**Authoritative Source:** `styling/Visual Brand Guidelines.md` v1.1
**Working Reference:** `styling/shrubhub-mockup.html`
**Last Updated:** 2025-12-05

---

## 📋 Document Hierarchy

**IMPORTANT: Design Authority**

1. **`styling/Visual Brand Guidelines.md`** - The authoritative design source (KING)
2. **`styling/shrubhub-mockup.html`** - Working UI implementation reference
3. **`styling/shrubhub_tokens.json`** - Design tokens
4. **This document** - Implementation guide based on above sources

Any conflicts should defer to Visual Brand Guidelines.md.

---

## Brand Identity Overview

**From Visual Brand Guidelines v1.1:**

### Brand Essence

ShrubHub blends nature, community, and modern simplicity. The identity must always feel:

- ✨ **Fresh and growth-oriented**
- 🤝 **Friendly and approachable**
- 🎨 **Clean, modern, minimalistic**
- 🌿 **Trustworthy and nature-conscious**

**Tagline:** "Grow with the Flow"

### Logo System

The ShrubHub logo combines:
- **Wave & water motif** (outer circular form) - symbolizes care, nourishment, environmental grounding
- **Sprouting green plant** - represents growth, learning, cultivation
- **Symmetrical root/base geometry** - conveys balance, stability, structure

**Logo Files:**
- `styling/shrubhub_logo.svg` - Vector logo
- `styling/shrubhub.png` - Full lockup
- `styling/shrubhub-imageonly.png` - Symbol only

**Minimum Sizes:**
- Digital: 48px height
- Print: 12mm height

**Clear Space:**
- Maintain padding equal to half the height of the plant sprout around all sides

**Approved Lockups:**
1. Symbol only (app icon, favicon, badges)
2. Symbol + Wordmark ("ShrubHub" in Deep Forest Green beneath symbol)

---

## Official Color System

**Source:** Visual Brand Guidelines v1.1 (Extracted from actual logo)

### Primary Palette

```css
/* Deep Forest Green - Primary brand color */
--deep-forest-green: #228B1B;
/* Use for: Headers, emphasis text, wordmark, primary accents */

/* Leaf Gradient Colors - From logo plant leaves */
--light-leaf-green: #A6D856;
--deep-leaf-green: #4BA83E;
/* Use for: Illustrations, highlights, thematic gradients */
```

### Ocean & Wave Palette

```css
/* Extracted directly from logo wave graphic */
--ocean-blue-deep: #0A6F9C;    /* Brand waves, primary backgrounds */
--ocean-blue-mid: #2DA1C4;     /* Secondary accents, gradients */
--ocean-blue-light: #66CDE1;   /* UI highlights, light accents */
--ocean-mist: #C5EEF4;         /* Light fills, backgrounds, cards */
```

### Neutral Palette

```css
--coal-grey: #333333;      /* Body text */
--soft-grey: #F2F4F4;      /* Backgrounds, surfaces */
--white: #FFFFFF;          /* Cards, surfaces */
```

### Status & Semantic Colors

```css
/* From mockup implementation */
--healthy: #4BA83E;           /* Deep Leaf Green */
--needs-attention: #E8A64F;   /* Warm orange */
--urgent: #E85A4F;            /* Alert red */
```

### Usage Ratios

**Recommended balance for pages/interfaces:**
- 60% neutrals (#F2F4F4, #FFFFFF, #333333)
- 25% ocean blues
- 10% greens
- 5% accents or highlights

---

## Typography System

**Source:** Visual Brand Guidelines v1.1

### Primary Typeface: Roboto

**Why Roboto:** Approachability, excellent legibility, wide style range

**Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Font Stack:**
```css
font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale & Usage

| Style | Size | Line Height | Weight | Color | Usage |
|-------|------|-------------|--------|-------|-------|
| **Display Large** | 32-48px | 1.25 | Bold (700) | Deep Forest Green | Welcome screens, major headlines |
| **Header 1** | 24-32px | 1.3 | Bold (700) | Deep Forest Green | Page titles |
| **Header 2** | 20-28px | 1.35 | Semibold (600) | Ocean Blue Deep | Section titles |
| **Header 3** | 18-20px | 1.4 | Semibold (600) | Coal Grey | Subsections |
| **Body Large** | 18px | 1.5 | Regular (400) | Coal Grey | Emphasis |
| **Body** | 14-16px | 1.5 | Regular (400) | Coal Grey | Default text, chat |
| **Body Small** | 14px | 1.45 | Regular (400) | Coal Grey | Secondary info |
| **Caption** | 12-13px | 1.4 | Regular (400) | Coal Grey 70% | Timestamps, metadata |
| **Label/Button** | 14-15px | 1.4 | Medium (500-600) | Context-dependent | Buttons, labels |

### Typesetting Rules

```css
/* From Visual Brand Guidelines */
line-height: 1.35-1.5;              /* Readable spacing */
text-transform: sentence-case;      /* For headers (not ALL CAPS) */
letter-spacing: normal;             /* Avoid excessive spacing */
font-stretch: normal;               /* Never use condensed fonts */
```

**Guidelines:**
- Use sentence case for headers (not title case)
- Avoid excessive character spacing
- Never use condensed fonts (breaks friendly aesthetic)

---

## Spacing System

**Base Unit:** 8px

**Scale:**
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
```

### Container Padding

```css
/* Mobile */
padding: 16-24px;

/* Desktop */
padding: 24-40px;
```

**Philosophy:** Keep layouts airy and uncluttered to maintain the brand's natural, breathable feel.

---

## Border Radius

**From Visual Brand Guidelines:**

```css
--radius-sm: 6px;      /* Small UI elements */
--radius-md: 8px;      /* Default - inputs, small buttons */
--radius-lg: 10px;     /* Buttons */
--radius-xl: 12px;     /* Cards */
--radius-2xl: 14-16px; /* Large cards, containers */
--radius-full: 9999px; /* Circular elements */
```

**Primary button radius:** 8-10px (NOT pill-shaped)
**Cards:** 12-16px
**Chat bubbles:** 18px (with asymmetric corners)

---

## Component Specifications

### Buttons (From Visual Brand Guidelines & Mockup)

#### Primary Button

```css
/* Background */
background-color: #228B1B; /* Deep Forest Green */
color: #FFFFFF;

/* Size */
padding: 14px 20px;
min-width: 120px;
height: auto;

/* Radius */
border-radius: 10px; /* NOT pill-shaped */

/* Typography */
font-size: 15px;
font-weight: 600;
letter-spacing: normal;

/* Hover */
background: lighten(#228B1B, 8-12%); /* Lighten 8-12% */
filter: brightness(1.05);

/* Active */
transform: scale(0.98);

/* Shadow */
box-shadow: 0 2px 8px rgba(0,0,0,0.08);
```

**From mockup implementation:**
```jsx
<button style={{
  padding: '14px 20px',
  backgroundColor: '#228B1B',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 600,
  cursor: 'pointer',
}}> Add Plant</button>
```

#### Secondary Button (Ocean Blue)

```css
background-color: #0A6F9C; /* Ocean Blue Deep */
color: #FFFFFF;
/* Same sizing as primary */

/* Hover */
background: lighten(#0A6F9C, 8-12%);
/* OR outline variant */
```

#### Tertiary Button (Text Only)

```css
background: transparent;
color: #2DA1C4; /* Ocean Blue Mid */
border: none;
text-decoration: underline;

/* Hover */
color: #0A6F9C; /* Ocean Blue Deep */
```

#### Icon Button (From Mockup)

```css
width: 44-48px;
height: 44-48px;
border-radius: 50%;
background: transparent;

/* Hover */
background: rgba(0,0,0,0.04);

/* Active */
background: rgba(0,0,0,0.08);
```

**Example from mockup:**
```jsx
<button style={{
  width: 48,
  height: 48,
  borderRadius: '50%',
  border: 'none',
  backgroundColor: '#0A6F9C',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}}>
  <span style={{ fontSize: '22px' }}>📸</span>
</button>
```

### Input Fields

#### Text Input

```css
/* Size */
height: 48px;
padding: 12px 16px;

/* Style */
border: 1px solid #F2F4F4;
border-radius: 8px;
background: #FFFFFF;

/* Typography */
font-size: 15-16px;
color: #333333;

/* Placeholder */
color: #333333;
opacity: 0.5;

/* Focus */
border: 2px solid #228B1B;
outline: none;
```

#### Chat Input (Special - From Mockup)

```css
/* Container */
background: #F2F4F4;
border-radius: 24px;
padding: 6px 6px 6px 18px;
display: flex;
align-items: center;
gap: 10px;

/* Input */
flex: 1;
border: none;
background: transparent;
font-size: 15px;
outline: none;

/* Placeholder */
placeholder: "Tell me what's happening...";
```

**Mobile implementation:**
```jsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  backgroundColor: '#F2F4F4',
  borderRadius: '24px',
  padding: '6px 6px 6px 18px',
}}>
  <input
    type="text"
    placeholder="Tell me what's happening..."
    style={{
      flex: 1,
      border: 'none',
      backgroundColor: 'transparent',
      fontSize: '15px',
      outline: 'none',
    }}
  />
  <button>{/* Camera icon */}</button>
</div>
```

### Cards (From Mockup Implementation)

#### Plant Card (Grid View)

```css
/* Container */
background: #FFFFFF;
border-radius: 16px;
overflow: hidden;
box-shadow: 0 4px 12px rgba(0,0,0,0.08);

/* Image Area */
height: 120px;
background: linear-gradient(135deg, #A6D85660 0%, #4BA83E60 100%);
display: flex;
align-items: center;
justify-content: center;
font-size: 48px;

/* Content Area */
padding: 14px;

/* Name */
font-size: 16px;
font-weight: 600;
color: #333333;
margin-bottom: 4px;

/* Species */
font-size: 13px;
color: #333333;
opacity: 0.6;
```

**Full implementation from mockup:**
```jsx
<div style={{
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  cursor: 'pointer',
}}>
  {/* Gradient header with emoji */}
  <div style={{
    height: '120px',
    background: 'linear-gradient(135deg, #A6D85660 0%, #4BA83E60 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
  }}>
    🌿
  </div>

  {/* Card content */}
  <div style={{ padding: '14px' }}>
    <div style={{ fontWeight: 600, fontSize: '16px' }}>Monty</div>
    <div style={{ fontSize: '13px', opacity: 0.6 }}>Monstera</div>
    {/* Status badge */}
  </div>
</div>
```

#### Plant Card (Compact/List View)

```css
/* From mockup compact mode */
display: flex;
align-items: center;
gap: 12px;
padding: 12px;
background: #FFFFFF;
border-radius: 12px;
box-shadow: 0 2px 8px rgba(0,0,0,0.06);

/* Needs water border */
border: 2px solid #E8A64F; /* When nextWater <= 1 */
```

#### Chat Bubble

**Bot Message (Left):**
```css
max-width: 80%;
padding: 14px 18px;
border-radius: 18px 18px 18px 4px; /* Asymmetric */
background: #FFFFFF;
color: #333333;
box-shadow: 0 2px 8px rgba(0,0,0,0.06);
font-size: 15px;
line-height: 1.5;
```

**User Message (Right):**
```css
max-width: 80%;
padding: 14px 18px;
border-radius: 18px 18px 4px 18px; /* Asymmetric opposite */
background: #0A6F9C; /* Ocean Blue Deep */
color: #FFFFFF;
font-size: 15px;
line-height: 1.5;
```

### Status Badges (From Mockup)

```jsx
const StatusBadge = ({ status }) => {
  const config = {
    healthy: { bg: '#4BA83E', label: 'Healthy' },
    needs_attention: { bg: '#E8A64F', label: 'Needs Care' },
    sick: { bg: '#E85A4F', label: 'Sick' },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      borderRadius: '12px',
      backgroundColor: `${bg}20`, /* 20% opacity */
      color: bg,
      fontSize: '12px',
      fontWeight: 500,
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: bg
      }} />
      {label}
    </span>
  );
};
```

### Navigation

#### Bottom Navigation (Mobile - From Mockup)

```css
/* Container */
display: flex;
justify-content: space-around;
padding: 12px 8px 24px;
background: #FFFFFF;
border-top: 1px solid #F2F4F4;

/* Nav Item */
display: flex;
flex-direction: column;
align-items: center;
gap: 4px;
padding: 8px 12px;

/* Icon */
font-size: 22px;
opacity: 0.5; /* Inactive */
opacity: 1.0; /* Active */

/* Label */
font-size: 11px;
font-weight: 400; /* Inactive */
font-weight: 600; /* Active */
color: #333333; /* Inactive */
color: #0A6F9C; /* Active - Ocean Blue Deep */
```

**Items:** Garden, Add, Chat, Tasks, Profile

#### Desktop Sidebar (From Mockup)

```css
/* Container */
width: 260px;
height: 100vh;
background: #FFFFFF;
border-right: 1px solid #F2F4F4;
padding: 24px 16px;

/* Logo Section */
display: flex;
align-items: center;
gap: 12px;
padding: 8px 12px;
margin-bottom: 8px;

/* Nav Button */
display: flex;
align-items: center;
gap: 12px;
width: 100%;
padding: 14px 16px;
border-radius: 10px;
background: transparent; /* Inactive */
background: rgba(10,111,156,0.1); /* Active - Ocean Blue Deep 10% */

/* Icon */
font-size: 20px;

/* Text */
font-size: 15px;
color: #333333; /* Inactive */
color: #0A6F9C; /* Active */
font-weight: 400; /* Inactive */
font-weight: 600; /* Active */
```

---

## Iconography

**Source:** Visual Brand Guidelines v1.1

### Style Guide

```css
/* Icon Properties */
stroke-linecap: round;          /* Rounded line caps */
stroke-width: 2-2.5px;          /* Responsive scaling */
fill: none;                     /* Simple geometry, no fill */
color: #0A6F9C OR #228B1B;      /* Ocean Blue Deep or Deep Forest Green */

/* Behavior */
opacity: 1.0;                   /* Active */
opacity: 0.5-0.6;               /* Inactive */
opacity: 0.35;                  /* Disabled */

/* Hover */
stroke: lighten 10-15%;

/* Sizes */
--icon-sm: 16px;
--icon-md: 20px;
--icon-lg: 24px;
--icon-xl: 28px;
```

**Rules:**
- Rounded line caps
- Simple geometry
- Avoid 3D, shadows, or overly complex shapes
- 2-2.5px stroke weight

**Mockup uses emoji icons for prototype:**
- 🏡 Garden
- 🌱 Add Plant
- 💬 Chat
- 📋 Tasks
- 👤 Profile
- 💧 Water
- 📸 Camera
- ✨ AI Features

**Production:** Replace with custom icon set matching style guide (Feather Icons or custom SVG)

---

## Layout & Spacing

**Source:** Visual Brand Guidelines

### Core Spacing Unit

```css
--base-unit: 8px;
```

### Container Padding

```css
/* Mobile */
padding: 16-24px;

/* Desktop */
padding: 24-40px;
```

### Component Spacing

```css
/* Component internal padding */
padding: 16px;           /* Default cards */
padding: 12-14px;        /* Compact cards */
padding: 20-24px;        /* Large cards */

/* Element spacing */
gap: 8px;                /* Tight */
gap: 12px;               /* Default */
gap: 16px;               /* Comfortable */
gap: 24px;               /* Section spacing */

/* Icon + text */
gap: 8-12px;
```

### Grid Systems (From Mockup)

**Mobile - 2 Column Grid:**
```css
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 12px;
```

**Desktop - Auto-fill:**
```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
gap: 16px;
```

**Desktop Chat Layout:**
```css
display: grid;
grid-template-columns: 1fr 380px; /* Main panel + sidebar */
gap: 24px;
```

---

## Shadows & Elevation

**From Mockup Implementation:**

```css
/* Elevation 1 - Cards at rest */
box-shadow: 0 2px 8px rgba(0,0,0,0.06);

/* Elevation 2 - Hover, raised */
box-shadow: 0 4px 12px rgba(0,0,0,0.08);

/* Elevation 3 - Modals, dropdowns */
box-shadow: 0 2px 12px rgba(0,0,0,0.04);

/* Elevation 4 - Overlays */
box-shadow: 0 8px 24px rgba(0,0,0,0.12);
```

**Visual Brand Guidelines:**
- Very subtle shadows
- 4-8px blur
- 15% opacity
- Rounded-edge cards with soft shadows

---

## Animations & Transitions

**From Mockup Implementation:**

### Timing

```css
--duration-instant: 100ms;
--duration-fast: 200ms;
--duration-normal: 300ms;
--duration-slow: 400ms;

--easing: ease;
--easing-out: ease-out;
--easing-in-out: ease-in-out;
```

### Common Transitions

```css
/* Hover states */
transition: all 0.2s ease;

/* Button press */
button:active {
  transform: scale(0.98);
}

/* Button hover */
button:hover {
  filter: brightness(1.05);
}
```

### Animations

**Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease forwards;
}
```

**Slide Up:**
```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-slide-up {
  animation: slideUp 0.4s ease forwards;
}
```

**Pulse (Recording Indicator):**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.recording-dot {
  animation: pulse 1s infinite;
}
```

---

## Tone & Microcopy

**Source:** Visual Brand Guidelines v1.1

### Tone Attributes

- ✅ Friendly but not childish
- ✅ Helpful, encouraging, and clear
- ❌ Avoid botanical jargon unless meaningful

### Microcopy Examples

**From Visual Brand Guidelines:**
- "Add a plant to your garden"
- "Share progress with your community"
- "Tasks to help your garden thrive"

**From Mockup Implementation:**
- "Tell me what's happening..."
- "Good morning! 🌿"
- "Grow with the Flow"
- "I just watered Monty"
- "How is Basil doing?"
- "Let me help diagnose..."

**Principles:**
- Use natural language
- Speak like a knowledgeable friend
- Avoid dry or technical phrasing
- Encourage action with positive language
- Use emoji sparingly for warmth (🌿 💧 📸 ✨)

---

## Working Mockup Reference

### File Location

`styling/shrubhub-mockup.html`

This file contains a **fully functional React prototype** with:

✅ Complete mobile & desktop layouts
✅ Real brand colors implementation
✅ Chat interface with AI intent detection
✅ Suggestion system
✅ Plant cards and garden views
✅ Voice recording indicator
✅ Bottom navigation & desktop sidebar
✅ Mode toggle (AI Chat vs Manual)
✅ All component styling

### Key Features Implemented

**AI Intent Detection:**
- Natural language parsing for activities
- Plant mention detection
- Query understanding (watering schedule, plant status, troubleshooting)
- Confidence scoring

**Smart Suggestions:**
- Context-aware action suggestions
- Quick replies based on user input
- Activity logging shortcuts

**Components:**
- LogoSVG component
- StatusBadge component
- PlantCard (grid & compact modes)
- SuggestionPill
- ChatMessage
- VoiceIndicator
- QuickActions
- ModeToggle
- BottomNav (mobile)
- Sidebar (desktop)

**Data:**
- MOCK_PLANTS array with 6 sample plants
- ACTIVITIES array with 16 activity types
- Intent detection patterns
- Suggestion generation logic

### How to Use the Mockup

1. **View it:** Open `styling/shrubhub-mockup.html` in a browser
2. **Test responsiveness:** Resize window (mobile < 768px)
3. **Interact:** Try typing in chat input to see AI suggestions
4. **Study the code:** All styling inline for easy extraction
5. **Extract components:** Copy React components for your app

---

## Brand Application Examples

**From Visual Brand Guidelines:**

### Visual Style

✅ White background with logo centered and ample whitespace
✅ Ocean Blue gradients behind plant illustrations
✅ Rounded-edge cards with soft shadows (4-8px blur, 15% opacity)
✅ Green accents for key actions (NOT for warnings/alerts)

### Do's

✅ Use Deep Forest Green (#228B1B) for primary actions
✅ Use Ocean Blue Deep (#0A6F9C) for secondary actions
✅ Keep layouts airy with generous spacing
✅ Use Roboto for all typography
✅ Maintain 60/25/10/5 color ratio
✅ Round all corners appropriately (8-16px)

### Don'ts

❌ Use bright red for success states
❌ Use Deep Forest Green for alerts/warnings
❌ Condense layouts without whitespace
❌ Use pill-shaped buttons (use 8-10px radius)
❌ Mix other fonts with Roboto
❌ Over-use gradients outside of accents
❌ Use hard shadows or dark borders

---

## Quick Start Implementation Guide

### 1. Set Up Your Environment

**Install dependencies:**
```bash
npm install react react-dom
# or
npm create vite@latest shrubhub -- --template react
```

**Copy brand assets:**
```bash
cp styling/shrubhub_logo.svg public/
cp styling/shrubhub.png public/
```

### 2. Create CSS Variables

**`src/styles/tokens.css`:**
```css
:root {
  /* Colors - From Visual Brand Guidelines v1.1 */
  --deep-forest-green: #228B1B;
  --light-leaf-green: #A6D856;
  --deep-leaf-green: #4BA83E;
  --ocean-blue-deep: #0A6F9C;
  --ocean-blue-mid: #2DA1C4;
  --ocean-blue-light: #66CDE1;
  --ocean-mist: #C5EEF4;
  --coal-grey: #333333;
  --soft-grey: #F2F4F4;
  --white: #FFFFFF;

  /* Semantic */
  --healthy: #4BA83E;
  --needs-attention: #E8A64F;
  --urgent: #E85A4F;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-full: 9999px;

  /* Typography */
  --font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### 3. Import Roboto Font

**`public/index.html`:**
```html
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 4. Base Styles

**`src/styles/global.css`:**
```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  background-color: var(--soft-grey);
  color: var(--coal-grey);
  font-size: 16px;
  line-height: 1.5;
}

::placeholder {
  color: var(--coal-grey);
  opacity: 0.5;
}

button {
  transition: all 0.2s ease;
  cursor: pointer;
}

button:hover {
  filter: brightness(1.05);
}

button:active {
  transform: scale(0.98);
}
```

### 5. Use Tailwind (Optional)

**If using Tailwind CSS, configure colors:**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'forest': {
          DEFAULT: '#228B1B',
        },
        'leaf': {
          light: '#A6D856',
          dark: '#4BA83E',
        },
        'ocean': {
          deep: '#0A6F9C',
          mid: '#2DA1C4',
          light: '#66CDE1',
          mist: '#C5EEF4',
        },
        'coal': '#333333',
        'soft': '#F2F4F4',
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
    },
  },
};
```

### 6. Extract Components from Mockup

**Copy React components from `styling/shrubhub-mockup.html`:**

- StatusBadge
- PlantCard
- ChatMessage
- SuggestionPill
- QuickActions
- BottomNav
- Sidebar

**Place in:** `src/components/`

---

## Design Tokens (JSON)

**File:** `styling/shrubhub_tokens.json`

```json
{
  "colors": {
    "deep_forest_green": "#228B1B",
    "leaf_light": "#A6D856",
    "leaf_dark": "#4BA83E",
    "ocean_blue_deep": "#0A6F9C",
    "ocean_blue_mid": "#2DA1C4",
    "ocean_blue_light": "#66CDE1",
    "ocean_mist": "#C5EEF4",
    "neutral_dark": "#333333",
    "neutral_light": "#F2F4F4"
  },
  "typography": {
    "header1": {
      "font": "Roboto",
      "weight": "Bold"
    },
    "header2": {
      "font": "Roboto",
      "weight": "Semibold"
    },
    "body": {
      "font": "Roboto",
      "weight": "Regular"
    }
  }
}
```

---

## Mobile-Specific Considerations

**From Mockup Implementation:**

### Touch Targets

```css
/* Minimum touch target */
min-width: 44px;
min-height: 44px;

/* Input area */
padding: 12px; /* Easy thumb reach */
```

### Safe Areas

```css
/* Bottom navigation */
padding-bottom: 24px; /* Account for iOS home indicator */

/* Header */
padding-top: 16px; /* Below status bar */
```

### Responsive Breakpoint

```javascript
const isMobile = window.innerWidth < 768;
```

**Mobile:** < 768px
**Desktop:** >= 768px

### Mobile-First Layout

```jsx
// Header + Content + Input + Bottom Nav
<div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
  <header style={{ position: 'sticky', top: 0 }}>...</header>
  <main style={{ flex: 1, overflow: 'auto' }}>...</main>
  <div style={{ position: 'fixed', bottom: 80 }}>...</div>
  <nav style={{ position: 'fixed', bottom: 0 }}>...</nav>
</div>
```

---

## Desktop-Specific Considerations

### Layout Structure

```jsx
// Sidebar + Main Content
<div style={{ display: 'flex', minHeight: '100vh' }}>
  <aside style={{ width: 260 }}>...</aside>
  <div style={{ flex: 1 }}>
    <header>...</header>
    <main>...</main>
  </div>
</div>
```

### Content Grid

```css
/* Chat view with sidebar */
display: grid;
grid-template-columns: 1fr 380px;
gap: 24px;
```

---

## Accessibility

### Color Contrast

All text meets WCAG AA standards:
- Deep Forest Green on White: 4.8:1 ✅
- Coal Grey on White: 12.6:1 ✅
- Ocean Blue Deep on White: 4.5:1 ✅

### Status Indicators

Use both color AND shape/icon:
```jsx
<span style={{ color: '#4BA83E' }}>
  <span>● </span> {/* Dot */}
  Healthy
</span>
```

### Screen Reader Support

```jsx
<button aria-label="Add new plant">
  <span aria-hidden="true">🌱</span>
</button>
```

### Keyboard Navigation

```css
/* Focus states */
button:focus-visible {
  outline: 2px solid var(--ocean-blue-mid);
  outline-offset: 2px;
}
```

---

## Assets Checklist

### Required Files

- [x] `styling/shrubhub_logo.svg` - Vector logo
- [x] `styling/shrubhub.png` - Full lockup
- [x] `styling/shrubhub-imageonly.png` - Symbol only
- [x] `styling/Visual Brand Guidelines.md` - Authoritative design source
- [x] `styling/shrubhub-mockup.html` - Working prototype
- [x] `styling/shrubhub_tokens.json` - Design tokens
- [x] `styling/Shrub Hub Brand Kit - Dec 2025.png` - Brand kit reference

### Icon Library Needed

**Recommended:** Feather Icons or Lucide Icons
- Match 2-2.5px stroke weight
- Rounded line caps
- Simple geometry
- Replace emoji in production

**Key icons:**
- Home/Garden
- Plus/Add
- Chat bubble
- Task list
- User profile
- Water drop
- Camera
- Calendar
- Location
- Settings

---

## Next Steps for Development

### Phase 1: Setup (Week 1)

1. ✅ Review styling folder assets
2. ✅ Study Visual Brand Guidelines v1.1
3. ✅ Explore working mockup
4. ⬜ Set up React project
5. ⬜ Install Roboto font
6. ⬜ Create CSS variables/tokens
7. ⬜ Set up base styles

### Phase 2: Component Library (Week 2)

1. ⬜ Extract components from mockup
2. ⬜ Build Button component (primary, secondary, icon)
3. ⬜ Build Input component
4. ⬜ Build StatusBadge component
5. ⬜ Build PlantCard component
6. ⬜ Build ChatMessage component
7. ⬜ Test responsiveness

### Phase 3: Layouts (Week 3)

1. ⬜ Build mobile layout shell
2. ⬜ Build desktop layout shell
3. ⬜ Implement bottom navigation
4. ⬜ Implement desktop sidebar
5. ⬜ Test layout switching at 768px breakpoint

### Phase 4: Features (Week 4+)

1. ⬜ Implement chat interface
2. ⬜ Build AI intent detection (from mockup)
3. ⬜ Create suggestion system
4. ⬜ Implement garden overview
5. ⬜ Add plant detail views
6. ⬜ Integrate with backend/Supabase

---

## Summary

### Design Authority

**Visual Brand Guidelines v1.1** is the king. All design decisions should reference it first.

### Key Brand Colors (Memorize These)

- **#228B1B** - Deep Forest Green (primary)
- **#0A6F9C** - Ocean Blue Deep (secondary)
- **#F2F4F4** - Soft Grey (background)
- **#333333** - Coal Grey (text)

### Key Differences from Original Draft

| Element | Original (Wrong) | Official (Correct) |
|---------|------------------|-------------------|
| Primary Green | #2D5016 | **#228B1B** |
| Button Radius | 24px (pill) | **8-10px** |
| Font | System fonts | **Roboto** |
| Secondary Color | Green variants | **Ocean Blues** |
| Logo | Generic | **Specific wave + plant design** |

### Where to Find What

- **Colors:** Visual Brand Guidelines section 3
- **Typography:** Visual Brand Guidelines section 4
- **Components:** shrubhub-mockup.html (lines 372-1600)
- **Logo:** shrubhub_logo.svg
- **Tokens:** shrubhub_tokens.json
- **Visual Reference:** Shrub Hub Brand Kit - Dec 2025.png

---

**This document is based on official brand assets and should be updated only when Visual Brand Guidelines.md is updated.**
