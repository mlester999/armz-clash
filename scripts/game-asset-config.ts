/**
 * Phase 3.3B — Qwen-only premium vector asset pipeline.
 *
 * Source of truth for rig anchors and authored battle poses. Consumed by
 * scripts/build-game-assets.ts to emit the typed runtime manifests under
 * apps/game/public/assets/game/phase3-3b/manifests/.
 *
 * Production disciplines applied manually (not callable tools):
 * game-asset-core, game-animation-frames, game-character-consistency,
 * game-tilesets, game-ui-icons.
 *
 * Rig convention:
 *  - Each articulated segment sprite is authored with its PROXIMAL joint
 *    (the joint closer to the shoulder) near the top of the SVG and the bone
 *    extending downward toward its DISTAL joint.
 *  - `anchor` is the normalized proximal-joint point placed at the joint's
 *    world coordinate. The sprite is rotated so its local +y axis points from
 *    the proximal joint toward the distal joint, then scaled to the world
 *    bone length.
 *  - Decorative overlays (wraps, bracer, fingers, thumb, highlights, shadows)
 *    are attached as children of the nearest articulated bone and inherit its
 *    transform with a fixed local offset.
 */

export type Vec2 = { x: number; y: number };

export type RigPartKind =
  'shoulder' | 'upperArm' | 'elbow' | 'forearm' | 'wrist' | 'hand' | 'overlay';

export type RigPartDef = {
  /** Stable asset id, e.g. "rookie-brawler/forearm". */
  assetId: string;
  fighterId: 'rookie-brawler' | 'practice-automaton';
  /** Source SVG path relative to apps/game/assets/source. */
  source: string;
  kind: RigPartKind;
  /** Normalized proximal-joint anchor (0..1). */
  anchor: Vec2;
  /** Normalized pivot used for rotation (defaults to anchor). */
  pivot: Vec2;
  /**
   * For articulated bones: the fraction along the elbow->grip axis where the
   * proximal joint sits (0 = elbow, 1 = grip tip). Used by the FK solver to
   * derive the joint world position. Overlays use `parent` + `offset`.
   */
  axisT?: number;
  /** Overlay-only: parent bone assetId + normalized offset within parent. */
  parent?: string;
  offset?: Vec2;
  /** Overlay-only: scale relative to parent bone length. */
  overlayScale?: number;
  materialCategory: 'skin' | 'cloth' | 'leather' | 'metal' | 'metal-cyan' | 'energy' | 'composite';
  /** Draw order within a fighter (lower draws first). */
  z: number;
};

/**
 * Rookie Brawler rig — organic arm: shoulder -> upper-arm -> elbow -> forearm
 * -> wrist -> hand, with leather wraps + metal bracer + highlight/shadow overlays.
 */
