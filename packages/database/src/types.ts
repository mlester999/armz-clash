/** Phase 1 foundation domain types (hand-written until generated types exist). */

export type AppConfigDomain =
  'economy' | 'rarity' | 'features' | 'marketplace' | 'battle' | 'system';

export type AppConfigStatus = 'draft' | 'published' | 'archived';

export type AppConfigVersion = {
  id: string;
  domain: AppConfigDomain;
  version: string;
  status: AppConfigStatus;
  config: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
  published_at: string | null;
  published_by: string | null;
  supersedes_id: string | null;
};

export type SystemFeatureFlag = {
  key: string;
  enabled: boolean;
  environment: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export type AdminRoleKey =
  | 'super_admin'
  | 'game_administrator'
  | 'economy_manager'
  | 'live_operations_manager'
  | 'blockchain_operator'
  | 'marketplace_manager'
  | 'customer_support'
  | 'fraud_risk_analyst'
  | 'read_only_analyst';

export type AdminPermissionKey =
  | 'dashboard.read'
  | 'players.read'
  | 'armz.read'
  | 'battles.read'
  | 'economy.read'
  | 'economy.write'
  | 'claims.read'
  | 'claims.manage'
  | 'marketplace.read'
  | 'marketplace.manage'
  | 'oracle.read'
  | 'oracle.manage'
  | 'treasury.read'
  | 'fraud.read'
  | 'fraud.manage'
  | 'audit.read'
  | 'configuration.read'
  | 'configuration.write';

export type ReconciliationStatus =
  'pending' | 'running' | 'completed' | 'completed_with_errors' | 'failed' | 'cancelled';

export type DatabaseErrorCode =
  'not_found' | 'conflict' | 'permission_denied' | 'validation_failed' | 'unavailable' | 'unknown';

export type DatabaseError = {
  code: DatabaseErrorCode;
  message: string;
  cause?: unknown;
};
