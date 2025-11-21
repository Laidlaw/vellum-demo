import { useCallback, useMemo, useState } from 'react';
import {
  Badge,
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  Divider,
  Icon,
  InlineGrid,
  InlineStack,
  Page,
  Text,
} from '@shopify/polaris';
import {
  AlertTriangleIcon,
  CircleChevronRightIcon,
  ClockIcon,
  CreditCardIcon,
  ExportIcon,
  MoneyFilledIcon,
  NoteIcon,
  PersonIcon,
  StoreIcon,
} from '@shopify/polaris-icons';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getCompanyById,
  getInvoicesForCompany,
  type Company,
  type CompanyOrderingStatus,
  type CompanyPaymentMethod,
} from '../../../data';
import { QUOTES } from '../../../data/quotes';
import { formatCurrency, formatDate, formatDateTime, formatOrders, formatPercentage } from '../../../utils/formatters';
import { SummaryMetric } from '../components/SummaryMetric';

const statusTone: Record<CompanyOrderingStatus, 'success' | 'attention' | 'subdued'> = {
  approved: 'success',
  pending: 'attention',
  not_approved: 'subdued',
};

const statusLabel: Record<CompanyOrderingStatus, string> = {
  approved: 'Ordering approved',
  pending: 'Ordering pending',
  not_approved: 'Ordering not approved',
};

const paymentStatusTone: Record<CompanyPaymentMethod['status'], 'success' | 'attention' | 'subdued'> = {
  active: 'success',
  pending: 'attention',
  disabled: 'subdued',
};

const paymentTypeLabel: Record<CompanyPaymentMethod['type'], string> = {
  ach: 'ACH (bank)',
  card: 'Corporate card',
  wire: 'Wire transfer',
  check: 'Check',
  installments: 'Installment plan',
  shop_pay: 'Shop Pay',
};

const invoiceStatusTone: Record<string, 'critical' | 'attention' | 'success' | 'subdued'> = {
  overdue: 'critical',
  due: 'attention',
  draft: 'subdued',
  paid: 'success',
  partial: 'attention',
};

const quoteStatusTone: Record<string, 'critical' | 'attention' | 'success' | 'subdued'> = {
  draft: 'subdued',
  pending_approval: 'attention',
  approved: 'success',
  rejected: 'critical',
  expired: 'critical',
};

const MS_IN_DAY = 1000 * 60 * 60 * 24;

function getDaysUntil(date: string, reference: Date) {
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return Number.POSITIVE_INFINITY;
  return Math.round((target.getTime() - reference.getTime()) / MS_IN_DAY);
}

