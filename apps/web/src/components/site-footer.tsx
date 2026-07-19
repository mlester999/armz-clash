import Link from 'next/link';
import { Cluster } from '@armz-clash/ui';

const links = [
  { href: '/docs', label: 'Docs' },
  { href: '/how-to-play', label: 'How to Play' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/risk-disclosure', label: 'Risk Disclosure' },
  { href: '/status', label: 'Status' },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--armz-border)] bg-[rgba(11,14,20,0.9)]">
      <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-4 px-[var(--armz-page-x)] py-8 pb-[calc(2rem+var(--armz-safe-bottom))]">
        <Cluster className="justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-[0.12em]">ARMZ CLASH</p>
            <p className="text-xs text-[var(--armz-text-muted)]">
              Phase 1 foundation · Testnet-first · No guaranteed rewards
            </p>
          </div>
        </Cluster>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="min-h-10 py-2 text-sm text-[var(--armz-text-secondary)] hover:text-[var(--armz-text)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs leading-relaxed text-[var(--armz-text-muted)]">
          Gameplay rewards are probabilistic and limited by a reward treasury. Real-value features
          are disabled during foundation development. This is not financial advice.
        </p>
      </div>
    </footer>
  );
}
