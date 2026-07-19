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
import { getGamePublicConfig } from '../lib/public';

export default function GameHomePage() {
  const config = getGamePublicConfig();

  return (
    <PageContainer width="2xl">
      <Section className="pt-2">
        <Stack gap="lg">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Game shell</h1>
            <p className="text-[var(--armz-text-secondary)]">
              Connected-player dashboard, fight flow, collection, battles, rewards, and claims are
              not active in Phase 1. This shell establishes layout, spacing, and status indicators.
            </p>
          </div>

          <DevelopmentNotice>
            Network: {config.networkLabel}. Token display: {config.tokenDisplay}. Real mint,
            rewards, claims, marketplace settlement, and mainnet are disabled by default.
          </DevelopmentNotice>

          <EmptyState
            title="Gameplay is not available yet"
            description="Phase 3 introduces Demo Mode. Phase 5 introduces server-authoritative battles. No fake balances, rewards, or collection data are shown here."
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
              title="Wallet"
              phaseHint="Phase 2"
              description="Reown AppKit connection and signed authentication are not active."
            />
          </Grid>

          {process.env.NODE_ENV === 'development' ? (
            <Card className="p-4 text-xs text-[var(--armz-text-muted)]" data-testid="dev-health">
              Development health indicator: game shell OK · {config.phaseLabel}
            </Card>
          ) : null}
        </Stack>
      </Section>
    </PageContainer>
  );
}
