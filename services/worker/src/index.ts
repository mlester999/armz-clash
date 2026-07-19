import Fastify from 'fastify';
import { PORTS, PRODUCT_NAME } from '@armz-clash/config';
import { loadServerEnv } from '@armz-clash/config/env/server';
import {
  buildHealthResponse,
  buildReadinessResponse,
  createCorrelationId,
  createLogger,
} from '@armz-clash/observability';
import { JOB_REGISTRY } from './types';

const env = loadServerEnv();
const logger = createLogger({
  service: 'worker',
  environment: env.ARMZ_ENVIRONMENT,
  level: env.ARMZ_LOG_LEVEL,
});

const healthApp = Fastify({ logger: false, genReqId: () => createCorrelationId('worker') });

healthApp.get('/health', async (request, reply) => {
  return reply.send(
    buildHealthResponse({
      service: 'armz-clash-worker',
      version: env.ARMZ_APP_VERSION,
      environment: env.ARMZ_ENVIRONMENT,
      correlationId: request.id,
    }),
  );
});

healthApp.get('/ready', async (request, reply) => {
  const body = buildReadinessResponse({
    service: 'armz-clash-worker',
    correlationId: request.id,
    checks: {
      process: { ok: true },
      scheduler: { ok: true, detail: 'no-op foundation; no jobs scheduled' },
      registry: {
        ok: JOB_REGISTRY.length > 0,
        detail: `${JOB_REGISTRY.length} job types registered`,
      },
    },
  });
  return reply.status(body.status === 'ready' ? 200 : 503).send(body);
});

const port = env.ARMZ_WORKER_HEALTH_PORT || PORTS.workerHealth;
let shuttingDown = false;

/**
 * Safe no-op scheduler foundation.
 * Phase 1 does not process real jobs or schedule midnight mass updates.
 */
function startNoopScheduler(): NodeJS.Timeout {
  return setInterval(() => {
    if (shuttingDown) return;
    logger.debug('worker heartbeat', {
      jobsRegistered: JOB_REGISTRY.length,
      jobsEnabled: JOB_REGISTRY.filter((j) => j.enabled).length,
    });
  }, 60_000);
}

async function main() {
  logger.info('Worker starting', {
    product: PRODUCT_NAME,
    jobs: JOB_REGISTRY.map((j) => j.name),
  });

  const timer = startNoopScheduler();
  await healthApp.listen({ port, host: '0.0.0.0' });
  logger.info('Worker health server listening', { port });

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('Worker shutting down', { signal });
    clearInterval(timer);
    await healthApp.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void main().catch((error) => {
  logger.error('Worker failed to start', {}, error);
  process.exit(1);
});
