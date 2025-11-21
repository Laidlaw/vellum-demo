import { useState } from 'react';
import { Badge, BlockStack, Card, Divider, InlineStack, Page, Scrollable, Tabs, Text } from '@shopify/polaris';

type BlueprintLaneId = 'financeFrontstage' | 'internalBackstage' | 'supportingProcesses';

type BlueprintPhaseId =
  | 'onboarding'
  | 'bulkManagement'
  | 'invoiceReview'
  | 'shippingFulfillment'
  | 'paymentExecution';

interface BlueprintLane {
  id: BlueprintLaneId;
  label: string;
  description: string;
}

interface BlueprintCell {
  phaseId: BlueprintPhaseId;
  laneId: BlueprintLaneId;
  title: string;
  bullets: string[];
}

const lanes: BlueprintLane[] = [
  {
    id: 'financeFrontstage',
    label: 'Finance in customer admin UI',
    description: 'What the finance stakeholder sees and does in the UI.',
  },
  {
    id: 'internalBackstage',
    label: 'Backstage systems & data',
    description: 'Workflows in billing, pricing, inventory, and approvals.',
  },
  {
    id: 'supportingProcesses',
    label: 'Supporting operations',
    description: 'Logistics, banking, and exception handling around each step.',
  },
];

const phases: { id: BlueprintPhaseId; label: string; intent: string }[] = [
  {
    id: 'onboarding',
    label: 'Onboarding & setup',
    intent:
      'Get a new B2B customer configured so that quotes, invoices, and payments can flow without manual clean-up.',
  },
  {
    id: 'bulkManagement',
    label: 'Bulk actions',
    intent:
      'Maintain payment terms, credit, and contacts across many customers or locations without touching each one.',
  },
  {
    id: 'invoiceReview',
    label: 'Invoice review & approval',
    intent:
      'Check specific invoice objects (and their prices/inventory) before releasing orders into fulfillment and AR.',
  },
  {
    id: 'shippingFulfillment',
    label: 'Shipping & delivery',
    intent: 'Ensure approved inventory gets shipped, tracked, and reconciled against the right invoices.',
  },
  {
    id: 'paymentExecution',
    label: 'Payment decisions',
    intent:
      'Decide when and how to pay, capture discounts, and keep exposure within credit limits while avoiding service risk.',
  },
];

