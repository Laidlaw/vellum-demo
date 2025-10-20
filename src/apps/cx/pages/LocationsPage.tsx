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
  List,
  Page,
  Text,
} from '@shopify/polaris';
import { DeliveryIcon, NoteIcon, PersonIcon, StoreIcon } from '@shopify/polaris-icons';

import { ALL_LOCATIONS_ID, useCustomerPortalContext } from '../CustomerApp';
import type { CompanyLocation } from '../../../data';
import { INVOICES, QUOTES } from '../../../data';
import { ORDER_CARDS } from '../data/orders';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface LocationPreference {
  receivingHours: string;
  dockNotes: string;
  preferredCarrier: string;
  handlingNotes?: string;
  lastDelivery?: string;
  nextDelivery?: string;
}

const LOCATION_PREFERENCES: Record<string, LocationPreference> = {
  'loc-abstract-hq': {
    receivingHours: 'Weekdays 8am – 5pm ET',
    dockNotes: 'Use dock door 4. Forklift on-site for pallets.',
    preferredCarrier: 'Shopify Freight (consolidated)',
    handlingNotes: 'Send ASN by 3pm day prior for gated access.',
    lastDelivery: 'Oct 14 • Consolidated skid delivery',
    nextDelivery: 'Pending payment • Order #1410',
  },
  'loc-abstract-west-hub': {
    receivingHours: 'Weekdays 7am – 3pm PT',
    dockNotes: 'Side street entrance on 10th. No weekend receiving.',
    preferredCarrier: 'FedEx Freight Priority',
    handlingNotes: 'Requires 24h delivery window confirmation.',
    lastDelivery: 'Oct 14 • Left at distribution hub',
    nextDelivery: 'Awaiting manager approval • Order #1414',
  },
  'loc-abstract-south-yard': {
    receivingHours: 'Weekdays 9am – 4pm ET',
    dockNotes: 'Ground-level delivery. Call ahead for lift-gate.',
    preferredCarrier: 'UPS Freight LTL',
    handlingNotes: 'Gate code shared in ASN. Require call 1h prior.',
    lastDelivery: 'Oct 11 • Rush delivery',
    nextDelivery: 'Out for delivery • Order #1412',
  },
};

function renderAddress(location: CompanyLocation) {
  const { address } = location;
  const components = [
    address.company,
    address.line1,
    address.line2,
    [address.city, address.province, address.postalCode].filter(Boolean).join(', '),
    address.country,
  ].filter(Boolean);

  return (
    <BlockStack gap="050">
      {components.map((line) => (
        <Text key={line} tone="subdued" variant="bodySm" as="span">
          {line}
        </Text>
      ))}
    </BlockStack>
  );
}

interface LocationFinanceSummary {
  outstandingBalance: number;
  overdueCount: number;
  nextDue?: string;
}

interface LocationOrderSummary {
  openOrders: number;
  awaitingPayment: number;
  inTransit: number;
}

