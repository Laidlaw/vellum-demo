import { useMemo } from 'react';
import {
  Badge,
  BlockStack,
  Button,
  Card,
  Divider,
  Grid,
  Icon,
  InlineStack,
  Page,
  ProgressBar,
  Text,
} from '@shopify/polaris';
import {
  AlertDiamondIcon,
  CalendarIcon,
  CashDollarIcon,
  ClipboardChecklistIcon,
  DeliveryIcon,
  NoteIcon,
  StoreIcon,
} from '@shopify/polaris-icons';

import { ALL_LOCATIONS_ID, useCustomerPortalContext } from '../CustomerApp';
import { INVOICES, QUOTES, type CompanyLocation } from '../../../data';
import { ORDER_CARDS } from '../data/orders';
import { formatCurrency, formatDate, formatTimeUntil } from '../../../utils/formatters';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

interface InvoiceInsight {
  locationId?: string;
  daysUntilDue: number;
  isOutstanding: boolean;
  isOverdue: boolean;
  isDueSoon: boolean;
  isLarge: boolean;
  invoice: (typeof INVOICES)[number];
}

interface UrgentAction {
  id: string;
  icon: typeof AlertDiamondIcon;
  tone: 'critical' | 'attention' | 'success' | 'subdued';
  title: string;
  description: string;
  url: string;
}

interface LocationSummary {
  location: CompanyLocation;
  outstandingBalance: number;
  overdueCount: number;
  pendingApprovals: number;
  inTransitOrders: number;
  awaitingPaymentOrders: number;
  nextDueLabel?: string;
}

function getDaysUntil(dateString: string) {
  const dueDate = new Date(dateString);
  const diff = dueDate.getTime() - Date.now();
  return Math.ceil(diff / MS_PER_DAY);
}

