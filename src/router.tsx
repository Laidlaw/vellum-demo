import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';

import { ExperienceLayout } from './apps/ExperienceLayout';
import { ExperienceLanding } from './apps/ExperienceLanding';
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
import { QuotesPage as MerchantQuotesPage } from './apps/mx/pages/QuotesPage';
import { MerchantInvoiceDetailPage } from './apps/mx/pages/InvoiceDetailPage';
import { StorefrontApp } from './apps/storefront/StorefrontApp';
import { FinanceBlueprintPage } from './apps/FinanceBlueprintPage';
import { CcxApp } from './apps/ccx/CcxApp';
import { CcxDashboardPage } from './apps/ccx/pages/CcxDashboardPage';
import { CompanyFinanceProfilePage } from './apps/ccx/pages/CompanyFinanceProfilePage';
import { ApprovalMatrixPage } from './apps/ccx/pages/ApprovalMatrixPage';
import { InvoiceReviewWorkspacePage } from './apps/ccx/pages/InvoiceReviewWorkspacePage';
import { PayRunPlannerPage } from './apps/ccx/pages/PayRunPlannerPage';
import { CreditExposurePage } from './apps/ccx/pages/CreditExposurePage';
import { ExceptionsWorkspacePage } from './apps/ccx/pages/ExceptionsWorkspacePage';
import { QuoteConversionWorkspacePage } from './apps/ccx/pages/QuoteConversionWorkspacePage';
import { InvoicesOverviewPage } from './apps/ccx/pages/InvoicesOverviewPage';
import { CuiApp } from './apps/cui/CuiApp';
import { CuiDashboardPage } from './apps/cui/pages/CuiDashboardPage';
import { CuiCompaniesPage } from './apps/cui/pages/CuiCompaniesPage';
import { CuiInvoicesPage } from './apps/cui/pages/CuiInvoicesPage';
import { CuiInvoiceReviewWorkspacePage } from './apps/cui/pages/CuiInvoiceReviewWorkspacePage';
import { CuiCompanyDetailPage } from './apps/cui/pages/CuiCompanyDetailPage';
import { CuiQuotesPage } from './apps/cui/pages/CuiQuotesPage';
import { CuiOrdersPage } from './apps/cui/pages/CuiOrdersPage';
import { CuiCompanySettingsPage } from './apps/cui/pages/CuiCompanySettingsPage';
import { CuiQuoteConversionWorkspacePage } from './apps/cui/pages/CuiQuoteConversionWorkspacePage';
import { CuiQuoteDetailPage } from './apps/cui/pages/CuiQuoteDetailPage';
import { CuiOrderCheckoutPage } from './apps/cui/pages/CuiOrderCheckoutPage';
import { CuiInvoicePaymentPage } from './apps/cui/pages/CuiInvoicePaymentPage';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<ExperienceLayout />}>
      <Route index element={<ExperienceLanding />} />
      <Route path="finance-blueprint" element={<FinanceBlueprintPage />} />
      <Route path="cui" element={<CuiApp />}>
        <Route index element={<CuiDashboardPage />} />
        <Route path="companies" element={<CuiCompaniesPage />} />
        <Route path="companies/:companyId" element={<CuiCompanyDetailPage />} />
        <Route path="quotes" element={<CuiQuotesPage />} />
        <Route path="quotes/:quoteId" element={<CuiQuoteDetailPage />} />
        <Route path="quotes/convert" element={<CuiQuoteConversionWorkspacePage />} />
        <Route path="orders/checkout" element={<CuiOrderCheckoutPage />} />
        <Route path="invoices" element={<CuiInvoicesPage />} />
        <Route path="invoices/:invoiceId" element={<CuiInvoiceReviewWorkspacePage />} />
        <Route path="invoices/:invoiceId/review" element={<CuiInvoiceReviewWorkspacePage />} />
        <Route path="invoices/:invoiceId/review/:view" element={<CuiInvoiceReviewWorkspacePage />} />
        <Route path="invoices/:invoiceId/pay" element={<CuiInvoicePaymentPage />} />
        <Route path="orders" element={<CuiOrdersPage />} />
        <Route path="settings" element={<CuiCompanySettingsPage />} />
      </Route>
      <Route path="ccx" element={<CcxApp />}>
        <Route index element={<CcxDashboardPage />} />
        <Route path="companies/:companyId/finance" element={<CompanyFinanceProfilePage />} />
        <Route path="companies/:companyId/approvals" element={<ApprovalMatrixPage />} />
        <Route path="companies/:companyId/invoices" element={<InvoicesOverviewPage />} />
        <Route path="companies/:companyId/credit" element={<CreditExposurePage />} />
        <Route path="companies/:companyId/exceptions" element={<ExceptionsWorkspacePage />} />
        <Route path="quotes/convert" element={<QuoteConversionWorkspacePage />} />
        <Route path="invoices/:invoiceId/review" element={<InvoiceReviewWorkspacePage />} />
        <Route path="pay-runs" element={<PayRunPlannerPage />} />
      </Route>
      <Route path="mx" element={<MerchantApp />}>
        <Route index element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:customerId" element={<CustomerDetailPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="companies/:companyId" element={<CompanyDetailPage />} />
        <Route path="quotes" element={<MerchantQuotesPage />} />
        <Route path="invoices/:invoiceId" element={<MerchantInvoiceDetailPage />} />
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
