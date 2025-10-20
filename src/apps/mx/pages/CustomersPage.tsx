import { useCallback, useMemo, useState } from 'react';
import {
  Badge,
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  ChoiceList,
  Icon,
  IndexFilters,
  type IndexFiltersProps,
  IndexFiltersMode,
  IndexTable,
  type IndexTableProps,
  InlineStack,
  Link,
  Page,
  Text,
  useIndexResourceState,
  useSetIndexFiltersMode,
} from '@shopify/polaris';
import { NoteIcon, PersonSegmentIcon } from '@shopify/polaris-icons';
import { useNavigate } from 'react-router-dom';

import {
  CUSTOMERS,
  CUSTOMER_SUMMARY,
  type CustomerRecord,
  type SubscriptionStatus,
} from '../../../data';
import { formatCurrency, formatOrders } from '../../../utils/formatters';

const resourceName = {
  singular: 'customer',
  plural: 'customers',
};

const sortComparer: Record<string, (a: CustomerRecord, b: CustomerRecord) => number> = {
  'name asc': (a, b) => a.name.localeCompare(b.name),
  'name desc': (a, b) => b.name.localeCompare(a.name),
  'orders desc': (a, b) => b.ordersCount - a.ordersCount,
  'orders asc': (a, b) => a.ordersCount - b.ordersCount,
  'amount desc': (a, b) => b.amountSpent - a.amountSpent,
  'amount asc': (a, b) => a.amountSpent - b.amountSpent,
};

const subscriptionChoices: { label: string; value: SubscriptionStatus }[] = [
  { label: 'Subscribed', value: 'subscribed' },
  { label: 'Not subscribed', value: 'not_subscribed' },
  { label: 'Pending', value: 'pending' },
];

const heading = (label: string) => (
  <Text as="span" variant="bodySm" tone="subdued" fontWeight="medium">
    {label}
  </Text>
);

const TABLE_HEADINGS: IndexTableProps['headings'] = [
  { id: 'customerName', title: heading('Customer name') },
  { id: 'emailSubscription', title: heading('Email subscription') },
  { id: 'location', title: heading('Location') },
  { id: 'orders', title: heading('Orders') },
  { id: 'amountSpent', title: heading('Amount spent'), alignment: 'end' },
];

