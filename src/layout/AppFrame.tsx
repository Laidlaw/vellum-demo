import {
  Frame,
  Navigation,
  TopBar,
  Box,
  Button,
  InlineStack,
  Modal,
  BlockStack,
  Text,
  ActionList,
  Popover,
} from '@shopify/polaris';
import shopifyLogo from '../assets/shopify-placeholder.png';
import {
  HomeFilledIcon,
  OrderIcon,
  ProductIcon,
  ProfileIcon,
  SettingsIcon,
  CheckCircleIcon,
  NotificationIcon,
  GlobeIcon,
} from '@shopify/polaris-icons';
import type { ComponentType, ReactNode, SVGProps, MouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  label: string;
  url: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: string;
  disabled?: boolean;
  subNavigationItems?: Array<{
    label: string;
    url: string;
    selected?: boolean;
    disabled?: boolean;
  }>;
  selected?: boolean;
}

const baseLogo = {
  topBarSource: shopifyLogo,
  accessibilityLabel: 'Shopify B2B Merchant Admin',
  url: '/',
};

const DEFAULT_USER_MENU_ITEMS = [
  { content: 'Profile settings' },
  { content: 'Notifications' },
  { content: 'Sign out' },
] as const;

function buildDefaultNavigation(
  locationPath: string,
  basePath: string,
  navigateTo: (path: string) => void,
) {
  const normalizedPath =
    basePath && locationPath.startsWith(basePath)
      ? locationPath.slice(basePath.length) || '/'
      : locationPath;

  const isCustomersPath = normalizedPath.startsWith('/customers');
  const isCompaniesPath = normalizedPath.startsWith('/companies');

  const customerNavItems: NavItem[] = [
    {
      label: 'Customers',
      url: '/customers',
      icon: ProfileIcon,
      badge: 'MX',
      selected: isCustomersPath || isCompaniesPath,
      subNavigationItems: [
        {
          label: 'Segments',
          url: '/customers/segments',
          disabled: true,
        },
        {
          label: 'Companies',
          url: '/companies',
          selected: isCompaniesPath,
        },
      ],
    },
  ];

  const items: NavItem[] = [
    { label: 'Home', url: '/', icon: HomeFilledIcon, selected: normalizedPath === '/' },
    { label: 'Orders', url: '/orders', icon: OrderIcon, disabled: true },
    { label: 'Products', url: '/products', icon: ProductIcon, disabled: true },
    ...customerNavItems,
    {
      label: 'Invoices',
      url: '/quotes',
      icon: CheckCircleIcon,
      selected: normalizedPath.startsWith('/quotes'),
    },
  ];

  return (
    <>
      <Navigation.Section
        items={items.map((item) => {
          const relativeUrl = item.url || '/';
          const absoluteUrl =
            basePath && relativeUrl
              ? `${basePath}${relativeUrl === '/' ? '' : relativeUrl}`
              : relativeUrl;

          return {
            ...item,
            icon: item.icon,
            url: absoluteUrl,
            onClick: (event?: MouseEvent<HTMLAnchorElement>) => {
              event?.preventDefault();
              if (!item.disabled) {
                navigateTo(relativeUrl);
              }
            },
            subNavigationItems: item.subNavigationItems?.map((subItem) => {
              const subRelativeUrl = subItem.url || '/';
              const subAbsoluteUrl =
                basePath && subRelativeUrl
                  ? `${basePath}${subRelativeUrl}`
                  : subRelativeUrl;

              return {
                ...subItem,
                url: subAbsoluteUrl,
                onClick: (event?: MouseEvent<HTMLAnchorElement>) => {
                  event?.preventDefault();
                  if (!subItem.disabled) {
                    navigateTo(subRelativeUrl);
                  }
                },
              };
            }),
          };
        })}
      />
      <Navigation.Section
        separator
        items={[
          {
            label: 'Settings',
            url: '/settings',
            icon: SettingsIcon,
            disabled: true,
          },
        ]}
      />
    </>
  );
}

export interface NavigationBuilderArgs {
  locationPath: string;
  basePath: string;
  navigate: (path: string) => void;
}

export type NavigationBuilder = (args: NavigationBuilderArgs) => ReactNode;

