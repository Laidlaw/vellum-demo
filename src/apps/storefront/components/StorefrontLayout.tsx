import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Button, InlineStack, Text } from '@shopify/polaris';
import { CartIcon } from '@shopify/polaris-icons';

import storefrontLogo from '../../../assets/Logo-blue-Large.png';
import { StorefrontProfileMenu } from './StorefrontProfileMenu';
import { useStorefrontState } from '../state/StorefrontState';

const navLinks = [
  { label: 'Shop', to: '/storefront/products' },
  { label: 'Collections', to: '/storefront/collections' },
  { label: 'About', to: '/storefront/about' },
];

export function StorefrontLayout() {
  const navigate = useNavigate();
  const { cartCount, quoteDraftCount } = useStorefrontState();

  return (
    <div className="StorefrontLayout">
      <header className="StorefrontLayout__Header">
        <div className="StorefrontLayout__HeaderInner">
          <NavLink to="/storefront" className="StorefrontLayout__Brand">
            <img src={storefrontLogo} alt="Vellum Industrial Supply" />
            <span>Vellum Supply</span>
          </NavLink>
          <nav className="StorefrontLayout__Nav">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => `StorefrontLayout__NavLink${isActive ? ' is-active' : ''}`}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <InlineStack align="end" gap="200" blockAlign="center">
            <Button variant="secondary" onClick={() => navigate('/storefront/quote')}>
              {quoteDraftCount ? `Quote draft (${quoteDraftCount})` : 'Quote draft'}
            </Button>
            <Button onClick={() => navigate('/storefront/cart')} icon={CartIcon} accessibilityLabel="View cart">
              {cartCount ? `Cart (${cartCount})` : 'Cart'}
            </Button>
            <StorefrontProfileMenu />
          </InlineStack>
        </div>
      </header>
      <main className="StorefrontLayout__Content">
        <Outlet />
      </main>
      <footer className="StorefrontLayout__Footer">
        <div className="StorefrontLayout__FooterInner">
          <Text as="p" variant="bodySm" tone="subdued">
            © {new Date().getFullYear()} Vellum Supply. Built for procurement teams.
          </Text>
          <InlineStack gap="200">
            <a href="#shipping" className="StorefrontLayout__FooterLink">
              Shipping
            </a>
            <a href="#returns" className="StorefrontLayout__FooterLink">
              Returns
            </a>
            <a href="#contact" className="StorefrontLayout__FooterLink">
              Contact
            </a>
          </InlineStack>
        </div>
      </footer>
    </div>
  );
}
