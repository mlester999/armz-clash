import Link from 'next/link';
import {
  Badge,
  Button,
  DevelopmentNotice,
  FeatureUnavailable,
  Grid,
  PageContainer,
  Section,
  Stack,
} from '@armz-clash/ui';
import { GameAuthPanel } from '../components/game-auth-panel';
import { ArmzPortrait, AutomatonPortrait } from '../features/demo/art/ArmzPortrait';

export default function GameHomePage() {
  return (
    <PageContainer width="2xl">
      <Section className="pt-1">
        <Stack gap="md">
          {/* Cinematic Hero */}
          <div className="relative overflow-hidden rounded-[var(--armz-radius-xl)] border border-[rgba(212,175,106,0.22)] bg-[linear-gradient(170deg,rgba(20,28,44,0.97),rgba(7,11,18,0.98))] shadow-[var(--armz-shadow-glow)]">
            {/* Atmosphere layers */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div className="absolute inset-0 bg-[radial-gradient(700px_380px_at_50%_15%,rgba(94,200,255,0.08),transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(500px_300px_at_15%_85%,rgba(212,175,106,0.07),transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(500px_300px_at_85%_85%,rgba(224,122,74,0.06),transparent_55%)]" />
            </div>

            <div className="relative z-10 px-5 py-8 sm:px-8 sm:py-10">
              <div className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                {/* Left: Title + CTA */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="armz-kicker">{"Armz Clash \u00b7 Phase 3"}</p>
                    <h1 className="armz-display text-3xl sm:text-4xl lg:text-5xl">
                      Enter the Demo Arena
                    </h1>
                    <p className="max-w-md text-sm leading-relaxed text-[var(--armz-text-secondary)] sm:text-base">
                      {"Temporary Common ARMZ. Server-authoritative Easy battles. Simulated rewards only \u2014 no monetary value, no claims, no chain tx."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link href="/demo" data-testid="play-demo-link" className="inline-flex">
                      <Button size="lg">Play Demo</Button>
                    </Link>
                    <Link href="/demo/collection" className="inline-flex">
                      <Button variant="secondary">Demo Collection</Button>
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="warning">Demo Mode</Badge>
                    <Badge variant="success">Real-value disabled</Badge>
                    <Badge variant="info">Devnet</Badge>
                  </div>

                  <p className="text-xs text-[var(--armz-text-muted)]" data-testid="dev-health">
                    {"Phase 3 Demo Mode foundation \u00b7 no staking \u00b7 real-value systems disabled"}
                  </p>
                </div>

                {/* Right: Fighter showcase */}
                <div className="flex items-center justify-center gap-4">
                  <div className="w-[45%] max-w-[180px] overflow-hidden rounded-[var(--armz-radius-lg)] border border-[rgba(94,200,255,0.25)] bg-[rgba(94,200,255,0.04)] p-2 shadow-[var(--armz-shadow-cyan)]">
                    <ArmzPortrait
                      presetKey="rookie_brawler"
                      displayName="Rookie Brawler"
                      palette={{
                        skinTone: 'c48a6a',
                        primaryCloth: '3d2b22',
                        accent: 'd4af6a',
                        glove: '2a221c',
                      }}
                      size="md"
                    />
                    <p className="mt-1 text-center text-[10px] font-bold text-[var(--armz-cyan)]">Your ARMZ</p>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(212,175,106,0.4)] bg-[rgba(212,175,106,0.08)]">
                      <span className="text-xs font-bold text-[var(--armz-accent)]">VS</span>
                    </div>
                  </div>

                  <div className="w-[45%] max-w-[180px] overflow-hidden rounded-[var(--armz-radius-lg)] border border-[rgba(224,122,74,0.25)] bg-[rgba(224,122,74,0.04)] p-2 shadow-[0_0_0_1px_rgba(224,122,74,0.2),0_12px_40px_rgba(0,0,0,0.45)]">
                    <AutomatonPortrait size="md" />
                    <p className="mt-1 text-center text-[10px] font-bold text-[var(--armz-enemy)]">Automaton</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DevelopmentNotice>
            Network: Solana Devnet. Real mint, rewards, claims, marketplace settlement, and mainnet
            remain disabled. Demo rewards are simulated only and never claimable.
          </DevelopmentNotice>

          {/* How Demo Works */}
          <div data-testid="play-demo-cta" className="grid gap-3 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Receive ARMZ',
                body: 'A temporary Level 1 Common with unique visual identity.',
              },
              {
                step: '02',
                title: 'Inspect loadout',
                body: 'Collection view with stats, flavor, and safety tags.',
              },
              {
                step: '03',
                title: 'Fight Easy',
                body: 'Server rolls the outcome \u2014 your client plays the timeline.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="space-y-2 rounded-[var(--armz-radius-lg)] border border-[var(--armz-border)] bg-[var(--armz-surface)] p-4 shadow-[var(--armz-shadow-sm)]"
              >
                <span className="text-xs font-bold tracking-[0.14em] text-[var(--armz-accent)]">
                  {item.step}
                </span>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-[var(--armz-text-secondary)]">{item.body}</p>
              </div>
            ))}
          </div>

          <GameAuthPanel />

          <Grid cols={2}>
            <FeatureUnavailable
              title="Fight (real ARMZ)"
              phaseHint="Phase 5+"
              description="Owned-ARMZ Easy, Normal, and Hard battles are not implemented."
            />
            <FeatureUnavailable
              title="Collection (owned)"
              phaseHint="Phase 4"
              description="Real inventory, rarity ladder, and energy systems remain gated."
            />
            <FeatureUnavailable
              title="Claim Rewards"
              phaseHint="Phase 8"
              description="Claimable ledger and on-chain claims stay disabled."
            />
            <FeatureUnavailable
              title="Marketplace"
              phaseHint="Phase 9"
              description="Listing and settlement systems are intentionally unavailable."
            />
          </Grid>
        </Stack>
      </Section>
    </PageContainer>
  );
}