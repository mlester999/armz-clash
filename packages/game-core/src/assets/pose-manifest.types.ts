/**
 * Phase 3.3B â€” typed pose + rig manifests.
 *
 * Describes `pose-manifest.json` and `rig-manifest.json` emitted by the asset
 * build. The pose manifest drives authored battle-state interpolation; the rig
 * manifest describes the FK bone hierarchy for each upgraded fighter.
 */

import type { MaterialCategory, Vec2 } from './asset-manifest.types';

export type BonePose = {
  /** Additive rotation (radians) on top of the FK angle. */
  rot?: number;
  /** Additive proximal-joint offset (scene units). */
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
  strain?: boolean;
};

export type PoseDefinition = {
  poseId: string;
  fighter: 'shared' | 'rookie-brawler' | 'practice-automaton';
  /** Additive lean bias (radians) added to the control-derived grip lean. */
  lean: number;
  /** Shoulder vertical settle (scene units, +down). */
  shoulderSettle: number;
  /** Elbow lateral flare (scene units, +outward). */
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

export type RigPartKind =
  'shoulder' | 'upperArm' | 'elbow' | 'forearm' | 'wrist' | 'hand' | 'overlay';

export type RigPart = {
  assetId: string;
  fighterId: string;
  source: string;
  kind: RigPartKind;
  anchor: Vec2;
  pivot: Vec2;
  /** Fraction along the elbow->grip axis where the proximal joint sits. */
  axisT?: number;
  /** Overlay-only: parent bone assetId. */
  parent?: string;
  /** Overlay-only: normalized offset within parent. */
  offset?: Vec2;
  /** Overlay-only: scale relative to parent bone length. */
  overlayScale?: number;
  materialCategory: MaterialCategory;
  /** Draw order within a fighter (lower draws first). */
  z: number;
};

export type CameraPreset = {
  baseZoom: number;
  gripFocusY: number;
  minFighterScale: number;
};

export type CameraPresets = {
  desktop: CameraPreset;
  tablet: CameraPreset;
  mobile: CameraPreset;
};

export type PoseManifest = {
  version: string;
  poses: PoseDefinition[];
  cueToPose: Record<string, string>;
  cameraPresets: CameraPresets;
};

export type RigManifest = {
  version: string;
  fighters: Record<string, RigPart[]>;
};
