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
  ProgressBar,
  Text,
} from '@shopify/polaris';
import {
  BankIcon,
  CalendarIcon,
  CashDollarIcon,
  NoteIcon,
  PersonIcon,
  PaymentIcon,
  StoreIcon,
} from '@shopify/polaris-icons';

import { useCustomerPortalContext, ALL_LOCATIONS_ID } from '../CustomerApp';
import type { CompanyOrderingStatus, CompanyLocation, CompanyPaymentMethod } from '../../../data';
import { formatCurrency, formatDate } from '../../../utils/formatters';

function getOrderingStatusTone(status: CompanyOrderingStatus): 'success' | 'attention' | 'critical' | 'subdued' {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending':
      return 'attention';
    case 'not_approved':
      return 'critical';
    default:
      return 'subdued';
  }
}

function formatStatusLabel(status: CompanyOrderingStatus) {
  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function renderAddress(location?: CompanyLocation) {
  if (!location) return null;
  const { address } = location;
  const lines = [
    address.company,
    address.line1,
    address.line2,
    [address.city, address.province, address.postalCode].filter(Boolean).join(', '),
    address.country,
  ].filter(Boolean);

  return (
    <BlockStack gap="050">
      {lines.map((line) => (
        <Text key={line} as="span" tone="subdued" variant="bodySm">
          {line}
        </Text>
      ))}
    </BlockStack>
  );
}

function getPaymentMethodTone(status: CompanyPaymentMethod['status']): 'success' | 'attention' | 'critical' | 'subdued' {
  switch (status) {
    case 'active':
      return 'success';
    case 'pending':
      return 'attention';
    case 'disabled':
      return 'critical';
    default:
      return 'subdued';
  }
}

function formatPaymentMethodStatus(status: CompanyPaymentMethod['status']) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const automationPreferences = [
  'Email invoices to finance within 15 minutes of being issued.',
  'Send proactive reminders 5 days before due dates to location managers.',
  'Escalate quotes over $25K to finance approvers automatically.',
];

export function CompanyPage() {
  const { company, activeLocation, activeLocationId, locations } = useCustomerPortalContext();

  if (!company) {
    return (
      <Page title="Company information" subtitle="Billing profiles, tax IDs, and payment terms">
        <Card>
          <Text as="p" tone="subdued">
            Company details are unavailable for this demo profile.
          </Text>
        </Card>
      </Page>
    );
  }

  const statusBadgeTone = getOrderingStatusTone(company.orderingStatus);
  const statusLabel = formatStatusLabel(company.orderingStatus);
  const primaryContact =
    company.contacts.find((contact) => contact.email === company.mainContact) ?? company.contacts[0];
  const totalSales = formatCurrency(company.totalSales);
  const totalOrders = company.totalOrders.toLocaleString();
  const lastOrder = formatDate(company.lastOrderAt);

  const defaultBilling = locations.find((location) => location.isDefaultBilling);
  const defaultShipping = locations.find((location) => location.isDefaultShipping);

  const locationOverview = activeLocationId === ALL_LOCATIONS_ID ? defaultShipping ?? locations[0] : activeLocation;
  const locationTitle = activeLocationId === ALL_LOCATIONS_ID ? 'Primary fulfillment location' : 'Filtered location';
  const contactsForLocation =
    activeLocationId === ALL_LOCATIONS_ID
      ? []
      : company.contacts.filter((contact) => contact.locationIds.includes(activeLocation!.id));

  const { paymentTerms, credit } = company;
  const creditLimit = credit.creditLimit?.amount ?? 0;
  const creditUsed = credit.creditUsed?.amount ?? 0;
  const availableCredit = credit.availableCredit?.amount ?? (creditLimit ? creditLimit - creditUsed : undefined);
  const creditUsagePercent = creditLimit > 0 ? Math.min(100, Math.round((creditUsed / creditLimit) * 100)) : 0;

  const daysPastDue = credit.daysPastDue ?? 0;
  const daysPastDueBadgeTone = daysPastDue > 0 ? 'critical' : 'success';

  const paymentTermLabel =
    paymentTerms.type === 'net'
      ? `Net ${paymentTerms.netDays ?? 0}`
      : paymentTerms.type === 'due_on_receipt'
        ? 'Due on receipt'
        : 'Installments';

  const billingLocation = defaultBilling ?? defaultShipping ?? locationOverview;
  const taxStatusTone = company.taxExempt ? 'success' : 'attention';
  const taxStatusLabel = company.taxExempt ? 'Tax exemption on file' : 'Tax documentation required';
  const paymentMethods = company.paymentMethods ?? [];
  const defaultPaymentMethod = paymentMethods.find((method) => method.isDefault) ?? paymentMethods[0];
  const autoPayEnabled = Boolean(
    defaultPaymentMethod?.capabilities?.some((capability) => capability.toLowerCase().includes('auto')),
  );
  const financeContact =
    company.contacts.find((contact) => contact.role === 'finance') ?? primaryContact ?? company.contacts[0];
  const accountsPayableEmail = financeContact?.email ?? company.mainContact ?? '—';
  const creditActionLabel = creditLimit > 0 ? 'Request credit increase' : 'Apply for credit';

  return (
    <Page
      title="Company information"
      subtitle="Billing profiles, payment terms, and account health"
      primaryAction={{ content: 'Add billing profile', disabled: true }}
      secondaryActions={[{ content: 'Export summary', icon: NoteIcon }]}
    >
      <BlockStack gap="400">
        <Card>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3 }}>
              <BlockStack gap="200">
                <InlineStack className="InlineSectionHeading" gap="200" blockAlign="center" wrap={false}>
                  <Icon source={PersonIcon} tone="subdued" />
                  <Text variant="headingSm">Account status</Text>
                </InlineStack>
                <BlockStack gap="050">
                  <Badge tone={statusBadgeTone}>{statusLabel}</Badge>
                  <Text tone="subdued" as="span" variant="bodySm">
                    Created {formatDate(company.createdAt)}
                  </Text>
                </BlockStack>
                <Divider />
                <BlockStack gap="050">
                  <Text variant="bodyMd" fontWeight="medium">
                    {primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : 'Finance contact'}
                  </Text>
                  <Text tone="subdued" variant="bodySm">
                    {primaryContact?.email ?? company.mainContact ?? '—'}
                  </Text>
                </BlockStack>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3 }}>
              <BlockStack gap="200">
                <InlineStack className="InlineSectionHeading" gap="200" blockAlign="center" wrap={false}>
                  <Icon source={NoteIcon} tone="subdued" />
                  <Text variant="headingSm">Billing & tax profile</Text>
                </InlineStack>
                <BlockStack gap="050">
                  <Text variant="bodyMd" fontWeight="medium">
                    {company.legalName ?? company.name}
                  </Text>
                  {billingLocation ? (
                    renderAddress(billingLocation)
                  ) : (
                    <Text tone="subdued" variant="bodySm">
                      Billing address not set
                    </Text>
                  )}
                </BlockStack>
                <Divider />
                <BlockStack gap="050">
                  <InlineStack gap="100" blockAlign="center" wrap>
                    <Badge tone={taxStatusTone}>{taxStatusLabel}</Badge>
                    {billingLocation?.code ? <Badge tone="subdued">{billingLocation.code}</Badge> : null}
                  </InlineStack>
                  <Text tone="subdued" variant="bodySm">
                    Accounts payable: {accountsPayableEmail}
                  </Text>
                </BlockStack>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3 }}>
              <BlockStack gap="200">
                <InlineStack className="InlineSectionHeading" gap="200" blockAlign="center" wrap={false}>
                  <Icon source={CalendarIcon} tone="subdued" />
                  <Text variant="headingSm">Spending summary</Text>
                </InlineStack>
                <BlockStack gap="050">
                  <Text as="span" variant="headingMd">
                    {totalSales}
                  </Text>
                  <Text tone="subdued" variant="bodySm">
                    {totalOrders} lifetime orders
                  </Text>
                </BlockStack>
                <Divider />
                <Text tone="subdued" variant="bodySm">
                  Last order placed {lastOrder}
                </Text>
              </BlockStack>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3 }}>
              <BlockStack gap="200">
                <InlineStack className="InlineSectionHeading" gap="200" blockAlign="center" wrap={false}>
                  <Icon source={StoreIcon} tone="subdued" />
                  <Text variant="headingSm">{locationTitle}</Text>
                </InlineStack>
                <BlockStack gap="050">
                  <Text variant="bodyMd" fontWeight="medium">
                    {locationOverview?.name ?? 'Location coverage'}
                  </Text>
                  {locationOverview?.code ? (
                    <Badge tone="subdued">{locationOverview.code}</Badge>
                  ) : null}
                </BlockStack>
                {activeLocationId === ALL_LOCATIONS_ID ? (
                  <BlockStack gap="050">
                    <Text tone="subdued" variant="bodySm">
                      {locations.length} active locations connected
                    </Text>
                    <Text tone="subdued" variant="bodySm">
                      Default shipping: {defaultShipping?.name ?? 'Not set'}
                    </Text>
                    <Text tone="subdued" variant="bodySm">
                      Default billing: {defaultBilling?.name ?? 'Not set'}
                    </Text>
                  </BlockStack>
                ) : (
                  <BlockStack gap="200">
                    {renderAddress(locationOverview)}
                    {contactsForLocation.length > 0 ? (
                      <BlockStack gap="050">
                        <Text variant="bodySm" fontWeight="medium">
                          Local approvers
                        </Text>
                        {contactsForLocation.map((contact) => (
                          <Text key={contact.id} tone="subdued" variant="bodySm">
                            {contact.firstName} {contact.lastName} • {contact.role}
                          </Text>
                        ))}
                      </BlockStack>
                    ) : null}
                  </BlockStack>
                )}
              </BlockStack>
            </Grid.Cell>
          </Grid>
        </Card>

        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
            <Card>
              <BlockStack gap="200">
                <InlineStack className="InlineSectionHeading" gap="200" blockAlign="center" wrap={false}>
                  <Icon source={BankIcon} tone="subdued" />
                  <Text variant="headingSm">Payment terms</Text>
                </InlineStack>
                <BlockStack gap="050">
                  <InlineStack gap="100" blockAlign="center" wrap>
                    <Badge tone="info">{paymentTermLabel}</Badge>
                    <Badge tone={autoPayEnabled ? 'success' : 'attention'}>
                      {autoPayEnabled ? 'Auto-pay enabled' : 'Manual payment'}
                    </Badge>
                  </InlineStack>
                  {paymentTerms.discountPercent ? (
                    <Text tone="subdued" variant="bodySm">
                      Early payment discount: {paymentTerms.discountPercent}%
                    </Text>
                  ) : null}
                </BlockStack>
                {paymentTerms.description ? (
                  <Text variant="bodyMd">{paymentTerms.description}</Text>
                ) : (
                  <Text variant="bodyMd">
                    Terms managed by finance. Use the Locations page to adjust invoicing logistics per shipping site.
                  </Text>
                )}
                <List>
                  {paymentTerms.creditLimit ? (
                    <List.Item>Negotiated credit limit: {formatCurrency(paymentTerms.creditLimit.amount)}</List.Item>
                  ) : null}
                  {paymentTerms.type === 'installments' && paymentTerms.installmentOptions ? (
                    <List.Item>{paymentTerms.installmentOptions.length} installment plans available</List.Item>
                  ) : null}
                  <List.Item>Primary billing contact: {primaryContact?.email ?? company.mainContact ?? '—'}</List.Item>
                  <List.Item>Accounts payable inbox: {accountsPayableEmail}</List.Item>
                  {defaultPaymentMethod ? (
                    <List.Item>Default payment method: {defaultPaymentMethod.label}</List.Item>
                  ) : null}
                </List>
                <InlineStack gap="150" wrap>
                  <Button variant="primary" size="slim" disabled>
                    {creditActionLabel}
                  </Button>
                  <Button variant="tertiary" size="slim" disabled>
                    Update payment terms
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, md: 2 }}>
            <Card>
              <BlockStack gap="200">
                <InlineStack className="InlineSectionHeading" gap="200" blockAlign="center" wrap={false}>
                  <Icon source={CashDollarIcon} tone="subdued" />
                  <Text variant="headingSm">Credit utilization</Text>
                </InlineStack>
                <BlockStack gap="050">
                  <Text as="span" variant="headingMd">
                    {availableCredit !== undefined ? formatCurrency(availableCredit) : '—'}
                  </Text>
                  <Text tone="subdued" variant="bodySm">
                    Available of {creditLimit ? formatCurrency(creditLimit) : '—'}
                  </Text>
                </BlockStack>
                {creditLimit > 0 ? (
                  <BlockStack gap="100">
                    <ProgressBar progress={creditUsagePercent} tone="highlight" />
                    <Text tone="subdued" variant="bodySm">
                      {formatCurrency(creditUsed)} in use ({creditUsagePercent}%)
                    </Text>
                  </BlockStack>
                ) : null}
                <Badge tone={daysPastDueBadgeTone}>
                  {daysPastDue > 0 ? `${daysPastDue} days past due` : 'On-time payments'}
                </Badge>
                <InlineStack gap="150" wrap>
                  <Button variant="tertiary" size="slim" disabled>
                    View credit history
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Grid.Cell>
        </Grid>

        {paymentMethods.length ? (
          <Card>
            <BlockStack gap="200">
              <InlineStack className="InlineSectionHeading" gap="200" blockAlign="center" wrap={false}>
                <Icon source={PaymentIcon} tone="subdued" />
                <Text variant="headingSm">Payment methods</Text>
              </InlineStack>
              <BlockStack gap="200">
                {paymentMethods.map((method, index) => (
                  <BlockStack key={method.id} gap="150">
                    <InlineStack align="space-between" blockAlign="center" wrap>
                      <BlockStack gap="050">
                        <Text variant="bodyMd" fontWeight="medium">
                          {method.label}
                        </Text>
                        <InlineStack gap="100" blockAlign="center" wrap>
                          <Badge tone={getPaymentMethodTone(method.status)}>{formatPaymentMethodStatus(method.status)}</Badge>
                          {method.isDefault ? <Badge tone="info">Default</Badge> : null}
                          <Badge tone="subdued">{method.type.toUpperCase()}</Badge>
                        </InlineStack>
                        {method.description ? (
                          <Text tone="subdued" variant="bodySm">
                            {method.description}
                          </Text>
                        ) : null}
                        {method.capabilities && method.capabilities.length ? (
                          <Text tone="subdued" variant="bodySm">
                            Supports: {method.capabilities.join(', ')}
                          </Text>
                        ) : null}
                        {method.lastUsedAt ? (
                          <Text tone="subdued" variant="bodySm">
                            Last used {formatDate(method.lastUsedAt)}
                          </Text>
                        ) : null}
                      </BlockStack>
                      <Button variant="tertiary" size="slim" disabled>
                        Manage
                      </Button>
                    </InlineStack>
                    {index < paymentMethods.length - 1 ? <Divider /> : null}
                  </BlockStack>
                ))}
              </BlockStack>
              <InlineStack gap="150" wrap>
                <Button variant="tertiary" size="slim" disabled>
                  Add payment method
                </Button>
                <Button variant="tertiary" size="slim" disabled>
                  Update remittance details
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        ) : null}

        <Card>
          <BlockStack gap="200">
            <InlineStack className="InlineSectionHeading" gap="200" blockAlign="center" wrap={false}>
              <Icon source={NoteIcon} tone="subdued" />
              <Text variant="headingSm">Automation & notifications</Text>
            </InlineStack>
            <List>
              {automationPreferences.map((preference) => (
                <List.Item key={preference}>{preference}</List.Item>
              ))}
            </List>
          </BlockStack>
        </Card>

        {company.notes ? (
          <Card>
            <BlockStack gap="200">
              <InlineStack className="InlineSectionHeading" gap="200" blockAlign="center" wrap={false}>
                <Icon source={NoteIcon} tone="subdued" />
                <Text variant="headingSm">Account notes</Text>
              </InlineStack>
              <Text variant="bodyMd">{company.notes}</Text>
            </BlockStack>
          </Card>
        ) : null}
      </BlockStack>
    </Page>
  );
}
