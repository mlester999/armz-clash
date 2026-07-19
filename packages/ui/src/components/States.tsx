import type { ReactNode } from 'react';
import { cn } from '../cn';
import { Button } from './Button';
import { Card } from './Card';

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('flex flex-col items-start gap-4 p-6 sm:p-8', className)}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--armz-text-secondary)]">
          {description}
        </p>
      </div>
      {action}
    </Card>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="flex min-h-40 items-center justify-center rounded-[var(--armz-radius-lg)] border border-[var(--armz-border)] bg-[var(--armz-surface-muted)] p-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-sm text-[var(--armz-text-secondary)]">
        <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-[var(--armz-accent)]" />
        {label}
      </div>
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="space-y-4 border-[rgba(240,113,120,0.35)] p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--armz-danger)]">{title}</h3>
        <p className="text-sm text-[var(--armz-text-secondary)]">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Card>
  );
}

export function DevelopmentNotice({ children }: { children: ReactNode }) {
  return (
    <div
      role="note"
      className="rounded-[var(--armz-radius-md)] border border-[rgba(94,200,255,0.35)] bg-[rgba(94,200,255,0.08)] px-4 py-3 text-sm text-[var(--armz-text-secondary)]"
    >
      {children}
    </div>
  );
}

export function FeatureUnavailable({
  title,
  phaseHint,
  description,
}: {
  title: string;
  phaseHint?: string;
  description: string;
}) {
  return (
    <Card className="space-y-3 border-dashed p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold">{title}</h3>
        {phaseHint ? (
          <span className="rounded-full border border-[var(--armz-border)] px-2 py-0.5 text-xs text-[var(--armz-text-muted)]">
            {phaseHint}
          </span>
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-[var(--armz-text-secondary)]">{description}</p>
    </Card>
  );
}
