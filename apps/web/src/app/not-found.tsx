import Link from 'next/link';
import { Button, EmptyState, PageContainer } from '@armz-clash/ui';

export default function NotFound() {
  return (
    <PageContainer>
      <EmptyState
        title="Page not found"
        description="That route is not part of the Armz Clash foundation surface."
        action={
          <Link href="/">
            <Button>Back home</Button>
          </Link>
        }
      />
    </PageContainer>
  );
}
