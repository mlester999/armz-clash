import { EmptyState, PageContainer } from '@armz-clash/ui';

export default function NotFound() {
  return (
    <PageContainer>
      <EmptyState title="Not found" description="That game route does not exist in Phase 1." />
    </PageContainer>
  );
}
