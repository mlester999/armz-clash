-- Armz Clash Phase 1 foundation schema
-- Safe defaults only. No real-value systems enabled.
-- RLS closed by default for sensitive tables.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- app_config_versions
-- ---------------------------------------------------------------------------
create table if not exists public.app_config_versions (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  version text not null,
  status text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid null,
  published_at timestamptz null,
  published_by uuid null,
  supersedes_id uuid null references public.app_config_versions (id),
  constraint app_config_versions_domain_check
    check (domain in ('economy', 'rarity', 'features', 'marketplace', 'battle', 'system')),
  constraint app_config_versions_status_check
    check (status in ('draft', 'published', 'archived')),
  constraint app_config_versions_version_check
    check (char_length(version) between 1 and 64),
  constraint app_config_versions_domain_version_unique unique (domain, version)
);

comment on table public.app_config_versions is
  'Versioned configuration documents. Sensitive; no public client writes.';

create unique index if not exists app_config_versions_one_published_per_domain
  on public.app_config_versions (domain)
  where status = 'published';

create index if not exists app_config_versions_domain_status_idx
  on public.app_config_versions (domain, status);

-- ---------------------------------------------------------------------------
-- system_feature_flags
-- ---------------------------------------------------------------------------
create table if not exists public.system_feature_flags (
  key text primary key,
  enabled boolean not null default false,
  environment text not null default 'development',
  description text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid null,
  constraint system_feature_flags_key_check
    check (key ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint system_feature_flags_environment_check
    check (environment in ('development', 'staging', 'production', 'all'))
);

comment on table public.system_feature_flags is
  'Feature flags. Real-value flags must default false.';

-- Seed safe defaults (insert only if missing)
insert into public.system_feature_flags (key, enabled, environment, description)
values
  ('demo_mode_enabled', true, 'all', 'Demo Mode availability (non-real-value).'),
  ('real_mint_enabled', false, 'all', 'Real ARMZ minting. Disabled by default.'),
  ('real_rewards_enabled', false, 'all', 'Real reward allocation. Disabled by default.'),
  ('claims_enabled', false, 'all', 'Reward claims. Disabled by default.'),
  ('marketplace_enabled', false, 'all', 'Marketplace browsing/listing. Disabled by default.'),
  ('marketplace_settlement_enabled', false, 'all', 'Marketplace settlement. Disabled by default.'),
  ('oracle_enabled', false, 'all', 'Price oracle. Disabled by default.'),
  ('mainnet_enabled', false, 'all', 'Mainnet network. Disabled by default.'),
  ('admin_economy_writes_enabled', false, 'all', 'Admin economy mutations. Disabled by default.')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- admin_roles / admin_permissions
-- ---------------------------------------------------------------------------
create table if not exists public.admin_roles (
  key text primary key,
  display_name text not null,
  description text null,
  is_system boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  constraint admin_roles_key_check check (key ~ '^[a-z][a-z0-9_]{1,63}$')
);

create table if not exists public.admin_permissions (
  key text primary key,
  description text null,
  is_dangerous boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint admin_permissions_key_check check (key ~ '^[a-z][a-z0-9_.]{1,63}$')
);

create table if not exists public.admin_role_permissions (
  role_key text not null references public.admin_roles (key) on delete cascade,
  permission_key text not null references public.admin_permissions (key) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (role_key, permission_key)
);

create table if not exists public.admin_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role_key text not null references public.admin_roles (key) on delete restrict,
  assigned_at timestamptz not null default timezone('utc', now()),
  assigned_by uuid null,
  revoked_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  constraint admin_role_assignments_active_unique unique (user_id, role_key)
);

comment on table public.admin_role_assignments is
  'Admin role assignments. No default production admins are seeded.';

insert into public.admin_roles (key, display_name, description) values
  ('super_admin', 'Super Admin', 'Full administrative access.'),
  ('game_administrator', 'Game Administrator', 'Game operations and content.'),
  ('economy_manager', 'Economy Manager', 'Economy configuration and budgets.'),
  ('live_operations_manager', 'Live Operations Manager', 'Live ops controls.'),
  ('blockchain_operator', 'Blockchain Operator', 'Chain operations monitoring.'),
  ('marketplace_manager', 'Marketplace Manager', 'Marketplace operations.'),
  ('customer_support', 'Customer Support', 'Support read and limited actions.'),
  ('fraud_risk_analyst', 'Fraud & Risk Analyst', 'Fraud and risk analysis.'),
  ('read_only_analyst', 'Read-only Analyst', 'Read-only analytics access.')
on conflict (key) do nothing;

