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
  Icon,
  InlineStack,
  Layout,
  Page,
  Text,
  TextField,
} from '@shopify/polaris';
import {
  CartIcon,
  BankIcon,
  CalendarIcon,
  MoneyIcon,
  PaymentIcon,
  CashDollarIcon,
  NoteIcon,
} from '@shopify/polaris-icons';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getCompanyById,
  getInvoiceById,
  getQuoteById,
} from '../../../data';
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
    <Card>
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
  const [shippingOption, setShippingOption] = useState<'standard' | 'expedited' | 'pickup'>('standard');

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
                <Text tone="subdued" variant="bodySm">
                  Funds will be debited automatically each month on the invoice due date.
                </Text>
              </BlockStack>
            ) : (
              <Text tone="subdued" variant="bodySm">
                Your company does not have installment plans enabled. Contact your merchant to enable Shopify Capital.
              </Text>
            )}
          </BlockStack>
        );
      case 'ach':
        return (
          <BlockStack gap="200">
            <Text variant="bodyMd">
              Authorize a one-time ACH debit from your business account. Provide your treasury contact for receipts.
            </Text>
            <TextField
              label="Treasury contact email"
              value={shopPayEmail}
              onChange={setShopPayEmail}
              autoComplete="email"
            />
            <Checkbox
              label="I authorize a debit for the amount due from our primary business account"
              checked={achAccepted}
              onChange={setAchAccepted}
            />
          </BlockStack>
        );
      case 'shopPay':
        return (
          <BlockStack gap="200">
            <Text variant="bodyMd">
              Complete payment with Shop Pay using your stored details. A confirmation will be sent upon completion.
            </Text>
            <TextField
              label="Shop Pay email"
              value={shopPayEmail}
              onChange={setShopPayEmail}
              autoComplete="email"
            />
            <Text tone="subdued" variant="bodySm">
              Shop Pay supports cards ending in •••• 4567 and •••• 8901 for this organization.
            </Text>
          </BlockStack>
        );
      default:
        return null;
    }
  };

  const confirmDisabled =
    (activeMethod === 'invoice' && poNumber.trim().length === 0) ||
    (activeMethod === 'ach' && !achAccepted) ||
    (activeMethod === 'installments' && installmentOptions.length === 0) ||
    (activeMethod === 'shopPay' && shopPayEmail.trim().length === 0);

  return (
    <Page
      title="Complete payment"
      subtitle={`Invoice ${invoice.invoiceNumber}`}
      backAction={{
        content: 'Invoice details',
        onAction: () => navigate(`/cx/invoices/${invoice.id}`),
      }}
      primaryAction={{ content: 'Confirm payment', onAction: handleConfirm, disabled: confirmDisabled }}
      secondaryActions={[{ content: 'Download invoice', icon: NoteIcon }]}
    >
      <BlockStack gap="400">
        {confirmation ? (
          <Banner title="Payment scheduled" tone="success" onDismiss={() => setConfirmation(null)}>
            <p>{confirmation}</p>
          </Banner>
        ) : null}

        <Layout>
          <Layout.Section>
            <Card>
              <InlineStack
                wrap
                align="space-between"
                blockAlign="start"
                gap="500"
              >
                <Box minWidth="220px">
                  <BlockStack gap="100">
                    <Text tone="subdued" variant="bodySm">
                      Company
                    </Text>
                    <Text variant="bodyMd" fontWeight="medium">
                      {company?.name}
                    </Text>
                    <Text tone="subdued" variant="bodySm">
                      Credit available:{' '}
                      {company?.credit.availableCredit
                        ? formatCurrency(company.credit.availableCredit.amount)
                        : '—'}
                    </Text>
                  </BlockStack>
                </Box>
                <Box minWidth="220px">
                  <BlockStack gap="100">
                    <Text tone="subdued" variant="bodySm">
                      Invoice due
                    </Text>
                    <InlineStack gap="150" blockAlign="center">
                      <Icon source={CalendarIcon} tone="subdued" />
                      <Text variant="bodyMd">{formatDate(invoice.dueAt)}</Text>
                    </InlineStack>
                    <Text tone="subdued" variant="bodySm">
                      {formatTimeUntil(invoice.dueAt)}
                    </Text>
                  </BlockStack>
                </Box>
                <Box minWidth="220px">
                  <BlockStack gap="100">
                    <Text tone="subdued" variant="bodySm">
                      Quote reference
                    </Text>
                    <Text variant="bodyMd">{quote?.quoteNumber ?? invoice.quoteId ?? '—'}</Text>
                    <Text tone="subdued" variant="bodySm">
                      Amount due: {formatCurrency(totalDue)}
                    </Text>
                  </BlockStack>
                </Box>
              </InlineStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="twoThirds">
            <BlockStack gap="300">
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
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="300">
              <Card>
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={CartIcon} tone="subdued" />
                    <Text variant="headingSm">Order summary</Text>
                  </InlineStack>
                  {cartSummary.map(([label, value]) => (
                    <InlineStack key={label} align="space-between">
                      <Text tone="subdued" variant="bodySm">
                        {label}
                      </Text>
                      <Text variant="bodySm">{value}</Text>
                    </InlineStack>
                  ))}
                  <Divider />
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingSm">Amount due</Text>
                    <Text variant="headingLg">{formatCurrency(totalDue)}</Text>
                  </InlineStack>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text variant="headingSm">Shipping choice</Text>
                  <ChoiceList
                    title="Shipping method"
                    titleHidden
                    choices={[
                      { label: 'Standard freight (3-5 business days)', value: 'standard' },
                      { label: 'Expedited delivery (2 business days)', value: 'expedited' },
                      { label: 'Pickup at warehouse', value: 'pickup' },
                    ]}
                    selected={[shippingOption]}
                    onChange={(value) => setShippingOption(value[0] as typeof shippingOption)}
                  />
                  <Text tone="subdued" variant="bodySm">
                    Estimated delivery {formatDate(quote?.approxDeliveryDate ?? invoice.dueAt)}
                  </Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text variant="headingSm">Billing address</Text>
                  <Text tone="subdued" variant="bodySm">
                    {company?.locations.find((loc) => loc.isDefaultBilling)?.address.line1 ??
                      'Billing address on file'}
                  </Text>
                  <Divider />
                  <Text variant="headingSm">Shipping address</Text>
                  <Text tone="subdued" variant="bodySm">
                    {company?.locations.find((loc) => loc.isDefaultShipping)?.address.line1 ??
                      'Shipping address on file'}
                  </Text>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
