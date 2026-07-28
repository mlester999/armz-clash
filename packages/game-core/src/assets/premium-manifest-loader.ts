import type {
  PremiumAssetEntry,
  PremiumAssetManifest,
  PremiumAssetViewport,
} from './premium-asset-manifest.types';
import { PHASE3_4_MANIFEST_PATH } from './phase34-asset-contract';

export type ResolvedPremiumAsset = {
  url: string | null;
  fallbackUrl: string | null;
  isFinal: boolean;
  availability: PremiumAssetEntry['availability'];
};

export async function loadPremiumAssetManifest(
  fetchImpl: typeof fetch = fetch,
  path = PHASE3_4_MANIFEST_PATH,
): Promise<PremiumAssetManifest> {
  const response = await fetchImpl(path);
  if (!response.ok) {
    throw new Error(`Premium asset manifest unavailable (${response.status})`);
  }
  return (await response.json()) as PremiumAssetManifest;
}

export function resolvePremiumAsset(
  entry: PremiumAssetEntry,
  viewport: PremiumAssetViewport,
  format: 'webp' | 'png' = 'webp',
): ResolvedPremiumAsset {
  const finalSet = format === 'png' ? entry.pngFallback : entry.final;
  const finalUrl = finalSet[viewport];
  const fallbackUrl = entry.fallback?.[viewport] ?? null;
  if (entry.availability === 'final') {
    return {
      url: finalUrl,
      fallbackUrl,
      isFinal: true,
      availability: entry.availability,
    };
  }
  return {
    url: fallbackUrl,
    fallbackUrl,
    isFinal: false,
    availability: entry.availability,
  };
}

export function premiumViewportForWidth(width: number): PremiumAssetViewport {
  if (width < 768) return 'mobile';
  if (width < 1180) return 'tablet';
  return 'desktop';
}
