import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn';

const variants = {
  primary: cn(
    'border-transparent text-[var(--armz-text-inverse)]',
    'bg-[linear-gradient(145deg,#f0d9a0_0%,#d4af6a_42%,#a8843d_100%)]',
    'shadow-[0_4px_16px_rgba(212,175,106,0.28),inset_0_1px_0_rgba(255,255,255,0.35)]',
    'hover:brightness-110 hover:shadow-[0_8px_24px_rgba(212,175,106,0.38)]',
    'active:brightness-95 active:translate-y-px active:shadow-[0_2px_8px_rgba(212,175,106,0.2)]',
  ),
  secondary: cn(
    'border-[var(--armz-border)] text-[var(--armz-text)]',
    'bg-[linear-gradient(180deg,rgba(42,54,78,0.95),rgba(28,38,58,0.95))]',
    'hover:border-[var(--armz-border-strong)] hover:bg-[rgba(48,62,90,0.95)]',
    'active:translate-y-px active:brightness-95',
  ),
  ghost: cn(
    'border-transparent bg-transparent text-[var(--armz-text-secondary)]',
    'hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--armz-text)]',
    'active:bg-[rgba(255,255,255,0.08)]',
  ),
  danger: cn(
    'border-[rgba(240,113,120,0.4)] text-[var(--armz-danger)]',
    'bg-[rgba(240,113,120,0.12)]',
    'hover:bg-[rgba(240,113,120,0.18)]',
    'active:translate-y-px',
  ),
  cyan: cn(
    'border-[rgba(94,200,255,0.35)] text-[var(--armz-text-inverse)]',
    'bg-[linear-gradient(145deg,#8ad8ff,#5ec8ff_50%,#2a8fbf)]',
    'shadow-[0_4px_16px_rgba(94,200,255,0.25)]',
    'hover:brightness-110',
    'active:translate-y-px active:brightness-95',
  ),
} as const;

const sizes = {
  sm: 'min-h-9 px-3 text-sm gap-1.5',
  md: 'min-h-11 px-4 text-sm gap-2',
  lg: 'min-h-12 px-6 text-base gap-2',
} as const;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  onClick,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  return (
    <button
      {...props}
      type={type}
      onClick={onClick}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-[var(--armz-radius-md)] border font-semibold tracking-wide',
        'transition-[transform,box-shadow,filter,background-color,border-color,color] duration-150 ease-out',
        'cursor-pointer',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:brightness-100 disabled:active:translate-y-0',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--armz-cyan)]',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
    >
      {loading ? <span className="opacity-90">Working…</span> : children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={cn(
        'inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[var(--armz-radius-md)]',
        'border border-[var(--armz-border)] bg-[rgba(36,48,74,0.75)] text-[var(--armz-text)]',
        'transition hover:border-[var(--armz-border-strong)] hover:bg-[rgba(48,62,90,0.9)] active:translate-y-px',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--armz-cyan)]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
