'use client';

import {
  ArmzWalletProvider,
  SignInPrompt,
  WalletErrorPanel,
  WalletStatusButton,
} from '@armz-clash/ui';

export function GameWalletRuntime({
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
      <div className="flex max-w-md flex-col items-stretch gap-2 sm:items-end">
        <WalletStatusButton />
        <WalletErrorPanel />
        <SignInPrompt />
      </div>
    </ArmzWalletProvider>
  );
}
