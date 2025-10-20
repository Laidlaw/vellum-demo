const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const demoReferenceDate = new Date('2024-09-12T12:00:00Z');

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function formatOrders(count: number) {
  if (count === 0) return '0 orders';
  if (count === 1) return '1 order';
  return `${count} orders`;
}

export function formatDate(isoDate?: string) {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

export function formatDateTime(isoDate?: string) {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return dateTimeFormatter.format(date);
}

export function formatTimeUntil(targetIso?: string, reference: Date = demoReferenceDate) {
  if (!targetIso) return '—';
  const target = new Date(targetIso);
  if (Number.isNaN(target.getTime())) return '—';

  const diffMs = target.getTime() - reference.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }

  const absDays = Math.abs(diffDays);
  const unit = absDays === 1 ? 'day' : 'days';

  if (diffDays > 0) {
    return `In ${absDays} ${unit}`;
  }

  return `${absDays} ${unit} ago`;
}

export function formatPercentage(value?: number) {
  if (value === undefined || Number.isNaN(value)) return '—';
  return `${value}%`;
}
