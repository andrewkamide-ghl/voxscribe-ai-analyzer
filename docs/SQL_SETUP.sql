-- Run this SQL in Supabase SQL editor if migrations folder is read-only in this environment.

-- API keys (for public /v1-crawl access via X-Api-Key)
create extension if not exists pgcrypto;

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  installation_id text not null,
  name text,
  prefix text not null,
  hashed_key text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists api_keys_prefix_hash_uidx on public.api_keys (prefix, hashed_key);
create index if not exists api_keys_installation_idx on public.api_keys (installation_id);

alter table public.api_keys enable row level security;
-- No public selects; functions use service-role. Keep policies minimal for now.

-- Future OAuth connections (Google/Dropbox) — staged for next milestone
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  installation_id text not null,
  provider text not null check (provider in ('google','dropbox')),
  access_token text not null,
  refresh_token text,
  expiry_ts bigint,
  scope text,
  account_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists connections_installation_provider_uidx on public.connections (installation_id, provider);
alter table public.connections enable row level security;
