import type {
  Company,
  CompanyCreditSummary,
  Invoice,
  InvoiceStatus,
  PaymentTerms,
  Quote,
} from '../../data';

export type CcxRouteId =
  | 'dashboard'
  | 'companyFinanceProfile'
  | 'approvalMatrix'
  | 'invoiceOverview'
  | 'quoteConversion'
  | 'payRunPlanner'
  | 'creditExposure'
  | 'exceptions';

export interface CcxRouteDefinition {
  id: CcxRouteId;
  path: string;
  label: string;
  description: string;
}

export const CCX_ROUTE_DEFINITIONS: CcxRouteDefinition[] = [
  {
    id: 'dashboard',
    path: '/ccx',
    label: 'CX-Ray dashboard',
    description: 'Overview of the finance console and key flows.',
  },
  {
    id: 'companyFinanceProfile',
    path: '/ccx/companies/:companyId/finance',
    label: 'Company finance profile',
    description: 'Single-company view of terms, credit, tax, and remittances.',
  },
  {
    id: 'approvalMatrix',
    path: '/ccx/companies/:companyId/approvals',
    label: 'Approval matrix',
    description: 'Who can approve what, and for which scopes.',
  },
  {
    id: 'quoteConversion',
    path: '/ccx/quotes/convert',
    label: 'Quote conversion workspace',
    description: 'Stage approved quotes, verify destinations, and convert to orders.',
  },
  {
    id: 'invoiceOverview',
    path: '/ccx/companies/:companyId/invoices',
    label: 'Invoice overview',
    description: 'Company-scoped list of invoices with drill-down into review.',
  },
  {
    id: 'payRunPlanner',
    path: '/ccx/pay-runs',
    label: 'Pay-run planner',
    description: 'Plan and simulate pay runs across invoices.',
  },
  {
    id: 'creditExposure',
    path: '/ccx/companies/:companyId/credit',
    label: 'Credit exposure console',
    description: 'Understand and manage exposure for a company.',
  },
  {
    id: 'exceptions',
    path: '/ccx/companies/:companyId/exceptions',
    label: 'Exceptions & disputes',
    description: 'Handle disputes, delivery issues, and adjustments.',
  },
];

// --- Domain-level state & props contracts -----------------------------------

export interface CompanyFinanceProfileState {
  company: Company;
  credit: CompanyCreditSummary;
  paymentTerms: PaymentTerms;
  primaryContactEmail: string | null;
  taxProfile: TaxProfile;
  remittanceProfile: RemittanceProfile;
}

export interface CompanyFinanceProfileProps {
  state: CompanyFinanceProfileState;
  onChangePaymentTerms(next: PaymentTerms): void;
  onChangeTaxProfile(next: TaxProfile): void;
  onChangeRemittanceProfile(next: RemittanceProfile): void;
}

export interface TaxProfile {
  taxExempt: boolean;
  taxId?: string;
  documentationStatus: 'missing' | 'pending_review' | 'verified' | 'expired';
}

export interface RemittanceProfile {
  preferredMethod: 'ach' | 'wire' | 'check' | 'portal';
  bankName?: string;
  accountLast4?: string;
  remittanceInstructions?: string;
}

export interface ApprovalMatrixState {
  company: Company;
  policies: ApprovalPolicy[];
}

export interface ApprovalMatrixProps {
  state: ApprovalMatrixState;
  onChangePolicy(next: ApprovalPolicy): void;
  onDeletePolicy(policyId: string): void;
}

export interface ApprovalPolicy {
  id: string;
  scope: 'company' | 'location' | 'portfolio';
  appliesTo: 'quote' | 'invoice' | 'pay_run';
  minAmount?: number;
  maxAmount?: number;
  requiredApproverRoles: string[];
}

export interface InvoiceReviewWorkspaceState {
  invoice: Invoice;
  company: Company;
  originatingQuote?: Quote;
  priceView: PriceBreakdownView;
  inventoryView: InventoryImpactView;
  approvalStatus: 'draft' | 'pending' | 'approved' | 'blocked';
  blockingReasons: string[];
  threeWayMatch: ThreeWayMatchStatus;
  varianceSummary: VarianceSummary;
}

export interface InvoiceReviewWorkspaceProps {
  state: InvoiceReviewWorkspaceState;
  onApprove(): void;
  onBlock(reason: string): void;
  onRequestChange(note: string): void;
}

export interface PriceBreakdownView {
  listTotal: number;
  discountTotal: number;
  surchargeTotal: number;
  finalTotal: number;
}

export interface InventoryImpactView {
  hasSufficientInventory: boolean;
  backorderedQuantity: number;
  earliestShipDate?: string;
}

export interface ThreeWayMatchStatus {
  status: 'passed' | 'failed' | 'not_applicable';
  reason?: string;
}

export interface VarianceSummary {
  hasPriceVariance: boolean;
  hasQuantityVariance: boolean;
  estimatedVarianceAmount?: number;
}

export interface PayRunPlannerState {
  scope: 'company' | 'portfolio';
  company?: Company;
  invoices: Invoice[];
  selectedInvoiceIds: string[];
  cashBudget: number | null;
}

export interface PayRunPlannerProps {
  state: PayRunPlannerState;
  onToggleInvoice(invoiceId: string): void;
  onChangeCashBudget(next: number | null): void;
  onConfirmPayRun(): void;
}

export interface CreditExposureState {
  company: Company;
  credit: CompanyCreditSummary;
  openInvoices: Invoice[];
}

export interface CreditExposureProps {
  state: CreditExposureState;
  onAdjustLimit(nextLimit: number): void;
}

export interface ExceptionsWorkspaceState {
  company: Company;
  invoice?: Invoice;
  items: ExceptionItem[];
}

export interface ExceptionsWorkspaceProps {
  state: ExceptionsWorkspaceState;
  onCreateException(input: NewExceptionInput): void;
  onResolveException(id: string, resolution: ExceptionResolution): void;
}

export interface ExceptionItem {
  id: string;
  type: 'pricing' | 'delivery' | 'tax' | 'payment';
  status: 'open' | 'in_progress' | 'resolved';
  summary: string;
}

export interface NewExceptionInput {
  type: ExceptionItem['type'];
  summary: string;
}

export interface ExceptionResolution {
  outcome: 'credit_memo' | 'write_off' | 'no_change';
  note?: string;
}

export interface CcxDashboardState {
  companies: Company[];
  invoiceStatusCounts: Record<InvoiceStatus, number>;
}