export function LocationsPage() {
  const { company, locations, activeLocation, activeLocationId } = useCustomerPortalContext();

  const visibleLocations = useMemo(() => {
    if (activeLocationId === ALL_LOCATIONS_ID) return locations;
    return activeLocation ? [activeLocation] : [];
  }, [activeLocation, activeLocationId, locations]);

  if (!company) {
    return (
      <Page title="Locations" subtitle="Shipping destinations and receiving instructions">
        <Card>
          <Text as="p" tone="subdued">
            Location information is unavailable for this demo profile.
          </Text>
        </Card>
      </Page>
    );
  }

  const contactLocationLookup = useMemo(() => {
    const map = new Map<string, string | undefined>();
    company.contacts.forEach((contact) => {
      map.set(contact.id, contact.locationIds[0]);
    });
    return map;
  }, [company.contacts]);

  const quotesForCompany = useMemo(() => {
    return QUOTES.filter((quote) => quote.companyId === company.id);
  }, [company.id]);

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
    return defaultShipping?.id ?? defaultBilling?.id ?? locations[0].id;
  }, [locations]);

  const financeSummaries = useMemo(() => {
    const map = new Map<string, LocationFinanceSummary>();
    INVOICES.filter((invoice) => invoice.companyId === company.id).forEach((invoice) => {
      const locationId = invoice.quoteId ? quoteLocationLookup.get(invoice.quoteId) ?? fallbackLocationId : fallbackLocationId;
      if (!locationId) return;
      const summary = map.get(locationId) ?? { outstandingBalance: 0, overdueCount: 0 };
      const isOutstanding =
        ['due', 'overdue', 'partial'].includes(invoice.status) ||
        (invoice.status === 'draft' && invoice.balanceDue.amount > 0);
      if (isOutstanding) {
        summary.outstandingBalance += invoice.balanceDue.amount;
        if (invoice.status === 'overdue') summary.overdueCount += 1;
        if (!summary.nextDue || new Date(invoice.dueAt).getTime() < new Date(summary.nextDue).getTime()) {
          summary.nextDue = invoice.dueAt;
        }
      }
      map.set(locationId, summary);
    });
    return map;
  }, [company.id, fallbackLocationId, quoteLocationLookup]);

  const orderSummaries = useMemo(() => {
    const map = new Map<string, LocationOrderSummary>();
    ORDER_CARDS.forEach((order) => {
      const summary =
        map.get(order.locationId) ?? { openOrders: 0, awaitingPayment: 0, inTransit: 0 };
      if (order.statusLabel !== 'Delivered') summary.openOrders += 1;
      if (order.fulfillmentLabel.toLowerCase().includes('payment')) summary.awaitingPayment += 1;
      if (order.statusLabel.toLowerCase().includes('delivery')) summary.inTransit += 1;
      map.set(order.locationId, summary);
    });
    return map;
  }, []);

  const locationCount = locations.length;
  const showingDescription =
    activeLocationId === ALL_LOCATIONS_ID
      ? `Showing all ${locationCount} shipping locations`
      : `Filtered to ${activeLocation?.name ?? 'selected location'}`;

  const totalOutstandingAcrossVisible = visibleLocations.reduce((sum, location) => {
    const summary = financeSummaries.get(location.id);
    return sum + (summary?.outstandingBalance ?? 0);
  }, 0);

  return (
    <Page
      title="Locations"
      subtitle="Shipping destinations and receiving instructions"
      primaryAction={{ content: 'Add shipping location', disabled: true }}
      secondaryActions={[{ content: 'Download receiving guide', icon: NoteIcon, disabled: true }]}
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="200">
            <InlineStack gap="200" blockAlign="center" wrap>
              <Badge tone="info">{showingDescription}</Badge>
              <Text tone="subdued" variant="bodySm">
                {visibleLocations.length} active location{visibleLocations.length === 1 ? '' : 's'} •{' '}
                {formatCurrency(totalOutstandingAcrossVisible)} outstanding balance
              </Text>
            </InlineStack>
            <Text variant="bodyMd">
              Locations manage receiving rules and contacts for each shipping destination. Use the location filter in
              the header to focus on a site’s orders, invoices, and approvals, then return here to adjust the physical
              receiving details.
            </Text>
            <InlineStack gap="150" wrap>
              <Button variant="tertiary" url="/cx/orders">
                View active orders
              </Button>
              <Button variant="tertiary" url="/cx/invoices">
                Review open invoices
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        <Grid>
          {visibleLocations.map((location) => {
            const preferences = LOCATION_PREFERENCES[location.id];
            const finance = financeSummaries.get(location.id);
            const orders = orderSummaries.get(location.id);
            const contactsForLocation = company.contacts.filter((contact) =>
              contact.locationIds.includes(location.id),
            );
            const isDefaultBilling = Boolean(location.isDefaultBilling);
            const isDefaultShipping = Boolean(location.isDefaultShipping);

            return (
              <Grid.Cell key={location.id} columnSpan={{ xs: 6, md: 6, lg: 4 }}>
                <Card>
                  <BlockStack gap="200">
                    <BlockStack gap="150">
                      <InlineStack align="space-between" blockAlign="center" wrap>
                        <InlineStack gap="150" blockAlign="center">
                          <Icon source={StoreIcon} tone="subdued" />
                          <BlockStack gap="050">
                            <Text variant="bodyMd" fontWeight="medium">
                              {location.name}
                            </Text>
                            <InlineStack gap="100" blockAlign="center">
                              {location.code ? <Badge tone="subdued">{location.code}</Badge> : null}
                              {isDefaultShipping ? <Badge tone="success">Default shipping</Badge> : null}
                              {isDefaultBilling ? <Badge tone="attention">Default billing</Badge> : null}
                            </InlineStack>
                          </BlockStack>
                        </InlineStack>
                        <BlockStack align="end" gap="050">
                          <Text variant="headingMd">
                            {formatCurrency(finance?.outstandingBalance ?? 0)}
                          </Text>
                          <InlineStack gap="100" blockAlign="center">
                            <Badge tone={finance?.overdueCount ? 'critical' : 'success'}>
                              {finance?.overdueCount ? `${finance.overdueCount} overdue` : 'Up to date'}
                            </Badge>
                            {finance?.nextDue ? (
                              <Text tone="subdued" variant="bodySm">
                                Next due {formatDate(finance.nextDue)}
                              </Text>
                            ) : null}
                          </InlineStack>
                        </BlockStack>
                      </InlineStack>
                      {renderAddress(location)}
                    </BlockStack>

                    <Divider />

                    <BlockStack gap="150">
                      <InlineStack className="InlineSectionHeading" gap="150" blockAlign="center" wrap={false}>
                        <Icon source={DeliveryIcon} tone="subdued" />
                        <Text variant="headingSm">Receiving operations</Text>
                      </InlineStack>
                      <div className="KeyValueList">
                        <div className="KeyValueList__Item">
                          <Text tone="subdued" variant="bodySm">
                            Receiving hours
                          </Text>
                          <Text variant="bodyMd">
                            {preferences?.receivingHours ?? 'Coordinate with warehouse manager'}
                          </Text>
                        </div>
                        <div className="KeyValueList__Item">
                          <Text tone="subdued" variant="bodySm">
                            Dock & handling
                          </Text>
                          <Text variant="bodyMd">
                            {preferences?.dockNotes ?? 'No special instructions recorded'}
                          </Text>
                        </div>
                        <div className="KeyValueList__Item">
                          <Text tone="subdued" variant="bodySm">
                            Preferred carrier
                          </Text>
                          <Text variant="bodyMd">
                            {preferences?.preferredCarrier ?? 'Merchant to coordinate'}
                          </Text>
                        </div>
                        {preferences?.handlingNotes ? (
                          <div className="KeyValueList__Item">
                            <Text tone="subdued" variant="bodySm">
                              Handling notes
                            </Text>
                            <Text variant="bodyMd">{preferences.handlingNotes}</Text>
                          </div>
                        ) : null}
                        {preferences?.lastDelivery ? (
                          <div className="KeyValueList__Item">
                            <Text tone="subdued" variant="bodySm">
                              Last delivery
                            </Text>
                            <Text variant="bodyMd">{preferences.lastDelivery}</Text>
                          </div>
                        ) : null}
                        {preferences?.nextDelivery ? (
                          <div className="KeyValueList__Item">
                            <Text tone="subdued" variant="bodySm">
                              Next delivery
                            </Text>
                            <Text variant="bodyMd">{preferences.nextDelivery}</Text>
                          </div>
                        ) : null}
                      </div>
                    </BlockStack>

                    <Divider />

                    <BlockStack gap="150">
                      <InlineStack className="InlineSectionHeading" gap="150" blockAlign="center" wrap={false}>
                        <Icon source={NoteIcon} tone="subdued" />
                        <Text variant="headingSm">Status</Text>
                      </InlineStack>
                      <InlineStack gap="200" wrap>
                        <Badge tone={(orders?.openOrders ?? 0) ? 'attention' : 'success'}>
                          Open orders · {orders?.openOrders ?? 0}
                        </Badge>
                        <Badge tone={(orders?.awaitingPayment ?? 0) ? 'critical' : 'success'}>
                          Awaiting payment · {orders?.awaitingPayment ?? 0}
                        </Badge>
                        <Badge tone={(orders?.inTransit ?? 0) ? 'info' : 'subdued'}>
                          In transit · {orders?.inTransit ?? 0}
                        </Badge>
                      </InlineStack>
                    </BlockStack>

                    {contactsForLocation.length ? (
                      <>
                        <Divider />
                        <BlockStack gap="150">
                          <InlineStack className="InlineSectionHeading" gap="150" blockAlign="center" wrap={false}>
                            <Icon source={PersonIcon} tone="subdued" />
                            <Text variant="headingSm">Local contacts</Text>
                          </InlineStack>
                          <BlockStack gap="050">
                            {contactsForLocation.map((contact) => (
                              <Text key={contact.id} tone="subdued" variant="bodySm">
                                {contact.firstName} {contact.lastName} • {contact.role} • {contact.email}
                              </Text>
                            ))}
                          </BlockStack>
                        </BlockStack>
                      </>
                    ) : null}

                    <Divider />

                    <InlineStack gap="150" wrap>
                      <Button variant="tertiary" url="/cx/orders">
                        View orders
                      </Button>
                      <Button variant="tertiary" url="/cx/invoices">
                        View invoices
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </Card>
              </Grid.Cell>
            );
          })}
        </Grid>

        <Card>
          <BlockStack gap="200">
            <InlineStack className="InlineSectionHeading" gap="200" blockAlign="center" wrap={false}>
              <Icon source={NoteIcon} tone="subdued" />
              <Text variant="headingSm">Routing preferences</Text>
            </InlineStack>
            <List>
              <List.Item>Auto-email delivery notifications to logistics@abstractindustrial.com.</List.Item>
              <List.Item>Consolidate shipments when possible for West Distribution Hub.</List.Item>
              <List.Item>Allow location managers to request rush delivery from the storefront.</List.Item>
            </List>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
