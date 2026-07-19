import Fastify from 'fastify';
import { buildPublicConfig, PORTS, PRODUCT_NAME } from '@armz-clash/config';
import { loadServerEnv } from '@armz-clash/config/env/server';
import {
  buildHealthResponse,
  buildReadinessResponse,
  createCorrelationId,
  createLogger,
  extractCorrelationId,
} from '@armz-clash/observability';

const env = loadServerEnv();
const logger = createLogger({
  service: 'api',
  environment: env.ARMZ_ENVIRONMENT,
  level: env.ARMZ_LOG_LEVEL,
});

const app = Fastify({
  logger: false,
  requestIdHeader: 'x-request-id',
  genReqId: () => createCorrelationId('api'),
});

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
  const body = buildReadinessResponse({
    service: 'armz-clash-api',
    correlationId,
    checks: {
      process: { ok: true, detail: 'process up' },
      config: { ok: true, detail: 'server env validated' },
      // Hosted DB is optional in Phase 1 foundation.
      database: {
        ok: true,
        detail: env.SUPABASE_DATABASE_URL
          ? 'database url configured (not probed in Phase 1 ready)'
          : 'database url not configured (optional in Phase 1)',
      },
    },
  });
  return reply.status(body.status === 'ready' ? 200 : 503).send(body);
});

app.get('/version', async () => ({
  service: 'armz-clash-api',
  product: PRODUCT_NAME,
  version: env.ARMZ_APP_VERSION,
  phase: 1,
  environment: env.ARMZ_ENVIRONMENT,
}));

app.get('/api/v1/config/public', async () => {
  return buildPublicConfig({
    environment: env.ARMZ_ENVIRONMENT,
    network: env.network,
    appVersion: env.ARMZ_APP_VERSION,
    docsVersion: env.NEXT_PUBLIC_ARMZ_DOCS_VERSION,
    tokenName: env.NEXT_PUBLIC_ARMZ_TOKEN_NAME,
    tokenSymbol: env.NEXT_PUBLIC_ARMZ_TOKEN_SYMBOL,
    productName: env.NEXT_PUBLIC_ARMZ_PRODUCT_NAME,
    features: env.features,
  });
});

const port = env.ARMZ_API_PORT || PORTS.api;

async function main() {
  try {
    await app.listen({ port, host: '0.0.0.0' });
    logger.info('API listening', { port, product: PRODUCT_NAME });
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
