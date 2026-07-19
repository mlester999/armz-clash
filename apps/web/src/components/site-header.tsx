import Link from 'next/link';
import { Badge, BrandLockup, Cluster, NetworkBadge } from '@armz-clash/ui';
import type { PublicConfig } from '@armz-clash/config';
import { HeaderWalletChrome } from './header-wallet-chrome';

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

        <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-1 sm:gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-10 rounded-md px-3 py-2 text-sm text-[var(--armz-text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--armz-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--armz-cyan)]"
            >
              {item.label}
            </Link>
          ))}
          <span
            className="min-h-10 rounded-md px-3 py-2 text-sm text-[var(--armz-text-muted)]"
            title="Marketplace is unavailable until a later phase"
            aria-disabled="true"
          >
            Marketplace
            <span className="ml-1 text-[10px] uppercase tracking-wide">later</span>
          </span>
        </nav>

        <Cluster className="justify-start sm:justify-end" gap="sm">
          <NetworkBadge network={config.networkLabel} />
          <Badge variant="warning">Phase 2</Badge>
          <Badge variant="success">Real-value disabled</Badge>
          <HeaderWalletChrome />
        </Cluster>
      </div>
    </header>
  );
}
