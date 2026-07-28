'use client';

import { cn } from '@armz-clash/ui';
import { premiumViewportForWidth, resolvePremiumAsset } from '@armz-clash/game-core';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePremiumAssetManifest } from '../assets/PremiumAssetProvider';

export function PremiumArt({
  assetId,
  alt,
  className,
  imageClassName,
  fit = 'contain',
  priority = false,
  showStatus = false,
}: {
  assetId: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  fit?: 'contain' | 'cover';
  priority?: boolean;
  showStatus?: boolean;
}) {
  const { manifest } = usePremiumAssetManifest();
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [forceFallback, setForceFallback] = useState(false);
  const entry = manifest.assets[assetId];

  useEffect(() => {
    const update = () => setViewport(premiumViewportForWidth(window.innerWidth));
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => setForceFallback(false), [entry?.contentHash, assetId]);

  const resolved = entry ? resolvePremiumAsset(entry, viewport) : null;
  const useFinal = Boolean(resolved?.isFinal && !forceFallback);
  const source = useFinal ? resolved?.url : resolved?.fallbackUrl;
  const status = useFinal ? 'final' : 'temporary-placeholder';

  return (
    <div
      className={cn('phase34-art', className)}
      data-asset-id={assetId}
      data-asset-status={status}
    >
      {source ? (
        <Image
          src={source}
          alt={alt}
          fill
          sizes="(max-width: 767px) 50vw, (max-width: 1180px) 40vw, 33vw"
          className={cn('phase34-art__image', imageClassName)}
          style={{ objectFit: fit }}
          priority={priority}
          unoptimized
          draggable={false}
          onError={() => {
            if (useFinal && resolved?.fallbackUrl) setForceFallback(true);
          }}
        />
      ) : (
        <div className="phase34-art__missing" role="img" aria-label={alt}>
          <span>Final art slot</span>
          <strong>{assetId}</strong>
          <small>Awaiting owner PNG/WebP</small>
        </div>
      )}
      {showStatus && status !== 'final' ? (
        <span className="phase34-art__status">Temporary art · final asset pending</span>
      ) : null}
    </div>
  );
}

export function RookieArt({
  role,
  ...props
}: Omit<Parameters<typeof PremiumArt>[0], 'assetId'> & {
  role: 'hero' | 'portrait' | 'versus' | 'battle-side' | 'result-victory' | 'result-defeat';
}) {
  return <PremiumArt assetId={`rookie-brawler/${role}`} {...props} />;
}

export function AutomatonArt({
  role,
  ...props
}: Omit<Parameters<typeof PremiumArt>[0], 'assetId'> & {
  role: 'hero' | 'portrait' | 'versus' | 'battle-side' | 'result-victory' | 'result-defeat';
}) {
  return <PremiumArt assetId={`practice-automaton/${role}`} {...props} />;
}
