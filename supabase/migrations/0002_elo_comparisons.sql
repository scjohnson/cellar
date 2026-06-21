-- Migration: Add pairwise comparison system
-- Run this in the Supabase SQL Editor

-- 1. Remove numeric rating columns from tastings (replaced by Elo comparisons)
alter table tastings
  drop column if exists stephen_rating,
  drop column if exists jennifer_rating;

-- 2. Add Elo rating columns to wines (default 1500 = unranked baseline)
alter table wines
  add column if not exists stephen_elo numeric(8,2) not null default 1500,
  add column if not exists jennifer_elo numeric(8,2) not null default 1500;

-- 3. Create comparisons table
create table if not exists comparisons (
  id               uuid primary key default uuid_generate_v4(),
  -- The two wines being compared (order is arbitrary, implies nothing)
  wine_a_id        uuid not null references wines(id) on delete cascade,
  wine_b_id        uuid not null references wines(id) on delete cascade,
  -- Who preferred which wine; null = tie for that person
  stephen_winner   uuid references wines(id) on delete set null,
  jennifer_winner  uuid references wines(id) on delete set null,
  -- Context
  comparison_date  date not null default current_date,
  occasion         text,
  notes            text,
  created_at       timestamptz not null default now(),
  -- Sanity check
  constraint different_wines check (wine_a_id != wine_b_id)
);

create index if not exists comparisons_wine_a_idx on comparisons (wine_a_id);
create index if not exists comparisons_wine_b_idx on comparisons (wine_b_id);
create index if not exists comparisons_date_idx   on comparisons (comparison_date desc);

-- 4. RLS
alter table comparisons enable row level security;
create policy "auth all comparisons" on comparisons
  for all using (auth.role() = 'authenticated');
