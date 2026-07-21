'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge, BrandLockup, NetworkBadge } from '@armz-clash/ui';
import type { PublicConfig } from '@armz-clash/config';
import { GameWalletChrome } from './game-wallet-chrome';

const liveNav = [
  { href: '/demo', label: 'Arena', testId: 'nav-demo' },
  { href: '/demo/collection', label: 'Collection', testId: 'nav-demo-collection' },
  { href: '/demo/fight', label: 'Battle', testId: 'nav-demo-fight' },
] as const;

const futureNav = [
  { label: 'Fight', hint: 'Phase 5+', testId: 'nav-future-fight' },
  { label: 'Marketplace', hint: 'Phase 9', testId: 'nav-future-marketplace' },
  { label: 'Claim Rewards', hint: 'Phase 8', testId: 'nav-future-claim-rewards' },
] as const;

export function GameHeader({ config }: { config: PublicConfig }) {
  const pathname = usePathname() || '/';

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--armz-border)] bg-[rgba(5,8,16,0.92)] backdrop-blur-xl">
      {/* Top row: logo + status + wallet */}
      <div className="mx-auto flex w-full max-w-[90rem] items-center justify-between gap-2 px-[var(--armz-page-x)] pt-[calc(0.5rem+var(--armz-safe-top))] pb-1.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/"
            className="cursor-pointer rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--armz-cyan)]"
          >
            <BrandLockup subtitle="Demo Arena" />
          </Link>
          <Badge variant="warning" className="hidden sm:inline-flex">Phase 3 demo</Badge>
        </div>
        <div className="flex items-center gap-2">
          <NetworkBadge network={config.networkLabel} />
          <Badge variant="success" className="hidden lg:inline-flex">Real-value off</Badge>
          <GameWalletChrome />
        </div>
      </div>

      {/* Nav row — always visible, horizontal scroll on small screens */}
      <nav
        aria-label="Game navigation"
        className="mx-auto flex w-full max-w-[90rem] items-center gap-0.5 overflow-x-auto px-[var(--armz-page-x)] pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {liveNav.map((item) => {
          const active =
            item.href === '/demo'
              ? pathname === '/demo' || pathname === '/demo/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="armz-nav-tab shrink-0"
              data-active={active ? 'true' : 'false'}
              aria-current={active ? 'page' : undefined}
              data-testid={item.testId}
            >
              {item.label}
            </Link>
          );
        })}
        <span className="mx-1 h-5 w-px shrink-0 bg-[var(--armz-border)]" aria-hidden />
        {futureNav.map((item) => (
          <span
            key={item.label}
            className="armz-nav-tab shrink-0"
            data-disabled="true"
            data-active="false"
            aria-disabled="true"
            title={`${item.label} unavailable — ${item.hint}`}
            data-testid={item.testId}
          >
            {item.label}
            <span className="ml-1 text-[9px] font-bold uppercase tracking-wider opacity-60">
              {item.hint}
            </span>
          </span>
        ))}
      </nav>

      {/* Safety line */}
      <div className="mx-auto max-w-[90rem] px-[var(--armz-page-x)] pb-1">
        <p className="text-[10px] leading-tight text-[var(--armz-text-muted)]">
          Demo Mode active · no staking · real-value systems disabled · Phase 9 marketplace locked
        </p>
      </div>
    </header>
  );
}