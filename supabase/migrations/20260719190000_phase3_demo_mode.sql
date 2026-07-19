-- Armz Clash Phase 3: Demo Mode sessions, temporary Common ARMZ, simulated battles
-- Real-value systems remain disabled. No staking. Demo assets are temporary only.

-- ---------------------------------------------------------------------------
-- demo_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  player_id uuid null references public.players (id) on delete set null,
  battles_played integer not null default 0,
  max_battles integer not null default 20,
  demo_reward_units_total bigint not null default 0,
  last_battle_at timestamptz null,
  next_battle_available_at timestamptz null,
  last_armz_reset_at timestamptz null,
  next_armz_reset_available_at timestamptz null,
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  configuration_version text not null default 'demo-combat-v1',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint demo_sessions_battles_check check (battles_played >= 0),
  constraint demo_sessions_max_battles_check check (max_battles > 0),
  constraint demo_sessions_reward_check check (demo_reward_units_total >= 0)
);

create index if not exists demo_sessions_expires_idx
  on public.demo_sessions (expires_at)
  where revoked_at is null;

create index if not exists demo_sessions_player_idx
  on public.demo_sessions (player_id)
  where player_id is not null;

comment on table public.demo_sessions is
  'Anonymous Demo Mode sessions. Store token hashes only. Temporary; no real value.';

-- ---------------------------------------------------------------------------
-- demo_armz (temporary Common ARMZ — not inventory, not mintable)
-- ---------------------------------------------------------------------------
create table if not exists public.demo_armz (
  id uuid primary key default gen_random_uuid(),
  demo_session_id uuid not null references public.demo_sessions (id) on delete cascade,
  preset_key text not null,
  display_name text not null,
  rarity text not null default 'common',
  level integer not null default 1,
  power integer not null,
  grip integer not null,
  technique integer not null,
  endurance integer not null,
  defense integer not null,
  speed integer not null,
  luck integer not null,
  critical_chance_bps integer not null,
  cosmetic_variant text not null,
  animation_set_key text not null,
  temporary boolean not null default true,
  transferable boolean not null default false,
  claimable boolean not null default false,
  blockchain_asset boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  constraint demo_armz_rarity_common check (rarity = 'common'),
  constraint demo_armz_level_one check (level = 1),
  constraint demo_armz_flags_check check (
    temporary = true and transferable = false and claimable = false and blockchain_asset = false
  )
);

create unique index if not exists demo_armz_one_active_per_session
  on public.demo_armz (demo_session_id)
  where is_active = true;

create index if not exists demo_armz_session_idx
  on public.demo_armz (demo_session_id);

comment on table public.demo_armz is
  'Temporary Common demo ARMZ. Not real inventory. Not mintable. Session-scoped.';

-- ---------------------------------------------------------------------------
-- demo_battles
-- ---------------------------------------------------------------------------
create table if not exists public.demo_battles (
  id uuid primary key default gen_random_uuid(),
  demo_session_id uuid not null references public.demo_sessions (id) on delete cascade,
  demo_armz_id uuid not null references public.demo_armz (id) on delete cascade,
  opponent_key text not null,
  opponent_display_name text not null,
  difficulty text not null default 'easy',
  outcome text not null,
  player_final_strength integer not null,
  opponent_final_strength integer not null,
  duration_ms integer not null,
  critical_events integer not null default 0,
  recovery_events integer not null default 0,
  configuration_version text not null,
  timeline jsonb not null,
  player_stats_snapshot jsonb not null,
  opponent_stats_snapshot jsonb not null,
  idempotency_key text not null,
  battle_seed_hash text not null,
  demo_reward_units bigint null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint demo_battles_outcome_check check (outcome in ('victory', 'defeat')),
  constraint demo_battles_difficulty_check check (difficulty = 'easy'),
  constraint demo_battles_idempotency_unique unique (demo_session_id, idempotency_key)
);

create index if not exists demo_battles_session_created_idx
  on public.demo_battles (demo_session_id, created_at desc);

comment on table public.demo_battles is
  'Server-authoritative demo battles. Timeline JSON is playback-only; seeds stored hashed.';

-- ---------------------------------------------------------------------------
-- demo_reward_events (simulated only — never a real liability)
-- ---------------------------------------------------------------------------
create table if not exists public.demo_reward_events (
  id uuid primary key default gen_random_uuid(),
  demo_session_id uuid not null references public.demo_sessions (id) on delete cascade,
  demo_battle_id uuid not null references public.demo_battles (id) on delete cascade,
  demo_units bigint not null,
  monetary_value boolean not null default false,
  claimable boolean not null default false,
  withdrawable boolean not null default false,
  transferable boolean not null default false,
  simulated boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  constraint demo_reward_units_positive check (demo_units > 0),
  constraint demo_reward_simulated_only check (
    monetary_value = false
    and claimable = false
    and withdrawable = false
    and transferable = false
    and simulated = true
  ),
  constraint demo_reward_one_per_battle unique (demo_battle_id)
);

create index if not exists demo_reward_events_session_idx
  on public.demo_reward_events (demo_session_id, created_at desc);

comment on table public.demo_reward_events is
  'Simulated Demo $ARMZ grants. Not claimable. Not a real reward liability.';

-- ---------------------------------------------------------------------------
-- RLS: force deny for anon/authenticated clients; service role only
-- ---------------------------------------------------------------------------
alter table public.demo_sessions enable row level security;
alter table public.demo_sessions force row level security;
alter table public.demo_armz enable row level security;
alter table public.demo_armz force row level security;
alter table public.demo_battles enable row level security;
alter table public.demo_battles force row level security;
alter table public.demo_reward_events enable row level security;
alter table public.demo_reward_events force row level security;

-- No public policies — API uses service role. Explicit deny posture.
drop policy if exists demo_sessions_deny_all on public.demo_sessions;
create policy demo_sessions_deny_all on public.demo_sessions
  for all to anon, authenticated using (false) with check (false);

drop policy if exists demo_armz_deny_all on public.demo_armz;
create policy demo_armz_deny_all on public.demo_armz
  for all to anon, authenticated using (false) with check (false);

drop policy if exists demo_battles_deny_all on public.demo_battles;
create policy demo_battles_deny_all on public.demo_battles
  for all to anon, authenticated using (false) with check (false);

drop policy if exists demo_reward_events_deny_all on public.demo_reward_events;
create policy demo_reward_events_deny_all on public.demo_reward_events
  for all to anon, authenticated using (false) with check (false);
