import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getCompanyById, getInvoicesForCompany } from '../../../data';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function InvoicesOverviewPage() {
  const { companyId } = useParams<{ companyId: string }>();

  const state = useMemo(() => {
    if (!companyId) return null;
    const company = getCompanyById(companyId);
    if (!company) return null;

    const invoices = getInvoicesForCompany(company.id);
    return { company, invoices };
  }, [companyId]);

  if (!state) {
    return (
      <section>
        <h1 className="text-xl font-semibold text-slate-900">Invoices overview</h1>
        <p className="text-sm text-slate-600">No company found for ID: {companyId ?? '—'}.</p>
      </section>
    );
  }

  const { company, invoices } = state;

  const openInvoices = invoices.filter((invoice) => invoice.status !== 'paid');
  const overdueInvoices = invoices.filter((invoice) => invoice.status === 'overdue');

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Invoices overview</h1>
          <p className="text-sm text-slate-600">
            {company.name} · Browse invoices for this company and drill into the review workspace.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <Badge variant={overdueInvoices.length > 0 ? 'warning' : 'success'}>
            {overdueInvoices.length > 0
              ? `${overdueInvoices.length} overdue · ${openInvoices.length} open`
              : `${openInvoices.length} open invoices`}
          </Badge>
          <p className="text-xs text-slate-500">
            Total invoices in view: {invoices.length}
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Invoices for this company</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-slate-600">
              There are no invoices for this company yet. Once invoices are issued, they will appear here.
            </p>
          ) : (
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="py-2 pr-3 font-medium text-slate-500">Invoice</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Status</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Issued</th>
                  <th className="py-2 pr-3 font-medium text-slate-500">Due</th>
                  <th className="py-2 pr-3 font-medium text-slate-500 text-right">Total</th>
                  <th className="py-2 font-medium text-slate-500 text-right">Balance due</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-1.5 pr-3">
                      <Link
                        to={`/ccx/invoices/${invoice.id}/review`}
                        className="font-medium text-sky-700 hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-3 text-xs capitalize text-slate-600">
                      {invoice.status}
                      {invoice.plannedPayRunId ? (
                        <span className="ml-1 text-[11px] text-sky-700">(scheduled)</span>
                      ) : null}
                    </td>
                    <td className="py-1.5 pr-3 text-xs text-slate-500">
                      {new Date(invoice.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="py-1.5 pr-3 text-xs text-slate-500">
                      {new Date(invoice.dueAt).toLocaleDateString()}
                    </td>
                    <td className="py-1.5 pr-3 text-right">
                      ${invoice.total.amount.toLocaleString()}
                    </td>
                    <td className="py-1.5 text-right">
                      ${invoice.balanceDue.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
