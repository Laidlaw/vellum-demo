import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { INVOICES, getCompanyById, getInvoiceById, getQuoteById } from '../../../data';
import type { InvoiceReviewWorkspaceProps, InvoiceReviewWorkspaceState } from '../../ccx/domain';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { ScrollArea } from '../../shared/ui/scroll-area';
import { Tabs } from '../../shared/ui/tabs';

export interface CuiInvoiceReviewWorkspacePageProps {
  initialState?: InvoiceReviewWorkspaceState;
  onStateChange?(next: InvoiceReviewWorkspaceState): void;
}

export function CuiInvoiceReviewWorkspacePage() {
  const { invoiceId, view } = useParams<{ invoiceId: string; view?: string }>();
  const navigate = useNavigate();
  const initialView = (view === 'lines' || view === 'history' || view === 'summary' ? view : 'summary') ?? 'summary';
  const [activeView, setActiveView] = useState<'summary' | 'lines' | 'history'>(initialView);

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
          // no-op for demo
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
      <section className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-slate-900">Invoice review workspace</h1>
        <p className="text-sm text-slate-600">No invoice found for ID: {invoiceId ?? '—'}.</p>
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

  const [localApprovalStatus, setLocalApprovalStatus] = useState<typeof approvalStatus>(approvalStatus);

  const statusVariant: 'default' | 'success' | 'warning' | 'critical' =
    localApprovalStatus === 'approved' ? 'success' : localApprovalStatus === 'blocked' ? 'critical' : 'warning';

  const relatedInvoices = useMemo(
    () =>
      INVOICES.filter(
        (other) => other.companyId === company.id && other.id !== invoice.id && other.status !== 'draft',
      ).slice(0, 3),
    [company.id, invoice.id],
  );

  const historyEvents = useMemo(() => {
    type HistoryEvent = {
      id: string;
      occurredAt: string;
      label: string;
      detail?: string;
    };

    const events: HistoryEvent[] = [];

    if (originatingQuote) {
      for (const event of originatingQuote.history) {
        events.push({
          id: `quote-${event.id}`,
          occurredAt: event.occurredAt,
          label: `Quote ${event.type}`,
          detail: event.note
            ? `${event.actor}: ${event.note}`
            : event.actor,
        });
      }
    }

    events.push({
      id: 'invoice-issued',
      occurredAt: invoice.issuedAt,
      label: 'Invoice issued',
      detail: `Total ${invoice.total.amount.toLocaleString('en-US', {
        style: 'currency',
        currency: invoice.total.currencyCode,
      })}`,
    });

    for (const payment of invoice.payments) {
      events.push({
        id: payment.id,
        occurredAt: payment.processedAt,
        label: `Payment received (${payment.method.toUpperCase()})`,
        detail: `${payment.amount.amount.toLocaleString('en-US', {
          style: 'currency',
          currency: payment.amount.currencyCode,
        })}${payment.reference ? ` · Ref ${payment.reference}` : ''}`,
      });
    }

    if (invoice.paidAt) {
      events.push({
        id: 'invoice-paid',
        occurredAt: invoice.paidAt,
        label: 'Invoice marked paid',
        detail: 'Balance cleared',
      });
    }

    events.sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );

    return events;
  }, [invoice, originatingQuote]);

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
            {localApprovalStatus === 'pending'
              ? 'Ready for review'
              : localApprovalStatus === 'approved'
                ? 'Approved for payment'
                : localApprovalStatus === 'blocked'
                  ? 'Blocked'
                  : 'Draft'}
          </Badge>

          <div className="flex flex-wrap gap-1 text-xs">
            <Button
              variant="outline"
              onClick={() => setLocalApprovalStatus('approved')}
            >
              Approve for payment
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocalApprovalStatus('blocked')}
            >
              Put on hold
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/cui/invoices/${invoice.id}/pay`)}
            >
              Pay or schedule
            </Button>
          </div>
        </div>
      </header>

      <Tabs
        value={activeView}
        onValueChange={(next) => {
          const nextView = next as typeof activeView;
          setActiveView(nextView);
          navigate(`/cui/invoices/${invoice.id}/review/${nextView}`);
        }}
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
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-slate-500">List total</dt>
                        <dd>${priceView.listTotal.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Discounts</dt>
                        <dd>${priceView.discountTotal.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Surcharges</dt>
                        <dd>${priceView.surchargeTotal.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Final total</dt>
                        <dd className="font-semibold">${priceView.finalTotal.toLocaleString()}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Inventory &amp; fulfillment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700">
                      {inventoryView.hasSufficientInventory
                        ? 'Sufficient inventory to fulfill this invoice.'
                        : 'Insufficient inventory; some items will be backordered.'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Policy checks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Three-way match</dt>
                        <dd>{threeWayMatch.status === 'passed' ? 'Passed' : 'Not applicable'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Price variance</dt>
                        <dd>{varianceSummary.hasPriceVariance ? 'Variance detected' : 'Within tolerance'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Quantity variance</dt>
                        <dd>{varianceSummary.hasQuantityVariance ? 'Variance detected' : 'Within tolerance'}</dd>
                      </div>
                    </dl>
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
                  <ScrollArea maxHeight={320}>
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
                  <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                  {historyEvents.length === 0 ? (
                    <p className="text-sm text-slate-600">
                      No lifecycle events recorded yet for this invoice.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {historyEvents.map((event) => (
                        <li
                          key={event.id}
                          className="flex items-start gap-2"
                        >
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">
                              {new Date(event.occurredAt).toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-700">{event.label}</p>
                            {event.detail ? (
                              <p className="text-xs text-slate-500">{event.detail}</p>
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
                </dl>
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  {invoice.status === 'paid' ? (
                    <p>Invoice paid · review in history for payment details.</p>
                  ) : localApprovalStatus === 'approved' ? (
                    <>
                      <p>Approved for payment.</p>
                      <p>
                        Next step:{' '}
                        <Link
                          to="/ccx/pay-runs"
                          className="font-medium text-sky-700 underline"
                        >
                          add to pay run
                        </Link>
                        .
                      </p>
                    </>
                  ) : localApprovalStatus === 'blocked' ? (
                    <>
                      <p>Invoice is on hold due to a discrepancy.</p>
                      <p>
                        Next step:{' '}
                        <Link
                          to={`/ccx/companies/${company.id}/exceptions`}
                          className="font-medium text-sky-700 underline"
                        >
                          review exceptions
                        </Link>
                        .
                      </p>
                    </>
                  ) : (
                    <>
                      <p>Review this invoice and confirm whether it should be approved for payment or put on hold.</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company &amp; terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-slate-900">{company.name}</p>
                <p className="mb-3 text-xs text-slate-500">Company ID: {company.id}</p>
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

      {relatedInvoices.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Related invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-xs text-slate-500">
              Wizard-of-Oz logic for now: showing a few other non-draft invoices for this customer so you can imagine
              how a &quot;next up&quot; rail might work.
            </p>
            <ScrollArea maxHeight={160}>
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-2 pr-3 font-medium text-slate-500">Invoice</th>
                    <th className="py-2 pr-3 font-medium text-slate-500">Status</th>
                    <th className="py-2 pr-3 font-medium text-slate-500">Due</th>
                    <th className="py-2 pr-3 font-medium text-slate-500 text-right">Balance due</th>
                    <th className="py-2 font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedInvoices.map((other) => (
                    <tr key={other.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-1.5 pr-3 text-sm text-slate-700">{other.invoiceNumber}</td>
                      <td className="py-1.5 pr-3 text-xs capitalize text-slate-600">{other.status}</td>
                      <td className="py-1.5 pr-3 text-xs text-slate-500">
                        {new Date(other.dueAt).toLocaleDateString()}
                      </td>
                      <td className="py-1.5 pr-3 text-right text-sm text-slate-700">
                        ${other.balanceDue.amount.toLocaleString()}
                      </td>
                      <td className="py-1.5">
                        <Link
                          to={`/cui/invoices/${other.id}/review`}
                          className="text-xs font-medium text-sky-700 underline"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
