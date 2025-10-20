import { useCallback, useState } from 'react';
import { ActionList, Avatar, Button, Icon, InlineStack, Popover, Text } from '@shopify/polaris';
import { PersonIcon } from '@shopify/polaris-icons';

export function StorefrontProfileMenu() {
  const [active, setActive] = useState(false);

  const toggleActive = useCallback(() => setActive((value) => !value), []);
  const handleClose = useCallback(() => setActive(false), []);

  const activator = (
    <Button onClick={toggleActive} disclosure="down" variant="tertiary">
      <InlineStack gap="150" align="center" blockAlign="center">
        <Avatar customer name="Alex Morgan" initials="AM" />
        <div className="StorefrontProfileMenu__Label">
          <Text as="span" variant="bodySm" fontWeight="semibold">
            Alex Morgan
          </Text>
          <InlineStack gap="050" align="start" blockAlign="center">
            <Icon source={PersonIcon} tone="subdued" />
            <Text as="span" tone="subdued" variant="bodyXs">
              Procurement lead
            </Text>
          </InlineStack>
        </div>
      </InlineStack>
    </Button>
  );

  return (
    <Popover
      active={active}
      activator={activator}
      onClose={handleClose}
      autofocusTarget="first-node"
      preferredAlignment="right"
    >
      <ActionList
        onActionAnyItem={handleClose}
        items={[
          { content: 'View profile', url: '/storefront/profile' },
          { content: 'Submit a Business Application', url: '/storefront/business-application' },
          { content: 'Sign out', onAction: handleClose },
        ]}
      />
    </Popover>
  );
}
