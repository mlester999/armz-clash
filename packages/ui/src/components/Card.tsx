import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn';

export function Card({
  className,
  children,
  premium = false,
  interactive = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  premium?: boolean;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        'armz-card',
        premium && 'armz-card--premium',
        interactive && 'armz-card--interactive',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Panel({
  className,
  children,
  title,
  description,
  premium = false,
}: {
  className?: string;
  children: ReactNode;
  title?: string;
  description?: string;
  premium?: boolean;
}) {
  return (
    <section className={cn('armz-card', premium && 'armz-card--premium', className)}>
      {(title || description) && (
        <header className="mb-3 space-y-1">
          {title ? <h2 className="text-lg font-semibold tracking-tight">{title}</h2> : null}
          {description ? (
            <p className="text-sm text-[var(--armz-text-muted)]">{description}</p>
          ) : null}
        </header>
      )}
      {children}
    </section>
  );
}
