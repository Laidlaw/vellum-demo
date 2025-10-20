import { useMemo } from 'react';
import {
  Badge,
  BlockStack,
  Card,
  DataTable,
  Icon,
  InlineStack,
  List,
  Page,
  Text,
} from '@shopify/polaris';
import { CircleChevronDownIcon, NoteIcon, PersonIcon } from '@shopify/polaris-icons';

import { useCustomerPortalContext, ALL_LOCATIONS_ID } from '../CustomerApp';
import type { CompanyContactRole } from '../../../data';
import { formatDateTime } from '../../../utils/formatters';

const ROLE_BADGE_TONE: Record<CompanyContactRole, 'success' | 'attention' | 'info' | 'subdued'> = {
  admin: 'info',
  finance: 'success',
  approver: 'attention',
  buyer: 'subdued',
  viewer: 'subdued',
};

function formatRole(role: CompanyContactRole) {
  return role
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

const PENDING_INVITES = [
  {
    id: 'invite-ops-west',
    email: 'ops-west@abstractindustrial.com',
    role: 'buyer',
    requestedAt: '2024-09-09T14:20:00Z',
  },
  {
    id: 'invite-ap',
    email: 'ap-team@abstractindustrial.com',
    role: 'finance',
    requestedAt: '2024-09-07T09:45:00Z',
  },
] as const;

const GUARDRAIL_NOTES = [
  'Quotes above $25K require approval from finance or admin roles.',
  'Buyers can submit quotes but must attach a PO before checkout.',
  'Location managers only see invoices tied to their assigned locations.',
];

export function TeamPage() {
  const { company, locations, activeLocationId, activeLocation } = useCustomerPortalContext();

  if (!company) {
    return (
      <Page title="User management" subtitle="Manage invite requests and role assignments">
        <Card>
          <Text as="p" tone="subdued">
            Team information is unavailable for this demo profile.
          </Text>
        </Card>
      </Page>
    );
  }

  const locationLookup = useMemo(() => new Map(locations.map((location) => [location.id, location])), [locations]);

  const filteredContacts = useMemo(() => {
    if (activeLocationId === ALL_LOCATIONS_ID) return company.contacts;
    if (!activeLocation) return [];
    return company.contacts.filter((contact) => contact.locationIds.includes(activeLocation.id));
  }, [activeLocation, activeLocationId, company.contacts]);

  const rows = filteredContacts.map((contact) => {
    const roleTone = ROLE_BADGE_TONE[contact.role] ?? 'subdued';
    const locationBadges = contact.locationIds.map((locationId) => {
      const location = locationLookup.get(locationId);
      const label = location?.code ?? location?.name ?? locationId;
      return (
        <Badge key={`${contact.id}-${locationId}`} tone="subdued">
          {label}
        </Badge>
      );
    });

    return [
      <Text key={`${contact.id}-name`} variant="bodyMd" fontWeight="medium">
        {contact.firstName} {contact.lastName}
      </Text>,
      <Badge key={`${contact.id}-role`} tone={roleTone}>
        {formatRole(contact.role)}
      </Badge>,
      contact.email,
      contact.phone ?? '—',
      <InlineStack key={`${contact.id}-locations`} gap="100">
        {locationBadges.length > 0 ? locationBadges : <Text tone="subdued">—</Text>}
      </InlineStack>,
      contact.lastActiveAt ? formatDateTime(contact.lastActiveAt) : '—',
    ];
  });

  const locationBadgeLabel =
    activeLocationId === ALL_LOCATIONS_ID ? `All ${locations.length} locations` : `${activeLocation?.name ?? 'Location'}`;

  return (
    <Page
      title="User management"
      subtitle="Manage invite requests and role assignments"
      primaryAction={{ content: 'Invite teammate', disabled: true }}
      secondaryActions={[{ content: 'Download access report', icon: NoteIcon }]}
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="200">
            <InlineStack gap="200" blockAlign="center">
              <Badge tone="info">{locationBadgeLabel}</Badge>
              <Text tone="subdued" variant="bodySm">
                {filteredContacts.length} active users
              </Text>
            </InlineStack>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
              headings={['Teammate', 'Role', 'Email', 'Phone', 'Locations', 'Last active']}
              rows={rows}
              footerContent={`${company.contacts.length} teammates connected`}
            />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="200">
            <InlineStack gap="200" blockAlign="center">
              <Icon source={PersonIcon} tone="subdued" />
              <Text variant="headingSm">Pending invites</Text>
            </InlineStack>
            <BlockStack gap="100">
              {PENDING_INVITES.map((invite) => (
                <BlockStack key={invite.id} gap="050">
                  <InlineStack gap="100" blockAlign="center">
                    <Badge tone="attention">{formatRole(invite.role as CompanyContactRole)}</Badge>
                    <Text variant="bodyMd">{invite.email}</Text>
                  </InlineStack>
                  <Text tone="subdued" variant="bodySm">
                    Requested {formatDateTime(invite.requestedAt)}
                  </Text>
                </BlockStack>
              ))}
            </BlockStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="200">
            <InlineStack gap="200" blockAlign="center">
              <Icon source={CircleChevronDownIcon} tone="subdued" />
              <Text variant="headingSm">Approval guardrails</Text>
            </InlineStack>
            <List>
              {GUARDRAIL_NOTES.map((note) => (
                <List.Item key={note}>{note}</List.Item>
              ))}
            </List>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