export const ROOKIE_RIG: readonly RigPartDef[] = [
  {
    assetId: 'rookie-brawler/shadows',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/rig/shadows.svg',
    kind: 'overlay',
    anchor: { x: 0.5, y: 0.5 },
    pivot: { x: 0.5, y: 0.5 },
    parent: 'rookie-brawler/forearm',
    offset: { x: 0.5, y: 0.5 },
    overlayScale: 1.05,
    materialCategory: 'composite',
    z: 5,
  },
  {
    assetId: 'rookie-brawler/shoulder',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/rig/shoulder.svg',
    kind: 'shoulder',
    anchor: { x: 0.5, y: 0.42 },
    pivot: { x: 0.5, y: 0.42 },
    axisT: -0.35,
    materialCategory: 'skin',
    z: 10,
  },
  {
    assetId: 'rookie-brawler/upper-arm',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/rig/upper-arm.svg',
    kind: 'upperArm',
    anchor: { x: 0.5, y: 0.07 },
    pivot: { x: 0.5, y: 0.07 },
    axisT: -0.35,
    materialCategory: 'skin',
    z: 20,
  },
  {
    assetId: 'rookie-brawler/elbow',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/rig/elbow.svg',
    kind: 'elbow',
    anchor: { x: 0.5, y: 0.5 },
    pivot: { x: 0.5, y: 0.5 },
    axisT: 0,
    materialCategory: 'skin',
    z: 30,
  },
  {
    assetId: 'rookie-brawler/forearm',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/rig/forearm.svg',
    kind: 'forearm',
    anchor: { x: 0.5, y: 0.04 },
    pivot: { x: 0.5, y: 0.04 },
    axisT: 0,
    materialCategory: 'skin',
    z: 40,
  },
  {
    assetId: 'rookie-brawler/bracer',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/rig/bracer.svg',
    kind: 'overlay',
    anchor: { x: 0.5, y: 0.5 },
    pivot: { x: 0.5, y: 0.5 },
    parent: 'rookie-brawler/forearm',
    offset: { x: 0.5, y: 0.42 },
    overlayScale: 0.62,
    materialCategory: 'metal',
    z: 45,
  },
  {
    assetId: 'rookie-brawler/wrist',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/rig/wrist.svg',
    kind: 'wrist',
    anchor: { x: 0.5, y: 0.12 },
    pivot: { x: 0.5, y: 0.12 },
    axisT: 0.74,
    materialCategory: 'skin',
    z: 50,
  },
  {
    assetId: 'rookie-brawler/wraps',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/rig/wraps.svg',
    kind: 'overlay',
    anchor: { x: 0.5, y: 0.5 },
    pivot: { x: 0.5, y: 0.5 },
    parent: 'rookie-brawler/wrist',
    offset: { x: 0.5, y: 0.5 },
    overlayScale: 0.95,
    materialCategory: 'leather',
    z: 55,
  },
  {
    assetId: 'rookie-brawler/hand',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/rig/hand.svg',
    kind: 'hand',
    anchor: { x: 0.5, y: 0.14 },
    pivot: { x: 0.5, y: 0.14 },
    axisT: 0.82,
    materialCategory: 'skin',
    z: 60,
  },
  {
    assetId: 'rookie-brawler/fingers',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/rig/fingers.svg',
    kind: 'overlay',
    anchor: { x: 0.5, y: 0.5 },
    pivot: { x: 0.5, y: 0.5 },
    parent: 'rookie-brawler/hand',
    offset: { x: 0.5, y: 0.62 },
    overlayScale: 0.7,
    materialCategory: 'skin',
    z: 65,
  },
  {
    assetId: 'rookie-brawler/thumb',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/rig/thumb.svg',
    kind: 'overlay',
    anchor: { x: 0.5, y: 0.5 },
    pivot: { x: 0.5, y: 0.5 },
    parent: 'rookie-brawler/hand',
    offset: { x: 0.28, y: 0.4 },
    overlayScale: 0.5,
    materialCategory: 'skin',
    z: 66,
  },
  {
    assetId: 'rookie-brawler/highlights',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/rig/highlights.svg',
    kind: 'overlay',
    anchor: { x: 0.5, y: 0.5 },
    pivot: { x: 0.5, y: 0.5 },
    parent: 'rookie-brawler/forearm',
    offset: { x: 0.5, y: 0.5 },
    overlayScale: 1.0,
    materialCategory: 'composite',
    z: 70,
  },
] as const;

/**
 * Practice Automaton rig — mechanical arm: shoulder-mount -> upper-housing ->
 * elbow-bearing -> (hydraulic-piston) -> forearm-casing -> wrist-assembly ->
 * mechanical-hand, with grip-pad + highlight/shadow overlays.
 */
