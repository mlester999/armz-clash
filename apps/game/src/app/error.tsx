'use client';

import { ErrorState, PageContainer } from '@armz-clash/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <ErrorState title="Game app error" description={error.message} onRetry={reset} />
    </PageContainer>
  );
}
