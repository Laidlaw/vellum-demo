import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { MapPin, Search, SlidersHorizontal, User } from 'lucide-react';

import { getCompanyById, INVOICES, QUOTES } from '../../data';
import { CUI_ACTIVE_COMPANY_ID } from './config';

interface CuiAppShellProps {
  children: ReactNode;
}

function getCompanyShortName(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length <= 2) return name;
  return parts.slice(0, 2).join(' ');
}

const MAIN_NAV_ITEMS = [
  { id: 'quotes', label: 'Quotes', to: '/cui/quotes' },
  { id: 'orders', label: 'Orders', to: '/cui/orders' },
  { id: 'invoices', label: 'Invoices', to: '/cui/invoices' },
];

const RECENT_ACTIVITY = [
  {
    id: 'recent-1',
    group: 'Today',
    label: 'Marked INV-1042 as paid',
  },
  {
    id: 'recent-2',
    group: 'Today',
    label: 'Approved quote Q-9821 for Blue Hollow',
  },
  {
    id: 'recent-3',
    group: 'This week',
    label: 'Updated payment terms for Lynx Supply Co.',
  },
  {
    id: 'recent-4',
    group: 'Last week',
    label: 'Reviewed credit exposure for Abstract Industrial',
  },
];

function CuiAppShell({ children }: CuiAppShellProps) {
  const location = useLocation();
  const activeCompany = getCompanyById(CUI_ACTIVE_COMPANY_ID);

  const regions =
    activeCompany?.locations.map((location) => ({
      id: location.id,
      label: location.code ?? location.name,
    })) ?? [];

  const [activeRegionId, setActiveRegionId] = useState<string>(regions[0]?.id ?? '');

  const companyLabel = activeCompany ? getCompanyShortName(activeCompany.name) : 'Customer workspace';

  const breadcrumbs = (() => {
    if (!activeCompany) return [];
    const path = location.pathname;
    const base = [{ label: companyLabel, to: '/cui' as string }];

    if (path === '/cui') {
      return base;
    }

    if (path.startsWith('/cui/quotes')) {
      const quoteMatch = path.match(/^\/cui\/quotes\/([^/]+)/);
      const quoteId = quoteMatch?.[1];
      const crumbs = [...base, { label: 'Quotes', to: '/cui/quotes' as string }];
      if (quoteId && quoteId !== 'convert') {
        const quote = QUOTES.find((q) => q.id === quoteId);
        crumbs.push({ label: (quote?.quoteNumber ?? quoteId) as string });
      } else if (path.includes('/convert')) {
        crumbs.push({ label: 'Quote conversion' as string });
      }
      return crumbs;
    }

    if (path.startsWith('/cui/orders')) {
      const crumbs = [...base, { label: 'Orders', to: '/cui/orders' as string }];
      if (path.includes('/checkout')) {
        crumbs.push({ label: 'Checkout' as string });
      }
      return crumbs;
    }

    if (path.startsWith('/cui/invoices')) {
      const invoiceMatch = path.match(/^\/cui\/invoices\/([^/]+)/);
      const invoiceId = invoiceMatch?.[1];
      const viewMatch = path.match(/\/review\/([^/]+)$/);
      const viewSegment = viewMatch?.[1];

      const crumbs = [...base, { label: 'Invoices', to: '/cui/invoices' as string }];

      if (invoiceId && invoiceId !== 'review') {
        const invoice = INVOICES.find((inv) => inv.id === invoiceId);
        crumbs.push({
          label: (invoice?.invoiceNumber ?? invoiceId) as string,
          to: `/cui/invoices/${invoiceId}/review` as string,
        });
      }

      if (path.includes('/review')) {
        crumbs.push({ label: 'Review' as string });
        if (viewSegment && viewSegment !== 'summary') {
          const label =
            viewSegment === 'lines'
              ? 'Line items'
              : viewSegment === 'history'
                ? 'History'
                : viewSegment;
          crumbs.push({ label });
        }
      }

      return crumbs;
    }

    if (path.startsWith('/cui/settings')) {
      return [
        ...base,
        {
          label: 'Company settings',
          to: '/cui/settings' as string,
        },
      ];
    }

    return base;
  })();

  const recentEvents = (() => {
    if (!activeCompany) return RECENT_ACTIVITY;
    const companyQuotes = QUOTES.filter((quote) => quote.companyId === activeCompany.id).slice(0, 3);
    const companyInvoices = INVOICES.filter((invoice) => invoice.companyId === activeCompany.id).slice(0, 3);

    const events = [];
    for (const quote of companyQuotes) {
      events.push({
        id: `quote-${quote.id}`,
        group: 'Quotes',
        label: `Quote ${quote.quoteNumber} · ${quote.status.replace('_', ' ')}`,
      });
    }
    for (const invoice of companyInvoices) {
      events.push({
        id: `invoice-${invoice.id}`,
        group: 'Invoices',
        label: `Invoice ${invoice.invoiceNumber} · ${invoice.status}`,
      });
    }

    return events.length ? events : RECENT_ACTIVITY;
  })();

  const groupedActivity = recentEvents.reduce<Record<string, typeof RECENT_ACTIVITY>>((acc, item) => {
    const group = acc[item.group] ?? [];
    // @ts-expect-error loose grouping for demo
    group.push(item);
    // @ts-expect-error loose grouping for demo
    acc[item.group] = group;
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Link
              to="/storefront"
              aria-label="Locations and storefront"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-100"
            >
              <MapPin className="h-4 w-4 text-slate-700" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                to="/cui"
                className="truncate text-sm font-semibold text-slate-900 hover:underline"
              >
                {companyLabel}
              </Link>
              {activeCompany ? (
                <div className="mt-1">
                  <select
                    value={activeRegionId}
                    onChange={(event) => setActiveRegionId(event.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="px-3 pt-3 text-xs">
          <div className="mb-2">
            <div className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1">
              <Search className="h-3 w-3 text-slate-500" />
              <input
                type="search"
                placeholder="Search invoices, orders, quotes"
                className="h-4 flex-1 border-none bg-transparent text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                aria-label="Filters"
                className="flex h-4 w-4 items-center justify-center text-slate-500 hover:text-slate-700"
              >
                <SlidersHorizontal className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Recent activity</div>
        </div>
        <div className="flex-1 px-3 pb-3 text-xs">
          <div className="space-y-3">
            {Object.entries(groupedActivity).map(([group, items]) => (
              <div key={group}>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {group}
                </div>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-700"
                    >
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </aside>
      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            {breadcrumbs.length === 0 ? (
              <span className="text-sm font-medium text-slate-900">{companyLabel}</span>
            ) : (
              breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                    {index > 0 && <span className="text-slate-400">/</span>}
                    {crumb.to && !isLast ? (
                      <Link to={crumb.to} className="text-sm font-medium text-sky-700 hover:underline">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-slate-900">{crumb.label}</span>
                    )}
                  </span>
                );
              })
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 text-sm">
              {MAIN_NAV_ITEMS.map((item) => {
                const isActive =
                  location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    className={[
                      'rounded-md px-3 py-1.5',
                      isActive
                        ? 'bg-slate-900 text-slate-50'
                        : 'text-slate-700 hover:bg-slate-100',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <Link
              to="/cui/settings"
              className="rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Settings
            </Link>
            <button
              type="button"
              aria-label="User profile"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700"
            >
              <User className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto px-6 py-4">{children}</div>
      </main>
    </div>
  );
}

export function CuiApp() {
  return (
    <CuiAppShell>
      <Outlet />
    </CuiAppShell>
  );
}
