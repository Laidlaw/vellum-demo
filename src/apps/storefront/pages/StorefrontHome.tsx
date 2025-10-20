import { useNavigate } from 'react-router-dom';
import { BlockStack, Button, Divider, InlineStack, Text } from '@shopify/polaris';

import heroBackground from '../../../assets/scott-blake.webp';

import { CollectionCard } from '../components/CollectionCard';
import { ProductGrid } from '../components/ProductGrid';
import {
  collections,
  featuredProductHandles,
  highlightedCategories,
  products,
} from '../data/storefrontData';

export function StorefrontHome() {
  const navigate = useNavigate();

  const featuredProducts = products.filter((product) => featuredProductHandles.includes(product.handle));
  const [primaryFeature, ...secondaryFeatures] = featuredProducts;

  return (
    <div className="StorefrontHome">
      <section className="StorefrontHero" style={{ backgroundImage: `url(${heroBackground})` }}>
        <div className="StorefrontHero__Inner">
          <div className="StorefrontHero__Content">
            <BlockStack gap="400">
              <BlockStack gap="200">
                <Text as="p" variant="bodySm" className="StorefrontHero__Eyebrow">
                  Built for industrial buyers
                </Text>
                <Text as="h1" variant="headingXl">
                  Industrial supply, ready when your crews are.
                </Text>
                <Text as="p" variant="bodyMd">
                  Source critical tools, PPE, and material handling equipment with the same ease as a Shopify storefront.
                  Stage items in a quote and sync with your procurement workflow.
                </Text>
              </BlockStack>
              <InlineStack gap="200" wrap>
                <Button size="large" onClick={() => navigate('/storefront/products')}>
                  Explore catalog
                </Button>
                <Button size="large" variant="secondary" onClick={() => navigate('/storefront/quote')}>
                  Build a quote
                </Button>
              </InlineStack>
              <InlineStack gap="100" wrap>
                {highlightedCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className="StorefrontCategoryPill"
                    onClick={() => navigate(`/storefront/products?category=${encodeURIComponent(category)}`)}
                  >
                    {category}
                  </button>
                ))}
              </InlineStack>
            </BlockStack>
          </div>
          <div className="StorefrontHero__Visual">
            {primaryFeature ? (
              <button
                type="button"
                className="StorefrontHero__Spotlight"
                onClick={() => navigate(`/storefront/products/${primaryFeature.handle}`)}
              >
                <img src={primaryFeature.image} alt={primaryFeature.title} loading="lazy" />
                <BlockStack gap="050">
                  <Text as="span" tone="subdued" variant="bodySm">
                    Spotlight
                  </Text>
                  <Text as="span" variant="headingMd">
                    {primaryFeature.title}
                  </Text>
                </BlockStack>
              </button>
            ) : null}
            {secondaryFeatures.length ? (
              <div className="StorefrontHero__SpotlightList">
                {secondaryFeatures.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="StorefrontHero__SpotlightItem"
                    onClick={() => navigate(`/storefront/products/${product.handle}`)}
                  >
                    <img src={product.image} alt={product.title} loading="lazy" />
                    <Text as="span" variant="bodyMd">
                      {product.title}
                    </Text>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="StorefrontSection">
        <div className="StorefrontSection__Header">
          <Text as="h2" variant="headingLg">
            Featured inventory
          </Text>
          <Button variant="tertiary" onClick={() => navigate('/storefront/products')}>
            View all
          </Button>
        </div>
        <ProductGrid
          products={featuredProducts}
          onViewProduct={(handle) => navigate(`/storefront/products/${handle}`)}
        />
      </section>

      <Divider />

      <section className="StorefrontSection">
        <div className="StorefrontSection__Header">
          <Text as="h2" variant="headingLg">
            Collections for busy crews
          </Text>
          <Text as="p" tone="subdued">
            Curated bundles that help procurement leads launch new job sites without slowing down.
          </Text>
        </div>
        <div className="StorefrontCollections">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      <Divider />

      <section className="StorefrontSection" id="support">
        <div className="StorefrontSupport">
          <BlockStack gap="200">
            <Text as="h2" variant="headingLg">
              Need help sizing a build?
            </Text>
            <Text as="p" tone="subdued">
              Our merchant experience team can configure carts, coordinate approvals, and sync quotes back into your ERP
              so buyers can move fast.
            </Text>
          </BlockStack>
          <Button size="large" variant="primary" onClick={() => navigate('/storefront/quote')}>
            Talk to sales
          </Button>
        </div>
      </section>
    </div>
  );
}
