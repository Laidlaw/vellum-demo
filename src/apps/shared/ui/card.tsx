import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card(props: CardProps) {
  const { className, ...rest } = props;
  return (
    <div
      className={['rounded-lg border border-slate-200 bg-white shadow-sm', className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader(props: CardHeaderProps) {
  const { className, ...rest } = props;
  return <div className={['border-b border-slate-200 px-4 py-3', className].filter(Boolean).join(' ')} {...rest} />;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle(props: CardTitleProps) {
  const { className, ...rest } = props;
  return (
    <h2
      className={['text-sm font-semibold tracking-tight text-slate-900', className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent(props: CardContentProps) {
  const { className, ...rest } = props;
  return <div className={['px-4 py-3 text-sm', className].filter(Boolean).join(' ')} {...rest} />;
}

