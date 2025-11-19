import { useMemo, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  ChoiceList,
  Collapsible,
  Divider,
  Grid,
  Icon,
  InlineStack,
  Page,
  Text,
  TextField,
} from '@shopify/polaris';
import {
  BankIcon,
  CalendarIcon,
  MoneyIcon,
  PaymentIcon,
  CashDollarIcon,
  NoteIcon,
} from '@shopify/polaris-icons';
import { useNavigate, useParams } from 'react-router-dom';

import { getCompanyById, getInvoiceById, getQuoteById } from '../../../data';
import { formatCurrency, formatDate, formatTimeUntil } from '../../../utils/formatters';

interface PaymentMethodConfig {
  id: 'invoice' | 'installments' | 'ach' | 'shopPay';
  label: string;
  description: string;
  icon: typeof PaymentIcon;
}

interface PaymentMethodCardProps {
  config: PaymentMethodConfig;
  isActive: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function PaymentMethodCard({ config, isActive, onToggle, children }: PaymentMethodCardProps) {
  return (
    <Card className="PaymentMethodCard">
      <Box
        paddingInline="500"
        paddingBlock="400"
        background={isActive ? 'bg-surface-secondary' : 'bg-surface'}
        borderBlockEndWidth="025"
        borderColor="border-subdued"
        borderStyle="solid"
      >
        <Button
          fullWidth
          plain
          alignment="start"
          disclosure={isActive ? 'up' : 'down'}
          onClick={onToggle}
        >
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="200" blockAlign="center">
              <Icon source={config.icon} tone="subdued" />
              <BlockStack gap="050">
                <Text variant="bodyMd" fontWeight="medium">
                  {config.label}
                </Text>
                <Text tone="subdued" variant="bodySm">
                  {config.description}
                </Text>
              </BlockStack>
            </InlineStack>
            <Badge tone={isActive ? 'primary' : 'subdued'}>{isActive ? 'Selected' : 'Select'}</Badge>
          </InlineStack>
        </Button>
      </Box>
      <Collapsible open={isActive} id={`payment-${config.id}`}>
        <Box padding="400" background="bg-surface">
          {children}
        </Box>
      </Collapsible>
    </Card>
  );
}

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'invoice',
    label: 'Pay by invoice (net terms)',
    description: 'Apply your negotiated net terms and provide a PO reference.',
    icon: PaymentIcon,
  },
  {
    id: 'installments',
    label: 'Installments / working capital',
    description: 'Spread payment across monthly installments via Shopify Capital.',
    icon: MoneyIcon,
  },
  {
    id: 'ach',
    label: 'ACH bank transfer',
    description: 'Securely debit your business account with an ACH authorization.',
    icon: BankIcon,
  },
  {
    id: 'shopPay',
    label: 'Shop Pay balance',
    description: 'Use saved Shop Pay details for a streamlined checkout.',
    icon: CashDollarIcon,
  },
];

const SHIPPING_CHOICES = [
  { label: 'Standard delivery (3-5 business days)', value: 'standard' },
  { label: 'Expedited delivery (1-2 business days)', value: 'expedited' },
  { label: 'Warehouse pickup', value: 'pickup' },
];