export function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const basePath = '/mx';
  const referenceDate = new Date();

  const company = useMemo<Company | undefined>(
    () => (companyId ? getCompanyById(companyId) : undefined),
    [companyId],
  );

  const invoices = useMemo(() => (company ? getInvoicesForCompany(company.id) : []), [company]);
  const quotes = useMemo(() => (company ? QUOTES.filter((quote) => quote.companyId === company.id) : []), [company]);

  if (!company) {
    return (
      <Page
        title="Company not found"
        backAction={{ content: 'Companies', onAction: () => navigate(`${basePath}/companies`) }}
      >
        <Card>
          <Text as="p" tone="subdued">
            The requested company could not be found. Return to the companies index to try again.
          </Text>
        </Card>
      </Page>
    );
  }

  const overdueInvoices = invoices.filter((invoice) => invoice.status === 'overdue');
  const dueSoonInvoices = invoices.filter(
    (invoice) => invoice.status === 'due' && getDaysUntil(invoice.dueAt, referenceDate) <= 7,
  );
  const expiringQuotes = quotes.filter((quote) => {
    if (!['pending_approval', 'draft'].includes(quote.status)) return false;
    return getDaysUntil(quote.expiresAt, referenceDate) <= 7;
  });

  const outstandingBalance = invoices
    .filter((invoice) => invoice.status === 'due' || invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + invoice.balanceDue.amount, 0);

  const creditLimitAmount = company.credit.creditLimit?.amount ?? 0;
  const creditUsedAmount = company.credit.creditUsed?.amount ?? 0;
  const availableCreditAmount = company.credit.availableCredit?.amount ?? 0;
  const creditUtilization = creditLimitAmount
    ? Math.min(Math.round((creditUsedAmount / creditLimitAmount) * 100), 999)
    : undefined;

  const urgentItems: Array<{
    id: string;
    title: string;
    description: string;
    icon: typeof AlertTriangleIcon;
    tone: 'critical' | 'attention' | 'success';
    actionLabel: string;
    target: string;
  }> = [];

  if (overdueInvoices.length) {
    urgentItems.push({
      id: 'overdue',
      title: `${overdueInvoices.length} overdue invoice${overdueInvoices.length === 1 ? '' : 's'}`,
      description: `Oldest due ${formatDate(overdueInvoices[0].dueAt)} • ${formatCurrency(
        overdueInvoices.reduce((sum, invoice) => sum + invoice.balanceDue.amount, 0),
      )} outstanding`,
      icon: AlertTriangleIcon,
      tone: 'critical',
      actionLabel: 'Send reminder',
      target: 'company-invoices',
    });
  }

  if (dueSoonInvoices.length) {
    urgentItems.push({
      id: 'due-soon',
      title: `${dueSoonInvoices.length} invoice${dueSoonInvoices.length === 1 ? '' : 's'} due soon`,
      description: `Next due ${formatDate(dueSoonInvoices[0].dueAt)} • ${formatCurrency(
        dueSoonInvoices.reduce((sum, invoice) => sum + invoice.balanceDue.amount, 0),
      )} pending`,
      icon: ClockIcon,
      tone: 'attention',
      actionLabel: 'Review invoices',
      target: 'company-invoices',
    });
  }

  if (expiringQuotes.length) {
    urgentItems.push({
      id: 'quotes',
      title: `${expiringQuotes.length} quote${expiringQuotes.length === 1 ? '' : 's'} expiring soon`,
      description: `First expires ${formatDate(expiringQuotes[0].expiresAt)} • ${formatCurrency(
        expiringQuotes.reduce((sum, quote) => sum + quote.total.amount, 0),
      )} at risk`,
      icon: AlertTriangleIcon,
      tone: 'attention',
      actionLabel: 'Move quotes forward',
      target: 'company-quotes',
    });
  }

  const paymentMethods = company.paymentMethods ?? [];
  const primaryContact = company.contacts.find((contact) => contact.email === company.mainContact);

  const invoiceSummaries = useMemo(
    () =>
      invoices
        .map((invoice) => ({
          id: invoice.id,
          status: invoice.status,
          number: invoice.invoiceNumber,
          total: invoice.total.amount,
          dueAt: invoice.dueAt,
          balanceDue: invoice.balanceDue.amount,
        }))
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
    [invoices],
  );

  const quoteSummaries = useMemo(
    () =>
      quotes
        .map((quote) => ({
          id: quote.id,
          status: quote.status,
          number: quote.quoteNumber,
          total: quote.total.amount,
          expiresAt: quote.expiresAt,
        }))
        .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()),
    [quotes],
  );

  const activityItems = useMemo(() => {
    const events: Array<{
      id: string;
      occurredAt: string;
      title: string;
      description: string;
    }> = [];

    quotes.forEach((quote) => {
      quote.history.slice(-1).forEach((event) => {
        events.push({
          id: `${quote.id}-${event.id}`,
          occurredAt: event.occurredAt,
          title: `Quote ${quote.quoteNumber} ${event.type}`,
          description: event.note ?? `Latest activity by ${event.actor ?? 'buyer'}.`,
        });
      });
    });

    invoices.forEach((invoice) => {
      if (invoice.payments.length) {
        const payment = invoice.payments[invoice.payments.length - 1];
        events.push({
          id: `${invoice.id}-${payment.id}`,
          occurredAt: payment.processedAt,
          title: `Payment posted for ${invoice.invoiceNumber}`,
          description: `${formatCurrency(payment.amount.amount)} via ${payment.method.toUpperCase()}.`,
        });
      } else {
        events.push({
          id: `${invoice.id}-issued`,
          occurredAt: invoice.issuedAt,
          title: `Invoice ${invoice.invoiceNumber} issued`,
          description: `Balance ${formatCurrency(invoice.balanceDue.amount)} due ${formatDate(invoice.dueAt)}.`,
        });
      }
    });

    return events
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 5);
  }, [invoices, quotes]);

  const [syncBanner, setSyncBanner] = useState(false);
  const [shareBanner, setShareBanner] = useState(false);

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleCreateOrder = useCallback(() => {
    navigate(`/storefront/products?company=${company.id}`);
  }, [company.id, navigate]);

  const handleCreateQuote = useCallback(() => {
    navigate(`/storefront/quote?company=${company.id}`);
  }, [company.id, navigate]);

  const handleSyncErp = useCallback(() => {
    setSyncBanner(true);
  }, []);

  const handleShareSnapshot = useCallback(() => {
    setShareBanner(true);
  }, []);

  return (
    <Page
      title={company.name}
      subtitle={`${company.locationsCount} ${company.locationsCount === 1 ? 'location' : 'locations'}`}
      backAction={{ content: 'Companies', onAction: () => navigate(`${basePath}/companies`) }}
      primaryAction={{ content: 'Record payment', tone: 'success', onAction: () => scrollToSection('company-invoices') }}
      secondaryActions={[
        { content: 'Send payment reminder', onAction: () => scrollToSection('company-invoices') },
        { content: 'Export company profile', icon: ExportIcon, onAction: handleShareSnapshot },
      ]}
    >
      <div className="CompanyDetail">
        {syncBanner ? (
          <Card>
            <BlockStack gap="200">
              <InlineStack gap="100" blockAlign="center">
                <Icon source={CircleChevronRightIcon} tone="success" />
                <Text as="span" tone="success" variant="bodyMd">
                  ERP sync requested. Latest account data will be pushed to your integration shortly.
                </Text>
              </InlineStack>
              <Button variant="tertiary" onClick={() => setSyncBanner(false)}>
                Dismiss
              </Button>
            </BlockStack>
          </Card>
        ) : null}

        {shareBanner ? (
          <Card>
            <BlockStack gap="200">
              <InlineStack gap="100" blockAlign="center">
                <Icon source={NoteIcon} tone="info" />
                <Text as="span" tone="subdued" variant="bodyMd">
                  Shareable account snapshot prepared. Paste in email or Slack to share with teammates.
                </Text>
              </InlineStack>
              <Button variant="tertiary" onClick={() => setShareBanner(false)}>
                Dismiss
              </Button>
            </BlockStack>
          </Card>
        ) : null}

        <Card id="company-overview">
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center" wrap>
              <BlockStack gap="100">
                <Text as="h2" variant="headingSm">
                  Account snapshot
                </Text>
                <InlineStack gap="100" blockAlign="center" wrap>
                  <Badge tone={statusTone[company.orderingStatus]}>{statusLabel[company.orderingStatus]}</Badge>
                  {company.accountManager ? (
                    <InlineStack gap="050" blockAlign="center">
                      <Icon source={PersonIcon} tone="subdued" />
                      <Text as="span" tone="subdued" variant="bodySm">
                        Managed by {company.accountManager}
                      </Text>
                    </InlineStack>
                  ) : null}
                </InlineStack>
              </BlockStack>
              <ButtonGroup>
                <Button variant="secondary" onClick={handleCreateOrder}>
                  Create order
                </Button>
                <Button variant="secondary" onClick={handleCreateQuote}>
                  Create quote
                </Button>
                <Button variant="tertiary" icon={ExportIcon} onClick={handleSyncErp}>
                  Sync to ERP
                </Button>
              </ButtonGroup>
            </InlineStack>
            <div className="CompanyDetail__MetricRow">
              <SummaryMetric label="Total sales" value={formatCurrency(company.totalSales)} />
              <SummaryMetric label="Total orders" value={formatOrders(company.totalOrders)} />
              <SummaryMetric label="Outstanding balance" value={formatCurrency(outstandingBalance)} tone="critical" />
              <SummaryMetric
                label="Available credit"
                value={formatCurrency(availableCreditAmount)}
                tone={availableCreditAmount > 0 ? 'success' : 'attention'}
              />
              {creditUtilization !== undefined ? (
                <SummaryMetric label="Credit utilization" value={`${creditUtilization}%`} tone="subdued" />
              ) : null}
            </div>
          </BlockStack>
        </Card>

        <Card id="company-attention">
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingSm">
                Attention needed
              </Text>
              <Button variant="tertiary" onClick={() => scrollToSection('company-invoices')}>
                Open collections queue
              </Button>
            </InlineStack>
            {urgentItems.length ? (
              <BlockStack gap="200" className="CompanyDetail__UrgentList">
                {urgentItems.map((item) => (
                  <div key={item.id} className="CompanyDetail__UrgentItem">
                    <InlineStack gap="200" align="space-between" blockAlign="center">
                      <InlineStack gap="150" blockAlign="center">
                        <Icon source={item.icon} tone={item.tone} />
                        <BlockStack gap="050">
                          <Text as="span" variant="headingSm">
                            {item.title}
                          </Text>
                          <Text as="span" tone="subdued" variant="bodySm">
                            {item.description}
                          </Text>
                        </BlockStack>
                      </InlineStack>
                      <Button size="slim" variant="secondary" onClick={() => scrollToSection(item.target)}>
                        {item.actionLabel}
                      </Button>
                    </InlineStack>
                  </div>
                ))}
              </BlockStack>
            ) : (
              <InlineStack gap="150" blockAlign="center">
                <Icon source={CircleChevronRightIcon} tone="success" />
                <Text as="span" tone="subdued" variant="bodySm">
                  No urgent follow-ups right now.
                </Text>
              </InlineStack>
            )}
          </BlockStack>
         
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingSm">
                Latest activity
              </Text>
              <Button variant="tertiary" onClick={() => scrollToSection('company-activity')}>
                Open timeline
              </Button>
            </InlineStack>
            {activityItems.length ? (
              <BlockStack gap="150">
                {activityItems.map((event) => (
                  <div key={event.id} className="CompanyDetail__PaymentMethod">
                    <BlockStack gap="050">
                      <Text as="span" variant="bodyMd">
                        {event.title}
                      </Text>
                      <Text as="span" tone="subdued" variant="bodySm">
                        {formatDateTime(event.occurredAt)}
                      </Text>
                      <Text as="span" tone="subdued" variant="bodySm">
                        {event.description}
                      </Text>
                    </BlockStack>
                  </div>
                ))}
              </BlockStack>
            ) : (
              <Text as="span" tone="subdued" variant="bodySm">
                No recent activity captured.
              </Text>
            )}
          </BlockStack>
        
        </Card>
        <InlineGrid columns={2} gap="200">
          <Card id="company-credit">
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center" wrap>
                <Text as="h2" variant="headingSm">
                  Credit & compliance
                </Text>
                <Badge tone={company.taxExempt ? 'success' : 'attention'}>
                  {company.taxExempt ? 'Tax exempt' : 'Taxable'}
                </Badge>
              </InlineStack>
              <div className="CompanyDetail__MetricRow">
                <SummaryMetric label="Credit limit" value={formatCurrency(creditLimitAmount)} />
                <SummaryMetric label="Credit used" value={formatCurrency(creditUsedAmount)} />
                <SummaryMetric
                  label="Days past due"
                  value={company.credit.daysPastDue ? `${company.credit.daysPastDue} days` : 'Current'}
                  tone={company.credit.daysPastDue ? 'critical' : 'success'}
                />
              </div>
              <Divider />
              <BlockStack gap="200" className="CompanyDetail__Split">
                <BlockStack gap="050">
                  <Text as="span" variant="bodySm" tone="subdued">
                    Payment terms
                  </Text>
                  <Text as="span" variant="bodyMd">
                    {company.paymentTerms.type === 'net'
                      ? `Net ${company.paymentTerms.netDays ?? 0} with ${company.paymentTerms.discountPercent ?? 0}% quick-pay discount`
                      : company.paymentTerms.type === 'installments'
                        ? 'Installment plan available'
                        : 'Due on receipt'}
                  </Text>
                  {company.paymentTerms.description ? (
                    <Text as="span" tone="subdued" variant="bodySm">
                      {company.paymentTerms.description}
                    </Text>
                  ) : null}
                  {company.paymentTerms.installmentOptions?.length ? (
                    <BlockStack gap="050" as="ul" className="CompanyDetail__List">
                      {company.paymentTerms.installmentOptions.map((option) => (
                        <li key={option.id}>
                          <Text as="span" tone="subdued" variant="bodySm">
                            {option.label}
                            {option.minimumOrderAmount
                              ? ` • Min ${formatCurrency(option.minimumOrderAmount.amount)}`
                              : ''}
                            {option.aprPercent !== undefined ? ` • ${formatPercentage(option.aprPercent)} APR` : ''}
                          </Text>
                        </li>
                      ))}
                    </BlockStack>
                  ) : null}
                </BlockStack>

                <BlockStack gap="050">
                  <Text as="span" variant="bodySm" tone="subdued">
                    Last order placed
                  </Text>
                  <InlineStack gap="100" blockAlign="center">
                    <Icon source={StoreIcon} tone="subdued" />
                    <Text as="span" variant="bodyMd">
                      {company.lastOrderAt ? formatDate(company.lastOrderAt) : 'No orders yet'}
                    </Text>
                  </InlineStack>
                  {primaryContact ? (
                    <Text as="span" tone="subdued" variant="bodySm">
                      Primary contact: {primaryContact.firstName} {primaryContact.lastName}
                    </Text>
                  ) : null}
                </BlockStack>
              </BlockStack>
            </BlockStack>
          </Card>

          <Card id="company-payment-methods">
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center" wrap>
                <InlineStack gap="100" blockAlign="center">
                  <Icon source={CreditCardIcon} tone="subdued" />
                  <Text as="h2" variant="headingSm">
                    Payment methods
                  </Text>
                </InlineStack>
                <Button variant="secondary">Assign payment method</Button>
              </InlineStack>
              <BlockStack gap="200">
                {paymentMethods.length ? (
                  paymentMethods.map((method) => (
                    <div key={method.id} className="CompanyDetail__PaymentMethod">
                      <InlineStack align="space-between" blockAlign="start" wrap>
                        <BlockStack gap="050">
                          <InlineStack gap="100" blockAlign="center">
                            <Badge tone={paymentStatusTone[method.status]}>{paymentTypeLabel[method.type]}</Badge>
                            {method.isDefault ? (
                              <Badge tone="success" progress="complete">
                                Default
                              </Badge>
                            ) : null}
                          </InlineStack>
                          <Text as="span" variant="bodyMd">
                            {method.label}
                          </Text>
                          {method.description ? (
                            <Text as="span" tone="subdued" variant="bodySm">
                              {method.description}
                            </Text>
                          ) : null}
                          {method.capabilities?.length ? (
                            <InlineStack gap="100" wrap>
                              {method.capabilities.map((capability) => (
                                <Badge key={capability} tone="subdued">
                                  {capability}
                                </Badge>
                              ))}
                            </InlineStack>
                          ) : null}
                        </BlockStack>
                        <BlockStack gap="050" align="end">
                          <Text as="span" tone="subdued" variant="bodySm">
                            {method.lastUsedAt ? `Last used ${formatDate(method.lastUsedAt)}` : 'Not yet used'}
                          </Text>
                          <Button variant="tertiary" size="slim" onClick={() => scrollToSection('company-payment-methods')}>
                            Manage
                          </Button>
                        </BlockStack>
                      </InlineStack>
                    </div>
                  ))
                ) : (
                  <InlineStack gap="150" blockAlign="center">
                    <Icon source={MoneyFilledIcon} tone="subdued" />
                    <Text as="span" tone="subdued" variant="bodySm">
                      No payment methods on file yet.
                    </Text>
                  </InlineStack>
                )}
              </BlockStack>
            </BlockStack>
          </Card>
        </InlineGrid>
        <InlineGrid columns={2} gap="200">
          <Card id="company-invoices">
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingSm">
                  Invoices
                </Text>
                <Button variant="secondary">Download aging report</Button>
              </InlineStack>
              {invoiceSummaries.length ? (
                <BlockStack gap="150">
                  {invoiceSummaries.slice(0, 4).map((invoice) => (
                    <div key={invoice.id} className="CompanyDetail__PaymentMethod">
                      <InlineStack align="space-between" blockAlign="start">
                        <BlockStack gap="050">
                          <InlineStack gap="100" blockAlign="center">
                            <Badge tone={invoiceStatusTone[invoice.status] ?? 'subdued'}>
                              {invoice.status.toUpperCase()}
                            </Badge>
                            <Text as="span" variant="bodyMd">
                              {invoice.number}
                            </Text>
                          </InlineStack>
                          <Text as="span" tone="subdued" variant="bodySm">
                            Due {formatDate(invoice.dueAt)} • Balance {formatCurrency(invoice.balanceDue)}
                          </Text>
                        </BlockStack>
                        <Button size="slim" variant="tertiary">
                          View invoice
                        </Button>
                      </InlineStack>
                    </div>
                  ))}
                </BlockStack>
              ) : (
                <Text as="span" tone="subdued" variant="bodySm">
                  No invoices recorded.
                </Text>
              )}
            </BlockStack>
          </Card>

          <Card id="company-quotes">
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingSm">
                  Quotes
                </Text>
                <Button variant="secondary" onClick={handleCreateQuote}>
                  Start new quote
                </Button>
              </InlineStack>
              {quoteSummaries.length ? (
                <BlockStack gap="150">
                  {quoteSummaries.slice(0, 4).map((quote) => (
                    <div key={quote.id} className="CompanyDetail__PaymentMethod">
                      <InlineStack align="space-between" blockAlign="start">
                        <BlockStack gap="050">
                          <InlineStack gap="100" blockAlign="center">
                            <Badge tone={quoteStatusTone[quote.status] ?? 'subdued'}>
                              {quote.status.replace(/_/g, ' ')}
                            </Badge>
                            <Text as="span" variant="bodyMd">
                              {quote.number}
                            </Text>
                          </InlineStack>
                          <Text as="span" tone="subdued" variant="bodySm">
                            Expires {formatDate(quote.expiresAt)} • Total {formatCurrency(quote.total)}
                          </Text>
                        </BlockStack>
                        <Button size="slim" variant="tertiary">
                          View quote
                        </Button>
                      </InlineStack>
                    </div>
                  ))}
                </BlockStack>
              ) : (
                <Text as="span" tone="subdued" variant="bodySm">
                  No quotes yet for this company.
                </Text>
              )}
            </BlockStack>
          </Card>
        </InlineGrid>
        

        <Card id="company-people">
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center" wrap>
              <Text as="h2" variant="headingSm">
                People & locations
              </Text>
              <InlineStack gap="100" wrap>
                <Button variant="secondary" onClick={() => scrollToSection('company-people')}>
                  View contacts
                </Button>
                <Button variant="secondary" onClick={() => scrollToSection('company-people')}>
                  Manage locations
                </Button>
              </InlineStack>
            </InlineStack>
            <div className="CompanyDetail__Split">
              <BlockStack gap="150">
                <Text as="span" variant="bodySm" tone="subdued">
                  Key contacts
                </Text>
                <BlockStack gap="150">
                  {company.contacts.slice(0, 3).map((contact) => (
                    <div key={contact.id} className="CompanyDetail__Contact">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {contact.firstName} {contact.lastName}
                      </Text>
                      <Text as="span" tone="subdued" variant="bodySm">
                        {contact.role.charAt(0).toUpperCase() + contact.role.slice(1)} • {contact.email}
                      </Text>
                    </div>
                  ))}
                </BlockStack>
              </BlockStack>
              <BlockStack gap="150">
                <Text as="span" variant="bodySm" tone="subdued">
                  Active locations
                </Text>
                <BlockStack gap="150">
                  {company.locations.map((location) => (
                    <div key={location.id} className="CompanyDetail__Location">
                      <InlineStack gap="100" blockAlign="center">
                        {location.code ? <Badge tone="subdued">{location.code}</Badge> : null}
                        <Text as="span" variant="bodyMd">
                          {location.name}
                        </Text>
                      </InlineStack>
                      <Text as="span" tone="subdued" variant="bodySm">
                        {location.address.line1}, {location.address.city}, {location.address.province}{' '}
                        {location.address.postalCode}
                      </Text>
                    </div>
                  ))}
                </BlockStack>
              </BlockStack>
            </div>
          </BlockStack>
        </Card>

        <Card id="company-workflows">
          <BlockStack gap="300">
            <Text as="h2" variant="headingSm">
              Related workflows
            </Text>
            <InlineStack gap="200" wrap>
              <Button variant="secondary" onClick={() => scrollToSection('company-quotes')}>
                Open quotes
              </Button>
              <Button variant="secondary" onClick={() => scrollToSection('company-invoices')}>
                Open invoices
              </Button>
              <Button variant="secondary" onClick={() => scrollToSection('company-activity')}>
                Order history
              </Button>
              <Button variant="tertiary" onClick={handleShareSnapshot}>
                Share account snapshot
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </div>
    </Page>
  );
}

