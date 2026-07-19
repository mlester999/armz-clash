import type { Metadata } from 'next';
import {
  Badge,
  Card,
  Cluster,
  FeatureFlagBadge,
  NetworkBadge,
  PageContainer,
  Section,
  Stack,
} from '@armz-clash/ui';
import { getWebPublicConfig } from '../../lib/public';

export const metadata: Metadata = {
  title: 'Status',
};

export default function StatusPage() {
  const config = getWebPublicConfig();

  return (
    <PageContainer width="lg">
      <Section
        title="System status"
        description="Foundation indicators only — not live ops telemetry."
      >
        <Stack>
          <Cluster gap="sm">
            <Badge variant="warning">{config.phaseLabel}</Badge>
            <NetworkBadge network={config.networkLabel} />
            <Badge variant={config.realValueSystemsDisabled ? 'success' : 'danger'}>
              {config.realValueSystemsDisabled
                ? 'Real-value systems disabled'
                : 'Real-value flags require review'}
            </Badge>
          </Cluster>
          <Card className="space-y-4 p-5">
            <h3 className="font-semibold">Feature flags (public display)</h3>
            <Cluster gap="sm">
              <FeatureFlagBadge name="demo_mode" enabled={config.features.demoModeEnabled} />
              <FeatureFlagBadge name="real_mint" enabled={config.features.realMintEnabled} />
              <FeatureFlagBadge name="real_rewards" enabled={config.features.realRewardsEnabled} />
              <FeatureFlagBadge name="claims" enabled={config.features.claimsEnabled} />
              <FeatureFlagBadge name="marketplace" enabled={config.features.marketplaceEnabled} />
              <FeatureFlagBadge
                name="market_settlement"
                enabled={config.features.marketplaceSettlementEnabled}
              />
              <FeatureFlagBadge name="oracle" enabled={config.features.oracleEnabled} />
              <FeatureFlagBadge name="mainnet" enabled={config.features.mainnetEnabled} />
            </Cluster>
            <p className="text-sm text-[var(--armz-text-muted)]">{config.phaseNote}</p>
          </Card>
          {process.env.NODE_ENV === 'development' ? (
            <Card className="p-4 text-xs text-[var(--armz-text-muted)]" data-testid="dev-health">
              Development health indicator: web app render OK · env={config.environment} · version=
              {config.appVersion}
            </Card>
          ) : null}
        </Stack>
      </Section>
    </PageContainer>
  );
}
