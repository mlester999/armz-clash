import type {
  PremiumAssetPoint,
  PremiumAssetRect,
  PremiumRigJointName,
  PremiumRigLayerKind,
  PremiumRigLayerMetadata,
} from './premium-asset-manifest.types';

export type Phase34BattleFighterId = 'rookie-brawler' | 'practice-automaton';

export type Phase34RigJoint = {
  name: PremiumRigJointName;
  /** Normalized coordinate on the shared 1800x1600 composition guide. */
  referencePoint: PremiumAssetPoint;
  planted: boolean;
};

export type Phase34RigLayerContract = PremiumRigLayerMetadata & {
  assetId: string;
  sourceStem: string;
  runtimeStem: string;
  width: number;
  height: number;
  aspectRatio: string;
  transparent: true;
  anchor: PremiumAssetPoint;
  pivot: PremiumAssetPoint;
  framing: string;
};

export type Phase34BattleRigContract = {
  fighterId: Phase34BattleFighterId;
  referenceCanvas: { width: 1800; height: 1600 };
  joints: Record<string, Phase34RigJoint>;
  layers: readonly Phase34RigLayerContract[];
};

const REFERENCE_CANVAS = { width: 1800, height: 1600 } as const;

function layer(input: {
  fighterId: Phase34BattleFighterId;
  layerId: string;
  kind: PremiumRigLayerKind;
  width: number;
  height: number;
  aspectRatio: string;
  parentAssetId?: string | null;
  parentJoint?: PremiumRigJointName | null;
  childJoint?: PremiumRigJointName | null;
  anchor: PremiumAssetPoint;
  pivot?: PremiumAssetPoint;
  childConnectionPoint?: PremiumAssetPoint | null;
  referenceBounds: PremiumAssetRect;
  rotationLimits: { min: number; max: number };
  scaleLimits?: { min: number; max: number };
  zIndex: number;
  required: boolean;
  framing: string;
}): Phase34RigLayerContract {
  const assetId = `${input.fighterId}/battle/${input.layerId}`;
  return {
    assetId,
    sourceStem: `fighters/${assetId}`,
    runtimeStem: `fighters/${assetId}`,
    width: input.width,
    height: input.height,
    aspectRatio: input.aspectRatio,
    transparent: true,
    rigId: input.fighterId,
    layerId: input.layerId,
    kind: input.kind,
    parentAssetId: input.parentAssetId ?? null,
    parentJoint: input.parentJoint ?? null,
    childJoint: input.childJoint ?? null,
    localConnectionPoint: input.anchor,
    childConnectionPoint: input.childConnectionPoint ?? null,
    referenceBounds: input.referenceBounds,
    rotationLimits: input.rotationLimits,
    scaleLimits: input.scaleLimits ?? { min: 0.85, max: 1.2 },
    zIndex: input.zIndex,
    mirrorRule: 'opponent',
    requiredForPremiumPair: input.required,
    fallbackBehavior: input.required ? 'phase3-3b-sprite-rig' : 'omit-layer',
    anchor: input.anchor,
    pivot: input.pivot ?? input.anchor,
    framing: input.framing,
  };
}

const rookieUpperArmId = 'rookie-brawler/battle/upper-arm';
const rookieForearmId = 'rookie-brawler/battle/forearm';
const automatonUpperId = 'practice-automaton/battle/upper-housing';
const automatonForearmId = 'practice-automaton/battle/forearm-casing';

