import { z } from 'zod';
import { SolanaNetworkSchema, DEFAULT_SOLANA_NETWORK } from '../network';

export const ArmzEnvironmentSchema = z.enum(['development', 'staging', 'production']);
export type ArmzEnvironment = z.infer<typeof ArmzEnvironmentSchema>;

export const LogLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);
export type LogLevel = z.infer<typeof LogLevelSchema>;

export const SharedEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ARMZ_ENVIRONMENT: ArmzEnvironmentSchema.default('development'),
  ARMZ_APP_VERSION: z.string().min(1).default('0.1.0'),
  ARMZ_LOG_LEVEL: LogLevelSchema.default('info'),
  NEXT_PUBLIC_ARMZ_PRODUCT_NAME: z.string().min(1).default('Armz Clash'),
  NEXT_PUBLIC_ARMZ_TOKEN_NAME: z.string().min(1).default('Armz'),
  NEXT_PUBLIC_ARMZ_TOKEN_SYMBOL: z.string().min(1).default('ARMZ'),
  NEXT_PUBLIC_ARMZ_NETWORK: SolanaNetworkSchema.default(DEFAULT_SOLANA_NETWORK),
  NEXT_PUBLIC_ARMZ_DOCS_VERSION: z.string().min(1).default('0.1.0-phase1'),
});

export type SharedEnv = z.infer<typeof SharedEnvSchema>;
