import type { ReactNode } from 'react';
import { cn } from '../cn';

export function navTabClassName({
  active = false,
  className,
}: {
  active?: boolean;
  className?: string;
} = {}) {
  return cn('armz-nav-tab', active && 'data-[active=true]', className);
}

export function NavTab({
  children,
  active = false,
  disabled = false,
  className,
  onClick,
  title,
  'data-testid': testId,
}: {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  title?: string;
  'data-testid'?: string;
}) {
  const classes = cn('armz-nav-tab', className);

  if (disabled) {
    return (
      <span
        className={classes}
        data-disabled="true"
        data-active="false"
        aria-disabled="true"
        title={title}
        data-testid={testId}
      >
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      data-active={active ? 'true' : 'false'}
      onClick={onClick}
      title={title}
      data-testid={testId}
    >
      {children}
    </button>
  );
}

/** Class helper for framework links (e.g. Next.js Link). */
export function getNavTabProps(active: boolean) {
  return {
    className: 'armz-nav-tab',
    'data-active': active ? 'true' : 'false',
    'aria-current': active ? ('page' as const) : undefined,
  };
}

export function NavRail({
  children,
  className,
  label = 'Primary',
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        'flex flex-wrap items-center gap-1 rounded-full border border-[var(--armz-border)] bg-[rgba(8,12,20,0.55)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        className,
      )}
    >
      {children}
    </nav>
  );
}
