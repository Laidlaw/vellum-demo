import { useCallback, useMemo, useState } from 'react';
import {
  Badge,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  Divider,
  Grid,
  Icon,
  InlineStack,
  Layout,
  Page,
  Select,
  Text,
  TextField,
} from '@shopify/polaris';
import {
  CashDollarIcon,
  DeliveryIcon,
  NoteIcon,
  PaymentIcon,
  PersonIcon,
  StoreIcon,
} from '@shopify/polaris-icons';
import { useNavigate, useParams } from 'react-router-dom';

import { INVOICES, getCompanyById, getCompanyContact, getQuoteById } from '../../../data';
import { formatCurrency, formatDate, formatTimeUntil } from '../../../utils/formatters';

const SHIPPING_OPTIONS = [
  { label: 'Ship to requester location', value: 'requester', description: 'Stock replenishment for plant floor' },
  { label: 'Ship to alternate dock', value: 'alternate', description: 'Use if PO specifies dock 4 or staging yard' },
  { label: 'Split shipment by line item', value: 'split', description: 'Break out critical items into separate shipments' },
] as const;

const PAYMENT_OPTIONS = [
  { label: 'Apply net terms (Default - Net 45)', value: 'net_terms' },
  { label: 'Schedule ACH payment', value: 'ach' },
  { label: 'Pay now with corporate card', value: 'card' },
] as const;

