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
import { StoreIcon } from '@shopify/polaris-icons';
import { useNavigate } from 'react-router-dom';

import {
  COMPANY_INDEX,
  COMPANY_SUMMARY,
  type CompanyOrderingStatus,
  type CompanyRecord,
} from '../../../data';
import { formatCurrency, formatOrders } from '../../../utils/formatters';

const resourceName = {
  singular: 'company',
  plural: 'companies',
};

const orderingChoices: { label: string; value: CompanyOrderingStatus }[] = [
  { label: 'Ordering approved', value: 'approved' },
  { label: 'Ordering not approved', value: 'not_approved' },
  { label: 'Ordering pending', value: 'pending' },
];

const statusTone: Record<CompanyOrderingStatus, 'success' | 'attention' | 'subdued'> = {
  approved: 'success',
  not_approved: 'subdued',
  pending: 'attention',
};

const heading = (label: string) => (
  <Text as="span" variant="bodySm" tone="subdued" fontWeight="medium">
    {label}
  </Text>
);

const TABLE_HEADINGS: IndexTableProps['headings'] = [
  { id: 'company', title: heading('Company') },
  { id: 'ordering', title: heading('Ordering') },
  { id: 'locations', title: heading('Locations') },
  { id: 'contact', title: heading('Main contact') },
  { id: 'orders', title: heading('Total orders') },
  { id: 'sales', title: heading('Total sales'), alignment: 'end' },
];

const sortComparer: Record<string, (a: CompanyRecord, b: CompanyRecord) => number> = {
  'name asc': (a, b) => a.name.localeCompare(b.name),
  'name desc': (a, b) => b.name.localeCompare(a.name),
  'orders desc': (a, b) => b.totalOrders - a.totalOrders,
  'orders asc': (a, b) => a.totalOrders - b.totalOrders,
  'sales desc': (a, b) => b.totalSales - a.totalSales,
  'sales asc': (a, b) => a.totalSales - b.totalSales,
};

export function CompaniesPage() {
  const navigate = useNavigate();
  const basePath = '/mx';
  const [queryValue, setQueryValue] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [orderingFilter, setOrderingFilter] = useState<CompanyOrderingStatus[]>([]);
  const [sortSelected, setSortSelected] = useState<string[]>(['name asc']);
  const { mode, setMode } = useSetIndexFiltersMode();

  const sortOptions: IndexFiltersProps['sortOptions'] = [
    { label: 'Company', value: 'name asc', directionLabel: 'A-Z' },
    { label: 'Company', value: 'name desc', directionLabel: 'Z-A' },
    { label: 'Total orders', value: 'orders desc', directionLabel: 'High to low' },
    { label: 'Total orders', value: 'orders asc', directionLabel: 'Low to high' },
    { label: 'Total sales', value: 'sales desc', directionLabel: 'High to low' },
    { label: 'Total sales', value: 'sales asc', directionLabel: 'Low to high' },
  ];

  const filters: IndexFiltersProps['filters'] = [
    {
      key: 'orderingStatus',
      label: 'Ordering',
      filter: (
        <ChoiceList
          title="Ordering"
          titleHidden
          allowMultiple
          selected={orderingFilter}
          onChange={(value: CompanyOrderingStatus[]) => setOrderingFilter(value)}
          choices={orderingChoices}
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters: IndexFiltersProps['appliedFilters'] = [];
  if (orderingFilter.length > 0) {
    appliedFilters.push({
      key: 'orderingStatus',
      label: orderingFilter
        .map((value) => orderingChoices.find((choice) => choice.value === value)?.label ?? value)
        .join(', '),
      onRemove: () => setOrderingFilter([]),
    });
  }

  const filteredCompanies = useMemo(() => {
    let items = COMPANY_INDEX;

    if (queryValue.trim()) {
      const query = queryValue.trim().toLowerCase();
      items = items.filter((company) =>
        [company.name, company.mainContact ?? '', formatOrders(company.totalOrders)]
          .join(' ')
          .toLowerCase()
          .includes(query),
      );
    }

    if (orderingFilter.length > 0) {
      items = items.filter((company) => orderingFilter.includes(company.orderingStatus));
    }

    if (selectedTab === 1) {
      items = items.filter((company) => company.orderingStatus === 'approved');
    }

    if (selectedTab === 2) {
      items = items.filter((company) => company.orderingStatus === 'not_approved');
    }

    const sortKey = sortSelected[0];
    if (sortKey && sortComparer[sortKey]) {
      items = [...items].sort(sortComparer[sortKey]);
    }

    return items;
  }, [orderingFilter, queryValue, selectedTab, sortSelected]);

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(
    filteredCompanies,
    {
      resourceName,
    },
  );

  const bulkActions = [{ content: 'Add tag' }];
  const promotedBulkActions = [{ content: 'Approve ordering' }];

  const handleCancelFilters = useCallback(() => {
    setMode(IndexFiltersMode.Default);
  }, [setMode]);

  const handleRowNavigation = useCallback(
    (id: string) => {
      navigate(`${basePath}/companies/${id}`);
    },
    [basePath, navigate],
  );

  const rowMarkup = filteredCompanies.map((company, index) => (
    <IndexTable.Row
      id={company.id}
      key={company.id}
      position={index}
      selected={selectedResources.includes(company.id)}
      onNavigation={handleRowNavigation}
    >
      <IndexTable.Cell>
        <Link
          dataPrimaryLink
          monochrome
          removeUnderline
          onClick={() => handleRowNavigation(company.id)}
        >
          <Text variant="bodyMd" fontWeight="medium">
            {company.name}
          </Text>
        </Link>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={statusTone[company.orderingStatus]}>
          {orderingChoices.find((choice) => choice.value === company.orderingStatus)?.label ??
            company.orderingStatus}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd">
          {company.locationsCount} {company.locationsCount === 1 ? 'location' : 'locations'}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd">
          {company.mainContact ?? 'No main contact'}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd">
          {formatOrders(company.totalOrders)}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" alignment="end" variant="bodyMd">
          {formatCurrency(company.totalSales)}
        </Text>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page fullWidth titleHidden>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center" wrap>
          <InlineStack gap="200" blockAlign="center">
            <Icon source={StoreIcon} tone="subdued" />
            <Text as="h1" variant="headingLg">
              Companies
            </Text>
          </InlineStack>
          <ButtonGroup>
            <Button>Export</Button>
            <Button variant="primary" tone="primary">
              Add company
            </Button>
          </ButtonGroup>
        </InlineStack>

        <Card>
          <InlineStack gap="400" wrap>
            {COMPANY_SUMMARY.map((summary) => (
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
            queryPlaceholder="Search companies"
            onQueryChange={setQueryValue}
            onQueryClear={() => setQueryValue('')}
            filters={filters}
            appliedFilters={appliedFilters}
            onClearAll={() => setOrderingFilter([])}
            cancelAction={{ onAction: handleCancelFilters }}
            tabs={[
              { content: 'All', id: 'all' },
              { content: 'Ordering approved', id: 'ordering-approved' },
              { content: 'Ordering not approved', id: 'ordering-not-approved' },
            ]}
            selected={selectedTab}
            onSelect={setSelectedTab}
            mode={mode}
            setMode={setMode}
            canCreateFilters
          />
          <IndexTable
            selectable
            resourceName={resourceName}
          itemCount={filteredCompanies.length}
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

        <Text as="p" tone="subdued">
          Learn more about <Link url="https://help.shopify.com/en/manual/customers/customer-accounts">companies</Link>
        </Text>
      </BlockStack>
    </Page>
  );
}
