import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { PayRunPlannerProps, PayRunPlannerState } from '../domain';
import { getCompanyById, getInvoicesForCompany, markInvoicesScheduledForPayRun } from '../../../data';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export interface PayRunPlannerPageProps {
  initialState?: PayRunPlannerState;
  onStateChange?(next: PayRunPlannerState): void;
}

export function PayRunPlannerPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') ?? 'comp-abstract-industrial';

  const [cashBudget, setCashBudget] = useState<number | null>(50_000);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [lastRunSummary, setLastRunSummary] = useState<{
    id: string;
    companyName: string;
    invoiceCount: number;
    totalAmount: number;
    plannedPaymentDate: string;
  } | null>(null);

  const state: PayRunPlannerState | null = useMemo(() => {
    const company = getCompanyById(companyId);
    if (!company) return null;

    const invoices = getInvoicesForCompany(company.id).filter((invoice) =>
      ['draft', 'due', 'partial', 'overdue'].includes(invoice.status),
    );

    return {
      scope: 'company',
      company,
      invoices,
      selectedInvoiceIds,
      cashBudget,
    };
  }, [companyId, selectedInvoiceIds, cashBudget]);

  const propsSignature: PayRunPlannerProps | null = state
    ? {
        state,
        onToggleInvoice(invoiceId: string) {
          setSelectedInvoiceIds((current) =>
            current.includes(invoiceId) ? current.filter((id) => id !== invoiceId) : [...current, invoiceId],
          );
        },
        onChangeCashBudget(next: number | null) {
          setCashBudget(next);
        },
        onConfirmPayRun() {
          if (!state || selectedInvoiceIds.length === 0) {
            return;
          }

          const runId = `pr-${Date.now().toString(36)}`;
          const plannedDate = new Date();
          plannedDate.setDate(plannedDate.getDate() + 7);
          const plannedPaymentDateIso = plannedDate.toISOString();

          markInvoicesScheduledForPayRun(selectedInvoiceIds, plannedPaymentDateIso, runId);

          const totalAmount = selectedInvoices.reduce(
            (sum, invoice) => sum + invoice.balanceDue.amount,
            0,
          );

          setLastRunSummary({
            id: runId,
            companyName: state.company.name,
            invoiceCount: selectedInvoiceIds.length,
            totalAmount,
            plannedPaymentDate: plannedPaymentDateIso,
          });
        },
      }
    : null;

  if (!propsSignature || !propsSignature.state.company) {
    return (
      <section>
        <h1 className="text-xl font-semibold text-slate-900">Pay-run planner</h1>
        <p className="text-sm text-slate-600">
          No company found. Provide a <code>companyId</code> query parameter to scope the view.
        </p>
      </section>
    );
  }

  const {
    company,
    invoices,
    cashBudget: budget,
    selectedInvoiceIds: selectedIds,
  } = propsSignature.state;

  const selectedInvoices = invoices.filter((invoice) => selectedIds.includes(invoice.id));
  const totalSelected = selectedInvoices.reduce((sum, invoice) => sum + invoice.balanceDue.amount, 0);

  const overBudget = budget !== null && totalSelected > budget;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Pay-run planner</h1>
          <p className="text-sm text-slate-600">
            {company.name} · Select invoices to include in a pay run under a cash budget.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <Badge variant={overBudget ? 'critical' : 'info'}>
            Planned: ${totalSelected.toLocaleString()}
            {budget !== null ? ` / Budget: $${budget.toLocaleString()}` : ''}
          </Badge>
          <p className="text-xs text-slate-500">
            Open invoices in scope: {invoices.length} · Selected: {selectedInvoices.length}
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget &amp; strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <label className="text-slate-600" htmlFor="cash-budget">
                  Cash budget for this run
                </label>
                <input
                  id="cash-budget"
                  type="number"
                  min={0}
                  className="w-40 rounded-md border border-slate-300 px-2 py-1 text-right text-sm"
                  value={budget ?? ''}
                  onChange={(event) => {
                    const value = event.target.value.trim();
                    propsSignature.onChangeCashBudget(value === '' ? null : Number(value));
                  }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Use this panel to experiment with which invoices fit into a run. Future iterations can add automatic
                strategies (oldest first, maximize discounts, free up credit, etc.).
              </p>
              <Button
                variant={overBudget ? 'outline' : 'default'}
                disabled={selectedInvoices.length === 0 || overBudget}
                onClick={() => propsSignature.onConfirmPayRun()}
              >
                Confirm pay run (demo)
              </Button>
              {overBudget && (
                <p className="text-xs text-red-600">
                  Planned payments exceed the current budget. Deselect invoices or increase the budget.
                </p>
              )}
            </CardContent>
          </Card>
          {lastRunSummary && (
            <Card>
              <CardHeader>
                <CardTitle>Last confirmed pay run</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="text-slate-700">
                  Pay run <span className="font-mono text-xs">{lastRunSummary.id}</span> scheduled for{' '}
                  {new Date(lastRunSummary.plannedPaymentDate).toLocaleDateString()}.
                </p>
                <p className="text-slate-600">
                  {lastRunSummary.invoiceCount} invoice
                  {lastRunSummary.invoiceCount === 1 ? '' : 's'} for{' '}
                  <span className="font-semibold">
                    ${lastRunSummary.totalAmount.toLocaleString()}
                  </span>{' '}
                  planned for payment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Open invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No open invoices are available for this company. Once invoices are issued, they will appear here.
                </p>
              ) : (
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="py-2 pr-3 font-medium text-slate-500"></th>
                      <th className="py-2 pr-3 font-medium text-slate-500">Invoice</th>
                      <th className="py-2 pr-3 font-medium text-slate-500">Status</th>
                      <th className="py-2 pr-3 font-medium text-slate-500">Due</th>
                      <th className="py-2 pr-3 font-medium text-slate-500 text-right">Balance due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => {
                      const isSelected = selectedIds.includes(invoice.id);
                      const toneClass =
                        invoice.status === 'overdue'
                          ? 'text-red-600'
                          : invoice.status === 'partial'
                            ? 'text-amber-600'
                            : 'text-slate-600';

                      return (
                        <tr key={invoice.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-1.5 pr-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => propsSignature.onToggleInvoice(invoice.id)}
                            />
                          </td>
                          <td className="py-1.5 pr-3">{invoice.invoiceNumber}</td>
                          <td className={`py-1.5 pr-3 text-xs capitalize ${toneClass}`}>{invoice.status}</td>
                          <td className="py-1.5 pr-3 text-xs text-slate-500">
                            {new Date(invoice.dueAt).toLocaleDateString()}
                          </td>
                          <td className="py-1.5 text-right">
                            ${invoice.balanceDue.amount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
