
-- 1) Add user_id to connections and a partial unique index on (user_id, provider)
alter table public.connections
  add column if not exists user_id uuid;

create unique index if not exists connections_user_provider_uidx
  on public.connections(user_id, provider)
  where user_id is not null;

-- 2) Create oauth_states (used by Google/Dropbox OAuth PKCE flows)
create table if not exists public.oauth_states (
  state text primary key,
  user_id uuid not null,
  provider text not null check (provider in ('google','dropbox')),
  code_verifier text not null,
  created_at timestamptz not null default now()
);

alter table public.oauth_states enable row level security;

-- Deny all access to anon/auth (service-role writes only from Edge Functions)
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
