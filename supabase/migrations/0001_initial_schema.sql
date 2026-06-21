-- Wine Tracker: initial schema
-- Two tables: wines (identity + inventory) and tastings (drinking history)

create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

create table wines (
  id              uuid primary key default uuid_generate_v4(),
  -- identity
  producer        text not null,
  name            text,                 -- cuvée / vineyard, e.g. "Clos de la Roche". Null for simple wines.
  vintage         integer,              -- null for NV
  country         text,
  region          text,                 -- Burgundy, Napa Valley, Rioja
  appellation     text,                 -- Puligny-Montrachet 1er Cru, Oakville AVA
  varietals       text[] not null default '{}',
  style           text not null,        -- red | white | rose | sparkling | fortified | dessert | orange
  classification  text,                 -- Grand Cru, DOCG, Reserva...
  alcohol_pct     numeric(4,2),
  -- inventory
  quantity        integer not null default 1,   -- how many currently in cellar
  format          text default 'standard_750ml',
  cellar_location text,
  -- acquisition
  purchase_date   date,
  purchase_price  numeric(10,2),
  purchase_source text,
  -- drinking guidance + our notes
  drink_from      integer,              -- year
  drink_until     integer,              -- year
  notes           text,                 -- our general notes about the wine
  label_photo_url text,                 -- optional; only if the viewer wants to show labels
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index wines_producer_idx on wines (producer);
create index wines_region_idx   on wines (region);
create index wines_in_cellar_idx on wines (quantity) where quantity > 0;
create index wines_producer_trgm_idx on wines using gin (producer gin_trgm_ops);
create index wines_name_trgm_idx on wines using gin (name gin_trgm_ops);

create table tastings (
  id              uuid primary key default uuid_generate_v4(),
  wine_id         uuid references wines(id) on delete set null,  -- nullable: a logged wine we never owned still works
  tasting_date    date not null,
  occasion        text,
  location        text,
  companions      text,
  food_pairing    text,
  stephen_rating  numeric(4,1),         -- whatever scale you actually use (e.g. 1-100)
  jennifer_rating numeric(4,1),
  notes           text,
  created_at      timestamptz not null default now()
);

create index tastings_wine_idx on tastings (wine_id);
create index tastings_date_idx on tastings (tasting_date desc);

-- updated_at trigger for wines
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger wines_updated_at before update on wines
  for each row execute function set_updated_at();

-- Optional convenience: decrement quantity when a tasting is logged against a wine.
-- Leave this in unless you'd rather control quantity explicitly.
create or replace function decrement_on_tasting()
returns trigger language plpgsql as $$
begin
  if new.wine_id is not null then
    update wines set quantity = greatest(quantity - 1, 0)
    where id = new.wine_id;
  end if;
  return new;
end $$;

create trigger tastings_decrement after insert on tastings
  for each row execute function decrement_on_tasting();

-- Row Level Security: household tool, both users see/do everything. Auth is the only gate.
alter table wines enable row level security;
alter table tastings enable row level security;

create policy "auth all wines" on wines for all using (auth.role() = 'authenticated');
create policy "auth all tastings" on tastings for all using (auth.role() = 'authenticated');