export const AUTOMATON_RIG: readonly RigPartDef[] = [
  {
    assetId: 'practice-automaton/shadows',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/rig/shadows.svg',
    kind: 'overlay',
    anchor: { x: 0.5, y: 0.5 },
    pivot: { x: 0.5, y: 0.5 },
    parent: 'practice-automaton/forearm-casing',
    offset: { x: 0.5, y: 0.5 },
    overlayScale: 1.05,
    materialCategory: 'composite',
    z: 5,
  },
  {
    assetId: 'practice-automaton/shoulder-mount',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/rig/shoulder-mount.svg',
    kind: 'shoulder',
    anchor: { x: 0.5, y: 0.4 },
    pivot: { x: 0.5, y: 0.4 },
    axisT: -0.35,
    materialCategory: 'metal-cyan',
    z: 10,
  },
  {
    assetId: 'practice-automaton/upper-housing',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/rig/upper-housing.svg',
    kind: 'upperArm',
    anchor: { x: 0.5, y: 0.06 },
    pivot: { x: 0.5, y: 0.06 },
    axisT: -0.35,
    materialCategory: 'metal',
    z: 20,
  },
  {
    assetId: 'practice-automaton/hydraulic-piston',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/rig/hydraulic-piston.svg',
    kind: 'overlay',
    anchor: { x: 0.5, y: 0.1 },
    pivot: { x: 0.5, y: 0.1 },
    parent: 'practice-automaton/upper-housing',
    offset: { x: 0.72, y: 0.5 },
    overlayScale: 0.9,
    materialCategory: 'metal-cyan',
    z: 25,
  },
  {
    assetId: 'practice-automaton/elbow-bearing',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/rig/elbow-bearing.svg',
    kind: 'elbow',
    anchor: { x: 0.5, y: 0.5 },
    pivot: { x: 0.5, y: 0.5 },
    axisT: 0,
    materialCategory: 'metal-cyan',
    z: 30,
  },
  {
    assetId: 'practice-automaton/forearm-casing',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/rig/forearm-casing.svg',
    kind: 'forearm',
    anchor: { x: 0.5, y: 0.05 },
    pivot: { x: 0.5, y: 0.05 },
    axisT: 0,
    materialCategory: 'metal',
    z: 40,
  },
  {
    assetId: 'practice-automaton/wrist-assembly',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/rig/wrist-assembly.svg',
    kind: 'wrist',
    anchor: { x: 0.5, y: 0.14 },
    pivot: { x: 0.5, y: 0.14 },
    axisT: 0.74,
    materialCategory: 'metal-cyan',
    z: 50,
  },
  {
    assetId: 'practice-automaton/mechanical-hand',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/rig/mechanical-hand.svg',
    kind: 'hand',
    anchor: { x: 0.5, y: 0.14 },
    pivot: { x: 0.5, y: 0.14 },
    axisT: 0.82,
    materialCategory: 'metal',
    z: 60,
  },
  {
    assetId: 'practice-automaton/fingers',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/rig/fingers.svg',
    kind: 'overlay',
    anchor: { x: 0.5, y: 0.5 },
    pivot: { x: 0.5, y: 0.5 },
    parent: 'practice-automaton/mechanical-hand',
    offset: { x: 0.5, y: 0.62 },
    overlayScale: 0.72,
    materialCategory: 'metal',
    z: 65,
  },
  {
    assetId: 'practice-automaton/grip-pad',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/rig/grip-pad.svg',
    kind: 'overlay',
    anchor: { x: 0.5, y: 0.5 },
    pivot: { x: 0.5, y: 0.5 },
    parent: 'practice-automaton/mechanical-hand',
    offset: { x: 0.5, y: 0.4 },
    overlayScale: 0.55,
    materialCategory: 'metal-cyan',
    z: 66,
  },
  {
    assetId: 'practice-automaton/highlights',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/rig/highlights.svg',
    kind: 'overlay',
    anchor: { x: 0.5, y: 0.5 },
    pivot: { x: 0.5, y: 0.5 },
    parent: 'practice-automaton/forearm-casing',
    offset: { x: 0.5, y: 0.5 },
    overlayScale: 1.0,
    materialCategory: 'composite',
    z: 70,
  },
] as const;

export const ALL_RIG_PARTS: readonly RigPartDef[] = [...ROOKIE_RIG, ...AUTOMATON_RIG];

