export type ISODateString = string;

export type CurrencyCode =
  | 'USD'
  | 'CAD'
  | 'EUR'
  | 'GBP'
  | 'AUD'
  | 'NZD'
  | (string & {});

export interface Money {
  amount: number;
  currencyCode: CurrencyCode;
}

export interface Address {
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  province?: string;
  postalCode: string;
  country: string;
}

export type CompanyOrderingStatus = 'approved' | 'not_approved' | 'pending';

export interface PaymentTerms {
  type: 'net' | 'due_on_receipt' | 'installments';
  netDays?: number;
  discountPercent?: number;
  description?: string;
  creditLimit?: Money;
  installmentOptions?: InstallmentOption[];
}

export interface InstallmentOption {
  id: string;
  label: string;
  durationMonths: number;
  aprPercent: number;
  minimumOrderAmount?: Money;
}

export type CompanyContactRole =
  | 'buyer'
  | 'approver'
  | 'finance'
  | 'admin'
  | 'viewer';

export interface CompanyContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: CompanyContactRole;
  locationIds: string[];
  lastActiveAt?: ISODateString;
}

export interface CompanyLocation {
  id: string;
  name: string;
  code?: string;
  address: Address;
  phone?: string;
  email?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

export interface CompanyCreditSummary {
  creditLimit?: Money;
  creditUsed?: Money;
  availableCredit?: Money;
  daysPastDue?: number;
}

export type PaymentMethodType = 'ach' | 'card' | 'wire' | 'check' | 'installments' | 'shop_pay';

export interface CompanyPaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  status: 'active' | 'pending' | 'disabled';
  description?: string;
  lastUsedAt?: ISODateString;
  capabilities?: string[];
  isDefault?: boolean;
}

export interface CompanySummary {
  id: string;
  name: string;
  orderingStatus: CompanyOrderingStatus;
  locationsCount: number;
  mainContact: string | null;
  totalOrders: number;
  totalSales: number;
}

export interface Company extends CompanySummary {
  legalName?: string;
  industry?: string;
  accountManager?: string;
  createdAt: ISODateString;
  lastOrderAt?: ISODateString;
  paymentTerms: PaymentTerms;
  contacts: CompanyContact[];
  locations: CompanyLocation[];
  credit: CompanyCreditSummary;
  taxExempt?: boolean;
  paymentMethods?: CompanyPaymentMethod[];
  notes?: string;
}

export type SalesChannelIntegration = 'salesforce' | 'hubspot' | 'netsuite' | 'sap' | 'custom';

export type QuoteStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'expired';

export interface PriceBreak {
  minimumQuantity: number;
  unitPrice: Money;
}

export interface QuoteLineItem {
  id: string;
  productId: string;
  title: string;
  sku: string;
  quantity: number;
  unitPrice: Money;
  discountPercent?: number;
  total: Money;
  volumePricing?: PriceBreak[];
}

export interface QuoteWorkflowEvent {
  id: string;
  type: 'created' | 'submitted' | 'approved' | 'rejected' | 'expired' | 'comment';
  occurredAt: ISODateString;
  actor: string;
  note?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  companyId: string;
  requesterId: string;
  approverId?: string;
  status: QuoteStatus;
  name: string;
  createdAt: ISODateString;
  expiresAt: ISODateString;
  submittedAt?: ISODateString;
  approvedAt?: ISODateString;
  purchaseOrderNumber?: string;
  integrationChannel?: SalesChannelIntegration;
  approxDeliveryDate?: ISODateString;
  orderReference?: string;
  salesRep?: string;
  subtotal: Money;
  taxTotal: Money;
  shippingTotal?: Money;
  total: Money;
  currencyCode: CurrencyCode;
  lineItems: QuoteLineItem[];
  notes?: string;
  history: QuoteWorkflowEvent[];
}

export type InvoiceStatus = 'draft' | 'due' | 'paid' | 'partial' | 'overdue';

export interface InvoiceLineItem {
  id: string;
  productId: string;
  title: string;
  sku: string;
  quantity: number;
  unitPrice: Money;
  total: Money;
}

export interface InvoicePaymentRecord {
  id: string;
  method: 'card' | 'ach' | 'wire' | 'check' | 'shop_pay';
  amount: Money;
  processedAt: ISODateString;
  reference?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  quoteId?: string;
  orderId?: string;
  status: InvoiceStatus;
  issuedAt: ISODateString;
  dueAt: ISODateString;
  paidAt?: ISODateString;
  subtotal: Money;
  taxTotal: Money;
  shippingTotal?: Money;
  total: Money;
  amountPaid: Money;
  balanceDue: Money;
  paymentTerms: PaymentTerms;
  paymentSchedule?: InstallmentOption[];
  lineItems: InvoiceLineItem[];
  payments: InvoicePaymentRecord[];
  notes?: string;
  exceptions?: InvoiceException[];
  plannedPayRunId?: string;
  plannedPaymentDate?: ISODateString;
}

export type InvoiceExceptionType = 'pricing' | 'delivery' | 'tax' | 'payment';

export interface InvoiceException {
  id: string;
  type: InvoiceExceptionType;
  status: 'open' | 'in_progress' | 'resolved';
  openedAt: ISODateString;
  resolvedAt?: ISODateString;
  summary: string;
  rootCause?: string;
  owner?: string;
  relatedLineItemIds?: string[];
}

export interface DatasetSummary {
  label: string;
  value: string;
  tone?: 'success' | 'attention' | 'critical' | 'subdued' | 'primary';
}

export type CustomerSubscriptionStatus = 'subscribed' | 'not_subscribed' | 'pending';

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  location: string;
  ordersCount: number;
  amountSpent: number;
  subscriptionStatus: CustomerSubscriptionStatus;
  tags?: string[];
  hasNote?: boolean;
}

// Transitional aliases while existing screens are updated.
export type CompanyRecord = CompanySummary;
export type SubscriptionStatus = CustomerSubscriptionStatus;
