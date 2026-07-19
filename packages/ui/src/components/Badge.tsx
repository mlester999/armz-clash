import type { ReactNode } from 'react';
import { cn } from '../cn';

const variants = {
  default:
    'bg-[var(--armz-accent-soft)] text-[var(--armz-accent)] border-[var(--armz-border-strong)] shadow-[0_0_12px_rgba(212,175,106,0.08)]',
  success: 'bg-[rgba(62,207,142,0.12)] text-[var(--armz-success)] border-[rgba(62,207,142,0.35)]',
  warning: 'bg-[rgba(240,180,41,0.12)] text-[var(--armz-warning)] border-[rgba(240,180,41,0.35)]',
  danger: 'bg-[rgba(240,113,120,0.12)] text-[var(--armz-danger)] border-[rgba(240,113,120,0.35)]',
  info: 'bg-[rgba(94,200,255,0.12)] text-[var(--armz-cyan)] border-[rgba(94,200,255,0.35)]',
  muted: 'bg-[rgba(147,160,181,0.1)] text-[var(--armz-text-muted)] border-[var(--armz-border)]',
  common: 'bg-[rgba(154,164,178,0.14)] text-[#c5ced9] border-[rgba(154,164,178,0.4)]',
  enemy: 'bg-[rgba(224,122,74,0.14)] text-[#f0a878] border-[rgba(224,122,74,0.4)]',
} as const;

export type BadgeVariant = keyof typeof variants;

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em]',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ label, active }: { label: string; active: boolean }) {
  return <Badge variant={active ? 'success' : 'muted'}>{label}</Badge>;
}

export function EnvironmentBadge({ environment }: { environment: string }) {
  const variant: BadgeVariant =
    environment === 'production' ? 'danger' : environment === 'staging' ? 'warning' : 'info';
  return <Badge variant={variant}>{environment}</Badge>;
}

export function NetworkBadge({ network }: { network: string }) {
  return <Badge variant="info">{network}</Badge>;
}

export function FeatureFlagBadge({ name, enabled }: { name: string; enabled: boolean }) {
  return (
    <Badge variant={enabled ? 'success' : 'muted'}>
      {name}: {enabled ? 'on' : 'off'}
    </Badge>
  );
}

export function RarityBadge({ rarity = 'common' }: { rarity?: string }) {
  const r = rarity.toLowerCase();
  if (r === 'common') return <Badge variant="common">Common</Badge>;
  return <Badge variant="default">{rarity}</Badge>;
}
