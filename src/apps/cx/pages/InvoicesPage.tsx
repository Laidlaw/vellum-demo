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
import { PaymentIcon, AlertCircleIcon, CalendarIcon } from '@shopify/polaris-icons';
import { useNavigate } from 'react-router-dom';

import { INVOICES, getCompanySummaryById } from '../../../data';
import { formatCurrency, formatDate, formatTimeUntil } from '../../../utils/formatters';

const resourceName = {
  singular: 'invoice',
  plural: 'invoices',
};

const heading = (label: string) => (
  <Text as="span" variant="bodySm" tone="subdued" fontWeight="medium">
    {label}
  </Text>
);

const statusChoices = [
  { label: 'Draft', value: 'draft' },
  { label: 'Due', value: 'due' },
  { label: 'Paid', value: 'paid' },
  { label: 'Partial', value: 'partial' },
  { label: 'Overdue', value: 'overdue' },
];

const TABLE_HEADINGS: IndexTableProps['headings'] = [
  { id: 'invoice', title: heading('Invoice') },
  { id: 'status', title: heading('Status') },
  { id: 'issued', title: heading('Issued on') },
  { id: 'due', title: heading('Due date') },
  { id: 'timeUntil', title: heading('Time until due') },
  { id: 'total', title: heading('Total'), alignment: 'end' },
  { id: 'balance', title: heading('Balance due'), alignment: 'end' },
  { id: 'company', title: heading('Company') },
  { id: 'quote', title: heading('Quote') },
  { id: 'order', title: heading('Order ref') },
];

