import angleGrinderImg from '../../../assets/products/angle-grinder.jpg';
import cordlessDrillImg from '../../../assets/products/cordless-drill.jpg';
import hammerDrillImg from '../../../assets/products/hammer-drill.jpg';
import circularSawImg from '../../../assets/products/circular-saw.jpg';
import welderImg from '../../../assets/products/welder.jpg';
import ledWorkLightImg from '../../../assets/products/led-work-light.jpg';
import hardHatLedImg from '../../../assets/products/hard-hat-with-led-light.jpg';
import safetyVestImg from '../../../assets/products/safety-vest.jpg';
import heavyGloveImg from '../../../assets/products/heavy-glove.jpg';
import socketSetImg from '../../../assets/products/socket-set.jpg';
import platformCartImg from '../../../assets/products/platform-cart.jpg';
import forkliftImg from '../../../assets/products/forklift.jpg';

export type StorefrontCategory =
  | 'Power Tools'
  | 'Safety & PPE'
  | 'Material Handling'
  | 'Industrial Equipment'
  | 'Shop Essentials';

export interface StorefrontProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  category: StorefrontCategory;
  leadTime: string;
  badges?: string[];
  highlights: string[];
}

export interface StorefrontCollection {
  id: string;
  title: string;
  description: string;
  productHandles: string[];
}

export const products: StorefrontProduct[] = [
  {
    id: 'prod-angle-grinder',
    handle: 'industrial-angle-grinder',
    title: 'Industrial Angle Grinder 7"',
    description: 'Heavy-duty grinder engineered for precision metal finishing and fabrication workflows.',
    price: 289.99,
    unit: 'per unit',
    image: angleGrinderImg,
    category: 'Power Tools',
    leadTime: 'Ships in 2 business days',
    badges: ['Best seller'],
    highlights: ['13-amp motor', 'Quick-change guard', '5-year warranty'],
  },
  {
    id: 'prod-cordless-drill',
    handle: 'cordless-impact-drill-kit',
    title: 'Cordless Impact Drill Kit',
    description: 'Compact 20V drill kit with two batteries and smart torque control for field technicians.',
    price: 219.0,
    unit: 'kit',
    image: cordlessDrillImg,
    category: 'Power Tools',
    leadTime: 'Ships next business day',
    badges: ['New'],
    highlights: ['Brushless motor', '2x 5Ah batteries', 'Bluetooth diagnostics'],
  },
  {
    id: 'prod-hammer-drill',
    handle: 'rotary-hammer-drill',
    title: 'Rotary Hammer Drill SDS-Max',
    description: 'Pro-grade rotary hammer with vibration control for concrete and masonry teams.',
    price: 459.5,
    unit: 'per unit',
    image: hammerDrillImg,
    category: 'Power Tools',
    leadTime: 'Ships in 3 business days',
    highlights: ['9.5 ft-lbs impact energy', 'AVT technology', 'Includes depth gauge'],
  },
  {
    id: 'prod-circular-saw',
    handle: 'track-circular-saw',
    title: 'Track Circular Saw System',
    description: 'Precision saw bundle with 55" track for clean cuts on plywood and composite panels.',
    price: 349.0,
    unit: 'system',
    image: circularSawImg,
    category: 'Power Tools',
    leadTime: 'Ships next business day',
    highlights: ['Anti-kickback design', 'Variable speed', 'Dust collection port'],
  },
  {
    id: 'prod-welder',
    handle: 'multi-process-welder',
    title: 'Multi-Process Welder 210A',
    description: 'Shop-ready MIG/TIG/Stick welder with smart presets for mixed material fabrication.',
    price: 1899.0,
    unit: 'per unit',
    image: welderImg,
    category: 'Industrial Equipment',
    leadTime: 'Ships in 5 business days',
    badges: ['Most requested'],
    highlights: ['Dual voltage', '14 stored programs', 'Includes MIG gun & TIG torch'],
  },
  {
    id: 'prod-led-light',
    handle: 'led-work-light',
    title: 'LED Work Light 10,000 lm',
    description: 'Rugged work light with IP65 housing built for industrial service environments.',
    price: 169.0,
    unit: 'per unit',
    image: ledWorkLightImg,
    category: 'Shop Essentials',
    leadTime: 'Ships in 2 business days',
    highlights: ['Adjustable tripod', '5,000K daylight', 'Tilting head'],
  },
  {
    id: 'prod-hardhat-led',
    handle: 'hard-hat-led',
    title: 'Hard Hat with Integrated LED',
    description: 'ANSI Type 1 hard hat with removable LED module to improve visibility in low-light sites.',
    price: 68.5,
    unit: 'per unit',
    image: hardHatLedImg,
    category: 'Safety & PPE',
    leadTime: 'Ships next business day',
    highlights: ['Rechargeable LED', 'Vented shell', 'Meets ANSI Z89.1'],
  },
  {
    id: 'prod-safety-vest',
    handle: 'hi-visibility-safety-vest',
    title: 'Hi-Visibility Safety Vest',
    description: 'Class 3 mesh vest with segmented reflective tape for high-traffic job sites.',
    price: 32.0,
    unit: 'per unit',
    image: safetyVestImg,
    category: 'Safety & PPE',
    leadTime: 'Ships same day',
    highlights: ['Class 3 rated', 'Radio mic loops', '10-pocket layout'],
  },
  {
    id: 'prod-heavy-glove',
    handle: 'cut-resistant-gloves',
    title: 'Cut-Resistant Impact Gloves',
    description: 'Level A5 cut resistance with reinforced knuckle protection for fabrication crews.',
    price: 24.5,
    unit: 'pair',
    image: heavyGloveImg,
    category: 'Safety & PPE',
    leadTime: 'Ships same day',
    highlights: ['ANSI A5 cut', 'Impact foam back', 'Touchscreen compatible'],
  },
  {
    id: 'prod-socket-set',
    handle: 'industrial-socket-set',
    title: 'Industrial Socket Set 250 pc',
    description: 'Comprehensive metric and SAE socket set in a rolling case for field service teams.',
    price: 499.0,
    unit: 'set',
    image: socketSetImg,
    category: 'Shop Essentials',
    leadTime: 'Ships in 3 business days',
    highlights: ['Chrome vanadium steel', 'Quick-release ratchets', 'Lifetime warranty'],
  },
  {
    id: 'prod-platform-cart',
    handle: 'folding-platform-cart',
    title: 'Folding Platform Cart 660 lb',
    description: 'Heavy-duty platform truck with non-marking casters for warehouse mobility.',
    price: 279.0,
    unit: 'per unit',
    image: platformCartImg,
    category: 'Material Handling',
    leadTime: 'Ships next business day',
    highlights: ['660 lb capacity', 'Collapsible handle', 'Non-slip deck'],
  },
  {
    id: 'prod-forklift',
    handle: 'electric-pallet-stacker',
    title: 'Electric Pallet Stacker 3300 lb',
    description: 'Compact walk-behind stacker designed for narrow aisles and short shuttle runs.',
    price: 5299.0,
    unit: 'per unit',
    image: forkliftImg,
    category: 'Material Handling',
    leadTime: 'Ships in 7 business days',
    badges: ['Pre-order'],
    highlights: ['24V AC drive', '188" lift height', 'Regenerative braking'],
  },
];

