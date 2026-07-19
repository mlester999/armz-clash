import type { Metadata } from 'next';
import { Card, PageContainer, Section, Stack } from '@armz-clash/ui';

export const metadata: Metadata = {
  title: 'Docs',
};

export default function DocsPage() {
  return (
    <PageContainer width="lg">
      <Section
        title="Documentation"
        description="Phase 1 docs are structural. Full probability, fee, and treasury docs expand as systems ship."
      >
        <Stack>
          <Card className="space-y-3 p-5">
            <h3 className="font-semibold">Available in the repository</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--armz-text-secondary)]">
              <li>README.md — setup and phase status</li>
              <li>docs/ARCHITECTURE.md — monorepo boundaries</li>
              <li>docs/SECURITY.md — threat model foundation</li>
              <li>docs/ECONOMY_SAFETY.md — no guaranteed rewards posture</li>
              <li>docs/DEVELOPMENT.md — developer workflow</li>
            </ul>
          </Card>
          <Card className="p-5 text-sm text-[var(--armz-text-muted)]">
            Contract addresses, live treasury indicators, and auditable claim guides will appear
            when those systems are implemented and enabled with owner approval.
          </Card>
        </Stack>
      </Section>
    </PageContainer>
  );
}
