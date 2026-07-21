/**
 * Phase 3.3B â€” battle asset preloader + authored pose resolver.
 *
 * Loads the generated manifests and textures before the battle countdown
 * begins, and resolves server animation cues into authored pose definitions
 * blended by the live Control differential.
 */

import { Assets } from 'pixi.js';
import type { Texture } from 'pixi.js';
import {
  getAssetEntry,
  loadGameManifests,
  resolveTextureUrl,
  type ManifestBundle,
  type PoseDefinition,
  type ViewportClass,
} from '@armz-clash/game-core';
import { blendPoses, type PoseInput } from './rigSolver';

export type BattleAssetBundle = {
  manifests: ManifestBundle;
  textures: Map<string, Texture>;
  textureSizes: Map<string, { width: number; height: number }>;
  viewport: ViewportClass;
};

export function classifyViewport(w: number, h: number): ViewportClass {
  if (w < 768) return 'mobile';
  if (w < 1024 || h > w) return 'tablet';
  return 'desktop';
}

/** Fighter id mapping from preset/opponent keys. */
export function fighterIdForPreset(presetKey: string): string | null {
  if (presetKey === 'rookie_brawler') return 'rookie-brawler';
  return null; // other presets keep procedural fallback
}

export function fighterIdForOpponent(opponentKey: string): string | null {
  if (opponentKey === 'practice_automaton') return 'practice-automaton';
  return null;
}

/** Collect all asset ids needed for a battle (both fighters + arena + effects). */
export function requiredAssetIds(
  playerFighterId: string | null,
  opponentFighterId: string | null,
): string[] {
  const ids: string[] = [];
  // Arena + effects are always needed.
  ids.push(
    'arena/background',
    'arena/crowd',
    'arena/lighting',
    'arena/banners',
    'arena/table',
    'arena/elbow-pad',
    'arena/pin-pad',
    'arena/table-frame',
    'effects/grip-flash',
    'effects/pressure-ring',
    'effects/momentum-streak',
    'effects/recovery-glow',
    'effects/critical-impact',
    'effects/slam-impact',
    'effects/victory-accent',
    'effects/defeat-accent',
  );
  // Fighter rig parts.
  for (const fid of [playerFighterId, opponentFighterId]) {
    if (!fid) continue;
    if (fid === 'rookie-brawler') {
      ids.push(
        'rookie-brawler/shadows',
        'rookie-brawler/shoulder',
        'rookie-brawler/upper-arm',
        'rookie-brawler/elbow',
        'rookie-brawler/forearm',
        'rookie-brawler/bracer',
        'rookie-brawler/wrist',
        'rookie-brawler/wraps',
        'rookie-brawler/hand',
        'rookie-brawler/fingers',
        'rookie-brawler/thumb',
        'rookie-brawler/highlights',
      );
    } else if (fid === 'practice-automaton') {
      ids.push(
        'practice-automaton/shadows',
        'practice-automaton/shoulder-mount',
        'practice-automaton/upper-housing',
        'practice-automaton/hydraulic-piston',
        'practice-automaton/elbow-bearing',
        'practice-automaton/forearm-casing',
        'practice-automaton/wrist-assembly',
        'practice-automaton/mechanical-hand',
        'practice-automaton/fingers',
        'practice-automaton/grip-pad',
        'practice-automaton/highlights',
      );
    }
  }
  return ids;
}

/**
 * Preload all required battle textures. Returns a bundle with loaded PixiJS
 * textures and their 1x sizes. Throws on failure so the caller can fall back.
 */
export async function preloadBattleAssets(
  playerFighterId: string | null,
  opponentFighterId: string | null,
  viewport: ViewportClass,
  format: 'webp' | 'png' = 'webp',
  base = '/assets/game/phase3-3b',
): Promise<BattleAssetBundle> {
  const manifests = await loadGameManifests(base);
  const ids = requiredAssetIds(playerFighterId, opponentFighterId);
  const textures = new Map<string, Texture>();
  const textureSizes = new Map<string, { width: number; height: number }>();

  const loadPromises = ids.map(async (id) => {
    const entry = getAssetEntry(manifests.assets, id);
    if (!entry) return;
    const url = resolveTextureUrl(entry, viewport, format, base);
    try {
      const tex = await Assets.load(url);
      textures.set(id, tex);
      textureSizes.set(id, { width: entry.width, height: entry.height });
    } catch {
      // Texture load failed; the renderer will skip this sprite gracefully.
    }
  });
  await Promise.all(loadPromises);

  return { manifests, textures, textureSizes, viewport };
}

