-- Cadenzia database schema (Supabase / PostgreSQL).
-- Run in the Supabase SQL editor. RLS is enabled on every table; the Worker uses
-- the service-role key (which bypasses RLS) for privileged writes, while any
-- direct client access is restricted to a user's own rows.

create extension if not exists "pgcrypto";

-- USERS -----------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  stripe_customer_id text,
  subscription_status text not null default 'free', -- 'free' | 'active'
  created_at timestamptz not null default now()
);

-- SUBSCRIPTIONS ---------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  stripe_subscription_id text unique,
  status text not null default 'free',
  current_period_end timestamptz
);

-- EMAIL SUBSCRIBERS -----------------------------------------------------------
create table if not exists public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  consent_given boolean not null default false,
  unsubscribed boolean not null default false,
  created_at timestamptz not null default now()
);

-- LISTENING SESSIONS (privacy-first stats) ------------------------------------
create table if not exists public.listening_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  track_id text not null,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

-- SHARES (milestones — Phase 2) -----------------------------------------------
create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  share_token text not null,
  platform text,
  redeemed boolean not null default false,
  created_at timestamptz not null default now()
);

-- PLAY COUNTER (honest social proof) ------------------------------------------
-- A single-row global counter of total tracks played. Incremented atomically via
-- the increment_plays() function so concurrent plays never clobber each other.
create table if not exists public.play_counter (
  id integer primary key default 1,
  count bigint not null default 0,
  constraint single_row check (id = 1)
);
insert into public.play_counter (id, count) values (1, 0) on conflict (id) do nothing;

create or replace function public.increment_plays()
  returns bigint
  language sql
  as $$
    update public.play_counter set count = count + 1 where id = 1 returning count;
  $$;

-- ROW LEVEL SECURITY ----------------------------------------------------------
alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.email_subscribers enable row level security;
alter table public.listening_sessions enable row level security;
alter table public.shares enable row level security;
alter table public.play_counter enable row level security;
-- play_counter is read and written only by the Worker (service role); no public
-- policies are granted, so anon/auth clients cannot touch it directly.

-- Users can read/write only their own rows. (auth.uid() = the Supabase auth id;
-- if you front auth entirely through the Worker, you may instead rely solely on
-- the service-role key and keep these policies restrictive.)
create policy "own user row" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own subscriptions" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own sessions" on public.listening_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- email_subscribers + shares are managed by the Worker (service role) only;
-- no public policies are granted, so anon/auth clients cannot read them.
