-- Create required tables for OAuth integrations and secure token storage
-- 1) Ensure pgcrypto for gen_random_uuid
create extension if not exists pgcrypto;

-- 2) connections table (user-scoped provider tokens)
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

-- Enable RLS and deny direct access to anon/auth (edge functions use service role)
alter table public.connections enable row level security;

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

-- Unique index on user + provider when user_id is present
create unique index if not exists connections_user_provider_uidx
  on public.connections(user_id, provider)
  where user_id is not null;

-- Keep updated_at fresh
drop trigger if exists trg_connections_updated_at on public.connections;
create trigger trg_connections_updated_at
before update on public.connections
for each row
execute function public.set_updated_at();

-- 3) oauth_states table for PKCE/CSRF flows
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
    where schemaname = 'public' and tablename = 'oauth_states' and polname = 'No access for anon/auth'
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