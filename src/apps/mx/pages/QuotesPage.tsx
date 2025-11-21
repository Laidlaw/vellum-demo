import { useMemo, useState } from 'react';
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
  InlineGrid,
  Link,
  Page,
  Text,
  TextField,
  Tooltip,
  useIndexResourceState,
} from '@shopify/polaris';
import { StoreIcon, AlertTriangleIcon, ViewIcon, EmailFollowUpIcon, ChartHistogramGrowthIcon } from '@shopify/polaris-icons';
import { useNavigate } from 'react-router-dom';

import {
  INVOICES,
  QUOTES,
  getCompanyById,
  getCompanySummaryById,
  type Company,
  type Invoice,
  type Quote,
} from '../../../data';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const resourceName = {
  singular: 'quote',
  plural: 'quotes',
};

const TABLE_HEADINGS: IndexTableProps['headings'] = [
  { id: 'quote', title: heading('Quote #') },
  { id: 'customer', title: heading('Customer') },
  { id: 'amount', title: heading('Amount') },
  { id: 'system', title: heading('System') },
  { id: 'tax', title: heading('Tax status') },
  { id: 'issue', title: heading('Issue state') },
  { id: 'status', title: heading('Status') },
  { id: 'notes', title: heading('Notes') },
  { id: 'detail', title: heading('Actions') },
];

interface MerchantQuoteRowMeta {
  quote: Quote;
  company: Company | undefined;
  currencyCode: string;
  totalAmount: number;
  currencyDisplay: string;
  systemLabel: string;
  systemPill: string | null;
  taxLabel: string;
  taxTone: 'success' | 'subdued' | 'critical' | 'attention';
  taxProgress?: 'incomplete' | 'partiallyComplete' | 'complete';
  taxAmountDisplay: string;
  statusLabel: string;
  statusTone: 'success' | 'subdued' | 'critical' | 'attention';
  statusProgress?: 'incomplete' | 'partiallyComplete' | 'complete';
  statusDetail: string;
}

type AgingFilterId = 'all' | 'current' | 'd0to30' | 'd31to60' | 'd61to90' | 'd90plus';

