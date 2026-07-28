import type {
  PremiumAssetSlotContract,
  PremiumAssetSourceSet,
} from './premium-asset-manifest.types';

export const PHASE3_4_ASSET_BASE = '/assets/game/phase3-4';
export const PHASE3_4_MANIFEST_PATH = `${PHASE3_4_ASSET_BASE}/manifests/asset-manifest.json`;
export const PHASE3_4_VERSION_MANIFEST_PATH = `${PHASE3_4_ASSET_BASE}/manifests/version-manifest.json`;
export const PHASE3_4_MANIFEST_VERSION = 'phase3-4-owner-drop-v1';

const old = (stem: string): PremiumAssetSourceSet => ({
  desktop: `/assets/game/phase3-3b/${stem}@2x.webp`,
  tablet: `/assets/game/phase3-3b/${stem}@2x.webp`,
  mobile: `/assets/game/phase3-3b/${stem}@1x.webp`,
});

type SlotInput = Omit<
  PremiumAssetSlotContract,
  'density' | 'viewportUsage' | 'anchor' | 'pivot' | 'poseUsage' | 'critical' | 'fallbackMode'
> & {
  density?: readonly [1, 2];
  viewportUsage?: PremiumAssetSlotContract['viewportUsage'];
  anchor?: PremiumAssetSlotContract['anchor'];
  pivot?: PremiumAssetSlotContract['pivot'];
  poseUsage?: PremiumAssetSlotContract['poseUsage'];
  critical?: boolean;
  fallbackMode?: PremiumAssetSlotContract['fallbackMode'];
};

function slot(input: SlotInput): PremiumAssetSlotContract {
  return {
    density: [1, 2],
    viewportUsage: ['desktop', 'tablet', 'mobile'],
    anchor: { x: 0.5, y: 0.5 },
    pivot: { x: 0.5, y: 0.5 },
    poseUsage: [],
    critical: false,
    fallbackMode: input.fallback ? 'phase3-3b-raster' : 'none',
    ...input,
  };
}

const fighterSlots = (
  fighterId: 'rookie-brawler' | 'practice-automaton',
  legacyStem: string,
): PremiumAssetSlotContract[] => [
  slot({
    assetId: `${fighterId}/hero`,
    role: 'hero',
    fighterId,
    sourceStem: `fighters/${fighterId}/hero`,
    runtimeStem: `fighters/${fighterId}/hero`,
    width: 1600,
    height: 2000,
    transparent: true,
    critical: true,
    gripPoint: null,
    elbowPoint: null,
    fallback: old(`fighters/${fighterId}/${legacyStem}`),
  }),
  slot({
    assetId: `${fighterId}/portrait`,
    role: 'portrait',
    fighterId,
    sourceStem: `fighters/${fighterId}/portrait`,
    runtimeStem: `fighters/${fighterId}/portrait`,
    width: 1200,
    height: 1200,
    transparent: true,
    critical: true,
    gripPoint: null,
    elbowPoint: null,
    fallback: old(`fighters/${fighterId}/portrait`),
  }),
  slot({
    assetId: `${fighterId}/versus`,
    role: 'versus',
    fighterId,
    sourceStem: `fighters/${fighterId}/versus`,
    runtimeStem: `fighters/${fighterId}/versus`,
    width: 1400,
    height: 1900,
    transparent: true,
    critical: true,
    gripPoint: null,
    elbowPoint: null,
    fallback: old(`fighters/${fighterId}/versus`),
  }),
  slot({
    assetId: `${fighterId}/battle-side`,
    role: 'battle-side',
    fighterId,
    sourceStem: `fighters/${fighterId}/battle-side`,
    runtimeStem: `fighters/${fighterId}/battle-side`,
    width: 1800,
    height: 1600,
    transparent: true,
    critical: true,
    anchor: { x: 0.5, y: 0.58 },
    pivot: { x: 0.5, y: 0.66 },
    gripPoint: fighterId === 'rookie-brawler' ? { x: 0.82, y: 0.22 } : { x: 0.18, y: 0.22 },
    elbowPoint: fighterId === 'rookie-brawler' ? { x: 0.58, y: 0.68 } : { x: 0.42, y: 0.68 },
    poseUsage: [
      'ready',
      'grip',
      'light-advantage',
      'strong-advantage',
      'counter',
      'critical',
      'recovery',
      'final-slam',
    ],
    fallbackMode: 'phase3-3b-sprite-rig',
    fallback: null,
  }),
  slot({
    assetId: `${fighterId}/result-victory`,
    role: 'result-victory',
    fighterId,
    sourceStem: `fighters/${fighterId}/result-victory`,
    runtimeStem: `fighters/${fighterId}/result-victory`,
    width: 1400,
    height: 1900,
    transparent: true,
    critical: true,
    gripPoint: null,
    elbowPoint: null,
    fallback: old(`fighters/${fighterId}/result-victory`),
  }),
  slot({
    assetId: `${fighterId}/result-defeat`,
    role: 'result-defeat',
    fighterId,
    sourceStem: `fighters/${fighterId}/result-defeat`,
    runtimeStem: `fighters/${fighterId}/result-defeat`,
    width: 1400,
    height: 1900,
    transparent: true,
    critical: true,
    gripPoint: null,
    elbowPoint: null,
    fallback: old(`fighters/${fighterId}/result-defeat`),
  }),
];

