# Brainwriting

A real-time multi-user writers' room ideation tool. Small groups (4–10 people) generate ideas independently, curate their favorites, rate each other's ideas anonymously, debate the top contenders, and vote on a winner. The whole cycle takes about 30 minutes.

## Tech Stack

- **Frontend**: Next.js 14+ with React, Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL + Realtime subscriptions)
- **Auth**: No login required — localStorage UUID for identity persistence
- **Real-time**: Supabase Realtime for live updates across all participants

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to the SQL Editor and run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and anon key from Settings → API

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy

## How It Works

1. **Lobby** — Enter your name, create or join a session with a 4-character code
2. **Waiting Room** — Host configures rounds and sets the creative prompt
3. **Generate** — Timed rounds of independent idea generation
4. **Curate** — Select your top 5 ideas from all rounds
5. **Rate** — Anonymously rate other participants' curated ideas (1–5 stars)
6. **Reveal** — See the top-rated ideas, the most prolific ideator, and the most audacious idea
7. **Debate & Vote** — Discuss the top 5, then cast a single vote for your favorite
8. **Results** — Crown the winner with awards tracked on an all-time leaderboard

## Awards

- **The Crown** (👑) — Winner of the final vote (+3 leaderboard points)
- **The Fumble** (💀) — Lowest-rated idea, celebrated as "Most Audacious" (+1 point)
- **The Torrent** (⚡) — Most ideas generated across all rounds (+1 point)
