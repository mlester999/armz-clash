'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card } from '@armz-clash/ui';
import type { DemoArmzPublic } from '../api';

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
    }, 400);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const palette = armz.palette;
  const bg = palette ? `#${palette.primaryCloth}` : '#1a1f2a';
  const skin = palette ? `#${palette.skinTone}` : '#c48a6a';
  const accent = palette ? `#${palette.accent}` : '#d4af6a';
  const glove = palette ? `#${palette.glove}` : '#2a221c';

  return (
    <Card className="mx-auto max-w-xl space-y-5 p-6" data-testid="demo-armz-reveal">
      <div className="flex flex-wrap gap-2">
        <Badge variant="warning">Demo Mode</Badge>
        <Badge variant="muted">Temporary</Badge>
        {step >= 5 && <Badge variant="info">Common</Badge>}
        {step >= 6 && <Badge variant="muted">Level 1</Badge>}
      </div>

      <div
        className="relative flex h-56 items-center justify-center overflow-hidden rounded-[var(--armz-radius-lg)] border border-[var(--armz-border)]"
        style={{ background: `radial-gradient(circle at 50% 40%, ${accent}33, ${bg})` }}
        aria-hidden={step < 2}
      >
        {step >= 1 && (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(circle, ${accent}55 0%, transparent 60%)`,
            }}
          />
        )}
        {step >= 2 && (
          <div className="relative h-40 w-28">
            <div
              className="absolute bottom-4 left-1/2 h-28 w-10 -translate-x-1/2 rounded-full"
              style={{ background: skin }}
            />
            <div
              className="absolute bottom-16 left-1/2 h-8 w-14 -translate-x-1/2 rounded-md"
              style={{ background: glove }}
            />
            <div
              className="absolute bottom-20 left-1/2 h-3 w-12 -translate-x-1/2 rounded"
              style={{ background: accent }}
            />
          </div>
        )}
      </div>

      {step >= 4 && (
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">{armz.displayName}</h2>
          <p className="text-sm text-[var(--armz-text-secondary)]">{armz.tagline}</p>
        </div>
      )}

      {step >= 7 && (
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {(
            [
              ['Power', armz.power],
              ['Grip', armz.grip],
              ['Technique', armz.technique],
              ['Endurance', armz.endurance],
              ['Defense', armz.defense],
              ['Speed', armz.speed],
              ['Luck', armz.luck],
              ['Crit (bps)', armz.criticalChance],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="rounded-md border border-[var(--armz-border)] px-3 py-2">
              <dt className="text-[var(--armz-text-muted)]">{k}</dt>
              <dd className="font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {step >= 8 && (
        <p className="text-xs text-[var(--armz-text-muted)]">
          Temporary Demo ARMZ · Not transferable · Not a blockchain asset · Not claimable
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {step < max && !reducedMotion && (
          <Button variant="ghost" onClick={() => setStep(max)}>
            Skip reveal
          </Button>
        )}
        {step >= max && (
          <Button onClick={onContinue} data-testid="demo-reveal-continue">
            Continue to Demo Collection
          </Button>
        )}
      </div>
    </Card>
  );
}
