-- Fix: use correct column name policyname in pg_policies lookup
-- Create required tables for OAuth integrations and secure token storage
create extension if not exists pgcrypto;

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  provider text not null check (provider in ('google','dropbox')),
  access_token text not null,
  refresh_token text,
  expiry_ts bigint,
  scope text,
  account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.connections enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'connections' and policyname = 'No access for anon/auth'
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

create unique index if not exists connections_user_provider_uidx
  on public.connections(user_id, provider)
  where user_id is not null;

drop trigger if exists trg_connections_updated_at on public.connections;
create trigger trg_connections_updated_at
before update on public.connections
for each row
execute function public.set_updated_at();

create table if not exists public.oauth_states (
  state text primary key,
  user_id uuid not null,
  provider text not null check (provider in ('google','dropbox')),
  code_verifier text not null,
  created_at timestamptz not null default now()
);

alter table public.oauth_states enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'oauth_states' and policyname = 'No access for anon/auth'
  ) then
    create policy "No access for anon/auth"
      on public.oauth_states
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;
end
$$;