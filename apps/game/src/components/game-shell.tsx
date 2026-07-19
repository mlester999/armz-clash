'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge, BrandLockup, Cluster, NavRail, NavTab, NetworkBadge } from '@armz-clash/ui';
import type { PublicConfig } from '@armz-clash/config';
import { GameWalletChrome } from './game-wallet-chrome';

const futureItems = [
  { label: 'Fight', hint: 'Phase 5+' },
  { label: 'Marketplace', hint: 'Phase 9' },
  { label: 'Claim Rewards', hint: 'Phase 8' },
] as const;

function ShellNavLink({
  href,
  active,
  children,
  testId,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <Link
      href={href}
      className="armz-nav-tab"
      data-active={active ? 'true' : 'false'}
      aria-current={active ? 'page' : undefined}
      data-testid={testId}
    >
      {children}
    </Link>
  );
}

export function GameHeader({ config }: { config: PublicConfig }) {
  const pathname = usePathname() || '/';
  const demoActive = pathname === '/demo' || pathname === '/demo/';
  const collectionActive = pathname.startsWith('/demo/collection');
  const fightActive = pathname.startsWith('/demo/fight');

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--armz-border)] bg-[rgba(7,11,18,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-3 px-[var(--armz-page-x)] py-3 pt-[calc(0.65rem+var(--armz-safe-top))] lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link
            href="/"
            className="cursor-pointer rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--armz-cyan)]"
          >
            <BrandLockup subtitle="Demo Arena · Phase 3" />
          </Link>
          <Badge variant="warning">Phase 3 demo</Badge>
        </div>

        <NavRail label="Game" className="max-w-full overflow-x-auto">
          <ShellNavLink href="/demo" active={demoActive} testId="nav-demo">
            Demo
            <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
              Live
            </span>
          </ShellNavLink>
          <ShellNavLink
            href="/demo/collection"
            active={collectionActive}
            testId="nav-demo-collection"
          >
            Collection
          </ShellNavLink>
          <ShellNavLink href="/demo/fight" active={fightActive} testId="nav-demo-fight">
            Easy Fight
          </ShellNavLink>
          {futureItems.map((item) => (
            <NavTab
              key={item.label}
              disabled
              title={`${item.label} unavailable — ${item.hint}`}
              data-testid={`nav-future-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {item.label}
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                {item.hint}
              </span>
            </NavTab>
          ))}
        </NavRail>

        <Cluster gap="sm" className="justify-start lg:justify-end">
          <NetworkBadge network={config.networkLabel} />
          <Badge variant="success">Real-value off</Badge>
          <GameWalletChrome />
        </Cluster>
      </div>
    </header>
  );
}
