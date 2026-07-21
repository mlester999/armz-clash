/**
 * Client-safe package root.
 * Server-only env loading lives at `@armz-clash/config/env/server`.
 * Server-only demo persistence lives at `@armz-clash/config/demo-server`.
 * Do not re-export server env from this entry - Next apps import the root.
 */
export * from './product';
export * from './network';
export * from './ports';
export * from './features';
export * from './public-config';
export * from './auth';
export * from './demo';
export * from './env/shared';
export {
  loadClientEnv,
  ClientEnvSchema,
  readBundledPublicEnvironment,
  isReownProjectIdConfigured,
  type ClientEnv,
  type PublicEnvironment,
} from './env/client';
