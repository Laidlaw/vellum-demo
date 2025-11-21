import { INVOICES, getCompanyById } from '../../../data';
import { Badge } from '../../shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { ScrollArea } from '../../shared/ui/scroll-area';
import { CUI_ACTIVE_COMPANY_ID } from '../config';

export function CuiDashboardPage() {
  const activeCompany = getCompanyById(CUI_ACTIVE_COMPANY_ID);
  const invoices = INVOICES;

  if (!activeCompany) {
    return (
      <section className="flex flex-col gap-4">
        <header>
          <h1 className="text-xl font-semibold text-slate-900">Customer admin overview</h1>
          <p className="text-sm text-slate-600">
            No active customer configured. Set <code>CUI_ACTIVE_COMPANY_ID</code> to a valid company to explore this
            workspace.
          </p>
        </header>
      </section>
    );
  }

  const openInvoices = invoices.filter(
    (invoice) =>
      invoice.companyId === activeCompany.id &&
      ['due', 'partial', 'overdue', 'draft'].includes(invoice.status),
  );
  const overdueInvoices = invoices.filter(
    (invoice) => invoice.companyId === activeCompany.id && invoice.status === 'overdue',
  );

  const creditLimit = activeCompany.credit.creditLimit?.amount ?? 0;
  const creditUsed = activeCompany.credit.creditUsed?.amount ?? 0;
  const availableCredit =
    activeCompany.credit.availableCredit?.amount ?? (creditLimit > 0 ? creditLimit - creditUsed : 0);
  const utilization = creditLimit > 0 ? Math.min(100, Math.round((creditUsed / creditLimit) * 100)) : 0;
  const daysPastDue = activeCompany.credit.daysPastDue ?? 0;

  const paymentTerms = activeCompany.paymentTerms;
  const paymentTermLabel =
    paymentTerms.type === 'net'
      ? `Net ${paymentTerms.netDays ?? 0}`
      : paymentTerms.type === 'due_on_receipt'
        ? 'Due on receipt'
        : 'Installments';

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Customer admin overview</h1>
          <p className="text-sm text-slate-600">
            You are working as finance for{' '}
            <span className="font-semibold text-slate-900">{activeCompany.name}</span>. Track this customer&apos;s
            invoices and credit health from here.
          </p>
        </div>
        <Badge variant="info">Demo workspace</Badge>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active customer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-slate-900">{activeCompany.name}</p>
            <p className="text-xs text-slate-500">
              {activeCompany.totalOrders} orders · ${activeCompany.totalSales.toLocaleString()} lifetime sales
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Company ID: <code>{activeCompany.id}</code>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{openInvoices.length}</p>
            <p className="text-xs text-slate-500">
              {overdueInvoices.length} overdue · {openInvoices.length - overdueInvoices.length} not yet due.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">
              Start with this customer&apos;s high utilization or overdue invoices, then review upcoming pay runs.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Company snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">
              {activeCompany.locationsCount} locations · {activeCompany.totalOrders} orders · $
              {activeCompany.totalSales.toLocaleString()} lifetime sales.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Use Company settings to review billing locations, tax profile, and payment preferences for this customer.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Finance snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Credit utilization</dt>
                <dd className="font-medium">{utilization}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Available credit</dt>
                <dd>
                  {creditLimit > 0 ? `$${availableCredit.toLocaleString()}` : 'Not set'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Terms</dt>
                <dd>{paymentTermLabel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Days past due</dt>
                <dd>{daysPastDue}</dd>
              </div>
            </dl>
            <div className="mt-3">
              <Badge variant={daysPastDue > 0 ? 'critical' : 'success'}>
                {daysPastDue > 0 ? `${daysPastDue} days past due` : 'On-time payments'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices that need attention</CardTitle>
        </CardHeader>
        <CardContent>
          {overdueInvoices.length === 0 ? (
            <p className="text-sm text-slate-600">No overdue invoices in this dataset.</p>
          ) : (
            <ScrollArea maxHeight={260}>
              <ul className="space-y-2 text-sm">
                {overdueInvoices.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">
                        Due {new Date(invoice.dueAt).toLocaleDateString()} · Balance $
                        {invoice.balanceDue.amount.toLocaleString()}
                      </p>
                    </div>
                    <Link
                      to={`/cui/invoices/${invoice.id}`}
                      className="text-xs font-medium text-sky-700 underline"
                    >
                      Review
                    </Link>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
