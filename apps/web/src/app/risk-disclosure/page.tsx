import type { Metadata } from 'next';
import { Card, PageContainer, Section, Stack } from '@armz-clash/ui';

export const metadata: Metadata = {
  title: 'Risk Disclosure',
};

export default function RiskDisclosurePage() {
  return (
    <PageContainer width="lg">
      <Section
        title="Risk disclosure"
        description="Read carefully. Armz Clash is a game with optional blockchain features — not an investment product."
      >
        <Stack>
          <Card className="space-y-3 p-5 sm:p-6">
            <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed text-[var(--armz-text-secondary)]">
              <li>
                <strong className="text-[var(--armz-text)]">
                  Gameplay rewards are not guaranteed.
                </strong>{' '}
                Outcomes are probabilistic. Losses can and will occur.
              </li>
              <li>
                <strong className="text-[var(--armz-text)]">
                  Real-value functionality is disabled during foundation development.
                </strong>{' '}
                Phase 1 does not mint, transfer, claim, or settle real value.
              </li>
              <li>
                <strong className="text-[var(--armz-text)]">
                  Devnet and demo systems may use valueless test assets.
                </strong>{' '}
                Test tokens and NFTs have no promised market value.
              </li>
              <li>
                <strong className="text-[var(--armz-text)]">
                  Token prices and reward configurations may change.
                </strong>{' '}
                Economy settings are versioned and can be paused or restricted for treasury safety.
              </li>
              <li>
                <strong className="text-[var(--armz-text)]">
                  Do not treat gameplay assets as guaranteed investments.
                </strong>{' '}
                There is no promised ROI, payback period, fixed income, or recovery of mint cost.
              </li>
              <li>
                Blockchain transactions are irreversible when confirmed. Network fees apply. Smart
                contract and integration risks exist.
              </li>
            </ul>
          </Card>
          <Card className="border-[rgba(240,180,41,0.35)] p-5 text-sm text-[var(--armz-text-secondary)]">
            Armz Clash must not be marketed as a Ponzi scheme, guaranteed-return product, or
            passive-income platform. Rewards, when enabled later, are funded by a limited reward
            treasury and must never depend on new players purchasing ARMZ to meet prior obligations.
          </Card>
        </Stack>
      </Section>
    </PageContainer>
  );
}
