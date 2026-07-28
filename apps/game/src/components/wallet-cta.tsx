'use client';

import { Button } from '@armz-clash/ui';

export function WalletCta() {
  return (
    <Button
      variant="secondary"
      size="lg"
      onClick={() => {
        const walletButton = document.querySelector<HTMLButtonElement>('#wallet-access button');
        walletButton?.focus();
        walletButton?.click();
      }}
    >
      Connect Wallet
    </Button>
  );
}
