import { useMemo, useState, useCallback } from 'react';
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
import {
  NoteIcon,
  ContractIcon,
  DeliveryIcon,
  StoreIcon,
  PersonIcon,
} from '@shopify/polaris-icons';
import { useNavigate } from 'react-router-dom';

import { QUOTES, getCompanyById } from '../../../data';
import { formatCurrency, formatDate, formatTimeUntil } from '../../../utils/formatters';

const resourceName = {
  singular: 'quote',
  plural: 'quotes',
};

const heading = (label: string) => (
  <Text as="span" variant="bodySm" tone="subdued" fontWeight="medium">
    {label}
  </Text>
);

const statusChoices = [
  { label: 'Draft', value: 'draft' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Expired', value: 'expired' },
];

const integrationChoices = [
  { label: 'Salesforce', value: 'salesforce' },
  { label: 'HubSpot', value: 'hubspot' },
  { label: 'Netsuite', value: 'netsuite' },
];

const integrationBadgeMap: Record<string, string> = {
  salesforce: 'SF',
  hubspot: 'HB',
  netsuite: 'NS',
};

const TABLE_HEADINGS: IndexTableProps['headings'] = [
  { id: 'quoteNumber', title: heading('Quote') },
  { id: 'status', title: heading('Status') },
  { id: 'created', title: heading('Quote date') },
  { id: 'expires', title: heading('Expiration') },
  { id: 'timeUntil', title: heading('Time until expiration') },
  { id: 'total', title: heading('Total amount'), alignment: 'end' },
  { id: 'purchaseOrder', title: heading('PO number') },
  { id: 'delivery', title: heading('Delivery') },
  { id: 'order', title: heading('Order ref') },
  { id: 'salesRep', title: heading('Sales rep') },
  { id: 'integration', title: heading('Integration') },
];

function getStatusTone(status: string): 'attention' | 'success' | 'critical' | 'subdued' {
  switch (status) {
    case 'pending_approval':
      return 'attention';
    case 'approved':
      return 'success';
    case 'rejected':
    case 'expired':
      return 'critical';
    default:
      return 'subdued';
  }
}

export function QuotesPage() {
  const navigate = useNavigate();
  const [queryValue, setQueryValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [integrationFilter, setIntegrationFilter] = useState<string[]>([]);
  const [sortSelected, setSortSelected] = useState<string[]>(['expires asc']);
  const viewTabs = [
    { id: 'all', content: 'All quotes' },
    { id: 'expiring', content: 'Expiring soon' },
    { id: 'pending', content: 'Pending approval' },
    { id: 'reorder', content: 'Reorder' },
    { id: 'expired', content: 'Expired' },
  ] as const;
  const [selectedView, setSelectedView] = useState<(typeof viewTabs)[number]['id']>('all');
  const { mode, setMode } = useSetIndexFiltersMode();

  const sortOptions: IndexFiltersProps['sortOptions'] = [
    { label: 'Expiration', value: 'expires asc', directionLabel: 'Soonest first' },
    { label: 'Expiration', value: 'expires desc', directionLabel: 'Latest first' },
    { label: 'Created', value: 'created desc', directionLabel: 'Newest first' },
    { label: 'Created', value: 'created asc', directionLabel: 'Oldest first' },
    { label: 'Total', value: 'total desc', directionLabel: 'High to low' },
    { label: 'Total', value: 'total asc', directionLabel: 'Low to high' },
  ];

  const filters: IndexFiltersProps['filters'] = [
    {
      key: 'status',
      label: 'Status',
      filter: (
        <ChoiceList
          title="Status"
          titleHidden
          choices={statusChoices}
          selected={statusFilter}
          allowMultiple
          onChange={setStatusFilter}
        />
      ),
      shortcut: true,
    },
    {
      key: 'integration',
      label: 'Integration channel',
      filter: (
        <ChoiceList
          title="Integration"
          titleHidden
          choices={integrationChoices}
          selected={integrationFilter}
          allowMultiple
          onChange={setIntegrationFilter}
        />
      ),
    },
  ];

  const appliedFilters: IndexFiltersProps['appliedFilters'] = [];
  if (statusFilter.length > 0) {
    appliedFilters.push({
      key: 'status',
      label: statusFilter
        .map((value) => statusChoices.find((choice) => choice.value === value)?.label ?? value)
        .join(', '),
      onRemove: () => setStatusFilter([]),
    });
  }

  if (integrationFilter.length > 0) {
    appliedFilters.push({
      key: 'integration',
      label: integrationFilter
        .map((value) => integrationChoices.find((choice) => choice.value === value)?.label ?? value)
        .join(', '),
      onRemove: () => setIntegrationFilter([]),
    });
  }

  const filteredQuotes = useMemo(() => {
    let items = QUOTES;

    if (queryValue.trim()) {
      const query = queryValue.trim().toLowerCase();
      items = items.filter((quote) => {
        const company = getCompanyById(quote.companyId);
        return [
          quote.quoteNumber,
          quote.name,
          quote.purchaseOrderNumber ?? '',
          quote.salesRep ?? '',
          company?.name ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      });
    }

    if (statusFilter.length > 0) {
      items = items.filter((quote) => statusFilter.includes(quote.status));
    }

    if (integrationFilter.length > 0) {
      items = items.filter((quote) =>
        quote.integrationChannel ? integrationFilter.includes(quote.integrationChannel) : false,
      );
    }

    if (selectedView !== 'all') {
      items = items.filter((quote) => {
        switch (selectedView) {
          case 'expiring': {
            if (!quote.expiresAt) return false;
            const differenceInDays = Math.ceil(
              (new Date(quote.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            );
            return quote.status === 'pending_approval' && differenceInDays <= 7 && differenceInDays >= 0;
          }
          case 'pending':
            return quote.status === 'pending_approval';
          case 'reorder':
            return quote.orderReference != null || quote.status === 'approved';
          case 'expired':
            return quote.status === 'expired';
          default:
            return true;
        }
      });
    }

    const sortKey = sortSelected[0];
    if (sortKey) {
      const sorted = [...items];
      switch (sortKey) {
        case 'expires asc':
          sorted.sort(
            (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
          );
          break;
        case 'expires desc':
          sorted.sort(
            (a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime(),
          );
          break;
        case 'created asc':
          sorted.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          break;
        case 'created desc':
          sorted.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          break;
        case 'total asc':
          sorted.sort((a, b) => a.total.amount - b.total.amount);
          break;
        case 'total desc':
          sorted.sort((a, b) => b.total.amount - a.total.amount);
          break;
      }
      items = sorted;
    }

    return items;
  }, [integrationFilter, queryValue, sortSelected, statusFilter, selectedView]);

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(
    filteredQuotes,
    {
      resourceName,
    },
  );
  const selectedViewIndex = Math.max(
    0,
    viewTabs.findIndex((tab) => tab.id === selectedView),
  );

  const bulkActions = [
    {
      content: 'Approve quotes',
      onAction: () => {},
    },
    {
      content: 'Request changes',
      onAction: () => {},
    },
  ];

  const promotedBulkActions = [
    {
      content: 'Export selected',
      onAction: () => {},
    },
  ];

  const handleRowNavigation = useCallback(
    (id: string) => {
      navigate(`/cx/quotes/${id}`);
    },
    [navigate],
  );

  const rowMarkup = filteredQuotes.map((quote, index) => {
    const company = getCompanyById(quote.companyId);
    const badgeTone = getStatusTone(quote.status);

    return (
      <IndexTable.Row
        id={quote.id}
        key={quote.id}
        position={index}
        selected={selectedResources.includes(quote.id)}
        onNavigation={() => handleRowNavigation(quote.id)}
      >
        <IndexTable.Cell>
          <BlockStack gap="100">
            <InlineStack gap="200" blockAlign="center">
              <Link
                dataPrimaryLink
                monochrome
                removeUnderline
                onClick={() => handleRowNavigation(quote.id)}
              >
                <Text variant="bodyMd" fontWeight="medium">
                  {quote.quoteNumber}
                </Text>
              </Link>
              <Badge tone="subdued">{company?.name ?? '—'}</Badge>
            </InlineStack>
            <Text as="span" tone="subdued" variant="bodySm">
              {quote.name}
            </Text>
          </BlockStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={badgeTone}>{quote.status.replace('_', ' ')}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {formatDate(quote.createdAt)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {formatDate(quote.expiresAt)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" tone={badgeTone === 'critical' ? 'critical' : undefined}>
            {formatTimeUntil(quote.expiresAt)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end" variant="bodyMd" fontWeight="medium">
            {formatCurrency(quote.total.amount)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {quote.purchaseOrderNumber ?? '—'}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="100" blockAlign="center">
            <Icon source={DeliveryIcon} tone="subdued" />
            <Text as="span" variant="bodyMd">
              {quote.approxDeliveryDate ? formatDate(quote.approxDeliveryDate) : '—'}
            </Text>
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {quote.orderReference ?? '—'}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="100" blockAlign="center">
            <Icon source={PersonIcon} tone="subdued" />
            <Text as="span" variant="bodyMd">
              {quote.salesRep ?? '—'}
            </Text>
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="100" blockAlign="center">
            {quote.integrationChannel ? (
              <span className="integration-pill">
                {integrationBadgeMap[quote.integrationChannel] ?? 'INT'}
              </span>
            ) : (
              <Icon source={StoreIcon} tone="subdued" />
            )}
            <Text as="span" variant="bodyMd">
              {quote.integrationChannel ? quote.integrationChannel : '—'}
            </Text>
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Page
      title="Quotes"
      subtitle="Review draft and submitted quotes from your buyers"
      primaryAction={{ content: 'Create quote', disabled: true }}
    >
      <BlockStack gap="400">
        <Card>
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="200" blockAlign="center">
              <Icon source={ContractIcon} tone="subdued" />
              <Text as="h2" variant="headingLg">
                Quotes
              </Text>
            </InlineStack>
            <ButtonGroup>
              <Button variant="primary" disabled>
                Approve selected
              </Button>
              <Button>Export all</Button>
            </ButtonGroup>
          </InlineStack>
        </Card>

        <Card padding="0">
          <IndexFilters
            sortOptions={sortOptions}
            sortSelected={sortSelected}
            onSortChanged={setSortSelected}
            queryValue={queryValue}
            queryPlaceholder="Search quotes by number, company, or PO"
            onQueryChange={setQueryValue}
            onQueryClear={() => setQueryValue('')}
            filters={filters}
            appliedFilters={appliedFilters}
            onClearAll={() => {
              setStatusFilter([]);
              setIntegrationFilter([]);
            }}
            cancelAction={{ onAction: () => setMode(IndexFiltersMode.Default) }}
            tabs={viewTabs.map((tab) => ({ content: tab.content, id: tab.id }))}
            selected={selectedViewIndex}
            onSelect={(selectedIndex) => {
              setSelectedView(viewTabs[selectedIndex].id);
            }}
            mode={mode}
            setMode={setMode}
            canCreateFilters
          />

          <IndexTable
            selectable
            resourceName={resourceName}
            itemCount={filteredQuotes.length}
            selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
            onSelectionChange={handleSelectionChange}
            bulkActions={bulkActions}
            promotedBulkActions={promotedBulkActions}
            headings={TABLE_HEADINGS}
            stickyHeader
          >
            {rowMarkup}
          </IndexTable>
        </Card>

        <Card subdued>
          <InlineStack gap="200" blockAlign="center">
            <Icon source={NoteIcon} tone="subdued" />
            <Text as="p" tone="subdued">
              Approving a quote will generate a draft invoice. Payment options can be configured per company payment
              terms.
            </Text>
          </InlineStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
