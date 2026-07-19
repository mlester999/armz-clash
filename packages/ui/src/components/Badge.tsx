import type { ReactNode } from 'react';
import { cn } from '../cn';

const variants = {
  default:
    'bg-[var(--armz-accent-soft)] text-[var(--armz-accent)] border-[var(--armz-border-strong)]',
  success: 'bg-[rgba(62,207,142,0.12)] text-[var(--armz-success)] border-[rgba(62,207,142,0.35)]',
  warning: 'bg-[rgba(240,180,41,0.12)] text-[var(--armz-warning)] border-[rgba(240,180,41,0.35)]',
  danger: 'bg-[rgba(240,113,120,0.12)] text-[var(--armz-danger)] border-[rgba(240,113,120,0.35)]',
  info: 'bg-[rgba(94,200,255,0.12)] text-[var(--armz-cyan)] border-[rgba(94,200,255,0.35)]',
  muted: 'bg-[rgba(147,160,181,0.12)] text-[var(--armz-text-muted)] border-[var(--armz-border)]',
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
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide',
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
