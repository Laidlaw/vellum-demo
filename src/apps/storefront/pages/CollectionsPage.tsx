import { useNavigate } from 'react-router-dom';
import { BlockStack, Button, InlineStack, Text } from '@shopify/polaris';

import { CollectionCard } from '../components/CollectionCard';
import { collections } from '../data/storefrontData';

export function CollectionsPage() {
  const navigate = useNavigate();

  return (
    <div className="StorefrontCollectionsPage">
      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text as="p" tone="subdued" variant="bodySm">
            Collections
          </Text>
          <InlineStack align="space-between">
            <Text as="h1" variant="headingXl">
              Curated kits for fast deployments
            </Text>
            <Button variant="secondary" onClick={() => navigate('/storefront/quote')}>
              Talk to a specialist
            </Button>
          </InlineStack>
          <Text as="p" tone="subdued">
            Pre-configured bundles that align with the way industrial procurement teams stage new crews. Each collection
            is ready to export into quotes and purchase orders.
          </Text>
        </BlockStack>

        <div className="StorefrontCollectionsPage__Grid">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </BlockStack>
    </div>
  );
}
