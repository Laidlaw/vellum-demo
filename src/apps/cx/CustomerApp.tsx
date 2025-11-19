import { useCallback, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ActionList,
  type ActionListItemDescriptor,
  Badge,
  Button,
  Icon,
  InlineStack,
  Popover,
  Tabs,
  Text,
} from '@shopify/polaris';
import { StoreIcon } from '@shopify/polaris-icons';

import { AppFrame } from '../../layout/AppFrame';
import {
  INVOICES,
  QUOTES,
  getCompanyById,
  type Company,
  type CompanyLocation,
} from '../../data';
import { ORDER_CARDS } from './data/orders';

const BASE_PATH = '/cx';
const ACTIVE_COMPANY_ID = 'comp-abstract-industrial';
const COMPANY_NAME_FALLBACK = 'B2BPaymentsPlus';
export const ALL_LOCATIONS_ID = 'all';

type LocationFilterValue = typeof ALL_LOCATIONS_ID | string;

interface CustomerNavTab {
  id: string;
  label: string;
  path: string;
  badge?: string;
  matches: (path: string) => boolean;
}
interface CustomerLocationMenuProps {
  open: boolean;
  label: string;
  badge?: string;
  disabled?: boolean;
  onToggle: () => void;
  onClose: () => void;
  items: ActionListItemDescriptor[];
}

function CustomerLocationMenu({
  open,
  label,
  badge,
  disabled = false,
  onToggle,
  onClose,
  items,
}: CustomerLocationMenuProps) {
  return (
    <Popover
      active={open && !disabled}
      activator={
        <Button
          onClick={onToggle}
          disclosure="down"
          variant="tertiary"
          tone="subdued"
          disabled={disabled}
          accessibilityLabel="Filter by location"
        >
          <InlineStack gap="100" blockAlign="center">
            <Icon source={StoreIcon} tone="subdued" />
            <Text as="span" variant="bodyMd">
              {label}
            </Text>
            {badge ? <Badge tone="subdued">{badge}</Badge> : null}
          </InlineStack>
        </Button>
      }
      onClose={onClose}
      preferredAlignment="left"
    >
      <ActionList actionRole="menuitem" items={items} />
    </Popover>
  );
}

export interface CustomerPortalContextValue {
  company: Company | null;
  locations: CompanyLocation[];
  activeLocationId: LocationFilterValue;
  activeLocation?: CompanyLocation;
  setActiveLocationId: (locationId: LocationFilterValue) => void;
}

export function useCustomerPortalContext() {
  return useOutletContext<CustomerPortalContextValue>();
}

