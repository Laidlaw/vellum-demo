import { useNavigate } from 'react-router-dom';
import { BlockStack, Button, InlineStack, Text } from '@shopify/polaris';

import { ProductGrid } from '../components/ProductGrid';
import { CollectionCard } from '../components/CollectionCard';
import { collections, products } from '../data/storefrontData';

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

        <BlockStack gap="500">
          {collections.map((collection) => {
            const collectionProducts = collection.productHandles
              .map((handle) => products.find((product) => product.handle === handle))
              .filter((product): product is NonNullable<typeof product> => Boolean(product));

            return (
              <section key={collection.id} className="StorefrontCollectionsPage__Section">
                <CollectionCard collection={collection} />
                {collectionProducts.length ? (
                  <ProductGrid
                    products={collectionProducts}
                    onViewProduct={(handle) => navigate(`/storefront/products/${handle}`)}
                    showCategory
                  />
                ) : null}
              </section>
            );
          })}
        </BlockStack>
      </BlockStack>
    </div>
  );
}
