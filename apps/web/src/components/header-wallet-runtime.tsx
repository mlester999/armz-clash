'use client';

import { ArmzWalletProvider, WalletErrorPanel, WalletStatusButton } from '@armz-clash/ui';

export function HeaderWalletRuntime({
  apiUrl,
  projectId,
  metadataUrl,
}: {
  apiUrl: string;
  projectId: string;
  metadataUrl: string;
}) {
  return (
    <ArmzWalletProvider apiUrl={apiUrl} projectId={projectId} metadataUrl={metadataUrl}>
      <div className="flex flex-col items-end gap-2">
        <WalletStatusButton />
        <div className="max-w-xs">
          <WalletErrorPanel />
        </div>
      </div>
    </ArmzWalletProvider>
  );
}
