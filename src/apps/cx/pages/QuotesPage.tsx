import { useCallback, useMemo, useState } from 'react';
import {
  Badge,
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  ChoiceList,
  Divider,
  Icon,
  IndexTable,
  type IndexTableProps,
  InlineStack,
  Link,
  Page,
  Popover,
  Select,
  Text,
  TextField,
} from '@shopify/polaris';
import {
  CalendarIcon,
  ContractIcon,
  FilterIcon,
  NoteIcon,
  PersonIcon,
  SearchIcon,
  StoreIcon,
} from '@shopify/polaris-icons';
import { useNavigate } from 'react-router-dom';

import {
  QUOTES,
  getCompanyById,
  getCompanyContact,
  type Quote,
} from '../../../data';
import { formatCurrency, formatDate, formatTimeUntil } from '../../../utils/formatters';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

interface LifecycleViewDefinition {
  id: 'all' | 'approvals' | 'expiring' | 'reorder' | 'expired';
  label: string;
  description: string;
  matches: (quote: Quote) => boolean;
}

const LIFECYCLE_VIEWS: LifecycleViewDefinition[] = [
  {
    id: 'all',
    label: 'All quotes',
    description: 'Everything in the pipeline',
    matches: () => true,
  },
  {
    id: 'approvals',
    label: 'Approvals needed',
    description: 'Pending buyer or finance approval',
    matches: (quote) => quote.status === 'pending_approval',
  },
  {
    id: 'expiring',
    label: 'Expiring soon',
    description: 'Pending approvals expiring within 7 days',
    matches: (quote) => quote.status === 'pending_approval' && isExpiringSoon(quote),
  },
  {
    id: 'reorder',
    label: 'Reorder',
    description: 'Approved quotes ready to convert or reorder',
    matches: (quote) => quote.status === 'approved' || quote.orderReference != null,
  },
  {
    id: 'expired',
    label: 'Expired',
    description: 'Quotes that need to be regenerated',
    matches: (quote) => quote.status === 'expired' || quote.status === 'rejected',
  },
];

const INTEGRATION_BADGE_MAP: Record<string, string> = {
  salesforce: 'SF',
  hubspot: 'HB',
  netsuite: 'NS',
  sap: 'SAP',
};

const INTEGRATION_CHOICES = [
  { label: 'Salesforce', value: 'salesforce' },
  { label: 'HubSpot', value: 'hubspot' },
  { label: 'Netsuite', value: 'netsuite' },
  { label: 'SAP', value: 'sap' },
];

const STATUS_CHOICES = [
  { label: 'Draft', value: 'draft' },
  { label: 'Pending approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Expired', value: 'expired' },
];

const TABLE_HEADINGS: IndexTableProps['headings'] = [
  { id: 'quote', title: heading('Quote') },
  { id: 'stage', title: heading('Stage') },
  { id: 'value', title: heading('Value'), alignment: 'end' },
  { id: 'location', title: heading('Ship-to location') },
  { id: 'integration', title: heading('Integration') },
  { id: 'actions', title: heading('Actions') },
];

const SORT_OPTIONS = [
  { label: 'Expiration · Soonest first', value: 'expires asc' },
  { label: 'Expiration · Latest first', value: 'expires desc' },
  { label: 'Created · Newest first', value: 'created desc' },
  { label: 'Created · Oldest first', value: 'created asc' },
  { label: 'Value · High to low', value: 'total desc' },
  { label: 'Value · Low to high', value: 'total asc' },
];

const resourceName = {
  singular: 'quote',
  plural: 'quotes',
};