export const PHASE3_4_ASSET_SLOTS: readonly PremiumAssetSlotContract[] = [
  ...fighterSlots('rookie-brawler', 'reveal'),
  ...fighterSlots('practice-automaton', 'portrait'),
  slot({
    assetId: 'arena/background',
    role: 'arena-background',
    fighterId: null,
    sourceStem: 'arena/background',
    runtimeStem: 'arena/background',
    width: 2560,
    height: 1440,
    transparent: false,
    critical: true,
    gripPoint: { x: 0.5, y: 0.42 },
    elbowPoint: null,
    fallback: old('arena/background'),
  }),
  slot({
    assetId: 'arena/table',
    role: 'table',
    fighterId: null,
    sourceStem: 'arena/table',
    runtimeStem: 'arena/table',
    width: 2200,
    height: 760,
    transparent: true,
    critical: true,
    gripPoint: { x: 0.5, y: 0.05 },
    elbowPoint: null,
    fallback: old('arena/table'),
  }),
  slot({
    assetId: 'arena/elbow-pad',
    role: 'elbow-pad',
    fighterId: null,
    sourceStem: 'arena/elbow-pad',
    runtimeStem: 'arena/elbow-pad',
    width: 640,
    height: 360,
    transparent: true,
    gripPoint: null,
    elbowPoint: { x: 0.5, y: 0.5 },
    fallback: old('arena/elbow-pad'),
  }),
  slot({
    assetId: 'arena/pin-pad',
    role: 'pin-pad',
    fighterId: null,
    sourceStem: 'arena/pin-pad',
    runtimeStem: 'arena/pin-pad',
    width: 480,
    height: 720,
    transparent: true,
    gripPoint: null,
    elbowPoint: null,
    fallback: old('arena/pin-pad'),
  }),
  ...[
    ['effects/grip-lock', 'grip-flash'],
    ['effects/push-streak', 'momentum-streak'],
    ['effects/counter-burst', 'pressure-ring'],
    ['effects/critical-impact', 'critical-impact'],
    ['effects/recovery-cue', 'recovery-glow'],
    ['effects/final-slam', 'slam-impact'],
    ['effects/victory-sweep', 'victory-accent'],
    ['effects/defeat-dim', 'defeat-accent'],
  ].map(([assetId, fallbackName]) =>
    slot({
      assetId: assetId!,
      role: 'battle-effect',
      fighterId: null,
      sourceStem: assetId!,
      runtimeStem: assetId!,
      width: 1024,
      height: 1024,
      transparent: true,
      gripPoint: { x: 0.5, y: 0.5 },
      elbowPoint: null,
      fallback: old(`effects/${fallbackName}`),
    }),
  ),
  slot({
    assetId: 'result/victory-accent',
    role: 'result-accent',
    fighterId: null,
    sourceStem: 'result/victory-accent',
    runtimeStem: 'result/victory-accent',
    width: 1600,
    height: 900,
    transparent: true,
    gripPoint: null,
    elbowPoint: null,
    fallback: old('effects/victory-accent'),
  }),
  slot({
    assetId: 'result/defeat-accent',
    role: 'result-accent',
    fighterId: null,
    sourceStem: 'result/defeat-accent',
    runtimeStem: 'result/defeat-accent',
    width: 1600,
    height: 900,
    transparent: true,
    gripPoint: null,
    elbowPoint: null,
    fallback: old('effects/defeat-accent'),
  }),
  slot({
    assetId: 'ui/championship-corner',
    role: 'ui-decoration',
    fighterId: null,
    sourceStem: 'ui/championship-corner',
    runtimeStem: 'ui/championship-corner',
    width: 1024,
    height: 1024,
    transparent: true,
    gripPoint: null,
    elbowPoint: null,
    fallback: null,
  }),
];

export function getPremiumAssetSlot(assetId: string): PremiumAssetSlotContract | undefined {
  return PHASE3_4_ASSET_SLOTS.find((entry) => entry.assetId === assetId);
}
