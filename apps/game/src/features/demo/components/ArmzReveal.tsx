'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, Cluster, RarityBadge, StatGrid } from '@armz-clash/ui';
import type { DemoArmzPublic } from '../api';
import { ArmzPortrait } from '../art/ArmzPortrait';

export function ArmzReveal({
  armz,
  reducedMotion,
  onContinue,
}: {
  armz: DemoArmzPublic;
  reducedMotion: boolean;
  onContinue: () => void;
}) {
  const [step, setStep] = useState(0);
  const max = 9;

  useEffect(() => {
    if (reducedMotion) {
      setStep(max);
      return;
    }
    const id = window.setInterval(() => {
      setStep((s) => Math.min(max, s + 1));
    }, 320);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  return (
    <Card premium className="mx-auto max-w-2xl space-y-4 p-5 sm:p-6" data-testid="demo-armz-reveal">
      <Cluster gap="sm">
        <Badge variant="warning">Demo Mode</Badge>
        <Badge variant="muted">Temporary</Badge>
        {step >= 5 && <RarityBadge rarity="common" />}
        {step >= 6 && <Badge variant="muted">Level 1</Badge>}
      </Cluster>

      <div
        className="overflow-hidden rounded-[var(--armz-radius-lg)]"
        style={{
          opacity: step >= 1 ? 1 : 0.3,
          transform: step >= 2 ? 'scale(1)' : 'scale(0.96)',
          transition: reducedMotion ? undefined : 'opacity 280ms ease, transform 320ms ease',
        }}
      >
        {step >= 2 ? (
          <ArmzPortrait
            presetKey={armz.presetKey}
            displayName={armz.displayName}
            palette={armz.palette}
            size="lg"
          />
        ) : (
          <div className="flex h-56 items-center justify-center bg-[rgba(0,0,0,0.35)] text-sm text-[var(--armz-text-muted)]">
            Materializing temporary ARMZ…
          </div>
        )}
      </div>

      {step >= 4 && (
        <div className="space-y-1">
          <p className="armz-kicker">Temporary Common acquired</p>
          <h2 className="armz-display text-2xl sm:text-3xl">{armz.displayName}</h2>
          <p className="text-sm text-[var(--armz-text-secondary)]">{armz.tagline}</p>
        </div>
      )}

      {step >= 7 && (
        <StatGrid
          stats={[
            { label: 'Power', value: armz.power, primary: true },
            { label: 'Grip', value: armz.grip, primary: true },
            { label: 'Technique', value: armz.technique },
            { label: 'Endurance', value: armz.endurance },
            { label: 'Defense', value: armz.defense },
            { label: 'Speed', value: armz.speed },
            { label: 'Luck', value: armz.luck, max: 30 },
            { label: 'Crit (bps)', value: armz.criticalChance, max: 2000, format: 'bps' },
          ]}
        />
      )}

      {step >= 8 && (
        <p className="text-xs text-[var(--armz-text-muted)]">
          Temporary Demo ARMZ · Not transferable · Not a blockchain asset · Not claimable
        </p>
      )}

      <Cluster>
        {step < max && !reducedMotion && (
          <Button variant="ghost" onClick={() => setStep(max)}>
            Skip reveal
          </Button>
        )}
        {step >= max && (
          <Button size="lg" onClick={onContinue} data-testid="demo-reveal-continue">
            Continue to Demo Collection
          </Button>
        )}
      </Cluster>
    </Card>
  );
}