export function QuotesPage() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [activeLifecycle, setActiveLifecycle] = useState<LifecycleViewDefinition['id']>('all');
  const [sortValue, setSortValue] = useState<string>('expires asc');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [integrationFilter, setIntegrationFilter] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortValue(value);
  }, []);

  const toggleFilters = useCallback(() => setFiltersOpen((current) => !current), []);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  const baseFilteredQuotes = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    return QUOTES.filter((quote) => {
      if (statusFilter.length > 0 && !statusFilter.includes(quote.status)) {
        return false;
      }

      if (
        integrationFilter.length > 0 &&
        (!quote.integrationChannel || !integrationFilter.includes(quote.integrationChannel))
      ) {
        return false;
      }

      if (normalizedQuery) {
        const company = getCompanyById(quote.companyId);
        const haystack = [
          quote.quoteNumber,
          quote.name,
          quote.purchaseOrderNumber ?? '',
          quote.salesRep ?? '',
          company?.name ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    });
  }, [integrationFilter, searchValue, statusFilter]);

  const lifecycleCounts = useMemo(() => {
    return LIFECYCLE_VIEWS.map((view) => ({
      id: view.id,
      count: baseFilteredQuotes.filter((quote) => view.matches(quote)).length,
    }));
  }, [baseFilteredQuotes]);

  const filteredQuotes = useMemo(() => {
    const lifecycle = LIFECYCLE_VIEWS.find((view) => view.id === activeLifecycle) ?? LIFECYCLE_VIEWS[0];
    const scoped = baseFilteredQuotes.filter((quote) => lifecycle.matches(quote));
    const sorted = [...scoped];

    switch (sortValue) {
      case 'expires asc':
        sorted.sort((a, b) => compareByDate(a.expiresAt, b.expiresAt));
        break;
      case 'expires desc':
        sorted.sort((a, b) => compareByDate(b.expiresAt, a.expiresAt));
        break;
      case 'created asc':
        sorted.sort((a, b) => compareByDate(a.createdAt, b.createdAt));
        break;
      case 'created desc':
        sorted.sort((a, b) => compareByDate(b.createdAt, a.createdAt));
        break;
      case 'total asc':
        sorted.sort((a, b) => a.total.amount - b.total.amount);
        break;
      case 'total desc':
        sorted.sort((a, b) => b.total.amount - a.total.amount);
        break;
      default:
        break;
    }

    return sorted;
  }, [activeLifecycle, baseFilteredQuotes, sortValue]);

  const quoteSummary = useMemo(() => {
    const summary = {
      totalValue: 0,
      pendingApprovalCount: 0,
      expiringSoonCount: 0,
      draftCount: 0,
      awaitingOrderCount: 0,
    };

    filteredQuotes.forEach((quote) => {
      summary.totalValue += quote.total.amount;
      if (quote.status === 'pending_approval') {
        summary.pendingApprovalCount += 1;
        if (isExpiringSoon(quote)) {
          summary.expiringSoonCount += 1;
        }
      }

      if (quote.status === 'draft') {
        summary.draftCount += 1;
      }

      if (quote.status === 'approved' && !quote.orderReference) {
        summary.awaitingOrderCount += 1;
      }
    });

    return summary;
  }, [filteredQuotes]);

  const viewCountsById = useMemo(() => {
    const lookup = new Map(lifecycleCounts.map(({ id, count }) => [id, count] as const));
    return lookup;
  }, [lifecycleCounts]);

  const popoverMarkup = (
    <Popover
      active={filtersOpen}
      autofocusTarget="first-node"
      fullWidth
      onClose={closeFilters}
      preferredAlignment="left"
      activator={
        <Button icon={FilterIcon} onClick={toggleFilters} accessibilityLabel="Add filters">
          Filters
        </Button>
      }
    >
      <Card sectioned>
        <BlockStack gap="300">
          <BlockStack gap="150">
            <Text variant="bodyMd" fontWeight="medium">
              Quote status
            </Text>
            <ChoiceList
              allowMultiple
              selected={statusFilter}
              choices={STATUS_CHOICES}
              onChange={setStatusFilter}
            />
          </BlockStack>
          <BlockStack gap="150">
            <Text variant="bodyMd" fontWeight="medium">
              Integration
            </Text>
            <ChoiceList
              allowMultiple
              selected={integrationFilter}
              choices={INTEGRATION_CHOICES}
              onChange={setIntegrationFilter}
            />
          </BlockStack>
          {(statusFilter.length > 0 || integrationFilter.length > 0) && (
            <Button
              variant="tertiary"
              tone="subdued"
              onClick={() => {
                setStatusFilter([]);
                setIntegrationFilter([]);
              }}
            >
              Clear filters
            </Button>
          )}
        </BlockStack>
      </Card>
    </Popover>
  );

  return (
    <Page title="Quote workspace" subtitle="Track quote approvals, expiry risk, and conversion momentum">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center" wrap>
              <InlineStack gap="200" blockAlign="center" wrap>
                <Icon source={ContractIcon} tone="subdued" />
                <BlockStack gap="050">
                  <Text as="h2" variant="headingLg">
                    Pipeline snapshot
                  </Text>
                  <InlineStack gap="150" blockAlign="center" wrap>
                    <Badge tone="attention" size="small">
                      {quoteSummary.pendingApprovalCount} approvals needed
                    </Badge>
                    <Badge tone={quoteSummary.expiringSoonCount ? 'critical' : 'subdued'} size="small">
                      {quoteSummary.expiringSoonCount} expiring soon
                    </Badge>
                    <Badge tone="success" size="small">
                      {quoteSummary.awaitingOrderCount} ready to convert
                    </Badge>
                  </InlineStack>
                </BlockStack>
              </InlineStack>
              <InlineStack gap="150" blockAlign="center" wrap>
                <Button variant="tertiary" tone="subdued" onClick={() => navigate('/cx/history')}>
                  History
                </Button>
                <Button accessibilityLabel="Export visible quotes" disabled={filteredQuotes.length === 0}>
                  Export view
                </Button>
                <Button variant="primary" disabled>
                  Start quote
                </Button>
              </InlineStack>
            </InlineStack>
            <Divider />
            <div className="KeyValueList">
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{formatCurrency(quoteSummary.totalValue)}</Text>
                <Text tone="subdued" variant="bodySm">
                  Total value in view
                </Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{quoteSummary.pendingApprovalCount}</Text>
                <Text tone="subdued" variant="bodySm">
                  Pending approvals
                </Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{quoteSummary.expiringSoonCount}</Text>
                <Text tone="subdued" variant="bodySm">
                  Expiring in 7 days
                </Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{quoteSummary.awaitingOrderCount}</Text>
                <Text tone="subdued" variant="bodySm">
                  Approved — awaiting order
                </Text>
              </div>
              <div className="KeyValueList__Item">
                <Text variant="headingLg">{quoteSummary.draftCount}</Text>
                <Text tone="subdued" variant="bodySm">
                  Draft quotes
                </Text>
              </div>
            </div>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <div className="QuoteFiltersBar">
              <div className="QuoteFiltersBar__Controls">
                <TextField
                  label="Search quotes"
                  labelHidden
                  value={searchValue}
                  onChange={handleSearchChange}
                  autoComplete="off"
                  placeholder="Search by quote number, company, or PO"
                  prefix={<Icon source={SearchIcon} tone="subdued" />}
                />
                <Select
                  label="Sort quotes"
                  labelHidden
                  options={SORT_OPTIONS}
                  value={sortValue}
                  onChange={handleSortChange}
                />
                {popoverMarkup}
              </div>
            </div>

            <div className="QuoteLifecycleChips">
              <ButtonGroup segmented>
                {LIFECYCLE_VIEWS.map((view) => {
                  const count = viewCountsById.get(view.id) ?? 0;
                  return (
                    <Button
                      key={view.id}
                      pressed={activeLifecycle === view.id}
                      onClick={() => setActiveLifecycle(view.id)}
                    >
                      <InlineStack gap="100" blockAlign="center">
                        <Text as="span">{view.label}</Text>
                        <Badge tone="subdued" size="small" className="QuoteLifecycleChip__Badge">
                          {count}
                        </Badge>
                      </InlineStack>
                    </Button>
                  );
                })}
              </ButtonGroup>
            </div>

            <IndexTable
              resourceName={resourceName}
              itemCount={filteredQuotes.length}
              headings={TABLE_HEADINGS}
              selectable={false}
              stickyHeader
            >
              {filteredQuotes.map((quote, index) => {
                const company = getCompanyById(quote.companyId);
                const requester = quote.requesterId
                  ? getCompanyContact(quote.companyId, quote.requesterId)
                  : undefined;
                const location = getPrimaryLocationForQuote(quote);
                const stageMeta = getStageMeta(quote);
                const integrationBadge = quote.integrationChannel
                  ? INTEGRATION_BADGE_MAP[quote.integrationChannel] ?? 'INT'
                  : undefined;

                const handleNavigate = () => navigate(`/cx/quotes/${quote.id}`);
                const primaryAction = getPrimaryAction(quote);
                const handlePrimaryAction = () => {
                  navigate(primaryAction.to);
                };

                return (
                  <IndexTable.Row id={quote.id} key={quote.id} position={index}>
                    <IndexTable.Cell>
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center" wrap>
                          <Link
                            dataPrimaryLink
                            monochrome
                            removeUnderline
                            onClick={handleNavigate}
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
                      <BlockStack gap="075" className="QuoteRowStage">
                        <Badge tone={stageMeta.tone}>{stageMeta.label}</Badge>
                        <Text variant="bodySm" tone="subdued">
                          {stageMeta.helper}
                        </Text>
                        <InlineStack gap="100" blockAlign="center">
                          <Icon source={CalendarIcon} tone="subdued" />
                          <Text variant="bodySm" tone="subdued">
                            {quote.expiresAt ? `Expires ${formatDate(quote.expiresAt)}` : 'No expiration'} ·{' '}
                            {formatTimeUntil(quote.expiresAt)}
                          </Text>
                        </InlineStack>
                      </BlockStack>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <BlockStack gap="075" align="end">
                        <Text variant="headingSm">{formatCurrency(quote.total.amount)}</Text>
                        <InlineStack gap="100" blockAlign="center">
                          {quote.purchaseOrderNumber ? (
                            <Badge tone="subdued" size="small">
                              {quote.purchaseOrderNumber}
                            </Badge>
                          ) : (
                            <Text tone="subdued" variant="bodySm">
                              No PO
                            </Text>
                          )}
                        </InlineStack>
                        <Text tone="subdued" variant="bodySm">
                          {quote.salesRep ? `Rep: ${quote.salesRep}` : 'Sales rep unassigned'}
                        </Text>
                      </BlockStack>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <BlockStack gap="075">
                        <InlineStack gap="100" blockAlign="center">
                          <Badge tone="subdued" size="small">
                            {location?.code ?? location?.name ?? 'Primary'}
                          </Badge>
                          <Text tone="subdued" variant="bodySm">
                            {location?.name ?? 'Default location'}
                          </Text>
                        </InlineStack>
                        <Text tone="subdued" variant="bodySm">
                          Requester: {requester ? `${requester.firstName} ${requester.lastName}` : '—'}
                        </Text>
                      </BlockStack>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <InlineStack gap="100" blockAlign="center">
                        {integrationBadge ? (
                          <span className="integration-pill">{integrationBadge}</span>
                        ) : (
                          <Icon source={StoreIcon} tone="subdued" />
                        )}
                        <Text as="span" variant="bodyMd">
                          {quote.integrationChannel ? quote.integrationChannel : 'Manual'}
                        </Text>
                      </InlineStack>
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                      <div className="QuoteRowActions">
                        <InlineStack gap="100" blockAlign="center">
                          <Button size="slim" onClick={handlePrimaryAction} variant={primaryAction.variant}>
                            {primaryAction.label}
                          </Button>
                          <Button size="slim" onClick={handleNavigate} variant="tertiary">
                            View details
                          </Button>
                        </InlineStack>
                      </div>
                    </IndexTable.Cell>
                  </IndexTable.Row>
                );
              })}
            </IndexTable>
          </BlockStack>
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

function heading(label: string) {
  return (
    <Text as="span" variant="bodySm" tone="subdued" fontWeight="medium">
      {label}
    </Text>
  );
}

function isExpiringSoon(quote: Quote) {
  if (!quote.expiresAt) return false;
  const diff = new Date(quote.expiresAt).getTime() - Date.now();
  const daysUntil = Math.ceil(diff / MS_PER_DAY);
  return daysUntil >= 0 && daysUntil <= 7;
}

function compareByDate(a?: string, b?: string) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(a).getTime() - new Date(b).getTime();
}

