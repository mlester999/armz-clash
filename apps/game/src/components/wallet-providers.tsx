'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const DynamicWallet = dynamic(
  () =>
    import('@armz-clash/ui').then((mod) => {
      function Provider({
        children,
        apiUrl,
        projectId,
        metadataUrl,
      }: {
        children: ReactNode;
        apiUrl: string;
        projectId: string;
        metadataUrl: string;
      }) {
        return (
          <mod.ArmzWalletProvider apiUrl={apiUrl} projectId={projectId} metadataUrl={metadataUrl}>
            {children}
          </mod.ArmzWalletProvider>
        );
      }
      return Provider;
    }),
  { ssr: false },
);

export function WalletProviders({
  children,
  apiUrl,
  projectId,
  metadataUrl,
}: {
  children: ReactNode;
  apiUrl: string;
  projectId: string;
  metadataUrl: string;
}) {
  return (
    <DynamicWallet apiUrl={apiUrl} projectId={projectId} metadataUrl={metadataUrl}>
      {children}
    </DynamicWallet>
  );
}
