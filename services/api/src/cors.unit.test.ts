import { describe, expect, it } from 'vitest';
import { allowedAuthOrigins, loadAuthConfig } from '@armz-clash/config';

describe('strict player CORS origins', () => {
  it('allows only web and game player origins by default (127.0.0.1)', () => {
    const auth = loadAuthConfig({
      ARMZ_WEB_ORIGIN: 'http://127.0.0.1:3000',
      ARMZ_GAME_ORIGIN: 'http://127.0.0.1:3001',
      ARMZ_ADMIN_ORIGIN: 'http://127.0.0.1:3002',
      ARMZ_API_ORIGIN: 'http://127.0.0.1:4000',
    });
    const player = allowedAuthOrigins(auth);
    expect(player).toContain('http://127.0.0.1:3000');
    expect(player).toContain('http://127.0.0.1:3001');
    expect(player).not.toContain('http://127.0.0.1:3002');
    expect(player).not.toContain('*');
  });

  it('does not treat unknown origins as allowed', () => {
    const auth = loadAuthConfig({
      ARMZ_WEB_ORIGIN: 'http://127.0.0.1:3000',
      ARMZ_GAME_ORIGIN: 'http://127.0.0.1:3001',
    });
    const player = allowedAuthOrigins(auth);
    expect(player.includes('https://evil.example')).toBe(false);
    expect(player.includes('http://localhost:3001')).toBe(false);
  });
});
