import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { COMPANY_INDEX, QUOTES, getCompanyById, getQuoteById } from '../../../data';
import type { Quote } from '../../../data';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';

interface QuoteCluster {
  id: string;
  companyId: string;
  locationLabel: string;
  contactLabel: string;
  quotes: Quote[];
}

export function QuoteConversionWorkspacePage() {
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);

  const approvedQuotes = useMemo(
    () =>
      QUOTES.filter((quote) => quote.status === 'approved' && !quote.orderReference).slice(0, 8),
    [],
  );

  const clusters: QuoteCluster[] = useMemo(() => {
    const map = new Map<string, QuoteCluster>();

    approvedQuotes.forEach((quote) => {
      const company = getCompanyById(quote.companyId);
      const locationLabel = company?.locations[0]?.name ?? 'Default location';
      const contactLabel = company?.contacts[0]
        ? `${company.contacts[0].firstName} ${company.contacts[0].lastName}`
        : 'Primary contact';

      const key = `${quote.companyId}:${locationLabel}:${contactLabel}`;
      const existing = map.get(key);

      if (existing) {
        existing.quotes.push(quote);
      } else {
        map.set(key, {
          id: key,
          companyId: quote.companyId,
          locationLabel,
          contactLabel,
          quotes: [quote],
        });
      }
    });

    return Array.from(map.values());
  }, [approvedQuotes]);

  const toggleQuote = (quoteId: string) => {
    setSelectedQuoteIds((prev) =>
      prev.includes(quoteId) ? prev.filter((id) => id !== quoteId) : [...prev, quoteId],
    );
  };

  const selectedQuotes = selectedQuoteIds
    .map((id) => getQuoteById(id))
    .filter((q): q is Quote => Boolean(q));

  const totalSelectedValue = selectedQuotes.reduce((sum, quote) => sum + quote.total.amount, 0);

  const allCompanies = COMPANY_INDEX;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Quote conversion workspace</h1>
          <p className="text-sm text-slate-600">
            Stage approved quotes, verify destinations, and convert them into orders without accidentally sending to the
            wrong location.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            This is a static domain sketch: all actions are disabled, but the layout shows how you could group quotes by
            destination and review them before committing.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right text-xs text-slate-500">
          <Badge variant="info">
            Selected quotes: {selectedQuoteIds.length} · Total value: ${totalSelectedValue.toLocaleString()}
          </Badge>
          <span>{approvedQuotes.length} approved quotes without orders in this dataset.</span>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved quotes ready for staging</CardTitle>
            </CardHeader>
            <CardContent>
              {approvedQuotes.length === 0 ? (
                <p className="text-sm text-slate-600">No approved quotes waiting to be converted.</p>
              ) : (
                <ScrollArea maxHeight={260}>
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="py-2 pr-3">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="py-2 pr-3 font-medium text-slate-500">Quote</th>
                        <th className="py-2 pr-3 font-medium text-slate-500">Company</th>
                        <th className="py-2 pr-3 font-medium text-slate-500 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedQuotes.map((quote) => {
                        const company = getCompanyById(quote.companyId);
                        const isSelected = selectedQuoteIds.includes(quote.id);
                        return (
                          <tr key={quote.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-1.5 pr-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleQuote(quote.id)}
                              />
                            </td>
                            <td className="py-1.5 pr-3">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900">{quote.quoteNumber}</span>
                                <span className="text-xs text-slate-500">{quote.name}</span>
                              </div>
                            </td>
                            <td className="py-1.5 pr-3 text-xs text-slate-600">{company?.name ?? '—'}</td>
                            <td className="py-1.5 pr-3 text-right">
                              ${quote.total.amount.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clusters by destination</CardTitle>
            </CardHeader>
            <CardContent>
              {clusters.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Once quotes are approved, this section groups them by location and contact so you can see which orders
                  you&apos;re about to create.
                </p>
              ) : (
                <ScrollArea maxHeight={260}>
                  <ul className="space-y-2 text-sm">
                    {clusters.map((cluster) => {
                      const isClusterSelected = cluster.quotes.some((quote) =>
                        selectedQuoteIds.includes(quote.id),
                      );
                      const clusterTotal = cluster.quotes.reduce(
                        (sum, quote) => sum + quote.total.amount,
                        0,
                      );
                      return (
                        <li
                          key={cluster.id}
                          className="flex flex-col gap-1 rounded-md border border-slate-200 px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {cluster.locationLabel}
                              </p>
                              <p className="text-xs text-slate-500">
                                Contact: {cluster.contactLabel} · Quotes:{' '}
                                {cluster.quotes.length}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 text-right">
                              <p className="text-xs text-slate-500">
                                Cluster total: ${clusterTotal.toLocaleString()}
                              </p>
                              <div className="flex flex-wrap gap-1 text-xs">
                                <Button size="sm" variant="outline" disabled={!isClusterSelected}>
                                  Review cluster
                                </Button>
                                <Button size="sm" disabled={!isClusterSelected}>
                                  Convert to order
                                </Button>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Companies in scope</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-xs text-slate-600">
                {allCompanies.map((company) => (
                  <li key={company.id}>
                    <Link
                      to={`/ccx/companies/${company.id}/finance`}
                      className="text-sky-700 underline"
                    >
                      {company.name}
                    </Link>{' '}
                    — check terms and credit before converting.
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Design notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
                <li>
                  Quote approval and order conversion stay distinct: finance can approve pricing and terms without
                  committing to a specific destination.
                </li>
                <li>
                  Conversion happens at the cluster level, where ship-to location and contact are explicit, reducing the
                  risk of sending to the wrong store.
                </li>
                <li>
                  Future iterations could pull in more detail from orders and inventory (e.g., delivery windows, stock
                  constraints) before allowing conversion.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

