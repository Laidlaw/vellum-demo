import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getCompanyById, getQuoteById } from '../../../data';
import { Badge } from '../../shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { ScrollArea } from '../../shared/ui/scroll-area';
import { Tabs } from '../../shared/ui/tabs';
import { CUI_ACTIVE_COMPANY_ID } from '../config';

export function CuiQuoteDetailPage() {
  const { quoteId } = useParams<{ quoteId: string }>();

  const { quote, company } = useMemo(() => {
    if (!quoteId) return { quote: null, company: null };
    const resolvedQuote = getQuoteById(quoteId) ?? null;
    if (!resolvedQuote || resolvedQuote.companyId !== CUI_ACTIVE_COMPANY_ID) {
      return { quote: null, company: null };
    }
    const resolvedCompany = getCompanyById(resolvedQuote.companyId) ?? null;
    return { quote: resolvedQuote, company: resolvedCompany };
  }, [quoteId]);

  if (!quote || !company) {
    return (
      <section className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Quote</h1>
        <p className="text-sm text-slate-600">No quote found for ID: {quoteId ?? '—'}.</p>
      </section>
    );
  }

  const statusVariant: 'default' | 'success' | 'warning' | 'critical' =
    quote.status === 'approved'
      ? 'success'
      : quote.status === 'pending_approval'
        ? 'warning'
        : quote.status === 'rejected'
          ? 'critical'
          : 'default';

  const [activeView, setActiveView] = useState<'summary' | 'lines' | 'history'>('summary');

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{quote.quoteNumber}</h1>
          <p className="text-sm text-slate-600">
            {quote.name} · {company.name}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Expires {new Date(quote.expiresAt).toLocaleDateString()} · Total ${quote.total.amount.toLocaleString()}
          </p>
        </div>
        <Badge variant={statusVariant}>{quote.status.replace('_', ' ')}</Badge>
      </header>

      <Tabs
        value={activeView}
        onValueChange={(next) => setActiveView(next as typeof activeView)}
        items={[
          { value: 'summary', label: 'Summary' },
          { value: 'lines', label: 'Line items' },
          { value: 'history', label: 'History' },
        ]}
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            {activeView === 'summary' && (
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Status</dt>
                      <dd className="capitalize">{quote.status.replace('_', ' ')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">PO number</dt>
                      <dd>{quote.purchaseOrderNumber ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Sales rep</dt>
                      <dd>{quote.salesRep ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Created</dt>
                      <dd>{new Date(quote.createdAt).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            )}

            {activeView === 'lines' && (
              <Card>
                <CardHeader>
                  <CardTitle>Line items</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea maxHeight={320}>
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left">
                          <th className="py-2 pr-3 font-medium text-slate-500">Item</th>
                          <th className="py-2 pr-3 font-medium text-slate-500">SKU</th>
                          <th className="py-2 pr-3 font-medium text-slate-500 text-right">Qty</th>
                          <th className="py-2 pr-3 font-medium text-slate-500 text-right">Unit price</th>
                          <th className="py-2 pr-3 font-medium text-slate-500 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quote.lineItems.map((line) => (
                          <tr key={line.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-1.5 pr-3">{line.title}</td>
                            <td className="py-1.5 pr-3 text-xs text-slate-500">{line.sku}</td>
                            <td className="py-1.5 pr-3 text-right">{line.quantity}</td>
                            <td className="py-1.5 pr-3 text-right">
                              ${line.unitPrice.amount.toLocaleString()}
                            </td>
                            <td className="py-1.5 pr-3 text-right">
                              ${line.total.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {activeView === 'history' && (
              <Card>
                <CardHeader>
                  <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                  {quote.history.length === 0 ? (
                    <p className="text-sm text-slate-600">No workflow history recorded for this quote.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {quote.history.map((event) => (
                        <li
                          key={event.id}
                          className="flex items-start gap-2"
                        >
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">
                              {new Date(event.occurredAt).toLocaleString()} · {event.actor}
                            </p>
                            <p className="text-sm text-slate-700 capitalize">{event.type.replace('_', ' ')}</p>
                            {event.note ? (
                              <p className="text-xs text-slate-500">{event.note}</p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Company</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-slate-900">{company.name}</p>
                <p className="mt-1 text-xs text-slate-500">Company ID: {company.id}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-xs text-slate-600">
                  {quote.status === 'draft' && (
                    <li>Finalize quantities and terms, then submit this quote for approval.</li>
                  )}
                  {quote.status === 'pending_approval' && (
                    <li>Review this quote in finance and either approve it or request changes.</li>
                  )}
                  {quote.status === 'approved' && !quote.orderReference && (
                    <li>
                      Convert this approved quote into one or more orders using the conversion workspace.
                    </li>
                  )}
                  {quote.status === 'approved' && !quote.orderReference && (
                    <li>
                      <Link
                        to={`/cui/quotes/convert?quoteIds=${quote.id}`}
                        className="font-medium text-sky-700 underline"
                      >
                        Open quote conversion workspace
                      </Link>
                      .
                    </li>
                  )}
                  {quote.status === 'approved' && quote.orderReference && (
                    <li>This quote has already been converted into orders.</li>
                  )}
                  {quote.status === 'rejected' && (
                    <li>Review rejection reasons and consider creating a revised quote.</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </section>
  );
}
