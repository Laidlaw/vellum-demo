import { Badge, BlockStack, Box, Button, InlineStack, Text, Tooltip } from '@shopify/polaris';
import { CheckIcon } from '@shopify/polaris-icons';

import type { StorefrontProduct } from '../data/storefrontData';
import { useStorefrontState } from '../state/StorefrontState';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

interface ProductCardProps {
  product: StorefrontProduct;
  onViewProduct: (handle: string) => void;
  showCategory?: boolean;
}

export function ProductCard({ product, onViewProduct, showCategory = false }: ProductCardProps) {
  const { state, addToCart, addToQuote, removeCartItem, removeQuoteItem } = useStorefrontState();
  const cartItem = state.cart.find((item) => item.handle === product.handle);
  const quoteItem = state.quoteDraft.items.find((item) => item.handle === product.handle);

  return (
    <Box padding="200" className="StorefrontProductCard">
      <BlockStack gap="300">
        <div className="StorefrontProductCard__Media">
          <img src={product.image} alt={product.title} loading="lazy" />
          {product.badges?.map((badge) => (
            <Badge key={badge} tone="success">
              {badge}
            </Badge>
          ))}
        </div>
        <BlockStack gap="100">
          {showCategory ? (
            <Text as="p" tone="subdued" variant="bodySm">
              {product.category}
            </Text>
          ) : null}
          <Text as="h3" variant="headingMd">
            {product.title}
          </Text>
          <Text as="p" tone="subdued">
            {product.description}
          </Text>
        </BlockStack>
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="050">
            <Text as="span" variant="headingMd">
              {currencyFormatter.format(product.price)}
            </Text>
            <Text as="span" tone="subdued" variant="bodySm">
              {product.unit}
            </Text>
          </BlockStack>
          <InlineStack gap="100" wrap>
            {cartItem ? (
              <>
                <Button variant="primary" tone="success" icon={CheckIcon} disabled>
                  Added to cart
                </Button>
                <Button variant="tertiary" onClick={() => removeCartItem(product.handle)}>
                  Remove from cart
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={() => addToCart(product.handle)}>
                Add to cart
              </Button>
            )}
            {quoteItem ? (
              <>
                <Button variant="secondary" tone="success" icon={CheckIcon} disabled>
                  Added to quote
                </Button>
                <Button variant="tertiary" onClick={() => removeQuoteItem(product.handle)}>
                  Remove from quote
                </Button>
              </>
            ) : (
              <Tooltip content="Stage items for a pricing request">
                <Button variant="secondary" onClick={() => addToQuote(product.handle)}>
                  Add to quote
                </Button>
              </Tooltip>
            )}
            <Button variant="tertiary" onClick={() => onViewProduct(product.handle)}>
              View details
            </Button>
          </InlineStack>
        </InlineStack>
      </BlockStack>
    </Box>
  );
}
