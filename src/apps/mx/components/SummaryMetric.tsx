import type { ReactNode } from 'react';
import { BlockStack, Text } from '@shopify/polaris';

interface SummaryMetricProps {
  label: string;
  value: ReactNode;
  tone?: 'subdued' | 'success' | 'critical' | 'attention' | 'primary';
}

export function SummaryMetric({ label, value, tone = 'subdued' }: SummaryMetricProps) {
  return (
    <BlockStack gap="050">
      <Text as="span" variant="headingMd">
        {value}
      </Text>
      <Text as="span" tone={tone} variant="bodySm">
        {label}
      </Text>
    </BlockStack>
  );
}