const cells: BlueprintCell[] = [
  {
    phaseId: 'onboarding',
    laneId: 'financeFrontstage',
    title: 'Configure new customer',
    bullets: [
      'Create company, billing profile, and locations in customer admin.',
      'Set default payment terms (e.g., Net 30 vs. due on receipt).',
      'Capture tax IDs and exemption certificates for finance compliance.',
      'Nominate finance approvers and accounts payable contacts.',
    ],
  },
  {
    phaseId: 'onboarding',
    laneId: 'internalBackstage',
    title: 'Align master data & controls',
    bullets: [
      'Link company to pricing rules, discount tiers, and tax engine.',
      'Define credit limit and risk flags pulled from underwriting tools.',
      'Map company locations to inventory nodes for fulfillment routing.',
      'Enable audit logging for changes to payment terms and credit.',
    ],
  },
  {
    phaseId: 'onboarding',
    laneId: 'supportingProcesses',
    title: 'External coordination',
    bullets: [
      'Sync AR and GL accounts in the accounting system.',
      'Share welcome and onboarding checklist with customer stakeholders.',
      'Confirm remittance instructions (bank accounts, references, portals).',
    ],
  },
  {
    phaseId: 'bulkManagement',
    laneId: 'financeFrontstage',
    title: 'Run bulk updates',
    bullets: [
      'Filter customers by segment, risk, or region.',
      'Apply new payment terms or early-pay discounts in bulk.',
      'Batch-adjust credit limits after quarterly reviews.',
      'Export affected accounts for offline sign-off if needed.',
    ],
  },
  {
    phaseId: 'bulkManagement',
    laneId: 'internalBackstage',
    title: 'Policy & rules engine',
    bullets: [
      'Recalculate exposure, available credit, and dunning state per account.',
      'Propagate new terms into quote and invoice generation templates.',
      'Queue notifications to sales and CX about account-level changes.',
    ],
  },
  {
    phaseId: 'bulkManagement',
    laneId: 'supportingProcesses',
    title: 'Change governance',
    bullets: [
      'Capture approvals for policy-wide changes (e.g., Net 30 to Net 15).',
      'Coordinate with treasury on expected cash-flow impact.',
      'Update internal runbooks for CX and collections teams.',
    ],
  },
  {
    phaseId: 'invoiceReview',
    laneId: 'financeFrontstage',
    title: 'Inspect invoice & line items',
    bullets: [
      'Open a specific invoice from the customer admin UI.',
      'Drill into attached price objects (list price, discounts, fees).',
      'Check linked inventory items and available-to-ship quantities.',
      'Approve, partially approve, or reject the invoice before fulfillment.',
    ],
  },
  {
    phaseId: 'invoiceReview',
    laneId: 'internalBackstage',
    title: 'Connect invoice, price, and inventory objects',
    bullets: [
      'Resolve invoice lines to price books and contract terms.',
      'Validate that inventory allocations exist for each line item.',
      'Update approval status and lock prices once finance approves.',
      'Emit events for downstream systems (fulfillment, AR, analytics).',
    ],
  },
  {
    phaseId: 'invoiceReview',
    laneId: 'supportingProcesses',
    title: 'Exception handling',
    bullets: [
      'Route pricing disputes to sales or revenue ops.',
      'Flag stock-outs or substitutions to logistics teams.',
      'Coordinate revised POs or credit memos when needed.',
    ],
  },
  {
    phaseId: 'shippingFulfillment',
    laneId: 'financeFrontstage',
    title: 'Control shipment release',
    bullets: [
      'See which approved invoices are ready to ship.',
      'Hold or release shipments based on credit utilization and risk.',
      'Monitor partial shipments and remaining backorders per invoice.',
      'Confirm delivery milestones before final payment is triggered.',
    ],
  },
  {
    phaseId: 'shippingFulfillment',
    laneId: 'internalBackstage',
    title: 'Fulfillment orchestration',
    bullets: [
      'Send release signals to WMS or 3PL once approval is complete.',
      'Associate shipment IDs and tracking numbers back to invoices.',
      'Update delivered quantities and reconcile against ordered amounts.',
    ],
  },
  {
    phaseId: 'shippingFulfillment',
    laneId: 'supportingProcesses',
    title: 'Logistics & delivery',
    bullets: [
      'Generate shipping documentation and customs paperwork as needed.',
      'Surface delivery exceptions (damages, delays) back into admin UI.',
      'Coordinate re-shipments, returns, or credits when delivery fails.',
    ],
  },
  {
    phaseId: 'paymentExecution',
    laneId: 'financeFrontstage',
    title: 'Decide when and how to pay',
    bullets: [
      'View upcoming and overdue invoices across customers and locations.',
      'Group invoices into pay runs based on due dates and discounts.',
      'Choose payment rails (ACH, wire, card, internal credit) per invoice.',
      'Schedule payments to align with cash forecasts and approvals.',
    ],
  },
  {
    phaseId: 'paymentExecution',
    laneId: 'internalBackstage',
    title: 'Payment orchestration',
    bullets: [
      'Calculate discount eligibility and late-fee accruals.',
      'Send payment instructions to banking or PSP integrations.',
      'Post settlements back to AR and update balances.',
      'Emit webhooks for customer-facing payment confirmations.',
    ],
  },
  {
    phaseId: 'paymentExecution',
    laneId: 'supportingProcesses',
    title: 'Risk & compliance',
    bullets: [
      'Run sanctions or high-risk checks where required.',
      'Coordinate with collections on chronically late accounts.',
      'Feed payment behavior into updated credit policies.',
    ],
  },
];

type CxCoverageLevel = 'strong' | 'partial' | 'missing';

const cxCoverageByCell: Record<
  `${BlueprintPhaseId}:${BlueprintLaneId}`,
  { level: CxCoverageLevel; painPoints?: string[] }
