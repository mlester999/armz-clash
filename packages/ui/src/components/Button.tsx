import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn';

const variants = {
  primary:
    'bg-[linear-gradient(135deg,#e0c080,#d4af6a_45%,#a8843d)] text-[#1a1408] hover:brightness-105 border-transparent',
  secondary:
    'bg-[rgba(36,48,74,0.9)] text-[var(--armz-text)] border-[var(--armz-border)] hover:border-[var(--armz-border-strong)]',
  ghost:
    'bg-transparent text-[var(--armz-text-secondary)] border-transparent hover:bg-[rgba(255,255,255,0.04)]',
  danger: 'bg-[rgba(240,113,120,0.14)] text-[var(--armz-danger)] border-[rgba(240,113,120,0.35)]',
} as const;

const sizes = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
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
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--armz-radius-md)] border font-medium transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--armz-cyan)]',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="opacity-80">Working…</span> : children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-[var(--armz-radius-md)] border border-[var(--armz-border)] bg-[rgba(36,48,74,0.7)] text-[var(--armz-text)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
