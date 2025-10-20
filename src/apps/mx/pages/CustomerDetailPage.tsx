import { useMemo } from 'react';
import { Page, Text, Card, BlockStack, InlineStack, Badge } from '@shopify/polaris';
import { useParams, useNavigate } from 'react-router-dom';

import { CUSTOMERS, type CustomerRecord } from '../../../data';
import { formatCurrency, formatOrders } from '../../../utils/formatters';

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const basePath = '/mx';

  const customer = useMemo<CustomerRecord | undefined>(
    () => CUSTOMERS.find((item) => item.id === customerId),
    [customerId],
  );

  if (!customer) {
    return (
      <Page
        title="Customer not found"
        backAction={{ content: 'Customers', onAction: () => navigate(`${basePath}/customers`) }}
      >
        <Card>
          <Text as="p" tone="subdued">
            The requested customer could not be located. Return to the customer index to try again.
          </Text>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title={customer.name}
      subtitle={customer.email}
      backAction={{ content: 'Customers', onAction: () => navigate(`${basePath}/customers`) }}
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="200">
            <InlineStack gap="400" wrap>
              <BlockStack gap="050">
                <Text variant="headingMd" as="span">
                  {formatCurrency(customer.amountSpent)}
                </Text>
                <Text as="span" tone="subdued" variant="bodySm">
                  Total spent
                </Text>
              </BlockStack>
              <BlockStack gap="050">
                <Text variant="headingMd" as="span">
                  {formatOrders(customer.ordersCount)}
                </Text>
                <Text as="span" tone="subdued" variant="bodySm">
                  Orders
                </Text>
              </BlockStack>
              <BlockStack gap="050">
                <Text variant="headingMd" as="span">
                  {customer.location}
                </Text>
                <Text as="span" tone="subdued" variant="bodySm">
                  Location
                </Text>
              </BlockStack>
            </InlineStack>
            <InlineStack gap="200" align="start">
              <Text as="span" variant="bodyMd">
                Email subscription:
              </Text>
              <Badge tone={customer.subscriptionStatus === 'subscribed' ? 'success' : 'subdued'}>
                {customer.subscriptionStatus === 'subscribed' ? 'Subscribed' : 'Not subscribed'}
              </Badge>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <Text as="p" tone="subdued">
            Detailed timelines and order history will appear here. This placeholder establishes navigation from
            the index table.
          </Text>
        </Card>
      </BlockStack>
    </Page>
  );
}
