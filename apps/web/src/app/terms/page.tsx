import type { Metadata } from 'next';
import { Card, PageContainer, Section } from '@armz-clash/ui';

export const metadata: Metadata = {
  title: 'Terms',
};

export default function TermsPage() {
  return (
    <PageContainer width="md">
      <Section
        title="Terms of Use (foundation draft)"
        description="Placeholder legal structure for Phase 1."
      >
        <Card className="space-y-3 p-5 text-sm leading-relaxed text-[var(--armz-text-secondary)]">
          <p>
            Armz Clash is under active foundation development. Features described on this site may
            be incomplete, unavailable, or disabled by feature flags.
          </p>
          <p>
            Real-value blockchain functionality is disabled in Phase 1. Devnet and demo systems may
            use valueless test assets.
          </p>
          <p>
            This draft does not constitute a finished legal agreement. Owner and counsel must review
            terms before any public mainnet launch.
          </p>
        </Card>
      </Section>
    </PageContainer>
  );
}
