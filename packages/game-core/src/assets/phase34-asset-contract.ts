import { PHASE3_4_BATTLE_POSE_IDS } from './phase34-battle-pose-contract';
import { PHASE3_4_BATTLE_RIGS } from './phase34-battle-rig-contract';
import type {
  PremiumAcceptanceTier,
  PremiumAssetSlotContract,
  PremiumAssetSourceSet,
  PremiumVfxMetadata,
} from './premium-asset-manifest.types';

export const PHASE3_4_ASSET_BASE = '/assets/game/phase3-4';
export const PHASE3_4_MANIFEST_PATH = `${PHASE3_4_ASSET_BASE}/manifests/asset-manifest.json`;
export const PHASE3_4_VERSION_MANIFEST_PATH = `${PHASE3_4_ASSET_BASE}/manifests/version-manifest.json`;
export const PHASE3_4_RIG_MANIFEST_PATH = `${PHASE3_4_ASSET_BASE}/manifests/battle-rig-manifest.json`;
export const PHASE3_4_POSE_MANIFEST_PATH = `${PHASE3_4_ASSET_BASE}/manifests/battle-pose-manifest.json`;
export const PHASE3_4_MANIFEST_VERSION = 'phase3-4a-layered-owner-drop-v1';

export const PHASE3_4_DEPRECATED_FINAL_ASSET_IDS = [
  'rookie-brawler/battle-side',
  'practice-automaton/battle-side',
  'arena/table',
] as const;

const old = (stem: string): PremiumAssetSourceSet => ({
  desktop: `/assets/game/phase3-3b/${stem}@2x.webp`,
  tablet: `/assets/game/phase3-3b/${stem}@2x.webp`,
  mobile: `/assets/game/phase3-3b/${stem}@1x.webp`,
});

type SlotInput = Omit<
  PremiumAssetSlotContract,
  | 'density'
  | 'expectedSourceFormats'
  | 'viewportUsage'
  | 'poseUsage'
  | 'anchor'
  | 'pivot'
  | 'critical'
  | 'requiredForAcceptance'
  | 'fallbackMode'
  | 'gripPoint'
  | 'elbowPoint'
  | 'focalPoint'
  | 'responsiveFocalPoints'
  | 'rigLayer'
  | 'vfx'
  | 'fallback'
> & {
  density?: readonly [1, 2];
  viewportUsage?: PremiumAssetSlotContract['viewportUsage'];
  poseUsage?: PremiumAssetSlotContract['poseUsage'];
  anchor?: PremiumAssetSlotContract['anchor'];
  pivot?: PremiumAssetSlotContract['pivot'];
  critical?: boolean;
  requiredForAcceptance?: boolean;
  fallbackMode?: PremiumAssetSlotContract['fallbackMode'];
  gripPoint?: PremiumAssetSlotContract['gripPoint'];
  elbowPoint?: PremiumAssetSlotContract['elbowPoint'];
  focalPoint?: PremiumAssetSlotContract['focalPoint'];
  responsiveFocalPoints?: PremiumAssetSlotContract['responsiveFocalPoints'];
  rigLayer?: PremiumAssetSlotContract['rigLayer'];
  vfx?: PremiumAssetSlotContract['vfx'];
  fallback?: PremiumAssetSlotContract['fallback'];
};

function slot(input: SlotInput): PremiumAssetSlotContract {
  const requiredForAcceptance = input.requiredForAcceptance ?? input.acceptanceTier !== 'C';
  return {
    density: [1, 2],
    expectedSourceFormats: ['png', 'webp'],
    viewportUsage: ['desktop', 'tablet', 'mobile'],
    poseUsage: [],
    anchor: { x: 0.5, y: 0.5 },
    pivot: { x: 0.5, y: 0.5 },
    critical: input.acceptanceTier === 'A',
    fallbackMode: input.fallback ? 'phase3-3b-raster' : 'none',
    gripPoint: null,
    elbowPoint: null,
    focalPoint: null,
    responsiveFocalPoints: null,
    rigLayer: null,
    vfx: null,
    fallback: null,
    ...input,
    requiredForAcceptance,
  };
}

