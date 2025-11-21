import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hideLabel?: boolean;
}

export function Input(props: InputProps) {
  const { label, hideLabel = false, className, id, ...rest } = props;
  const inputId = id ?? React.useId();

  return (
    <div className={['flex flex-col gap-1 text-sm', className].filter(Boolean).join(' ')}>
      {label && !hideLabel ? (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        {...rest}
      />
    </div>
  );
}

