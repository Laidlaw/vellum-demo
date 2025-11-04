import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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
      const locationId = invoice.quoteId
        ? quoteLocationLookup.get(invoice.quoteId) ?? fallbackLocationId
        : fallbackLocationId;
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

  const pendingQuotes = useMemo(() => {
    return quotesForCompany.filter((quote) => {
      if (quote.status !== 'pending_approval') return false;
      const locationId = quoteLocationLookup.get(quote.id);
      if (activeLocationId === ALL_LOCATIONS_ID) return true;
      return locationId === activeLocationId;
    });
  }, [activeLocationId, quoteLocationLookup, quotesForCompany]);

  const expiringQuotes = useMemo(() => {
    const now = Date.now();
    return pendingQuotes.filter((quote) => {
      if (!quote.expiresAt) return false;
      const daysUntil = Math.ceil((new Date(quote.expiresAt).getTime() - now) / MS_PER_DAY);
      return daysUntil >= 0 && daysUntil <= 7;
    });
  }, [pendingQuotes]);

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

    if (expiringQuotes.length && !actions.some((action) => action.id === 'overdue')) {
      const quote = expiringQuotes[0];
      actions.push({
        id: 'expiring',
        icon: CalendarIcon,
        tone: 'attention',
        title: 'Quotes expiring soon',
        description: `${expiringQuotes.length} approval${expiringQuotes.length === 1 ? '' : 's'} expiring within a week (next: ${quote.quoteNumber})`,
        url: '/cx/quotes',
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

    if (ordersAwaitingApproval.length) {
      const order = ordersAwaitingApproval[0];
      actions.push({
        id: 'orders-awaiting-approval',
        icon: ClipboardChecklistIcon,
        tone: 'attention',
        title: 'Orders awaiting approval',
        description: `${ordersAwaitingApproval.length} draft order${ordersAwaitingApproval.length === 1 ? '' : 's'} (next: ${order.orderNumber})`,
        url: '/cx/orders',
      });
    }

    return actions.slice(0, 3);
  }, [awaitingPaymentOrders, expiringQuotes, ordersAwaitingApproval, overdueBalance, overdueInvoices]);

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
  }, [activeLocation, activeLocationId, invoicesWithContext, locations, quoteLocationLookup, quotesForCompany]);

  const draftQuotes = quotesForCompany.filter((quote) => quote.status === 'draft');
  const approvedQuotes = quotesForCompany.filter((quote) => quote.status === 'approved');

  return (
    <Page title="Account overview" subtitle="Snapshot of receivables, approvals, and fulfillment">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center" wrap>
              <InlineStack gap="200" blockAlign="center" wrap>
                <Icon source={CashDollarIcon} tone="subdued" />
                <BlockStack gap="050">
                  <Text as="h2" variant="headingLg">
                    Financial health snapshot
                  </Text>
                  <InlineStack gap="150" blockAlign="center" wrap>
                    <Badge tone={overdueInvoices.length ? 'critical' : 'success'}>
                      {overdueInvoices.length} overdue invoices
                    </Badge>
                    <Badge tone={pendingQuotes.length ? 'attention' : 'success'}>
                      {pendingQuotes.length} approvals
                    </Badge>
                    <Badge tone={awaitingPaymentOrders.length ? 'info' : 'success'}>
                      {awaitingPaymentOrders.length} orders awaiting payment
                    </Badge>
                  </InlineStack>
                </BlockStack>
              </InlineStack>
              <Button variant="tertiary" tone="subdued" onClick={() => navigate('/cx/history')}>
                History
              </Button>
            </InlineStack>
            <Divider />
            <div className="KeyValueList">
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{formatCurrency(outstandingBalance)}</Text>
                <Text tone="subdued" variant="bodySm">
                  Outstanding receivables
                </Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{formatCurrency(overdueBalance)}</Text>
                <Text tone="subdued" variant="bodySm">
                  Overdue balance
                </Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{pendingQuotes.length}</Text>
                <Text tone="subdued" variant="bodySm">
                  Quotes pending approval
                </Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{awaitingPaymentOrders.length}</Text>
                <Text tone="subdued" variant="bodySm">
                  Orders awaiting payment
                </Text>
              </div>
            </div>
          </BlockStack>
        </Card>

        <Grid gap="300">
          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card className="DashboardSnapshot">
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center" wrap>
                  <InlineStack gap="150" blockAlign="center">
                    <Icon source={ClipboardChecklistIcon} tone="subdued" />
                    <Text variant="headingSm">Quotes snapshot</Text>
                  </InlineStack>
                  <Button size="slim" onClick={() => navigate('/cx/quotes')}>
                    View quotes
                  </Button>
                </InlineStack>
                <BlockStack gap="100">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      Pending approvals
                    </Text>
                    <Text variant="headingSm">{pendingQuotes.length}</Text>
                  </InlineStack>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      Expiring this week
                    </Text>
                    <Text variant="headingSm">{expiringQuotes.length}</Text>
                  </InlineStack>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      Drafts in progress
                    </Text>
                    <Text variant="headingSm">{draftQuotes.length}</Text>
                  </InlineStack>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      Approved &amp; ready
                    </Text>
                    <Text variant="headingSm">{approvedQuotes.length}</Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Grid.Cell>

          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card className="DashboardSnapshot">
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center" wrap>
                  <InlineStack gap="150" blockAlign="center">
                    <Icon source={CashDollarIcon} tone="subdued" />
                    <Text variant="headingSm">Invoices snapshot</Text>
                  </InlineStack>
                  <Button size="slim" onClick={() => navigate('/cx/invoices')}>
                    View invoices
                  </Button>
                </InlineStack>
                <BlockStack gap="100">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      Outstanding balance
                    </Text>
                    <Text variant="headingSm">{formatCurrency(outstandingBalance)}</Text>
                  </InlineStack>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      Overdue invoices
                    </Text>
                    <Text variant="headingSm">{overdueInvoices.length}</Text>
                  </InlineStack>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      Drafts awaiting issue
                    </Text>
                    <Text variant="headingSm">
                      {filteredInvoices.filter((invoice) => invoice.invoice.status === 'draft').length}
                    </Text>
                  </InlineStack>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      Next payment due
                    </Text>
                    <Text variant="headingSm">
                      {nextPaymentDue ? formatDate(nextPaymentDue.dueAt) : '—'}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Grid.Cell>

          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card className="DashboardSnapshot">
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center" wrap>
                  <InlineStack gap="150" blockAlign="center">
                    <Icon source={StoreIcon} tone="subdued" />
                    <Text variant="headingSm">Orders snapshot</Text>
                  </InlineStack>
                  <Button size="slim" onClick={() => navigate('/cx/orders')}>
                    View orders
                  </Button>
                </InlineStack>
                <BlockStack gap="100">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      Awaiting payment
                    </Text>
                    <Text variant="headingSm">{awaitingPaymentOrders.length}</Text>
                  </InlineStack>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      In transit
                    </Text>
                    <Text variant="headingSm">{ordersOutForDelivery.length}</Text>
                  </InlineStack>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      Awaiting approval
                    </Text>
                    <Text variant="headingSm">{ordersAwaitingApproval.length}</Text>
                  </InlineStack>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      Draft orders
                    </Text>
                    <Text variant="headingSm">{draftOrders.length}</Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Grid.Cell>
        </Grid>

        <Grid gap="300">
          <Grid.Cell columnSpan={{ xs: 6, md: 7 }}>
            <Card className="DashboardSnapshot">
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center" wrap>
                  <InlineStack gap="150" blockAlign="center">
                    <Icon source={AlertDiamondIcon} tone="subdued" />
                    <Text variant="headingSm">Invoice watchlist</Text>
                  </InlineStack>
                  <Button size="slim" onClick={() => navigate('/cx/invoices')}>
                    Resolve balance
                  </Button>
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
                              <Badge tone={insight.isOverdue ? 'critical' : 'attention'}>
                                {insight.isOverdue ? 'Overdue' : 'High value'}
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
              </BlockStack>
            </Card>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, md: 5 }}>
            <Card className="DashboardSnapshot">
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center" wrap>
                  <InlineStack gap="150" blockAlign="center">
                    <Icon source={ClipboardChecklistIcon} tone="subdued" />
                    <Text variant="headingSm">Next best actions</Text>
                  </InlineStack>
                </InlineStack>
                {urgentActions.length ? (
                  <BlockStack gap="200">
                    {urgentActions.map((action) => (
                      <BlockStack key={action.id} gap="100">
                        <InlineStack gap="100" blockAlign="center">
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
            <InlineStack gap="150" blockAlign="center" wrap>
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
