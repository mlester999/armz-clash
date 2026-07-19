import { z } from 'zod';

export const AUTH_NETWORK = 'solana-devnet' as const;
export const AUTH_CHAIN = 'solana:devnet' as const;
export const AUTH_MESSAGE_VERSION = '1' as const;

export const AuthConfigSchema = z.object({
  nonceTtlSeconds: z.coerce.number().int().positive().default(300),
  sessionTtlSeconds: z.coerce.number().int().positive().default(1800),
  sessionAbsoluteTtlSeconds: z.coerce.number().int().positive().default(86400),
  sessionRenewalWindowSeconds: z.coerce.number().int().positive().default(600),
  sessionCookieName: z.string().min(1).default('armz_clash_session'),
  csrfCookieName: z.string().min(1).default('armz_clash_csrf'),
  cookieDomain: z.string().optional().default(''),
  webOrigin: z.string().url().default('http://localhost:3000'),
  gameOrigin: z.string().url().default('http://localhost:3001'),
  adminOrigin: z.string().url().default('http://localhost:3002'),
  apiOrigin: z.string().url().default('http://localhost:4000'),
  nonceIpLimit: z.coerce.number().int().positive().default(10),
  nonceWalletLimit: z.coerce.number().int().positive().default(5),
  verifyIpLimit: z.coerce.number().int().positive().default(15),
  verifyWalletLimit: z.coerce.number().int().positive().default(8),
  maxFailedAttempts: z.coerce.number().int().positive().default(5),
  clockSkewSeconds: z.coerce.number().int().nonnegative().default(60),
});

export type AuthConfig = z.infer<typeof AuthConfigSchema>;

export function loadAuthConfig(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): AuthConfig {
  return AuthConfigSchema.parse({
    nonceTtlSeconds: env.ARMZ_NONCE_TTL_SECONDS,
    sessionTtlSeconds: env.ARMZ_SESSION_TTL_SECONDS,
    sessionAbsoluteTtlSeconds: env.ARMZ_SESSION_ABSOLUTE_TTL_SECONDS,
    sessionRenewalWindowSeconds: env.ARMZ_SESSION_RENEWAL_WINDOW_SECONDS,
    sessionCookieName: env.ARMZ_SESSION_COOKIE_NAME,
    csrfCookieName: env.ARMZ_CSRF_COOKIE_NAME,
    cookieDomain: env.ARMZ_COOKIE_DOMAIN,
    webOrigin: env.ARMZ_WEB_ORIGIN ?? env.NEXT_PUBLIC_ARMZ_WEB_URL,
    gameOrigin: env.ARMZ_GAME_ORIGIN ?? env.NEXT_PUBLIC_ARMZ_GAME_URL,
    adminOrigin: env.ARMZ_ADMIN_ORIGIN,
    apiOrigin: env.ARMZ_API_ORIGIN ?? env.NEXT_PUBLIC_ARMZ_API_URL,
    nonceIpLimit: env.ARMZ_AUTH_NONCE_IP_LIMIT,
    nonceWalletLimit: env.ARMZ_AUTH_NONCE_WALLET_LIMIT,
    verifyIpLimit: env.ARMZ_AUTH_VERIFY_IP_LIMIT,
    verifyWalletLimit: env.ARMZ_AUTH_VERIFY_WALLET_LIMIT,
  });
}

export function allowedAuthOrigins(config: AuthConfig): string[] {
  return [config.webOrigin, config.gameOrigin].filter(Boolean);
}