export function QuotesPage() {
  const navigate = useNavigate();
  const [sortSelected] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<'gentle' | 'firm' | 'final'>('gentle');
  const [nudgeMessage, setNudgeMessage] = useState(() => buildNudgeBody('gentle'));
  const [agingFilter, setAgingFilter] = useState<AgingFilterId>('all');

  const rows: MerchantQuoteRowMeta[] = useMemo(
    () =>
      QUOTES.map((quote, index) => {
        const company = getCompanyById(quote.companyId);
        const currencyCode = getDemoCurrencyCodeForIndex(index);
        const totalAmount = quote.total.amount;
        const currencyDisplay = formatAmountWithCurrency(currencyCode, totalAmount);

        const systemMeta = getSystemMeta(quote, index);
        const taxMeta = getTaxStatusMeta(quote, company, currencyCode);
        const statusMeta = getStatusMeta(quote);

        return {
          quote,
          company,
          currencyCode,
          totalAmount,
          currencyDisplay,
          systemLabel: systemMeta.label,
          systemPill: systemMeta.pill,
          taxLabel: taxMeta.label,
          taxTone: taxMeta.tone,
          taxProgress: taxMeta.progress,
          taxAmountDisplay: taxMeta.amountDisplay,
          statusLabel: statusMeta.label,
          statusTone: statusMeta.tone,
          statusProgress: statusMeta.progress,
          statusDetail: statusMeta.detail,
        };
      }),
    [],
  );

  const filteredRows = useMemo(() => {
    if (agingFilter === 'all') {
      return rows;
    }

    return rows.filter((row) => getAgingBucketIdForQuote(row.quote) === agingFilter);
  }, [agingFilter, rows]);

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(
    filteredRows,
    {
      resourceName,
    },
  );

  const { itemCount, overdueCount } = useMemo(() => {
    let overdue = 0;

    filteredRows.forEach((row) => {
      if (row.statusTone === 'critical') {
        overdue += 1;
      }
    });

    return {
      itemCount: filteredRows.length,
      overdueCount: overdue,
    };
  }, [filteredRows]);

  const metrics = useMemo(() => {
    const activeCount = rows.length;
    const taxExemptCount = rows.filter((row) => row.taxLabel === 'Tax Exempt').length;
    const compliantCount = rows.filter((row) => row.statusTone !== 'critical').length;
    const baseScore = activeCount ? Math.round((compliantCount / activeCount) * 100) : 100;
    const complianceScore = Math.min(100, baseScore + 8);

    return {
      activeCount,
      taxExemptCount,
      complianceScore,
    };
  }, [rows]);

  const aging = useMemo(() => {
    const buckets = {
      current: { count: 0, total: 0 },
      d0to30: { count: 0, total: 0 },
      d31to60: { count: 0, total: 0 },
      d61to90: { count: 0, total: 0 },
      d90plus: { count: 0, total: 0 },
    };

    rows.forEach((row) => {
      const amount = row.quote.total.amount;
      const bucketId = getAgingBucketIdForQuote(row.quote);

      switch (bucketId) {
        case 'current':
          buckets.current.count += 1;
          buckets.current.total += amount;
          break;
        case 'd0to30':
          buckets.d0to30.count += 1;
          buckets.d0to30.total += amount;
          break;
        case 'd31to60':
          buckets.d31to60.count += 1;
          buckets.d31to60.total += amount;
          break;
        case 'd61to90':
          buckets.d61to90.count += 1;
          buckets.d61to90.total += amount;
          break;
        case 'd90plus':
          buckets.d90plus.count += 1;
          buckets.d90plus.total += amount;
          break;
        default:
          break;
      }
    });

    const totalOutstanding =
      buckets.current.total +
      buckets.d0to30.total +
      buckets.d31to60.total +
      buckets.d61to90.total +
      buckets.d90plus.total;

    const currentNotDue = buckets.current.total;
    const overdue1to60 = buckets.d0to30.total + buckets.d31to60.total;
    const critical60Plus = buckets.d61to90.total + buckets.d90plus.total;

    return {
      buckets,
      totalOutstanding,
      currentNotDue,
      overdue1to60,
      critical60Plus,
    };
  }, [rows]);

  const invoiceIdByQuoteId = useMemo(() => {
    const map = new Map<string, string>();
    INVOICES.forEach((invoice) => {
      if (invoice.quoteId) {
        map.set(invoice.quoteId, invoice.id);
      }
    });
    return map;
  }, []);

  const overdueInstallmentInvoices = useMemo(() => {
    const now = new Date('2024-09-12T12:00:00Z');

    return INVOICES.filter((invoice) => {
      const hasPlan =
        invoice.paymentTerms.type === 'installments' || (invoice.paymentSchedule?.length ?? 0) > 0;
      if (!hasPlan) return false;

      const due = new Date(invoice.dueAt);
      const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

      return diffDays > 0;
    }).map((invoice) => {
      const company = getCompanySummaryById(invoice.companyId);
      const bucketLabel = getInvoiceBucketLabel(invoice);

      return {
        invoice,
        companyName: company?.name ?? '—',
        nextDueDisplay: formatDate(invoice.dueAt),
        bucketLabel,
        remainingAmountDisplay: formatCurrency(invoice.balanceDue.amount),
        currencyCode: invoice.total.currencyCode,
      };
    });
  }, []);

  const bulkActions: IndexTableProps['bulkActions'] = [];
  const promotedBulkActions: IndexTableProps['promotedBulkActions'] = [
    { content: 'Approve' },
    { content: 'Nudge' },
    { content: 'Send payment links' },
  ];

  const handleViewInvoiceDetail = (quoteId: string) => {
    const invoiceId = invoiceIdByQuoteId.get(quoteId) ?? quoteId;
    navigate(`/mx/invoices/${invoiceId}`);
  };

  const handleViewCompanyDetail = (companyId: string) => {
    navigate(`/mx/companies/${companyId}`);
  };

  return (
    <Page fullWidth titleHidden>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center" wrap>
          <InlineStack gap="200" blockAlign="center">
            <Icon source={StoreIcon} tone="subdued" />
            <Text as="h1" variant="headingLg">
              Invoices
            </Text>
          </InlineStack>
          <ButtonGroup variant="segmented">
            <Button>Export PDF</Button>
            <Button>Export CSV</Button>
            <Button>Generate Report</Button>
          </ButtonGroup>
        </InlineStack>

        <InlineGrid gap="400" columns={3}>
          <Card>
            
              <Text variant="bodySm" tone="subdued">
                Active invoices
              </Text>
              <Text variant="headingXl" as="p">
                {metrics.activeCount.toLocaleString()}
              </Text>
              <Text variant="bodySm" tone="subdued">
                This month
              </Text>
              <InlineStack gap="100" blockAlign="center">
                <Icon source={ChartHistogramGrowthIcon} tone="success" />
                <Text variant="bodySm" tone="success">
                  12% vs last month
                </Text>
              </InlineStack>
            
          </Card>

          <Card>
            
              <Text variant="bodySm" tone="subdued">
                Tax-exempt transactions
              </Text>
              <Text variant="headingXl" as="p">
                {metrics.taxExemptCount.toLocaleString()}
              </Text>
              <Text variant="bodySm" tone="subdued">
                This month
              </Text>
            
          </Card>
          <Card>
            
              <Text variant="bodySm" tone="subdued">
                Compliance score
              </Text>
              <Text variant="headingXl" as="p" tone="info">
                {metrics.complianceScore}%
              </Text>
              <Badge tone="info" progress="complete" size="small">
                Compliant
              </Badge>
            
          </Card>
        </InlineGrid>

        

        <Card padding="0">
          <IndexFilters
            sortOptions={[] as IndexFiltersProps['sortOptions']}
            sortSelected={sortSelected}
            onSortChanged={() => {}}
            queryValue=""
            queryPlaceholder="Search invoices"
            onQueryChange={() => {}}
            onQueryClear={() => {}}
            filters={[]}
            appliedFilters={[]}
            onClearAll={() => {}}
            cancelAction={{ onAction: () => {} }}
            tabs={[
              { content: 'All invoices', id: 'all' },
              { content: 'Current', id: 'current' },
              { content: '0–30 days', id: 'd0to30' },
              { content: '31–60 days', id: 'd31to60' },
              { content: '61–90 days', id: 'd61to90' },
              { content: '90+ days', id: 'd90plus' },
            ]}
            selected={
              ['all', 'current', 'd0to30', 'd31to60', 'd61to90', 'd90plus'].indexOf(agingFilter)
            }
            onSelect={(index) =>
              setAgingFilter(
                (['all', 'current', 'd0to30', 'd31to60', 'd61to90', 'd90plus'] as AgingFilterId[])[
                  index
                ],
              )
            }
            mode={IndexFiltersMode.Default}
            setMode={() => {}}
          />
          <IndexTable
            selectable
            resourceName={resourceName}
            itemCount={filteredRows.length}
            selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
            onSelectionChange={handleSelectionChange}
            bulkActions={bulkActions}
            promotedBulkActions={promotedBulkActions}
            headings={TABLE_HEADINGS}
            stickyHeader
            lastColumnSticky
          >
            {filteredRows.map((row, index) => (
              <IndexTable.Row
                id={row.quote.id}
                key={row.quote.id}
                position={index}
                selected={selectedResources.includes(row.quote.id)}
              >
                <IndexTable.Cell>
                  <BlockStack gap="050">
                    <InlineStack gap="200" blockAlign="center" wrap>
                      {row.quote.name ? (
                        <Tooltip content={row.quote.name}>
                          <Link
                            monochrome
                            removeUnderline
                            onClick={() => handleViewInvoiceDetail(row.quote.id)}
                          >
                            <Text variant="bodyMd" fontWeight="medium">
                              {row.quote.quoteNumber}
                            </Text>
                          </Link>
                        </Tooltip>
                      ) : (
                        <Link
                          monochrome
                          removeUnderline
                          onClick={() => handleViewInvoiceDetail(row.quote.id)}
                        >
                          <Text variant="bodyMd" fontWeight="medium">
                            {row.quote.quoteNumber}
                          </Text>
                        </Link>
                      )}
                    </InlineStack>
                  </BlockStack>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  {row.company ? (
                    <Link
                      monochrome
                      removeUnderline
                      onClick={() => handleViewCompanyDetail(row.company!.id)}
                    >
                      <Text as="span" variant="bodyMd">
                        {row.company.name}
                      </Text>
                    </Link>
                  ) : (
                    <Text as="span" variant="bodyMd">
                      —
                    </Text>
                  )}
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <BlockStack align="end" gap="050">
                    <InlineStack gap="050" blockAlign="center">
                      <Text as="span" variant="bodyMd" fontWeight="medium">
                        {getCurrencySymbol(row.currencyCode)} {row.currencyCode}
                      </Text>
                      <Text as="span" variant="bodyMd">
                        {row.totalAmount.toFixed(2)}
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <InlineStack gap="100" blockAlign="center">
                    {row.systemPill ? (
                      <span className="integration-pill">{row.systemPill}</span>
                    ) : (
                      <Icon source={StoreIcon} tone="subdued" />
                    )}
                    <Text as="span" variant="bodyMd">
                      {row.systemLabel}
                    </Text>
                  </InlineStack>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <BlockStack gap="050">
                    <Badge tone={row.taxTone} progress={row.taxProgress}>
                      {row.taxLabel}
                    </Badge>
                    <Text
                      as="span"
                      variant="bodySm"
                      tone="subdued"
                      fontWeight={row.taxLabel === 'Tax Applied' ? 'medium' : undefined}
                    >
                      {row.taxAmountDisplay}
                    </Text>
                  </BlockStack>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text as="span" variant="bodyMd">
                    {formatDateThisYear(row.quote.createdAt)}
                  </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <BlockStack gap="050">
                    <Badge tone={row.statusTone} progress={row.statusProgress}>
                      {row.statusLabel}
                    </Badge>
                  </BlockStack>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text
                    as="span"
                    variant="bodySm"
                    tone={row.statusLabel === 'Overdue' ? 'critical' : 'subdued'}
                  >
                    {row.statusDetail || '—'}
                  </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Button
                    size="slim"
                    variant="tertiary"
                    tone="subdued"
                    icon={ViewIcon}
                    accessibilityLabel="View invoice detail"
                    onClick={() => handleViewInvoiceDetail(row.quote.id)}
                    disabled
                  />
                  <Button
                    size="slim"
                    variant="plain"
                    tone="subdued"
                    icon={EmailFollowUpIcon}
                    accessibilityLabel="Send Pay Link"
                  >
                    Send ay link
                  </Button>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        </Card>

        
        <InlineStack align="space-between" blockAlign="center" wrap>
          <InlineStack gap="200" blockAlign="center">
            <Icon source={AlertTriangleIcon} tone="subdued" />
            <Text as="h1" variant="headingLg">
              Aged Receivables Report
            </Text>
          </InlineStack>
           <Text as="p" tone="subdued">
          Showing {itemCount} invoice{itemCount === 1 ? '' : 's'}
          {overdueCount > 0
            ? ` • ${overdueCount} at risk or overdue`
            : ' • No invoices currently at risk'}
        </Text>
          {/* <ButtonGroup variant="segmented">
            <Button>Export PDF</Button>
            <Button>Export CSV</Button>
            <Button>Generate Report</Button>
          </ButtonGroup> */}
        </InlineStack>
        <Card>
          <BlockStack gap="300">
            {/* <InlineStack gap="150" blockAlign="center">
              <Icon source={NoteIcon} tone="subdued" />
              <Text as="h2" variant="headingMd">
                Receivables summary
              </Text>
            </InlineStack> */}
            <InlineGrid gap="200" columns={4}>
              <BlockStack gap="025">
                <InlineStack gap="100" blockAlign="center">
                  <Text variant="bodySm" tone="subdued">
                    Total outstanding
                  </Text>
                  <Badge tone="subdued" size="small">
                    {metrics.activeCount} invoices
                  </Badge>
                </InlineStack>
                <Text variant="bodyMd">
                  {formatCurrency(aging.totalOutstanding)}
                </Text>
              </BlockStack>
              <BlockStack gap="025">
                <InlineStack gap="100" blockAlign="center">
                  <Text variant="bodySm" tone="subdued">
                    Current (not due)
                  </Text>
                  <Badge tone="success" size="small">
                    {aging.buckets.current.count} invoices
                  </Badge>
                </InlineStack>
                <Text variant="bodyMd" tone="success">
                  {formatCurrency(aging.currentNotDue)}
                </Text>
              </BlockStack>
              <BlockStack gap="025">
                <InlineStack gap="100" blockAlign="center">
                  <Text variant="bodySm" tone="subdued">
                    Overdue (1–60 days)
                  </Text>
                  <Badge tone="warning" size="small">
                    {aging.buckets.d0to30.count + aging.buckets.d31to60.count} invoices
                  </Badge>
                </InlineStack>
                <Text variant="bodyMd" tone="critical">
                  {formatCurrency(aging.overdue1to60)}
                </Text>
              </BlockStack>
              <BlockStack gap="025">
                <InlineStack gap="100" blockAlign="center">
                  <Text variant="bodySm" tone="subdued">
                    Critical (60+ days)
                  </Text>
                  <Badge tone="critical" size="small">
                    {aging.buckets.d61to90.count + aging.buckets.d90plus.count} invoices
                  </Badge>
                </InlineStack>
                <Text variant="bodyMd" tone="critical">
                  {formatCurrency(aging.critical60Plus)}
                </Text>
              </BlockStack>
            </InlineGrid>
          </BlockStack>
        </Card>
       
        <InlineGrid gap="400" columns={2}>
          <div style={{ gridColumn: 'span 1 ' }}>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Overdue invoice actions
                </Text>
                {overdueInstallmentInvoices.length === 0 ? (
                  <Text tone="subdued" variant="bodySm">
                    No invoices are currently overdue on a payment plan.
                  </Text>
                ) : (
                  <BlockStack gap="150">
                    <InlineGrid columns={6} gap="100">
                      <Text as="span" variant="bodySm" tone="subdued">
                        Company
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        Invoice
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        Next due
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        Bucket
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        Remaining amount
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        Currency
                      </Text>
                    </InlineGrid>
                    {overdueInstallmentInvoices.map((row) => (
                      <InlineGrid key={row.invoice.id} columns={6} gap="100">
                        <Text as="span" variant="bodyMd">
                          {row.companyName}
                        </Text>
                        <Text as="span" variant="bodyMd">
                          {row.invoice.invoiceNumber}
                        </Text>
                        <Text as="span" variant="bodyMd">
                          {row.nextDueDisplay}
                        </Text>
                        <Text as="span" variant="bodyMd">
                          {row.bucketLabel}
                        </Text>
                        <Text as="span" variant="bodyMd">
                          {row.remainingAmountDisplay}
                        </Text>
                        <Text as="span" variant="bodyMd">
                          {row.currencyCode}
                        </Text>
                      </InlineGrid>
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </div>
          <Card>
            <InlineGrid gap="300" columns={2}>
              <BlockStack >
                <Text as="h2" variant="headingMd">
                  Send payment nudges
                </Text>
                <Text variant="bodySm" tone="subdued">
                  Choose a tone and preview the SMS body before sending.
                </Text>
              
              <ChoiceList
                title="Tone"
                choices={[
                  { label: 'Gentle reminder (0–30 days)', value: 'gentle' },
                  { label: 'Firm notice (31–60 days)', value: 'firm' },
                  { label: 'Final notice (60+ days)', value: 'final' },
                ]}
                selected={[selectedTemplateId]}
                onChange={(value) => {
                  const id = (value[0] ?? 'gentle') as 'gentle' | 'firm' | 'final';
                  setSelectedTemplateId(id);
                  setNudgeMessage(buildNudgeBody(id));
                }}
              />
              </BlockStack>
          
              <BlockStack gap="100">
              <TextField
                label="SMS message"
                value={nudgeMessage}
                onChange={setNudgeMessage}
                multiline
                autoComplete="off"
              />
              <Text variant="bodySm" tone="subdued">
                Variables supported: {'{{customer_name}}'}, {'{{invoice_number}}'}, {'{{amount_due}}'},{' '}
                {'{{due_date}}'}, {'{{days_overdue}}'}.
              </Text>
              <Button variant="primary" disabled>
                Send nudges
              </Button>
              </BlockStack>
            </InlineGrid>
          </Card>
        </InlineGrid>
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

function formatDateThisYear(isoDate?: string) {
  if (!isoDate) return formatDate(isoDate);
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return formatDate(isoDate);
  date.setFullYear(2025);
  return formatDate(date.toISOString());
}

function formatAmountWithCurrency(currencyCode: string, amount: number) {
  return `${currencyCode} ${amount.toFixed(2)}`;
}

function getDemoCurrencyCodeForIndex(index: number): string {
  const codes = ['USD', 'GBP', 'USD', 'EUR', 'USD', 'CAD'];
  return codes[index % codes.length];
}

function getCurrencySymbol(currencyCode: string): string {
  switch (currencyCode) {
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    case 'EUR':
      return '€';
    case 'CAD':
      return 'C$';
    default:
      return currencyCode;
  }
}

function getAgingBucketIdForQuote(quote: Quote): AgingFilterId {
  const now = new Date('2024-08-10T12:00:00Z');
  const due = quote.expiresAt ? new Date(quote.expiresAt) : new Date(quote.createdAt);
  const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'current';
  if (diffDays <= 30) return 'd0to30';
  if (diffDays <= 60) return 'd31to60';
  if (diffDays <= 90) return 'd61to90';
  return 'd90plus';
}

function getInvoiceBucketLabel(invoice: Invoice): '30' | '60' | '90+' {
  const now = new Date('2024-09-12T12:00:00Z');
  const due = new Date(invoice.dueAt);
  const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) return '30';
  if (diffDays <= 60) return '60';
  return '90+';
}

function buildNudgeBody(templateId: 'gentle' | 'firm' | 'final') {
  switch (templateId) {
    case 'gentle':
      return (
        'Hi {{customer_name}}, just a quick reminder that invoice {{invoice_number}} for {{amount_due}} is ' +
        '{{days_overdue}} days past due. Reply if you need any help with payment.'
      );
    case 'firm':
      return (
        'Hi {{customer_name}}, invoice {{invoice_number}} for {{amount_due}} is now {{days_overdue}} days overdue. ' +
        'Please arrange payment or reply to discuss a payment plan.'
      );
    case 'final':
      return (
        'Hi {{customer_name}}, this is a final reminder for invoice {{invoice_number}} ({{amount_due}}), ' +
        'now {{days_overdue}}+ days overdue. To avoid collection activity, please pay or contact us today.'
      );
    default:
      return '';
  }
}

function KeyValue({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'attention' | 'critical';
}) {
  return (
    <BlockStack gap="025">
      <Text variant="bodySm" tone="subdued">
        {label}
      </Text>
      <Text variant="bodyMd" tone={tone}>
        {value}
      </Text>
    </BlockStack>
  );
}

function getSystemMeta(quote: Quote, index: number) {
  if (quote.integrationChannel) {
    switch (quote.integrationChannel) {
      case 'salesforce':
        return { label: 'Salesforce', pill: 'SF' };
      case 'hubspot':
        return { label: 'HubSpot', pill: 'HB' };
      case 'netsuite':
        return { label: 'NetSuite', pill: 'NS' };
      case 'sap':
        return { label: 'SAP', pill: 'SAP' };
      default:
        return { label: 'Custom integration', pill: 'INT' };
    }
  }

  const fallbackSystems = [
    { label: 'Shopify', pill: 'SH' },
    { label: 'QuickBooks', pill: 'QB' },
  ];

  const fallback = fallbackSystems[index % fallbackSystems.length];
  return fallback;
}

function getTaxStatusMeta(
  quote: Quote,
  company: Company | undefined,
  currencyCode: string,
) {
  const isExempt = company?.taxExempt || quote.taxTotal.amount === 0;
  const amountForDisplay = isExempt ? 0 : quote.taxTotal.amount;
  const amountDisplay = formatAmountWithCurrency(currencyCode, amountForDisplay);

  if (isExempt) {
    return {
      label: 'Tax Exempt',
      tone: 'success' as const,
      progress: 'complete' as const,
      amountDisplay,
    };
  }

  return {
    label: 'Tax Applied',
    tone: 'subdued' as const,
    progress: 'incomplete' as const,
    amountDisplay,
  };
}

function getStatusMeta(quote: Quote) {
  const now = new Date('2024-08-10T12:00:00Z');
  const due = quote.expiresAt ? new Date(quote.expiresAt) : new Date(quote.createdAt);
  const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

  // Approved quotes are treated as paid, regardless of timing.
  if (quote.status === 'approved') {
    return {
      label: 'Paid',
      tone: 'success' as const,
      progress: 'complete' as const,
      detail: 'Paid in full.',
    };
  }

  if (diffDays > 0) {
    const daysOverdue = diffDays;
    const unit = daysOverdue === 1 ? 'day' : 'days';
    const tone = daysOverdue > 60 ? ('critical' as const) : ('attention' as const);
    return {
      label: 'Overdue',
      tone,
      progress: 'incomplete' as const,
      detail: `Overdue by ${daysOverdue} ${unit}.`,
    };
  }

  return {
    label: 'Pending',
    tone: 'subdued' as const,
    progress: 'partiallyComplete' as const,
    detail: `Pending — due ${formatDateThisYear(quote.expiresAt)}`,
  };
}
