import {
  Badge,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  DataTable,
  Divider,
  Grid,
  Icon,
  InlineStack,
  Page,
  Text,
} from '@shopify/polaris';
import {
  CalendarIcon,
  NoteIcon,
  PersonIcon,
  StoreIcon,
  DeliveryIcon,
  ExportIcon,
} from '@shopify/polaris-icons';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  INVOICES,
  getCompanyById,
  getCompanyContact,
  getQuoteById,
  type Quote,
} from '../../../data';
import { formatCurrency, formatDate, formatTimeUntil } from '../../../utils/formatters';

function getStatusTone(status: Quote['status']): 'success' | 'attention' | 'critical' | 'subdued' {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending_approval':
      return 'attention';
    case 'rejected':
    case 'expired':
      return 'critical';
    default:
      return 'subdued';
  }
}

function resolveContactName(companyId: string, contactId?: string) {
  if (!contactId) return '—';
  const contact = getCompanyContact(companyId, contactId);
  if (!contact) return '—';
  return `${contact.firstName} ${contact.lastName}`;
}

export function QuoteDetailPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();

  const quote = useMemo(() => (quoteId ? getQuoteById(quoteId) : undefined), [quoteId]);

  const company = quote ? getCompanyById(quote.companyId) : undefined;
  const relatedInvoice = useMemo(() => {
    if (!quote) return undefined;
    return INVOICES.find((invoice) => invoice.quoteId === quote.id);
  }, [quote]);

  if (!quote) {
    return (
      <Page
        title="Quote not found"
        backAction={{ content: 'Quotes', onAction: () => navigate('/cx/quotes') }}
      >
        <Card>
          <Text as="p" tone="subdued">
            The requested quote could not be found. Return to the quotes index and try another selection.
          </Text>
        </Card>
      </Page>
    );
  }

  const statusTone = getStatusTone(quote.status);
  const requesterName = resolveContactName(quote.companyId, quote.requesterId);
  const approverName = resolveContactName(quote.companyId, quote.approverId);

  const lineItemRows = quote.lineItems.map((item) => {
    const discount = item.discountPercent ? `${item.discountPercent}%` : '—';

    return [
      item.title,
      item.sku,
      item.quantity.toString(),
      formatCurrency(item.unitPrice.amount),
      discount,
      formatCurrency(item.total.amount),
    ];
  });

  const subtotal = quote.subtotal.amount;
  const tax = quote.taxTotal.amount;
  const shipping = quote.shippingTotal?.amount ?? 0;
  const grandTotal = quote.total.amount;

  return (
    <Page
      title={quote.name}
      subtitle={quote.quoteNumber}
      backAction={{ content: 'Quotes', onAction: () => navigate('/cx/quotes') }}
      primaryAction={{
        content: 'Approve quote',
        tone: 'success',
        onAction: () => {
          if (relatedInvoice) {
            navigate(`/cx/invoices/${relatedInvoice.id}/pay`);
          } else {
            navigate('/cx/invoices');
          }
        },
      }}
      secondaryActions={[
        { content: 'Request change' },
        { content: 'Duplicate', disabled: true },
        { content: 'Export', icon: ExportIcon },
      ]}
    >
      <BlockStack gap="400">
        <Card>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3 }}>
              <BlockStack gap="100">
                <Text tone="subdued" as="span" variant="bodySm">
                  Status
                </Text>
                <Badge tone={statusTone}>{quote.status.replace('_', ' ')}</Badge>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3 }}>
              <BlockStack gap="100">
                <Text tone="subdued" as="span" variant="bodySm">
                  Time until expiration
                </Text>
                <InlineStack gap="100" blockAlign="center">
                  <Icon source={CalendarIcon} tone="subdued" />
                  <Text variant="bodyMd">{formatTimeUntil(quote.expiresAt)}</Text>
                </InlineStack>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3 }}>
              <BlockStack gap="100">
                <Text tone="subdued" as="span" variant="bodySm">
                  Approximate delivery
                </Text>
                <InlineStack gap="100" blockAlign="center">
                  <Icon source={DeliveryIcon} tone="subdued" />
                  <Text variant="bodyMd">
                    {quote.approxDeliveryDate ? formatDate(quote.approxDeliveryDate) : '—'}
                  </Text>
                </InlineStack>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3 }}>
              <BlockStack gap="100">
                <Text tone="subdued" as="span" variant="bodySm">
                  Total amount
                </Text>
                <Text as="span" variant="headingMd">
                  {formatCurrency(grandTotal)}
                </Text>
              </BlockStack>
            </Grid.Cell>
          </Grid>
        </Card>

        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card>
              <BlockStack gap="200">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={StoreIcon} tone="subdued" />
                  <Text variant="headingSm">Company</Text>
                </InlineStack>
                <BlockStack gap="050">
                  <Text variant="bodyMd" fontWeight="medium">
                    {company?.name ?? 'Company'}
                  </Text>
                  <Text tone="subdued" as="span" variant="bodySm">
                    {company?.legalName ?? ''}
                  </Text>
                </BlockStack>
                <Divider />
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={PersonIcon} tone="subdued" />
                    <Text variant="headingSm">People</Text>
                  </InlineStack>
                  <BlockStack gap="050">
                    <Text tone="subdued" as="span" variant="bodySm">
                      Requested by
                    </Text>
                    <Text variant="bodyMd">{requesterName}</Text>
                  </BlockStack>
                  <BlockStack gap="050">
                    <Text tone="subdued" as="span" variant="bodySm">
                      Approver
                    </Text>
                    <Text variant="bodyMd">{approverName}</Text>
                  </BlockStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingSm">Quote details</Text>
                <BlockStack gap="050">
                  <Text tone="subdued" variant="bodySm">
                    Purchase order number
                  </Text>
                  <Text variant="bodyMd">{quote.purchaseOrderNumber ?? '—'}</Text>
                </BlockStack>
                <BlockStack gap="050">
                  <Text tone="subdued" variant="bodySm">
                    Sales representative
                  </Text>
                  <Text variant="bodyMd">{quote.salesRep ?? 'Unassigned'}</Text>
                </BlockStack>
                <BlockStack gap="050">
                  <Text tone="subdued" variant="bodySm">
                    Integration channel
                  </Text>
                  <Text variant="bodyMd">{quote.integrationChannel ?? '—'}</Text>
                </BlockStack>
                <BlockStack gap="050">
                  <Text tone="subdued" variant="bodySm">
                    Order reference
                  </Text>
                  <Text variant="bodyMd">{quote.orderReference ?? '—'}</Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingSm">Timeline</Text>
                {quote.history.map((event) => (
                  <BlockStack key={event.id} gap="050">
                    <InlineStack gap="100" blockAlign="center">
                      <Badge tone="subdued">{event.type}</Badge>
                      <Text tone="subdued" variant="bodySm">
                        {formatDate(event.occurredAt)}
                      </Text>
                    </InlineStack>
                    <Text variant="bodyMd">{event.actor}</Text>
                    {event.note ? (
                      <InlineStack gap="100" blockAlign="center">
                        <Icon source={NoteIcon} tone="subdued" />
                        <Text tone="subdued" variant="bodySm">
                          {event.note}
                        </Text>
                      </InlineStack>
                    ) : null}
                  </BlockStack>
                ))}
              </BlockStack>
            </Card>
          </Grid.Cell>
        </Grid>

        <Card>
          <BlockStack gap="200">
            <Text variant="headingSm">Line items</Text>
            <DataTable
              columnContentTypes={['text', 'text', 'numeric', 'numeric', 'text', 'numeric']}
              headings={['Product', 'SKU', 'Qty', 'Unit price', 'Discount', 'Line total']}
              rows={lineItemRows}
            />
          </BlockStack>
        </Card>

        <Card>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
              <BlockStack gap="050">
                <Text tone="subdued" variant="bodySm">
                  Subtotal
                </Text>
                <Text variant="bodyMd">{formatCurrency(subtotal)}</Text>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
              <BlockStack gap="050">
                <Text tone="subdued" variant="bodySm">
                  Tax
                </Text>
                <Text variant="bodyMd">{formatCurrency(tax)}</Text>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
              <BlockStack gap="050">
                <Text tone="subdued" variant="bodySm">
                  Shipping
                </Text>
                <Text variant="bodyMd">{formatCurrency(shipping)}</Text>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, md: 12 }}>
              <Divider />
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, md: 12 }}>
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingSm">Total</Text>
                <Text variant="headingLg">{formatCurrency(grandTotal)}</Text>
              </InlineStack>
            </Grid.Cell>
          </Grid>
        </Card>

        {quote.notes ? (
          <Card>
            <BlockStack gap="200">
              <Text variant="headingSm">Notes</Text>
              <Text variant="bodyMd" tone="subdued">
                {quote.notes}
              </Text>
            </BlockStack>
          </Card>
        ) : null}
      </BlockStack>
    </Page>
  );
}
