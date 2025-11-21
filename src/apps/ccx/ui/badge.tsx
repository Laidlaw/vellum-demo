import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'critical' | 'info';
}

export function Badge(props: BadgeProps) {
  const { className, variant = 'default', ...rest } = props;
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  const stylesByVariant: Record<BadgeProps['variant'], string> = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    critical: 'bg-red-100 text-red-800',
    info: 'bg-sky-100 text-sky-800',
  };
  const classes = [base, stylesByVariant[variant], className].filter(Boolean).join(' ');
  return <span className={classes} {...rest} />;
}

