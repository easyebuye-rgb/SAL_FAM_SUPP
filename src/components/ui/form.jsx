import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Label = ({ className, ...props }) => (
  <label className={cn('mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft', className)} {...props} />
);

export const Input = forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition-shadow focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition-shadow focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition-shadow focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';
