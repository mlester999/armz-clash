import { z } from 'zod';

export const DemoConfigSchema = z.object({
  sessionTtlSeconds: z.coerce.number().int().positive().default(86_400),
  replayCooldownSeconds: z.coerce.number().int().nonnegative().default(60),
  armzResetCooldownSeconds: z.coerce.number().int().nonnegative().default(3_600),
  maxBattlesPerSession: z.coerce.number().int().positive().default(20),
  cookieName: z.string().min(1).default('armz_clash_demo_session'),
  configurationVersion: z.string().min(1).default('demo-combat-v1'),
});

export type DemoConfig = z.infer<typeof DemoConfigSchema>;

export function loadDemoConfig(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): DemoConfig {
  return DemoConfigSchema.parse({
    sessionTtlSeconds: env.ARMZ_DEMO_SESSION_TTL_SECONDS,
    replayCooldownSeconds: env.ARMZ_DEMO_REPLAY_COOLDOWN_SECONDS,
    armzResetCooldownSeconds: env.ARMZ_DEMO_ARMZ_RESET_COOLDOWN_SECONDS,
    maxBattlesPerSession: env.ARMZ_DEMO_MAX_BATTLES_PER_SESSION,
    cookieName: env.ARMZ_DEMO_SESSION_COOKIE_NAME,
    configurationVersion: env.ARMZ_DEMO_CONFIGURATION_VERSION,
  });
}
