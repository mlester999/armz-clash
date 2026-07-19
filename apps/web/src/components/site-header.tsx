import Link from 'next/link';
import { Badge, BrandLockup, Button, Cluster, NetworkBadge } from '@armz-clash/ui';
import type { PublicConfig } from '@armz-clash/config';

const nav = [
  { href: '/', label: 'Home' },
  { href: '/how-to-play', label: 'How to Play' },
  { href: '/docs', label: 'Docs' },
  { href: '/status', label: 'Status' },
] as const;

export function SiteHeader({ config }: { config: PublicConfig }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--armz-border)] bg-[rgba(11,14,20,0.88)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-3 px-[var(--armz-page-x)] py-3 pt-[calc(0.75rem+var(--armz-safe-top))] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start">
          <Link href="/" className="min-w-0">
            <BrandLockup />
          </Link>
        </div>

        <nav aria-label="Primary" className="flex flex-wrap items-center gap-1 sm:gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-10 rounded-md px-3 py-2 text-sm text-[var(--armz-text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--armz-text)]"
            >
              {item.label}
            </Link>
          ))}
          <span
            className="min-h-10 rounded-md px-3 py-2 text-sm text-[var(--armz-text-muted)]"
            title="Marketplace is unavailable in Phase 1"
            aria-disabled="true"
          >
            Marketplace
            <span className="ml-1 text-[10px] uppercase tracking-wide">soon</span>
          </span>
        </nav>

        <Cluster className="justify-start sm:justify-end" gap="sm">
          <NetworkBadge network={config.networkLabel} />
          <Badge variant="warning">Phase 1</Badge>
          <Button
            variant="secondary"
            size="sm"
            disabled
            aria-disabled="true"
            title="Coming in Phase 2"
          >
            Connect Wallet
            <span className="text-[10px] opacity-70">P2</span>
          </Button>
        </Cluster>
      </div>
    </header>
  );
}
