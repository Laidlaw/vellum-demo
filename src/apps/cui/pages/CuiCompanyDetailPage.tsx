import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';

import { getCompanyById, getInvoicesForCompany } from '../../../data';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { Badge } from '../../shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { ScrollArea } from '../../shared/ui/scroll-area';

const automationPreferences = [
  'Email invoices to finance within 15 minutes of being issued.',
  'Send proactive reminders 5 days before due dates to location managers.',
  'Escalate quotes over $25K to finance approvers automatically.',
];

export function CuiCompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();

  const { company, invoices } = useMemo(() => {
    if (!companyId) return { company: null, invoices: [] };
    const resolvedCompany = getCompanyById(companyId) ?? null;
    const resolvedInvoices = resolvedCompany ? getInvoicesForCompany(resolvedCompany.id) : [];
    return { company: resolvedCompany, invoices: resolvedInvoices };
  }, [companyId]);

  if (!company) {
    return (
      <section>
        <h1 className="text-xl font-semibold text-slate-900">Company</h1>
        <p className="text-sm text-slate-600">No company found for ID: {companyId ?? '—'}.</p>
      </section>
    );
  }

  const primaryContact =
    company.contacts.find((contact) => contact.email === company.mainContact) ?? company.contacts[0];
  const financeContact =
    company.contacts.find((contact) => contact.role === 'finance') ?? primaryContact ?? company.contacts[0];
  const accountsPayableEmail = financeContact?.email ?? company.mainContact ?? '—';

  const creditLimit = company.credit.creditLimit?.amount ?? 0;
  const creditUsed = company.credit.creditUsed?.amount ?? 0;
  const availableCredit = company.credit.availableCredit?.amount ?? creditLimit - creditUsed;
  const utilization = creditLimit > 0 ? Math.min(100, Math.round((creditUsed / creditLimit) * 100)) : 0;
  const daysPastDue = company.credit.daysPastDue ?? 0;

  const tone: 'default' | 'success' | 'warning' | 'critical' =
    utilization < 60 ? 'success' : utilization < 90 ? 'warning' : 'critical';

  const paymentTerms = company.paymentTerms;
  const paymentTermLabel =
    paymentTerms.type === 'net'
      ? `Net ${paymentTerms.netDays ?? 0}`
      : paymentTerms.type === 'due_on_receipt'
        ? 'Due on receipt'
        : 'Installments';

  const paymentMethods = company.paymentMethods ?? [];
  const defaultPaymentMethod = paymentMethods.find((method) => method.isDefault) ?? paymentMethods[0];
  const autoPayEnabled = Boolean(
    defaultPaymentMethod?.capabilities?.some((capability) => capability.toLowerCase().includes('auto')),
  );

  const defaultBilling = company.locations.find((location) => location.isDefaultBilling);
  const defaultShipping = company.locations.find((location) => location.isDefaultShipping);
  const billingLocation = defaultBilling ?? defaultShipping ?? company.locations[0];
  const taxStatusLabel = company.taxExempt ? 'Tax exemption on file' : 'Tax documentation required';
  const taxStatusVariant: 'success' | 'warning' =
    company.taxExempt ? 'success' : 'warning';

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{company.name}</h1>
          <p className="text-sm text-slate-600">
            Company ID: {company.id} · {company.locationsCount} locations
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Created {formatDate(company.createdAt)} · Primary contact{' '}
            <span className="font-medium text-slate-700">
              {primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : 'Not set'}
            </span>
          </p>
        </div>
        <Badge variant={tone}>Credit utilization: {utilization}%</Badge>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Legal name</dt>
                  <dd className="text-right">{company.legalName ?? company.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Ordering status</dt>
                  <dd className="capitalize">{company.orderingStatus}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Total orders</dt>
                  <dd>{company.totalOrders}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Total sales</dt>
                  <dd>${company.totalSales.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Credit limit</dt>
                  <dd>{creditLimit ? formatCurrency(creditLimit) : 'Not set'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Available credit</dt>
                  <dd>{creditLimit ? formatCurrency(availableCredit) : '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">AP inbox</dt>
                  <dd className="truncate text-right text-xs text-slate-600">{accountsPayableEmail}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Link
                  to={`/ccx/companies/${company.id}/finance`}
                  className="rounded border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                >
                  Finance profile
                </Link>
                <Link
                  to={`/ccx/companies/${company.id}/approvals`}
                  className="rounded border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                >
                  Approval matrix
                </Link>
                <Link
                  to={`/ccx/companies/${company.id}/credit`}
                  className="rounded border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                >
                  Credit exposure
                </Link>
                <Link
                  to={`/ccx/companies/${company.id}/exceptions`}
                  className="rounded border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                >
                  Exceptions
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-slate-600">No invoices for this company in the dataset.</p>
              ) : (
                <ScrollArea maxHeight={260}>
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="py-2 pr-3 font-medium text-slate-500">Invoice</th>
                        <th className="py-2 pr-3 font-medium text-slate-500">Status</th>
                        <th className="py-2 pr-3 font-medium text-slate-500">Due</th>
                        <th className="py-2 font-medium text-slate-500 text-right">Balance due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-1.5 pr-3">
                            <Link
                              to={`/cui/invoices/${invoice.id}`}
                              className="text-sky-700 underline"
                            >
                              {invoice.invoiceNumber}
                            </Link>
                          </td>
                          <td className="py-1.5 pr-3 text-xs capitalize text-slate-600">{invoice.status}</td>
                          <td className="py-1.5 pr-3 text-xs text-slate-500">
                            {formatDate(invoice.dueAt)}
                          </td>
                          <td className="py-1.5 text-right">
                            {formatCurrency(invoice.balanceDue.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Payment terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="info">{paymentTermLabel}</Badge>
              <Badge variant={autoPayEnabled ? 'success' : 'warning'}>
                {autoPayEnabled ? 'Auto-pay enabled' : 'Manual payment'}
              </Badge>
            </div>
            {paymentTerms.discountPercent ? (
              <p className="mt-2 text-xs text-slate-600">
                Early payment discount: {paymentTerms.discountPercent}%.
              </p>
            ) : null}
            <p className="mt-3 text-sm text-slate-700">
              {paymentTerms.description ??
                'Terms are managed by finance. In a full build, this is where you would negotiate and update terms inline.'}
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              {paymentTerms.creditLimit ? (
                <li>Negotiated credit limit: {formatCurrency(paymentTerms.creditLimit.amount)}</li>
              ) : null}
              {paymentTerms.type === 'installments' && paymentTerms.installmentOptions ? (
                <li>{paymentTerms.installmentOptions.length} installment plans available</li>
              ) : null}
              <li>Primary billing contact: {primaryContact?.email ?? company.mainContact ?? '—'}</li>
              <li>Accounts payable inbox: {accountsPayableEmail}</li>
              {defaultPaymentMethod ? <li>Default payment method: {defaultPaymentMethod.label}</li> : null}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credit utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-slate-900">
              {creditLimit ? formatCurrency(availableCredit) : '—'}
            </p>
            <p className="text-xs text-slate-500">
              Available of {creditLimit ? formatCurrency(creditLimit) : '—'}
            </p>
            {creditLimit > 0 ? (
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-sky-500"
                    style={{ width: `${utilization}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {formatCurrency(creditUsed)} in use ({utilization}%)
                </p>
              </div>
            ) : null}
            <div className="mt-3">
              <Badge variant={daysPastDue > 0 ? 'critical' : 'success'}>
                {daysPastDue > 0 ? `${daysPastDue} days past due` : 'On-time payments'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing &amp; tax profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-slate-900">
              {company.legalName ?? company.name}
            </p>
            {billingLocation ? (
              <div className="mt-2 text-xs text-slate-600">
                <p>{billingLocation.address.line1}</p>
                {billingLocation.address.line2 ? <p>{billingLocation.address.line2}</p> : null}
                <p>
                  {billingLocation.address.city}
                  {billingLocation.address.province ? `, ${billingLocation.address.province}` : ''}{' '}
                  {billingLocation.address.postalCode}
                </p>
                <p>{billingLocation.address.country}</p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-600">Billing address not set.</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Badge variant={taxStatusVariant}>{taxStatusLabel}</Badge>
              {billingLocation?.code ? <Badge variant="default">{billingLocation.code}</Badge> : null}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Accounts payable: {accountsPayableEmail}
            </p>
          </CardContent>
        </Card>
      </div>

      {paymentMethods.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Payment methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">{method.label}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge
                        variant={
                          method.status === 'active'
                            ? 'success'
                            : method.status === 'pending'
                              ? 'warning'
                              : 'critical'
                        }
                      >
                        {method.status}
                      </Badge>
                      {method.isDefault ? <Badge variant="info">Default</Badge> : null}
                      <Badge variant="default">{method.type.toUpperCase()}</Badge>
                    </div>
                    {method.description ? (
                      <p className="text-xs text-slate-600">{method.description}</p>
                    ) : null}
                    {method.capabilities && method.capabilities.length ? (
                      <p className="text-xs text-slate-600">
                        Supports: {method.capabilities.join(', ')}
                      </p>
                    ) : null}
                    {method.lastUsedAt ? (
                      <p className="text-xs text-slate-500">
                        Last used {formatDate(method.lastUsedAt)}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-slate-600 underline underline-offset-2"
                    disabled
                  >
                    Manage
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Automation &amp; notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {automationPreferences.map((preference) => (
              <li key={preference}>{preference}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {company.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Account notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-slate-700">{company.notes}</p>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
