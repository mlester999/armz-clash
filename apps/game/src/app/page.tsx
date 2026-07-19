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
              Phase 2 enables Solana Devnet wallet connection and signed authentication. Fight,
              collection, rewards, and marketplace remain unavailable.
            </p>
          </div>

          <DevelopmentNotice>
            Network: Solana Devnet. Real mint, rewards, claims, marketplace settlement, and mainnet
            remain disabled. Demo Mode arrives in Phase 3.
          </DevelopmentNotice>

          <GameAuthPanel />

          <EmptyState
            title="Gameplay is not available yet"
            description="Use Connect Wallet and Sign in above. Phase 3 introduces Demo Mode. No fake balances or rewards are shown."
          />

          <Grid cols={2}>
            <FeatureUnavailable
              title="Fight"
              phaseHint="Phase 5+"
              description="Server-authoritative Easy, Normal, and Hard battles are not implemented."
            />
            <FeatureUnavailable
              title="Collection"
              phaseHint="Phase 4"
              description="ARMZ inventory, rarity presentation, and energy systems are not implemented."
            />
            <FeatureUnavailable
              title="Claim Rewards"
              phaseHint="Phase 8"
              description="Claimable ledger and on-chain claims are disabled."
            />
            <FeatureUnavailable
              title="Demo Mode"
              phaseHint="Phase 3"
              description="Free demo battles with temporary Common ARMZ arrive next."
            />
          </Grid>

          <Card className="p-4 text-xs text-[var(--armz-text-muted)]" data-testid="dev-health">
            Phase 2 wallet authentication foundation · no staking · real-value systems disabled
          </Card>
        </Stack>
      </Section>
    </PageContainer>
  );
}
