import Link from 'next/link';
import { Button } from '@armz-clash/ui';
import { GameAuthPanel } from '../components/game-auth-panel';
import { WalletCta } from '../components/wallet-cta';
import { AutomatonArt, RookieArt } from '../features/demo/art/PremiumArt';

const flow = [
  {
    number: '01',
    title: 'Meet your contender',
    body: 'Reveal the temporary Level 1 Rookie Brawler built for this flagship demo.',
  },
  {
    number: '02',
    title: 'Read the matchup',
    body: 'Inspect Control stats and face the Easy Practice Automaton.',
  },
  {
    number: '03',
    title: 'Watch the pin',
    body: 'A server-authoritative clash resolves in about eleven seconds.',
  },
] as const;

export default function GameHomePage() {
  return (
    <main className="phase34-landing">
      <section className="phase34-landing-hero" aria-labelledby="landing-title">
        <div className="phase34-landing-hero__atmosphere" aria-hidden />

        <div className="phase34-landing-fighter phase34-landing-fighter--player">
          <RookieArt
            role="hero"
            alt="Rookie Brawler, the player's flagship ARMZ fighter"
            priority
            showStatus
            imageClassName="phase34-landing-fighter__image"
          />
          <div className="phase34-fighter-label phase34-fighter-label--player">
            <span>Your contender</span>
            <strong>Rookie Brawler</strong>
          </div>
        </div>

        <div className="phase34-landing-copy">
          <p className="phase34-eyebrow">The grip decides everything</p>
          <h1 id="landing-title" className="armz-display">
            Own the table.
            <span>Win the clash.</span>
          </h1>
          <p className="phase34-landing-lede">
            Enter a cinematic arm-wrestling demo where every surge, counter, and final slam is
            driven by a truthful server result.
          </p>
          <div className="phase34-landing-actions">
            <Link href="/demo" data-testid="play-demo-link">
              <Button size="lg" className="phase34-play-cta">
                Play Demo
              </Button>
            </Link>
            <WalletCta />
          </div>
          <div className="phase34-landing-safety">
            <span>Demo Mode</span>
            <span>No wallet required</span>
            <span>Simulated rewards only</span>
          </div>
          <p className="phase34-landing-fineprint" data-testid="dev-health">
            No monetary value · not claimable · not transferable · no staking · Devnet
          </p>
        </div>

        <div className="phase34-landing-fighter phase34-landing-fighter--opponent">
          <AutomatonArt
            role="hero"
            alt="Practice Automaton, the Easy training opponent"
            priority
            showStatus
            imageClassName="phase34-landing-fighter__image"
          />
          <div className="phase34-fighter-label phase34-fighter-label--opponent">
            <span>Easy opponent</span>
            <strong>Practice Automaton</strong>
          </div>
        </div>

        <div className="phase34-match-band" aria-label="Flagship matchup">
          <span>Rookie Brawler</span>
          <b>VS</b>
          <span>Practice Automaton</span>
        </div>
      </section>

      <section className="phase34-landing-flow" aria-labelledby="demo-flow-title">
        <div className="phase34-landing-flow__intro">
          <p className="phase34-eyebrow">One premium vertical slice</p>
          <h2 id="demo-flow-title" className="armz-display">
            From reveal to final slam
          </h2>
          <p>Fast to enter, easy to read, and always honest about the simulated-only outcome.</p>
        </div>
        <ol className="phase34-flow-track">
          {flow.map((item) => (
            <li key={item.number}>
              <span>{item.number}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="phase34-landing-auth" aria-label="Optional wallet access">
        <div>
          <p className="phase34-eyebrow">Wallet optional</p>
          <h2 className="armz-display">Practice first. Connect when you want.</h2>
          <p>
            The flagship demo needs no wallet and creates no blockchain asset. Wallet authentication
            remains available for Devnet identity testing only.
          </p>
        </div>
        <GameAuthPanel />
      </section>

      <section className="phase34-locked-roadmap" aria-label="Unavailable future features">
        <p>
          Marketplace, claims, real minting, mainnet, and other real-value systems remain
          intentionally locked. Phase 4 has not started.
        </p>
        <Link href="/demo">
          <Button variant="ghost">Enter the Arena</Button>
        </Link>
      </section>
    </main>
  );
}
