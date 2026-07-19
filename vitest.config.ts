import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: [
      'packages/**/src/**/*.{test,spec}.ts',
      'services/**/src/**/*.{test,spec}.ts',
      'scripts/**/*.{test,spec}.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', 'tests/e2e/**'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['packages/**/src/**/*.ts', 'services/**/src/**/*.ts'],
      exclude: ['**/*.{test,spec}.ts', '**/dist/**'],
    },
  },
  resolve: {
    alias: {
      '@armz-clash/config': path.resolve(__dirname, 'packages/config/src/index.ts'),
      '@armz-clash/game-core': path.resolve(__dirname, 'packages/game-core/src/index.ts'),
      '@armz-clash/economy-core': path.resolve(__dirname, 'packages/economy-core/src/index.ts'),
      '@armz-clash/blockchain/auth/message': path.resolve(
        __dirname,
        'packages/blockchain/src/auth/message.ts',
      ),
      '@armz-clash/blockchain/auth/verify': path.resolve(
        __dirname,
        'packages/blockchain/src/auth/verify.ts',
      ),
      '@armz-clash/blockchain/auth/wallet-state': path.resolve(
        __dirname,
        'packages/blockchain/src/auth/wallet-state.ts',
      ),
      '@armz-clash/blockchain': path.resolve(__dirname, 'packages/blockchain/src/index.ts'),
      '@armz-clash/config/env/server': path.resolve(__dirname, 'packages/config/src/env/server.ts'),
      '@armz-clash/observability': path.resolve(__dirname, 'packages/observability/src/index.ts'),
      '@armz-clash/database': path.resolve(__dirname, 'packages/database/src/index.ts'),
      '@armz-clash/ui': path.resolve(__dirname, 'packages/ui/src/index.ts'),
    },
  },
});
