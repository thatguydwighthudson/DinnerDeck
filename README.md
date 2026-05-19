# DinnerDeck

Family dinner planner — mobile-first Next.js app for Dwight & Allyson.

## Stack
- **Next.js 14** (App Router)
- **Drizzle + Neon** (PostgreSQL)
- **Anthropic Claude** (meal suggestions + URL import)
- **Vercel** (deploy)

## Setup

### 1. Clone & install
```bash
git clone <your-repo>
cd dinnerdeck
npm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
# Fill in DATABASE_URL and ANTHROPIC_API_KEY
```

**DATABASE_URL** — create a new database at [console.neon.tech](https://console.neon.tech). You can use your existing TalkCents project and create a new database named `dinnerdeck`.

**ANTHROPIC_API_KEY** — same key you use for TalkCents.

### 3. Push schema & seed
```bash
npm run db:push      # syncs schema to Neon (Drizzle Kit)
npm run db:seed      # seeds starter meals + kids meals
```

### 4. Run locally
```bash
npm run dev
# Open http://localhost:3001 on your phone (same WiFi: use your computer's local IP)
```

### 5. Deploy to Vercel
```bash
# Push to GitHub, then connect repo in Vercel dashboard
# Add DATABASE_URL and ANTHROPIC_API_KEY to Vercel environment variables
```

## Features
- **Week planner** — assign meals to each day, servings per day, leftover days
- **AI suggestions** — Claude generates 5 new meals (saved to your library) and auto-plans the week
- **Meal library** — filter by protein/veg/low-carb/AI-generated, favorite meals
- **Manual add** — add any meal with macros and grocery items
- **URL import** — paste any recipe link, Claude extracts name/macros/ingredients
- **Kids meals** — separate per-day kids option, track what they liked
- **Grocery list** — auto-generated from week plan, split Sam's vs Harris Teeter
- **History** — past meals tracked by week automatically

## Database schema
- `Meal` — your library (manual + AI-generated + imported)
- `KidsMeal` — kids-specific options
- `WeekPlan` — one row per day per week
- `MealHistory` — archived past weeks
- `ImportedUrl` — cache for URL extractions
