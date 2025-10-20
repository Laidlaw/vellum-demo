import { Route, Routes } from 'react-router-dom';

import { StorefrontLayout } from './components/StorefrontLayout';
import { StorefrontHome } from './pages/StorefrontHome';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { AboutPage } from './pages/AboutPage';
import { QuotePage } from './pages/QuotePage';
import { BusinessApplicationPage } from './pages/BusinessApplicationPage';
import { ProfilePage } from './pages/ProfilePage';
import { StorefrontProvider } from './state/StorefrontState';

import './storefront.css';

export function StorefrontApp() {
  return (
    <StorefrontProvider>
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route index element={<StorefrontHome />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:productHandle" element={<ProductDetailPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="quote" element={<QuotePage />} />
          <Route path="business-application" element={<BusinessApplicationPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="*" element={<StorefrontHome />} />
        </Route>
      </Routes>
    </StorefrontProvider>
  );
}
