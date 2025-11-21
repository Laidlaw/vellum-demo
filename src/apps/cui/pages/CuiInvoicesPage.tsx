import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { INVOICES } from '../../../data';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { ScrollArea } from '../../shared/ui/scroll-area';
import { CUI_ACTIVE_COMPANY_ID } from '../config';

type InvoiceFlowStage = 'pending_approval' | 'approved' | 'released' | 'paid';

export function CuiInvoicesPage() {
  const params = useParams<{ invoiceId?: string }>();
  const focusedInvoiceId = params.invoiceId;

  const initialInvoices = useMemo(
    () =>
      INVOICES.filter((invoice) => invoice.companyId === CUI_ACTIVE_COMPANY_ID).map((invoice) => {
        const initialStage: InvoiceFlowStage =
          invoice.status === 'draft'
            ? 'pending_approval'
            : invoice.status === 'paid'
              ? 'paid'
              : 'approved';
        return { ...invoice, flowStage: initialStage } as typeof invoice & { flowStage: InvoiceFlowStage };
      }),
    [],
  );

  const [invoiceFlow, setInvoiceFlow] = useState(initialInvoices);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === invoices.length ? [] : invoices.map((invoice) => invoice.id),
    );
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]));
  };

  const updateStage = (nextStage: InvoiceFlowStage) => {
    setInvoiceFlow((prev) =>
      prev.map((invoice) => (selectedIds.includes(invoice.id) ? { ...invoice, flowStage: nextStage } : invoice)),
    );
  };

  const invoices = invoiceFlow;

  const metrics = useMemo(() => {
    let openBalance = 0;
    let pendingApproval = 0;
    let scheduledOrFinanced = 0;

    invoices.forEach((invoice) => {
      if (invoice.status !== 'paid') {
        openBalance += invoice.balanceDue.amount;
      }
      if (invoice.flowStage === 'pending_approval') {
        pendingApproval += 1;
      }
      if (
        invoice.paymentSchedule?.length ||
        (invoice.status === 'partial' && invoice.payments.length > 0)
      ) {
        scheduledOrFinanced += 1;
      }
    });

    return { openBalance, pendingApproval, scheduledOrFinanced, count: invoices.length };
  }, [invoices]);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-600">
            Approve one or many invoices and move them through the flow until they are paid off.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            This is a simulation: changes are local to this session, so you can iterate on the UX safely.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Open balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">
              ${metrics.openBalance.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">
              Across {metrics.count} invoices for this customer.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending approval</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{metrics.pendingApproval}</p>
            <p className="text-xs text-slate-500">Invoices that need review before payment.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Scheduled &amp; financed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{metrics.scheduledOrFinanced}</p>
            <p className="text-xs text-slate-500">
              Invoices with installment schedules or partial payments recorded.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>All invoices for this customer</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Button
                variant="outline"
                onClick={() => updateStage('approved')}
                disabled={selectedIds.length === 0}
              >
                Approve selected for payment
              </Button>
              <Button
                variant="outline"
                onClick={() => updateStage('released')}
                disabled={selectedIds.length === 0}
              >
                Put selected on hold
              </Button>
              <Button
                onClick={() => updateStage('paid')}
                disabled={selectedIds.length === 0}
              >
                Mark selected as paid
              </Button>
              <span className="text-slate-500">
                Selected invoices: {selectedIds.length}
                {focusedInvoiceId ? ` · Focused: ${focusedInvoiceId}` : ''}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea maxHeight={420}>
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="py-2 pr-3 font-medium text-slate-500">
                    <input
                      type="checkbox"
                      aria-label="Select all invoices"
                      checked={selectedIds.length > 0 && selectedIds.length === invoices.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Invoice</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Status</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Due</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Quote</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Order ref</th>
                  <th className="py-2 pr-3 font-medium text-slate-500 text-right">Total</th>
                  <th className="py-2 font-medium text-slate-500 text-right">Balance due</th>
                  <th className="py-2 font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const isSelected = selectedIds.includes(invoice.id);
                  const stageBadgeVariant: 'default' | 'success' | 'warning' | 'critical' =
                    invoice.flowStage === 'pending_approval'
                      ? 'warning'
                      : invoice.flowStage === 'approved'
                        ? 'info'
                        : invoice.flowStage === 'released'
                          ? 'default'
                          : 'success';
                  const statusLabel =
                    invoice.flowStage === 'pending_approval'
                      ? 'Pending approval'
                      : invoice.flowStage === 'approved'
                        ? 'Approved'
                        : invoice.flowStage === 'released'
                          ? 'Released'
                          : 'Paid';

                  const nextActionLabel =
                    invoice.flowStage === 'pending_approval'
                      ? 'Approve'
                      : invoice.flowStage === 'approved' || invoice.flowStage === 'released'
                        ? 'Pay or schedule'
                        : 'View details';

                  return (
                    <tr key={invoice.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-1.5 pr-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelected(invoice.id)}
                        />
                      </td>
                      <td className="py-1.5 pr-3">
                        <Link
                          to={`/cui/invoices/${invoice.id}/review`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-3 text-xs text-slate-600">
                        <Badge variant={stageBadgeVariant}>{statusLabel}</Badge>
                      </td>
                      <td className="py-1.5 pr-3 text-xs text-slate-500">
                        {new Date(invoice.dueAt).toLocaleDateString()}
                      </td>
                      <td className="py-1.5 pr-3 text-xs text-slate-600">
                        {invoice.quoteId ?? '—'}
                      </td>
                      <td className="py-1.5 pr-3 text-xs text-slate-600">
                        {invoice.orderId ?? '—'}
                      </td>
                      <td className="py-1.5 pr-3 text-right">${invoice.total.amount.toLocaleString()}</td>
                      <td className="py-1.5 pr-3 text-right">${invoice.balanceDue.amount.toLocaleString()}</td>
                      <td className="py-1.5">
                        <div className="flex flex-wrap gap-1 text-xs">
                          <Link
                            to={
                              invoice.flowStage === 'approved' || invoice.flowStage === 'released'
                                ? `/cui/invoices/${invoice.id}/pay`
                                : `/cui/invoices/${invoice.id}/review`
                            }
                            className="rounded border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                          >
                            {nextActionLabel}
                          </Link>
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
