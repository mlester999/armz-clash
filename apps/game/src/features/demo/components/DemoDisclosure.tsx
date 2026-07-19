'use client';

import { Button, Card } from '@armz-clash/ui';

export function DemoDisclosure({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-disclosure-title"
      data-testid="demo-disclosure"
    >
      <Card className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--armz-accent)]">
            Demo Mode
          </p>
          <h2 id="demo-disclosure-title" className="text-xl font-semibold">
            Play a temporary Common ARMZ battle
          </h2>
          <p className="text-sm leading-relaxed text-[var(--armz-text-secondary)]">
            Demo Mode is free practice. It is not real minting, not real rewards, and not a wallet
            transaction.
          </p>
        </div>
        <ul className="space-y-2 text-sm text-[var(--armz-text-secondary)]">
          {[
            'No wallet required',
            'No blockchain transaction',
            'Temporary Level 1 Common ARMZ only',
            'Simulated battle result (server-authoritative)',
            'Simulated Demo $ARMZ rewards only',
            'Rewards have no monetary value',
            'Rewards cannot be claimed or withdrawn',
            'Demo progress may expire',
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-[var(--armz-cyan)]" aria-hidden>
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={onConfirm}>Enter Demo Mode</Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
