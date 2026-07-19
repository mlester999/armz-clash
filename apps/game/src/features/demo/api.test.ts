import { describe, expect, it } from 'vitest';
import { resolveDemoApiBase } from './api';

describe('resolveDemoApiBase', () => {
  it('strips trailing slash', () => {
    expect(resolveDemoApiBase('http://127.0.0.1:4000/')).toBe('http://127.0.0.1:4000');
  });

  it('falls back to 127.0.0.1:4000 when empty', () => {
    expect(resolveDemoApiBase('')).toBe('http://127.0.0.1:4000');
    expect(resolveDemoApiBase('   ')).toBe('http://127.0.0.1:4000');
  });

  it('does not rewrite a valid 127.0.0.1 URL', () => {
    expect(resolveDemoApiBase('http://127.0.0.1:4000')).toBe('http://127.0.0.1:4000');
  });
});
