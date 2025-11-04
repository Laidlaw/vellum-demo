import { useMemo, useState } from 'react';
import {
  Badge,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  Icon,
  InlineStack,
  Text,
} from '@shopify/polaris';
import { FilterIcon, DataTableIcon, ListBulletedIcon } from '@shopify/polaris-icons';

import { ALL_LOCATIONS_ID, useCustomerPortalContext } from '../CustomerApp';
import { formatCurrency } from '../../../utils/formatters';
import { ORDER_CARDS, type OrderBucket } from '../data/orders';

const ORDER_TABS: Array<{ id: OrderBucket; label: string }> = [
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'pending', label: 'Pending' },
];

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderBucket>('confirmed');
  const { activeLocationId, activeLocation, locations } = useCustomerPortalContext();

  const locationLookup = useMemo(() => {
    return new Map(locations.map((location) => [location.id, location]));
  }, [locations]);

  const filteredOrders = useMemo(() => {
    return ORDER_CARDS.filter(
      (order) =>
        order.bucket === statusFilter &&
        (activeLocationId === ALL_LOCATIONS_ID || order.locationId === activeLocationId),
    );
  }, [activeLocationId, statusFilter]);

  const tabCounts = useMemo(() => {
    return ORDER_TABS.map((tab) => ({
      id: tab.id,
      label: tab.label,
      count: ORDER_CARDS.filter(
        (order) =>
          order.bucket === tab.id &&
          (activeLocationId === ALL_LOCATIONS_ID || order.locationId === activeLocationId),
      ).length,
    }));
  }, [activeLocationId]);

  const orderSummary = useMemo(() => {
    const scopedOrders = ORDER_CARDS.filter(
      (order) => activeLocationId === ALL_LOCATIONS_ID || order.locationId === activeLocationId,
    );

    const awaitingPayment = scopedOrders.filter((order) =>
      order.fulfillmentLabel.toLowerCase().includes('payment'),
    );
    const awaitingApproval = scopedOrders.filter((order) =>
      order.statusLabel.toLowerCase().includes('approval'),
    );
    const inTransit = scopedOrders.filter((order) =>
      order.statusLabel.toLowerCase().includes('delivery') ||
      order.fulfillmentLabel.toLowerCase().includes('carrier'),
    );
    const totalValue = scopedOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      scopedOrders,
      awaitingPaymentCount: awaitingPayment.length,
      awaitingApprovalCount: awaitingApproval.length,
      inTransitCount: inTransit.length,
      totalValue,
    };
  }, [activeLocationId]);

  return (
    <div className="CustomerOrders">
      <BlockStack gap="400">
        <BlockStack gap="050">
          <Text as="p" tone="subdued" variant="bodySm">
            {activeLocation ? `Orders for ${activeLocation.name}` : 'All locations'}
          </Text>
          <Text as="h1" variant="headingXl">
            Orders
          </Text>
        </BlockStack>

        <Card>
          <BlockStack gap="300">
            <InlineStack gap="200" blockAlign="center" wrap>
              <Icon source={FilterIcon} tone="subdued" />
              <Text tone="subdued" variant="bodySm">
                {orderSummary.scopedOrders.length} orders in view · {orderSummary.awaitingPaymentCount} awaiting payment · {orderSummary.awaitingApprovalCount} pending approval
              </Text>
            </InlineStack>
            <div className="KeyValueList">
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{formatCurrency(orderSummary.totalValue)}</Text>
                <Text tone="subdued" variant="bodySm">
                  Total value across filtered orders
                </Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{orderSummary.awaitingPaymentCount}</Text>
                <Text tone="subdued" variant="bodySm">
                  Awaiting payment
                </Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{orderSummary.awaitingApprovalCount}</Text>
                <Text tone="subdued" variant="bodySm">
                  Approvals needed
                </Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{orderSummary.inTransitCount}</Text>
                <Text tone="subdued" variant="bodySm">
                  Out for delivery
                </Text>
              </div>
            </div>
          </BlockStack>
        </Card>

        <Card roundedAbove="sm">
          <Box padding="300">
            <InlineStack align="space-between" blockAlign="center" wrap gap="300">
              <div className="CustomerOrders__Controls">
                <ButtonGroup segmented>
                  {tabCounts.map((tab) => (
                    <Button
                      key={tab.id}
                      pressed={statusFilter === tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                    >
                      <InlineStack gap="100" blockAlign="center">
                        <Text as="span">{tab.label}</Text>
                        <Badge tone="subdued">{tab.count}</Badge>
                      </InlineStack>
                    </Button>
                  ))}
                </ButtonGroup>
              </div>
              <InlineStack gap="100" wrap>
                <Button variant="tertiary" icon={FilterIcon}>
                  Filters
                </Button>
                <Button variant="tertiary" icon={DataTableIcon} pressed>
                  Grid
                </Button>
                <Button variant="tertiary" icon={ListBulletedIcon}>
                  List
                </Button>
              </InlineStack>
            </InlineStack>
          </Box>
        </Card>

        {filteredOrders.length ? (
          <div className="CustomerOrders__Grid">
            {filteredOrders.map((order) => (
              <Card key={order.id} roundedAbove="sm">
                <Box padding="300">
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="start">
                      <BlockStack gap="050">
                        <InlineStack gap="100" blockAlign="center">
                          <Icon source={order.statusIcon} tone={order.statusTone} />
                          <Text as="span" variant="bodyMd" fontWeight="medium">
                            {order.statusLabel}
                          </Text>
                        </InlineStack>
                        <Text as="span" tone="subdued" variant="bodySm">
                          {order.statusMeta}
                        </Text>
                      </BlockStack>
                      <InlineStack gap="050" blockAlign="center">
                        <Icon source={order.fulfillmentIcon} tone="subdued" />
                        <Text as="span" tone="subdued" variant="bodySm">
                          {order.fulfillmentLabel}
                        </Text>
                      </InlineStack>
                    </InlineStack>

                    <div className="CustomerOrderCard__Gallery">
                      {order.images.map((image, index) =>
                        image.type === 'image' && image.src ? (
                          <img key={`${order.id}-img-${index}`} src={image.src} alt={image.alt ?? ''} />
                        ) : (
                          <div key={`${order.id}-more-${index}`} className="CustomerOrderCard__GalleryMore">
                            <Text as="span" variant="headingSm">
                              {image.label}
                            </Text>
                          </div>
                        ),
                      )}
                    </div>

                    <BlockStack gap="050">
                      <Text as="span" tone="subdued" variant="bodySm">
                        {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}
                      </Text>
                      <InlineStack gap="100" blockAlign="center">
                        <Text as="span" tone="subdued" variant="bodySm">
                          Order {order.orderNumber}
                        </Text>
                        {activeLocationId === ALL_LOCATIONS_ID ? (
                          <Badge tone="subdued" size="small">
                            {locationLookup.get(order.locationId)?.code ??
                              locationLookup.get(order.locationId)?.name ??
                              'Location'}
                          </Badge>
                        ) : null}
                      </InlineStack>
                    </BlockStack>

                    <Text as="span" variant="headingLg">
                      {formatCurrency(order.total)}
                    </Text>

                    <InlineStack gap="100" wrap>
                      <Button
                        variant={order.primaryAction.variant ?? 'primary'}
                        tone={order.primaryAction.tone}
                      >
                        {order.primaryAction.label}
                      </Button>
                      <Button disclosure="down">{order.secondaryActionLabel}</Button>
                    </InlineStack>
                  </BlockStack>
                </Box>
              </Card>
            ))}
          </div>
        ) : (
          <Card roundedAbove="sm">
            <Box padding="400">
              <BlockStack gap="200" align="center">
                <Text as="h2" variant="headingMd">
                  No orders in this view
                </Text>
                <Text as="p" tone="subdued">
                  Adjust the filters or switch locations to find the orders you’re looking for.
                </Text>
                <InlineStack gap="150" wrap align="center">
                  <Button onClick={() => setStatusFilter('confirmed')}>Show confirmed orders</Button>
                  <Button variant="secondary">Create requisition</Button>
                </InlineStack>
              </BlockStack>
            </Box>
          </Card>
        )}

        <footer className="CustomerOrdersFooter">
          <InlineStack gap="200" wrap>
            <a href="#refund">Refund Policy</a>
            <a href="#shipping">Shipping Policy</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </InlineStack>
        </footer>
      </BlockStack>
    </div>
  );
}
