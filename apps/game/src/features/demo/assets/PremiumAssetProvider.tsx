'use client';

import {
  PHASE3_4_ASSET_SLOTS,
  PHASE3_4_DEPRECATED_FINAL_ASSET_IDS,
  PHASE3_4_MANIFEST_VERSION,
  PHASE3_4_REQUIRED_ASSET_SLOTS,
  PHASE3_4_TIER_A_ASSET_IDS,
  PHASE3_4_TIER_B_ASSET_IDS,
  PHASE3_4_TIER_C_ASSET_IDS,
  loadPremiumAssetManifest,
  premiumViewportForWidth,
  resolvePremiumAsset,
  type PremiumAssetEntry,
  type PremiumAssetManifest,
} from '@armz-clash/game-core';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

function runtimeSet(stem: string, extension: 'webp' | 'png') {
  const prefix = `/assets/game/phase3-4/final/${stem}`;
  return {
    desktop: `${prefix}@2x.${extension}`,
    tablet: `${prefix}@2x.${extension}`,
    mobile: `${prefix}@1x.${extension}`,
  };
}

function compiledFallbackManifest(): PremiumAssetManifest {
  const assets: Record<string, PremiumAssetEntry> = {};
  for (const contract of PHASE3_4_ASSET_SLOTS) {
    assets[contract.assetId] = {
      ...contract,
      density: [1, 2],
      viewportUsage: [...contract.viewportUsage],
      poseUsage: [...contract.poseUsage],
      productionCallSites: [...contract.productionCallSites],
      visualMatchAssetIds: [...contract.visualMatchAssetIds],
      availability: 'missing-final',
      final: runtimeSet(contract.runtimeStem, 'webp'),
      pngFallback: runtimeSet(contract.runtimeStem, 'png'),
      sourcePath: `apps/game/assets/phase3-4/final/${contract.sourceStem}.{png|webp}`,
      sourceFormat: null,
      contentHash: null,
    };
  }
  return {
    version: PHASE3_4_MANIFEST_VERSION,
    generatedBy: 'scripts/build-phase34-assets.ts',
    finalAssetCount: 0,
    missingFinalAssetCount: PHASE3_4_ASSET_SLOTS.length,
    requiredFinalAssetCount: PHASE3_4_REQUIRED_ASSET_SLOTS.length,
    integratedRequiredFinalAssetCount: 0,
    missingRequiredFinalAssetCount: PHASE3_4_REQUIRED_ASSET_SLOTS.length,
    optionalAssetCount: PHASE3_4_TIER_C_ASSET_IDS.length,
    fallbackVersion: 'phase3-3b-v1',
    ownerAssetStatus: 'awaiting-tier-a-assets',
    deprecatedFinalAssetIds: [...PHASE3_4_DEPRECATED_FINAL_ASSET_IDS],
    tierARequiredAssetCount: PHASE3_4_TIER_A_ASSET_IDS.length,
    tierAIntegratedAssetCount: 0,
    tierAMissingAssetCount: PHASE3_4_TIER_A_ASSET_IDS.length,
    tierBRequiredAssetCount: PHASE3_4_TIER_B_ASSET_IDS.length,
    tierBIntegratedAssetCount: 0,
    tierBMissingAssetCount: PHASE3_4_TIER_B_ASSET_IDS.length,
    tierCOptionalAssetCount: PHASE3_4_TIER_C_ASSET_IDS.length,
    tierCIntegratedAssetCount: 0,
    tierCMissingAssetCount: PHASE3_4_TIER_C_ASSET_IDS.length,
    assets,
  };
}

type PremiumAssetContextValue = {
  manifest: PremiumAssetManifest;
  manifestLoaded: boolean;
};

const fallbackManifest = compiledFallbackManifest();
const PremiumAssetContext = createContext<PremiumAssetContextValue>({
  manifest: fallbackManifest,
  manifestLoaded: false,
});

const criticalPreloadIds = [
  'rookie-brawler/hero',
  'rookie-brawler/portrait',
  'practice-automaton/hero',
  'practice-automaton/portrait',
  'arena/background',
] as const;

export function PremiumAssetProvider({ children }: { children: ReactNode }) {
  const [manifest, setManifest] = useState<PremiumAssetManifest>(fallbackManifest);
  const [manifestLoaded, setManifestLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void loadPremiumAssetManifest()
      .then((next) => {
        if (!active) return;
        setManifest(next);
        setManifestLoaded(true);
        const viewport = premiumViewportForWidth(window.innerWidth);
        for (const assetId of criticalPreloadIds) {
          const entry = next.assets[assetId];
          if (!entry) continue;
          const resolved = resolvePremiumAsset(entry, viewport);
          if (!resolved.url) continue;
          const image = new Image();
          image.decoding = 'async';
          image.src = resolved.url;
        }
      })
      .catch(() => {
        if (active) setManifestLoaded(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ manifest, manifestLoaded }), [manifest, manifestLoaded]);
  return <PremiumAssetContext.Provider value={value}>{children}</PremiumAssetContext.Provider>;
}

export function usePremiumAssetManifest(): PremiumAssetContextValue {
  return useContext(PremiumAssetContext);
}