> = {
  'onboarding:financeFrontstage': {
    level: 'partial',
    painPoints: [
      'No explicit onboarding flow – settings are scattered across Company, Locations, and Team.',
      'Approver roles are implied but not clearly modeled as “who can approve what, and for which locations”.',
    ],
  },
  'onboarding:internalBackstage': {
    level: 'missing',
    painPoints: [
      'Backstage systems are implied but not surfaced as objects – finance can’t see which rules or services are in play.',
    ],
  },
  'onboarding:supportingProcesses': {
    level: 'partial',
    painPoints: [
      'Remittance details appear in freeform notes instead of a structured, reusable payment profile.',
    ],
  },
  'bulkManagement:financeFrontstage': {
    level: 'missing',
    painPoints: [
      'Invoices and quotes screens are list-first with per-row actions – there is no real bulk finance workflow.',
    ],
  },
  'bulkManagement:internalBackstage': {
    level: 'missing',
  },
  'bulkManagement:supportingProcesses': {
    level: 'missing',
  },
  'invoiceReview:financeFrontstage': {
    level: 'partial',
    painPoints: [
      'Invoice details surface totals and line items, but not the underlying “price objects” (contract vs. spot, surcharges, fees).',
      'Inventory availability is not visible at the invoice line item level, so approval decisions lack fulfillment context.',
      'Approval actions are split between quote approval and invoice payment, rather than a clear invoice approval stage.',
    ],
  },
  'invoiceReview:internalBackstage': {
    level: 'missing',
    painPoints: [
      'The CX UI hints at relationships (quote → order → invoice) but does not expose the underlying objects or events explicitly.',
    ],
  },
  'invoiceReview:supportingProcesses': {
    level: 'missing',
  },
  'shippingFulfillment:financeFrontstage': {
    level: 'missing',
    painPoints: [
      'Shipping and delivery are abstract – the finance user cannot see “ready to ship”, “in transit”, or “delivered” per invoice.',
    ],
  },
  'shippingFulfillment:internalBackstage': {
    level: 'missing',
  },
  'shippingFulfillment:supportingProcesses': {
    level: 'missing',
  },
  'paymentExecution:financeFrontstage': {
    level: 'partial',
    painPoints: [
      'Invoices and Payment pages treat “record payment” as a discrete action, not as part of a pay-run decision workflow.',
      'It is hard to see how a payment decision will affect available credit and upcoming obligations across locations.',
    ],
  },
  'paymentExecution:internalBackstage': {
    level: 'missing',
  },
  'paymentExecution:supportingProcesses': {
    level: 'missing',
  },
};

