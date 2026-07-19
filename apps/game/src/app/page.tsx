import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  DevelopmentNotice,
  FeatureUnavailable,
  Grid,
  PageContainer,
  PageHero,
  Section,
  Stack,
} from '@armz-clash/ui';
import { GameAuthPanel } from '../components/game-auth-panel';
import { AutomatonPortrait } from '../features/demo/art/ArmzPortrait';

export default function GameHomePage() {
  return (
    <PageContainer width="2xl">
      <Section className="pt-1">
        <Stack gap="md">
          <div className="grid items-stretch gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card premium className="space-y-4 p-5 sm:p-6">
              <PageHero
                kicker="Armz Clash · Phase 3"
                title="Enter the Demo Arena"
                description="Temporary Common ARMZ. Server-authoritative Easy battles. Simulated rewards only — no monetary value, no claims, no chain tx."
                badges={
                  <>
                    <Badge variant="warning">Demo Mode</Badge>
                    <Badge variant="success">Real-value disabled</Badge>
                    <Badge variant="info">Devnet</Badge>
                  </>
                }
              />
              <div className="flex flex-wrap gap-3">
                <Link href="/demo" data-testid="play-demo-link" className="inline-flex">
                  <Button size="lg">Play Demo</Button>
                </Link>
                <Link href="/demo/collection" className="inline-flex">
                  <Button variant="secondary">Demo Collection</Button>
                </Link>
              </div>
              <p className="text-xs text-[var(--armz-text-muted)]" data-testid="dev-health">
                Phase 3 Demo Mode foundation · no staking · real-value systems disabled
              </p>
            </Card>

            <Card className="flex flex-col gap-3 p-4">
              <p className="armz-kicker">Tonight&apos;s practice foe</p>
              <AutomatonPortrait size="md" />
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Practice Automaton</h2>
                <p className="text-sm text-[var(--armz-text-secondary)]">
                  Easy training enemy. Mechanical grip, fair pressure, zero real currency.
                </p>
              </div>
              <Badge variant="enemy">Easy · Simulated</Badge>
            </Card>
          </div>

          <DevelopmentNotice>
            Network: Solana Devnet. Real mint, rewards, claims, marketplace settlement, and mainnet
            remain disabled. Demo rewards are simulated only and never claimable.
          </DevelopmentNotice>

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
                body: 'Server rolls the outcome — your client plays the timeline.',
              },
            ].map((item) => (
              <Card key={item.step} className="space-y-2 p-4">
                <span className="text-xs font-bold tracking-[0.14em] text-[var(--armz-accent)]">
                  {item.step}
                </span>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-[var(--armz-text-secondary)]">{item.body}</p>
              </Card>
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
