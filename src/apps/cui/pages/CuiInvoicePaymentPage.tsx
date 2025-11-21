import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getCompanyById, getInvoiceById, getQuoteById } from '../../../data';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { ScrollArea } from '../../shared/ui/scroll-area';
import { CUI_ACTIVE_COMPANY_ID } from '../config';

type PaymentMethodId = 'ach' | 'installments';
type PaymentTiming = 'now' | 'scheduled';

export function CuiInvoicePaymentPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  const invoice = useMemo(() => (invoiceId ? getInvoiceById(invoiceId) ?? null : null), [invoiceId]);
  const company = useMemo(
    () => (invoice ? getCompanyById(invoice.companyId) ?? null : getCompanyById(CUI_ACTIVE_COMPANY_ID) ?? null),
    [invoice],
  );
  const quote = useMemo(
    () => (invoice?.quoteId ? getQuoteById(invoice.quoteId) ?? null : null),
    [invoice?.quoteId],
  );

  const [method, setMethod] = useState<PaymentMethodId>('ach');
  const [timing, setTiming] = useState<PaymentTiming>('scheduled');
  const [scheduledDate, setScheduledDate] = useState('');
  const [achAccountName, setAchAccountName] = useState('');
  const [achBankName, setAchBankName] = useState('');
  const [achAccountNumber, setAchAccountNumber] = useState('');
  const [achRoutingNumber, setAchRoutingNumber] = useState('');
  const [achAccountType, setAchAccountType] = useState<'checking' | 'savings'>('checking');
  const [confirmation, setConfirmation] = useState<string | null>(null);

  if (!invoice) {
    return (
      <section className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Pay invoice</h1>
            <p className="text-sm text-slate-600">The requested invoice could not be found.</p>
          </div>
        </header>
        <Button variant="outline" onClick={() => navigate('/cui/invoices')}>
          Back to invoices
        </Button>
      </section>
    );
  }

  const totalDue = invoice.balanceDue.amount;
  const paymentTerms = company?.paymentTerms;
  const installmentOptions = paymentTerms?.installmentOptions ?? [];
  const isInstallmentsEnabled = paymentTerms?.type === 'installments' && installmentOptions.length > 0;

  const handleConfirm = () => {
    const methodLabel =
      method === 'ach'
        ? 'ACH bank transfer'
        : 'Installments / working capital';
    const whenLabel =
      timing === 'now'
        ? 'immediately'
        : scheduledDate
          ? `on ${scheduledDate}`
          : 'on the selected date';
    setConfirmation(
      `Payment scheduled via ${methodLabel} ${whenLabel}. This demo does not process real payments.`,
    );
  };

  const summaryRows: Array<[string, string]> = [
    ['Subtotal', `$${invoice.subtotal.amount.toLocaleString()}`],
    ['Tax', `$${invoice.taxTotal.amount.toLocaleString()}`],
    [
      'Shipping',
      invoice.shippingTotal ? `$${invoice.shippingTotal.amount.toLocaleString()}` : '—',
    ],
  ];

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Pay invoice {invoice.invoiceNumber}</h1>
          <p className="text-sm text-slate-600">
            {company?.name ?? 'Customer'} · Balance due ${totalDue.toLocaleString()} · Due{' '}
            {new Date(invoice.dueAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <Badge variant={invoice.status === 'overdue' ? 'critical' : invoice.status === 'paid' ? 'success' : 'info'}>
            {invoice.status}
          </Badge>
          <Button
            variant="outline"
            onClick={() => navigate(`/cui/invoices/${invoice.id}/review`)}
          >
            Back to invoice
          </Button>
        </div>
      </header>

      {confirmation ? (
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-slate-900">Payment scheduled</p>
            <p className="mt-1 text-sm text-slate-600">{confirmation}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Pay by invoice (net terms)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                You are on{' '}
                <span className="font-medium">
                  {invoice.paymentTerms.type === 'net'
                    ? `Net ${invoice.paymentTerms.netDays ?? 0}`
                    : invoice.paymentTerms.type === 'due_on_receipt'
                      ? 'Due on receipt'
                      : 'Installments'}
                </span>
                . Your payment is due on{' '}
                <span className="font-medium">
                  {new Date(invoice.dueAt).toLocaleDateString()}
                </span>
                .
              </p>
              <p className="mt-1 text-xs text-slate-500">
                In this workspace, paying by invoice means including this invoice in a pay run or scheduling a
                settlement date. The options below simulate those choices rather than processing a real payment.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Choose payment method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-3 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="payment-method"
                    value="ach"
                    checked={method === 'ach'}
                    onChange={() => setMethod('ach')}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-medium text-slate-900">ACH bank transfer</p>
                    <p className="text-xs text-slate-600">
                      Simulate an authorized ACH debit from the company&apos;s primary bank account.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-3 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="payment-method"
                    value="installments"
                    checked={method === 'installments'}
                    onChange={() => setMethod('installments')}
                    className="mt-0.5"
                    disabled={!isInstallmentsEnabled}
                  />
                  <div>
                    <p className="font-medium text-slate-900">Installments / working capital</p>
                    <p className="text-xs text-slate-600">
                      Spread this payment across monthly installments using a working capital plan.
                    </p>
                    {!isInstallmentsEnabled ? (
                      <p className="mt-1 text-[11px] text-slate-500">
                        Installment plans are not enabled for this customer in this demo dataset.
                      </p>
                    ) : null}
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setTiming('now')}
                  className={[
                    'rounded-md border px-3 py-1.5 text-xs',
                    timing === 'now'
                      ? 'border-slate-900 bg-slate-900 text-slate-50'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  Pay now
                </button>
                <button
                  type="button"
                  onClick={() => setTiming('scheduled')}
                  className={[
                    'rounded-md border px-3 py-1.5 text-xs',
                    timing === 'scheduled'
                      ? 'border-slate-900 bg-slate-900 text-slate-50'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  Schedule for a date
                </button>
              </div>
              {timing === 'scheduled' ? (
                <div className="mt-3 text-xs text-slate-600">
                  <label className="flex flex-col gap-1">
                    <span>Payment date</span>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(event) => setScheduledDate(event.target.value)}
                      className="w-48 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </label>
                  <p className="mt-1 text-[11px] text-slate-500">
                    In a production integration, this date would be shared with the payments provider or ERP.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {method === 'ach' && (
            <Card>
              <CardHeader>
                <CardTitle>ACH account details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-slate-700">
                  <label className="flex flex-col gap-1">
                    <span>Account name</span>
                    <input
                      type="text"
                      value={achAccountName}
                      onChange={(event) => setAchAccountName(event.target.value)}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Bank name</span>
                    <input
                      type="text"
                      value={achBankName}
                      onChange={(event) => setAchBankName(event.target.value)}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Account number</span>
                    <input
                      type="text"
                      value={achAccountNumber}
                      onChange={(event) => setAchAccountNumber(event.target.value)}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Routing number</span>
                    <input
                      type="text"
                      value={achRoutingNumber}
                      onChange={(event) => setAchRoutingNumber(event.target.value)}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </label>
                  <div className="mt-2 flex gap-4">
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="ach-account-type"
                        value="checking"
                        checked={achAccountType === 'checking'}
                        onChange={() => setAchAccountType('checking')}
                      />
                      <span>Checking</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="ach-account-type"
                        value="savings"
                        checked={achAccountType === 'savings'}
                        onChange={() => setAchAccountType('savings')}
                      />
                      <span>Savings</span>
                    </label>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    In a real integration this information would be tokenized and stored with the payments provider,
                    not inside this demo. To adjust default bank accounts and permissions, use Company settings{' '}
                    <Link
                      to="/cui/settings"
                      className="font-medium text-sky-700 underline"
                    >
                      Finance
                    </Link>
                    .
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                {summaryRows.map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-slate-500">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
                <div className="mt-3 flex justify-between border-t border-slate-200 pt-2">
                  <dt className="font-medium text-slate-900">Balance due</dt>
                  <dd className="font-semibold text-slate-900">${totalDue.toLocaleString()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice &amp; account context</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-slate-600">
                <p>
                  Billing company:{' '}
                  <span className="font-medium text-slate-900">
                    {company?.name ?? 'Customer account'}
                  </span>
                </p>
                <p>
                  Invoice status:{' '}
                  <span className="font-medium text-slate-900">{invoice.status}</span>
                </p>
                <p>
                  Payment terms:{' '}
                  <span className="font-medium text-slate-900">
                    {invoice.paymentTerms.type === 'net'
                      ? `Net ${invoice.paymentTerms.netDays ?? 0}`
                      : invoice.paymentTerms.type === 'due_on_receipt'
                        ? 'Due on receipt'
                        : 'Installments'}
                  </span>
                </p>
                {quote ? (
                  <p>
                    Linked quote:{' '}
                    <Link
                      to={`/cui/quotes/${quote.id}`}
                      className="font-medium text-sky-700 underline"
                    >
                      {quote.quoteNumber}
                    </Link>
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleConfirm}
            disabled={invoice.status === 'paid'}
          >
            {timing === 'now' ? 'Confirm payment' : 'Schedule payment'}
          </Button>
        </div>
      </div>
    </section>
  );
}
