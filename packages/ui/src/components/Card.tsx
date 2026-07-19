import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn';

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn('armz-card', className)} {...props}>
      {children}
    </div>
  );
}

export function Panel({
  className,
  children,
  title,
  description,
}: {
  className?: string;
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  return (
    <section className={cn('armz-card', className)}>
      {(title || description) && (
        <header className="mb-4 space-y-1">
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