const fighterPresentationSlots = (
  fighterId: 'rookie-brawler' | 'practice-automaton',
  heroLegacyStem: string,
): PremiumAssetSlotContract[] => {
  const other = fighterId === 'rookie-brawler' ? 'practice-automaton' : 'rookie-brawler';
  const heroCallSites =
    fighterId === 'rookie-brawler'
      ? ['landing', 'reveal', 'session-ready', 'collection']
      : ['landing'];
  return [
    slot({
      assetId: `${fighterId}/hero`,
      role: 'hero',
      category: 'fighter-presentation',
      fighterId,
      sourceStem: `fighters/${fighterId}/hero`,
      runtimeStem: `fighters/${fighterId}/hero`,
      width: 1600,
      height: 2000,
      aspectRatio: '4:5',
      transparent: true,
      acceptanceTier: 'A',
      productionCallSites: heroCallSites,
      replacementPriority: 20,
      visualMatchAssetIds: [
        `${fighterId}/portrait`,
        `${fighterId}/versus`,
        `${fighterId}/result-victory`,
        `${fighterId}/result-defeat`,
      ],
      framing: 'Canonical full fighter, center-bottom safe for tall and split-screen layouts.',
      fallback: old(`fighters/${fighterId}/${heroLegacyStem}`),
    }),
    slot({
      assetId: `${fighterId}/portrait`,
      role: 'portrait',
      category: 'fighter-presentation',
      fighterId,
      sourceStem: `fighters/${fighterId}/portrait`,
      runtimeStem: `fighters/${fighterId}/portrait`,
      width: 1200,
      height: 1200,
      aspectRatio: '1:1',
      transparent: true,
      acceptanceTier: 'A',
      productionCallSites: [
        'battle-hud',
        'collection-history',
        ...(fighterId === 'practice-automaton' ? ['collection-opponent-preview'] : []),
      ],
      replacementPriority: 18,
      visualMatchAssetIds: [`${fighterId}/hero`],
      framing: 'Tight center-safe identity crop for circular and narrow HUD masks.',
      fallback: old(`fighters/${fighterId}/portrait`),
    }),
    slot({
      assetId: `${fighterId}/versus`,
      role: 'versus',
      category: 'fighter-presentation',
      fighterId,
      sourceStem: `fighters/${fighterId}/versus`,
      runtimeStem: `fighters/${fighterId}/versus`,
      width: 1400,
      height: 1900,
      aspectRatio: '14:19',
      transparent: true,
      acceptanceTier: 'A',
      productionCallSites: ['demo-matchup-preview', 'fight-versus'],
      replacementPriority: 16,
      visualMatchAssetIds: [`${other}/versus`, `${fighterId}/hero`],
      framing: 'Tall inward-facing matchup pose with lower nameplate safe area.',
      fallback: old(`fighters/${fighterId}/versus`),
    }),
    slot({
      assetId: `${fighterId}/result-victory`,
      role: 'result-victory',
      category: 'fighter-presentation',
      fighterId,
      sourceStem: `fighters/${fighterId}/result-victory`,
      runtimeStem: `fighters/${fighterId}/result-victory`,
      width: 1400,
      height: 1900,
      aspectRatio: '14:19',
      transparent: true,
      acceptanceTier: 'A',
      productionCallSites: ['result-overlay'],
      replacementPriority: 22,
      visualMatchAssetIds: [`${other}/result-defeat`, 'result/victory-accent'],
      framing: 'Tall bottom-grounded winner pose with no baked result UI.',
      fallback: old(`fighters/${fighterId}/result-victory`),
    }),
    slot({
      assetId: `${fighterId}/result-defeat`,
      role: 'result-defeat',
      category: 'fighter-presentation',
      fighterId,
      sourceStem: `fighters/${fighterId}/result-defeat`,
      runtimeStem: `fighters/${fighterId}/result-defeat`,
      width: 1400,
      height: 1900,
      aspectRatio: '14:19',
      transparent: true,
      acceptanceTier: 'A',
      productionCallSites: ['result-overlay'],
      replacementPriority: 22,
      visualMatchAssetIds: [`${other}/result-victory`, 'result/defeat-accent'],
      framing: 'Tall bottom-grounded defeated pose with no baked dim or result UI.',
      fallback: old(`fighters/${fighterId}/result-defeat`),
    }),
  ];
};

