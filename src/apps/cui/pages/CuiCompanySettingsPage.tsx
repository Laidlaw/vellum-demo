import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { getCompanyById } from '../../../data';
import { Badge } from '../../shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { ScrollArea } from '../../shared/ui/scroll-area';
import { CUI_ACTIVE_COMPANY_ID } from '../config';

export function CuiCompanySettingsPage() {
  const company = useMemo(() => getCompanyById(CUI_ACTIVE_COMPANY_ID) ?? null, []);

  if (!company) {
    return (
      <section>
        <h1 className="text-xl font-semibold text-slate-900">Company settings</h1>
        <p className="text-sm text-slate-600">No active company configured for this demo.</p>
      </section>
    );
  }

  const paymentTerms = company.paymentTerms;
  const credit = company.credit;

  const creditLimit = credit.creditLimit?.amount ?? 0;
  const creditUsed = credit.creditUsed?.amount ?? 0;
  const availableCredit = credit.availableCredit?.amount ?? creditLimit - creditUsed;
  const creditUtilization = creditLimit > 0 ? Math.round((creditUsed / creditLimit) * 100) : 0;

  const taxStatusLabel = company.taxExempt ? 'Tax exemption on file' : 'Tax documentation required';

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Company settings</h1>
          <p className="text-sm text-slate-600">
            Manage company information, locations, employees, and payment preferences for this customer.
          </p>
        </div>
        <Badge variant="default">Demo only</Badge>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Company information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                <div>
                  <dt className="text-slate-500">Legal name</dt>
                  <dd className="font-medium">{company.legalName ?? company.name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Primary contact</dt>
                  <dd className="text-xs text-slate-700">{company.mainContact ?? 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Ordering status</dt>
                  <dd className="text-xs capitalize text-slate-700">{company.orderingStatus}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">
                In the full implementation, this section would allow updating billing details, tax IDs, and payment
                preferences inline.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea maxHeight={220}>
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="py-2 pr-3 font-medium text-slate-500">Location</th>
                      <th className="py-2 pr-3 font-medium text-slate-500">Code</th>
                      <th className="py-2 pr-3 font-medium text-slate-500">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.locations.map((location) => (
                      <tr key={location.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-1.5 pr-3 text-sm text-slate-700">{location.name}</td>
                        <td className="py-1.5 pr-3 text-xs text-slate-600">{location.code ?? '—'}</td>
                        <td className="py-1.5 pr-3 text-xs text-slate-600">
                          {location.isDefaultBilling ? 'Billing' : location.isDefaultShipping ? 'Shipping' : 'Other'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                <div>
                  <dt className="text-slate-500">Terms</dt>
                  <dd className="text-xs text-slate-700">
                    {paymentTerms.type === 'net'
                      ? `Net ${paymentTerms.netDays ?? 0}`
                      : paymentTerms.type === 'due_on_receipt'
                        ? 'Due on receipt'
                        : 'Installments'}
                  </dd>
                </div>
                {paymentTerms.discountPercent ? (
                  <div>
                    <dt className="text-slate-500">Early payment discount</dt>
                    <dd className="text-xs text-slate-700">{paymentTerms.discountPercent}%</dd>
                  </div>
                ) : null}
                {paymentTerms.creditLimit ? (
                  <div>
                    <dt className="text-slate-500">Negotiated credit limit</dt>
                    <dd className="text-xs text-slate-700">
                      ${paymentTerms.creditLimit.amount.toLocaleString()}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <p className="mt-3 text-xs text-slate-500">
                In a full build, this section would control how invoices are grouped, which methods are preferred, and
                whether auto-pay is enabled per location.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Employees &amp; roles</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea maxHeight={260}>
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="py-2 pr-3 font-medium text-slate-500">Name</th>
                      <th className="py-2 pr-3 font-medium text-slate-500">Role</th>
                      <th className="py-2 pr-3 font-medium text-slate-500">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.contacts.map((contact) => (
                      <tr key={contact.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-1.5 pr-3 text-sm text-slate-700">
                          {contact.firstName} {contact.lastName}
                        </td>
                        <td className="py-1.5 pr-3 text-xs capitalize text-slate-600">{contact.role}</td>
                        <td className="py-1.5 pr-3 text-xs text-slate-600">
                          <a href={`mailto:${contact.email}`} className="text-sky-700 underline">
                            {contact.email}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
              <p className="mt-3 text-xs text-slate-500">
                For now this is read-only. The finance team can see who can request, approve, and manage payments
                without switching to a separate admin.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing, tax &amp; credit</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                <div>
                  <dt className="text-slate-500">Tax status</dt>
                  <dd className="text-xs text-slate-700">{taxStatusLabel}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Credit utilization</dt>
                  <dd className="text-xs text-slate-700">{creditLimit ? `${creditUtilization}%` : 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Credit limit</dt>
                  <dd className="text-xs text-slate-700">
                    {creditLimit ? `$${creditLimit.toLocaleString()}` : 'Not set'}
                  </dd>
                </div>
              </dl>
              {creditLimit > 0 ? (
                <div className="mt-3">
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-sky-500"
                      style={{ width: `${Math.min(100, creditUtilization)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    ${creditUsed.toLocaleString()} in use · ${availableCredit.toLocaleString()} available
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Related workspaces</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-xs text-slate-600">
                <li>
                  <Link to={`/ccx/companies/${company.id}/approvals`} className="text-sky-700 underline">
                    Approval matrix
                  </Link>{' '}
                  — see who can approve what and at which thresholds.
                </li>
                <li>
                  <Link to={`/ccx/companies/${company.id}/finance`} className="text-sky-700 underline">
                    Finance profile
                  </Link>{' '}
                  — terms, credit, tax, and remittance configuration.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
