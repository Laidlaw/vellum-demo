import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { QUOTES, getCompanySummaryById, type Quote } from '../../../data';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { ScrollArea } from '../../shared/ui/scroll-area';
import { CUI_ACTIVE_COMPANY_ID } from '../config';

export function CuiQuotesPage() {
  const navigate = useNavigate();

  const [quotes, setQuotes] = useState<Quote[]>(() =>
    QUOTES.filter((quote) => quote.companyId === CUI_ACTIVE_COMPANY_ID),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const summary = useMemo(() => {
    let pendingApproval = 0;
    let draft = 0;
    let readyToConvert = 0;
    let totalValue = 0;

    quotes.forEach((quote) => {
      totalValue += quote.total.amount;
      if (quote.status === 'pending_approval') {
        pendingApproval += 1;
      } else if (quote.status === 'draft') {
        draft += 1;
      } else if (quote.status === 'approved' && !quote.orderReference) {
        readyToConvert += 1;
      }
    });

    return { pendingApproval, draft, readyToConvert, totalValue };
  }, [quotes]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]));
  };

  const approveQuotes = (ids: string[]) => {
    setQuotes((prev) =>
      prev.map((quote) => (ids.includes(quote.id) ? { ...quote, status: 'approved' as Quote['status'] } : quote)),
    );
  };

  const handleBulkApprove = () => {
    if (!selectedIds.length) return;
    approveQuotes(selectedIds);
  };

  const handleBulkConvert = () => {
    if (!selectedIds.length) return;
    const params = new URLSearchParams({ quoteIds: selectedIds.join(',') });
    navigate(`/cui/quotes/convert?${params.toString()}`);
  };

  const handleRowConvert = (id: string) => {
    const params = new URLSearchParams({ quoteIds: id });
    navigate(`/cui/quotes/convert?${params.toString()}`);
  };

  const computeExpiryLabel = (expiresAt: string) => {
    const now = new Date();
    const target = new Date(expiresAt);
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (Number.isNaN(diffDays)) return '';
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays <= 7) return `Expires in ${diffDays} days`;
    return '';
  };

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Quotes</h1>
          <p className="text-sm text-slate-600">
            See quotes awaiting approval, at risk of expiry, and ready to convert into orders and invoices.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Approve pricing and terms here, then stage approved quotes into orders in the conversion workspace before
            confirming destinations and moving on to invoice review.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-500">
          <div className="flex flex-wrap gap-1">
            <Badge variant="warning">Pending approvals: {summary.pendingApproval}</Badge>
            <Badge variant="default">Draft: {summary.draft}</Badge>
            <Badge variant="success">Ready to convert: {summary.readyToConvert}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span>Total value: ${summary.totalValue.toLocaleString()}</span>
            <div className="flex flex-wrap gap-1 text-xs">
              <Button
                variant="outline"
                onClick={handleBulkApprove}
                disabled={selectedIds.length === 0}
              >
                Approve selected
              </Button>
              <Button
                variant="outline"
                onClick={handleBulkConvert}
                disabled={selectedIds.length === 0}
              >
                Stage selected for orders
              </Button>
            </div>
            <Link
              to="/cui/quotes/convert"
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Plan conversions
            </Link>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Quote list</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea maxHeight={420}>
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="py-2 pr-3 font-medium text-slate-500">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Quote</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Status</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Sales rep</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">PO</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Expires</th>
                  <th className="py-2 pr-3 font-medium text-slate-500 text-right">Total</th>
                  <th className="py-2 font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => {
                  const company = getCompanySummaryById(quote.companyId);
                  const statusVariant: 'default' | 'success' | 'warning' | 'critical' =
                    quote.status === 'approved'
                      ? 'success'
                      : quote.status === 'pending_approval'
                        ? 'warning'
                        : quote.status === 'rejected'
                          ? 'critical'
                          : 'default';

                  return (
                    <tr key={quote.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-1.5 pr-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(quote.id)}
                          onChange={() => toggleSelected(quote.id)}
                        />
                      </td>
                      <td className="py-1.5 pr-3">
                        <div className="flex flex-col">
                          <Link
                            to={`/cui/quotes/${quote.id}`}
                            className="font-medium text-slate-900 hover:underline"
                          >
                            {quote.quoteNumber}
                          </Link>
                          <span className="text-xs text-slate-500">
                            {quote.name}
                            {computeExpiryLabel(quote.expiresAt)
                              ? ` · ${computeExpiryLabel(quote.expiresAt)}`
                              : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-1.5 pr-3 text-xs text-slate-600">
                        <Badge variant={statusVariant}>{quote.status.replace('_', ' ')}</Badge>
                      </td>
                      <td className="py-1.5 pr-3 text-xs text-slate-600">
                        {quote.salesRep ?? '—'}
                      </td>
                      <td className="py-1.5 pr-3 text-xs text-slate-600">
                        {quote.purchaseOrderNumber ?? '—'}
                      </td>
                      <td className="py-1.5 pr-3 text-xs text-slate-500">
                        {new Date(quote.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-1.5 pr-3 text-right">${quote.total.amount.toLocaleString()}</td>
                      <td className="py-1.5">
                        <div className="flex flex-wrap gap-1 text-xs">
                          <Button
                            variant="outline"
                            onClick={() => approveQuotes([quote.id])}
                            disabled={quote.status !== 'pending_approval' && quote.status !== 'draft'}
                          >
                            {quote.status === 'approved' ? 'Approved' : 'Approve'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRowConvert(quote.id)}
                            disabled={quote.status !== 'approved' || Boolean(quote.orderReference)}
                          >
                            Stage for order
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </section>
  );
}
