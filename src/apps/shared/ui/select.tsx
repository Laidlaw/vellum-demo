import * as React from 'react';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hideLabel?: boolean;
  options: SelectOption[];
}

export function Select(props: SelectProps) {
  const { label, hideLabel = false, className, id, options, ...rest } = props;
  const selectId = id ?? React.useId();

  return (
    <div className={['flex flex-col gap-1 text-sm', className].filter(Boolean).join(' ')}>
      {label && !hideLabel ? (
        <label htmlFor={selectId} className="text-xs font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

