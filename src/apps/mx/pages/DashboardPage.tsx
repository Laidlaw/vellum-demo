import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BlockStack,
  Button,
  Card,
  Grid,
  Icon,
  InlineGrid,
  InlineStack,
  Link,
  Page,
  Text,
} from '@shopify/polaris';
import { AlertTriangleIcon, CashDollarIcon, NoteIcon, StoreIcon } from '@shopify/polaris-icons';

import { COMPANIES, INVOICES, QUOTES, type Invoice, type Quote } from '../../../data';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { SummaryMetric } from '../components/SummaryMetric';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getDaysUntil(dateString: string) {
  const dueDate = new Date(dateString);
  const diff = dueDate.getTime() - Date.now();
  return Math.ceil(diff / MS_PER_DAY);
}

interface ActivityItem {
  id: string;
  occurredAt: string;
  title: string;
  description: string;
  url: string;
}

function isOutstandingInvoice(invoice: Invoice) {
  if (['due', 'overdue', 'partial'].includes(invoice.status)) return true;
  if (invoice.status === 'draft' && invoice.balanceDue.amount > 0) return true;
  return false;
}

function isOpenQuote(quote: Quote) {
  return quote.status === 'draft' || quote.status === 'pending_approval';
}

export function DashboardPage() {
  const navigate = useNavigate();

  const quoteMetrics = useMemo(() => {
    const total = QUOTES.length;
    const open = QUOTES.filter(isOpenQuote);
    const pendingApproval = open.filter((quote) => quote.status === 'pending_approval').length;
    const expiringSoon = open.filter((quote) => getDaysUntil(quote.expiresAt) <= 7).length;

    return {
      total,
      openCount: open.length,
      pendingApproval,
      expiringSoon,
    };
  }, []);

  const invoiceMetrics = useMemo(() => {
    let outstandingCount = 0;
    let overdueCount = 0;
    let outstandingAmount = 0;

    INVOICES.forEach((invoice) => {
      if (isOutstandingInvoice(invoice)) {
        outstandingCount += 1;
        outstandingAmount += invoice.balanceDue.amount;
        if (invoice.status === 'overdue' || getDaysUntil(invoice.dueAt) < 0) {
          overdueCount += 1;
        }
      }
    });

    return {
      outstandingCount,
      overdueCount,
      outstandingAmount,
    };
  }, []);

  const companyMetrics = useMemo(() => {
    const total = COMPANIES.length;
    const approved = COMPANIES.filter((company) => company.orderingStatus === 'approved').length;
    const atRisk = COMPANIES.filter((company) => company.credit.daysPastDue > 0).length;

    return {
      total,
      approved,
      atRisk,
    };
  }, []);

  const topCompanies = useMemo(
    () =>
      [...COMPANIES]
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 3),
    [],
  );

  const activityItems = useMemo<ActivityItem[]>(() => {
    const events: ActivityItem[] = [];

    QUOTES.forEach((quote) => {
      const lastEvent = quote.history[quote.history.length - 1];
      events.push({
        id: `quote-${quote.id}`,
        occurredAt: lastEvent?.occurredAt ?? quote.createdAt,
        title: `Quote ${quote.quoteNumber} ${lastEvent?.type ?? 'updated'}`,
        description: quote.name,
        url: '/mx/quotes',
      });
    });

    INVOICES.forEach((invoice) => {
      const title =
        invoice.status === 'paid'
          ? `Invoice ${invoice.invoiceNumber} paid`
          : `Invoice ${invoice.invoiceNumber} issued`;

      const description =
        invoice.status === 'paid'
          ? `Paid ${formatCurrency(invoice.amountPaid.amount)}`
          : `Due ${formatDate(invoice.dueAt)} · ${formatCurrency(invoice.balanceDue.amount)} outstanding`;

      events.push({
        id: `invoice-${invoice.id}`,
        occurredAt: invoice.paidAt ?? invoice.issuedAt,
        title,
        description,
        url: `/mx/invoices/${invoice.id}`,
      });
    });

    return events
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 5);
  }, []);

  return (
    // <Page fullWidth titleHidden>
    //       <BlockStack gap="400">
    //         <InlineStack align="space-between" blockAlign="center" wrap>
    //           <InlineStack gap="200" blockAlign="center">
    //             <Icon source={StoreIcon} tone="subdued" />
    //             <Text as="h1" variant="headingLg">
    //               Merchant Overview
    //             </Text>
    //           </InlineStack>
    //           <ButtonGroup variant="segmented">
    //             <Button>Export PDF</Button>
    //             <Button>Export CSV</Button>
    //             <Button>Generate Report</Button>
    //           </ButtonGroup>
    //         </InlineStack>
    <Page 
      fullWidth
      title="Merchant overview"
      subtitle="At-a-glance view of B2B companies, quotes, and invoices."
      primaryAction={{
        content: 'Create quote',
        onAction: () => navigate('/storefront/quote'),
      }}
      secondaryActions={[
        {
          content: 'Open quotes workspace',
          onAction: () => navigate('/mx/quotes'),
        },
      ]}
    >
      <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
        <Grid.Cell columnSpan={{ xs: 1, md: 2 }}>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={StoreIcon} tone="subdued" />
                  <Text as="h2" variant="headingMd">
                    Today&apos;s overview
                  </Text>
                </InlineStack>
                <InlineGrid columns={{ xs: 1, sm: 3 }} gap="300">
                  <SummaryMetric
                    label="Open quotes (total / pending approval)"
                    value={
                      <Text as="span" variant="headingLg">
                        {quoteMetrics.openCount} / {quoteMetrics.pendingApproval}
                      </Text>
                    }
                    tone="primary"
                  />
                  <SummaryMetric
                    label="Outstanding invoices (overdue)"
                    value={
                      <Text as="span" variant="headingLg">
                        {invoiceMetrics.outstandingCount} ({invoiceMetrics.overdueCount} overdue)
                      </Text>
                    }
                    tone={invoiceMetrics.overdueCount ? 'critical' : 'success'}
                  />
                  <SummaryMetric
                    label="Active companies (at risk)"
                    value={
                      <Text as="span" variant="headingLg">
                        {companyMetrics.approved} / {companyMetrics.total} ({companyMetrics.atRisk} at risk)
                      </Text>
                    }
                    tone={companyMetrics.atRisk ? 'attention' : 'success'}
                  />
                </InlineGrid>
                <InlineStack gap="200" wrap>
                  <BlockStack gap="050">
                    <Text as="span" tone="subdued" variant="bodySm">
                      Expiring quotes (next 7 days)
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {quoteMetrics.expiringSoon || 'None'}
                    </Text>
                  </BlockStack>
                  <BlockStack gap="050">
                    <Text as="span" tone="subdued" variant="bodySm">
                      Outstanding invoice balance
                    </Text>
                    <InlineStack gap="100" blockAlign="center">
                      <Icon source={CashDollarIcon} tone="subdued" />
                      <Text as="span" variant="bodyMd">
                        {formatCurrency(invoiceMetrics.outstandingAmount)}
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={AlertTriangleIcon} tone="critical" />
                  <Text as="h2" variant="headingMd">
                    Needs your attention
                  </Text>
                </InlineStack>
                <BlockStack as="ul" gap="200">
                  <li>
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="050">
                        <Text as="span" variant="bodyMd">
                          Quotes awaiting approval
                        </Text>
                        <Text as="span" tone="subdued" variant="bodySm">
                          {quoteMetrics.pendingApproval
                            ? `${quoteMetrics.pendingApproval} quote(s) ready for review.`
                            : 'No quotes waiting on you.'}
                        </Text>
                      </BlockStack>
                      <Button variant="tertiary" onClick={() => navigate('/mx/quotes')}>
                        View quotes
                      </Button>
                    </InlineStack>
                  </li>
                  <li>
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="050">
                        <Text as="span" variant="bodyMd">
                          Invoices past due
                        </Text>
                        <Text as="span" tone="subdued" variant="bodySm">
                          {invoiceMetrics.overdueCount
                            ? `${invoiceMetrics.overdueCount} invoice(s) past due across key accounts.`
                            : 'No invoices currently overdue.'}
                        </Text>
                      </BlockStack>
                      <Button variant="tertiary" onClick={() => navigate('/ccx')}>
                        Open finance view
                      </Button>
                    </InlineStack>
                  </li>
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={StoreIcon} tone="subdued" />
                  <Text as="h2" variant="headingMd">
                    Key accounts
                  </Text>
                </InlineStack>
                <InlineGrid columns={{ xs: 1, sm: 3 }} gap="300">
                  {topCompanies.map((company) => (
                    <BlockStack key={company.id} gap="100">
                      <Text as="span" variant="bodyMd" fontWeight="medium">
                        {company.name}
                      </Text>
                      <Text as="span" tone="subdued" variant="bodySm">
                        Total sales
                      </Text>
                      <Text as="span" variant="bodyMd">
                        {formatCurrency(company.totalSales)}
                      </Text>
                      <Link url={`/mx/companies/${company.id}`} monochrome>
                        View company
                      </Link>
                    </BlockStack>
                  ))}
                </InlineGrid>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={NoteIcon} tone="subdued" />
                  <Text as="h2" variant="headingMd">
                    Recent activity
                  </Text>
                </InlineStack>
                <BlockStack as="ul" gap="200">
                  {activityItems.map((item) => (
                    <li key={item.id}>
                      <BlockStack gap="050">
                        <Link url={item.url} monochrome>
                          <Text as="span" variant="bodyMd" fontWeight="medium">
                            {item.title}
                          </Text>
                        </Link>
                        <Text as="span" tone="subdued" variant="bodySm">
                          {item.description}
                        </Text>
                      </BlockStack>
                    </li>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Grid.Cell>
        <Grid.Cell columnSpan={{ xs: 1, md: 1 }}>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={CashDollarIcon} tone="subdued" />
                  <Text as="h2" variant="headingMd">
                    Work across teams
                  </Text>
                </InlineStack>
                <BlockStack gap="200">
                  <Button fullWidth variant="secondary" onClick={() => navigate('/ccx')}>
                    Open finance control center
                  </Button>
                  <Button fullWidth variant="secondary" onClick={() => navigate('/ccx/pay-runs')}>
                    Plan a pay run
                  </Button>
                  <Button
                    fullWidth
                    variant="secondary"
                    onClick={() => navigate('/ccx/companies/comp-abstract-industrial/invoices')}
                  >
                    Review Abstract Industrial invoices
                  </Button>
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={NoteIcon} tone="subdued" />
                  <Text as="h2" variant="headingMd">
                    Shortcuts
                  </Text>
                </InlineStack>
                <BlockStack as="ul" gap="150">
                  <li>
                    <Link url="/mx/companies">
                      <Text as="span" variant="bodySm">
                        Companies index
                      </Text>
                    </Link>
                  </li>
                  <li>
                    <Link url="/mx/customers">
                      <Text as="span" variant="bodySm">
                        Customer contacts
                      </Text>
                    </Link>
                  </li>
                  <li>
                    <Link url="/cx">
                      <Text as="span" variant="bodySm">
                        View buyer experience
                      </Text>
                    </Link>
                  </li>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Grid.Cell>
      </InlineGrid>
    </Page>
  );
}