export function DashboardPage() {
  const { company, activeLocationId, activeLocation, locations } = useCustomerPortalContext();

  const contactLocationLookup = useMemo(() => {
    const map = new Map<string, string | undefined>();
    company?.contacts.forEach((contact) => {
      map.set(contact.id, contact.locationIds[0]);
    });
    return map;
  }, [company]);

  const quotesForCompany = useMemo(() => {
    if (!company) return [];
    return QUOTES.filter((quote) => quote.companyId === company.id);
  }, [company]);

  const quoteLocationLookup = useMemo(() => {
    const map = new Map<string, string | undefined>();
    quotesForCompany.forEach((quote) => {
      const requesterLocation = contactLocationLookup.get(quote.requesterId);
      const approverLocation = quote.approverId ? contactLocationLookup.get(quote.approverId) : undefined;
      map.set(quote.id, requesterLocation ?? approverLocation);
    });
    return map;
  }, [contactLocationLookup, quotesForCompany]);

  const fallbackLocationId = useMemo(() => {
    if (!locations.length) return undefined;
    const defaultShipping = locations.find((location) => location.isDefaultShipping);
    const defaultBilling = locations.find((location) => location.isDefaultBilling);
    return defaultShipping?.id ?? defaultBilling?.id ?? locations[0]?.id;
  }, [locations]);

  const invoicesWithContext = useMemo<InvoiceInsight[]>(() => {
    if (!company) return [];
    return INVOICES.filter((invoice) => invoice.companyId === company.id).map((invoice) => {
      const locationId = invoice.quoteId ? quoteLocationLookup.get(invoice.quoteId) ?? fallbackLocationId : fallbackLocationId;
      const daysUntilDue = getDaysUntil(invoice.dueAt);
      const isOutstanding =
        ['due', 'overdue', 'partial'].includes(invoice.status) ||
        (invoice.status === 'draft' && invoice.balanceDue.amount > 0);
      const isOverdue = invoice.status === 'overdue' || (isOutstanding && daysUntilDue < 0);
      const isDueSoon = isOutstanding && daysUntilDue >= 0 && daysUntilDue <= 7;
      const isLarge = invoice.total.amount >= 10_000;
      return {
        invoice,
        locationId,
        daysUntilDue,
        isOutstanding,
        isOverdue,
        isDueSoon,
        isLarge,
      };
    });
  }, [company, fallbackLocationId, quoteLocationLookup]);

  const filteredInvoices = useMemo(() => {
    if (activeLocationId === ALL_LOCATIONS_ID) return invoicesWithContext;
    return invoicesWithContext.filter((insight) => insight.locationId === activeLocationId);
  }, [activeLocationId, invoicesWithContext]);

  const outstandingInvoices = useMemo(
    () => filteredInvoices.filter((insight) => insight.isOutstanding),
    [filteredInvoices],
  );

  const overdueInvoices = useMemo(
    () => outstandingInvoices.filter((insight) => insight.isOverdue),
    [outstandingInvoices],
  );

  const dueSoonInvoices = useMemo(() => {
    return outstandingInvoices
      .filter((insight) => insight.isDueSoon)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [outstandingInvoices]);

  const outstandingBalance = outstandingInvoices.reduce(
    (sum, insight) => sum + insight.invoice.balanceDue.amount,
    0,
  );

  const overdueBalance = overdueInvoices.reduce(
    (sum, insight) => sum + insight.invoice.balanceDue.amount,
    0,
  );

  const nextPaymentDue = dueSoonInvoices[0]?.invoice ?? outstandingInvoices.sort(
    (a, b) => new Date(a.invoice.dueAt).getTime() - new Date(b.invoice.dueAt).getTime(),
  )[0]?.invoice;

  const invoiceWatchlist = useMemo(() => {
    return filteredInvoices
      .filter(
        (insight) =>
          insight.isOverdue || insight.isLarge || (insight.invoice.status === 'draft' && insight.invoice.balanceDue.amount > 0),
      )
      .sort((a, b) => {
        if (a.isOverdue !== b.isOverdue) {
          return a.isOverdue ? -1 : 1;
        }
        return new Date(a.invoice.dueAt).getTime() - new Date(b.invoice.dueAt).getTime();
      })
      .slice(0, 3);
  }, [filteredInvoices]);

  const filteredOrders = useMemo(() => {
    if (activeLocationId === ALL_LOCATIONS_ID) return ORDER_CARDS;
    return ORDER_CARDS.filter((order) => order.locationId === activeLocationId);
  }, [activeLocationId]);

  const awaitingPaymentOrders = filteredOrders.filter((order) =>
    order.fulfillmentLabel.toLowerCase().includes('payment'),
  );
  const ordersOutForDelivery = filteredOrders.filter((order) =>
    order.statusLabel.toLowerCase().includes('delivery'),
  );
  const ordersAwaitingApproval = filteredOrders.filter((order) =>
    order.statusLabel.toLowerCase().includes('approval'),
  );
  const draftOrders = filteredOrders.filter((order) => order.statusLabel === 'Draft');
  const deliveredOrders = filteredOrders.filter((order) =>
    order.statusLabel.toLowerCase().includes('delivered'),
  );

  const pendingQuotes = useMemo(() => {
    return quotesForCompany.filter((quote) => {
      if (quote.status !== 'pending_approval') return false;
      const locationId = quoteLocationLookup.get(quote.id);
      if (activeLocationId === ALL_LOCATIONS_ID) return true;
      return locationId === activeLocationId;
    });
  }, [activeLocationId, quoteLocationLookup, quotesForCompany]);

  const locationSummaries = useMemo<LocationSummary[]>(() => {
    const relevantLocations =
      activeLocationId === ALL_LOCATIONS_ID
        ? locations
        : activeLocation
          ? [activeLocation]
          : [];

    return relevantLocations.map((location) => {
      const invoicesForLocation = invoicesWithContext.filter(
        (insight) => insight.locationId === location.id && insight.isOutstanding,
      );
      const overdueForLocation = invoicesForLocation.filter((insight) => insight.isOverdue);
      const nextDueInvoice = invoicesForLocation
        .slice()
        .sort((a, b) => new Date(a.invoice.dueAt).getTime() - new Date(b.invoice.dueAt).getTime())[0];
      const ordersForLocation = ORDER_CARDS.filter((order) => order.locationId === location.id);
      const inTransitOrders = ordersForLocation.filter((order) =>
        order.statusLabel.toLowerCase().includes('delivery'),
      ).length;
      const awaitingPayment = ordersForLocation.filter((order) =>
        order.fulfillmentLabel.toLowerCase().includes('payment'),
      ).length;
      const locationPendingQuotes = quotesForCompany.filter((quote) => {
        if (quote.status !== 'pending_approval') return false;
        const locationId = quoteLocationLookup.get(quote.id);
        return locationId === location.id;
      });

      return {
        location,
        outstandingBalance: invoicesForLocation.reduce(
          (sum, insight) => sum + insight.invoice.balanceDue.amount,
          0,
        ),
        overdueCount: overdueForLocation.length,
        pendingApprovals: locationPendingQuotes.length,
        inTransitOrders,
        awaitingPaymentOrders: awaitingPayment,
        nextDueLabel: nextDueInvoice ? formatDate(nextDueInvoice.invoice.dueAt) : undefined,
      };
    });
  }, [
    activeLocation,
    activeLocationId,
    locations,
    invoicesWithContext,
    quotesForCompany,
    quoteLocationLookup,
  ]);

  const urgentActions = useMemo<UrgentAction[]>(() => {
    const actions: UrgentAction[] = [];

    if (overdueInvoices.length) {
      const invoice = overdueInvoices[0].invoice;
      actions.push({
        id: 'overdue',
        icon: AlertDiamondIcon,
        tone: 'critical',
        title: `${overdueInvoices.length} overdue invoice${overdueInvoices.length === 1 ? '' : 's'}`,
        description: `Oldest due ${formatDate(invoice.dueAt)} • ${formatCurrency(overdueBalance)}`,
        url: '/cx/invoices',
      });
    }

    if (dueSoonInvoices.length && !actions.some((action) => action.id === 'overdue')) {
      const invoice = dueSoonInvoices[0].invoice;
      actions.push({
        id: 'due-soon',
        icon: CalendarIcon,
        tone: 'attention',
        title: 'Upcoming payment',
        description: `Invoice ${invoice.invoiceNumber} due ${formatDate(invoice.dueAt)} (${formatTimeUntil(invoice.dueAt)})`,
        url: `/cx/invoices/${invoice.id}`,
      });
    }

    if (awaitingPaymentOrders.length) {
      const order = awaitingPaymentOrders[0];
      actions.push({
        id: 'orders-awaiting-payment',
        icon: CashDollarIcon,
        tone: 'attention',
        title: 'Orders waiting on payment',
        description: `${awaitingPaymentOrders.length} order${awaitingPaymentOrders.length === 1 ? '' : 's'} like ${order.orderNumber}`,
        url: '/cx/orders',
      });
    }

    if (pendingQuotes.length) {
      const quote = pendingQuotes[0];
      actions.push({
        id: 'approvals',
        icon: ClipboardChecklistIcon,
        tone: 'attention',
        title: 'Quote approvals needed',
        description: `${pendingQuotes.length} quote${pendingQuotes.length === 1 ? '' : 's'} in review (next: ${quote.quoteNumber})`,
        url: '/cx/quotes',
      });
    }

    if (!actions.length && deliveredOrders.length) {
      const order = deliveredOrders[0];
      actions.push({
        id: 'delivered',
        icon: DeliveryIcon,
        tone: 'success',
        title: 'Recent delivery completed',
        description: `Order ${order.orderNumber} delivered • ${order.statusMeta}`,
        url: '/cx/orders',
      });
    }

    return actions.slice(0, 3);
  }, [
    awaitingPaymentOrders,
    deliveredOrders,
    dueSoonInvoices,
    overdueBalance,
    overdueInvoices,
    pendingQuotes,
  ]);

  const locationBadgeText =
    activeLocationId === ALL_LOCATIONS_ID
      ? `All ${locations.length} locations`
      : activeLocation?.name ?? 'Location filter';

  const creditLimitAmount = company?.credit?.creditLimit?.amount ?? 0;
  const creditUsedAmount = company?.credit?.creditUsed?.amount ?? 0;
  const creditUsagePercent =
    creditLimitAmount > 0 ? Math.min(100, Math.round((creditUsedAmount / creditLimitAmount) * 100)) : 0;

  return (
    <Page
      title="Finance overview"
      subtitle="Monitor receivables, fulfillment, and approval work in one place"
      primaryAction={{ content: 'Record payment', url: '/cx/invoices' }}
      secondaryActions={[{ content: 'Download AR snapshot', icon: NoteIcon, url: '/cx/history' }]}
    >
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="200">
            <InlineStack gap="200" blockAlign="center" wrap>
              <Badge tone="info">{locationBadgeText}</Badge>
              <Text tone="subdued" variant="bodySm">
                {outstandingInvoices.length} active invoice{outstandingInvoices.length === 1 ? '' : 's'} ·{' '}
                {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'} ·{' '}
                {pendingQuotes.length} pending approval{pendingQuotes.length === 1 ? '' : 's'}
              </Text>
            </InlineStack>
            <div className="KeyValueList">
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{formatCurrency(outstandingBalance)}</Text>
                <Text tone="subdued" variant="bodySm">
                  Receivables balance
                </Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{overdueInvoices.length}</Text>
                <Text tone="subdued" variant="bodySm">
                  Overdue invoices · oldest due {overdueInvoices.length ? formatDate(overdueInvoices[0].invoice.dueAt) : '—'}
                </Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{awaitingPaymentOrders.length}</Text>
                <Text tone="subdued" variant="bodySm">
                  Orders awaiting payment across filtered locations
                </Text>
              </div>
              {creditLimitAmount ? (
                <div className="KeyValueList__Item">
                  <Text variant="headingLg">{formatCurrency(creditLimitAmount - creditUsedAmount)}</Text>
                  <Text tone="subdued" variant="bodySm">
                    Credit available
                  </Text>
                </div>
              ) : null}
            </div>
          </BlockStack>
        </Card>

        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, md: 6 }}>
            <Card>
              <BlockStack gap="200">
                <InlineStack className="InlineSectionHeading" gap="100" blockAlign="center" wrap={false}>
                  <Icon source={CashDollarIcon} tone="subdued" />
                  <Text variant="headingSm">Receivables health</Text>
                </InlineStack>
                <Text tone="subdued" variant="bodySm">
                  Keep tabs on upcoming payments and how credit capacity is being used.
                </Text>
                <BlockStack gap="150">
                  <InlineStack align="space-between" blockAlign="center" wrap>
                    <BlockStack gap="025">
                      <Text fontWeight="medium">
                        {nextPaymentDue
                          ? `Invoice ${nextPaymentDue.invoiceNumber}`
                          : 'No invoices due in the next week'}
                      </Text>
                      {nextPaymentDue ? (
                        <Text tone="subdued" variant="bodySm">
                          Due {formatDate(nextPaymentDue.dueAt)} · {formatCurrency(nextPaymentDue.balanceDue.amount)} remaining
                        </Text>
                      ) : (
                        <Text tone="subdued" variant="bodySm">
                          You’re clear for the next seven days.
                        </Text>
                      )}
                    </BlockStack>
                    {nextPaymentDue ? (
                      <Badge tone="attention">{formatTimeUntil(nextPaymentDue.dueAt)}</Badge>
                    ) : null}
                  </InlineStack>
                  {creditLimitAmount ? (
                    <BlockStack gap="050">
                      <ProgressBar progress={creditUsagePercent} tone={creditUsagePercent > 80 ? 'critical' : 'highlight'} />
                      <Text tone="subdued" variant="bodySm">
                        {formatCurrency(creditUsedAmount)} of {formatCurrency(creditLimitAmount)} credit in use
                      </Text>
                    </BlockStack>
                  ) : null}
                </BlockStack>
                <InlineStack gap="150" wrap>
                  <Button variant="tertiary" size="slim" url="/cx/invoices">
                    Review aging report
                  </Button>
                  <Button variant="tertiary" size="slim" url="/cx/company">
                    Update payment terms
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Grid.Cell>

          <Grid.Cell columnSpan={{ xs: 6, md: 6 }}>
            <Card>
              <BlockStack gap="200">
                <InlineStack className="InlineSectionHeading" gap="100" blockAlign="center" wrap={false}>
                  <Icon source={ClipboardChecklistIcon} tone="subdued" />
                  <Text variant="headingSm">Workflow highlights</Text>
                </InlineStack>
                <Text tone="subdued" variant="bodySm">
                  Surface where orders or approvals may need attention today.
                </Text>
                <div className="KeyValueList">
                  <div className="KeyValueList__Item">
                    <Badge tone={awaitingPaymentOrders.length ? 'attention' : 'success'}>
                      Awaiting payment · {awaitingPaymentOrders.length}
                    </Badge>
                    <Text tone="subdued" variant="bodySm">
                      Orders ready to settle
                    </Text>
                  </div>
                  <div className="KeyValueList__Item">
                    <Badge tone={ordersOutForDelivery.length ? 'info' : 'subdued'}>
                      In transit · {ordersOutForDelivery.length}
                    </Badge>
                    <Text tone="subdued" variant="bodySm">
                      Track delivery confirmations
                    </Text>
                  </div>
                  <div className="KeyValueList__Item">
                    <Badge tone={pendingQuotes.length ? 'attention' : 'success'}>
                      Approvals · {pendingQuotes.length}
                    </Badge>
                    <Text tone="subdued" variant="bodySm">
                      Quotes waiting for finance sign-off
                    </Text>
                  </div>
                  <div className="KeyValueList__Item">
                    <Badge tone={draftOrders.length ? 'subdued' : 'success'}>
                      Drafts · {draftOrders.length}
                    </Badge>
                    <Text tone="subdued" variant="bodySm">
                      Saved requisitions to review
                    </Text>
                  </div>
                </div>
                <InlineStack gap="150" wrap>
                  <Button variant="tertiary" size="slim" url="/cx/orders">
                    Open orders dashboard
                  </Button>
                  <Button variant="tertiary" size="slim" url="/cx/quotes">
                    Manage approvals
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Grid.Cell>
        </Grid>

        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, md: 7 }}>
            <Card>
              <BlockStack gap="200">
                <InlineStack className="InlineSectionHeading" gap="100" blockAlign="center" wrap={false}>
                  <Icon source={AlertDiamondIcon} tone="subdued" />
                  <Text variant="headingSm">Invoice watchlist</Text>
                </InlineStack>
                {invoiceWatchlist.length ? (
                  <BlockStack gap="200">
                    {invoiceWatchlist.map((insight) => {
                      const locationLabel =
                        insight.locationId && activeLocationId === ALL_LOCATIONS_ID
                          ? locations.find((location) => location.id === insight.locationId)?.code ??
                            locations.find((location) => location.id === insight.locationId)?.name ??
                            'Location'
                          : undefined;

                      return (
                        <BlockStack key={insight.invoice.id} gap="100">
                          <InlineStack align="space-between" blockAlign="center" wrap>
                            <BlockStack gap="025">
                              <Text fontWeight="medium">{insight.invoice.invoiceNumber}</Text>
                              <Text tone="subdued" variant="bodySm">
                                {formatCurrency(insight.invoice.balanceDue.amount)} · Due {formatDate(insight.invoice.dueAt)} ({formatTimeUntil(insight.invoice.dueAt)})
                              </Text>
                            </BlockStack>
                            <InlineStack gap="100" blockAlign="center">
                              <Badge tone={insight.isOverdue ? 'critical' : insight.invoice.status === 'draft' ? 'attention' : 'info'}>
                                {insight.isOverdue ? 'Overdue' : insight.invoice.status === 'draft' ? 'Draft' : 'High value'}
                              </Badge>
                              {locationLabel ? <Badge tone="subdued">{locationLabel}</Badge> : null}
                            </InlineStack>
                          </InlineStack>
                          <Divider />
                        </BlockStack>
                      );
                    })}
                  </BlockStack>
                ) : (
                  <Text tone="subdued">No invoices need special attention right now.</Text>
                )}
                <Button variant="tertiary" size="slim" url="/cx/invoices">
                  View all invoices
                </Button>
              </BlockStack>
            </Card>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, md: 5 }}>
            <Card>
              <BlockStack gap="200">
                <InlineStack className="InlineSectionHeading" gap="100" blockAlign="center" wrap={false}>
                  <Icon source={ClipboardChecklistIcon} tone="subdued" />
                  <Text variant="headingSm">Next best actions</Text>
                </InlineStack>
                {urgentActions.length ? (
                  <BlockStack gap="200">
                    {urgentActions.map((action) => (
                      <BlockStack key={action.id} gap="100">
                        <InlineStack className="InlineSectionHeading" gap="100" blockAlign="center" wrap={false}>
                          <Icon source={action.icon} tone={action.tone} />
                          <Text fontWeight="medium">{action.title}</Text>
                        </InlineStack>
                        <Text tone="subdued" variant="bodySm">
                          {action.description}
                        </Text>
                        <Button variant="tertiary" size="slim" url={action.url}>
                          Open
                        </Button>
                        <Divider />
                      </BlockStack>
                    ))}
                  </BlockStack>
                ) : (
                  <Text tone="subdued">Everything looks good. Keep an eye on upcoming invoices later this week.</Text>
                )}
              </BlockStack>
            </Card>
          </Grid.Cell>
        </Grid>

        <Card>
          <BlockStack gap="300">
            <InlineStack className="InlineSectionHeading" gap="100" blockAlign="center" wrap={false}>
              <Icon source={StoreIcon} tone="subdued" />
              <Text variant="headingSm">
                {activeLocationId === ALL_LOCATIONS_ID ? 'Location spotlight' : activeLocation?.name ?? 'Location details'}
              </Text>
            </InlineStack>
            {locationSummaries.length ? (
              <BlockStack gap="300">
                {locationSummaries.map((summary) => (
                  <BlockStack key={summary.location.id} gap="200">
                    <InlineStack align="space-between" blockAlign="center" wrap>
                      <InlineStack gap="150" blockAlign="center" wrap>
                        <BlockStack gap="025">
                          <Text variant="bodyMd" fontWeight="medium">
                            {summary.location.name}
                          </Text>
                          <Text tone="subdued" variant="bodySm">
                            {summary.awaitingPaymentOrders} awaiting payment · {summary.inTransitOrders} in transit
                          </Text>
                        </BlockStack>
                        {summary.location.code ? <Badge tone="subdued">{summary.location.code}</Badge> : null}
                        {summary.pendingApprovals ? (
                          <Badge tone="attention">
                            {summary.pendingApprovals} approval{summary.pendingApprovals === 1 ? '' : 's'}
                          </Badge>
                        ) : null}
                      </InlineStack>
                      <BlockStack align="end" gap="025">
                        <Text variant="headingMd">{formatCurrency(summary.outstandingBalance)}</Text>
                        <InlineStack gap="100" blockAlign="center">
                          <Badge tone={summary.overdueCount ? 'critical' : 'success'}>
                            {summary.overdueCount ? `${summary.overdueCount} overdue` : 'Up to date'}
                          </Badge>
                          {summary.nextDueLabel ? (
                            <Text tone="subdued" variant="bodySm">
                              Next due {summary.nextDueLabel}
                            </Text>
                          ) : null}
                        </InlineStack>
                      </BlockStack>
                    </InlineStack>
                    <Divider />
                  </BlockStack>
                ))}
              </BlockStack>
            ) : (
              <Text tone="subdued">
                No locations match this filter yet. Add shipping locations from the Locations page to see site-level insights.
              </Text>
            )}
            <InlineStack gap="150" wrap>
              <Button variant="tertiary" size="slim" url="/cx/company">
                View billing profile
              </Button>
              <Button variant="tertiary" size="slim" url="/cx/locations">
                Manage locations
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