export const collections: StorefrontCollection[] = [
  {
    id: 'featured-power',
    title: 'Power Tools Sprint Kit',
    description: 'Ready-to-ship kits curated for maintenance leads standing up new crews.',
    productHandles: ['industrial-angle-grinder', 'cordless-impact-drill-kit', 'rotary-hammer-drill'],
  },
  {
    id: 'safety-readiness',
    title: 'Safety Readiness',
    description: 'High-visibility gear and PPE staples for sites getting audit-ready.',
    productHandles: ['hi-visibility-safety-vest', 'hard-hat-led', 'cut-resistant-gloves'],
  },
  {
    id: 'warehouse-flow',
    title: 'Warehouse Flow',
    description: 'Material handling upgrades to boost throughput in busy DC teams.',
    productHandles: ['folding-platform-cart', 'electric-pallet-stacker', 'industrial-socket-set'],
  },
];

export const featuredProductHandles = ['cordless-impact-drill-kit', 'industrial-angle-grinder', 'hi-visibility-safety-vest'];

export const highlightedCategories: StorefrontCategory[] = [
  'Power Tools',
  'Safety & PPE',
  'Material Handling',
  'Industrial Equipment',
  'Shop Essentials',
];

export const productsByHandle = new Map(products.map((product) => [product.handle, product]));

export function getProductByHandle(handle: string) {
  return productsByHandle.get(handle);
}

export function getProductsByCategory(category: StorefrontCategory) {
  return products.filter((product) => product.category === category);
}
