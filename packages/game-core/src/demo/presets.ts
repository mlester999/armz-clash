/**
 * Phase 3 temporary Common ARMZ presets.
 * Visual identity keys only — stats are rolled server-side per session.
 */

export type DemoArmzPresetKey =
  | 'rookie_brawler'
  | 'dockhand'
  | 'street_challenger'
  | 'iron_apprentice'
  | 'desert_grappler'
  | 'arena_recruit';

export type DemoArmzPreset = {
  key: DemoArmzPresetKey;
  displayName: string;
  tagline: string;
  animationSetKey: string;
  cosmeticVariant: string;
  /** Procedural palette for Pixi / reveal (hex without #). */
  skinTone: string;
  primaryCloth: string;
  accent: string;
  glove: string;
};

export const DEMO_ARMZ_PRESETS: readonly DemoArmzPreset[] = [
  {
    key: 'rookie_brawler',
    displayName: 'Rookie Brawler',
    tagline: 'Wrapped fist, leather guard, first-night courage.',
    animationSetKey: 'common_player_v1',
    cosmeticVariant: 'leather_wrap',
    skinTone: 'c48a6a',
    primaryCloth: '3d2b22',
    accent: 'd4af6a',
    glove: '2a221c',
  },
  {
    key: 'dockhand',
    displayName: 'Dockhand',
    tagline: 'Work glove, rolled sleeve, heavy forearm.',
    animationSetKey: 'common_player_v1',
    cosmeticVariant: 'work_glove',
    skinTone: 'b87a58',
    primaryCloth: '1e3a4c',
    accent: '6bb3c9',
    glove: '4a5560',
  },
  {
    key: 'street_challenger',
    displayName: 'Street Challenger',
    tagline: 'Athletic wrap, wrist strap, quick pressure.',
    animationSetKey: 'common_player_v1',
    cosmeticVariant: 'athletic_wrap',
    skinTone: 'a86b4a',
    primaryCloth: '1a1f2a',
    accent: '4ecdc4',
    glove: '2c3344',
  },
  {
    key: 'iron_apprentice',
    displayName: 'Iron Apprentice',
    tagline: 'Basic metal bracer, defensive stance.',
    animationSetKey: 'common_player_v1',
    cosmeticVariant: 'metal_bracer',
    skinTone: 'c99574',
    primaryCloth: '2b2f38',
    accent: '9aa4b2',
    glove: '5c6570',
  },
  {
    key: 'desert_grappler',
    displayName: 'Desert Grappler',
    tagline: 'Cloth wraps, warm textiles, lean reach.',
    animationSetKey: 'common_player_v1',
    cosmeticVariant: 'cloth_wraps',
    skinTone: 'd4a574',
    primaryCloth: '8b5a2b',
    accent: 'e8c27a',
    glove: 'c4a06a',
  },
  {
    key: 'arena_recruit',
    displayName: 'Arena Recruit',
    tagline: 'Tournament glove, beginner cloth, clean form.',
    animationSetKey: 'common_player_v1',
    cosmeticVariant: 'tournament_glove',
    skinTone: 'b87d5a',
    primaryCloth: '1c2433',
    accent: '5b8def',
    glove: 'e8eef8',
  },
] as const;

export function getDemoPreset(key: string): DemoArmzPreset | undefined {
  return DEMO_ARMZ_PRESETS.find((p) => p.key === key);
}

export function pickDemoPresetKey(seedIndex: number): DemoArmzPresetKey {
  const i = Math.abs(seedIndex) % DEMO_ARMZ_PRESETS.length;
  return DEMO_ARMZ_PRESETS[i]!.key;
}
