/**
 * Client-safe package root.
 * Server-only env loading lives at `@armz-clash/config/env/server`.
 * Do not re-export server env from this entry — Next apps import the root.
 */
export * from './product';
export * from './network';
export * from './ports';
export * from './features';
export * from './public-config';
export * from './auth';
export * from './env/shared';
export { loadClientEnv, ClientEnvSchema, type ClientEnv } from './env/client';
