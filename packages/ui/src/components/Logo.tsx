import type { CSSProperties } from 'react';
import { cn } from '../cn';

type LogoProps = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * Original compact emblem placeholder — geometric clash mark.
 * Not copied from reference artwork. Final logo system arrives in asset phases.
 */
export function LogoMark({ size = 36, className, title = 'Armz Clash' }: LogoProps) {
  const style: CSSProperties = { width: size, height: size };
  return (
    <svg
      className={cn('shrink-0', className)}
      style={style}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="armz-logo-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0d9a0" />
          <stop offset="50%" stopColor="#d4af6a" />
          <stop offset="100%" stopColor="#8a6a32" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        fill="#121826"
        stroke="url(#armz-logo-metal)"
        strokeWidth="2"
      />
      <path
        d="M18 40c6-10 10-16 14-22 4 6 8 12 14 22"
        fill="none"
        stroke="url(#armz-logo-metal)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="38" r="5" fill="#5ec8ff" opacity="0.9" />
      <path d="M22 46h20" stroke="#5ec8ff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('tracking-[0.14em] font-semibold text-[0.95rem] sm:text-base', className)}>
      ARMZ CLASH
    </span>
  );
}

export function BrandLockup({
  className,
  subtitle = 'Premium Solana Arena',
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative">
        <LogoMark size={40} />
        <span
          className="pointer-events-none absolute -inset-1 rounded-[1rem] opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,106,0.35), transparent 70%)',
          }}
          aria-hidden
        />
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <Wordmark className="bg-[linear-gradient(90deg,#f0d9a0,#d4af6a_50%,#c9e8ff)] bg-clip-text text-transparent" />
        <span className="text-[0.68rem] font-medium tracking-wide text-[var(--armz-text-muted)]">
          {subtitle}
        </span>
      </div>
    </div>
  );
}
