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
// Print views (standalone, without MainLayout)
const QuotePrintView = lazy(() => import('./pages/QuotePrintView'));
const InvoicePrintView = lazy(() => import('./pages/InvoicePrintView'));

// CRM Studio pages
const StudioHome = lazy(() => import('./pages/studio/StudioHome'));
const CustomModuleList = lazy(() => import('./pages/studio/CustomModuleList'));
const CustomModuleDetail = lazy(() => import('./pages/studio/CustomModuleDetail'));

// Quick Rate Estimate Leads (from website quote system)
const QuickRateEstimateLeads = lazy(() => import('./pages/QuickRateEstimateLeads'));

// Email System
const Inbox = lazy(() => import('./pages/Inbox'));
const EmailSignatures = lazy(() => import('./pages/EmailSignatures'));
const EmailSequences = lazy(() => import('./pages/EmailSequences'));

// Enterprise Features
const MeetingScheduler = lazy(() => import('./pages/MeetingScheduler'));
const SalesActivityDashboard = lazy(() => import('./pages/SalesActivityDashboard'));
const EmailDeliverability = lazy(() => import('./pages/EmailDeliverability'));

// Connected Inbox (Outlook-class)
const MailAccounts = lazy(() => import('./pages/MailAccounts'));
const MailRules = lazy(() => import('./pages/MailRules'));
const DomainAddons = lazy(() => import('./pages/DomainAddons'));
const ConnectedInbox = lazy(() => import('./pages/ConnectedInbox'));

// Sales Forecasting
const Forecasting = lazy(() => import('./pages/Forecasting'));
const DealVelocity = lazy(() => import('./pages/DealVelocity'));

// Approval Workflows
const Approvals = lazy(() => import('./pages/Approvals'));
const ApprovalProcesses = lazy(() => import('./pages/ApprovalProcesses'));

// Web Form Builder
const WebForms = lazy(() => import('./pages/WebForms'));
const FormBuilder = lazy(() => import('./pages/FormBuilder'));
const FormSubmissions = lazy(() => import('./pages/FormSubmissions'));
const PublicForm = lazy(() => import('./pages/PublicForm'));

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

      {/* Public form renderer - no auth required */}
      <Route
        path="/forms/:slug"
        element={
          <Suspense fallback={<PageLoader />}>
            <PublicForm />
          </Suspense>
        }
      />

      {/* Print views - standalone routes without MainLayout */}
      <Route
        path="/quotes/:id/print"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <QuotePrintView />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices/:id/print"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <InvoicePrintView />
            </Suspense>
          </ProtectedRoute>
        }
      />

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
                    <Guarded permission="leads.read">
                      <LeadsList />
                    </Guarded>
                  }
                />
                <Route
                  path="/leads/:id"
                  element={
                    <Guarded permission="leads.read">
                      <LeadDetail />
                    </Guarded>
                  }
                />
                <Route
                  path="/leads/quick-rate-estimate"
                  element={
                    <Guarded permission="leads.read">
                      <Suspense fallback={<PageLoader />}>
                        <QuickRateEstimateLeads />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/pipeline"
                  element={
                    <Guarded permission="pipeline.read">
                      <Pipeline />
                    </Guarded>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <Guarded permission="tasks.read">
                      <Tasks />
                    </Guarded>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <Guarded permission="tasks.read">
                      <Calendar />
                    </Guarded>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <Guarded permission="reports.read">
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
                  path="/email/inbox"
                  element={
                    <Guarded permission="email.read">
                      <Suspense fallback={<PageLoader />}>
                        <Inbox />
                      </Suspense>
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
                <Route
                  path="/email/signatures"
                  element={
                    <Guarded permission="email.read">
                      <Suspense fallback={<PageLoader />}>
                        <EmailSignatures />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/email/sequences"
                  element={
                    <Guarded permission="email.read">
                      <Suspense fallback={<PageLoader />}>
                        <EmailSequences />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/email/deliverability"
                  element={
                    <Guarded permission="email.read">
                      <Suspense fallback={<PageLoader />}>
                        <EmailDeliverability />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Connected Inbox routes */}
                <Route
                  path="/email/connected"
                  element={
                    <Guarded permission="email.read">
                      <Suspense fallback={<PageLoader />}>
                        <ConnectedInbox />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/email/accounts"
                  element={
                    <Guarded permission="email.read">
                      <Suspense fallback={<PageLoader />}>
                        <MailAccounts />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/email/rules"
                  element={
                    <Guarded permission="email.read">
                      <Suspense fallback={<PageLoader />}>
                        <MailRules />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/email/domains"
                  element={
                    <Guarded permission="settings.manage">
                      <Suspense fallback={<PageLoader />}>
                        <DomainAddons />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/meetings"
                  element={
                    <Guarded permission="tasks.read">
                      <Suspense fallback={<PageLoader />}>
                        <MeetingScheduler />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/sales-activity"
                  element={
                    <Guarded permission="reports.read">
                      <Suspense fallback={<PageLoader />}>
                        <SalesActivityDashboard />
                      </Suspense>
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
                {/* Forecasting */}
                <Route
                  path="/forecasting"
                  element={
                    <Guarded permission="deals.read">
                      <Suspense fallback={<PageLoader />}>
                        <Forecasting />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/forecasting/velocity"
                  element={
                    <Guarded permission="deals.read">
                      <Suspense fallback={<PageLoader />}>
                        <DealVelocity />
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
                {/* CRM Studio */}
                <Route
                  path="/studio"
                  element={
                    <Guarded permission="settings.manage">
                      <Suspense fallback={<PageLoader />}>
                        <StudioHome />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/studio/modules/new"
                  element={
                    <Guarded permission="settings.manage">
                      <Suspense fallback={<PageLoader />}>
                        <StudioHome />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/studio/modules/:id/*"
                  element={
                    <Guarded permission="settings.manage">
                      <Suspense fallback={<PageLoader />}>
                        <StudioHome />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Approvals */}
                <Route
                  path="/approvals"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Approvals />
                    </Suspense>
                  }
                />
                <Route
                  path="/settings/approval-processes"
                  element={
                    <Guarded permission="settings.manage">
                      <Suspense fallback={<PageLoader />}>
                        <ApprovalProcesses />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Web Forms */}
                <Route
                  path="/web-forms"
                  element={
                    <Guarded permission="campaigns.read">
                      <Suspense fallback={<PageLoader />}>
                        <WebForms />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/web-forms/new"
                  element={
                    <Guarded permission="campaigns.write">
                      <Suspense fallback={<PageLoader />}>
                        <FormBuilder />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/web-forms/:id/edit"
                  element={
                    <Guarded permission="campaigns.write">
                      <Suspense fallback={<PageLoader />}>
                        <FormBuilder />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/web-forms/:id/submissions"
                  element={
                    <Guarded permission="campaigns.read">
                      <Suspense fallback={<PageLoader />}>
                        <FormSubmissions />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Custom Modules (dynamic routes) */}
                <Route
                  path="/custom/:moduleApiName"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <CustomModuleList />
                    </Suspense>
                  }
                />
                <Route
                  path="/custom/:moduleApiName/:id"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <CustomModuleDetail />
                    </Suspense>
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
