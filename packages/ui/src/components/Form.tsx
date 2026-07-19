import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../cn';

const fieldClass =
  'w-full min-h-11 rounded-[var(--armz-radius-md)] border border-[var(--armz-border)] bg-[rgba(12,16,24,0.8)] px-3 py-2 text-sm text-[var(--armz-text)] placeholder:text-[var(--armz-text-muted)] disabled:opacity-50';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldClass, className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, 'min-h-28 py-3', className)} {...props} />;
}

export function Label({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string;
  children: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'mb-1.5 block text-sm font-medium text-[var(--armz-text-secondary)]',
        className,
      )}
    >
      {children}
    </label>
  );
}
