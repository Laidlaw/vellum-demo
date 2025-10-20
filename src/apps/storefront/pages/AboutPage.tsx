import { BlockStack, Card, InlineStack, Text } from '@shopify/polaris';

export function AboutPage() {
  return (
    <div className="StorefrontAbout">
      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text as="p" tone="subdued" variant="bodySm">
            About Vellum Supply
          </Text>
          <Text as="h1" variant="headingXl">
            Why we built a B2B storefront
          </Text>
          <Text as="p" tone="subdued">
            The Vellum storefront is a proof-of-concept for how industrial distributors can deliver a Shopify-quality
            buying experience without losing the nuance of negotiated pricing, quote approvals, and account management.
          </Text>
        </BlockStack>

        <div className="StorefrontAbout__Grid">
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Built around quotes, not carts
              </Text>
              <Text as="p" tone="subdued">
                Buyers can stage items, capture site requirements, and send structured quote requests to sales teams.
                Once approved, quotes convert to orders with no re-keying.
              </Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Connected to merchant back office
              </Text>
              <Text as="p" tone="subdued">
                This storefront pairs with the merchant console and customer portal already in this prototype, keeping
                inventory, pricing, and account history aligned.
              </Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Designed for field teams
              </Text>
              <Text as="p" tone="subdued">
                Mobile-friendly layouts, quick reorder pathways, and curated collections help busy crews source what they
                need quickly.
              </Text>
            </BlockStack>
          </Card>
        </div>

        <InlineStack align="center">
          <Text as="p" tone="subdued" variant="bodySm">
            Ready to explore procurement workflows? Jump into the customer or merchant experiences from the main
            launcher.
          </Text>
        </InlineStack>
      </BlockStack>
    </div>
  );
}
