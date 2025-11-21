import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getCompanyById, getInvoicesForCompany } from '../../../data';
import type { ExceptionsWorkspaceProps, ExceptionsWorkspaceState, ExceptionItem } from '../domain';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export interface ExceptionsWorkspacePageProps {
  initialState?: ExceptionsWorkspaceState;
  onStateChange?(next: ExceptionsWorkspaceState): void;
}

export function ExceptionsWorkspacePage() {
  const { companyId } = useParams<{ companyId: string }>();
  const state: ExceptionsWorkspaceState | null = useMemo(() => {
    if (!companyId) return null;
    const company = getCompanyById(companyId);
    if (!company) return null;

    const invoices = getInvoicesForCompany(company.id);
    const items: ExceptionItem[] = invoices.flatMap((invoice) =>
      (invoice.exceptions ?? []).map((ex) => ({
        id: ex.id,
        type: ex.type,
        status: ex.status,
        summary: ex.summary,
      })),
    );

    return {
      company,
      invoice: undefined,
      items,
    };
  }, [companyId]);

  const propsSignature: ExceptionsWorkspaceProps | null = state
    ? {
        state,
        onCreateException() {},
        onResolveException() {},
      }
    : null;

  const [activeFilter, setActiveFilter] = useState<'all' | 'pricing' | 'delivery' | 'tax' | 'payment'>('all');

  if (!propsSignature) {
    return (
      <section>
        <h1 className="text-xl font-semibold text-slate-900">Exceptions &amp; disputes workspace</h1>
        <p className="text-sm text-slate-600">No company found for ID: {companyId ?? '—'}.</p>
      </section>
    );
  }

  const { company, items } = propsSignature.state;
  const filteredItems =
    activeFilter === 'all' ? items : items.filter((item) => item.type === activeFilter);

  const openCount = items.filter((item) => item.status !== 'resolved').length;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Exceptions &amp; disputes</h1>
          <p className="text-sm text-slate-600">
            {company.name} · Centralize pricing, delivery, tax, and payment issues tied to invoices.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <Badge variant={openCount > 0 ? 'warning' : 'success'}>
            {openCount > 0 ? `${openCount} open exceptions` : 'No open exceptions'}
          </Badge>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Exception list</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                {(['all', 'pricing', 'delivery', 'tax', 'payment'] as const).map((filter) => {
                  const isActive = activeFilter === filter;
                  return (
                    <Button
                      key={filter}
                      variant={isActive ? 'default' : 'outline'}
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter === 'all'
                        ? 'All'
                        : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Button>
                  );
                })}
              </div>

              {filteredItems.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No exceptions in this category yet. As we wire in real data, items will appear here when invoices fail
                  checks or customers raise disputes.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {filteredItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-md border border-slate-200 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{item.summary}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Type: {item.type} · Status: {item.status.replace('_', ' ')}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.status === 'resolved'
                            ? 'success'
                            : item.status === 'in_progress'
                              ? 'info'
                              : 'warning'
                        }
                      >
                        {item.status === 'resolved'
                          ? 'Resolved'
                          : item.status === 'in_progress'
                            ? 'In progress'
                            : 'Open'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Design notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
                <li>
                  Exceptions should be created automatically from system checks (e.g., failed 3-way match, overdue
                  invoices) and manually by finance when they see something off.
                </li>
                <li>
                  Each exception needs a clear owner and lifecycle so that context isn&apos;t lost between approvers,
                  matching the blueprint&apos;s concern about call logging and async communication.
                </li>
                <li>
                  Future iterations can add linking from invoice details so a finance user can jump straight into the
                  relevant exception thread.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
