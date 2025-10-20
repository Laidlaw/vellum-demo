import { useNavigate } from 'react-router-dom';
import { Badge, BlockStack, Box, Button, Card, Divider, InlineStack, Text } from '@shopify/polaris';

import { QuantityStepper } from '../components/QuantityStepper';
import { getProductByHandle } from '../data/storefrontData';
import { useStorefrontState } from '../state/StorefrontState';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export function CartPage() {
  const navigate = useNavigate();
  const { state, updateCartQuantity, removeCartItem, moveItemToQuote, clearCart, cartCount } = useStorefrontState();

  const cartItems = state.cart
    .map((item) => {
      const product = getProductByHandle(item.handle);
      if (!product) return undefined;
      return {
        ...item,
        product,
        lineTotal: product.price * item.quantity,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <div className="StorefrontCart">
      <BlockStack gap="400">
        <BlockStack gap="150">
          <Text as="p" tone="subdued" variant="bodySm">
            Cart
          </Text>
          <Text as="h1" variant="headingXl">
            Ready to check out?
          </Text>
          <Text as="p" tone="subdued">
            Stage products for a direct purchase, or send them to a quote draft if you need pricing approvals first.
          </Text>
        </BlockStack>

        {cartItems.length ? (
          <div className="StorefrontCart__Layout">
            <Card roundedAbove="sm">
              <Box padding="300">
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingSm">
                      {cartCount} {cartCount === 1 ? 'item' : 'items'}
                    </Text>
                    <Button variant="tertiary" onClick={clearCart}>
                      Clear cart
                    </Button>
                  </InlineStack>

                  <Divider />

                  <BlockStack gap="300">
                    {cartItems.map((item) => (
                      <div key={item.handle} className="StorefrontCartItem">
                        <div className="StorefrontCartItem__Details">
                          <img src={item.product.image} alt={item.product.title} />
                          <BlockStack gap="100">
                            <BlockStack gap="050">
                              <Text as="h3" variant="headingSm">
                                {item.product.title}
                              </Text>
                              <Text as="span" tone="subdued" variant="bodySm">
                                {item.product.category}
                              </Text>
                            </BlockStack>
                            <Text as="p" tone="subdued" variant="bodySm">
                              {item.product.description}
                            </Text>
                            <Badge tone="info">{item.product.leadTime}</Badge>
                          </BlockStack>
                        </div>
                        <div className="StorefrontCartItem__Controls">
                          <QuantityStepper
                            value={item.quantity}
                            onChange={(next) => updateCartQuantity(item.handle, next)}
                          />
                          <Text as="span" variant="headingSm">
                            {currencyFormatter.format(item.lineTotal)}
                          </Text>
                          <InlineStack gap="100">
                            <Button variant="tertiary" onClick={() => moveItemToQuote(item.handle)}>
                              Move to quote
                            </Button>
                            <Button variant="tertiary" onClick={() => removeCartItem(item.handle)}>
                              Remove
                            </Button>
                          </InlineStack>
                        </div>
                      </div>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Box>
            </Card>

            <Card roundedAbove="sm">
              <Box padding="300">
                <BlockStack gap="300">
                  <Text as="h2" variant="headingSm">
                    Order summary
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" tone="subdued">
                        Subtotal
                      </Text>
                      <Text as="span">{currencyFormatter.format(subtotal)}</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" tone="subdued">
                        Shipping
                      </Text>
                      <Text as="span">Calculated at checkout</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" tone="subdued">
                        Taxes
                      </Text>
                      <Text as="span">Estimated at checkout</Text>
                    </InlineStack>
                  </BlockStack>
                  <Divider />
                  <InlineStack align="space-between">
                    <Text as="span" variant="headingMd">
                      Total
                    </Text>
                    <Text as="span" variant="headingMd">
                      {currencyFormatter.format(subtotal)}
                    </Text>
                  </InlineStack>
                  <Button variant="primary" disabled>
                    Proceed to checkout
                  </Button>
                  <Button variant="secondary" onClick={() => navigate('/storefront/quote')}>
                    Send to quote workflow
                  </Button>
                </BlockStack>
              </Box>
            </Card>
          </div>
        ) : (
          <Card roundedAbove="sm">
            <Box padding="400">
              <BlockStack gap="300" align="center">
                <Text as="h2" variant="headingLg">
                  Your cart is empty
                </Text>
                <Text as="p" tone="subdued">
                  Add products from the catalog or pull items back from an existing quote draft.
                </Text>
                <InlineStack gap="200" wrap align="center">
                  <Button onClick={() => navigate('/storefront/products')}>Browse catalog</Button>
                  <Button variant="secondary" onClick={() => navigate('/storefront/quote')}>
                    Review quote draft
                  </Button>
                </InlineStack>
              </BlockStack>
            </Box>
          </Card>
        )}
      </BlockStack>
    </div>
  );
}
