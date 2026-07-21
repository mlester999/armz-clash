import { z } from 'zod';

/** Explicit Demo Mode persistence - no silent database-to-memory fallback. */
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

/** Public-safe label - never includes secrets. */
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
