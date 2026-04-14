import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useOrg } from './contexts/OrgContext';
import { PermissionGate, AccessDenied } from './components/PermissionGate';
import { lazyRetry } from './utils/lazyRetry';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';

const LandingPage = lazyRetry(() => import('./pages/LandingPage'));

const Dashboard = lazyRetry(() => import('./pages/Dashboard'));
const LeadsList = lazyRetry(() => import('./pages/LeadsList'));
const LeadDetail = lazyRetry(() => import('./pages/LeadDetail'));
const LeadWorkspace = lazyRetry(() => import('./pages/LeadWorkspace'));
const Pipeline = lazyRetry(() => import('./pages/Pipeline'));
const Tasks = lazyRetry(() => import('./pages/Tasks'));
const Calendar = lazyRetry(() => import('./pages/Calendar'));
const EndOfDay = lazyRetry(() => import('./pages/EndOfDay'));
const Reports = lazyRetry(() => import('./pages/Reports'));
const Settings = lazyRetry(() => import('./pages/Settings'));
const Today = lazyRetry(() => import('./pages/Today'));
const Templates = lazyRetry(() => import('./pages/Templates'));
const Automation = lazyRetry(() => import('./pages/Automation'));
const SentEmails = lazyRetry(() => import('./pages/SentEmails'));
const EmailSchedules = lazyRetry(() => import('./pages/EmailSchedules'));

// Lazy-loaded CRM module pages
const Accounts = lazyRetry(() => import('./pages/Accounts'));
const AccountDetail = lazyRetry(() => import('./pages/AccountDetail'));
const Contacts = lazyRetry(() => import('./pages/Contacts'));
const ContactDetail = lazyRetry(() => import('./pages/ContactDetail'));
const Deals = lazyRetry(() => import('./pages/Deals'));
const DealDetail = lazyRetry(() => import('./pages/DealDetail'));
const DealPipeline = lazyRetry(() => import('./pages/DealPipeline'));
const Products = lazyRetry(() => import('./pages/Products'));
const ProductDetail = lazyRetry(() => import('./pages/ProductDetail'));
const Quotes = lazyRetry(() => import('./pages/Quotes'));
const QuoteDetail = lazyRetry(() => import('./pages/QuoteDetail'));
const Invoices = lazyRetry(() => import('./pages/Invoices'));
const InvoiceDetail = lazyRetry(() => import('./pages/InvoiceDetail'));
const Campaigns = lazyRetry(() => import('./pages/Campaigns'));
const CampaignDetail = lazyRetry(() => import('./pages/CampaignDetail'));
// Print views (standalone, without MainLayout)
const QuotePrintView = lazyRetry(() => import('./pages/QuotePrintView'));
const InvoicePrintView = lazyRetry(() => import('./pages/InvoicePrintView'));

// CRM Studio pages
const StudioHome = lazyRetry(() => import('./pages/studio/StudioHome'));
const CustomModuleList = lazyRetry(() => import('./pages/studio/CustomModuleList'));
const CustomModuleDetail = lazyRetry(() => import('./pages/studio/CustomModuleDetail'));

// Quick Rate Estimate Leads (from website quote system)
const QuickRateEstimateLeads = lazyRetry(() => import('./pages/QuickRateEstimateLeads'));
const WorkflowBuilderPage = lazyRetry(() =>
  import('./components/WorkflowBuilder').then((m) => ({ default: m.WorkflowBuilder as React.ComponentType }))
);

// Email System
const Inbox = lazyRetry(() => import('./pages/Inbox'));
const EmailSignatures = lazyRetry(() => import('./pages/EmailSignatures'));
const EmailSequences = lazyRetry(() => import('./pages/EmailSequences'));

// Enterprise Features
const MeetingScheduler = lazyRetry(() => import('./pages/MeetingScheduler'));
const SalesActivityDashboard = lazyRetry(() => import('./pages/SalesActivityDashboard'));
const EmailDeliverability = lazyRetry(() => import('./pages/EmailDeliverability'));

