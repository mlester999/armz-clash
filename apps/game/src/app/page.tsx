import Link from 'next/link';
import {
  Card,
  DevelopmentNotice,
  EmptyState,
  FeatureUnavailable,
  Grid,
  PageContainer,
  Section,
  Stack,
} from '@armz-clash/ui';
import { GameAuthPanel } from '../components/game-auth-panel';

export default function GameHomePage() {
  return (
    <PageContainer width="2xl">
      <Section className="pt-2">
        <Stack gap="lg">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Game shell</h1>
            <p className="text-[var(--armz-text-secondary)]">
              Phase 3 Demo Mode is live: temporary Common ARMZ, Easy simulated battles, and
              server-authoritative results. Wallet auth remains optional for demo play.
            </p>
          </div>

          <DevelopmentNotice>
            Network: Solana Devnet. Real mint, rewards, claims, marketplace settlement, and mainnet
            remain disabled. Demo rewards are simulated only and never claimable.
          </DevelopmentNotice>

          <Card className="space-y-4 p-6" data-testid="play-demo-cta">
            <h2 className="text-xl font-semibold">Play Demo</h2>
            <p className="text-sm text-[var(--armz-text-secondary)]">
              No wallet required. Temporary Level 1 Common ARMZ. Simulated Easy fight. Simulated
              Demo $ARMZ with no monetary value.
            </p>
            <Link
              href="/demo"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--armz-accent)] px-5 text-sm font-semibold text-[#0b0e14] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--armz-cyan)]"
              data-testid="play-demo-link"
            >
              Play Demo
            </Link>
          </Card>

          <GameAuthPanel />

          <EmptyState
            title="Real gameplay systems remain gated"
            description="Use Play Demo above for free practice. Phase 4 introduces real ARMZ collection. No fake real balances are shown."
          />

          <Grid cols={2}>
            <FeatureUnavailable
              title="Fight (real ARMZ)"
              phaseHint="Phase 5+"
              description="Server-authoritative Easy, Normal, and Hard battles for owned ARMZ are not implemented."
            />
            <FeatureUnavailable
              title="Collection (owned)"
              phaseHint="Phase 4"
              description="Real ARMZ inventory, rarity presentation, and energy systems are not implemented."
            />
            <FeatureUnavailable
              title="Claim Rewards"
              phaseHint="Phase 8"
              description="Claimable ledger and on-chain claims are disabled."
            />
            <Card className="space-y-2 p-5">
              <h3 className="font-semibold">Demo Mode</h3>
              <p className="text-xs uppercase tracking-wide text-[var(--armz-accent)]">Phase 3</p>
              <p className="text-sm text-[var(--armz-text-secondary)]">
                Free demo battles with temporary Common ARMZ are available now.
              </p>
              <Link href="/demo" className="text-sm font-medium text-[var(--armz-cyan)] underline">
                Open Demo Mode
              </Link>
            </Card>
          </Grid>

          <Card className="p-4 text-xs text-[var(--armz-text-muted)]" data-testid="dev-health">
            Phase 3 Demo Mode foundation · no staking · real-value systems disabled
          </Card>
        </Stack>
      </Section>
    </PageContainer>
  );
}
