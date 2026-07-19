import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn';

export function AppShell({
  header,
  footer,
  children,
  className,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-h-dvh flex-col', className)}>
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}

export function PageContainer({
  children,
  className,
  width = 'xl',
}: {
  children: ReactNode;
  className?: string;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}) {
  const max =
    width === 'sm'
      ? 'max-w-[40rem]'
      : width === 'md'
        ? 'max-w-[48rem]'
        : width === 'lg'
          ? 'max-w-[64rem]'
          : width === '2xl'
            ? 'max-w-[90rem]'
            : 'max-w-[80rem]';
  return (
    <div
      className={cn(
        'mx-auto w-full px-[var(--armz-page-x)] py-[var(--armz-page-y)] pb-[calc(var(--armz-page-y)+var(--armz-safe-bottom))]',
        max,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Section({
  children,
  className,
  title,
  description,
}: {
  children?: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <section className={cn('my-[var(--armz-section)] first:mt-0', className)}>
      {(title || description) && (
        <div className="mb-5 max-w-3xl space-y-2">
          {title ? <h2 className="text-2xl font-semibold tracking-tight">{title}</h2> : null}
          {description ? <p className="text-[var(--armz-text-secondary)]">{description}</p> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stack({
  children,
  className,
  gap = 'md',
}: {
  children: ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}) {
  const g = gap === 'sm' ? 'gap-2' : gap === 'lg' ? 'gap-6' : 'gap-4';
  return <div className={cn('flex flex-col', g, className)}>{children}</div>;
}

export function Cluster({
  children,
  className,
  gap = 'md',
}: {
  children: ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}) {
  const g = gap === 'sm' ? 'gap-2' : gap === 'lg' ? 'gap-4' : 'gap-3';
  return <div className={cn('flex flex-wrap items-center', g, className)}>{children}</div>;
}

export function Grid({
  children,
  className,
  cols = 1,
}: HTMLAttributes<HTMLDivElement> & { cols?: 1 | 2 | 3; children: ReactNode }) {
  return (
    <div
      className={cn(
        'grid gap-4',
        cols === 2 && 'md:grid-cols-2',
        cols === 3 && 'md:grid-cols-2 xl:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
