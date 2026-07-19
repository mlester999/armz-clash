-- Armz Clash Phase 2: wallet authentication, sessions, player profiles
-- Real-value systems remain disabled. No staking.

-- ---------------------------------------------------------------------------
-- players
-- ---------------------------------------------------------------------------
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  avatar_preset text not null default 'default',
  primary_wallet_address text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz null,
  constraint players_display_name_len check (char_length(display_name) between 1 and 32),
  constraint players_avatar_preset_len check (char_length(avatar_preset) between 1 and 64)
);

create index if not exists players_primary_wallet_idx
  on public.players (primary_wallet_address);

comment on table public.players is
  'Player profiles linked to verified Solana wallets. No self-service role elevation.';

-- ---------------------------------------------------------------------------
-- wallet_accounts
-- ---------------------------------------------------------------------------
create table if not exists public.wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  wallet_address text not null,
  network text not null default 'solana-devnet',
  is_primary boolean not null default true,
  first_seen_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  constraint wallet_accounts_address_check
    check (char_length(wallet_address) between 32 and 44),
  constraint wallet_accounts_network_check
    check (network = 'solana-devnet'),
  constraint wallet_accounts_address_unique unique (wallet_address)
);

create index if not exists wallet_accounts_player_idx
  on public.wallet_accounts (player_id);

comment on table public.wallet_accounts is
  'Verified wallet addresses bound to players after signature authentication.';

-- ---------------------------------------------------------------------------
-- auth_challenges
-- ---------------------------------------------------------------------------
create table if not exists public.auth_challenges (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  nonce_hash text not null,
  message_hash text not null,
  domain text not null,
  uri text not null,
  network text not null default 'solana-devnet',
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  failed_attempts integer not null default 0,
  max_failed_attempts integer not null default 5,
  request_metadata_hash text null,
  correlation_id text null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint auth_challenges_network_check check (network = 'solana-devnet'),
  constraint auth_challenges_attempts_check check (failed_attempts >= 0)
);

create index if not exists auth_challenges_wallet_idx
  on public.auth_challenges (wallet_address, created_at desc);

create index if not exists auth_challenges_expires_idx
  on public.auth_challenges (expires_at)
  where consumed_at is null;

comment on table public.auth_challenges is
  'One-time wallet sign-in challenges. Store hashes only; consume atomically.';

-- ---------------------------------------------------------------------------
-- player_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.player_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  wallet_address text not null,
  token_hash text not null,
  csrf_hash text not null,
  issued_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  absolute_expires_at timestamptz not null,
  revoked_at timestamptz null,
  last_seen_at timestamptz not null default timezone('utc', now()),
  rotated_from_session_id uuid null references public.player_sessions (id),
  user_agent_hash text null,
  ip_hash text null,
  correlation_id text null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint player_sessions_token_hash_unique unique (token_hash)
);

create index if not exists player_sessions_player_idx
  on public.player_sessions (player_id, expires_at desc);

create index if not exists player_sessions_active_idx
  on public.player_sessions (token_hash)
  where revoked_at is null;

comment on table public.player_sessions is
  'Opaque HttpOnly sessions. Only token hashes are stored.';

-- ---------------------------------------------------------------------------
-- auth_audit_events
-- ---------------------------------------------------------------------------
create table if not exists public.auth_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  wallet_address text null,
  player_id uuid null references public.players (id) on delete set null,
  session_id uuid null,
  challenge_id uuid null,
  success boolean not null default false,
  error_code text null,
  correlation_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint auth_audit_events_type_check check (char_length(event_type) between 1 and 64)
);

create index if not exists auth_audit_events_created_idx
  on public.auth_audit_events (created_at desc);

create index if not exists auth_audit_events_wallet_idx
  on public.auth_audit_events (wallet_address, created_at desc);

comment on table public.auth_audit_events is
  'Append-oriented auth audit trail. No public client access.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.players enable row level security;
alter table public.players force row level security;
alter table public.wallet_accounts enable row level security;
alter table public.wallet_accounts force row level security;
alter table public.auth_challenges enable row level security;
alter table public.auth_challenges force row level security;
alter table public.player_sessions enable row level security;
alter table public.player_sessions force row level security;
alter table public.auth_audit_events enable row level security;
alter table public.auth_audit_events force row level security;

-- Closed by default: no anon/authenticated policies for mutations.
-- Service role (API) bypasses RLS for verified server operations.
revoke all on table public.players from public;
revoke all on table public.wallet_accounts from public;
revoke all on table public.auth_challenges from public;
revoke all on table public.player_sessions from public;
revoke all on table public.auth_audit_events from public;

-- Optional: allow nothing for anon/authenticated on these tables.
-- Explicitly no grants for insert/update/delete/select to anon/authenticated.