export function QuoteApprovalPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const quote = useMemo(() => (quoteId ? getQuoteById(quoteId) : undefined), [quoteId]);
  const company = quote ? getCompanyById(quote.companyId) : undefined;
  const requester = quote?.requesterId ? getCompanyContact(quote.companyId, quote.requesterId) : undefined;
  const approver = quote?.approverId ? getCompanyContact(quote.companyId, quote.approverId) : undefined;
  const relatedInvoice = useMemo(() => {
    if (!quote) return undefined;
    return INVOICES.find((invoice) => invoice.quoteId === quote.id);
  }, [quote]);

  const [selectedShipping, setSelectedShipping] = useState<(typeof SHIPPING_OPTIONS)[number]['value']>('requester');
  const [selectedPayment, setSelectedPayment] = useState<(typeof PAYMENT_OPTIONS)[number]['value']>('net_terms');
  const [poMemo, setPoMemo] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const handleConfirm = useCallback(() => {
    if (relatedInvoice) {
      navigate(`/cx/invoices/${relatedInvoice.id}/pay`);
      return;
    }

    if (quote) {
      navigate('/cx/invoices');
    }
  }, [navigate, quote, relatedInvoice]);

  if (!quote) {
    return (
      <Page title="Approve quote">
        <Card>
          <Text tone="subdued">We couldn’t find that quote. Return to the quotes index and choose another record.</Text>
        </Card>
      </Page>
    );
  }

  const lineItemCount = quote.lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = quote.subtotal.amount;
  const tax = quote.taxTotal.amount;
  const shipping = quote.shippingTotal?.amount ?? 0;
  const total = quote.total.amount;

  return (
    <Page
      title="Approve and convert quote"
      subtitle={`Quote ${quote.quoteNumber}`}
      backAction={{ content: 'Back to quote', onAction: () => navigate(`/cx/quotes/${quote.id}`) }}
      primaryAction={{ content: 'Approve quote', onAction: handleConfirm }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center" wrap>
                  <BlockStack gap="050">
                    <InlineStack gap="100" blockAlign="center">
                      <Badge tone="attention">Pending approval</Badge>
                      <Text tone="subdued" variant="bodySm">
                        Expires {formatDate(quote.expiresAt)} · {formatTimeUntil(quote.expiresAt)}
                      </Text>
                    </InlineStack>
                    <Text variant="headingLg">{quote.name}</Text>
                    <Text tone="subdued" variant="bodySm">
                      {lineItemCount} total units across {quote.lineItems.length} line items
                    </Text>
                  </BlockStack>
                  <InlineStack gap="200" wrap>
                    <ButtonGroup>
                      <Button onClick={() => navigate(`/cx/quotes/${quote.id}`)}>View quote</Button>
                      <Button onClick={() => navigate(`/cx/quotes/${quote.id}?preview=pdf`)}>Download PDF</Button>
                    </ButtonGroup>
                  </InlineStack>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <InlineStack className="InlineSectionHeading" gap="100" blockAlign="center">
                  <Icon source={DeliveryIcon} tone="subdued" />
                  <Text variant="headingSm">Fulfillment preferences</Text>
                </InlineStack>
                <Grid>
                  {SHIPPING_OPTIONS.map((option) => {
                    const isSelected = selectedShipping === option.value;
                    return (
                      <Grid.Cell columnSpan={{ xs: 6, md: 4 }} key={option.value}>
                        <Card
                          className={isSelected ? 'QuoteApprovalOption QuoteApprovalOption--selected' : 'QuoteApprovalOption'}
                        >
                          <Box padding="300">
                            <Button
                              fullWidth
                              alignment="start"
                              variant="plain"
                              onClick={() => setSelectedShipping(option.value)}
                            >
                              <BlockStack gap="150">
                                <InlineStack gap="100" blockAlign="center" wrap>
                                  <Badge tone={isSelected ? 'success' : 'subdued'} size="small">
                                    {isSelected ? 'Selected' : 'Select'}
                                  </Badge>
                                  <Text variant="bodyMd" fontWeight="medium">
                                    {option.label}
                                  </Text>
                                </InlineStack>
                                <Text tone="subdued" variant="bodySm">
                                  {option.description}
                                </Text>
                              </BlockStack>
                            </Button>
                          </Box>
                        </Card>
                      </Grid.Cell>
                    );
                  })}
                </Grid>
                <BlockStack gap="200">
                  <TextField
                    label="Ship-to override"
                    helpText="Leave blank to use the requester’s default distribution hub."
                    placeholder="Warehouse B - Dock 4"
                    value={poMemo}
                    onChange={setPoMemo}
                  />
                  <InlineStack gap="100" blockAlign="center">
                    <Icon source={StoreIcon} tone="subdued" />
                    <Text tone="subdued" variant="bodySm">
                      Default shipping location: {company?.locations[0]?.name ?? 'Distribution center'}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <InlineStack className="InlineSectionHeading" gap="100" blockAlign="center">
                  <Icon source={PaymentIcon} tone="subdued" />
                  <Text variant="headingSm">Payment method</Text>
                </InlineStack>
                <Select
                  label="Select how to release payment"
                  options={PAYMENT_OPTIONS}
                  value={selectedPayment}
                  onChange={setSelectedPayment}
                />
                <BlockStack gap="200">
                  <InlineStack gap="100" blockAlign="center">
                    <Icon source={CashDollarIcon} tone="subdued" />
                    <Text tone="subdued" variant="bodySm">
                      Available credit: {formatCurrency(company?.credit?.creditLimit?.amount ?? 0)}
                    </Text>
                  </InlineStack>
                  <TextField
                    label="Internal approval note"
                    multiline={3}
                    value={internalNote}
                    placeholder="Flag any requirements for finance or fulfillment teams."
                    onChange={setInternalNote}
                  />
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
        <Layout.Section secondary>
          <BlockStack gap="300">
            <Card>
              <BlockStack gap="200">
                <InlineStack className="InlineSectionHeading" gap="100" blockAlign="center">
                  <Icon source={NoteIcon} tone="subdued" />
                  <Text variant="headingSm">Summary</Text>
                </InlineStack>
                <BlockStack gap="150">
                  <InlineStack gap="100" blockAlign="center">
                    <Icon source={PersonIcon} tone="subdued" />
                    <Text variant="bodyMd">
                      {approver ? `${approver.firstName} ${approver.lastName}` : 'Approval routed to finance team'}
                    </Text>
                  </InlineStack>
                  <InlineStack gap="100" blockAlign="center">
                    <Icon source={StoreIcon} tone="subdued" />
                    <Text variant="bodyMd">{company?.name ?? 'Company account'}</Text>
                  </InlineStack>
                  <InlineStack gap="100" blockAlign="center">
                    <Icon source={DeliveryIcon} tone="subdued" />
                    <Text variant="bodyMd">
                      Target delivery {quote.approxDeliveryDate ? formatDate(quote.approxDeliveryDate) : 'TBD'}
                    </Text>
                  </InlineStack>
                </BlockStack>
                <Divider />
                <BlockStack gap="150">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      Subtotal
                    </Text>
                    <Text variant="bodyMd">{formatCurrency(subtotal)}</Text>
                  </InlineStack>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      Tax
                    </Text>
                    <Text variant="bodyMd">{formatCurrency(tax)}</Text>
                  </InlineStack>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text tone="subdued" variant="bodySm">
                      Shipping
                    </Text>
                    <Text variant="bodyMd">{formatCurrency(shipping)}</Text>
                  </InlineStack>
                  <Divider />
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingSm">Total due</Text>
                    <Text variant="headingLg">{formatCurrency(total)}</Text>
                  </InlineStack>
                </BlockStack>
                <Button primary onClick={handleConfirm}>
                  Approve and create order
                </Button>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
