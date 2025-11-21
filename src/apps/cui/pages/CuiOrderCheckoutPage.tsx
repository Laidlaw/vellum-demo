import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getCompanyById, getQuoteById } from '../../../data';
import type { Quote } from '../../../data';
import { Badge } from '../../shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { ScrollArea } from '../../shared/ui/scroll-area';
import { CUI_ACTIVE_COMPANY_ID } from '../config';

export function CuiOrderCheckoutPage() {
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get('quoteIds');
  const quoteIds = idsParam ? idsParam.split(',').filter(Boolean) : [];

  const company = useMemo(() => getCompanyById(CUI_ACTIVE_COMPANY_ID) ?? null, []);
  const quotes: Quote[] = useMemo(
    () =>
      quoteIds
        .map((id) => getQuoteById(id))
        .filter((quote): quote is Quote => Boolean(quote) && quote.companyId === CUI_ACTIVE_COMPANY_ID),
    [quoteIds],
  );

  const totalValue = quotes.reduce((sum, quote) => sum + quote.total.amount, 0);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Order checkout</h1>
          <p className="text-sm text-slate-600">
            Review destinations, contacts, and totals for the quotes you&apos;re about to convert into orders.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            This is a non-writing prototype: it shows how a final confirmation step for quote-to-order conversion could
            look inside customer admin.
          </p>
        </div>
        <Badge variant="info">{quoteIds.length} quotes selected</Badge>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Quotes included</CardTitle>
            </CardHeader>
            <CardContent>
              {quotes.length === 0 ? (
                <p className="text-sm text-slate-600">No valid quotes selected for this customer.</p>
              ) : (
                <ScrollArea maxHeight={260}>
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="py-2 pr-3 font-medium text-slate-500">Quote</th>
                        <th className="py-2 pr-3 font-medium text-slate-500">Expires</th>
                        <th className="py-2 pr-3 font-medium text-slate-500 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.map((quote) => (
                        <tr key={quote.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-1.5 pr-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">{quote.quoteNumber}</span>
                              <span className="text-xs text-slate-500">{quote.name}</span>
                            </div>
                          </td>
                          <td className="py-1.5 pr-3 text-xs text-slate-500">
                            {new Date(quote.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="py-1.5 pr-3 text-right">
                            ${quote.total.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Destination preview</CardTitle>
            </CardHeader>
            <CardContent>
              {company ? (
                <div className="space-y-1 text-xs text-slate-600">
                  <p className="text-sm font-medium text-slate-900">{company.name}</p>
                  <p>
                    Default shipping:{' '}
                    {company.locations.find((l) => l.isDefaultShipping)?.name ?? 'Not set'}
                  </p>
                  <p>
                    Default billing:{' '}
                    {company.locations.find((l) => l.isDefaultBilling)?.name ?? 'Not set'}
                  </p>
                  <p className="mt-2">
                    In a full implementation, this is where you&apos;d confirm ship-to locations and contacts per order
                    before submitting.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-600">No active company configured.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-slate-900">
                ${totalValue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                Combined quote total. In production, this would reflect the final order total after tax, shipping, and
                discounts.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                The primary action here would be something like &quot;Create draft orders&quot; or &quot;Submit orders
                to fulfillment&quot;, depending on how tightly you couple finance and operations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