/** Non-rig surface assets (portraits, arena, effects, ui). */
export type SurfaceAssetDef = {
  assetId: string;
  fighterId: string | null;
  source: string;
  category: 'portrait' | 'reveal' | 'versus' | 'result' | 'arena' | 'effect' | 'ui';
  materialCategory: RigPartDef['materialCategory'];
  /** Anchor for sprite placement (centered by default). */
  anchor: Vec2;
};

export const SURFACE_ASSETS: readonly SurfaceAssetDef[] = [
  // Rookie Brawler surfaces
  {
    assetId: 'rookie-brawler/portrait',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/portrait.svg',
    category: 'portrait',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'rookie-brawler/reveal',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/reveal.svg',
    category: 'reveal',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'rookie-brawler/versus',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/versus.svg',
    category: 'versus',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'rookie-brawler/result-victory',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/result-victory.svg',
    category: 'result',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'rookie-brawler/result-defeat',
    fighterId: 'rookie-brawler',
    source: 'fighters/rookie-brawler/result-defeat.svg',
    category: 'result',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  // Practice Automaton surfaces
  {
    assetId: 'practice-automaton/portrait',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/portrait.svg',
    category: 'portrait',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'practice-automaton/versus',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/versus.svg',
    category: 'versus',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'practice-automaton/result-victory',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/result-victory.svg',
    category: 'result',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'practice-automaton/result-defeat',
    fighterId: 'practice-automaton',
    source: 'fighters/practice-automaton/result-defeat.svg',
    category: 'result',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  // Arena
  {
    assetId: 'arena/background',
    fighterId: null,
    source: 'arena/background.svg',
    category: 'arena',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'arena/crowd',
    fighterId: null,
    source: 'arena/crowd.svg',
    category: 'arena',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'arena/lighting',
    fighterId: null,
    source: 'arena/lighting.svg',
    category: 'arena',
    materialCategory: 'energy',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'arena/banners',
    fighterId: null,
    source: 'arena/banners.svg',
    category: 'arena',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'arena/table',
    fighterId: null,
    source: 'arena/table.svg',
    category: 'arena',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'arena/elbow-pad',
    fighterId: null,
    source: 'arena/elbow-pad.svg',
    category: 'arena',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'arena/pin-pad',
    fighterId: null,
    source: 'arena/pin-pad.svg',
    category: 'arena',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'arena/table-frame',
    fighterId: null,
    source: 'arena/table-frame.svg',
    category: 'arena',
    materialCategory: 'metal',
    anchor: { x: 0.5, y: 0.5 },
  },
  // Effects
  {
    assetId: 'effects/grip-flash',
    fighterId: null,
    source: 'effects/grip-flash.svg',
    category: 'effect',
    materialCategory: 'energy',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'effects/pressure-ring',
    fighterId: null,
    source: 'effects/pressure-ring.svg',
    category: 'effect',
    materialCategory: 'energy',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'effects/momentum-streak',
    fighterId: null,
    source: 'effects/momentum-streak.svg',
    category: 'effect',
    materialCategory: 'energy',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'effects/recovery-glow',
    fighterId: null,
    source: 'effects/recovery-glow.svg',
    category: 'effect',
    materialCategory: 'energy',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'effects/critical-impact',
    fighterId: null,
    source: 'effects/critical-impact.svg',
    category: 'effect',
    materialCategory: 'energy',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'effects/slam-impact',
    fighterId: null,
    source: 'effects/slam-impact.svg',
    category: 'effect',
    materialCategory: 'energy',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'effects/victory-accent',
    fighterId: null,
    source: 'effects/victory-accent.svg',
    category: 'effect',
    materialCategory: 'energy',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'effects/defeat-accent',
    fighterId: null,
    source: 'effects/defeat-accent.svg',
    category: 'effect',
    materialCategory: 'energy',
    anchor: { x: 0.5, y: 0.5 },
  },
  // UI
  {
    assetId: 'ui/icons/sfx-on',
    fighterId: null,
    source: 'ui/icons/sfx-on.svg',
    category: 'ui',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'ui/icons/sfx-off',
    fighterId: null,
    source: 'ui/icons/sfx-off.svg',
    category: 'ui',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'ui/icons/music-on',
    fighterId: null,
    source: 'ui/icons/music-on.svg',
    category: 'ui',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'ui/icons/music-off',
    fighterId: null,
    source: 'ui/icons/music-off.svg',
    category: 'ui',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'ui/icons/replay',
    fighterId: null,
    source: 'ui/icons/replay.svg',
    category: 'ui',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'ui/icons/collection',
    fighterId: null,
    source: 'ui/icons/collection.svg',
    category: 'ui',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'ui/icons/home',
    fighterId: null,
    source: 'ui/icons/home.svg',
    category: 'ui',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'ui/result/victory-frame',
    fighterId: null,
    source: 'ui/result/victory-frame.svg',
    category: 'ui',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'ui/result/defeat-frame',
    fighterId: null,
    source: 'ui/result/defeat-frame.svg',
    category: 'ui',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'ui/result/reward-card',
    fighterId: null,
    source: 'ui/result/reward-card.svg',
    category: 'ui',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'ui/badges/common',
    fighterId: null,
    source: 'ui/badges/common.svg',
    category: 'ui',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
  {
    assetId: 'ui/badges/easy',
    fighterId: null,
    source: 'ui/badges/easy.svg',
    category: 'ui',
    materialCategory: 'composite',
    anchor: { x: 0.5, y: 0.5 },
  },
] as const;

// ---------------------------------------------------------------------------
// Authored pose manifest
// ---------------------------------------------------------------------------

export type BonePose = {
  /** Additive rotation (radians) applied on top of the FK angle. */
  rot?: number;
  /** Additive proximal-joint offset in scene units (x right, y down). */
  dx?: number;
  dy?: number;
  /** Bone-length scale multiplier. */
  scale?: number;
};

export type PoseLayers = {
  wraps?: boolean;
  bracer?: boolean;
  fingers?: boolean;
  thumb?: boolean;
  highlights?: boolean;
  shadows?: boolean;
  /** Strain-only detail (veins / overheat glow). */
  strain?: boolean;
};

export type PoseDefinition = {
  poseId: string;
  /** Which fighter this pose is authored for, or 'shared'. */
  fighter: 'shared' | 'rookie-brawler' | 'practice-automaton';
  /** Additive lean bias (radians) added to the control-derived grip lean. */
  lean: number;
  /** Shoulder vertical settle (scene units, +down). */
  shoulderSettle: number;
  /** Elbow lateral flare (scene units, +outward from center). */
  elbowFlare: number;
  bones: {
    shoulder?: BonePose;
    upperArm?: BonePose;
    elbow?: BonePose;
    forearm?: BonePose;
    wrist?: BonePose;
    hand?: BonePose;
  };
  layers: PoseLayers;
  material: { deformation: number; glow: number };
  vfx: string[];
  camera: { zoom: number; shake: number };
};

const BASE_LAYERS: PoseLayers = {
  wraps: true,
  bracer: true,
  fingers: true,
  thumb: true,
  highlights: true,
  shadows: true,
  strain: false,
};

function pose(
  p: Omit<PoseDefinition, 'layers' | 'material' | 'vfx' | 'camera'> & {
    layers?: PoseLayers;
    material?: PoseDefinition['material'];
    vfx?: string[];
    camera?: PoseDefinition['camera'];
  },
): PoseDefinition {
  return {
    layers: { ...BASE_LAYERS, ...(p.layers ?? {}) },
    material: p.material ?? { deformation: 0, glow: 0 },
    vfx: p.vfx ?? [],
    camera: p.camera ?? { zoom: 1, shake: 0 },
    ...p,
  };
}

/**
 * The 22 shared authored battle states (plan Task 10). `fatigueOpponent` is
 * authored as the Automaton "overheat" state. Poses are symmetric: a "Player"
 * pose leans toward the opponent pin (+), an "Opponent" pose leans toward the
 * player pin (-). The runtime mirrors opponent poses onto the right arm.
 */
export const POSES: readonly PoseDefinition[] = [
  pose({
    poseId: 'ready',
    fighter: 'shared',
    lean: 0,
    shoulderSettle: 4,
    elbowFlare: 0,
    bones: { hand: { rot: -0.05 } },
  }),
  pose({
    poseId: 'approach',
    fighter: 'shared',
    lean: 0,
    shoulderSettle: 2,
    elbowFlare: 2,
    bones: { forearm: { rot: 0.04 }, hand: { rot: -0.12 } },
    vfx: ['dust_light'],
  }),
  pose({
    poseId: 'grip',
    fighter: 'shared',
    lean: 0,
    shoulderSettle: 0,
    elbowFlare: 0,
    bones: { hand: { rot: 0.08, scale: 1.03 } },
    vfx: ['grip_spark'],
    camera: { zoom: 1.04, shake: 0 },
  }),
  pose({
    poseId: 'neutral',
    fighter: 'shared',
    lean: 0,
    shoulderSettle: 0,
    elbowFlare: 1,
    bones: { forearm: { rot: 0.02 } },
    layers: { strain: false },
  }),
  pose({
    poseId: 'lightAdvantagePlayer',
    fighter: 'shared',
    lean: 0.12,
    shoulderSettle: -1,
    elbowFlare: 2,
    bones: { forearm: { rot: 0.05 }, wrist: { rot: 0.06 }, hand: { rot: 0.05 } },
    material: { deformation: 0.2, glow: 0.1 },
    vfx: ['dust_light'],
  }),
  pose({
    poseId: 'strongAdvantagePlayer',
    fighter: 'shared',
    lean: 0.28,
    shoulderSettle: -3,
    elbowFlare: 4,
    bones: {
      upperArm: { rot: 0.05 },
      forearm: { rot: 0.09 },
      wrist: { rot: 0.1 },
      hand: { rot: 0.08, scale: 1.05 },
    },
    layers: { strain: true },
    material: { deformation: 0.45, glow: 0.25 },
    vfx: ['dust_heavy'],
    camera: { zoom: 1.03, shake: 0.4 },
  }),
  pose({
    poseId: 'lightAdvantageOpponent',
    fighter: 'shared',
    lean: -0.12,
    shoulderSettle: -1,
    elbowFlare: 2,
    bones: { forearm: { rot: -0.05 }, wrist: { rot: -0.06 }, hand: { rot: -0.05 } },
    material: { deformation: 0.2, glow: 0.1 },
    vfx: ['dust_light'],
  }),
  pose({
    poseId: 'strongAdvantageOpponent',
    fighter: 'shared',
    lean: -0.28,
    shoulderSettle: -3,
    elbowFlare: 4,
    bones: {
      upperArm: { rot: -0.05 },
      forearm: { rot: -0.09 },
      wrist: { rot: -0.1 },
      hand: { rot: -0.08, scale: 1.05 },
    },
    layers: { strain: true },
    material: { deformation: 0.45, glow: 0.25 },
    vfx: ['dust_heavy'],
    camera: { zoom: 1.03, shake: 0.4 },
  }),
  pose({
    poseId: 'counterPlayer',
    fighter: 'shared',
    lean: 0.18,
    shoulderSettle: -2,
    elbowFlare: 3,
    bones: { forearm: { rot: 0.12 }, wrist: { rot: 0.14 }, hand: { rot: 0.1 } },
    material: { deformation: 0.35, glow: 0.3 },
    vfx: ['energy_trail'],
    camera: { zoom: 1.05, shake: 0.5 },
  }),
  pose({
    poseId: 'counterOpponent',
    fighter: 'shared',
    lean: -0.18,
    shoulderSettle: -2,
    elbowFlare: 3,
    bones: { forearm: { rot: -0.12 }, wrist: { rot: -0.14 }, hand: { rot: -0.1 } },
    material: { deformation: 0.35, glow: 0.3 },
    vfx: ['energy_trail'],
    camera: { zoom: 1.05, shake: 0.5 },
  }),
  pose({
    poseId: 'criticalPlayer',
    fighter: 'shared',
    lean: 0.34,
    shoulderSettle: -4,
    elbowFlare: 5,
    bones: {
      upperArm: { rot: 0.07 },
      forearm: { rot: 0.13 },
      wrist: { rot: 0.16 },
      hand: { rot: 0.12, scale: 1.07 },
    },
    layers: { strain: true },
    material: { deformation: 0.6, glow: 0.5 },
    vfx: ['critical_flash'],
    camera: { zoom: 1.08, shake: 0.8 },
  }),
  pose({
    poseId: 'criticalOpponent',
    fighter: 'shared',
    lean: -0.34,
    shoulderSettle: -4,
    elbowFlare: 5,
    bones: {
      upperArm: { rot: -0.07 },
      forearm: { rot: -0.13 },
      wrist: { rot: -0.16 },
      hand: { rot: -0.12, scale: 1.07 },
    },
    layers: { strain: true },
    material: { deformation: 0.6, glow: 0.5 },
    vfx: ['critical_flash'],
    camera: { zoom: 1.08, shake: 0.8 },
  }),
  pose({
    poseId: 'recoveryPlayer',
    fighter: 'shared',
    lean: 0.06,
    shoulderSettle: 1,
    elbowFlare: 1,
    bones: { forearm: { rot: 0.03 }, hand: { rot: 0.02 } },
    material: { deformation: 0.1, glow: 0.4 },
    vfx: ['recovery'],
    camera: { zoom: 1.02, shake: 0 },
  }),
  pose({
    poseId: 'recoveryOpponent',
    fighter: 'shared',
    lean: -0.06,
    shoulderSettle: 1,
    elbowFlare: 1,
    bones: { forearm: { rot: -0.03 }, hand: { rot: -0.02 } },
    material: { deformation: 0.1, glow: 0.4 },
    vfx: ['recovery'],
    camera: { zoom: 1.02, shake: 0 },
  }),
  pose({
    poseId: 'fatiguePlayer',
    fighter: 'rookie-brawler',
    lean: -0.04,
    shoulderSettle: 6,
    elbowFlare: -1,
    bones: {
      shoulder: { dy: 3 },
      upperArm: { rot: -0.04 },
      forearm: { rot: -0.05 },
      hand: { rot: -0.06, scale: 0.98 },
    },
    layers: { strain: true },
    material: { deformation: 0.3, glow: 0.05 },
  }),
  pose({
    poseId: 'fatigueOpponent',
    fighter: 'practice-automaton',
    lean: 0.04,
    shoulderSettle: 6,
    elbowFlare: -1,
    bones: {
      shoulder: { dy: 3 },
      upperArm: { rot: 0.04 },
      forearm: { rot: 0.05 },
      hand: { rot: 0.06, scale: 0.98 },
    },
    layers: { strain: true },
    material: { deformation: 0.3, glow: 0.5 },
    vfx: ['recovery'],
  }),
  pose({
    poseId: 'finalSlamPlayer',
    fighter: 'shared',
    lean: 0.55,
    shoulderSettle: -5,
    elbowFlare: 6,
    bones: {
      upperArm: { rot: 0.1 },
      forearm: { rot: 0.16 },
      wrist: { rot: 0.2 },
      hand: { rot: 0.16, scale: 1.08 },
    },
    layers: { strain: true },
    material: { deformation: 0.8, glow: 0.7 },
    vfx: ['final_impact'],
    camera: { zoom: 1.1, shake: 1.4 },
  }),
  pose({
    poseId: 'finalSlamOpponent',
    fighter: 'shared',
    lean: -0.55,
    shoulderSettle: -5,
    elbowFlare: 6,
    bones: {
      upperArm: { rot: -0.1 },
      forearm: { rot: -0.16 },
      wrist: { rot: -0.2 },
      hand: { rot: -0.16, scale: 1.08 },
    },
    layers: { strain: true },
    material: { deformation: 0.8, glow: 0.7 },
    vfx: ['final_impact'],
    camera: { zoom: 1.1, shake: 1.4 },
  }),
  pose({
    poseId: 'victoryPlayer',
    fighter: 'rookie-brawler',
    lean: 0.4,
    shoulderSettle: -6,
    elbowFlare: 5,
    bones: { upperArm: { rot: 0.08 }, forearm: { rot: 0.1 }, hand: { rot: 0.1, scale: 1.05 } },
    material: { deformation: 0.4, glow: 0.6 },
    vfx: ['victory_particles'],
    camera: { zoom: 1.06, shake: 0 },
  }),
  pose({
    poseId: 'victoryOpponent',
    fighter: 'practice-automaton',
    lean: -0.4,
    shoulderSettle: -6,
    elbowFlare: 5,
    bones: { upperArm: { rot: -0.08 }, forearm: { rot: -0.1 }, hand: { rot: -0.1, scale: 1.05 } },
    material: { deformation: 0.4, glow: 0.6 },
    vfx: ['victory_particles'],
    camera: { zoom: 1.06, shake: 0 },
  }),
  pose({
    poseId: 'defeatPlayer',
    fighter: 'rookie-brawler',
    lean: -0.4,
    shoulderSettle: 8,
    elbowFlare: -2,
    bones: {
      shoulder: { dy: 4 },
      upperArm: { rot: -0.08 },
      forearm: { rot: -0.12 },
      hand: { rot: -0.14, scale: 0.96 },
    },
    layers: { strain: true },
    material: { deformation: 0.5, glow: 0.05 },
    vfx: ['defeat_particles'],
  }),
  pose({
    poseId: 'defeatOpponent',
    fighter: 'practice-automaton',
    lean: 0.4,
    shoulderSettle: 8,
    elbowFlare: -2,
    bones: {
      shoulder: { dy: 4 },
      upperArm: { rot: 0.08 },
      forearm: { rot: 0.12 },
      hand: { rot: 0.14, scale: 0.96 },
    },
    layers: { strain: true },
    material: { deformation: 0.5, glow: 0.3 },
    vfx: ['defeat_particles'],
  }),
];

/**
 * Map a server `animationCue` (+ side + outcome) to an authored poseId.
 * The runtime resolves advantage poses using the live Control differential so
 * the same cue can blend toward player/opponent advantage dynamically.
 */
export const CUE_TO_POSE: Record<string, string> = {
  idle: 'ready',
  entrance: 'approach',
  approach: 'approach',
  grip: 'grip',
  strain_light: 'neutral',
  strain_heavy: 'neutral',
  table_idle: 'neutral',
  table_shake_light: 'neutral',
  table_shake_heavy: 'neutral',
  table_final_impact: 'neutral',
  push_light: 'neutral',
  push_heavy: 'neutral',
  counter: 'neutral',
  critical: 'neutral',
  recovery: 'recoveryPlayer',
  fatigue: 'fatiguePlayer',
  winning_slam: 'finalSlamPlayer',
  defeated: 'finalSlamOpponent',
};

/** Camera presets per viewport class (plan Task 14). */
export const CAMERA_PRESETS = {
  desktop: { baseZoom: 1.0, gripFocusY: 0.42, minFighterScale: 1.0 },
  tablet: { baseZoom: 1.06, gripFocusY: 0.4, minFighterScale: 1.05 },
  mobile: { baseZoom: 1.16, gripFocusY: 0.38, minFighterScale: 1.12 },
} as const;

export const ASSET_VERSION = 'phase3-3b-v1';
