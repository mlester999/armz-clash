/** Worker foundation types — no real jobs scheduled in Phase 1. */

export type JobName =
  | 'reconciliation.snapshot'
  | 'reconciliation.rewards'
  | 'cleanup.expired_listings'
  | 'monitoring.oracle_health'
  | 'monitoring.treasury';

export type RetryPolicy = {
  maxAttempts: number;
  /** Backoff base in milliseconds. */
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
};

export type IdempotencyKey = string;

export type ReconciliationRunStatus =
  'pending' | 'running' | 'completed' | 'completed_with_errors' | 'failed' | 'cancelled';

export type ReconciliationRun = {
  id: string;
  domain: string;
  status: ReconciliationRunStatus;
  startedAt: string | null;
  completedAt: string | null;
  cursor: string | null;
  counters: Record<string, number>;
  errorSummary: string | null;
  correlationId: string | null;
};

export type JobRegistryEntry = {
  name: JobName;
  description: string;
  enabled: boolean;
  retry: RetryPolicy;
  /**
   * Future daily ARMZ eligibility must be derived from authoritative UTC timestamps
   * with reconciliation — not fragile full-table midnight mass updates.
   */
  scheduleNote: string;
};

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  jitter: true,
};

export const JOB_REGISTRY: readonly JobRegistryEntry[] = [
  {
    name: 'reconciliation.snapshot',
    description: 'Treasury and ledger snapshot reconciliation (future).',
    enabled: false,
    retry: DEFAULT_RETRY_POLICY,
    scheduleNote: 'UTC-derived windows; no midnight full-table rewrites.',
  },
  {
    name: 'reconciliation.rewards',
    description: 'Reward liability reconciliation (future).',
    enabled: false,
    retry: DEFAULT_RETRY_POLICY,
    scheduleNote: 'Idempotent runs with cursor-based progress.',
  },
  {
    name: 'cleanup.expired_listings',
    description: 'Expire stale marketplace listings (future).',
    enabled: false,
    retry: DEFAULT_RETRY_POLICY,
    scheduleNote: 'Bounded batches; never unbounded table scans.',
  },
  {
    name: 'monitoring.oracle_health',
    description: 'Oracle health probe (future).',
    enabled: false,
    retry: DEFAULT_RETRY_POLICY,
    scheduleNote: 'Periodic health checks only when oracle is enabled.',
  },
  {
    name: 'monitoring.treasury',
    description: 'Treasury budget monitoring (future).',
    enabled: false,
    retry: DEFAULT_RETRY_POLICY,
    scheduleNote: 'Alert when liability approaches configured limits.',
  },
] as const;