const rigSlots = Object.values(PHASE3_4_BATTLE_RIGS).flatMap((rig) =>
  rig.layers.map((layerContract) => {
    const tier: PremiumAcceptanceTier = layerContract.requiredForPremiumPair ? 'A' : 'C';
    return slot({
      assetId: layerContract.assetId,
      role: 'battle-rig-layer',
      category: 'fighter-rig',
      fighterId: rig.fighterId,
      sourceStem: layerContract.sourceStem,
      runtimeStem: layerContract.runtimeStem,
      width: layerContract.width,
      height: layerContract.height,
      aspectRatio: layerContract.aspectRatio,
      transparent: true,
      acceptanceTier: tier,
      requiredForAcceptance: layerContract.requiredForPremiumPair,
      productionCallSites: ['pixi-premium-layered-rig'],
      replacementPriority: layerContract.requiredForPremiumPair ? 1 : 40,
      visualMatchAssetIds: rig.layers
        .filter((entry) => entry.assetId !== layerContract.assetId)
        .map((entry) => entry.assetId),
      framing: layerContract.framing,
      fallbackMode: layerContract.requiredForPremiumPair ? 'phase3-3b-sprite-rig' : 'none',
      anchor: layerContract.anchor,
      pivot: layerContract.pivot,
      poseUsage: PHASE3_4_BATTLE_POSE_IDS,
      rigLayer: layerContract,
    });
  }),
);

const effectDefinitions: Array<{
  assetId: string;
  fallbackName: string;
  directionMode: PremiumVfxMetadata['directionMode'];
  tiers: PremiumVfxMetadata['supportedIntensityTiers'];
  base: number;
  max: number;
  priority: number;
}> = [
  {
    assetId: 'effects/grip-lock',
    fallbackName: 'grip-flash',
    directionMode: 'centered',
    tiers: ['light', 'medium'],
    base: 72,
    max: 128,
    priority: 30,
  },
  {
    assetId: 'effects/push-streak',
    fallbackName: 'momentum-streak',
    directionMode: 'pressure',
    tiers: ['light', 'medium', 'heavy'],
    base: 90,
    max: 180,
    priority: 31,
  },
  {
    assetId: 'effects/counter-burst',
    fallbackName: 'pressure-ring',
    directionMode: 'counter',
    tiers: ['medium', 'heavy', 'critical'],
    base: 96,
    max: 210,
    priority: 28,
  },
  {
    assetId: 'effects/critical-impact',
    fallbackName: 'critical-impact',
    directionMode: 'pressure',
    tiers: ['heavy', 'critical'],
    base: 112,
    max: 240,
    priority: 27,
  },
  {
    assetId: 'effects/recovery-cue',
    fallbackName: 'recovery-glow',
    directionMode: 'centered',
    tiers: ['light', 'medium'],
    base: 84,
    max: 150,
    priority: 32,
  },
  {
    assetId: 'effects/final-slam',
    fallbackName: 'slam-impact',
    directionMode: 'pressure',
    tiers: ['critical', 'final'],
    base: 170,
    max: 360,
    priority: 10,
  },
  {
    assetId: 'effects/victory-sweep',
    fallbackName: 'victory-accent',
    directionMode: 'outcome',
    tiers: ['medium', 'heavy'],
    base: 110,
    max: 220,
    priority: 34,
  },
  {
    assetId: 'effects/defeat-dim',
    fallbackName: 'defeat-accent',
    directionMode: 'outcome',
    tiers: ['medium', 'heavy'],
    base: 110,
    max: 220,
    priority: 34,
  },
];

