import { cn } from '../cn';

/** Game-like stat tile with optional fill bar (0–100 scale or raw). */
export function StatMeter({
  label,
  value,
  max = 100,
  primary = false,
  className,
  format = 'number',
}: {
  label: string;
  value: number;
  max?: number;
  primary?: boolean;
  className?: string;
  format?: 'number' | 'bps';
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const display = format === 'bps' ? `${value}` : String(value);
  return (
    <div className={cn('armz-stat', primary && 'armz-stat--primary', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="armz-stat__label">{label}</span>
        <span className="armz-stat__value">{display}</span>
      </div>
      <div className="armz-stat__bar" aria-hidden>
        <div className="armz-stat__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StatGrid({
  stats,
  className,
}: {
  stats: Array<{
    label: string;
    value: number;
    max?: number;
    primary?: boolean;
    format?: 'number' | 'bps';
  }>;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-4', className)}>
      {stats.map((s) => (
        <StatMeter key={s.label} {...s} />
      ))}
    </div>
  );
}

/**
 * Phase 3.3 Task 16: Renamed from "Strength" to "Control".
 * Each side starts at 100 Control. The defeated side reaches 0.
 */
export function ControlBar({
  label,
  value,
  tone = 'player',
  className,
}: {
  label: string;
  value: number;
  tone?: 'player' | 'opponent';
  className?: string;
}) {
  return (
    <div className={cn('armz-strength', className)}>
      <div className="flex items-center justify-between gap-2 text-xs font-semibold">
        <span className="truncate">{label}</span>
        <span className="tabular-nums text-[var(--armz-text-secondary)]" aria-live="polite">
          {value}/100
        </span>
      </div>
      <div
        className="armz-strength__track"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} control`}
      >
        <div
          className={cn(
            'armz-strength__fill',
            tone === 'player' ? 'armz-strength__fill--player' : 'armz-strength__fill--opponent',
          )}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

/** @deprecated Use ControlBar instead. Kept for backward compatibility. */
export const StrengthBar = ControlBar;