import { Card, Page, Text } from '@shopify/polaris';

export function DashboardPage() {
  return (
    <Page title="Home">
      <Card>
        <Text as="p" tone="subdued">
          This space will mirror Shopify's merchant home dashboard. For now, it
          confirms the Polaris frame is wired correctly.
        </Text>
      </Card>
    </Page>
  );
}
