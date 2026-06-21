# Wine Tracker

A two-person wine cellar and tasting log. See `GEMINI.md` for architecture and conventions
before making changes.

## Setup

1. Create a Supabase project (free tier).
2. Run the migration: `supabase/migrations/0001_initial_schema.sql` (via the Supabase SQL
   editor, or `supabase db push` if using the CLI).
3. In Supabase Auth settings, disable public signup. Create the two logins for Stephen
   and Jennifer manually.
4. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key.
5. `npm install`
6. `npm run dev`

## Build order (Phase 2 — the viewer)

This repo is a **read-only viewer only**. Adding wines and analysis happen in a separate
Claude Project connected directly to the database — not here.

1. Vite + React + TS + Tailwind scaffold, Supabase client wired up, deploy skeleton to Vercel.
2. Cellar grid: `select * from wines where quantity > 0`, card layout, filters for region,
   style, and "ready to drink" (`drink_from <= current year <= drink_until`).
3. Wine detail page: full record + its tasting history (`select * from tastings where wine_id = ...`).
4. PWA manifest + icons so it installs on both phones.
5. Polish: search bar, empty states, loading skeletons.

## Environment variables

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

No Anthropic API key belongs in this repo — the AI features live entirely in the separate
Claude Project, not in application code.
