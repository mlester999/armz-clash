'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLockup } from '@armz-clash/ui';
import type { PublicConfig } from '@armz-clash/config';
import { GameWalletChrome } from './game-wallet-chrome';
import { GameIcon, type GameIconName } from './game-icons';

const liveNav: ReadonlyArray<{
  href: string;
  label: string;
  testId: string;
  icon: GameIconName;
  match: (pathname: string) => boolean;
}> = [
  {
    href: '/demo',
    label: 'Arena',
    testId: 'nav-demo',
    icon: 'arena',
    match: (pathname) => pathname === '/demo' || pathname === '/demo/',
  },
  {
    href: '/demo/collection',
    label: 'Collection',
    testId: 'nav-demo-collection',
    icon: 'collection',
    match: (pathname) => pathname.startsWith('/demo/collection'),
  },
  {
    href: '/demo/fight',
    label: 'Battle',
    testId: 'nav-demo-fight',
    icon: 'battle',
    match: (pathname) => pathname.startsWith('/demo/fight'),
  },
  {
    href: '/demo/collection#history',
    label: 'History',
    testId: 'nav-demo-history',
    icon: 'history',
    match: () => false,
  },
];

const futureNav = [
  { label: 'Marketplace', hint: 'Future', testId: 'nav-future-marketplace' },
  { label: 'Claims', hint: 'Future', testId: 'nav-future-claim-rewards' },
] as const;

function MainNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Game navigation" className="phase34-desktop-nav">
      {liveNav.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.testId}
            href={item.href}
            className="phase34-nav-link"
            data-active={active ? 'true' : 'false'}
            aria-current={active ? 'page' : undefined}
            data-testid={item.testId}
          >
            <GameIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <div className="phase34-future-nav" aria-label="Future features">
        {futureNav.map((item) => (
          <span
            key={item.testId}
            className="phase34-nav-link phase34-nav-link--locked"
            data-testid={item.testId}
            aria-disabled="true"
            title={`${item.label} intentionally unavailable`}
          >
            <GameIcon name="lock" />
            <span>{item.label}</span>
            <small>{item.hint}</small>
          </span>
        ))}
      </div>
    </nav>
  );
}

export function GameHeader({ config }: { config: PublicConfig }) {
  const pathname = usePathname() || '/';

  return (
    <>
      <header className="phase34-header">
        <div className="phase34-header__inner">
          <div className="phase34-header__brand">
            <Link href="/" className="phase34-brand-link" aria-label="Armz Clash home">
              <BrandLockup subtitle="Demo Championship" />
            </Link>
            <span className="phase34-mode-chip">
              <i aria-hidden /> Demo Mode
            </span>
          </div>

          <div className="phase34-header__nav-slot" aria-hidden="true" />

          <div className="phase34-header__utility">
            <span className="phase34-network-chip">{config.networkLabel}</span>
            <span className="phase34-safe-chip">Real value off</span>
            <div id="wallet-access" className="phase34-wallet">
              <GameWalletChrome />
            </div>
          </div>
        </div>
        <p className="phase34-safety-line">
          Simulated practice only · no monetary value · not claimable · no staking
        </p>
      </header>
      <MainNav pathname={pathname} />
    </>
  );
}
