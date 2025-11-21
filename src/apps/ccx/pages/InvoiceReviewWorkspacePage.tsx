import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import type { InvoiceReviewWorkspaceProps, InvoiceReviewWorkspaceState } from '../domain';
import { getCompanyById, getInvoiceById, getQuoteById } from '../../../data';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs } from '../ui/tabs';

export interface InvoiceReviewWorkspacePageProps {
  initialState?: InvoiceReviewWorkspaceState;
  onStateChange?(next: InvoiceReviewWorkspaceState): void;
}

export function InvoiceReviewWorkspacePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [activeView, setActiveView] = useState<'summary' | 'lines' | 'history'>('summary');

  const state: InvoiceReviewWorkspaceState | null = useMemo(() => {
    if (!invoiceId) return null;
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) return null;
    const company = getCompanyById(invoice.companyId);
    if (!company) return null;
    const originatingQuote = invoice.quoteId ? getQuoteById(invoice.quoteId) : undefined;

    const priceView = {
      listTotal: invoice.subtotal.amount + invoice.taxTotal.amount + (invoice.shippingTotal?.amount ?? 0),
      discountTotal: 0,
      surchargeTotal: 0,
      finalTotal: invoice.total.amount,
    };

    const inventoryView: InvoiceReviewWorkspaceState['inventoryView'] = {
      hasSufficientInventory: true,
      backorderedQuantity: 0,
      earliestShipDate: undefined,
    };

    const threeWayMatch: InvoiceReviewWorkspaceState['threeWayMatch'] =
      invoice.status === 'draft'
        ? { status: 'not_applicable' }
        : {
            status: 'passed',
            reason: 'PO amount, receipt, and invoice line totals match within tolerance.',
          };

    const varianceSummary: InvoiceReviewWorkspaceState['varianceSummary'] = {
      hasPriceVariance: false,
      hasQuantityVariance: false,
      estimatedVarianceAmount: 0,
    };

    return {
      invoice,
      company,
      originatingQuote,
      priceView,
      inventoryView,
      approvalStatus: invoice.status === 'draft' ? 'pending' : 'approved',
      blockingReasons: [],
      threeWayMatch,
      varianceSummary,
    };
  }, [invoiceId]);

  const propsLike: InvoiceReviewWorkspaceProps | null = state
    ? {
        state,
        onApprove() {
          // no-op for now; this is a layout skeleton only.
        },
        onBlock() {
          // no-op
        },
        onRequestChange() {
          // no-op
        },
      }
    : null;

  if (!propsLike) {
    return (
      <section>
        <h1>Invoice review workspace</h1>
        <p>No invoice found for ID: {invoiceId ?? '—'}.</p>
      </section>
    );
  }

  const {
    invoice,
    company,
    originatingQuote,
    priceView,
    inventoryView,
    approvalStatus,
    threeWayMatch,
    varianceSummary,
  } = propsLike.state;

  const statusVariant: 'default' | 'success' | 'warning' | 'critical' =
    approvalStatus === 'approved' ? 'success' : approvalStatus === 'blocked' ? 'critical' : 'warning';

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Invoice {invoice.invoiceNumber}</h1>
          <p className="text-sm text-slate-600">
            {company.name} · Due {new Date(invoice.dueAt).toLocaleDateString()}
          </p>
          {originatingQuote ? (
            <p className="text-xs text-slate-500">Originating quote: {originatingQuote.quoteNumber}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant}>
            {approvalStatus === 'pending'
              ? 'Pending approval'
              : approvalStatus === 'approved'
                ? 'Approved for fulfillment'
                : approvalStatus === 'blocked'
                  ? 'Blocked'
                  : 'Draft'}
          </Badge>
          <Button variant="outline">Request changes</Button>
          <Button variant="outline">Block for follow-up</Button>
          <Button>Approve and release</Button>
        </div>
      </header>

      <Tabs
        value={activeView}
        onValueChange={(value) => setActiveView(value as typeof activeView)}
        items={[
          { value: 'summary', label: 'Summary' },
          { value: 'lines', label: 'Line items' },
          { value: 'history', label: 'History' },
        ]}
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            {activeView === 'summary' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Price breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-y-1 text-sm">
                      <div>
                        <dt className="text-slate-500">List total</dt>
                        <dd className="font-medium">${priceView.listTotal.toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Discounts</dt>
                        <dd className="font-medium">-${priceView.discountTotal.toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Surcharges &amp; fees</dt>
                        <dd className="font-medium">${priceView.surchargeTotal.toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Final total</dt>
                        <dd className="font-semibold">${priceView.finalTotal.toLocaleString()}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Inventory impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">
                      {inventoryView.hasSufficientInventory
                        ? 'All line items appear to have sufficient inventory for fulfillment.'
                        : 'One or more line items are short on inventory.'}
                    </p>
                    {!inventoryView.hasSufficientInventory && (
                      <p className="mt-2 text-xs text-slate-500">
                        Backordered quantity: {inventoryView.backorderedQuantity}. Earliest ship date:{' '}
                        {inventoryView.earliestShipDate ?? 'TBD'}.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>3-way match &amp; variance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-600">3-way match status</span>
                      <Badge
                        variant={
                          threeWayMatch.status === 'passed'
                            ? 'success'
                            : threeWayMatch.status === 'failed'
                              ? 'critical'
                              : 'default'
                        }
                      >
                        {threeWayMatch.status === 'passed'
                          ? 'Passed'
                          : threeWayMatch.status === 'failed'
                            ? 'Failed'
                            : 'Not applicable'}
                      </Badge>
                    </div>
                    {threeWayMatch.reason ? (
                      <p className="text-xs text-slate-500">{threeWayMatch.reason}</p>
                    ) : null}

                    <div className="mt-3 border-t border-slate-200 pt-3 text-sm">
                      <p className="text-slate-600">Variance summary</p>
                      {varianceSummary.hasPriceVariance || varianceSummary.hasQuantityVariance ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Estimated variance:{' '}
                          {varianceSummary.estimatedVarianceAmount !== undefined
                            ? `$${varianceSummary.estimatedVarianceAmount.toLocaleString()}`
                            : 'Unknown'}
                          .
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500">
                          No material price or quantity variance detected for this invoice.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeView === 'lines' && (
              <Card>
                <CardHeader>
                  <CardTitle>Line items</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea maxHeight={360}>
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left">
                          <th className="py-2 pr-3 font-medium text-slate-500">Item</th>
                          <th className="py-2 pr-3 font-medium text-slate-500">SKU</th>
                          <th className="py-2 pr-3 font-medium text-slate-500 text-right">Qty</th>
                          <th className="py-2 pr-3 font-medium text-slate-500 text-right">Unit price</th>
                          <th className="py-2 font-medium text-slate-500 text-right">Line total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.lineItems.map((line) => (
                          <tr key={line.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-1.5 pr-3">{line.title}</td>
                            <td className="py-1.5 pr-3 text-xs text-slate-500">{line.sku}</td>
                            <td className="py-1.5 pr-3 text-right">{line.quantity}</td>
                            <td className="py-1.5 pr-3 text-right">
                              ${line.unitPrice.amount.toLocaleString()}
                            </td>
                            <td className="py-1.5 text-right">${line.total.amount.toLocaleString()}</td>
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
                  <CardTitle>History &amp; exceptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-slate-600">
                    High-level view of how this invoice has moved through the procure-to-pay flow, including disputes
                    and exceptions.
                  </p>
                  {invoice.exceptions && invoice.exceptions.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {invoice.exceptions.map((ex) => (
                        <li
                          key={ex.id}
                          className="flex items-start justify-between gap-3 rounded-md border border-slate-200 px-3 py-2"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{ex.summary}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Type: {ex.type} · Status: {ex.status.replace('_', ' ')} · Opened{' '}
                              {new Date(ex.openedAt).toLocaleDateString()}
                              {ex.resolvedAt
                                ? ` · Resolved ${new Date(ex.resolvedAt).toLocaleDateString()}`
                                : ''}
                              {ex.owner ? ` · Owner: ${ex.owner}` : ''}
                            </p>
                          </div>
                          <Badge
                            variant={
                              ex.status === 'resolved'
                                ? 'success'
                                : ex.status === 'in_progress'
                                  ? 'info'
                                  : 'warning'
                            }
                          >
                            {ex.status === 'resolved'
                              ? 'Resolved'
                              : ex.status === 'in_progress'
                                ? 'In progress'
                                : 'Open'}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-600">
                      No exceptions are currently attached to this invoice. As checks and disputes are wired in, they
                      will appear here to give reviewers context.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice summary</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Status</dt>
                    <dd className="font-medium">{invoice.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Issued</dt>
                    <dd>{new Date(invoice.issuedAt).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Due</dt>
                    <dd>{new Date(invoice.dueAt).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Total</dt>
                    <dd className="font-semibold">${invoice.total.amount.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Balance due</dt>
                    <dd className="font-semibold">${invoice.balanceDue.amount.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Open exceptions</dt>
                    <dd>
                      {invoice.exceptions && invoice.exceptions.length > 0 ? (
                        <span className="font-medium">
                          {
                            invoice.exceptions.filter((ex) => ex.status !== 'resolved')
                              .length
                          }{' '}
                          open
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company &amp; terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-slate-900">{company.name}</p>
                <p className="text-xs text-slate-500 mb-3">Company ID: {company.id}</p>
                <p className="text-xs text-slate-600">
                  Payment terms:{' '}
                  {invoice.paymentTerms.type === 'net'
                    ? `Net ${invoice.paymentTerms.netDays ?? 0}`
                    : invoice.paymentTerms.type === 'due_on_receipt'
                      ? 'Due on receipt'
                      : 'Installments'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </section>
  );
}
