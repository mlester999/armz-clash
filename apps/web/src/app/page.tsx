import {
  Badge,
  Card,
  Cluster,
  DevelopmentNotice,
  FeatureFlagBadge,
  FeatureUnavailable,
  Grid,
  NetworkBadge,
  PageContainer,
  Section,
  Stack,
} from '@armz-clash/ui';
import { getWebPublicConfig } from '../lib/public';

export default function HomePage() {
  const config = getWebPublicConfig();

  return (
    <PageContainer>
      <Section className="pt-2">
        <Stack gap="lg">
          <Cluster gap="sm">
            <Badge variant="warning">{config.phaseLabel}</Badge>
            <NetworkBadge network={config.networkLabel} />
            <Badge variant="success">Real-value systems disabled</Badge>
          </Cluster>

          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--armz-accent)]">
              ARMZ CLASH
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Premium Solana arm-wrestling, built testnet-first.
            </h1>
            <p className="text-base leading-relaxed text-[var(--armz-text-secondary)] sm:text-lg">
              Collect original ARMZ, choose your opponent, and clash in a cinematic arena. Rewards
              are probabilistic gameplay outcomes funded by a limited, transparent reward treasury —
              never guaranteed, never new-player-funded obligations.
            </p>
          </div>

          <DevelopmentNotice>
            Phase 3 Demo Mode is available on the game app. Wallet authentication works on Solana
            Devnet. Minting, real rewards, claims, and marketplace settlement stay disabled until
            later phases with explicit owner approval.
          </DevelopmentNotice>

          <Grid cols={3}>
            <Card className="space-y-3 p-5">
              <h3 className="font-semibold">Play Demo</h3>
              <p className="text-xs uppercase tracking-wide text-[var(--armz-accent)]">Phase 3</p>
              <p className="text-sm text-[var(--armz-text-secondary)]">
                Temporary Common ARMZ and simulated Easy battles — no wallet required, no real
                value.
              </p>
              <a
                href={
                  process.env.NEXT_PUBLIC_ARMZ_GAME_URL
                    ? `${process.env.NEXT_PUBLIC_ARMZ_GAME_URL.replace(/\/$/, '')}/demo`
                    : 'http://127.0.0.1:3001/demo'
                }
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--armz-accent)] px-4 text-sm font-semibold text-[#0b0e14]"
                data-testid="web-play-demo"
              >
                Open Demo Mode
              </a>
            </Card>
            <Card className="space-y-3 p-5">
              <h3 className="font-semibold">Connect Wallet</h3>
              <p className="text-xs uppercase tracking-wide text-[var(--armz-accent)]">Phase 2</p>
              <p className="text-sm text-[var(--armz-text-secondary)]">
                Reown AppKit Solana Devnet wallet connection and signed authentication.
              </p>
            </Card>
            <FeatureUnavailable
              title="Marketplace"
              phaseHint="Phase 9"
              description="Player listings and settlement are unavailable. Browse UI will return in a later phase."
            />
          </Grid>
        </Stack>
      </Section>

      <Section title="How it will work" description="High-level player journey for later phases.">
        <Grid cols={2}>
          {[
            [
              '1. Collect an ARMZ',
              'Mint or acquire collectible arms with distinct rarity identities.',
            ],
            ['2. Choose an opponent', 'Select Easy, Normal, or Hard difficulty for a clash.'],
            [
              '3. Watch the battle',
              'Server-authoritative outcomes presented with premium animation.',
            ],
            [
              '4. Probabilistic rewards',
              'Eligible wins may grant gameplay rewards within treasury budgets — never guaranteed.',
            ],
            [
              '5. Claim when eligible',
              'Auditable claim ledger with transparent fee rules (later).',
            ],
            [
              '6. Trade carefully',
              'Marketplace trading with fees and ownership verification (later).',
            ],
          ].map(([title, body]) => (
            <Card key={title} className="space-y-2 p-5">
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-[var(--armz-text-secondary)]">{body}</p>
            </Card>
          ))}
        </Grid>
      </Section>

      <Section
        title="Transparent economy posture"
        description="Foundation commitments, not live markets."
      >
        <Card className="space-y-4 p-5 sm:p-6">
          <ul className="grid gap-3 text-sm text-[var(--armz-text-secondary)] md:grid-cols-2">
            <li>Limited reward treasury with liability tracking</li>
            <li>No guaranteed ROI, payback, or fixed earnings</li>
            <li>Versioned economy configuration</li>
            <li>Emergency pause controls for real-value systems</li>
            <li>Demo Mode remains available when real-value systems pause</li>
            <li>Mainnet disabled by default</li>
          </ul>
          <Cluster gap="sm">
            <FeatureFlagBadge name="demo" enabled={config.features.demoModeEnabled} />
            <FeatureFlagBadge name="mint" enabled={config.features.realMintEnabled} />
            <FeatureFlagBadge name="rewards" enabled={config.features.realRewardsEnabled} />
            <FeatureFlagBadge name="claims" enabled={config.features.claimsEnabled} />
            <FeatureFlagBadge name="market" enabled={config.features.marketplaceEnabled} />
            <FeatureFlagBadge name="mainnet" enabled={config.features.mainnetEnabled} />
          </Cluster>
          <p className="text-xs text-[var(--armz-text-muted)]">
            Token display symbol is centralized as {config.tokenDisplay} and can be renamed via
            configuration without hardcoding across the UI.
          </p>
        </Card>
      </Section>
    </PageContainer>
  );
}
