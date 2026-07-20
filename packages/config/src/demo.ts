import { z } from 'zod';

/** Explicit Demo Mode persistence — no silent database→memory fallback. */
export const DemoPersistenceModeSchema = z.enum(['database', 'memory-test', 'memory-development']);
export type DemoPersistenceMode = z.infer<typeof DemoPersistenceModeSchema>;

export const DemoConfigSchema = z.object({
  sessionTtlSeconds: z.coerce.number().int().positive().default(86_400),
  replayCooldownSeconds: z.coerce.number().int().nonnegative().default(60),
  armzResetCooldownSeconds: z.coerce.number().int().nonnegative().default(3_600),
  maxBattlesPerSession: z.coerce.number().int().positive().default(20),
  cookieName: z.string().min(1).default('armz_clash_demo_session'),
  configurationVersion: z.string().min(1).default('demo-combat-v2'),
  persistenceMode: DemoPersistenceModeSchema.default('database'),
});

export type DemoConfig = z.infer<typeof DemoConfigSchema>;

export class DemoPersistenceConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DemoPersistenceConfigError';
  }
}

/**
 * Resolve and validate ARMZ_DEMO_PERSISTENCE_MODE.
 * Legacy ARMZ_DEMO_FORCE_MEMORY=true maps to memory-test only outside production.
 */
export function resolveDemoPersistenceMode(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): DemoPersistenceMode {
  const environment = (env.ARMZ_ENVIRONMENT ?? env.NODE_ENV ?? 'development').toLowerCase();
  const isProduction = environment === 'production';
  const raw = (env.ARMZ_DEMO_PERSISTENCE_MODE ?? '').trim();
  const forceMemory = env.ARMZ_DEMO_FORCE_MEMORY === 'true';

  let mode: DemoPersistenceMode;
  if (raw) {
    const parsed = DemoPersistenceModeSchema.safeParse(raw);
    if (!parsed.success) {
      throw new DemoPersistenceConfigError(
        `Invalid ARMZ_DEMO_PERSISTENCE_MODE="${raw}". Allowed: database | memory-test | memory-development`,
      );
    }
    mode = parsed.data;
  } else if (forceMemory) {
    mode = 'memory-test';
  } else if (environment === 'test') {
    mode = 'memory-test';
  } else {
    mode = 'database';
  }

  if (isProduction && mode !== 'database') {
    throw new DemoPersistenceConfigError(
      `Demo persistence mode "${mode}" is forbidden in production. Use database.`,
    );
  }

  if (mode === 'memory-development' && environment !== 'development') {
    throw new DemoPersistenceConfigError(
      'memory-development is only allowed when ARMZ_ENVIRONMENT=development.',
    );
  }

  if (mode === 'memory-test' && isProduction) {
    throw new DemoPersistenceConfigError('memory-test is forbidden in production.');
  }

  if (mode === 'database') {
    const hasUrl = Boolean(env.NEXT_PUBLIC_SUPABASE_URL?.trim());
    const hasKey = Boolean(env.SUPABASE_SERVICE_ROLE_KEY?.trim());
    if (!hasUrl || !hasKey) {
      // Defer hard fail to store probe when demo is disabled; flag for readiness.
      // Callers that require demo can check assertDemoDatabaseConfigured.
    }
  }

  return mode;
}

export function assertDemoDatabaseConfigured(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): void {
  if (!env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    throw new DemoPersistenceConfigError(
      'ARMZ_DEMO_PERSISTENCE_MODE=database requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }
}

export function loadDemoConfig(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): DemoConfig {
  const persistenceMode = resolveDemoPersistenceMode(env);
  return DemoConfigSchema.parse({
    sessionTtlSeconds: env.ARMZ_DEMO_SESSION_TTL_SECONDS,
    replayCooldownSeconds: env.ARMZ_DEMO_REPLAY_COOLDOWN_SECONDS,
    armzResetCooldownSeconds: env.ARMZ_DEMO_ARMZ_RESET_COOLDOWN_SECONDS,
    maxBattlesPerSession: env.ARMZ_DEMO_MAX_BATTLES_PER_SESSION,
    cookieName: env.ARMZ_DEMO_SESSION_COOKIE_NAME,
    configurationVersion: env.ARMZ_DEMO_CONFIGURATION_VERSION,
    persistenceMode,
  });
}

/** Public-safe label — never includes secrets. */
export function demoPersistencePublicLabel(mode: DemoPersistenceMode): string {
  switch (mode) {
    case 'database':
      return 'Database';
    case 'memory-test':
      return 'Test memory';
    case 'memory-development':
      return 'Development memory';
    default:
      return 'Unavailable';
  }
}
