import type { IconProps } from '@shopify/polaris';

import angleGrinderImg from '../../../assets/products/angle-grinder.jpg';
import cordlessDrillImg from '../../../assets/products/cordless-drill.jpg';
import hammerDrillImg from '../../../assets/products/hammer-drill.jpg';
import hardHatImg from '../../../assets/products/hard-hat-with-led-light.jpg';
import ledWorkLightImg from '../../../assets/products/led-work-light.jpg';
import welderImg from '../../../assets/products/welder.jpg';
import {
  CircleChevronRightIcon,
  DeliveryIcon,
  ForkliftIcon,
  PackageIcon,
} from '@shopify/polaris-icons';

export type OrderBucket = 'confirmed' | 'pending';

export interface OrderCardImage {
  type: 'image' | 'more';
  src?: string;
  alt?: string;
  label?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  bucket: OrderBucket;
  statusLabel: string;
  statusMeta: string;
  statusIcon: IconProps['source'];
  statusTone: 'success' | 'attention' | 'subdued';
  fulfillmentLabel: string;
  fulfillmentIcon: IconProps['source'];
  itemsCount: number;
  total: number;
  primaryAction: {
    label: string;
    variant?: 'primary' | 'secondary';
    tone?: 'success' | 'critical' | 'primary';
  };
  secondaryActionLabel: string;
  locationId: string;
  images: OrderCardImage[];
}

export const ORDER_CARDS: OrderRecord[] = [
  {
    id: 'order-1410',
    orderNumber: '#1410',
    bucket: 'confirmed',
    statusLabel: 'Confirmed',
    statusMeta: 'Updated Oct 17',
    statusIcon: CircleChevronRightIcon,
    statusTone: 'success',
    fulfillmentLabel: 'Awaiting payment',
    fulfillmentIcon: PackageIcon,
    itemsCount: 3,
    total: 75.55,
    primaryAction: { label: 'Pay now', variant: 'primary', tone: 'success' },
    secondaryActionLabel: 'Manage',
    locationId: 'loc-abstract-hq',
    images: [
      { type: 'image', src: angleGrinderImg, alt: 'Angle grinder' },
      { type: 'image', src: cordlessDrillImg, alt: 'Cordless drill' },
      { type: 'image', src: ledWorkLightImg, alt: 'LED work light' },
    ],
  },
  {
    id: 'order-1411',
    orderNumber: '#1411',
    bucket: 'confirmed',
    statusLabel: 'Delivered',
    statusMeta: 'Delivered Oct 14',
    statusIcon: DeliveryIcon,
    statusTone: 'subdued',
    fulfillmentLabel: 'Left at west distribution hub',
    fulfillmentIcon: ForkliftIcon,
    itemsCount: 3,
    total: 120.36,
    primaryAction: { label: 'Buy again', variant: 'secondary' },
    secondaryActionLabel: 'Manage',
    locationId: 'loc-abstract-west-hub',
    images: [
      { type: 'image', src: cordlessDrillImg, alt: 'Cordless drill' },
      { type: 'image', src: hammerDrillImg, alt: 'Hammer drill' },
      { type: 'image', src: ledWorkLightImg, alt: 'LED work light' },
    ],
  },
  {
    id: 'order-1412',
    orderNumber: '#1412',
    bucket: 'confirmed',
    statusLabel: 'Out for delivery',
    statusMeta: 'Estimated delivery Oct 24',
    statusIcon: ForkliftIcon,
    statusTone: 'attention',
    fulfillmentLabel: 'Carrier: NorthLine Freight',
    fulfillmentIcon: DeliveryIcon,
    itemsCount: 7,
    total: 202.55,
    primaryAction: { label: 'Buy again', variant: 'secondary' },
    secondaryActionLabel: 'Manage',
    locationId: 'loc-abstract-south-yard',
    images: [
      { type: 'image', src: ledWorkLightImg, alt: 'LED work light' },
      { type: 'image', src: hardHatImg, alt: 'Hard hat with LED' },
      { type: 'more', label: '+4' },
    ],
  },
  {
    id: 'order-1413',
    orderNumber: '#1413',
    bucket: 'pending',
    statusLabel: 'Awaiting approval',
    statusMeta: 'Submitted Oct 20',
    statusIcon: PackageIcon,
    statusTone: 'attention',
    fulfillmentLabel: 'Payment terms pending',
    fulfillmentIcon: PackageIcon,
    itemsCount: 5,
    total: 418.0,
    primaryAction: { label: 'Send reminder', variant: 'secondary' },
    secondaryActionLabel: 'Manage',
    locationId: 'loc-abstract-hq',
    images: [
      { type: 'image', src: hammerDrillImg, alt: 'Hammer drill' },
      { type: 'image', src: welderImg, alt: 'Welder' },
      { type: 'image', src: ledWorkLightImg, alt: 'LED work light' },
    ],
  },
  {
    id: 'order-1414',
    orderNumber: '#1414',
    bucket: 'pending',
    statusLabel: 'Draft',
    statusMeta: 'Created Oct 22',
    statusIcon: PackageIcon,
    statusTone: 'subdued',
    fulfillmentLabel: 'Not yet submitted',
    fulfillmentIcon: PackageIcon,
    itemsCount: 2,
    total: 189.99,
    primaryAction: { label: 'Submit order', variant: 'primary' },
    secondaryActionLabel: 'Discard',
    locationId: 'loc-abstract-west-hub',
    images: [
      { type: 'image', src: angleGrinderImg, alt: 'Angle grinder' },
      { type: 'image', src: ledWorkLightImg, alt: 'LED work light' },
    ],
  },
];
