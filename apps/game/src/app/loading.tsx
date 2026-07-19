import { LoadingState, PageContainer } from '@armz-clash/ui';

export default function Loading() {
  return (
    <PageContainer>
      <LoadingState label="Loading game shell…" />
    </PageContainer>
  );
}
