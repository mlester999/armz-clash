-- Phase 1 seed: feature flags are already inserted by migration.
-- No default admin users. No fake player data. No real-value balances.

-- Optional draft system config document for local inspection.
insert into public.app_config_versions (domain, version, status, config)
values (
  'system',
  'phase1-foundation',
  'draft',
  jsonb_build_object(
    'phase', 1,
    'product', 'Armz Clash',
    'network_default', 'devnet',
    'real_value_disabled', true,
    'notes', 'Foundation draft only. Not a published production config.'
  )
)
on conflict (domain, version) do nothing;
