import type { CustomerRecord, DatasetSummary } from './types';

export const CUSTOMER_SUMMARY: DatasetSummary[] = [
  { label: 'Customers', value: '6 customers' },
  { label: 'Customer base coverage', value: '100% of your customer base' },
];

export const CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cust_1',
    name: 'Harry R',
    email: 'harry@example.com',
    location: 'United States',
    ordersCount: 0,
    amountSpent: 0,
    subscriptionStatus: 'not_subscribed',
  },
  {
    id: 'cust_2',
    name: 'alex@onc.design',
    email: 'alex@onc.design',
    location: 'United States',
    ordersCount: 1,
    amountSpent: 2796.9,
    subscriptionStatus: 'not_subscribed',
    hasNote: true,
  },
  {
    id: 'cust_3',
    name: 'Alex Sagel',
    email: 'alex.sagel@example.com',
    location: 'United States',
    ordersCount: 3,
    amountSpent: 3159.8,
    subscriptionStatus: 'not_subscribed',
  },
  {
    id: 'cust_4',
    name: 'Russell Winfield',
    email: 'russell.winfield@example.com',
    location: 'Toronto, Canada',
    ordersCount: 0,
    amountSpent: 0,
    subscriptionStatus: 'not_subscribed',
  },
  {
    id: 'cust_5',
    name: 'Ayumu Hirano',
    email: 'ayumu.hirano@example.com',
    location: 'United States',
    ordersCount: 0,
    amountSpent: 0,
    subscriptionStatus: 'not_subscribed',
  },
  {
    id: 'cust_6',
    name: 'Karine Ruby',
    email: 'karine.ruby@example.com',
    location: 'Ottawa, Canada',
    ordersCount: 0,
    amountSpent: 0,
    subscriptionStatus: 'not_subscribed',
  },
];