export const PHASE3_4_ASSET_SLOTS: readonly PremiumAssetSlotContract[] = [
  ...fighterPresentationSlots('rookie-brawler', 'reveal'),
  ...fighterPresentationSlots('practice-automaton', 'portrait'),
  ...rigSlots,
  slot({
    assetId: 'arena/background',
    role: 'arena-background',
    category: 'arena',
    fighterId: null,
    sourceStem: 'arena/background',
    runtimeStem: 'arena/background',
    width: 2560,
    height: 1440,
    aspectRatio: '16:9',
    transparent: false,
    acceptanceTier: 'A',
    productionCallSites: ['pixi-battle-background'],
    replacementPriority: 4,
    visualMatchAssetIds: ['arena/table-surface', 'arena/table-frame'],
    framing:
      'Aspect-preserving cover background with a center-stage focal area and crop-safe edges.',
    focalPoint: { x: 0.5, y: 0.42 },
    responsiveFocalPoints: {
      desktop: { x: 0.5, y: 0.42 },
      tablet: { x: 0.5, y: 0.38 },
      mobile: { x: 0.5, y: 0.32 },
    },
    fallback: old('arena/background'),
  }),
  slot({
    assetId: 'arena/table-surface',
    role: 'table-surface',
    category: 'arena',
    fighterId: null,
    sourceStem: 'arena/table-surface',
    runtimeStem: 'arena/table-surface',
    width: 2200,
    height: 760,
    aspectRatio: '55:19',
    transparent: true,
    acceptanceTier: 'A',
    productionCallSites: ['pixi-battle-table'],
    replacementPriority: 3,
    visualMatchAssetIds: ['arena/table-frame', 'arena/elbow-pad', 'arena/pin-pad'],
    framing: 'Complete premium tabletop surface; no pads and no lower frame.',
    fallbackMode: 'phase3-3b-table-pack',
    gripPoint: { x: 0.5, y: 0.05 },
    fallback: old('arena/table'),
  }),
  slot({
    assetId: 'arena/table-frame',
    role: 'table-frame',
    category: 'arena',
    fighterId: null,
    sourceStem: 'arena/table-frame',
    runtimeStem: 'arena/table-frame',
    width: 2200,
    height: 900,
    aspectRatio: '22:9',
    transparent: true,
    acceptanceTier: 'A',
    productionCallSites: ['pixi-battle-table'],
    replacementPriority: 3,
    visualMatchAssetIds: ['arena/table-surface', 'arena/elbow-pad', 'arena/pin-pad'],
    framing: 'Premium lower table frame aligned to the table-surface width and center line.',
    fallbackMode: 'phase3-3b-table-pack',
    fallback: old('arena/table-frame'),
  }),
  slot({
    assetId: 'arena/elbow-pad',
    role: 'elbow-pad',
    category: 'arena',
    fighterId: null,
    sourceStem: 'arena/elbow-pad',
    runtimeStem: 'arena/elbow-pad',
    width: 640,
    height: 360,
    aspectRatio: '16:9',
    transparent: true,
    acceptanceTier: 'B',
    productionCallSites: ['pixi-battle-table'],
    replacementPriority: 24,
    visualMatchAssetIds: ['arena/table-surface', 'arena/pin-pad'],
    framing: 'Mirror-neutral elbow pad with center contact and transparent clearance.',
    elbowPoint: { x: 0.5, y: 0.5 },
    fallback: old('arena/elbow-pad'),
  }),
  slot({
    assetId: 'arena/pin-pad',
    role: 'pin-pad',
    category: 'arena',
    fighterId: null,
    sourceStem: 'arena/pin-pad',
    runtimeStem: 'arena/pin-pad',
    width: 480,
    height: 720,
    aspectRatio: '2:3',
    transparent: true,
    acceptanceTier: 'B',
    productionCallSites: ['pixi-battle-table', 'deterministic-final-slam'],
    replacementPriority: 24,
    visualMatchAssetIds: ['arena/table-surface', 'arena/elbow-pad'],
    framing: 'Mirror-neutral upright pin target with a clean table-aligned baseline.',
    fallback: old('arena/pin-pad'),
  }),
  ...effectDefinitions.map((effect) =>
    slot({
      assetId: effect.assetId,
      role: 'battle-effect',
      category: 'vfx',
      fighterId: null,
      sourceStem: effect.assetId,
      runtimeStem: effect.assetId,
      width: 1024,
      height: 1024,
      aspectRatio: '1:1',
      transparent: true,
      acceptanceTier: 'B',
      productionCallSites: ['pixi-directional-vfx'],
      replacementPriority: effect.priority,
      visualMatchAssetIds: effectDefinitions
        .filter((entry) => entry.assetId !== effect.assetId)
        .map((entry) => entry.assetId),
      framing: 'Centered high-contrast VFX motif with clean alpha falloff and mobile-safe detail.',
      gripPoint: { x: 0.5, y: 0.5 },
      vfx: {
        directionMode: effect.directionMode,
        supportedIntensityTiers: effect.tiers,
        baseDisplaySize: effect.base,
        maxDisplaySize: effect.max,
        blendMode: effect.assetId === 'effects/defeat-dim' ? 'multiply' : 'add',
        zIndex: effect.assetId === 'effects/final-slam' ? 90 : 80,
      },
      fallback: old(`effects/${effect.fallbackName}`),
    }),
  ),
  slot({
    assetId: 'result/victory-accent',
    role: 'result-accent',
    category: 'result',
    fighterId: null,
    sourceStem: 'result/victory-accent',
    runtimeStem: 'result/victory-accent',
    width: 1600,
    height: 900,
    aspectRatio: '16:9',
    transparent: true,
    acceptanceTier: 'B',
    productionCallSites: ['result-overlay'],
    replacementPriority: 25,
    visualMatchAssetIds: ['rookie-brawler/result-victory', 'practice-automaton/result-defeat'],
    framing: 'Center-safe transparent victory atmosphere for cover cropping under UI.',
    fallback: old('effects/victory-accent'),
  }),
  slot({
    assetId: 'result/defeat-accent',
    role: 'result-accent',
    category: 'result',
    fighterId: null,
    sourceStem: 'result/defeat-accent',
    runtimeStem: 'result/defeat-accent',
    width: 1600,
    height: 900,
    aspectRatio: '16:9',
    transparent: true,
    acceptanceTier: 'B',
    productionCallSites: ['result-overlay'],
    replacementPriority: 25,
    visualMatchAssetIds: ['rookie-brawler/result-defeat', 'practice-automaton/result-victory'],
    framing: 'Center-safe transparent defeat atmosphere for cover cropping under UI.',
    fallback: old('effects/defeat-accent'),
  }),
  slot({
    assetId: 'ui/championship-corner',
    role: 'ui-decoration',
    category: 'ui-decoration',
    fighterId: null,
    sourceStem: 'ui/championship-corner',
    runtimeStem: 'ui/championship-corner',
    width: 1024,
    height: 1024,
    aspectRatio: '1:1',
    transparent: true,
    acceptanceTier: 'C',
    requiredForAcceptance: false,
    productionCallSites: [],
    replacementPriority: 99,
    visualMatchAssetIds: [],
    framing: 'Optional mirror-safe championship corner flourish with a transparent center.',
  }),
];

export const PHASE3_4_TIER_A_ASSET_IDS = PHASE3_4_ASSET_SLOTS.filter(
  (entry) => entry.acceptanceTier === 'A',
).map((entry) => entry.assetId);

export const PHASE3_4_TIER_B_ASSET_IDS = PHASE3_4_ASSET_SLOTS.filter(
  (entry) => entry.acceptanceTier === 'B',
).map((entry) => entry.assetId);

export const PHASE3_4_TIER_C_ASSET_IDS = PHASE3_4_ASSET_SLOTS.filter(
  (entry) => entry.acceptanceTier === 'C',
).map((entry) => entry.assetId);

export const PHASE3_4_REQUIRED_ASSET_SLOTS = PHASE3_4_ASSET_SLOTS.filter(
  (entry) => entry.requiredForAcceptance,
);

export function getPremiumAssetSlot(assetId: string): PremiumAssetSlotContract | undefined {
  return PHASE3_4_ASSET_SLOTS.find((entry) => entry.assetId === assetId);
}
