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
  Text,
} from '@shopify/polaris';
import { StoreIcon } from '@shopify/polaris-icons';

import { AppFrame } from '../../layout/AppFrame';
import { getCompanyById, type Company, type CompanyLocation } from '../../data';

const BASE_PATH = '/cx';
const ACTIVE_COMPANY_ID = 'comp-abstract-industrial';
const COMPANY_NAME_FALLBACK = 'B2BPaymentsPlus';
export const ALL_LOCATIONS_ID = 'all';

type LocationFilterValue = typeof ALL_LOCATIONS_ID | string;
type MenuKey = 'purchases' | 'organization';

interface MenuItemDescriptor {
  content: string;
  path: string;
  active: boolean;
}

interface CustomerNavMenuProps {
  label: string;
  open: boolean;
  pressed: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNavigate: (path: string) => void;
  items: MenuItemDescriptor[];
}

function CustomerNavMenu({
  label,
  open,
  pressed,
  onToggle,
  onClose,
  onNavigate,
  items,
}: CustomerNavMenuProps) {
  return (
    <Popover
      active={open}
      activator={
        <Button
          onClick={onToggle}
          disclosure="down"
          variant="tertiary"
          tone="subdued"
          pressed={pressed}
          accessibilityLabel={`${label} menu`}
        >
          {label}
        </Button>
      }
      onClose={onClose}
      preferredAlignment="left"
    >
      <ActionList
        actionRole="menuitem"
        items={items.map(({ content, path, active }) => ({
          content,
          active,
          onAction: () => {
            onNavigate(path);
            onClose();
          },
        }))}
      />
    </Popover>
  );
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

  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
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

  const purchasesMenuItems = useMemo<MenuItemDescriptor[]>(
    () => [
      { content: 'Quotes', path: '/quotes', active: normalizedPath.startsWith('/quotes') },
      { content: 'Invoices', path: '/invoices', active: normalizedPath.startsWith('/invoices') },
      { content: 'History', path: '/history', active: normalizedPath.startsWith('/history') },
    ],
    [normalizedPath],
  );

  const organizationMenuItems = useMemo<MenuItemDescriptor[]>(
    () => [
      { content: 'User Management', path: '/team', active: normalizedPath.startsWith('/team') },
      { content: 'Company Info', path: '/company', active: normalizedPath.startsWith('/company') },
      { content: 'Locations', path: '/locations', active: normalizedPath.startsWith('/locations') },
    ],
    [normalizedPath],
  );

  const isPurchasesActive = purchasesMenuItems.some((item) => item.active);
  const isOrganizationActive = organizationMenuItems.some((item) => item.active);
  const isOrdersActive = normalizedPath.startsWith('/orders');

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

  const handleMenuToggle = useCallback((menu: MenuKey) => {
    setActiveMenu((current) => (current === menu ? null : menu));
  }, []);

  const handleMenuClose = useCallback(() => setActiveMenu(null), []);

  const handleNavigate = useCallback(
    (path: string) => {
      const destination = path === '/' ? BASE_PATH : `${BASE_PATH}${path}`;
      navigate(destination);
    },
    [navigate],
  );

  const handleLocationMenuToggle = useCallback(() => {
    setLocationMenuOpen((current) => !current);
  }, []);

  const handleLocationMenuClose = useCallback(() => setLocationMenuOpen(false), []);

  const setLocationFilter = useCallback((locationId: LocationFilterValue) => {
    setActiveLocationId(locationId);
  }, []);

  const headerNavigation = (
    <InlineStack
      align="space-between"
      blockAlign="center"
      gap="400"
      className="CustomerAppHeaderNav"
    >
      <InlineStack gap="200" blockAlign="center" className="CustomerAppHeaderTitleGroup">
        <Text as="h1" variant="headingLg" className="CustomerAppHeaderTitle">
          {company?.name ?? COMPANY_NAME_FALLBACK}
        </Text>
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
      </InlineStack>
      <InlineStack
        gap="200"
        blockAlign="center"
        className="CustomerAppHeaderMenuGroup"
      >
        <CustomerNavMenu
          label="Transactions"
          open={activeMenu === 'purchases'}
          pressed={isPurchasesActive}
          onToggle={() => handleMenuToggle('purchases')}
          onClose={handleMenuClose}
          onNavigate={handleNavigate}
          items={purchasesMenuItems}
        />
        <Button
          variant="tertiary"
          tone="subdued"
          pressed={isOrdersActive}
          onClick={() => {
            handleMenuClose();
            handleNavigate('/orders');
          }}
        >
          Orders
        </Button>
        <CustomerNavMenu
          label="Business settings"
          open={activeMenu === 'organization'}
          pressed={isOrganizationActive}
          onToggle={() => handleMenuToggle('organization')}
          onClose={handleMenuClose}
          onNavigate={handleNavigate}
          items={organizationMenuItems}
        />
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
