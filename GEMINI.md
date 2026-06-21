# Wine Tracker

> **Account note:** This project is scoped to Stephen's *personal* Claude account via
> `.vscode/settings.json` (`CLAUDE_CONFIG_DIR=~/.claude-personal`), applied to integrated
> terminals only. Use the terminal (`claude` command), not the Claude Code side panel,
> to guarantee the personal account is active. Run `whoclaude` in any terminal tab to
> confirm which config directory — and account — that session is using.

---

## Project overview

A two-person wine cellar and tasting log for Stephen and Jennifer.

**Architecture — important, read before suggesting changes:**
- The database (Supabase Postgres) is the source of truth.
- A separate Claude Project (in claude.ai, *not* this codebase) handles two jobs directly
  against the database via a connector: (1) adding wines from label photos, (2) pairing
  and comparison-tasting analysis. That logic lives in that Project's instructions, not here.
- **This codebase is only a read-only viewer.** Do not build write flows, label-scanning,
  AI integration, or an edge function unless explicitly asked — that's intentionally out
  of scope and handled by the Project instead.

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS, shadcn/ui primitives
- Supabase JS client (`@supabase/supabase-js`) for reads only
- vite-plugin-pwa for installability
- Deploy target: Vercel

## Schema

Two tables. Full definitions in `supabase/migrations/0001_initial_schema.sql` — read that
file before writing any query or generating types.

- `wines` — identity (producer, name, vintage, region, appellation, varietals, style) +
  inventory (`quantity`, `cellar_location`) + acquisition + drink window + notes.
  In-cellar wines are simply `quantity > 0`.
- `tastings` — one row per drinking event, optionally linked to a `wines.id`, with
  separate `stephen_rating` / `jennifer_rating` columns and free-text notes.

## Conventions

- All Supabase calls go through `src/lib/queries.ts`. No direct client calls inside components.
- Use TanStack Query for caching reads.
- Mobile-first: design at 390px width first, desktop is secondary.
- No localStorage for app data — Supabase is the only data store. localStorage is fine
  for transient UI prefs only (e.g. last-used filter).
- Don't add enums/triggers/views beyond what's in the migration without asking — the
  schema was deliberately kept minimal.

## Current phase

Phase 1 (database + Project) is done outside this repo. We are starting **Phase 2**:
the read-only viewer. See `README.md` for the build order.