export const PHASE3_4_BATTLE_RIGS: Record<Phase34BattleFighterId, Phase34BattleRigContract> = {
  'rookie-brawler': {
    fighterId: 'rookie-brawler',
    referenceCanvas: REFERENCE_CANVAS,
    joints: {
      shoulder: { name: 'shoulder', referencePoint: { x: 0.24, y: 0.86 }, planted: false },
      elbow: { name: 'elbow', referencePoint: { x: 0.58, y: 0.68 }, planted: true },
      wrist: { name: 'wrist', referencePoint: { x: 0.75, y: 0.38 }, planted: false },
      hand: { name: 'hand', referencePoint: { x: 0.79, y: 0.29 }, planted: false },
      grip: { name: 'grip', referencePoint: { x: 0.82, y: 0.22 }, planted: false },
    },
    layers: [
      layer({
        fighterId: 'rookie-brawler',
        layerId: 'upper-arm',
        kind: 'upper-arm',
        width: 800,
        height: 1200,
        aspectRatio: '2:3',
        parentJoint: 'shoulder',
        childJoint: 'elbow',
        anchor: { x: 0.5, y: 0.12 },
        childConnectionPoint: { x: 0.5, y: 0.88 },
        referenceBounds: { x: 150, y: 760, width: 930, height: 790 },
        rotationLimits: { min: -0.35, max: 0.35 },
        zIndex: 20,
        required: true,
        framing: 'Isolated shoulder-to-elbow mass on the locked reference canvas.',
      }),
      layer({
        fighterId: 'rookie-brawler',
        layerId: 'forearm',
        kind: 'forearm',
        width: 800,
        height: 1200,
        aspectRatio: '2:3',
        parentJoint: 'elbow',
        childJoint: 'wrist',
        anchor: { x: 0.5, y: 0.12 },
        childConnectionPoint: { x: 0.5, y: 0.88 },
        referenceBounds: { x: 840, y: 390, width: 670, height: 820 },
        rotationLimits: { min: -0.5, max: 0.5 },
        zIndex: 40,
        required: true,
        framing: 'Isolated elbow-to-wrist forearm with overlap at both joints.',
      }),
      layer({
        fighterId: 'rookie-brawler',
        layerId: 'hand',
        kind: 'hand',
        width: 720,
        height: 840,
        aspectRatio: '6:7',
        parentJoint: 'wrist',
        childJoint: 'grip',
        anchor: { x: 0.5, y: 0.16 },
        childConnectionPoint: { x: 0.5, y: 0.84 },
        referenceBounds: { x: 1270, y: 170, width: 470, height: 520 },
        rotationLimits: { min: -0.7, max: 0.7 },
        scaleLimits: { min: 0.9, max: 1.12 },
        zIndex: 60,
        required: true,
        framing:
          'Wrist-to-grip hand with a clearly marked contact center and generous finger overlap.',
      }),
      layer({
        fighterId: 'rookie-brawler',
        layerId: 'wrap-bracer-overlay',
        kind: 'overlay',
        width: 900,
        height: 1280,
        aspectRatio: '45:64',
        parentAssetId: rookieForearmId,
        parentJoint: 'elbow',
        childJoint: 'wrist',
        anchor: { x: 0.5, y: 0.5 },
        referenceBounds: { x: 820, y: 380, width: 710, height: 850 },
        rotationLimits: { min: -0.5, max: 0.5 },
        zIndex: 50,
        required: true,
        framing:
          'Transparent wrap and bracer treatment aligned exactly over the forearm reference.',
      }),
      layer({
        fighterId: 'rookie-brawler',
        layerId: 'contact-shadow',
        kind: 'overlay',
        width: 1024,
        height: 512,
        aspectRatio: '2:1',
        parentAssetId: rookieUpperArmId,
        parentJoint: 'elbow',
        anchor: { x: 0.5, y: 0.5 },
        referenceBounds: { x: 740, y: 990, width: 720, height: 330 },
        rotationLimits: { min: -0.35, max: 0.35 },
        zIndex: 10,
        required: false,
        framing: 'Soft elbow/table contact shadow with no baked table texture.',
      }),
      layer({
        fighterId: 'rookie-brawler',
        layerId: 'strain-highlight',
        kind: 'overlay',
        width: 800,
        height: 1200,
        aspectRatio: '2:3',
        parentAssetId: rookieForearmId,
        parentJoint: 'elbow',
        childJoint: 'wrist',
        anchor: { x: 0.5, y: 0.5 },
        referenceBounds: { x: 850, y: 400, width: 650, height: 800 },
        rotationLimits: { min: -0.5, max: 0.5 },
        zIndex: 70,
        required: false,
        framing: 'Sparse strain-light overlay matching the forearm silhouette without opaque fill.',
      }),
    ],
  },
  'practice-automaton': {
    fighterId: 'practice-automaton',
    referenceCanvas: REFERENCE_CANVAS,
    joints: {
      shoulderMount: {
        name: 'shoulderMount',
        referencePoint: { x: 0.76, y: 0.86 },
        planted: false,
      },
      elbowBearing: {
        name: 'elbowBearing',
        referencePoint: { x: 0.42, y: 0.68 },
        planted: true,
      },
      wristAssembly: {
        name: 'wristAssembly',
        referencePoint: { x: 0.25, y: 0.38 },
        planted: false,
      },
      mechanicalHand: {
        name: 'mechanicalHand',
        referencePoint: { x: 0.21, y: 0.29 },
        planted: false,
      },
      grip: { name: 'grip', referencePoint: { x: 0.18, y: 0.22 }, planted: false },
    },
    layers: [
      layer({
        fighterId: 'practice-automaton',
        layerId: 'upper-housing',
        kind: 'upper-arm',
        width: 900,
        height: 1200,
        aspectRatio: '3:4',
        parentJoint: 'shoulderMount',
        childJoint: 'elbowBearing',
        anchor: { x: 0.5, y: 0.12 },
        childConnectionPoint: { x: 0.5, y: 0.88 },
        referenceBounds: { x: 720, y: 760, width: 930, height: 790 },
        rotationLimits: { min: -0.32, max: 0.32 },
        zIndex: 20,
        required: true,
        framing: 'Isolated shoulder-mount-to-elbow-bearing housing with mechanical overlap.',
      }),
      layer({
        fighterId: 'practice-automaton',
        layerId: 'forearm-casing',
        kind: 'forearm',
        width: 900,
        height: 1200,
        aspectRatio: '3:4',
        parentJoint: 'elbowBearing',
        childJoint: 'wristAssembly',
        anchor: { x: 0.5, y: 0.12 },
        childConnectionPoint: { x: 0.5, y: 0.88 },
        referenceBounds: { x: 290, y: 390, width: 670, height: 820 },
        rotationLimits: { min: -0.48, max: 0.48 },
        zIndex: 40,
        required: true,
        framing: 'Elbow-bearing-to-wrist casing with clean socket overlap and no baked hose.',
      }),
      layer({
        fighterId: 'practice-automaton',
        layerId: 'mechanical-hand',
        kind: 'hand',
        width: 760,
        height: 880,
        aspectRatio: '19:22',
        parentJoint: 'wristAssembly',
        childJoint: 'grip',
        anchor: { x: 0.5, y: 0.16 },
        childConnectionPoint: { x: 0.5, y: 0.84 },
        referenceBounds: { x: 60, y: 170, width: 470, height: 520 },
        rotationLimits: { min: -0.68, max: 0.68 },
        scaleLimits: { min: 0.9, max: 1.12 },
        zIndex: 60,
        required: true,
        framing:
          'Wrist-to-grip mechanical hand with a stable palm contact center and finger overlap.',
      }),
      layer({
        fighterId: 'practice-automaton',
        layerId: 'piston-hose-overlay',
        kind: 'overlay',
        width: 900,
        height: 1280,
        aspectRatio: '45:64',
        parentAssetId: automatonForearmId,
        parentJoint: 'elbowBearing',
        childJoint: 'wristAssembly',
        anchor: { x: 0.5, y: 0.5 },
        referenceBounds: { x: 270, y: 380, width: 710, height: 850 },
        rotationLimits: { min: -0.48, max: 0.48 },
        zIndex: 50,
        required: true,
        framing: 'Piston and hose overlay aligned over the casing with overlap at both sockets.',
      }),
      layer({
        fighterId: 'practice-automaton',
        layerId: 'contact-shadow',
        kind: 'overlay',
        width: 1024,
        height: 512,
        aspectRatio: '2:1',
        parentAssetId: automatonUpperId,
        parentJoint: 'elbowBearing',
        anchor: { x: 0.5, y: 0.5 },
        referenceBounds: { x: 340, y: 990, width: 720, height: 330 },
        rotationLimits: { min: -0.32, max: 0.32 },
        zIndex: 10,
        required: false,
        framing: 'Soft mechanical elbow/table contact shadow with transparent falloff.',
      }),
      layer({
        fighterId: 'practice-automaton',
        layerId: 'pressure-highlight',
        kind: 'overlay',
        width: 900,
        height: 1200,
        aspectRatio: '3:4',
        parentAssetId: automatonForearmId,
        parentJoint: 'elbowBearing',
        childJoint: 'wristAssembly',
        anchor: { x: 0.5, y: 0.5 },
        referenceBounds: { x: 300, y: 400, width: 650, height: 800 },
        rotationLimits: { min: -0.48, max: 0.48 },
        zIndex: 70,
        required: false,
        framing: 'Sparse cyan pressure-light overlay matching the casing silhouette.',
      }),
    ],
  },
};

export const PHASE3_4_REQUIRED_RIG_ASSET_IDS = Object.values(PHASE3_4_BATTLE_RIGS).flatMap((rig) =>
  rig.layers.filter((entry) => entry.requiredForPremiumPair).map((entry) => entry.assetId),
);

export const PHASE3_4_OPTIONAL_RIG_ASSET_IDS = Object.values(PHASE3_4_BATTLE_RIGS).flatMap((rig) =>
  rig.layers.filter((entry) => !entry.requiredForPremiumPair).map((entry) => entry.assetId),
);

export function isCompletePremiumRigPair(
  availability: Readonly<Record<string, 'final' | 'missing-final' | undefined>>,
): boolean {
  return PHASE3_4_REQUIRED_RIG_ASSET_IDS.every((assetId) => availability[assetId] === 'final');
}