function getStatusTone(status: string): 'success' | 'warning' | 'critical' | 'info' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'partial':
      return 'warning';
    case 'overdue':
      return 'critical';
    case 'due':
      return 'info';
    default:
      return 'info';
  }
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const [queryValue, setQueryValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortSelected, setSortSelected] = useState<string[]>(['due asc']);
  const { mode, setMode } = useSetIndexFiltersMode();

  const sortOptions: IndexFiltersProps['sortOptions'] = [
    { label: 'Due date', value: 'due asc', directionLabel: 'Soonest first' },
    { label: 'Due date', value: 'due desc', directionLabel: 'Latest first' },
    { label: 'Issued date', value: 'issued desc', directionLabel: 'Newest first' },
    { label: 'Issued date', value: 'issued asc', directionLabel: 'Oldest first' },
    { label: 'Balance due', value: 'balance desc', directionLabel: 'Highest balance' },
    { label: 'Balance due', value: 'balance asc', directionLabel: 'Lowest balance' },
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

  const filteredInvoices = useMemo(() => {
    let items = INVOICES;

    if (queryValue.trim()) {
      const query = queryValue.trim().toLowerCase();
      items = items.filter((invoice) => {
        const company = getCompanySummaryById(invoice.companyId);
        return [
          invoice.invoiceNumber,
          invoice.orderId ?? '',
          invoice.quoteId ?? '',
          company?.name ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      });
    }

    if (statusFilter.length > 0) {
      items = items.filter((invoice) => statusFilter.includes(invoice.status));
    }

    const sortKey = sortSelected[0];
    if (sortKey) {
      const sorted = [...items];
      switch (sortKey) {
        case 'due asc':
          sorted.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
          break;
        case 'due desc':
          sorted.sort((a, b) => new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime());
          break;
        case 'issued asc':
          sorted.sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());
          break;
        case 'issued desc':
          sorted.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
          break;
        case 'balance asc':
          sorted.sort((a, b) => a.balanceDue.amount - b.balanceDue.amount);
          break;
        case 'balance desc':
          sorted.sort((a, b) => b.balanceDue.amount - a.balanceDue.amount);
          break;
      }
      items = sorted;
    }

    return items;
  }, [queryValue, sortSelected, statusFilter]);

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(
    filteredInvoices,
    {
      resourceName,
    },
  );

  const invoiceSummary = useMemo(() => {
    const outstanding = filteredInvoices.filter((invoice) =>
      ['due', 'overdue', 'partial', 'draft'].includes(invoice.status),
    );
    const overdue = filteredInvoices.filter((invoice) => invoice.status === 'overdue');
    const paid = filteredInvoices.filter((invoice) => invoice.status === 'paid');

    const outstandingBalance = outstanding.reduce((sum, invoice) => sum + invoice.balanceDue.amount, 0);
    const overdueBalance = overdue.reduce((sum, invoice) => sum + invoice.balanceDue.amount, 0);
    const paidVolume = paid.reduce((sum, invoice) => sum + invoice.total.amount, 0);

    return {
      outstandingCount: outstanding.length,
      outstandingBalance,
      overdueCount: overdue.length,
      overdueBalance,
      paidVolume,
    };
  }, [filteredInvoices]);

  const bulkActions = [
    { content: 'Send reminder', onAction: () => {} },
    { content: 'Apply credit', onAction: () => {} },
  ];

  const promotedBulkActions = [
    { content: 'Record payment', onAction: () => {} },
  ];

  const handleRowNavigation = useCallback(
    (id: string) => {
      navigate(`/cx/invoices/${id}`);
    },
    [navigate],
  );

  const rowMarkup = filteredInvoices.map((invoice, index) => {
    const company = getCompanySummaryById(invoice.companyId);
    const tone = getStatusTone(invoice.status);

    return (
      <IndexTable.Row
        id={invoice.id}
        key={invoice.id}
        position={index}
        selected={selectedResources.includes(invoice.id)}
        onNavigation={() => handleRowNavigation(invoice.id)}
      >
        <IndexTable.Cell>
          <BlockStack gap="100">
            <Link
              dataPrimaryLink
              monochrome
              removeUnderline
              onClick={() => handleRowNavigation(invoice.id)}
            >
              <Text variant="bodyMd" fontWeight="medium">
                {invoice.invoiceNumber}
              </Text>
            </Link>
            <Text as="span" tone="subdued" variant="bodySm">
              {company?.name ?? '—'}
            </Text>
          </BlockStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={tone}>{invoice.status}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {formatDate(invoice.issuedAt)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="100" blockAlign="center">
            <Icon source={CalendarIcon} tone="subdued" />
            <Text as="span" variant="bodyMd">
              {formatDate(invoice.dueAt)}
            </Text>
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text
            as="span"
            variant="bodyMd"
            tone={invoice.status === 'overdue' ? 'critical' : undefined}
          >
            {formatTimeUntil(invoice.dueAt)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end" variant="bodyMd" fontWeight="medium">
            {formatCurrency(invoice.total.amount)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end" variant="bodyMd" tone={tone === 'critical' ? 'critical' : undefined}>
            {formatCurrency(invoice.balanceDue.amount)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {company ? (
            <Link
              monochrome
              removeUnderline
              onClick={() => navigate(`/mx/companies/${invoice.companyId}`)}
            >
              <Text as="span" variant="bodyMd">
                {company.name}
              </Text>
            </Link>
          ) : (
            <Text as="span" variant="bodyMd">
              —
            </Text>
          )}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {invoice.quoteId ?? '—'}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            {invoice.orderId ?? '—'}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Page
      title="Invoices"
      subtitle="Monitor payment status and upcoming due dates"
      primaryAction={{ content: 'Record payment', disabled: true }}
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center" wrap>
              <InlineStack gap="200" blockAlign="center" wrap>
                <Icon source={PaymentIcon} tone="subdued" />
                <BlockStack gap="050">
                  <Text as="h2" variant="headingLg">
                    Accounts receivable
                  </Text>
                  <Text tone="subdued" variant="bodySm">
                    {filteredInvoices.length} invoices in view · {invoiceSummary.outstandingCount} outstanding · {invoiceSummary.overdueCount} overdue
                  </Text>
                </BlockStack>
              </InlineStack>
              <ButtonGroup>
                <Button>Export CSV</Button>
                <Button variant="primary" disabled>
                  Send reminders
                </Button>
              </ButtonGroup>
            </InlineStack>
            <div className="KeyValueList">
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{formatCurrency(invoiceSummary.outstandingBalance)}</Text>
                <Text tone="subdued" variant="bodySm">Outstanding balance</Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{formatCurrency(invoiceSummary.overdueBalance)}</Text>
                <Text tone="subdued" variant="bodySm">Overdue balance</Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{invoiceSummary.outstandingCount}</Text>
                <Text tone="subdued" variant="bodySm">Invoices awaiting payment</Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{formatCurrency(invoiceSummary.paidVolume)}</Text>
                <Text tone="subdued" variant="bodySm">Paid in selected range</Text>
              </div>
            </div>
          </BlockStack>
        </Card>

        <Card padding="0">
          <IndexFilters
            sortOptions={sortOptions}
            sortSelected={sortSelected}
            onSortChanged={setSortSelected}
            queryValue={queryValue}
            queryPlaceholder="Search invoices by number, company, or reference"
            onQueryChange={setQueryValue}
            onQueryClear={() => setQueryValue('')}
            filters={filters}
            appliedFilters={appliedFilters}
            onClearAll={() => setStatusFilter([])}
            cancelAction={{ onAction: () => setMode(IndexFiltersMode.Default) }}
            tabs={[{ content: 'All invoices', id: 'all' }]}
            selected={0}
            onSelect={() => {}}
            mode={mode}
            setMode={setMode}
            canCreateFilters
          />

          <IndexTable
            selectable
            resourceName={resourceName}
            itemCount={filteredInvoices.length}
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
            <Icon source={AlertCircleIcon} tone="critical" />
            <Text as="p" tone="subdued">
              Overdue invoices appear at the top of the list. Recording a payment automatically updates the available
              credit for the company.
            </Text>
          </InlineStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
