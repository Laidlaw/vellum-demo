import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
}

export function Button(props: ButtonProps) {
  const { className, variant = 'default', type = 'button', ...rest } = props;
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium';
  const stylesByVariant: Record<ButtonProps['variant'], string> = {
    default: 'bg-slate-900 text-white hover:bg-slate-800',
    outline: 'border border-slate-300 text-slate-900 hover:bg-slate-50',
    ghost: 'text-slate-700 hover:bg-slate-100',
  };
  const classes = [base, stylesByVariant[variant], className].filter(Boolean).join(' ');

  return <button type={type} className={classes} {...rest} />;
}

