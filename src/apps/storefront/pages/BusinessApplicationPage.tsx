import { useNavigate } from 'react-router-dom';
import { BlockStack, Box, Button, Card, InlineStack, Text, TextField } from '@shopify/polaris';
import { useState } from 'react';

export function BusinessApplicationPage() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [context, setContext] = useState('');

  return (
    <div className="StorefrontBusiness">
      <Card roundedAbove="sm">
        <Box padding="400">
          <BlockStack gap="400">
            <BlockStack gap="200">
              <Text as="p" tone="subdued" variant="bodySm">
                Business onboarding
              </Text>
              <Text as="h1" variant="headingXl">
                Submit a Business Application
              </Text>
              <Text as="p" tone="subdued">
                Share a few details about your organization so our team can activate preferred pricing, payment terms,
                and catalog visibility tailored to your buyers.
              </Text>
            </BlockStack>

            <TextField
              autoComplete="organization"
              label="Legal business name"
              value={companyName}
              onChange={setCompanyName}
              placeholder="Vellum Fabrication Co."
            />

            <TextField
              autoComplete="off"
              label="Primary buyer team size"
              value={teamSize}
              onChange={setTeamSize}
              placeholder="12"
              type="number"
              min={0}
            />

          <Text
              label="Tell us about your purchasing workflows"
              helpText="Highlight approval tiers, payment terms, and the product categories you source frequently."
              value={context}
              onChange={setContext}
            />

            <InlineStack gap="200" wrap>
              <Button variant="primary">Submit application</Button>
              <Button variant="secondary" onClick={() => navigate('/storefront')}>
                Cancel
              </Button>
            </InlineStack>

            <Text as="p" tone="subdued" variant="bodySm">
              Once submitted, this information would route to the merchant team to verify eligibility and configure your
              account in the full experience.
            </Text>
          </BlockStack>
        </Box>
      </Card>
    </div>
  );
}