// Connected Inbox (Outlook-class)
const MailAccounts = lazyRetry(() => import('./pages/MailAccounts'));
const MailRules = lazyRetry(() => import('./pages/MailRules'));
const DomainAddons = lazyRetry(() => import('./pages/DomainAddons'));
const ConnectedInbox = lazyRetry(() => import('./pages/ConnectedInbox'));

// Vendors & Orders
const Vendors = lazyRetry(() => import('./pages/Vendors'));
const VendorDetail = lazyRetry(() => import('./pages/VendorDetail'));
const PurchaseOrders = lazyRetry(() => import('./pages/PurchaseOrders'));
const PurchaseOrderDetail = lazyRetry(() => import('./pages/PurchaseOrderDetail'));
const SalesOrders = lazyRetry(() => import('./pages/SalesOrders'));
const SalesOrderDetail = lazyRetry(() => import('./pages/SalesOrderDetail'));
const PriceBooks = lazyRetry(() => import('./pages/PriceBooks'));
const PriceBookDetail = lazyRetry(() => import('./pages/PriceBookDetail'));

// Cases / Support
const Cases = lazyRetry(() => import('./pages/Cases'));
const CaseDetail = lazyRetry(() => import('./pages/CaseDetail'));

// Documents & Calls
const Documents = lazyRetry(() => import('./pages/Documents'));
const Calls = lazyRetry(() => import('./pages/Calls'));

// Sales Forecasting
const Forecasting = lazyRetry(() => import('./pages/Forecasting'));
const DealVelocity = lazyRetry(() => import('./pages/DealVelocity'));

// Sales Plan 2026 Reports
const PerformanceReport = lazyRetry(() => import('./pages/reports/PerformanceReport'));
const LeadsSplitReport = lazyRetry(() => import('./pages/reports/LeadsSplitReport'));
const SourceBreakdownReport = lazyRetry(() => import('./pages/reports/SourceBreakdownReport'));
const RevenueReport = lazyRetry(() => import('./pages/reports/RevenueReport'));
const ConversionReport = lazyRetry(() => import('./pages/reports/ConversionReport'));
const ActivityTargetsReport = lazyRetry(() => import('./pages/reports/ActivityTargetsReport'));
const AdvisorProductionReport = lazyRetry(() => import('./pages/reports/AdvisorProductionReport'));
const AnnualOverview = lazyRetry(() => import('./pages/reports/AnnualOverview'));

// Sales Plan 2026 Entities
const ReferralPartners = lazyRetry(() => import('./pages/ReferralPartners'));
const ReferralPartnerDetail = lazyRetry(() => import('./pages/ReferralPartnerDetail'));
const OutsideAdvisors = lazyRetry(() => import('./pages/OutsideAdvisors'));
const OutsideAdvisorDetail = lazyRetry(() => import('./pages/OutsideAdvisorDetail'));
const CommunityEvents = lazyRetry(() => import('./pages/CommunityEvents'));
const CommunityEventDetail = lazyRetry(() => import('./pages/CommunityEventDetail'));
const Reactivation = lazyRetry(() => import('./pages/Reactivation'));
const Milestones = lazyRetry(() => import('./pages/Milestones'));

// Approval Workflows
const Approvals = lazyRetry(() => import('./pages/Approvals'));
const ApprovalProcesses = lazyRetry(() => import('./pages/ApprovalProcesses'));

// Web Form Builder
const WebForms = lazyRetry(() => import('./pages/WebForms'));
const FormBuilder = lazyRetry(() => import('./pages/FormBuilder'));
const FormSubmissions = lazyRetry(() => import('./pages/FormSubmissions'));
const PublicForm = lazyRetry(() => import('./pages/PublicForm'));

// Prefetch common routes when the browser is idle
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  window.requestIdleCallback(() => {
    import('./pages/Dashboard').catch(() => {});
    import('./pages/LeadsList').catch(() => {});
    import('./pages/Pipeline').catch(() => {});
    import('./pages/Tasks').catch(() => {});
    import('./pages/Calendar').catch(() => {});
  });
}

function PageLoader() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const id = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(id);
  }, []);
  if (!visible) return null;
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
            You&apos;re not a member of any organization. Contact your administrator to get access.
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

