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
import { cleanupExpiredDemoSessions } from './jobs/demo-cleanup';

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
      scheduler: { ok: true, detail: 'demo cleanup + heartbeat' },
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
 * Phase 3: periodic demo session cleanup + heartbeat.
 * Still no midnight mass updates for real inventory.
 */
function startScheduler(): NodeJS.Timeout {
  return setInterval(() => {
    if (shuttingDown) return;
    logger.debug('worker heartbeat', {
      jobsRegistered: JOB_REGISTRY.length,
      jobsEnabled: JOB_REGISTRY.filter((j) => j.enabled).length,
    });
    if (JOB_REGISTRY.some((j) => j.name === 'cleanup.expired_demo_sessions' && j.enabled)) {
      void cleanupExpiredDemoSessions()
        .then((result) => {
          if (result.deleted > 0) {
            logger.info('demo session cleanup', result);
          }
        })
        .catch((error) => {
          logger.error('demo session cleanup failed', {}, error);
        });
    }
  }, 60_000);
}

async function main() {
  logger.info('Worker starting', {
    product: PRODUCT_NAME,
    jobs: JOB_REGISTRY.map((j) => j.name),
  });

  const timer = startScheduler();
  await healthApp.listen({ port, host: '0.0.0.0' });
  logger.info('Worker health server listening', { port });

  // Run once on boot
  try {
    const result = await cleanupExpiredDemoSessions();
    logger.info('demo session cleanup (boot)', result);
  } catch (error) {
    logger.error('demo session cleanup boot failed', {}, error);
  }

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
