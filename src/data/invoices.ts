import type { InstallmentOption, Invoice, Money } from './types';

const usd = (amount: number): Money => ({ amount, currencyCode: 'USD' });

const INSTALLMENT_PLANS: Record<string, InstallmentOption[]> = {
  'comp-blue-hollow': [
    {
      id: 'bh-plan-3',
      label: '3 monthly payments',
      durationMonths: 3,
      aprPercent: 4.2,
    },
    {
      id: 'bh-plan-6',
      label: '6 monthly payments',
      durationMonths: 6,
      aprPercent: 6.5,
      minimumOrderAmount: usd(25_000),
    },
  ],
};

export const INVOICES: Invoice[] = [
  {
    id: 'inv-2024-0089',
    invoiceNumber: 'INV-2024-0089',
    companyId: 'comp-blue-hollow',
    quoteId: 'quote-2024-0102',
    orderId: 'ORD-4821',
    status: 'due',
    issuedAt: '2024-07-22T10:00:00Z',
    dueAt: '2024-08-21T23:59:00Z',
    subtotal: usd(18_450),
    taxTotal: usd(1_476),
    shippingTotal: usd(540),
    total: usd(20_466),
    amountPaid: usd(10_233),
    balanceDue: usd(10_233),
    paymentTerms: {
      type: 'installments',
      description: '6-month seasonal plan via ACH autopay',
      installmentOptions: INSTALLMENT_PLANS['comp-blue-hollow'],
      creditLimit: usd(200_000),
    },
    paymentSchedule: INSTALLMENT_PLANS['comp-blue-hollow'],
    lineItems: [
      {
        id: 'inv-0089-1',
        productId: 'prod-lux-linens',
        title: 'Luxury Linen Set',
        sku: 'LIN-SET-SEASONAL',
        quantity: 60,
        unitPrice: usd(190),
        total: usd(11_400),
      },
      {
        id: 'inv-0089-2',
        productId: 'prod-spa-kits',
        title: 'Spa Amenity Kit',
        sku: 'SPA-KIT-WINTER',
        quantity: 200,
        unitPrice: usd(24),
        total: usd(4_800),
      },
      {
        id: 'inv-0089-3',
        productId: 'prod-outdoor-heaters',
        title: 'Outdoor Infrared Heater',
        sku: 'INF-HEAT-XL',
        quantity: 15,
        unitPrice: usd(165),
        total: usd(2_475),
      },
      {
        id: 'inv-0089-4',
        productId: 'prod-custom-signage',
        title: 'Custom Resort Signage Package',
        sku: 'SIGN-PKG',
        quantity: 1,
        unitPrice: usd(1_775),
        total: usd(1_775),
      },
    ],
    payments: [
      {
        id: 'payment-0089-1',
        method: 'ach',
        amount: usd(10_233),
        processedAt: '2024-07-25T12:30:00Z',
        reference: 'ACH-653291',
      },
    ],
    notes: 'Auto-payments scheduled monthly. Reminder to sync to ERP when paid in full.',
  },
  {
    id: 'inv-2024-0094',
    invoiceNumber: 'INV-2024-0094',
    companyId: 'comp-abstract-industrial',
    quoteId: 'quote-2024-0156',
    status: 'draft',
    issuedAt: '2024-09-11T10:45:00Z',
    dueAt: '2024-10-11T23:59:00Z',
    subtotal: usd(7_020),
    taxTotal: usd(585.6),
    shippingTotal: usd(180),
    total: usd(7_785.6),
    amountPaid: usd(0),
    balanceDue: usd(7_785.6),
    paymentTerms: {
      type: 'net',
      netDays: 30,
      discountPercent: 2,
      description: 'Net 30 with 2% ten-day discount',
      creditLimit: usd(150_000),
    },
    lineItems: [
      {
        id: 'inv-0094-1',
        productId: 'prod-industrial-degreaser',
        title: 'Industrial Degreaser – 55 gal drum',
        sku: 'DEG-55-IND',
        quantity: 4,
        unitPrice: usd(950),
        total: usd(3_800),
      },
      {
        id: 'inv-0094-2',
        productId: 'prod-thermal-gloves',
        title: 'Thermal Safety Gloves (case of 24)',
        sku: 'TSG-24',
        quantity: 5,
        unitPrice: usd(210),
        total: usd(1_050),
      },
      {
        id: 'inv-0094-3',
        productId: 'prod-pressure-hose',
        title: 'High-Pressure Hose Kit',
        sku: 'HPH-10',
        quantity: 10,
        unitPrice: usd(217),
        total: usd(2_170),
      },
    ],
    payments: [],
    notes: 'Pending approval. Convert to posted invoice once quote is approved.',
  },
  {
    id: 'inv-2024-0067',
    invoiceNumber: 'INV-2024-0067',
    companyId: 'comp-lynx-supply',
    status: 'overdue',
    issuedAt: '2024-04-12T09:00:00Z',
    dueAt: '2024-05-12T23:59:00Z',
    subtotal: usd(6_780),
    taxTotal: usd(542.4),
    shippingTotal: usd(0),
    total: usd(7_322.4),
    amountPaid: usd(3_000),
    balanceDue: usd(4_322.4),
    paymentTerms: {
      type: 'net',
      netDays: 30,
      creditLimit: usd(80_000),
      description: 'Standard net 30 terms pending renewal',
    },
    lineItems: [
      {
        id: 'inv-0067-1',
        productId: 'prod-shop-shelving',
        title: 'Adjustable Shop Shelving',
        sku: 'SHELF-ADJ',
        quantity: 12,
        unitPrice: usd(340),
        total: usd(4_080),
      },
      {
        id: 'inv-0067-2',
        productId: 'prod-led-task',
        title: 'LED Task Light Kit',
        sku: 'LED-TASK-SET',
        quantity: 30,
        unitPrice: usd(90),
        total: usd(2_700),
      },
    ],
    payments: [
      {
        id: 'payment-0067-1',
        method: 'card',
        amount: usd(3_000),
        processedAt: '2024-04-28T17:15:00Z',
        reference: 'VISA-9542',
      },
    ],
    notes: 'Send dunning reminder. Customer requested ACH payment extension.',
  },
];

export const getInvoicesForCompany = (companyId: string): Invoice[] =>
  INVOICES.filter((invoice) => invoice.companyId === companyId);

export const getInvoiceById = (invoiceId: string): Invoice | undefined =>
  INVOICES.find((invoice) => invoice.id === invoiceId);
