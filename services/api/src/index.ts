import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import {
  buildPublicConfig,
  loadAuthConfig,
  PORTS,
  PRODUCT_NAME,
  allowedAuthOrigins,
} from '@armz-clash/config';
import { loadServerEnv } from '@armz-clash/config/env/server';
import {
  buildHealthResponse,
  buildReadinessResponse,
  createCorrelationId,
  createLogger,
  extractCorrelationId,
} from '@armz-clash/observability';
import { createAuthChallenge } from './auth/challenge';
import { verifyAuthChallenge } from './auth/verify';
import { loadSessionFromToken, renewSession, revokeSession, updateProfile } from './auth/session';
import { fetchWalletBalances } from './auth/balances';
import { sha256Hex } from './lib/crypto';

// Load .env if present (local dev)
try {
  const { readFileSync, existsSync } = await import('node:fs');
  if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 0) continue;
      const k = t.slice(0, i);
      let v = t.slice(i + 1);
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (process.env[k] === undefined) process.env[k] = v;
    }
  }
} catch {
  // ignore
}

const env = loadServerEnv();
const authConfig = loadAuthConfig();
const logger = createLogger({
  service: 'api',
  environment: env.ARMZ_ENVIRONMENT,
  level: env.ARMZ_LOG_LEVEL,
});

const app = Fastify({
  logger: false,
  requestIdHeader: 'x-request-id',
  genReqId: () => createCorrelationId('api'),
  trustProxy: true,
});

await app.register(cookie);
// Player auth cookies are shared by host (not port). Never allow admin origin
// to make credentialed player-API requests.
const playerOrigins = allowedAuthOrigins(authConfig);
await app.register(cors, {
  origin: (origin, cb) => {
    // Non-browser tools may omit Origin for health checks only; auth routes require Origin.
    if (!origin) return cb(null, true);
    if (playerOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS origin denied'), false);
  },
  credentials: true,
});
await app.register(rateLimit, {
  global: true,
  max: 120,
  timeWindow: '1 minute',
});

function cookieSecure(): boolean {
  return env.ARMZ_ENVIRONMENT !== 'development' || process.env.ARMZ_FORCE_SECURE_COOKIES === 'true';
}

function setSessionCookies(
  reply: { setCookie: (name: string, value: string, opts: Record<string, unknown>) => void },
  sessionToken: string,
  csrfToken: string,
  maxAgeSeconds: number,
) {
  const base = {
    path: '/',
    sameSite: 'lax' as const,
    secure: cookieSecure(),
    maxAge: maxAgeSeconds,
    ...(authConfig.cookieDomain ? { domain: authConfig.cookieDomain } : {}),
  };
  reply.setCookie(authConfig.sessionCookieName, sessionToken, {
    ...base,
    httpOnly: true,
  });
  reply.setCookie(authConfig.csrfCookieName, csrfToken, {
    ...base,
    httpOnly: false,
  });
}

function clearSessionCookies(reply: {
  clearCookie: (name: string, opts?: Record<string, unknown>) => void;
}) {
  const opts = {
    path: '/',
    ...(authConfig.cookieDomain ? { domain: authConfig.cookieDomain } : {}),
  };
  reply.clearCookie(authConfig.sessionCookieName, opts);
  reply.clearCookie(authConfig.csrfCookieName, opts);
}

function requireCsrf(request: {
  cookies: Record<string, string | undefined>;
  headers: Record<string, unknown>;
}) {
  const cookieToken = request.cookies[authConfig.csrfCookieName];
  const headerToken = String(request.headers['x-csrf-token'] ?? '');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    const err = Object.assign(new Error('CSRF validation failed'), {
      statusCode: 403,
      code: 'csrf_failed',
    });
    throw err;
  }
}

app.addHook('onRequest', async (request, reply) => {
  const correlationId =
    extractCorrelationId(request.headers as Record<string, string | string[] | undefined>) ??
    request.id;
  reply.header('x-request-id', correlationId);
  reply.header('x-correlation-id', correlationId);
  (request as { correlationId?: string }).correlationId = correlationId;
});

app.get('/health', async (request, reply) => {
  const correlationId = (request as { correlationId?: string }).correlationId;
  return reply.send(
    buildHealthResponse({
      service: 'armz-clash-api',
      version: env.ARMZ_APP_VERSION,
      environment: env.ARMZ_ENVIRONMENT,
      correlationId,
    }),
  );
});

