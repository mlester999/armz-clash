import { describe, expect, it } from 'vitest';
import {
  DemoPersistenceConfigError,
  demoPersistencePublicLabel,
  loadDemoConfig,
  resolveDemoPersistenceMode,
} from './demo';

describe('demo persistence mode', () => {
  it('defaults to database', () => {
    expect(resolveDemoPersistenceMode({})).toBe('database');
  });

  it('accepts explicit modes', () => {
    expect(resolveDemoPersistenceMode({ ARMZ_DEMO_PERSISTENCE_MODE: 'memory-test' })).toBe(
      'memory-test',
    );
    expect(
      resolveDemoPersistenceMode({
        ARMZ_DEMO_PERSISTENCE_MODE: 'memory-development',
        ARMZ_ENVIRONMENT: 'development',
      }),
    ).toBe('memory-development');
  });

  it('maps legacy FORCE_MEMORY to memory-test outside production', () => {
    expect(
      resolveDemoPersistenceMode({
        ARMZ_DEMO_FORCE_MEMORY: 'true',
        ARMZ_ENVIRONMENT: 'development',
      }),
    ).toBe('memory-test');
  });

  it('rejects production + memory modes', () => {
    expect(() =>
      resolveDemoPersistenceMode({
        ARMZ_ENVIRONMENT: 'production',
        ARMZ_DEMO_PERSISTENCE_MODE: 'memory-test',
      }),
    ).toThrow(DemoPersistenceConfigError);
    expect(() =>
      resolveDemoPersistenceMode({
        ARMZ_ENVIRONMENT: 'production',
        ARMZ_DEMO_FORCE_MEMORY: 'true',
      }),
    ).toThrow(DemoPersistenceConfigError);
  });

  it('rejects memory-development outside development', () => {
    expect(() =>
      resolveDemoPersistenceMode({
        ARMZ_ENVIRONMENT: 'staging',
        ARMZ_DEMO_PERSISTENCE_MODE: 'memory-development',
      }),
    ).toThrow(DemoPersistenceConfigError);
  });

  it('rejects invalid strings', () => {
    expect(() => resolveDemoPersistenceMode({ ARMZ_DEMO_PERSISTENCE_MODE: 'auto' })).toThrow(
      /Invalid ARMZ_DEMO_PERSISTENCE_MODE/,
    );
  });

  it('public labels never expose secrets', () => {
    expect(demoPersistencePublicLabel('database')).toBe('Database');
    expect(demoPersistencePublicLabel('memory-test')).toBe('Test memory');
    expect(demoPersistencePublicLabel('memory-development')).toBe('Development memory');
  });

  it('loadDemoConfig includes persistenceMode', () => {
    const cfg = loadDemoConfig({
      ARMZ_DEMO_PERSISTENCE_MODE: 'memory-test',
      ARMZ_ENVIRONMENT: 'test',
    });
    expect(cfg.persistenceMode).toBe('memory-test');
    expect(cfg.configurationVersion).toMatch(/demo-combat/);
  });
});
