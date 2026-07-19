import { EmptyState, PageContainer } from '@armz-clash/ui';

export default function NotFound() {
  return (
    <PageContainer>
      <EmptyState title="Not found" description="That admin route does not exist in Phase 1." />
    </PageContainer>
  );
}