app.get('/ready', async (request, reply) => {
  const correlationId = (request as { correlationId?: string }).correlationId;
  const hasAuthSecrets = Boolean(env.ARMZ_SESSION_SIGNING_SECRET && env.ARMZ_WALLET_NONCE_SECRET);
  const hasSupabase = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  const body = buildReadinessResponse({
    service: 'armz-clash-api',
    correlationId,
    checks: {
      process: { ok: true },
      config: { ok: true },
      authSecrets: {
        ok: hasAuthSecrets,
        detail: hasAuthSecrets ? 'configured' : 'missing session/nonce secrets',
      },
      database: {
        ok: hasSupabase,
        detail: hasSupabase ? 'supabase configured' : 'supabase not configured',
      },
    },
  });
  return reply.status(body.status === 'ready' ? 200 : 503).send(body);
});

app.get('/version', async () => ({
  service: 'armz-clash-api',
  product: PRODUCT_NAME,
  version: env.ARMZ_APP_VERSION,
  phase: 2,
  environment: env.ARMZ_ENVIRONMENT,
}));

app.get('/api/v1/config/public', async () =>
  buildPublicConfig({
    environment: env.ARMZ_ENVIRONMENT,
    network: env.network,
    appVersion: env.ARMZ_APP_VERSION,
    docsVersion: env.NEXT_PUBLIC_ARMZ_DOCS_VERSION,
    tokenName: env.NEXT_PUBLIC_ARMZ_TOKEN_NAME,
    tokenSymbol: env.NEXT_PUBLIC_ARMZ_TOKEN_SYMBOL,
    productName: env.NEXT_PUBLIC_ARMZ_PRODUCT_NAME,
    features: env.features,
  }),
);

app.post(
  '/api/v1/auth/challenge',
  {
    config: {
      rateLimit: {
        // Allow higher burst in development for security suites; still capped.
        max:
          env.ARMZ_ENVIRONMENT === 'development'
            ? Math.max(authConfig.nonceIpLimit, 60)
            : authConfig.nonceIpLimit,
        timeWindow: '1 minute',
      },
    },
  },
  async (request, reply) => {
    try {
      const body = (request.body ?? {}) as { walletAddress?: string; uri?: string };
      const originHeader = request.headers.origin;
      if (!originHeader || typeof originHeader !== 'string') {
        return reply.status(400).send({ error: 'origin_required', message: 'Origin required' });
      }
      const result = await createAuthChallenge({
        walletAddress: body.walletAddress ?? '',
        origin: originHeader,
        uri: body.uri || originHeader,
        correlationId: (request as { correlationId?: string }).correlationId ?? request.id,
        requestMetadataHash: sha256Hex(
          `${request.ip}|${String(request.headers['user-agent'] ?? '')}`,
        ),
      });
      return reply.send(result);
    } catch (error) {
      const err = error as { statusCode?: number; code?: string; message?: string };
      logger.warn('challenge failed', { code: err.code, message: err.message });
      return reply.status(err.statusCode ?? 500).send({
        error: err.code ?? 'challenge_failed',
        message: err.message ?? 'Challenge failed',
      });
    }
  },
);

app.post(
  '/api/v1/auth/verify',
  {
    config: {
      rateLimit: {
        max:
          env.ARMZ_ENVIRONMENT === 'development'
            ? Math.max(authConfig.verifyIpLimit, 60)
            : authConfig.verifyIpLimit,
        timeWindow: '1 minute',
      },
    },
  },
  async (request, reply) => {
    try {
      const body = (request.body ?? {}) as {
        challengeId?: string;
        walletAddress?: string;
        message?: string;
        signature?: string;
        signatureEncoding?: 'base58' | 'base64';
      };
      const originHeader = request.headers.origin;
      if (!originHeader || typeof originHeader !== 'string') {
        return reply.status(400).send({ error: 'origin_required', message: 'Origin required' });
      }
      const result = await verifyAuthChallenge({
        challengeId: body.challengeId ?? '',
        walletAddress: body.walletAddress ?? '',
        message: body.message ?? '',
        signature: body.signature ?? '',
        signatureEncoding: body.signatureEncoding,
        origin: originHeader,
        correlationId: (request as { correlationId?: string }).correlationId ?? request.id,
        userAgent: String(request.headers['user-agent'] ?? ''),
        ip: request.ip,
      });

      const maxAge = Math.floor((new Date(result.session.expiresAt).getTime() - Date.now()) / 1000);
      setSessionCookies(reply, result.sessionToken, result.csrfToken, Math.max(maxAge, 60));

      return reply.send({
        authenticated: true,
        profile: result.profile,
        session: result.session,
        walletAddress: body.walletAddress,
        network: 'solana-devnet',
      });
    } catch (error) {
      const err = error as { statusCode?: number; code?: string; message?: string };
      logger.warn('verify failed', { code: err.code });
      return reply.status(err.statusCode ?? 500).send({
        error: err.code ?? 'verify_failed',
        message: err.message ?? 'Verification failed',
      });
    }
  },
);