insert into public.admin_permissions (key, description, is_dangerous) values
  ('dashboard.read', 'Read admin dashboard', false),
  ('players.read', 'Read player records', false),
  ('armz.read', 'Read ARMZ records', false),
  ('battles.read', 'Read battle records', false),
  ('economy.read', 'Read economy configuration', false),
  ('economy.write', 'Mutate economy configuration', true),
  ('claims.read', 'Read claims', false),
  ('claims.manage', 'Manage claims', true),
  ('marketplace.read', 'Read marketplace', false),
  ('marketplace.manage', 'Manage marketplace', true),
  ('oracle.read', 'Read oracle status', false),
  ('oracle.manage', 'Manage oracle configuration', true),
  ('treasury.read', 'Read treasury status', false),
  ('fraud.read', 'Read fraud signals', false),
  ('fraud.manage', 'Manage fraud actions', true),
  ('audit.read', 'Read audit logs', false),
  ('configuration.read', 'Read system configuration', false),
  ('configuration.write', 'Write system configuration', true)
on conflict (key) do nothing;

-- Read-only analyst: read permissions only
insert into public.admin_role_permissions (role_key, permission_key)
select 'read_only_analyst', key
from public.admin_permissions
where key like '%.read' or key = 'dashboard.read'
on conflict do nothing;

-- Super admin: all permissions (still requires assignment to a user)
insert into public.admin_role_permissions (role_key, permission_key)
select 'super_admin', key from public.admin_permissions
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- admin_audit_logs (append-only intent)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null,
  actor_role text null,
  action text not null,
  target_type text null,
  target_id text null,
  previous_value jsonb null,
  new_value jsonb null,
  reason text null,
  correlation_id text null,
  request_metadata jsonb not null default '{}'::jsonb,
  succeeded boolean not null default true,
  error_code text null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint admin_audit_logs_action_check check (char_length(action) between 1 and 128)
);

comment on table public.admin_audit_logs is
  'Append-only admin audit log. Ordinary roles must not update or delete.';

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_actor_idx
  on public.admin_audit_logs (actor_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- reconciliation_runs
-- ---------------------------------------------------------------------------
create table if not exists public.reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  status text not null default 'pending',
  started_at timestamptz null,
  completed_at timestamptz null,
  cursor text null,
  counters jsonb not null default '{}'::jsonb,
  error_summary text null,
  correlation_id text null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint reconciliation_runs_status_check
    check (status in (
      'pending',
      'running',
      'completed',
      'completed_with_errors',
      'failed',
      'cancelled'
    )),
  constraint reconciliation_runs_domain_check
    check (char_length(domain) between 1 and 64)
);

create index if not exists reconciliation_runs_domain_status_idx
  on public.reconciliation_runs (domain, status, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.app_config_versions enable row level security;
alter table public.app_config_versions force row level security;

alter table public.system_feature_flags enable row level security;
alter table public.system_feature_flags force row level security;

alter table public.admin_roles enable row level security;
alter table public.admin_roles force row level security;

alter table public.admin_permissions enable row level security;
alter table public.admin_permissions force row level security;

alter table public.admin_role_permissions enable row level security;
alter table public.admin_role_permissions force row level security;

alter table public.admin_role_assignments enable row level security;
alter table public.admin_role_assignments force row level security;

alter table public.admin_audit_logs enable row level security;
alter table public.admin_audit_logs force row level security;

alter table public.reconciliation_runs enable row level security;
alter table public.reconciliation_runs force row level security;

-- Public may read intentionally public feature flags (safe keys only).
-- Mutations remain closed for anon/authenticated clients.
drop policy if exists system_feature_flags_public_read on public.system_feature_flags;
create policy system_feature_flags_public_read
  on public.system_feature_flags
  for select
  to anon, authenticated
  using (
    key in (
      'demo_mode_enabled',
      'real_mint_enabled',
      'real_rewards_enabled',
      'claims_enabled',
      'marketplace_enabled',
      'marketplace_settlement_enabled',
      'oracle_enabled',
      'mainnet_enabled'
    )
  );

-- No insert/update/delete policies for anon/authenticated on sensitive tables.
-- Service role bypasses RLS by design and must remain server-only.

-- Explicit revoke of dangerous grants from PUBLIC/anon where applicable
revoke all on table public.app_config_versions from public;
revoke all on table public.admin_roles from public;
revoke all on table public.admin_permissions from public;
revoke all on table public.admin_role_permissions from public;
revoke all on table public.admin_role_assignments from public;
revoke all on table public.admin_audit_logs from public;
revoke all on table public.reconciliation_runs from public;

grant select on table public.system_feature_flags to anon, authenticated;
revoke insert, update, delete on table public.system_feature_flags from anon, authenticated;

-- Authenticated users still cannot mutate config/audit/admin tables (no policies = deny under FORCE RLS).
