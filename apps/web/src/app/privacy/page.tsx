import type { Metadata } from 'next';
import { Card, PageContainer, Section } from '@armz-clash/ui';

export const metadata: Metadata = {
  title: 'Privacy',
};

export default function PrivacyPage() {
  return (
    <PageContainer width="md">
      <Section
        title="Privacy (foundation draft)"
        description="High-level data handling notes for Phase 1."
      >
        <Card className="space-y-3 p-5 text-sm leading-relaxed text-[var(--armz-text-secondary)]">
          <p>
            Phase 1 does not collect production player wallet authentication data. Future wallet
            sessions will bind to public keys with signed messages and short-lived server sessions.
          </p>
          <p>
            Logs may include request correlation IDs and non-sensitive operational metadata. Secrets
            and private keys are never intended for client storage or public logs.
          </p>
          <p>A complete privacy policy will be published before public launch.</p>
        </Card>
      </Section>
    </PageContainer>
  );
}
