import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { getCompanyById, getInvoicesForCompany } from '../../../data';
import type { CreditExposureProps, CreditExposureState } from '../domain';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export interface CreditExposurePageProps {
  initialState?: CreditExposureState;
  onStateChange?(next: CreditExposureState): void;
}

export function CreditExposurePage() {
  const { companyId } = useParams<{ companyId: string }>();
  const state: CreditExposureState | null = useMemo(() => {
    if (!companyId) return null;
    const company = getCompanyById(companyId);
    if (!company) return null;

    const openInvoices = getInvoicesForCompany(company.id).filter((invoice) =>
      ['draft', 'due', 'partial', 'overdue'].includes(invoice.status),
    );

    return {
      company,
      credit: company.credit,
      openInvoices,
    };
  }, [companyId]);

  const propsSignature: CreditExposureProps | null = state
    ? {
        state,
        onAdjustLimit() {},
      }
    : null;

  if (!propsSignature) {
    return (
      <section>
        <h1 className="text-xl font-semibold text-slate-900">Credit exposure console</h1>
        <p className="text-sm text-slate-600">No company found for ID: {companyId ?? '—'}.</p>
      </section>
    );
  }

  const { company, credit, openInvoices } = propsSignature.state;

  const creditLimit = credit.creditLimit?.amount ?? 0;
  const creditUsed = credit.creditUsed?.amount ?? 0;
  const availableCredit = credit.availableCredit?.amount ?? creditLimit - creditUsed;
  const creditUtilization = creditLimit > 0 ? Math.round((creditUsed / creditLimit) * 100) : 0;

  const creditTone: 'default' | 'success' | 'warning' | 'critical' =
    creditUtilization < 60 ? 'success' : creditUtilization < 90 ? 'warning' : 'critical';

  const overdueInvoices = openInvoices.filter((invoice) => invoice.status === 'overdue');

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Credit exposure</h1>
          <p className="text-sm text-slate-600">
            {company.name} · See how current invoices and terms translate into credit risk.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <Badge variant={creditTone}>Utilization: {creditUtilization}%</Badge>
          <p className="text-xs text-slate-500">
            Open invoices: {openInvoices.length} · Overdue: {overdueInvoices.length}
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Credit limit</dt>
                  <dd className="font-medium">
                    {creditLimit ? `$${creditLimit.toLocaleString()}` : 'Not set'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Used</dt>
                  <dd>${creditUsed.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Available</dt>
                  <dd className="font-semibold">${availableCredit.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Days past due</dt>
                  <dd>{credit.daysPastDue ?? 0}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Design notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
                <li>
                  This console should answer: &quot;Can I say yes to another order without exceeding our comfort
                  level?&quot;
                </li>
                <li>
                  Make it easy to see which invoices are driving current exposure, and which ones are overdue or at
                  risk.
                </li>
                <li>
                  Future iterations can show how planned pay runs will free up credit over the next 30–60 days.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Open invoices contributing to exposure</CardTitle>
            </CardHeader>
            <CardContent>
              {openInvoices.length === 0 ? (
                <p className="text-sm text-slate-600">No open invoices are contributing to exposure right now.</p>
              ) : (
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="py-2 pr-3 font-medium text-slate-500">Invoice</th>
                      <th className="py-2 pr-3 font-medium text-slate-500">Status</th>
                      <th className="py-2 pr-3 font-medium text-slate-500">Due</th>
                      <th className="py-2 pr-3 font-medium text-slate-500">Scheduled</th>
                      <th className="py-2 font-medium text-slate-500 text-right">Balance due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-1.5 pr-3">{invoice.invoiceNumber}</td>
                        <td className="py-1.5 pr-3 text-xs capitalize text-slate-600">{invoice.status}</td>
                        <td className="py-1.5 pr-3 text-xs text-slate-500">
                          {new Date(invoice.dueAt).toLocaleDateString()}
                        </td>
                        <td className="py-1.5 pr-3 text-xs text-slate-500">
                          {invoice.plannedPayRunId ? 'Yes' : '—'}
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
        </div>
      </div>
    </section>
  );
}
