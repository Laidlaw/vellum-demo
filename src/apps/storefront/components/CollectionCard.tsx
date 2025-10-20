import { BlockStack, Card, InlineStack, Text } from '@shopify/polaris';

import type { StorefrontCollection } from '../data/storefrontData';
import { products } from '../data/storefrontData';

interface CollectionCardProps {
  collection: StorefrontCollection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Card background="bg-surface-secondary" roundedAbove="sm">
      <BlockStack gap="200">
        <Text as="h3" variant="headingMd">
          {collection.title}
        </Text>
        <Text as="p" tone="subdued">
          {collection.description}
        </Text>
        <InlineStack gap="100" wrap>
          {collection.productHandles.map((handle) => {
            const product = products.find((item) => item.handle === handle);
            return product ? (
              <span key={handle} className="StorefrontCollection__ProductPill">
                {product.title}
              </span>
            ) : null;
          })}
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
