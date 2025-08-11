
-- 1) Table to store encrypted per-user OpenAI keys (BYOK)

create table if not exists public.user_ai_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('openai')),
  -- AES-GCM ciphertext (base64) produced in Edge Functions
  encrypted_key text not null,
  -- AES-GCM IV/nonce (base64) - unique per record/update
  iv text not null,
  -- Last 4 chars of the original API key for UX
  last_four text not null check (char_length(last_four) = 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

-- Helpful index for lookups
create index if not exists user_ai_credentials_user_id_idx on public.user_ai_credentials (user_id);

-- 2) Row Level Security
alter table public.user_ai_credentials enable row level security;

-- Users can see their own credentials metadata (not plaintext)
create policy "Users can view their own ai credentials"
  on public.user_ai_credentials
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert their own credentials
create policy "Users can insert their own ai credentials"
  on public.user_ai_credentials
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own credentials
create policy "Users can update their own ai credentials"
  on public.user_ai_credentials
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own credentials
create policy "Users can delete their own ai credentials"
  on public.user_ai_credentials
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- 3) updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_user_ai_credentials on public.user_ai_credentials;

create trigger set_updated_at_user_ai_credentials
  before update on public.user_ai_credentials
  for each row execute procedure public.set_updated_at();
