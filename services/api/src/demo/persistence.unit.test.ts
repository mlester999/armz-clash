import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  getDemoPersistenceMode,
  isDemoStoreMemory,
  resetDemoPersistenceCacheForTests,
} from './store';

describe('demo store persistence mode', () => {
  const original = { ...process.env };

  beforeEach(() => {
    resetDemoPersistenceCacheForTests();
  });

  afterEach(() => {
    process.env = { ...original };
    resetDemoPersistenceCacheForTests();
  });

  it('uses memory-test when explicitly configured', () => {
    process.env.ARMZ_DEMO_PERSISTENCE_MODE = 'memory-test';
    process.env.ARMZ_ENVIRONMENT = 'test';
    resetDemoPersistenceCacheForTests();
    expect(getDemoPersistenceMode()).toBe('memory-test');
    expect(isDemoStoreMemory()).toBe(true);
  });

  it('uses database by default', () => {
    delete process.env.ARMZ_DEMO_PERSISTENCE_MODE;
    delete process.env.ARMZ_DEMO_FORCE_MEMORY;
    process.env.ARMZ_ENVIRONMENT = 'development';
    resetDemoPersistenceCacheForTests();
    expect(getDemoPersistenceMode()).toBe('database');
    expect(isDemoStoreMemory()).toBe(false);
  });
});