interface AppFrameProps {
  children?: ReactNode;
  basePath?: string;
  navigationBuilder?: NavigationBuilder;
  searchPlaceholder?: string;
  userIdentity?: {
    name: string;
    detail?: string;
    initials?: string;
  };
  environmentBreadcrumbs?: Array<{ label: string; path?: string }>;
  variant?: 'default' | 'minimal';
  headerNavigation?: ReactNode;
}

export function AppFrame({
  children,
  basePath = '',
  navigationBuilder,
  searchPlaceholder,
  userIdentity,
  environmentBreadcrumbs = [],
  variant = 'default',
  headerNavigation,
}: AppFrameProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [environmentSwitcherOpen, setEnvironmentSwitcherOpen] = useState(false);
  const [inlineUserMenuOpen, setInlineUserMenuOpen] = useState(false);
  const isMinimal = variant === 'minimal';
  const shouldShowTopBar = !isMinimal;
  const shouldShowNavigation = !isMinimal;
  const isCustomerMinimalHeader = !shouldShowTopBar && basePath.startsWith('/cx');
  const headerClassName = [
    'AppFrameCompactHeader',
    isCustomerMinimalHeader ? 'CustomerAppHeader' : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  const headerPaddingInline = isCustomerMinimalHeader ? undefined : { xs: '400', sm: '500' };
  const headerPaddingBlock = isCustomerMinimalHeader ? undefined : { xs: '300', sm: '400' };

  const handleNavigationToggle = useCallback(
    () => setMobileNavOpen((open) => !open),
    [],
  );

  const handleNavigationDismiss = useCallback(
    () => setMobileNavOpen(false),
    [],
  );

  const toggleInlineUserMenu = useCallback(
    () => setInlineUserMenuOpen((open) => !open),
    [],
  );

  const closeInlineUserMenu = useCallback(() => setInlineUserMenuOpen(false), []);

  useEffect(() => {
    if (!shouldShowNavigation && mobileNavOpen) {
      setMobileNavOpen(false);
    }
  }, [mobileNavOpen, shouldShowNavigation]);

  const contextualBreadcrumbs = useMemo(() => {
    const crumbs = [...environmentBreadcrumbs];
    const relativePath = basePath && location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length) || '/'
      : location.pathname;
    crumbs.push({ label: `Current: ${relativePath}` });
    return crumbs;
  }, [environmentBreadcrumbs, location.pathname, basePath]);

  const navigationMarkup = useMemo(() => {
    if (!shouldShowNavigation) {
      return undefined;
    }

    const builder = navigationBuilder
      ? navigationBuilder
      : ({ locationPath, basePath: currentBasePath, navigate }: NavigationBuilderArgs) =>
          buildDefaultNavigation(locationPath, currentBasePath, navigate);

    return (
      <Navigation location={location.pathname}>
        {builder({
          locationPath: location.pathname,
          basePath,
          navigate: (path: string) => navigate(`${basePath}${path}`),
        })}
      </Navigation>
    );
  }, [basePath, location.pathname, navigate, navigationBuilder, shouldShowNavigation]);

  const searchFieldMarkup = shouldShowTopBar ? (
    <TopBar.SearchField
      onChange={setSearchValue}
      value={searchValue}
      placeholder={searchPlaceholder ?? 'Search'}
      showFocusBorder
    />
  ) : undefined;

  const secondaryMenuMarkup = shouldShowTopBar ? (
    <InlineStack gap="200" blockAlign="center" className="AppFrameSecondaryActions">
      <Button
        icon={NotificationIcon}
        variant="tertiary"
        tone="subdued"
        size="slim"
        accessibilityLabel="Notifications"
      />
      <Button
        icon={GlobeIcon}
        variant="tertiary"
        tone="subdued"
        size="slim"
        accessibilityLabel="Switch environment"
        onClick={() => setEnvironmentSwitcherOpen(true)}
      />
    </InlineStack>
  ) : undefined;

  const userMenuMarkup = shouldShowTopBar && userIdentity ? (
    <TopBar.UserMenu
      actions={[{ items: DEFAULT_USER_MENU_ITEMS.map(({ content }) => ({ content })) }]}
      name={userIdentity.name}
      detail={userIdentity.detail}
      initials={userIdentity.initials}
    />
  ) : null;

  const topBarMarkup = shouldShowTopBar ? (
    <TopBar
      showNavigationToggle
      userMenu={userMenuMarkup}
      searchField={searchFieldMarkup}
      secondaryMenu={secondaryMenuMarkup}
      onNavigationToggle={handleNavigationToggle}
    />
  ) : undefined;

  const breadcrumbTrail = environmentBreadcrumbs.map((crumb) => crumb.label).join(' / ');

  const inlineUserMenuMarkup = !shouldShowTopBar && userIdentity ? (
    <Popover
      active={inlineUserMenuOpen}
      activator={
        <Button
          icon={ProfileIcon}
          variant="tertiary"
          tone="subdued"
          size="slim"
          accessibilityLabel="User menu"
          onClick={toggleInlineUserMenu}
        />
      }
      onClose={closeInlineUserMenu}
      preferredAlignment="right"
    >
      <ActionList
        actionRole="menuitem"
        items={DEFAULT_USER_MENU_ITEMS.map(({ content }) => ({
          content,
          onAction: () => {
            closeInlineUserMenu();
          },
        }))}
      />
    </Popover>
  ) : null;

  const inlineHeaderMarkup = !shouldShowTopBar && (breadcrumbTrail || userIdentity || headerNavigation) ? (
    <Box paddingBlock={headerPaddingBlock} paddingInline={headerPaddingInline} className={headerClassName}>
      <div className={isCustomerMinimalHeader ? 'CustomerAppHeaderInner' : undefined}>
        <BlockStack
          gap="200"
          className={isCustomerMinimalHeader ? 'CustomerAppHeaderStack' : undefined}
        >
          {/* {breadcrumbTrail ? (
            <Text variant="bodySm" tone="subdued">
              {breadcrumbTrail}
            </Text>
          ) : null} */}
          <InlineStack align="space-between" blockAlign="center" gap="200">
            {headerNavigation ? headerNavigation : <span />}
            <InlineStack gap="200" blockAlign="center">
              <Button
                icon={GlobeIcon}
                variant="tertiary"
                tone="subdued"
                size="slim"
                accessibilityLabel="Switch environment"
                onClick={() => setEnvironmentSwitcherOpen(true)}
              />
              {inlineUserMenuMarkup}
            </InlineStack>
          </InlineStack>
        </BlockStack>
      </div>
    </Box>
  ) : null;

  const logo = useMemo(
    () => ({
      ...baseLogo,
      url: basePath || '/',
    }),
    [basePath],
  );

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={shouldShowNavigation ? mobileNavOpen : false}
      onNavigationDismiss={handleNavigationDismiss}
      logo={logo}
    >
      <Modal
        open={environmentSwitcherOpen}
        onClose={() => setEnvironmentSwitcherOpen(false)}
        title="Switch context"
        primaryAction={{ content: 'Close', onAction: () => setEnvironmentSwitcherOpen(false) }}
      >
        <Modal.Section>
          <BlockStack gap="200" className="AppFrameEnvironmentModal">
            <Text tone="subdued" variant="bodySm">Navigate between experiences.</Text>
            <BlockStack gap="150">
              {contextualBreadcrumbs.map((crumb) => (
                crumb.path ? (
                  <Button
                    key={crumb.label}
                    plain
                    onClick={() => {
                      if (crumb.path) {
                        navigate(crumb.path);
                      }
                      setEnvironmentSwitcherOpen(false);
                    }}
                  >
                    {crumb.label}
                  </Button>
                ) : (
                  <Text key={crumb.label} tone="subdued" variant="bodySm">
                    {crumb.label}
                  </Text>
                )
              ))}
              {contextualBreadcrumbs.length === 1 ? (
                <Text tone="subdued" variant="bodySm">No alternate environments configured.</Text>
              ) : null}
            </BlockStack>
          </BlockStack>
        </Modal.Section>
      </Modal>
      {inlineHeaderMarkup}
      <Box paddingInline={{ xs: '400', sm: '500' }} paddingBlockStart="0">
        {children ?? <Outlet />}
      </Box>
    </Frame>
  );
}
