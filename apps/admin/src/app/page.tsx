import {
  Card,
  DevelopmentNotice,
  FeatureUnavailable,
  Grid,
  PageContainer,
  Section,
  Stack,
} from '@armz-clash/ui';
import { getAdminPublicConfig } from '../lib/public';

export default function AdminHomePage() {
  const config = getAdminPublicConfig();

  return (
    <PageContainer width="2xl">
      <Section className="pt-2">
        <Stack gap="lg">
          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight">Armz Clash Admin</h1>
            <p className="text-[var(--armz-text-secondary)]">
              Phase 1 establishes the admin shell, navigation placeholders, and access-control
              architecture notes. Real authentication and economy mutations are not available.
            </p>
          </div>

          <DevelopmentNotice>
            Internal development notice: do not treat this UI as an authorized control plane. No
            admin user is assigned by default. Sensitive tables remain closed by RLS.
          </DevelopmentNotice>

          <Card className="space-y-2 p-5">
            <h2 className="font-semibold">Access-control placeholder</h2>
            <p className="text-sm leading-relaxed text-[var(--armz-text-secondary)]">
              Future admin authorization will use secure role assignments (`admin_roles`,
              `admin_role_assignments`) and audited mutations. Client-controlled profile fields will
              never grant privileges. Service-role keys stay server-only.
            </p>
          </Card>

          <Grid cols={3}>
            {(
              [
                {
                  title: 'Economy',
                  description: 'Versioned config and write gates land in Phase 10.',
                },
                {
                  title: 'Treasury',
                  description: 'Treasury dashboards require live ledger data later.',
                },
                { title: 'Oracle', description: 'Oracle monitoring is not active.' },
                { title: 'Fraud', description: 'Fraud signal processing is not active.' },
                {
                  title: 'Audit Logs',
                  description: 'Append-only audit foundations exist in SQL only.',
                },
                {
                  title: 'Configuration',
                  description: 'Feature flags are environment-driven in Phase 1.',
                },
              ] as const
            ).map((item) => (
              <FeatureUnavailable
                key={item.title}
                title={item.title}
                phaseHint="Later"
                description={item.description}
              />
            ))}
          </Grid>

          <Card className="p-5 text-sm text-[var(--armz-text-muted)]">
            No fake financial numbers, player counts, or treasury balances are displayed.
            Environment: {config.environment}. Network: {config.networkLabel}.
          </Card>

          {process.env.NODE_ENV === 'development' ? (
            <Card className="p-4 text-xs text-[var(--armz-text-muted)]" data-testid="dev-health">
              Development health indicator: admin shell OK
            </Card>
          ) : null}
        </Stack>
      </Section>
    </PageContainer>
  );
}