export function PaymentPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  const invoice = useMemo(() => {
    const fallback = getInvoiceById('inv-2024-0089');
    if (!invoiceId) return fallback;
    return getInvoiceById(invoiceId) ?? fallback;
  }, [invoiceId]);

  const company = invoice ? getCompanyById(invoice.companyId) : undefined;
  const quote = invoice?.quoteId ? getQuoteById(invoice.quoteId) : undefined;

  const [activeMethod, setActiveMethod] = useState<PaymentMethodConfig['id']>('invoice');
  const [poNumber, setPoNumber] = useState(invoice?.quoteId ? `PO-${invoice.quoteId}` : '');
  const [installmentPlan, setInstallmentPlan] = useState<string>('');
  const [achAccepted, setAchAccepted] = useState(false);
  const [shopPayEmail, setShopPayEmail] = useState(company?.contacts[0]?.email ?? '');
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [shippingOption, setShippingOption] = useState<typeof SHIPPING_CHOICES[number]['value']>('standard');

  if (!invoice) {
    return (
      <Page title="Payment" subtitle="Select a payment method">
        <Card>
          <Text as="p" tone="subdued">
            The requested invoice could not be found.
          </Text>
        </Card>
      </Page>
    );
  }

  const cartSummary = [
    ['Subtotal', formatCurrency(invoice.subtotal.amount)],
    ['Tax', formatCurrency(invoice.taxTotal.amount)],
    [
      'Shipping',
      invoice.shippingTotal ? formatCurrency(invoice.shippingTotal.amount) : '—',
    ],
  ];

  const totalDue = invoice.balanceDue.amount;
  const installmentOptions = company?.paymentTerms.installmentOptions ?? [];
  const statusTone = invoice.status === 'overdue' ? 'critical' : invoice.status === 'paid' ? 'success' : 'info';

  useEffect(() => {
    if (installmentOptions.length > 0 && !installmentOptions.some((option) => option.id === installmentPlan)) {
      setInstallmentPlan(installmentOptions[0].id);
    }
  }, [installmentOptions, installmentPlan]);

  const handleMethodToggle = useCallback((id: PaymentMethodConfig['id']) => {
    setActiveMethod((prev) => (prev === id ? prev : id));
    setConfirmation(null);
  }, []);

  const handleConfirm = useCallback(() => {
    const methodLabel = PAYMENT_METHODS.find((method) => method.id === activeMethod)?.label ?? 'Selected method';
    setConfirmation(
      `Payment scheduled: ${methodLabel}. A confirmation email will be sent to ${shopPayEmail ||
        company?.contacts[0]?.email || 'your team'}.`,
    );
  }, [activeMethod, company?.contacts, shopPayEmail]);

  const renderActivePanel = (method: PaymentMethodConfig['id']) => {
    switch (method) {
      case 'invoice':
        return (
          <BlockStack gap="200">
            <Text variant="bodyMd">
              Confirm your purchase order number and we will generate an invoice with your net terms.
            </Text>
            <TextField
              label="Purchase order number"
              value={poNumber}
              onChange={setPoNumber}
              autoComplete="off"
            />
            <InlineStack gap="200" blockAlign="center">
              <Badge tone="success">Net {company?.paymentTerms.netDays ?? 30} terms</Badge>
              <Text tone="subdued" variant="bodySm">
                Discount {company?.paymentTerms.discountPercent ?? 0}% if paid within 10 days
              </Text>
            </InlineStack>
          </BlockStack>
        );
      case 'installments':
        return (
          <BlockStack gap="200">
            <Text variant="bodyMd">
              Spread this payment using Shopify Capital. Select a plan to preview collection dates.
            </Text>
            {installmentOptions.length > 0 ? (
              <BlockStack gap="200">
                <ChoiceList
                  title="Select a plan"
                  titleHidden
                  choices={installmentOptions.map((option) => ({
                    label: `${option.label} · ${option.aprPercent}% APR`,
                    value: option.id,
                    helpText: option.minimumOrderAmount
                      ? `Minimum order ${formatCurrency(option.minimumOrderAmount.amount)}`
                      : undefined,
                  }))}
                  selected={[installmentPlan || installmentOptions[0].id]}
                  onChange={(value) => setInstallmentPlan(value[0])}
                />
                {(() => {
                  const planId = installmentPlan || installmentOptions[0].id;
                  const plan = installmentOptions.find((option) => option.id === planId);
                  if (!plan) return null;
                  return (
                    <BlockStack gap="100">
                      <Text tone="subdued" variant="bodySm">
                        First installment scheduled {formatDate(invoice.dueAt)}.
                      </Text>
                      <Text tone="subdued" variant="bodySm">
                        APR {plan.aprPercent}% · {plan.durationMonths} monthly payments.
                      </Text>
                    </BlockStack>
                  );
                })()}
              </BlockStack>
            ) : (
              <Text tone="subdued" variant="bodySm">
                Installment plans are not enabled for this customer.
              </Text>
            )}
          </BlockStack>
        );
      case 'ach':
        return (
          <BlockStack gap="200">
            <Text variant="bodyMd">
              Authorize an ACH debit from your preferred business account.
            </Text>
            <Checkbox
              label="I certify that I’m an authorized signer on this account"
              checked={achAccepted}
              onChange={(value) => setAchAccepted(value)}
            />
            <Text tone="subdued" variant="bodySm">
              Funds will be debited within one business day of scheduling the payment.
            </Text>
          </BlockStack>
        );
      case 'shopPay':
        return (
          <BlockStack gap="200">
            <Text variant="bodyMd">
              Use your saved Shop Pay profile for faster checkout.
            </Text>
            <TextField
              label="Shop Pay email"
              value={shopPayEmail}
              onChange={setShopPayEmail}
              autoComplete="email"
            />
            <Text tone="subdued" variant="bodySm">
              We’ll send a confirmation to this email address.
            </Text>
          </BlockStack>
        );
      default:
        return null;
    }
  };

  return (
    <Page
      title={`Pay invoice ${invoice.invoiceNumber}`}
      subtitle={`${company?.name ?? 'Buyer account'} · ${formatCurrency(totalDue)} due ${formatDate(invoice.dueAt)}`}
      backAction={{ content: 'Back to invoice', onAction: () => navigate(`/cx/invoices/${invoice.id}`) }}
    >
      <BlockStack gap="400">
        {confirmation ? (
          <Banner tone="success" title="Payment scheduled">
            <p>{confirmation}</p>
          </Banner>
        ) : null}

        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="start" wrap>
              <BlockStack gap="050">
                <InlineStack gap="100" blockAlign="center" wrap>
                  <Badge tone={statusTone}>{invoice.status}</Badge>
                  <Text tone="subdued" variant="bodySm">
                    Balance due · {formatCurrency(totalDue)}
                  </Text>
                </InlineStack>
                <Text variant="headingLg">{formatCurrency(totalDue)}</Text>
                <Text tone="subdued" variant="bodySm">
                  Due {formatDate(invoice.dueAt)} ({formatTimeUntil(invoice.dueAt)})
                </Text>
              </BlockStack>
              <InlineStack gap="150" blockAlign="center" wrap>
                {quote ? (
                  <Button variant="tertiary" onClick={() => navigate(`/cx/quotes/${quote.id}`)}>
                    View linked quote
                  </Button>
                ) : null}
                <Button variant="tertiary" onClick={() => navigate(`/cx/invoices/${invoice.id}`)}>
                  Download invoice
                </Button>
              </InlineStack>
            </InlineStack>
            <Divider />
            <div className="QuoteDetailSummaryGrid">
              <div className="QuoteDetailSummaryCell">
                <Text tone="subdued" variant="bodySm">
                  Billing company
                </Text>
                <BlockStack gap="050">
                  <Text variant="bodyMd" fontWeight="medium">
                    {company?.name ?? 'Company account'}
                  </Text>
                  <Text tone="subdued" variant="bodySm">
                    {company?.legalName ?? '—'}
                  </Text>
                </BlockStack>
              </div>
              <div className="QuoteDetailSummaryCell">
                <Text tone="subdued" variant="bodySm">
                  Billing contact
                </Text>
                <BlockStack gap="050">
                  <Text variant="bodyMd">
                    {company?.contacts[0]?.firstName} {company?.contacts[0]?.lastName}
                  </Text>
                  <Text tone="subdued" variant="bodySm">
                    {company?.contacts[0]?.email}
                  </Text>
                </BlockStack>
              </div>
              <div className="QuoteDetailSummaryCell">
                <Text tone="subdued" variant="bodySm">
                  Delivery preference
                </Text>
                <BlockStack gap="050">
                  <Text variant="bodyMd">
                    {SHIPPING_CHOICES.find((choice) => choice.value === shippingOption)?.label ?? 'Standard delivery'}
                  </Text>
                  <Text tone="subdued" variant="bodySm">
                    Shipping from {company?.locations[0]?.name ?? 'primary distribution center'}
                  </Text>
                </BlockStack>
              </div>
              <div className="QuoteDetailSummaryCell">
                <Text tone="subdued" variant="bodySm">
                  Order reference
                </Text>
                <Text variant="bodyMd">{invoice.orderId ?? 'Not yet created'}</Text>
              </div>
            </div>
          </BlockStack>
        </Card>

        <Grid gap="300">
          <Grid.Cell columnSpan={{ xs: 6, md: 8 }}>
            <Card className="PaymentMethodContainer">
              <BlockStack gap="200">
                <Text variant="headingSm">Choose payment method</Text>
                <BlockStack gap="200" className="PaymentMethodList">
                  {PAYMENT_METHODS.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      config={method}
                      isActive={activeMethod === method.id}
                      onToggle={() => handleMethodToggle(method.id)}
                    >
                      {renderActivePanel(method.id)}
                    </PaymentMethodCard>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card className="PaymentSummaryCard">
              <BlockStack gap="200">
                <Text variant="headingSm">Payment summary</Text>
                <BlockStack gap="100">
                  {cartSummary.map(([label, value]) => (
                    <InlineStack key={label} align="space-between" blockAlign="center">
                      <Text tone="subdued" variant="bodySm">
                        {label}
                      </Text>
                      <Text variant="bodyMd">{value}</Text>
                    </InlineStack>
                  ))}
                </BlockStack>
                <Divider />
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingSm">Total due</Text>
                  <Text variant="headingLg">{formatCurrency(totalDue)}</Text>
                </InlineStack>
                <ChoiceList
                  title="Delivery preference"
                  titleHidden
                  choices={SHIPPING_CHOICES}
                  selected={[shippingOption]}
                  onChange={(value) => setShippingOption(value[0] as typeof shippingOption)}
                />
                <Divider />
                <BlockStack gap="050">
                  <Text tone="subdued" variant="bodySm">
                    Billing contact
                  </Text>
                  <Text variant="bodyMd">
                    {company?.contacts[0]?.firstName} {company?.contacts[0]?.lastName}
                  </Text>
                  <Text tone="subdued" variant="bodySm">
                    {company?.contacts[0]?.email}
                  </Text>
                </BlockStack>
                <InlineStack gap="150" wrap>
                  <Button variant="primary" onClick={handleConfirm}>
                    Schedule payment
                  </Button>
                  <Button onClick={() => navigate(`/cx/invoices/${invoice.id}`)}>
                    View invoice
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Grid.Cell>
        </Grid>

        {quote ? (
          <Card>
            <BlockStack gap="200">
              <InlineStack gap="100" blockAlign="center">
                <Icon source={NoteIcon} tone="subdued" />
                <Text variant="headingSm">Linked quote</Text>
              </InlineStack>
              <BlockStack gap="050">
                <Text variant="bodyMd" fontWeight="medium">
                  {quote.quoteNumber}
                </Text>
                <Text tone="subdued" variant="bodySm">
                  Expires {formatDate(quote.expiresAt)} ({formatTimeUntil(quote.expiresAt)})
                </Text>
              </BlockStack>
              <Button variant="tertiary" onClick={() => navigate(`/cx/quotes/${quote.id}`)}>
                View quote
              </Button>
            </BlockStack>
          </Card>
        ) : null}
      </BlockStack>
    </Page>
  );
}
