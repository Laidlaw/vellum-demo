import {
  Badge,
  BlockStack,
  Button,
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
  ClipboardChecklistIcon,
  DeliveryIcon,
  ExportIcon,
  NoteIcon,
  PersonIcon,
  StoreIcon,
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
import { formatCurrency, formatDate, formatDateTime, formatTimeUntil } from '../../../utils/formatters';

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

function getInvoiceTone(status: string): 'success' | 'warning' | 'critical' | 'info' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'partial':
      return 'warning';
    case 'overdue':
      return 'critical';
    default:
      return 'info';
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
  const resolvedApproverName = approverName === '—' ? 'Pending assignment' : approverName;
  const requesterContact = quote.requesterId
    ? getCompanyContact(quote.companyId, quote.requesterId)
    : undefined;
  const approverContact = quote.approverId
    ? getCompanyContact(quote.companyId, quote.approverId)
    : undefined;
  const requesterLocation = requesterContact?.locationIds?.[0]
    ? company?.locations.find((location) => location.id === requesterContact.locationIds[0])
    : undefined;
  const approverLocation = approverContact?.locationIds?.[0]
    ? company?.locations.find((location) => location.id === approverContact.locationIds[0])
    : undefined;

  const formatHistoryType = (type: string) =>
    type
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');

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
  const creditLimitAmount = company?.credit?.creditLimit?.amount;
  const creditUsedAmount = company?.credit?.creditUsed?.amount;
  const creditAvailableAmount =
    creditLimitAmount !== undefined && creditUsedAmount !== undefined
      ? Math.max(0, creditLimitAmount - creditUsedAmount)
      : undefined;
  const totalsBreakdown = [
    { label: 'Subtotal', value: formatCurrency(subtotal) },
    { label: 'Tax', value: formatCurrency(tax) },
    { label: 'Shipping', value: formatCurrency(shipping) },
  ];

  return (
    <Page
      title={quote.name}
      subtitle={quote.quoteNumber}
      backAction={{ content: 'Quotes', onAction: () => navigate('/cx/quotes') }}
      primaryAction={{
        content: 'Start approval',
        tone: 'success',
        onAction: () => navigate(`/cx/quotes/${quote.id}/approve`),
      }}
      secondaryActions={[
        { content: 'Request change' },
        { content: 'Duplicate', disabled: true },
        { content: 'Export', icon: ExportIcon },
      ]}
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="start" wrap>
              <BlockStack gap="050">
                <InlineStack gap="100" blockAlign="center" wrap>
                  <Badge tone={statusTone}>{quote.status.replace('_', ' ')}</Badge>
                  <Text tone="subdued" variant="bodySm">
                    Quote {quote.quoteNumber}
                  </Text>
                </InlineStack>
                <Text variant="headingXl">{formatCurrency(grandTotal)}</Text>
                <Text tone="subdued" variant="bodySm">
                  Total quote value
                </Text>
              </BlockStack>
              <BlockStack gap="100" align="end">
                <InlineStack gap="100" blockAlign="center">
                  <Icon source={CalendarIcon} tone="subdued" />
                  <Text variant="bodyMd">{formatDate(quote.expiresAt)}</Text>
                </InlineStack>
                <Text tone="subdued" variant="bodySm">
                  {formatTimeUntil(quote.expiresAt)} until expiration
                </Text>
                {relatedInvoice ? (
                  <Button variant="secondary" onClick={() => navigate(`/cx/invoices/${relatedInvoice.id}`)}>
                    View linked invoice
                  </Button>
                ) : null}
              </BlockStack>
            </InlineStack>
            <Divider />
            <div className="QuoteDetailSummaryGrid">
              <div className="QuoteDetailSummaryCell">
                <Text tone="subdued" variant="bodySm">
                  Request owner
                </Text>
                <BlockStack gap="050">
                  <Text variant="bodyMd" fontWeight="medium">
                    {requesterName}
                  </Text>
                  {requesterContact?.email ? (
                    <Text tone="subdued" variant="bodySm">
                      {requesterContact.email}
                    </Text>
                  ) : null}
                  {requesterLocation ? (
                    <Badge tone="subdued">
                      {requesterLocation.code ?? requesterLocation.name}
                    </Badge>
                  ) : null}
                </BlockStack>
              </div>
              <div className="QuoteDetailSummaryCell">
                <Text tone="subdued" variant="bodySm">
                  Approver
                </Text>
                <BlockStack gap="050">
                  <Text variant="bodyMd" fontWeight="medium">
                    {resolvedApproverName}
                  </Text>
                  {approverContact?.email ? (
                    <Text tone="subdued" variant="bodySm">
                      {approverContact.email}
                    </Text>
                  ) : null}
                  {approverLocation ? (
                    <Badge tone="subdued">
                      {approverLocation.code ?? approverLocation.name}
                    </Badge>
                  ) : null}
                </BlockStack>
              </div>
              <div className="QuoteDetailSummaryCell">
                <Text tone="subdued" variant="bodySm">
                  Delivery window
                </Text>
                <BlockStack gap="050">
                  <InlineStack gap="100" blockAlign="center">
                    <Icon source={DeliveryIcon} tone="subdued" />
                    <Text variant="bodyMd">
                      {quote.approxDeliveryDate ? formatDate(quote.approxDeliveryDate) : 'TBD'}
                    </Text>
                  </InlineStack>
                  <Text tone="subdued" variant="bodySm">
                    Shipping location {requesterLocation?.name ?? '—'}
                  </Text>
                </BlockStack>
              </div>
              <div className="QuoteDetailSummaryCell">
                <Text tone="subdued" variant="bodySm">
                  Purchase order
                </Text>
                <Text variant="bodyMd">{quote.purchaseOrderNumber ?? '—'}</Text>
              </div>
              <div className="QuoteDetailSummaryCell">
                <Text tone="subdued" variant="bodySm">
                  Integration channel
                </Text>
                <Text variant="bodyMd">{quote.integrationChannel ? quote.integrationChannel : 'Direct'}</Text>
              </div>
              <div className="QuoteDetailSummaryCell">
                <Text tone="subdued" variant="bodySm">
                  Order reference
                </Text>
                <Text variant="bodyMd">{quote.orderReference ?? 'Not yet converted'}</Text>
              </div>
            </div>
          </BlockStack>
        </Card>

        <Grid gap="300">
          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card className="QuoteDetailCard">
              <BlockStack gap="200">
                <Text variant="headingSm">Company &amp; contacts</Text>
                <BlockStack gap="100">
                  <BlockStack gap="050">
                    <Text variant="bodyMd" fontWeight="medium">
                      {company?.name ?? 'Company'}
                    </Text>
                    <Text tone="subdued" variant="bodySm">
                      {company?.legalName ?? '—'}
                    </Text>
                  </BlockStack>
                  <Divider />
                  <BlockStack gap="050">
                    <Text tone="subdued" variant="bodySm">
                      Requester
                    </Text>
                    <Text variant="bodyMd">{requesterName}</Text>
                    {requesterContact?.email ? (
                      <Text tone="subdued" variant="bodySm">
                        {requesterContact.email}
                      </Text>
                    ) : null}
                  </BlockStack>
                  <BlockStack gap="050">
                    <Text tone="subdued" variant="bodySm">
                      Approver
                    </Text>
                    <Text variant="bodyMd">{resolvedApproverName}</Text>
                    {approverContact?.email ? (
                      <Text tone="subdued" variant="bodySm">
                        {approverContact.email}
                      </Text>
                    ) : null}
                  </BlockStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card className="QuoteDetailCard">
              <BlockStack gap="200">
                <Text variant="headingSm">Commercial terms</Text>
                <BlockStack gap="100">
                  <BlockStack gap="050">
                    <Text tone="subdued" variant="bodySm">
                      Sales representative
                    </Text>
                    <Text variant="bodyMd">{quote.salesRep ?? 'Unassigned'}</Text>
                  </BlockStack>
                  <BlockStack gap="050">
                    <Text tone="subdued" variant="bodySm">
                      Payment terms
                    </Text>
                    <Text variant="bodyMd">{company?.paymentTerms.description ?? 'Net terms'}</Text>
                  </BlockStack>
                  <BlockStack gap="050">
                    <Text tone="subdued" variant="bodySm">
                      Credit available
                    </Text>
                    <Text variant="bodyMd">
                      {creditAvailableAmount !== undefined ? formatCurrency(creditAvailableAmount) : '—'}
                    </Text>
                  </BlockStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card className="QuoteDetailCard">
              <BlockStack gap="200">
                <Text variant="headingSm">Approval timeline</Text>
                <BlockStack gap="200">
                  {quote.history.map((event) => (
                    <BlockStack key={event.id} gap="075" className="QuoteTimelineEvent">
                      <InlineStack gap="100" blockAlign="center">
                        <Badge tone="subdued" size="small">
                          {formatHistoryType(event.type)}
                        </Badge>
                        <Text tone="subdued" variant="bodySm">
                          {formatDateTime(event.occurredAt)}
                        </Text>
                      </InlineStack>
                      <Text variant="bodyMd" fontWeight="medium">
                        {event.actor}
                      </Text>
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
                  {quote.history.length === 0 ? (
                    <Text tone="subdued" variant="bodySm">
                      No activity recorded yet.
                    </Text>
                  ) : null}
                </BlockStack>
              </BlockStack>
            </Card>
          </Grid.Cell>
        </Grid>

        <Grid gap="300">
          <Grid.Cell columnSpan={{ xs: 6, md: 8 }}>
            <Card className="QuoteDetailCard">
              <BlockStack gap="200">
                <Text variant="headingSm">Line items</Text>
                <DataTable
                  columnContentTypes={['text', 'text', 'numeric', 'numeric', 'text', 'numeric']}
                  headings={['Product', 'SKU', 'Qty', 'Unit price', 'Discount', 'Line total']}
                  rows={lineItemRows}
                />
              </BlockStack>
            </Card>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card className="QuoteDetailCard">
              <BlockStack gap="200">
                <Text variant="headingSm">Totals</Text>
                <BlockStack gap="100">
                  {totalsBreakdown.map((entry) => (
                    <InlineStack key={entry.label} align="space-between" blockAlign="center">
                      <Text tone="subdued" variant="bodySm">
                        {entry.label}
                      </Text>
                      <Text variant="bodyMd">{entry.value}</Text>
                    </InlineStack>
                  ))}
                  <Divider />
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingSm">Total due</Text>
                    <Text variant="headingLg">{formatCurrency(grandTotal)}</Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Grid.Cell>
        </Grid>

        {(relatedInvoice || quote.notes) && (
          <Grid gap="300">
            {relatedInvoice ? (
              <Grid.Cell columnSpan={{ xs: 6, md: quote.notes ? 6 : 12 }}>
                <Card className="QuoteDetailCard">
                  <BlockStack gap="200">
                    <Text variant="headingSm">Linked invoice</Text>
                    <BlockStack gap="050">
                      <InlineStack gap="100" blockAlign="center">
                        <Badge tone={getInvoiceTone(relatedInvoice.status)}>
                          {relatedInvoice.status}
                        </Badge>
                        <Text variant="bodyMd">{relatedInvoice.invoiceNumber}</Text>
                      </InlineStack>
                      <Text tone="subdued" variant="bodySm">
                        Due {formatDate(relatedInvoice.dueAt)} · {formatTimeUntil(relatedInvoice.dueAt)}
                      </Text>
                      <InlineStack align="space-between" blockAlign="center">
                        <Text variant="bodyMd" fontWeight="medium">
                          {formatCurrency(relatedInvoice.balanceDue.amount)} balance due
                        </Text>
                        <Button
                          variant={relatedInvoice.status === 'paid' ? 'plain' : 'primary'}
                          onClick={() =>
                            navigate(
                              relatedInvoice.status === 'paid'
                                ? `/cx/invoices/${relatedInvoice.id}`
                                : `/cx/invoices/${relatedInvoice.id}/pay`,
                            )
                          }
                        >
                          {relatedInvoice.status === 'paid' ? 'View invoice' : 'Collect payment'}
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </BlockStack>
                </Card>
              </Grid.Cell>
            ) : null}
            {quote.notes ? (
              <Grid.Cell columnSpan={{ xs: 6, md: relatedInvoice ? 6 : 12 }}>
                <Card className="QuoteDetailCard">
                  <BlockStack gap="200">
                    <Text variant="headingSm">Buyer notes</Text>
                    <Text variant="bodyMd" tone="subdued">
                      {quote.notes}
                    </Text>
                  </BlockStack>
                </Card>
              </Grid.Cell>
            ) : null}
          </Grid>
        )}
      </BlockStack>
    </Page>
  );
}

function getPrimaryLocationForQuote(quote: Quote) {
  const company = getCompanyById(quote.companyId);
  if (!company) return undefined;

  const requesterLocationId = quote.requesterId
    ? getCompanyContact(quote.companyId, quote.requesterId)?.locationIds?.[0]
    : undefined;

  if (requesterLocationId) {
    const match = company.locations.find((location) => location.id === requesterLocationId);
    if (match) return match;
  }

  const defaultShipping = company.locations.find((location) => location.isDefaultShipping);
  if (defaultShipping) return defaultShipping;

  return company.locations[0];
}
