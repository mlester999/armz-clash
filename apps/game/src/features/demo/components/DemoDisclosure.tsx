'use client';

import { Badge, Button, Card, Cluster } from '@armz-clash/ui';

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-disclosure-title"
      data-testid="demo-disclosure"
    >
      <Card premium className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto p-5 sm:p-6">
        <div className="space-y-2">
          <Badge variant="warning">Demo Mode</Badge>
          <h2 id="demo-disclosure-title" className="armz-display text-xl sm:text-2xl">
            Play a temporary Common ARMZ battle
          </h2>
          <p className="text-sm leading-relaxed text-[var(--armz-text-secondary)]">
            Demo Mode is free practice. It is not real minting, not real rewards, and not a wallet
            transaction.
          </p>
        </div>
        <ul className="grid gap-2 text-sm text-[var(--armz-text-secondary)] sm:grid-cols-2">
          {[
            'No wallet required',
            'No blockchain transaction',
            'Temporary Level 1 Common only',
            'Server-authoritative result',
            'Simulated Demo $ARMZ only',
            'No monetary value',
            'Cannot claim or withdraw',
            'Demo progress may expire',
          ].map((item) => (
            <li
              key={item}
              className="flex gap-2 rounded-[var(--armz-radius-md)] border border-[var(--armz-border)] bg-[rgba(0,0,0,0.25)] px-3 py-2"
            >
              <span className="text-[var(--armz-cyan)]" aria-hidden>
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Cluster className="pt-1">
          <Button size="lg" onClick={onConfirm}>
            Enter Demo Mode
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </Cluster>
      </Card>
    </div>
  );
}