app.get('/api/v1/auth/session', async (request, reply) => {
  const token = request.cookies[authConfig.sessionCookieName];
  const session = await loadSessionFromToken(token);
  if (!session) {
    return reply.send({ authenticated: false });
  }
  return reply.send({
    authenticated: true,
    profile: session.profile,
    walletAddress: session.walletAddress,
    session: {
      expiresAt: session.expiresAt,
      absoluteExpiresAt: session.absoluteExpiresAt,
    },
    network: 'solana-devnet',
    csrf: Boolean(request.cookies[authConfig.csrfCookieName]),
  });
});

app.post('/api/v1/auth/renew', async (request, reply) => {
  try {
    requireCsrf(request);
    const token = request.cookies[authConfig.sessionCookieName];
    const renewed = await renewSession(token);
    if (!renewed) {
      clearSessionCookies(reply);
      return reply.status(401).send({ error: 'session_expired', authenticated: false });
    }
    if (renewed.rotated) {
      const maxAge = Math.floor((new Date(renewed.expiresAt).getTime() - Date.now()) / 1000);
      setSessionCookies(reply, renewed.sessionToken, renewed.csrfToken, Math.max(maxAge, 60));
    }
    return reply.send({
      authenticated: true,
      rotated: renewed.rotated,
      profile: renewed.profile,
      walletAddress: renewed.walletAddress,
      session: {
        expiresAt: renewed.expiresAt,
        absoluteExpiresAt: renewed.absoluteExpiresAt,
      },
    });
  } catch (error) {
    const err = error as { statusCode?: number; code?: string; message?: string };
    return reply.status(err.statusCode ?? 500).send({
      error: err.code ?? 'renew_failed',
      message: err.message ?? 'Renew failed',
    });
  }
});

app.post('/api/v1/auth/logout', async (request, reply) => {
  try {
    // Logout is idempotent; CSRF preferred but allow cookie clear on expired sessions.
    const token = request.cookies[authConfig.sessionCookieName];
    await revokeSession(token);
    clearSessionCookies(reply);
    return reply.send({ authenticated: false, loggedOut: true });
  } catch {
    clearSessionCookies(reply);
    return reply.send({ authenticated: false, loggedOut: true });
  }
});

app.get('/api/v1/me', async (request, reply) => {
  const token = request.cookies[authConfig.sessionCookieName];
  const session = await loadSessionFromToken(token);
  if (!session) {
    return reply.status(401).send({ error: 'unauthenticated' });
  }
  return reply.send({
    profile: session.profile,
    walletAddress: session.walletAddress,
    network: 'solana-devnet',
  });
});

app.patch('/api/v1/me/profile', async (request, reply) => {
  try {
    requireCsrf(request);
    const token = request.cookies[authConfig.sessionCookieName];
    const session = await loadSessionFromToken(token);
    if (!session) {
      return reply.status(401).send({ error: 'unauthenticated' });
    }
    const body = (request.body ?? {}) as { displayName?: string; avatarPreset?: string };
    const profile = await updateProfile(session.playerId, body);
    return reply.send({ profile });
  } catch (error) {
    const err = error as { statusCode?: number; code?: string; message?: string };
    return reply.status(err.statusCode ?? 500).send({
      error: err.code ?? 'profile_update_failed',
      message: err.message ?? 'Update failed',
    });
  }
});

app.get('/api/v1/wallet/balances', async (request, reply) => {
  const token = request.cookies[authConfig.sessionCookieName];
  const session = await loadSessionFromToken(token);
  if (!session) {
    return reply.status(401).send({ error: 'unauthenticated' });
  }
  const balances = await fetchWalletBalances(session.walletAddress);
  return reply.send({
    walletAddress: session.walletAddress,
    ...balances,
  });
});

const port = env.ARMZ_API_PORT || PORTS.api;

async function main() {
  try {
    await app.listen({ port, host: '0.0.0.0' });
    logger.info('API listening', { port, product: PRODUCT_NAME, phase: 2 });
  } catch (error) {
    logger.error('API failed to start', {}, error);
    process.exit(1);
  }
}

const shutdown = async (signal: string) => {
  logger.info('API shutting down', { signal });
  await app.close();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

void main();
