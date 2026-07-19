export type HealthStatus = 'ok' | 'degraded' | 'error';
export type ReadinessStatus = 'ready' | 'not_ready';

export type HealthResponse = {
  status: HealthStatus;
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  correlationId?: string;
};

export type ReadinessResponse = {
  status: ReadinessStatus;
  service: string;
  checks: Record<string, { ok: boolean; detail?: string }>;
  timestamp: string;
  correlationId?: string;
};

export function buildHealthResponse(input: {
  service: string;
  version: string;
  environment: string;
  status?: HealthStatus;
  correlationId?: string;
}): HealthResponse {
  return {
    status: input.status ?? 'ok',
    service: input.service,
    version: input.version,
    environment: input.environment,
    timestamp: new Date().toISOString(),
    correlationId: input.correlationId,
  };
}

export function buildReadinessResponse(input: {
  service: string;
  checks: Record<string, { ok: boolean; detail?: string }>;
  correlationId?: string;
}): ReadinessResponse {
  const allOk = Object.values(input.checks).every((check) => check.ok);
  return {
    status: allOk ? 'ready' : 'not_ready',
    service: input.service,
    checks: input.checks,
    timestamp: new Date().toISOString(),
    correlationId: input.correlationId,
  };
}
