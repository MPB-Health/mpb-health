import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useOrg } from './contexts/OrgContext';
import { PermissionGate, AccessDenied } from './components/PermissionGate';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LeadsList from './pages/LeadsList';
import LeadDetail from './pages/LeadDetail';
import Pipeline from './pages/Pipeline';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Templates from './pages/Templates';
import Automation from './pages/Automation';
import SentEmails from './pages/SentEmails';
import EmailSchedules from './pages/EmailSchedules';

// Lazy-loaded CRM module pages
const Accounts = lazy(() => import('./pages/Accounts'));
const AccountDetail = lazy(() => import('./pages/AccountDetail'));
const Contacts = lazy(() => import('./pages/Contacts'));
const ContactDetail = lazy(() => import('./pages/ContactDetail'));
const Deals = lazy(() => import('./pages/Deals'));
const DealDetail = lazy(() => import('./pages/DealDetail'));
const DealPipeline = lazy(() => import('./pages/DealPipeline'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Quotes = lazy(() => import('./pages/Quotes'));
const QuoteDetail = lazy(() => import('./pages/QuoteDetail'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const CampaignDetail = lazy(() => import('./pages/CampaignDetail'));

// Loading component for Suspense
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { orgLoading, activeOrgId } = useOrg();

  if (loading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600 mx-auto" />
          <p className="mt-4 text-sm text-th-text-tertiary">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!activeOrgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center max-w-md px-4">
          <h2 className="text-xl font-semibold text-th-text-primary mb-2">No Organization</h2>
          <p className="text-th-text-secondary">
            You're not a member of any organization. Contact your administrator to get access.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/** Wraps a page in a permission check, showing AccessDenied if not allowed */
function Guarded({ permission, children }: { permission: string; children: React.ReactNode }) {
  return (
    <PermissionGate permission={permission} fallback={<AccessDenied />}>
      {children}
    </PermissionGate>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route
                  path="/leads"
                  element={
                    <Guarded permission="leads.view">
                      <LeadsList />
                    </Guarded>
                  }
                />
                <Route
                  path="/leads/:id"
                  element={
                    <Guarded permission="leads.view">
                      <LeadDetail />
                    </Guarded>
                  }
                />
                <Route
                  path="/pipeline"
                  element={
                    <Guarded permission="pipeline.view">
                      <Pipeline />
                    </Guarded>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <Guarded permission="tasks.view">
                      <Tasks />
                    </Guarded>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <Guarded permission="tasks.view">
                      <Calendar />
                    </Guarded>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <Guarded permission="reports.view">
                      <Reports />
                    </Guarded>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <Guarded permission="settings.manage">
                      <Settings />
                    </Guarded>
                  }
                />
                <Route
                  path="/templates"
                  element={
                    <Guarded permission="settings.manage">
                      <Templates />
                    </Guarded>
                  }
                />
                <Route
                  path="/automation"
                  element={
                    <Guarded permission="settings.manage">
                      <Automation />
                    </Guarded>
                  }
                />
                <Route
                  path="/email/sent"
                  element={
                    <Guarded permission="email.read">
                      <SentEmails />
                    </Guarded>
                  }
                />
                <Route
                  path="/email/schedules"
                  element={
                    <Guarded permission="email.templates">
                      <EmailSchedules />
                    </Guarded>
                  }
                />
                {/* Accounts */}
                <Route
                  path="/accounts"
                  element={
                    <Guarded permission="accounts.read">
                      <Suspense fallback={<PageLoader />}>
                        <Accounts />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/accounts/:id"
                  element={
                    <Guarded permission="accounts.read">
                      <Suspense fallback={<PageLoader />}>
                        <AccountDetail />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Contacts */}
                <Route
                  path="/contacts"
                  element={
                    <Guarded permission="contacts.read">
                      <Suspense fallback={<PageLoader />}>
                        <Contacts />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/contacts/:id"
                  element={
                    <Guarded permission="contacts.read">
                      <Suspense fallback={<PageLoader />}>
                        <ContactDetail />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Deals */}
                <Route
                  path="/deals"
                  element={
                    <Guarded permission="deals.read">
                      <Suspense fallback={<PageLoader />}>
                        <Deals />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/deals/:id"
                  element={
                    <Guarded permission="deals.read">
                      <Suspense fallback={<PageLoader />}>
                        <DealDetail />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/deal-pipeline"
                  element={
                    <Guarded permission="deals.read">
                      <Suspense fallback={<PageLoader />}>
                        <DealPipeline />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Products */}
                <Route
                  path="/products"
                  element={
                    <Guarded permission="products.read">
                      <Suspense fallback={<PageLoader />}>
                        <Products />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/products/:id"
                  element={
                    <Guarded permission="products.read">
                      <Suspense fallback={<PageLoader />}>
                        <ProductDetail />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Quotes */}
                <Route
                  path="/quotes"
                  element={
                    <Guarded permission="quotes.read">
                      <Suspense fallback={<PageLoader />}>
                        <Quotes />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/quotes/:id"
                  element={
                    <Guarded permission="quotes.read">
                      <Suspense fallback={<PageLoader />}>
                        <QuoteDetail />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Invoices */}
                <Route
                  path="/invoices"
                  element={
                    <Guarded permission="invoices.read">
                      <Suspense fallback={<PageLoader />}>
                        <Invoices />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/invoices/:id"
                  element={
                    <Guarded permission="invoices.read">
                      <Suspense fallback={<PageLoader />}>
                        <InvoiceDetail />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Campaigns */}
                <Route
                  path="/campaigns"
                  element={
                    <Guarded permission="campaigns.read">
                      <Suspense fallback={<PageLoader />}>
                        <Campaigns />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/campaigns/:id"
                  element={
                    <Guarded permission="campaigns.read">
                      <Suspense fallback={<PageLoader />}>
                        <CampaignDetail />
                      </Suspense>
                    </Guarded>
                  }
                />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
