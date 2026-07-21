'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Cluster, RarityBadge, StatGrid } from '@armz-clash/ui';
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
    <div
      className="relative mx-auto max-w-2xl overflow-hidden rounded-[var(--armz-radius-xl)] border border-[rgba(212,175,106,0.3)] bg-[linear-gradient(170deg,rgba(20,28,44,0.98),rgba(7,11,18,0.99))] p-5 shadow-[var(--armz-shadow-glow)] sm:p-7"
      data-testid="demo-armz-reveal"
    >
      {/* Arena light sweep */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0 bg-[radial-gradient(500px_350px_at_50%_25%,rgba(212,175,106,0.1),transparent_60%)]"
          style={{
            opacity: step >= 1 ? 1 : 0,
            transition: reducedMotion ? undefined : 'opacity 400ms ease',
          }}
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(300px_200px_at_50%_40%,rgba(94,200,255,0.06),transparent_55%)]"
          style={{
            opacity: step >= 3 ? 1 : 0,
            transition: reducedMotion ? undefined : 'opacity 500ms ease',
          }}
        />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Badges */}
        <Cluster gap="sm">
          <Badge variant="warning">Demo Mode</Badge>
          <Badge variant="muted">Temporary</Badge>
          {step >= 5 && <RarityBadge rarity="common" />}
          {step >= 6 && <Badge variant="muted">Level 1</Badge>}
        </Cluster>

        {/* Character art */}
        <div
          className="overflow-hidden rounded-[var(--armz-radius-lg)] border border-[rgba(212,175,106,0.15)] bg-[rgba(0,0,0,0.25)]"
          style={{
            opacity: step >= 1 ? 1 : 0.2,
            transform: step >= 2 ? 'scale(1)' : 'scale(0.94)',
            transition: reducedMotion
              ? undefined
              : 'opacity 350ms ease, transform 400ms var(--armz-ease-out)',
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
            <div className="flex h-56 items-center justify-center text-sm text-[var(--armz-text-muted)]">
              Materializing temporary ARMZ{'\u2026'}
            </div>
          )}
        </div>

        {/* Name + tagline */}
        {step >= 4 && (
          <div
            className="space-y-1"
            style={{
              opacity: 1,
              animation: reducedMotion ? undefined : 'armz-fade-up 350ms var(--armz-ease-out)',
            }}
          >
            <p className="armz-kicker">Temporary Common acquired</p>
            <h2 className="armz-display text-2xl sm:text-3xl">{armz.displayName}</h2>
            <p className="text-sm text-[var(--armz-text-secondary)]">{armz.tagline}</p>
          </div>
        )}

        {/* Stats */}
        {step >= 7 && (
          <div
            style={{
              opacity: 1,
              animation: reducedMotion ? undefined : 'armz-fade-up 300ms var(--armz-ease-out)',
            }}
          >
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
          </div>
        )}

        {/* Safety line */}
        {step >= 8 && (
          <p className="text-xs text-[var(--armz-text-muted)]">
            Temporary Demo ARMZ {'\u00b7'} Not transferable {'\u00b7'} Not a blockchain asset{' '}
            {'\u00b7'} Not claimable
          </p>
        )}

        {/* Actions */}
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
      </div>

      {/* Keyframe for fade-up animation */}
      <style jsx>{`
        @keyframes armz-fade-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
