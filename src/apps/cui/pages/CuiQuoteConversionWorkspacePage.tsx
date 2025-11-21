import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { QUOTES, getCompanyById, getQuoteById } from '../../../data';
import type { Quote } from '../../../data';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { ScrollArea } from '../../shared/ui/scroll-area';
import { CUI_ACTIVE_COMPANY_ID } from '../config';

interface QuoteCluster {
  id: string;
  locationLabel: string;
  contactLabel: string;
  quotes: Quote[];
}

export function CuiQuoteConversionWorkspacePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialIdsParam = searchParams.get('quoteIds');
  const initialSelectedIds = initialIdsParam ? initialIdsParam.split(',').filter(Boolean) : [];
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>(initialSelectedIds);

  const company = useMemo(() => getCompanyById(CUI_ACTIVE_COMPANY_ID) ?? null, []);

  const approvedQuotes = useMemo(
    () =>
      QUOTES.filter(
        (quote) => quote.companyId === CUI_ACTIVE_COMPANY_ID && quote.status === 'approved' && !quote.orderReference,
      ),
    [],
  );

  const clusters: QuoteCluster[] = useMemo(() => {
    if (!company) return [];

    const map = new Map<string, QuoteCluster>();

    approvedQuotes.forEach((quote) => {
      const locationLabel = company.locations[0]?.name ?? 'Default location';
      const contact = company.contacts[0];
      const contactLabel = contact ? `${contact.firstName} ${contact.lastName}` : 'Primary contact';

      const key = `${locationLabel}:${contactLabel}`;
      const existing = map.get(key);

      if (existing) {
        existing.quotes.push(quote);
      } else {
        map.set(key, {
          id: key,
          locationLabel,
          contactLabel,
          quotes: [quote],
        });
      }
    });

    return Array.from(map.values());
  }, [approvedQuotes, company]);

  const toggleQuote = (quoteId: string) => {
    setSelectedQuoteIds((prev) =>
      prev.includes(quoteId) ? prev.filter((id) => id !== quoteId) : [...prev, quoteId],
    );
  };

  const selectedQuotes = selectedQuoteIds
    .map((id) => getQuoteById(id))
    .filter((q): q is Quote => Boolean(q));

  const totalSelectedValue = selectedQuotes.reduce((sum, quote) => sum + quote.total.amount, 0);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Quote conversion</h1>
          <p className="text-sm text-slate-600">
            Stage approved quotes for this customer, confirm the right location and contact, and then convert them into
            orders.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Nothing here writes data yet — this is a safe playground to explore how a staging step could work inside the
            customer admin workspace.
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
                <p className="text-sm text-slate-600">
                  No approved quotes waiting to be converted for this customer.
                </p>
              ) : (
                <ScrollArea maxHeight={260}>
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="py-2 pr-3">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="py-2 pr-3 font-medium text-slate-500">Quote</th>
                        <th className="py-2 pr-3 font-medium text-slate-500">Expires</th>
                        <th className="py-2 pr-3 font-medium text-slate-500 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedQuotes.map((quote) => {
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
                            <td className="py-1.5 pr-3 text-xs text-slate-500">
                              {new Date(quote.expiresAt).toLocaleDateString()}
                            </td>
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
                      const selectedIdsForCluster = cluster.quotes
                        .map((quote) => quote.id)
                        .filter((id) => selectedQuoteIds.includes(id));
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
                                Contact: {cluster.contactLabel} · Quotes: {cluster.quotes.length}
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
                                  <Button
                                    size="sm"
                                    disabled={!isClusterSelected}
                                    onClick={() => {
                                      if (!selectedIdsForCluster.length) return;
                                      const params = new URLSearchParams({
                                        quoteIds: selectedIdsForCluster.join(','),
                                      });
                                      navigate(`/cui/orders/checkout?${params.toString()}`);
                                    }}
                                  >
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
              <CardTitle>Company context</CardTitle>
            </CardHeader>
            <CardContent>
              {company ? (
                <div className="space-y-1 text-xs text-slate-600">
                  <p className="text-sm font-medium text-slate-900">{company.name}</p>
                  <p>Ordering status: {company.orderingStatus}</p>
                  <p>
                    Credit utilization:{' '}
                    {company.credit.creditLimit
                      ? `${Math.round(
                          ((company.credit.creditUsed?.amount ?? 0) /
                            (company.credit.creditLimit.amount || 1)) *
                            100,
                        )}%`
                      : 'Not set'}
                  </p>
                  <p>
                    Default billing:{' '}
                    {company.locations.find((l) => l.isDefaultBilling)?.name ?? 'Not set'}
                  </p>
                  <p>
                    Default shipping:{' '}
                    {company.locations.find((l) => l.isDefaultShipping)?.name ?? 'Not set'}
                  </p>
                  <p className="mt-2">
                    <Link to="/cui/settings" className="text-sky-700 underline">
                      Manage company settings
                    </Link>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-600">No active company configured.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Design notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
                <li>
                  Quote approval and conversion stay distinct, so finance can approve pricing and terms without
                  committing to a specific destination yet.
                </li>
                <li>
                  Conversion happens at the cluster level, where ship-to location and contact are explicit, reducing the
                  risk of sending to the wrong store.
                </li>
                <li>
                  Future iterations can add per-location preferences from Company settings (e.g., delivery windows,
                  payment methods) before allowing conversion.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
