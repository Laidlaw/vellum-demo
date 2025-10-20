import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, BlockStack, Box, Button, Card, Divider, InlineStack, Text } from '@shopify/polaris';
import { CheckIcon } from '@shopify/polaris-icons';

import { ProductGrid } from '../components/ProductGrid';
import { getProductByHandle, products } from '../data/storefrontData';
import { useStorefrontState } from '../state/StorefrontState';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export function ProductDetailPage() {
  const navigate = useNavigate();
  const { productHandle = '' } = useParams();
  const { state, addToCart, addToQuote, removeCartItem, removeQuoteItem } = useStorefrontState();
  const product = getProductByHandle(productHandle);
  const cartItem = product ? state.cart.find((item) => item.handle === product.handle) : undefined;
  const quoteItem = product ? state.quoteDraft.items.find((item) => item.handle === product.handle) : undefined;

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products.filter((item) => item.category === product.category && item.handle !== product.handle).slice(0, 3);
  }, [product]);

  if (!product) {
    return (
      <div className="StorefrontProductDetail StorefrontProductDetail--empty">
        <Card roundedAbove="sm">
          <Box padding="400">
            <BlockStack align="center" gap="200">
              <Text as="h2" variant="headingLg">
                Product not found
              </Text>
              <Text as="p" tone="subdued">
                The item you are looking for is unavailable. Browse the catalog to continue.
              </Text>
              <Button onClick={() => navigate('/storefront/products')}>Back to catalog</Button>
            </BlockStack>
          </Box>
        </Card>
      </div>
    );
  }

  return (
    <div className="StorefrontProductDetail">
      <aside className="StorefrontProductDetail__Gallery">
        <img src={product.image} alt={product.title} />
        <Badge tone="info">{product.category}</Badge>
      </aside>
      <section className="StorefrontProductDetail__Info">
        <BlockStack gap="400">
          <BlockStack gap="150" className="StorefrontProductDetail__Header">
            <Text as="p" tone="subdued" variant="bodySm">
              SKU {product.id}
            </Text>
            <Text as="h1" variant="headingXl">
              {product.title}
            </Text>
          </BlockStack>
          <Text as="p" variant="bodyMd">
            {product.description}
          </Text>
          <div className="StorefrontProductDetail__Pricing">
            <div>
              <Text as="p" variant="headingLg">
                {currencyFormatter.format(product.price)}
              </Text>
              <Text as="span" tone="subdued" variant="bodySm">
                {product.unit}
              </Text>
            </div>
            <Badge tone="success">{product.leadTime}</Badge>
          </div>
          <div className="StorefrontProductDetail__Highlights">
            <Text as="h3" variant="headingSm">
              Highlights
            </Text>
            <ul className="StorefrontProductDetail__HighlightsList">
              {product.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </div>
          <InlineStack gap="200" wrap className="StorefrontProductDetail__Ctas">
            {cartItem ? (
              <>
                <Button size="large" variant="primary" tone="success" icon={CheckIcon} disabled>
                  Added to cart
                </Button>
                <Button size="large" variant="tertiary" onClick={() => removeCartItem(product.handle)}>
                  Remove from cart
                </Button>
              </>
            ) : (
              <Button size="large" variant="primary" onClick={() => addToCart(product.handle)}>
                Add to cart
              </Button>
            )}
            {quoteItem ? (
              <>
                <Button size="large" variant="secondary" tone="success" icon={CheckIcon} disabled>
                  Added to quote
                </Button>
                <Button size="large" variant="tertiary" onClick={() => removeQuoteItem(product.handle)}>
                  Remove from quote
                </Button>
              </>
            ) : (
              <Button size="large" variant="secondary" onClick={() => addToQuote(product.handle)}>
                Add to quote
              </Button>
            )}
            <Button size="large" variant="tertiary" onClick={() => navigate('/storefront/quote')}>
              View quote draft
            </Button>
            <Button size="large" variant="tertiary" onClick={() => navigate('/storefront/cart')}>
              View cart
            </Button>
          </InlineStack>
        </BlockStack>
      </section>

      <Divider />

      <section className="StorefrontProductDetail__Related">
        <BlockStack gap="200">
          <Text as="h2" variant="headingLg">
            Frequently paired with
          </Text>
          <ProductGrid
            products={relatedProducts}
            onViewProduct={(handle) => navigate(`/storefront/products/${handle}`)}
          />
        </BlockStack>
      </section>
    </div>
  );
}