export function CustomersPage() {
  const navigate = useNavigate();
  const basePath = '/mx';
  const [queryValue, setQueryValue] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionStatus[]>([]);
  const [sortSelected, setSortSelected] = useState<string[]>(['name asc']);
  const { mode, setMode } = useSetIndexFiltersMode();

  const handleSubscriptionChange = useCallback((value: SubscriptionStatus[]) => {
    setSubscriptionFilter(value);
  }, []);

  const handleQueryChange = useCallback((value: string) => setQueryValue(value), []);
  const handleQueryClear = useCallback(() => setQueryValue(''), []);

  const handleFiltersClearAll = useCallback(() => {
    setSubscriptionFilter([]);
  }, []);

  const handleCancelFilters = useCallback(() => {
    setMode(IndexFiltersMode.Default);
  }, [setMode]);

  const sortOptions: IndexFiltersProps['sortOptions'] = [
    { label: 'Customer name', value: 'name asc', directionLabel: 'A-Z' },
    { label: 'Customer name', value: 'name desc', directionLabel: 'Z-A' },
    { label: 'Orders', value: 'orders desc', directionLabel: 'High to low' },
    { label: 'Orders', value: 'orders asc', directionLabel: 'Low to high' },
    { label: 'Amount spent', value: 'amount desc', directionLabel: 'High to low' },
    { label: 'Amount spent', value: 'amount asc', directionLabel: 'Low to high' },
  ];

  const filters: IndexFiltersProps['filters'] = [
    {
      key: 'subscriptionStatus',
      label: 'Email subscription',
      filter: (
        <ChoiceList
          title="Email subscription"
          titleHidden
          allowMultiple
          choices={subscriptionChoices}
          selected={subscriptionFilter}
          onChange={handleSubscriptionChange}
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters: IndexFiltersProps['appliedFilters'] = [];
  if (subscriptionFilter.length > 0) {
    appliedFilters.push({
      key: 'subscriptionStatus',
      label: `Email subscription ${subscriptionFilter
        .map((value) => subscriptionChoices.find((choice) => choice.value === value)?.label ?? value)
        .join(', ')}`,
      onRemove: () => setSubscriptionFilter([]),
    });
  }

  const filteredCustomers = useMemo(() => {
    let items = CUSTOMERS;

    if (queryValue.trim()) {
      const query = queryValue.trim().toLowerCase();
      items = items.filter((customer) =>
        [customer.name, customer.email, customer.location]
          .join(' ')
          .toLowerCase()
          .includes(query),
      );
    }

    if (subscriptionFilter.length > 0) {
      items = items.filter((customer) => subscriptionFilter.includes(customer.subscriptionStatus));
    }

    const sortKey = sortSelected[0];
    if (sortKey && sortComparer[sortKey]) {
      items = [...items].sort(sortComparer[sortKey]);
    }

    return items;
  }, [queryValue, subscriptionFilter, sortSelected]);

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(
    filteredCustomers,
    {
      resourceName,
    },
  );

  const bulkActions = [
    { content: 'Export customers' },
    { content: 'Disable marketing email' },
  ];

  const promotedBulkActions = [{ content: 'Add tags' }];

  const handleRowNavigation = useCallback(
    (id: string) => {
      navigate(`${basePath}/customers/${id}`);
    },
    [basePath, navigate],
  );

  const rowMarkup = filteredCustomers.map((customer, index) => {
    const subscriptionTone = customer.subscriptionStatus === 'subscribed' ? 'success' : 'subdued';
    const subscriptionLabel =
      subscriptionChoices.find((choice) => choice.value === customer.subscriptionStatus)?.label ??
      customer.subscriptionStatus;

    return (
      <IndexTable.Row
        id={customer.id}
        key={customer.id}
        position={index}
        selected={selectedResources.includes(customer.id)}
        onNavigation={handleRowNavigation}
      >
        <IndexTable.Cell>
          <BlockStack gap="100">
            <InlineStack align="start" gap="200">
              <Link
                dataPrimaryLink
                monochrome
                removeUnderline
                onClick={() => handleRowNavigation(customer.id)}
              >
                <Text variant="bodyMd" fontWeight="medium">
                  {customer.name}
                </Text>
              </Link>
              {customer.hasNote ? <Icon source={NoteIcon} tone="base" accessibilityLabel="Has note" /> : null}
            </InlineStack>
            <Text as="span" tone="subdued" variant="bodySm">
              {customer.email}
            </Text>
          </BlockStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={subscriptionTone === 'success' ? 'success' : 'subdued'}>{subscriptionLabel}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {customer.location}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {formatOrders(customer.ordersCount)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end" variant="bodyMd">
            {formatCurrency(customer.amountSpent)}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  const emptyStateMarkup = (
    <Card sectioned>
      <Text as="p" tone="subdued">
        No customers match the current filters.
      </Text>
    </Card>
  );

  return (
    <Page fullWidth titleHidden>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center" wrap>
          <InlineStack gap="200" blockAlign="center">
            <Icon source={PersonSegmentIcon} tone="subdued" />
            <Text as="h1" variant="headingLg">
              Customers
            </Text>
          </InlineStack>
          <ButtonGroup>
            <Button>Export</Button>
            <Button>Import</Button>
            <Button variant="primary">Add customer</Button>
          </ButtonGroup>
        </InlineStack>

        <Card>
          <InlineStack gap="400" align="space-between" wrap>
            {CUSTOMER_SUMMARY.map((summary) => (
              <BlockStack key={summary.label} gap="050">
                <Text variant="headingMd" as="span">
                  {summary.value}
                </Text>
                <Text as="span" tone="subdued" variant="bodySm">
                  {summary.label}
                </Text>
              </BlockStack>
            ))}
          </InlineStack>
        </Card>

        <Card padding="0">
          <IndexFilters
            sortOptions={sortOptions}
            sortSelected={sortSelected}
            onSortChanged={setSortSelected}
            queryValue={queryValue}
            queryPlaceholder="Search customers"
            onQueryChange={handleQueryChange}
            onQueryClear={handleQueryClear}
            filters={filters}
            appliedFilters={appliedFilters}
            onClearAll={handleFiltersClearAll}
            cancelAction={{ onAction: handleCancelFilters }}
            tabs={[{ content: 'All customers', id: 'all' }]}
            selected={0}
            onSelect={() => {}}
            mode={mode}
            setMode={setMode}
            canCreateFilters
          />
          {filteredCustomers.length > 0 ? (
            <IndexTable
              selectable
              resourceName={resourceName}
              itemCount={filteredCustomers.length}
              selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
              onSelectionChange={handleSelectionChange}
              bulkActions={bulkActions}
              promotedBulkActions={promotedBulkActions}
              headings={TABLE_HEADINGS}
              stickyHeader
            >
              {rowMarkup}
            </IndexTable>
          ) : (
            emptyStateMarkup
          )}
        </Card>

        <Text as="p" tone="subdued">
          Learn more about <Link url="https://help.shopify.com/en/manual/customers/customers">customers</Link>
        </Text>
      </BlockStack>
    </Page>
  );
}
