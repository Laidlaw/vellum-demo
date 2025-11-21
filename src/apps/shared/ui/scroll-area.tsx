import * as React from 'react';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  maxHeight?: number;
}

export function ScrollArea(props: ScrollAreaProps) {
  const { className, maxHeight = 480, style, ...rest } = props;
  return (
    <div
      className={['overflow-auto', className].filter(Boolean).join(' ')}
      style={{ maxHeight, ...style }}
      {...rest}
    />
  );
}

