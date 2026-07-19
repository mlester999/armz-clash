-- Hosted/local SQL validation checklist for Phase 1.
-- Run only with explicit owner approval against a development database.
-- These statements are read-oriented assertions; wrap in a transaction and roll back when probing.

-- Required tables exist
select to_regclass('public.app_config_versions') is not null as app_config_versions_exists;
select to_regclass('public.system_feature_flags') is not null as system_feature_flags_exists;
select to_regclass('public.admin_roles') is not null as admin_roles_exists;
select to_regclass('public.admin_permissions') is not null as admin_permissions_exists;
select to_regclass('public.admin_role_permissions') is not null as admin_role_permissions_exists;
select to_regclass('public.admin_role_assignments') is not null as admin_role_assignments_exists;
select to_regclass('public.admin_audit_logs') is not null as admin_audit_logs_exists;
select to_regclass('public.reconciliation_runs') is not null as reconciliation_runs_exists;

-- RLS enabled
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relname in (
  'app_config_versions',
  'system_feature_flags',
  'admin_roles',
  'admin_permissions',
  'admin_role_permissions',
  'admin_role_assignments',
  'admin_audit_logs',
  'reconciliation_runs'
);

-- Safe feature-flag defaults
select key, enabled
from public.system_feature_flags
where key in (
  'mainnet_enabled',
  'real_mint_enabled',
  'real_rewards_enabled',
  'claims_enabled',
  'marketplace_settlement_enabled'
)
order by key;

-- No default admin users
select count(*) as active_admin_assignments
from public.admin_role_assignments
where revoked_at is null;
