import type { ReactNode } from 'react';
import { cn } from '../cn';

/** Foundation-only dialog surface (no portal manager yet). */
export function DialogFoundation({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[rgba(5,8,14,0.72)] p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-lg rounded-[var(--armz-radius-lg)] border border-[var(--armz-border)] bg-[var(--armz-bg-panel)] p-5 shadow-[var(--armz-shadow-md)] sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm text-[var(--armz-text-muted)] hover:bg-[rgba(255,255,255,0.04)]"
            >
              Close
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}

/** Foundation-only drawer surface. */
export function DrawerFoundation({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] bg-[rgba(5,8,14,0.72)]" role="dialog" aria-modal="true">
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-[var(--armz-border)] bg-[var(--armz-bg-panel)] p-5 shadow-[var(--armz-shadow-md)]',
          'pt-[calc(1.25rem+var(--armz-safe-top))] pb-[calc(1.25rem+var(--armz-safe-bottom))]',
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-[var(--armz-text-muted)]"
            >
              Close
            </button>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

export function TabsFoundation({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Tabs"
      className="flex flex-wrap gap-2 border-b border-[var(--armz-border)] pb-2"
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              'min-h-10 rounded-md px-3 py-2 text-sm',
              selected
                ? 'bg-[var(--armz-accent-soft)] text-[var(--armz-accent)]'
                : 'text-[var(--armz-text-muted)] hover:bg-[rgba(255,255,255,0.04)]',
            )}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
