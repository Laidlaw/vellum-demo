import { Button, InlineStack, Box, Text } from '@shopify/polaris';
import { MinusIcon, PlusIcon } from '@shopify/polaris-icons';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (nextValue: number) => void;
}

export function QuantityStepper({ value, min = 1, max, onChange }: QuantityStepperProps) {
  const handleDecrease = () => {
    const next = value - 1;
    if (next < min) return;
    onChange(next);
  };

  const handleIncrease = () => {
    const next = value + 1;
    if (typeof max === 'number' && next > max) return;
    onChange(next);
  };

  return (
    <InlineStack gap="050" blockAlign="center">
      <Button variant="tertiary" icon={MinusIcon} onClick={handleDecrease} accessibilityLabel="Decrease quantity" />
      <Box paddingInline="100">
        <Text as="span" variant="bodyMd">
          {value}
        </Text>
      </Box>
      <Button variant="tertiary" icon={PlusIcon} onClick={handleIncrease} accessibilityLabel="Increase quantity" />
    </InlineStack>
  );
}
