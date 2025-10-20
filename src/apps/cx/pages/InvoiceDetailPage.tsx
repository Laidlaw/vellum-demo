import {
  Badge,
  BlockStack,
  Card,
  DataTable,
  Grid,
  InlineStack,
  Page,
  Text,
  Divider,
  Icon,
} from '@shopify/polaris';
import { CalendarIcon, NoteIcon } from '@shopify/polaris-icons';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getCompanyById,
  getInvoiceById,
  getQuoteById,
  type Invoice,
} from '../../../data';
import { formatCurrency, formatDate, formatTimeUntil } from '../../../utils/formatters';

function getStatusTone(status: Invoice['status']): 'success' | 'warning' | 'critical' | 'info' {
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

export function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  const invoice = useMemo(() => (invoiceId ? getInvoiceById(invoiceId) : undefined), [invoiceId]);

  const company = invoice ? getCompanyById(invoice.companyId) : undefined;
  const relatedQuote = invoice?.quoteId ? getQuoteById(invoice.quoteId) : undefined;

  if (!invoice) {
    return (
      <Page title="Invoice not found" backAction={{ content: 'Invoices', onAction: () => navigate('/cx/invoices') }}>
        <Card>
          <Text as="p" tone="subdued">
            The selected invoice could not be found. Return to the invoices table to try again.
          </Text>
        </Card>
      </Page>
    );
  }

  const statusTone = getStatusTone(invoice.status);

  const lineItemRows = invoice.lineItems.map((item) => [
    item.title,
    item.sku,
    item.quantity,
    formatCurrency(item.unitPrice.amount),
    formatCurrency(item.total.amount),
  ]);

  const paymentRows = invoice.payments.length
    ? invoice.payments.map((payment) => [
        formatDate(payment.processedAt),
        payment.method.toUpperCase(),
        payment.reference ?? '—',
        formatCurrency(payment.amount.amount),
      ])
    : [];

  return (
    <Page
      title={invoice.invoiceNumber}
      subtitle={company?.name ?? ''}
      backAction={{ content: 'Invoices', onAction: () => navigate('/cx/invoices') }}
      primaryAction={{
        content: invoice.status === 'paid' ? 'Paid in full' : 'Complete payment',
        onAction:
          invoice.status === 'paid' ? undefined : () => navigate(`/cx/invoices/${invoice.id}/pay`),
        disabled: invoice.status === 'paid',
      }}
      secondaryActions={[{ content: 'Download PDF', icon: NoteIcon }]}
    >
      <BlockStack gap="400">
        <Card>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
              <BlockStack gap="100">
                <Text tone="subdued" variant="bodySm">
                  Status
                </Text>
                <Badge tone={statusTone}>{invoice.status}</Badge>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
              <BlockStack gap="100">
                <Text tone="subdued" variant="bodySm">
                  Issued on
                </Text>
                <Text variant="bodyMd">{formatDate(invoice.issuedAt)}</Text>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
              <BlockStack gap="100">
                <Text tone="subdued" variant="bodySm">
                  Due date
                </Text>
                <InlineStack gap="100" blockAlign="center">
                  <Icon source={CalendarIcon} tone="subdued" />
                  <Text variant="bodyMd">{formatDate(invoice.dueAt)}</Text>
                </InlineStack>
                <Text tone="subdued" variant="bodySm">
                  {formatTimeUntil(invoice.dueAt)}
                </Text>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
              <BlockStack gap="100">
                <Text tone="subdued" variant="bodySm">
                  Balance due
                </Text>
                <Text variant="headingMd" tone={invoice.status === 'overdue' ? 'critical' : undefined}>
                  {formatCurrency(invoice.balanceDue.amount)}
                </Text>
              </BlockStack>
            </Grid.Cell>
          </Grid>
        </Card>

        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingSm">Company</Text>
                <BlockStack gap="050">
                  <Text variant="bodyMd" fontWeight="medium">
                    {company?.name ?? 'Company'}
                  </Text>
                  <Text tone="subdued" variant="bodySm">
                    {company?.legalName ?? ''}
                  </Text>
                </BlockStack>
                <Divider />
                <BlockStack gap="050">
                  <Text tone="subdued" variant="bodySm">
                    Payment terms
                  </Text>
                  <Text variant="bodyMd">
                    {company?.paymentTerms.description ?? 'Net terms'}
                  </Text>
                </BlockStack>
                <BlockStack gap="050">
                  <Text tone="subdued" variant="bodySm">
                    Credit limit
                  </Text>
                  <Text variant="bodyMd">
                    {company?.credit.creditLimit ? formatCurrency(company.credit.creditLimit.amount) : '—'}
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Grid.Cell>

          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingSm">References</Text>
                <BlockStack gap="050">
                  <Text tone="subdued" variant="bodySm">
                    Order reference
                  </Text>
                  <Text variant="bodyMd">{invoice.orderId ?? '—'}</Text>
                </BlockStack>
                <BlockStack gap="050">
                  <Text tone="subdued" variant="bodySm">
                    Related quote
                  </Text>
                  <Text variant="bodyMd">{relatedQuote?.quoteNumber ?? invoice.quoteId ?? '—'}</Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Grid.Cell>

          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingSm">Payment history</Text>
                {paymentRows.length ? (
                  <DataTable
                    columnContentTypes={['text', 'text', 'text', 'numeric']}
                    headings={['Date', 'Method', 'Reference', 'Amount']}
                    rows={paymentRows}
                  />
                ) : (
                  <Text tone="subdued" variant="bodySm">
                    No payments recorded yet.
                  </Text>
                )}
              </BlockStack>
            </Card>
          </Grid.Cell>
        </Grid>

        <Card>
          <BlockStack gap="200">
            <Text variant="headingSm">Line items</Text>
            <DataTable
              columnContentTypes={['text', 'text', 'numeric', 'numeric', 'numeric']}
              headings={['Product', 'SKU', 'Qty', 'Unit price', 'Line total']}
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
                <Text variant="bodyMd">{formatCurrency(invoice.subtotal.amount)}</Text>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
              <BlockStack gap="050">
                <Text tone="subdued" variant="bodySm">
                  Tax
                </Text>
                <Text variant="bodyMd">{formatCurrency(invoice.taxTotal.amount)}</Text>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
              <BlockStack gap="050">
                <Text tone="subdued" variant="bodySm">
                  Shipping
                </Text>
                <Text variant="bodyMd">
                  {invoice.shippingTotal ? formatCurrency(invoice.shippingTotal.amount) : '—'}
                </Text>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, md: 12 }}>
              <Divider />
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, md: 12 }}>
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingSm">Total</Text>
                <Text variant="headingLg">{formatCurrency(invoice.total.amount)}</Text>
              </InlineStack>
            </Grid.Cell>
          </Grid>
        </Card>

        {invoice.notes ? (
          <Card>
            <BlockStack gap="200">
              <InlineStack gap="100" blockAlign="center">
                <Icon source={NoteIcon} tone="subdued" />
                <Text variant="headingSm">Notes</Text>
              </InlineStack>
              <Text tone="subdued" variant="bodyMd">
                {invoice.notes}
              </Text>
            </BlockStack>
          </Card>
        ) : null}
      </BlockStack>
    </Page>
  );
}
