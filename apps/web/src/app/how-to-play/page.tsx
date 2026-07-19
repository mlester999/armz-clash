import type { Metadata } from 'next';
import { Card, Grid, PageContainer, Section, Stack } from '@armz-clash/ui';

export const metadata: Metadata = {
  title: 'How to Play',
};

export default function HowToPlayPage() {
  return (
    <PageContainer width="lg">
      <Section
        title="How to Play"
        description="Foundation overview only. Interactive gameplay ships in later phases."
      >
        <Stack>
          <Grid cols={2}>
            {[
              ['Select an ARMZ', 'Choose a collectible arm with available daily energy.'],
              ['Pick difficulty', 'Easy, Normal, or Hard opponents with different risk profiles.'],
              ['Confirm the fight', 'Server starts an authoritative battle record.'],
              ['Watch the clash', 'Animated presentation mirrors the server result timeline.'],
              ['Review the outcome', 'Victory or defeat is never client-authoritative.'],
              [
                'Rewards when eligible',
                'Probabilistic gameplay rewards may be granted within treasury budgets — not guaranteed.',
              ],
            ].map(([title, body]) => (
              <Card key={title} className="space-y-2 p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-[var(--armz-text-secondary)]">{body}</p>
              </Card>
            ))}
          </Grid>
          <Card className="p-5 text-sm text-[var(--armz-text-muted)]">
            Demo Mode (Phase 3) will let anyone try Easy battles with temporary Common ARMZ without
            payment. Real minting, claims, and marketplace settlement remain disabled until later.
          </Card>
        </Stack>
      </Section>
    </PageContainer>
  );
}