/** Public landing page -- redirects to /dashboard if already logged in */
function LandingRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Suspense fallback={<PageLoader />}><LandingPage /></Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
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
                <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                <Route path="/today" element={<Suspense fallback={<PageLoader />}><Today /></Suspense>} />
                <Route
                  path="/leads"
                  element={
                    <Guarded permission="leads.read">
                      <Suspense fallback={<PageLoader />}>
                        <LeadsList />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/leads/workspace/:id"
                  element={
                    <Guarded permission="leads.read">
                      <Suspense fallback={<PageLoader />}>
                        <LeadWorkspace />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/leads/:id"
                  element={
                    <Guarded permission="leads.read">
                      <Suspense fallback={<PageLoader />}>
                        <LeadDetail />
                      </Suspense>
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
                      <Suspense fallback={<PageLoader />}>
                        <Pipeline />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <Guarded permission="tasks.read">
                      <Suspense fallback={<PageLoader />}>
                        <Tasks />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <Guarded permission="tasks.read">
                      <Suspense fallback={<PageLoader />}>
                        <Calendar />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/end-of-day"
                  element={
                    <Guarded permission="leads.write">
                      <Suspense fallback={<PageLoader />}>
                        <EndOfDay />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <Guarded permission="reports.read">
                      <Suspense fallback={<PageLoader />}>
                        <Reports />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route path="/reports/performance" element={<Guarded permission="reports.read"><Suspense fallback={<PageLoader />}><PerformanceReport /></Suspense></Guarded>} />
                <Route path="/reports/leads-split" element={<Guarded permission="reports.read"><Suspense fallback={<PageLoader />}><LeadsSplitReport /></Suspense></Guarded>} />
                <Route path="/reports/source-breakdown" element={<Guarded permission="reports.read"><Suspense fallback={<PageLoader />}><SourceBreakdownReport /></Suspense></Guarded>} />
                <Route path="/reports/revenue" element={<Guarded permission="reports.read"><Suspense fallback={<PageLoader />}><RevenueReport /></Suspense></Guarded>} />
                <Route path="/reports/conversion" element={<Guarded permission="reports.read"><Suspense fallback={<PageLoader />}><ConversionReport /></Suspense></Guarded>} />
                <Route path="/reports/activity-targets" element={<Guarded permission="reports.read"><Suspense fallback={<PageLoader />}><ActivityTargetsReport /></Suspense></Guarded>} />
                <Route path="/reports/advisor-production" element={<Guarded permission="reports.read"><Suspense fallback={<PageLoader />}><AdvisorProductionReport /></Suspense></Guarded>} />
                <Route path="/reports/annual" element={<Guarded permission="reports.read"><Suspense fallback={<PageLoader />}><AnnualOverview /></Suspense></Guarded>} />

                {/* Sales Plan 2026 Entities */}
                <Route path="/referral-partners" element={<Guarded permission="referrals.read"><Suspense fallback={<PageLoader />}><ReferralPartners /></Suspense></Guarded>} />
                <Route path="/referral-partners/:id" element={<Guarded permission="referrals.read"><Suspense fallback={<PageLoader />}><ReferralPartnerDetail /></Suspense></Guarded>} />
                <Route path="/outside-advisors" element={<Guarded permission="outside_advisors.read"><Suspense fallback={<PageLoader />}><OutsideAdvisors /></Suspense></Guarded>} />
                <Route path="/outside-advisors/:id" element={<Guarded permission="outside_advisors.read"><Suspense fallback={<PageLoader />}><OutsideAdvisorDetail /></Suspense></Guarded>} />
                <Route path="/community-events" element={<Guarded permission="community_events.read"><Suspense fallback={<PageLoader />}><CommunityEvents /></Suspense></Guarded>} />
                <Route path="/community-events/:id" element={<Guarded permission="community_events.read"><Suspense fallback={<PageLoader />}><CommunityEventDetail /></Suspense></Guarded>} />
                <Route path="/reactivation" element={<Guarded permission="leads.read"><Suspense fallback={<PageLoader />}><Reactivation /></Suspense></Guarded>} />
                <Route path="/milestones" element={<Guarded permission="targets.read"><Suspense fallback={<PageLoader />}><Milestones /></Suspense></Guarded>} />

                <Route
                  path="/settings"
                  element={
                    <Guarded permission="settings.manage">
                      <Suspense fallback={<PageLoader />}>
                        <Settings />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/templates"
                  element={
                    <Guarded permission="settings.manage">
                      <Suspense fallback={<PageLoader />}>
                        <Templates />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/automation"
                  element={
                    <Guarded permission="settings.manage">
                      <Suspense fallback={<PageLoader />}>
                        <Automation />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/automation/builder"
                  element={
                    <Guarded permission="settings.manage">
                      <Suspense fallback={<PageLoader />}>
                        <WorkflowBuilderPage />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/automation/builder/:ruleId"
                  element={
                    <Guarded permission="settings.manage">
                      <Suspense fallback={<PageLoader />}>
                        <WorkflowBuilderPage />
                      </Suspense>
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
                      <Suspense fallback={<PageLoader />}>
                        <SentEmails />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/email/schedules"
                  element={
                    <Guarded permission="email.templates">
                      <Suspense fallback={<PageLoader />}>
                        <EmailSchedules />
                      </Suspense>
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
                {/* Vendors */}
                <Route
                  path="/vendors"
                  element={
                    <Guarded permission="vendors.read">
                      <Suspense fallback={<PageLoader />}>
                        <Vendors />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/vendors/:id"
                  element={
                    <Guarded permission="vendors.read">
                      <Suspense fallback={<PageLoader />}>
                        <VendorDetail />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Purchase Orders */}
                <Route
                  path="/purchase-orders"
                  element={
                    <Guarded permission="purchase_orders.read">
                      <Suspense fallback={<PageLoader />}>
                        <PurchaseOrders />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/purchase-orders/:id"
                  element={
                    <Guarded permission="purchase_orders.read">
                      <Suspense fallback={<PageLoader />}>
                        <PurchaseOrderDetail />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Sales Orders */}
                <Route
                  path="/sales-orders"
                  element={
                    <Guarded permission="sales_orders.read">
                      <Suspense fallback={<PageLoader />}>
                        <SalesOrders />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/sales-orders/:id"
                  element={
                    <Guarded permission="sales_orders.read">
                      <Suspense fallback={<PageLoader />}>
                        <SalesOrderDetail />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Price Books */}
                <Route
                  path="/price-books"
                  element={
                    <Guarded permission="products.read">
                      <Suspense fallback={<PageLoader />}>
                        <PriceBooks />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/price-books/:id"
                  element={
                    <Guarded permission="products.read">
                      <Suspense fallback={<PageLoader />}>
                        <PriceBookDetail />
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
                {/* Cases / Support */}
                <Route
                  path="/cases"
                  element={
                    <Guarded permission="cases.read">
                      <Suspense fallback={<PageLoader />}>
                        <Cases />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/cases/:id"
                  element={
                    <Guarded permission="cases.read">
                      <Suspense fallback={<PageLoader />}>
                        <CaseDetail />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Documents */}
                <Route
                  path="/documents"
                  element={
                    <Guarded permission="documents.read">
                      <Suspense fallback={<PageLoader />}>
                        <Documents />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Calls */}
                <Route
                  path="/calls"
                  element={
                    <Guarded permission="leads.read">
                      <Suspense fallback={<PageLoader />}>
                        <Calls />
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
                    <Guarded permission="approvals.read">
                      <Suspense fallback={<PageLoader />}>
                        <Approvals />
                      </Suspense>
                    </Guarded>
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
                    <Guarded permission="custom_modules.read">
                      <Suspense fallback={<PageLoader />}>
                        <CustomModuleList />
                      </Suspense>
                    </Guarded>
                  }
                />
                <Route
                  path="/custom/:moduleApiName/:id"
                  element={
                    <Guarded permission="custom_modules.read">
                      <Suspense fallback={<PageLoader />}>
                        <CustomModuleDetail />
                      </Suspense>
                    </Guarded>
                  }
                />
                {/* Catch-all: redirect unknown paths to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