function getStageMeta(quote: Quote) {
  switch (quote.status) {
    case 'draft':
      return {
        tone: 'info' as const,
        label: 'Draft',
        helper: 'Ready to submit for approval',
      };
    case 'pending_approval':
      return {
        tone: 'attention' as const,
        label: 'Pending approval',
        helper: 'Awaiting buyer or finance review',
      };
    case 'approved':
      return {
        tone: 'success' as const,
        label: 'Approved',
        helper: 'Convert to order or schedule payment',
      };
    case 'rejected':
      return {
        tone: 'critical' as const,
        label: 'Rejected',
        helper: 'Update pricing or resend for approval',
      };
    case 'expired':
      return {
        tone: 'critical' as const,
        label: 'Expired',
        helper: 'Needs refresh to extend expiration',
      };
    default:
      return {
        tone: 'info' as const,
        label: capitalizeStatus(quote.status),
        helper: 'Track quote progression',
      };
  }
}

function capitalizeStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/(^|\s)\S/g, (char) => char.toUpperCase());
}

function getPrimaryAction(quote: Quote) {
  switch (quote.status) {
    case 'pending_approval':
      return { label: 'Start approval', variant: 'primary' as const, to: `/cx/quotes/${quote.id}/approve` };
    case 'approved':
      return {
        label: quote.orderReference ? 'View order' : 'View quote',
        variant: 'secondary' as const,
        to: quote.orderReference ? '/cx/orders' : `/cx/quotes/${quote.id}`,
      };
    case 'draft':
      return { label: 'Open draft', variant: 'secondary' as const, to: `/cx/quotes/${quote.id}` };
    case 'expired':
    case 'rejected':
      return { label: 'Review quote', variant: 'secondary' as const, to: `/cx/quotes/${quote.id}` };
    default:
      return { label: 'View quote', variant: 'secondary' as const, to: `/cx/quotes/${quote.id}` };
  }
}

function getPrimaryLocationForQuote(quote: Quote) {
  const company = getCompanyById(quote.companyId);
  if (!company) return undefined;

  const requesterLocationId = quote.requesterId
    ? getCompanyContact(quote.companyId, quote.requesterId)?.locationIds?.[0]
    : undefined;

  if (requesterLocationId) {
    const match = company.locations.find((location) => location.id === requesterLocationId);
    if (match) return match;
  }

  const defaultShipping = company.locations.find((location) => location.isDefaultShipping);
  if (defaultShipping) return defaultShipping;

  return company.locations[0];
}