export function FinanceBlueprintPage() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'cxGaps'>('overview');

  return (
    <Page
      title="Finance service blueprint"
      subtitle="Map the finance stakeholder’s jobs in the customer admin UI, from onboarding through approvals, fulfillment, and payment."
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              This view stays outside the shopper storefront, merchant (MX), and customer (CX) apps. It documents the
              finance journey in the customer admin UI as a service blueprint with lanes for frontstage, backstage, and
              supporting processes.
            </Text>
            <InlineStack gap="200" wrap>
              <Badge tone="info">Onboarding</Badge>
              <Badge tone="info">Bulk actions</Badge>
              <Badge tone="info">Invoice review & approvals</Badge>
              <Badge tone="info">Shipping & delivery</Badge>
              <Badge tone="info">Payment decisions</Badge>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <Tabs
            tabs={[
              { id: 'overview', content: 'Blueprint overview', panelID: 'overview-panel' },
              { id: 'cxGaps', content: 'CX coverage & gaps', panelID: 'cx-gaps-panel' },
            ]}
            selected={selectedTab === 'overview' ? 0 : 1}
            onSelect={(index) => setSelectedTab(index === 0 ? 'overview' : 'cxGaps')}
          >
            {selectedTab === 'overview' ? (
              <Scrollable shadow style={{ maxHeight: '70vh' }}>
                <div style={{ minWidth: 960 }}>
                  <BlockStack gap="200">
                    <InlineStack gap="200" align="space-between">
                      {phases.map((phase) => (
                        <BlockStack key={phase.id} gap="050" align="start">
                          <Text as="h3" variant="headingSm">
                            {phase.label}
                          </Text>
                          <Text tone="subdued" variant="bodySm">
                            {phase.intent}
                          </Text>
                        </BlockStack>
                      ))}
                    </InlineStack>

                    <Divider />

                    {lanes.map((lane) => (
                      <BlockStack key={lane.id} gap="150">
                        <InlineStack align="space-between" blockAlign="center">
                          <BlockStack gap="050">
                            <Text as="h4" variant="headingSm">
                              {lane.label}
                            </Text>
                            <Text tone="subdued" variant="bodySm">
                              {lane.description}
                            </Text>
                          </BlockStack>
                          <Badge
                            tone={
                              lane.id === 'financeFrontstage'
                                ? 'success'
                                : lane.id === 'internalBackstage'
                                  ? 'info'
                                  : 'subdued'
                            }
                          >
                            {lane.id === 'financeFrontstage'
                              ? 'Line of interaction'
                              : lane.id === 'internalBackstage'
                                ? 'Behind the UI'
                                : 'Enabling services'}
                          </Badge>
                        </InlineStack>

                        <InlineStack gap="200" align="space-between">
                          {phases.map((phase) => {
                            const cell = cells.find(
                              (candidate) => candidate.phaseId === phase.id && candidate.laneId === lane.id,
                            );

                            if (!cell) {
                              return (
                                <Card key={`${lane.id}-${phase.id}`} subdued>
                                  <BlockStack gap="050">
                                    <Text variant="bodySm" tone="subdued">
                                      Not in scope
                                    </Text>
                                  </BlockStack>
                                </Card>
                              );
                            }

                            return (
                              <Card key={`${lane.id}-${phase.id}`} padding="300">
                                <BlockStack gap="100">
                                  <Text as="h5" variant="headingSm">
                                    {cell.title}
                                  </Text>
                                  <BlockStack as="ul" gap="050">
                                    {cell.bullets.map((bullet) => (
                                      <li key={bullet}>
                                        <Text as="span" variant="bodySm">
                                          {bullet}
                                        </Text>
                                      </li>
                                    ))}
                                  </BlockStack>
                                </BlockStack>
                              </Card>
                            );
                          })}
                        </InlineStack>

                        <Divider />
                      </BlockStack>
                    ))}
                  </BlockStack>
                </div>
              </Scrollable>
            ) : (
              <Scrollable shadow style={{ maxHeight: '70vh' }}>
                <div style={{ minWidth: 960 }}>
                  <BlockStack gap="300">
                    <Text as="p" variant="bodyMd">
                      This view overlays the blueprint with an assessment of how the current CX app supports each job,
                      so you can spot what feels “off” or missing before redesigning the experience without Polaris.
                    </Text>

                    {lanes.map((lane) => (
                      <BlockStack key={lane.id} gap="200">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="h4" variant="headingSm">
                            {lane.label}
                          </Text>
                          <Text tone="subdued" variant="bodySm">
                            {lane.description}
                          </Text>
                        </InlineStack>

                        {phases.map((phase) => {
                          const cell = cells.find(
                            (candidate) => candidate.phaseId === phase.id && candidate.laneId === lane.id,
                          );
                          if (!cell) return null;

                          const key = `${phase.id}:${lane.id}` as const;
                          const coverage = cxCoverageByCell[key];
                          const level: CxCoverageLevel = coverage?.level ?? 'missing';

                          const tone =
                            level === 'strong' ? 'success' : level === 'partial' ? 'warning' : 'critical';

                          return (
                            <Card key={`${lane.id}-${phase.id}`} padding="300">
                              <BlockStack gap="150">
                                <InlineStack align="space-between" blockAlign="center">
                                  <Text as="h5" variant="headingSm">
                                    {phase.label}: {cell.title}
                                  </Text>
                                  <Badge tone={tone}>
                                    {level === 'strong'
                                      ? 'Covered in CX'
                                      : level === 'partial'
                                        ? 'Partially covered'
                                        : 'Missing / implied only'}
                                  </Badge>
                                </InlineStack>
                                <BlockStack gap="050">
                                  <Text variant="bodySm" fontWeight="medium">
                                    Finance job to be done
                                  </Text>
                                  <BlockStack as="ul" gap="025">
                                    {cell.bullets.map((bullet) => (
                                      <li key={bullet}>
                                        <Text as="span" variant="bodySm">
                                          {bullet}
                                        </Text>
                                      </li>
                                    ))}
                                  </BlockStack>
                                </BlockStack>
                                {coverage?.painPoints && coverage.painPoints.length > 0 ? (
                                  <BlockStack gap="050">
                                    <Text variant="bodySm" fontWeight="medium">
                                      Where the current CX feels wrong
                                    </Text>
                                    <BlockStack as="ul" gap="025">
                                      {coverage.painPoints.map((point) => (
                                        <li key={point}>
                                          <Text as="span" variant="bodySm" tone="subdued">
                                            {point}
                                          </Text>
                                        </li>
                                      ))}
                                    </BlockStack>
                                  </BlockStack>
                                ) : null}
                              </BlockStack>
                            </Card>
                          );
                        })}
                      </BlockStack>
                    ))}
                  </BlockStack>
                </div>
              </Scrollable>
            )}
          </Tabs>
        </Card>
      </BlockStack>
    </Page>
  );
}
