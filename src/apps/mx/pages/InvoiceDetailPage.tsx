import {
  Badge,
  BlockStack,
  Card,
  DataTable,
  Grid,
  Icon,
  InlineGrid,
  InlineStack,
  Page,
  Text,
} from '@shopify/polaris';
import { CalendarIcon } from '@shopify/polaris-icons';
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

export function MerchantInvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  const invoice = useMemo(() => (invoiceId ? getInvoiceById(invoiceId) : undefined), [invoiceId]);

  const company = invoice ? getCompanyById(invoice.companyId) : undefined;
  const relatedQuote = invoice?.quoteId ? getQuoteById(invoice.quoteId) : undefined;

  if (!invoice) {
    return (
      <Page
        title="Invoice not found"
        backAction={{ content: 'Invoices', onAction: () => navigate('/mx/quotes') }}
      >
        <Card>
          <Text as="p" tone="subdued">
            The selected invoice could not be found. Return to the invoices workspace to try again.
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

  const headline = `${company?.name ?? 'Customer company'} — ${invoice.invoiceNumber}`;

  return (
    <Page
      fullWidth
      title={headline}
      backAction={{ content: 'Back to invoices', onAction: () => navigate('/mx/quotes') }}
      primaryAction={{
        content: 'Send payment link',
        onAction: () => {},
      }}
      secondaryActions={[
        { content: 'Download PDF' },
        { content: 'Record payment' },
      ]}
    >
      {/* <InlineStack gap="200" blockAlign="center">
                  <Icon source={StoreIcon} tone="subdued" />
                  <Text as="h1" variant="headingLg">
                    Invoices
                  </Text>
                </InlineStack> */}
      
<Card>
          <InlineGrid columns={4} gap="200">
        
            <BlockStack gap="050">
              <Text variant="headingSm">Customer Info</Text>
                  <Text variant="bodyMd" fontWeight="medium">
                    {company?.name ?? 'Company name'}
                  </Text>
                  <Text tone="subdued" variant="bodySm">
                    {company?.legalName ?? ''}
                  </Text>
            </BlockStack>
            <BlockStack gap="050">
                  <Text tone="subdued" variant="bodySm">
                    Primary payment terms
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
                    {company?.credit.creditLimit
                      ? formatCurrency(company.credit.creditLimit.amount)
                      : '—'}
                  </Text>
                </BlockStack>
                <BlockStack gap="050">
                  <Text tone="subdued" variant="bodySm">
                    Related quote
                  </Text>
                  <Text variant="bodyMd">
                    {relatedQuote?.quoteNumber ?? invoice.quoteId ?? '—'}
                  </Text>
                </BlockStack>
              </InlineGrid>
          </Card>
<InlineGrid columns={['oneThird', 'twoThirds']} gap="300">
        <Card label="oneThird">
          
              <BlockStack gap="100">
                <Text tone="subdued" variant="bodySm">
                  Status
                </Text>
                <Badge tone={statusTone}>{invoice.status}</Badge>
              </BlockStack>
           
              <BlockStack gap="100">
                <Text tone="subdued" variant="bodySm">
                  Issued on
                </Text>
                <Text variant="bodyMd">{formatDate(invoice.issuedAt)}</Text>
              </BlockStack>
            
              <BlockStack gap="100">
                <Text tone="subdued" variant="bodySm">
                  Due date
                </Text>
                <InlineStack gap="100">
                  <Icon source={CalendarIcon} tone="subdued" />
                  <Text variant="bodyMd">{formatDate(invoice.dueAt)}</Text>
                </InlineStack>
                <Text tone="subdued" variant="bodySm">
                  {formatTimeUntil(invoice.dueAt)}
                </Text>
              </BlockStack>
            
              <BlockStack gap="100">
                <Text tone="subdued" variant="bodySm">
                  Balance due
                </Text>
                <Text variant="headingMd">
                  {formatCurrency(invoice.balanceDue.amount)}
                </Text>
              </BlockStack>
            
        </Card>
<Card label="twoThirds">
          <BlockStack gap="200">
            <Text variant="headingSm">Inventory items</Text>
            <DataTable
              columnContentTypes={['text', 'text', 'numeric', 'numeric', 'numeric']}
              headings={['Product', 'SKU', 'Qty', 'Unit price', 'Line total']}
              rows={lineItemRows}
            />
          </BlockStack>
        </Card>
</InlineGrid>


            <Card>
              <BlockStack gap="200">
                <Text variant="headingSm">Invoice terms</Text>
                <BlockStack gap="050">
                  <Text tone="subdued" variant="bodySm">
                    Payment terms
                  </Text>
                  <Text variant="bodyMd">
                    {invoice.paymentTerms.description ?? 'See customer profile for details'}
                  </Text>
                </BlockStack>
                {invoice.paymentSchedule && invoice.paymentSchedule.length > 0 ? (
                  <BlockStack gap="050">
                    <Text tone="subdued" variant="bodySm">
                      Installment options
                    </Text>
                    <Text variant="bodyMd">
                      {invoice.paymentSchedule.map((option) => option.label).join(' · ')}
                    </Text>
                  </BlockStack>
                ) : null}
                
              </BlockStack>
            </Card>
          
          <InlineGrid columns={3}>
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
            
          </InlineGrid>

        

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
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingSm">Total</Text>
                <Text variant="headingLg">{formatCurrency(invoice.total.amount)}</Text>
              </InlineStack>
            </Grid.Cell>
          </Grid>
        </Card>
      
    </Page>
  );
}

