import { Badge, BrandLockup, Cluster, NetworkBadge } from '@armz-clash/ui';
import type { PublicConfig } from '@armz-clash/config';
import { GameWalletChrome } from './game-wallet-chrome';

const items = [
  { label: 'Fight', hint: 'Phase 5+' },
  { label: 'Collection', hint: 'Phase 4' },
  { label: 'Marketplace', hint: 'Phase 9' },
  { label: 'Claim Rewards', hint: 'Phase 8' },
] as const;

export function GameHeader({ config }: { config: PublicConfig }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--armz-border)] bg-[rgba(11,14,20,0.9)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-3 px-[var(--armz-page-x)] py-3 pt-[calc(0.75rem+var(--armz-safe-top))] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <BrandLockup />
          <Badge variant="warning">Phase 2 auth</Badge>
        </div>

        <nav aria-label="Game" className="flex flex-wrap gap-1">
          {items.map((item) => (
            <span
              key={item.label}
              className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--armz-text-muted)]"
              aria-disabled="true"
              title={`${item.label} unavailable — ${item.hint}`}
            >
              {item.label}
              <span className="text-[10px] uppercase tracking-wide opacity-70">{item.hint}</span>
            </span>
          ))}
        </nav>

        <Cluster gap="sm" className="justify-start lg:justify-end">
          <NetworkBadge network={config.networkLabel} />
          <Badge variant="success">Real-value disabled</Badge>
          <Badge variant="muted">Demo · Phase 3</Badge>
          <GameWalletChrome />
        </Cluster>
      </div>
    </header>
  );
}