export function CustomerApp() {
  const location = useLocation();
  const navigate = useNavigate();

  const company = useMemo(() => getCompanyById(ACTIVE_COMPANY_ID) ?? null, []);
  const locations = company?.locations ?? [];

  const [activeLocationId, setActiveLocationId] = useState<LocationFilterValue>(ALL_LOCATIONS_ID);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);

  const activeLocation = useMemo(() => {
    if (!company || activeLocationId === ALL_LOCATIONS_ID) {
      return undefined;
    }

    return locations.find(({ id }) => id === activeLocationId);
  }, [company, locations, activeLocationId]);

  const normalizedPath = useMemo(() => {
    if (location.pathname.startsWith(BASE_PATH)) {
      const trimmed = location.pathname.slice(BASE_PATH.length);
      return trimmed ? trimmed : '/';
    }

    return location.pathname;
  }, [location.pathname]);

  const pendingApprovalQuotes = useMemo(() => {
    if (!company) return 0;
    return QUOTES.filter(
      (quote) => quote.companyId === company.id && quote.status === 'pending_approval',
    ).length;
  }, [company]);

  const invoicesNeedingAttention = useMemo(() => {
    if (!company) return 0;
    return INVOICES.filter((invoice) => {
      if (invoice.companyId !== company.id) return false;
      return ['due', 'overdue', 'partial', 'draft'].includes(invoice.status);
    }).length;
  }, [company]);

  const ordersAwaitingAction = useMemo(() => {
    return ORDER_CARDS.filter((order) => {
      const fulfillment = order.fulfillmentLabel.toLowerCase();
      const status = order.statusLabel.toLowerCase();
      return fulfillment.includes('payment') || status.includes('approval');
    }).length;
  }, []);

  const navTabs = useMemo<CustomerNavTab[]>(() => {
    return [
      {
        id: 'quotes',
        label: 'Quotes',
        path: '/quotes',
        badge: pendingApprovalQuotes ? `${pendingApprovalQuotes}` : undefined,
        matches: (path) => path.startsWith('/quotes'),
      },
      {
        id: 'orders',
        label: 'Orders',
        path: '/orders',
        badge: ordersAwaitingAction ? `${ordersAwaitingAction}` : undefined,
        matches: (path) => path.startsWith('/orders'),
      },
      {
        id: 'invoices',
        label: 'Invoices',
        path: '/invoices',
        badge: invoicesNeedingAttention ? `${invoicesNeedingAttention}` : undefined,
        matches: (path) => path.startsWith('/invoices') || path.startsWith('/payment'),
      },
    ];
  }, [invoicesNeedingAttention, ordersAwaitingAction, pendingApprovalQuotes]);

  const selectedTabIndex = useMemo(() => {
    return navTabs.findIndex((tab) => tab.matches(normalizedPath));
  }, [navTabs, normalizedPath]);

  const tabs = useMemo(
    () =>
      navTabs.map((tab) => ({
        id: tab.id,
        content: tab.label,
        panelID: `${tab.id}-panel`,
        badge: tab.badge,
      })),
    [navTabs],
  );

  const hasLocations = locations.length > 0;
  const locationMenuLabel = activeLocation ? activeLocation.name : 'All locations';
  const locationMenuBadge = activeLocation?.code;

  const locationMenuItems = useMemo<ActionListItemDescriptor[]>(() => {
    if (!hasLocations) {
      return [
        {
          content: 'No locations available',
          disabled: true,
        },
      ];
    }

    const items: ActionListItemDescriptor[] = [
      {
        content: 'All locations',
        active: activeLocationId === ALL_LOCATIONS_ID,
        helpText: `${locations.length} total`,
        onAction: () => {
          setActiveLocationId(ALL_LOCATIONS_ID);
          setLocationMenuOpen(false);
        },
      },
    ];

    locations.forEach((location) => {
      const highlights: string[] = [];
      if (location.isDefaultBilling) highlights.push('Default billing');
      if (location.isDefaultShipping) highlights.push('Default shipping');

      items.push({
        content: location.name,
        active: activeLocationId === location.id,
        helpText: highlights.length > 0 ? highlights.join(' · ') : undefined,
        suffix: location.code ? <Badge tone="subdued">{location.code}</Badge> : undefined,
        onAction: () => {
          setActiveLocationId(location.id);
          setLocationMenuOpen(false);
        },
      });
    });

    return items;
  }, [activeLocationId, hasLocations, locations]);

  const handleNavigate = useCallback(
    (path: string) => {
      const destination = path === '/' ? BASE_PATH : `${BASE_PATH}${path}`;
      navigate(destination);
    },
    [navigate],
  );

  const handleTabSelect = useCallback(
    (selectedIndex: number) => {
      const tab = navTabs[selectedIndex];
      if (!tab) return;
      handleNavigate(tab.path);
    },
    [handleNavigate, navTabs],
  );

  const handleLocationMenuToggle = useCallback(() => {
    setLocationMenuOpen((current) => !current);
  }, []);

  const handleLocationMenuClose = useCallback(() => setLocationMenuOpen(false), []);

  const setLocationFilter = useCallback((locationId: LocationFilterValue) => {
    setActiveLocationId(locationId);
  }, []);

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const handleAccountMenuToggle = useCallback(() => {
    setAccountMenuOpen((current) => !current);
  }, []);

  const handleAccountMenuClose = useCallback(() => setAccountMenuOpen(false), []);

  const headerNavigation = (
    <InlineStack
      align="space-between"
      blockAlign="center"
      gap="300"
      wrap
      className="CustomerAppHeaderRow"
    >
      <InlineStack gap="200" blockAlign="center" wrap className="CustomerAppHeaderPrimaryGroup">
        <Button
          variant="plain"
          tone="subdued"
          onClick={() => handleNavigate('/')}
          className="CustomerAppHeaderCompany"
        >
          <Text as="span" variant="headingLg" fontWeight="semibold">
            {company?.name ?? COMPANY_NAME_FALLBACK}
          </Text>
        </Button>
        <div className="CustomerAppHeaderLocationMenu">
          <CustomerLocationMenu
            open={locationMenuOpen}
            label={locationMenuLabel}
            badge={locationMenuBadge}
            disabled={!hasLocations}
            onToggle={handleLocationMenuToggle}
            onClose={handleLocationMenuClose}
            items={locationMenuItems}
          />
        </div>
        <div className="CustomerAppHeaderTabs">
          <Tabs
            tabs={tabs}
            selected={selectedTabIndex >= 0 ? selectedTabIndex : -1}
            onSelect={handleTabSelect}
            fitted
          />
        </div>
      </InlineStack>
      <InlineStack gap="150" blockAlign="center" wrap className="CustomerAppHeaderActions">
        <Popover
          active={accountMenuOpen}
          activator={
            <Button
              variant="tertiary"
              tone="subdued"
              disclosure="down"
              onClick={handleAccountMenuToggle}
            >
              Account &amp; team
            </Button>
          }
          onClose={handleAccountMenuClose}
          preferredAlignment="right"
        >
          <ActionList
            actionRole="menuitem"
            items={[
              {
                content: 'Company profile',
                onAction: () => {
                  handleAccountMenuClose();
                  handleNavigate('/company');
                },
              },
              {
                content: 'Team management',
                onAction: () => {
                  handleAccountMenuClose();
                  handleNavigate('/team');
                },
              },
              {
                content: 'Locations',
                onAction: () => {
                  handleAccountMenuClose();
                  handleNavigate('/locations');
                },
              },
            ]}
          />
        </Popover>
      </InlineStack>
    </InlineStack>
  );

  return (
    <AppFrame
      basePath={BASE_PATH}
      variant="minimal"
      headerNavigation={headerNavigation}
      searchPlaceholder="Search quotes or invoices"
      userIdentity={{ name: 'Sarah Chen', detail: 'Finance Manager', initials: 'SC' }}
      environmentBreadcrumbs={[
        { label: 'Experience switcher', path: '/' },
        { label: 'Customer admin', path: '/cx' },
      ]}
    >
      <Outlet
        context={{
          company,
          locations,
          activeLocationId,
          activeLocation,
          setActiveLocationId: setLocationFilter,
        }}
      />
    </AppFrame>
  );
}
