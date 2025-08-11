
-- 0) Prereqs: required extension
create extension if not exists pgcrypto;

-- 1) Tables

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

-- 2) Explicit "deny all" policies for anon/authenticated
-- Note: Service role bypasses RLS so Edge Functions continue to work.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'api_keys' and polname = 'No access for anon/auth'
  ) then
    create policy "No access for anon/auth"
      on public.api_keys
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'connections' and polname = 'No access for anon/auth'
  ) then
    create policy "No access for anon/auth"
      on public.connections
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;
end
$$;

-- Notes:
-- - RLS defaults to deny if there are no policies, but these explicit policies
--   make the intent clear and guard against accidental future grants.
-- - If/when you add Supabase Auth and want users to manage their own API keys,
--   we can introduce a profiles table and then swap these “deny” policies
--   for ownership-based policies (e.g., join installation_id to the user’s profile).