// ---------------------------------------------------------------------------
// Pose resolution
// ---------------------------------------------------------------------------

function poseToInput(p: PoseDefinition): PoseInput {
  return {
    lean: p.lean,
    shoulderSettle: p.shoulderSettle,
    elbowFlare: p.elbowFlare,
    bones: p.bones,
    layers: p.layers,
    material: p.material,
  };
}

/**
 * Resolve the authored pose for a fighter given the current animation cue,
 * control differential, and side. Returns a PoseInput ready for the FK solver.
 *
 * Advantage / critical / counter poses are selected dynamically:
 *  - diff > 0.15 â†’ player advantage (or strong advantage if > 0.35)
 *  - diff < -0.15 â†’ opponent advantage
 *  - critical cue â†’ critical pose for the leading side
 *  - counter cue â†’ counter pose for the acting side
 */
export function resolvePose(
  poses: readonly PoseDefinition[],
  cueToPose: Record<string, string>,
  animationCue: string,
  diff: number,
  side: 'player' | 'opponent' | 'both' | undefined,
  isPlayer: boolean,
): PoseInput {
  const find = (id: string) => poses.find((p) => p.poseId === id);

  // Special dynamic poses.
  if (animationCue === 'critical') {
    const leading = diff >= 0;
    const poseId = leading === isPlayer ? 'criticalPlayer' : 'criticalOpponent';
    const p = find(poseId);
    if (p) return poseToInput(p);
  }
  if (animationCue === 'counter') {
    const acting = side === 'player' ? true : side === 'opponent' ? false : diff >= 0;
    const poseId = acting === isPlayer ? 'counterPlayer' : 'counterOpponent';
    const p = find(poseId);
    if (p) return poseToInput(p);
  }
  if (
    animationCue === 'push_light' ||
    animationCue === 'push_heavy' ||
    animationCue === 'strain_light' ||
    animationCue === 'strain_heavy'
  ) {
    const strong = Math.abs(diff) > 0.35;
    const playerAdv = diff >= 0;
    let poseId: string;
    if (playerAdv === isPlayer) {
      poseId = strong ? 'strongAdvantagePlayer' : 'lightAdvantagePlayer';
    } else {
      poseId = strong ? 'strongAdvantageOpponent' : 'lightAdvantageOpponent';
    }
    const p = find(poseId);
    if (p) return poseToInput(p);
  }
  if (animationCue === 'winning_slam') {
    const p = find(isPlayer ? 'finalSlamPlayer' : 'finalSlamOpponent');
    if (p) return poseToInput(p);
  }
  if (animationCue === 'defeated') {
    const p = find(isPlayer ? 'finalSlamOpponent' : 'finalSlamPlayer');
    if (p) return poseToInput(p);
  }
  if (animationCue === 'recovery') {
    const p = find(isPlayer ? 'recoveryPlayer' : 'recoveryOpponent');
    if (p) return poseToInput(p);
  }
  if (animationCue === 'fatigue') {
    const p = find(isPlayer ? 'fatiguePlayer' : 'fatigueOpponent');
    if (p) return poseToInput(p);
  }

  // Static cue mapping.
  const mappedId = cueToPose[animationCue] ?? 'ready';
  const mapped = find(mappedId);
  if (mapped) return poseToInput(mapped);

  // Fallback: ready pose.
  const ready = find('ready');
  return poseToInput(
    ready ?? {
      poseId: 'ready',
      fighter: 'shared',
      lean: 0,
      shoulderSettle: 0,
      elbowFlare: 0,
      bones: {},
      layers: {
        wraps: true,
        bracer: true,
        fingers: true,
        thumb: true,
        highlights: true,
        shadows: true,
        strain: false,
      },
      material: { deformation: 0, glow: 0 },
      vfx: [],
      camera: { zoom: 1, shake: 0 },
    },
  );
}

/** Blend two resolved poses for smooth transitions. */
export function blendResolvedPoses(a: PoseInput, b: PoseInput, t: number): PoseInput {
  return blendPoses(a, b, t);
}
