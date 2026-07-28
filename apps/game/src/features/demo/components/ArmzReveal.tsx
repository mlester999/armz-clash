'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, RarityBadge } from '@armz-clash/ui';
import type { DemoArmzPublic } from '../api';
import { RookieArt } from '../art/PremiumArt';

const revealSteps = ['Signal acquired', 'Identity locked', 'Stats synchronized'] as const;

export function ArmzReveal({
  armz,
  reducedMotion,
  onContinue,
}: {
  armz: DemoArmzPublic;
  reducedMotion: boolean;
  onContinue: () => void;
}) {
  const [step, setStep] = useState(reducedMotion ? revealSteps.length : 0);

  useEffect(() => {
    if (reducedMotion) {
      setStep(revealSteps.length);
      return;
    }
    const id = window.setInterval(() => {
      setStep((current) => {
        if (current >= revealSteps.length) {
          window.clearInterval(id);
          return current;
        }
        return current + 1;
      });
    }, 360);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  return (
    <section
      className="phase34-reveal"
      data-testid="demo-armz-reveal"
      aria-labelledby="reveal-fighter-name"
    >
      <div className="phase34-reveal__beam" aria-hidden />
      <div className="phase34-reveal__art" data-reveal-ready={step >= 1 ? 'true' : 'false'}>
        <RookieArt
          role="hero"
          alt={`${armz.displayName} flagship reveal art`}
          priority
          showStatus
          imageClassName="phase34-reveal__fighter-image"
        />
      </div>

      <div className="phase34-reveal__content">
        <div className="phase34-reveal__topline">
          <Badge variant="warning">Demo Mode</Badge>
          <RarityBadge rarity="common" />
          <Badge variant="muted">Level 1</Badge>
        </div>
        <p className="phase34-eyebrow">Flagship contender acquired</p>
        <h2 id="reveal-fighter-name" className="armz-display">
          {armz.displayName}
        </h2>
        <p className="phase34-reveal__tagline">{armz.tagline}</p>

        <div className="phase34-reveal__sync" aria-live="polite">
          {revealSteps.map((label, index) => (
            <span key={label} data-complete={step > index ? 'true' : 'false'}>
              <i aria-hidden /> {label}
            </span>
          ))}
        </div>

        <dl className="phase34-reveal__stats">
          {[
            ['Power', armz.power],
            ['Grip', armz.grip],
            ['Technique', armz.technique],
            ['Endurance', armz.endurance],
            ['Defense', armz.defense],
            ['Speed', armz.speed],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="phase34-reveal__footer">
          <p>Temporary demo ARMZ · not transferable · not a blockchain asset</p>
          <Button
            size="lg"
            onClick={onContinue}
            disabled={step < revealSteps.length && !reducedMotion}
          >
            Continue to Collection
          </Button>
        </div>
      </div>
    </section>
  );
}
