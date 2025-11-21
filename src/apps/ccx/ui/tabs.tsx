import * as React from 'react';

export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  items: { value: string; label: string }[];
}

export function Tabs(props: React.PropsWithChildren<TabsProps>) {
  const { value, onValueChange, items, children } = props;

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex gap-1 rounded-md bg-slate-100 p-1 text-sm">
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onValueChange(item.value)}
              className={[
                'flex-1 rounded-md px-3 py-1.5 text-center',
                active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {children}
    </div>
  );
}

