import * as React from 'react';

import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', ...props },
  ref,
) {
  const base =
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    default: 'bg-slate-900 text-slate-50 hover:bg-slate-800',
    outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-900',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-900',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3',
    lg: 'h-10 rounded-md px-8',
    icon: 'h-9 w-9',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    />
  );
}

