import { useNavigate } from 'react-router-dom';
import { BlockStack, Box, Button, Card, Text } from '@shopify/polaris';

export function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="StorefrontProfile">
      <Card roundedAbove="sm">
        <Box padding="400">
          <BlockStack gap="300">
            <BlockStack gap="100">
              <Text as="p" tone="subdued" variant="bodySm">
                Account
              </Text>
              <Text as="h1" variant="headingXl">
                Alex Morgan
              </Text>
            </BlockStack>
            <Text as="p" tone="subdued">
              Profile preferences would live here in a production experience. For this prototype, use the navigation to
              explore the storefront journey.
            </Text>
            <Button variant="secondary" onClick={() => navigate('/storefront')}>
              Back to storefront
            </Button>
          </BlockStack>
        </Box>
      </Card>
    </div>
  );
}
