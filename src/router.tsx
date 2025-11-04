import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';

import { ExperienceLanding } from './apps/ExperienceLanding';
import { ExperienceLayout } from './apps/ExperienceLayout';
import { CustomerApp } from './apps/cx/CustomerApp';
import { DashboardPage as CustomerDashboardPage } from './apps/cx/pages/DashboardPage';
import { QuotesPage } from './apps/cx/pages/QuotesPage';
import { QuoteDetailPage } from './apps/cx/pages/QuoteDetailPage';
import { QuoteApprovalPage } from './apps/cx/pages/QuoteApprovalPage';
import { InvoicesPage } from './apps/cx/pages/InvoicesPage';
import { InvoiceDetailPage } from './apps/cx/pages/InvoiceDetailPage';
import { PaymentPage } from './apps/cx/pages/PaymentPage';
import { TeamPage } from './apps/cx/pages/TeamPage';
import { CompanyPage } from './apps/cx/pages/CompanyPage';
import { LocationsPage } from './apps/cx/pages/LocationsPage';
import { HistoryPage } from './apps/cx/pages/HistoryPage';
import { OrdersPage } from './apps/cx/pages/OrdersPage';
import { MerchantApp } from './apps/mx/MerchantApp';
import { DashboardPage } from './apps/mx/pages/DashboardPage';
import { CompaniesPage } from './apps/mx/pages/CompaniesPage';
import { CompanyDetailPage } from './apps/mx/pages/CompanyDetailPage';
import { CustomerDetailPage } from './apps/mx/pages/CustomerDetailPage';
import { CustomersPage } from './apps/mx/pages/CustomersPage';
import { StorefrontApp } from './apps/storefront/StorefrontApp';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<ExperienceLayout />}>
      <Route index element={<ExperienceLanding />} />
      <Route path="mx" element={<MerchantApp />}>
        <Route index element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:customerId" element={<CustomerDetailPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="companies/:companyId" element={<CompanyDetailPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
      <Route path="cx" element={<CustomerApp />}>
        <Route index element={<CustomerDashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="quotes" element={<QuotesPage />} />
        <Route path="quotes/:quoteId" element={<QuoteDetailPage />} />
        <Route path="quotes/:quoteId/approve" element={<QuoteApprovalPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/:invoiceId" element={<InvoiceDetailPage />} />
        <Route path="invoices/:invoiceId/pay" element={<PaymentPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="company" element={<CompanyPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="*" element={<CustomerDashboardPage />} />
      </Route>
      <Route path="storefront/*" element={<StorefrontApp />} />
      <Route path="*" element={<ExperienceLanding />} />
    </Route>,
  ),
);
