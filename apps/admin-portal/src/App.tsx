import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import MainLayout from './layouts/MainLayout';
import { lazyRetry } from './utils/lazyRetry';

// ── Lazy-loaded page components (with retry + auto-reload on chunk/cache errors) ──
const Dashboard = lazyRetry(() => import('./pages/Dashboard'));
const Users = lazyRetry(() => import('./pages/Users'));
const UserDetail = lazyRetry(() => import('./pages/UserDetail'));
const Enrollments = lazyRetry(() => import('./pages/Enrollments'));
const EnrollmentDetail = lazyRetry(() => import('./pages/EnrollmentDetail'));
const BlogPosts = lazyRetry(() => import('./pages/BlogPosts'));
const BlogEditor = lazyRetry(() => import('./pages/BlogEditor'));
const Resources = lazyRetry(() => import('./pages/Resources'));
const BulletinsList = lazyRetry(() => import('./pages/BulletinsList'));
const BulletinEditor = lazyRetry(() => import('./pages/BulletinEditor'));
const Settings = lazyRetry(() => import('./pages/Settings'));
const AuditLogs = lazyRetry(() => import('./pages/AuditLogs'));
const Login = lazyRetry(() => import('./pages/Login'));
const AcceptInvite = lazyRetry(() => import('./pages/AcceptInvite'));
const PaymentProcessors = lazyRetry(() => import('./pages/PaymentProcessors'));
const SmsAccounts = lazyRetry(() => import('./pages/SmsAccounts'));
const PromoCodes = lazyRetry(() => import('./pages/PromoCodes'));
const CodeInventory = lazyRetry(() => import('./pages/CodeInventory'));
const AdminResources = lazyRetry(() => import('./pages/AdminResources'));
const ESignature = lazyRetry(() => import('./pages/ESignature'));
const PlansList = lazyRetry(() => import('./pages/PlansList'));
const PlanEditor = lazyRetry(() => import('./pages/PlanEditor'));
const TicketsList = lazyRetry(() => import('./pages/TicketsList'));
const TicketDetail = lazyRetry(() => import('./pages/TicketDetail'));
const TicketCategoriesSettings = lazyRetry(() => import('./pages/TicketCategoriesSettings'));
// Phase 2 — CMS pages
const TrainingModulesList = lazyRetry(() => import('./pages/TrainingModulesList'));
const TrainingModuleEditor = lazyRetry(() => import('./pages/TrainingModuleEditor'));
const SOPsList = lazyRetry(() => import('./pages/SOPsList'));
const SOPEditor = lazyRetry(() => import('./pages/SOPEditor'));
const QuickLinksList = lazyRetry(() => import('./pages/QuickLinksList'));
const VideoLibraryList = lazyRetry(() => import('./pages/VideoLibraryList'));
const FormsList = lazyRetry(() => import('./pages/FormsList'));
const ContactDirectory = lazyRetry(() => import('./pages/ContactDirectory'));
const NavigationManager = lazyRetry(() => import('./pages/NavigationManager'));
const AnnouncementManager = lazyRetry(() => import('./pages/AnnouncementManager'));
const WidgetManager = lazyRetry(() => import('./pages/WidgetManager'));
const HandbookManager = lazyRetry(() => import('./pages/HandbookManager'));
const EventsAdmin = lazyRetry(() => import('./pages/EventsAdmin'));
const EventEditor = lazyRetry(() => import('./pages/EventEditor'));
const CmsHub = lazyRetry(() => import('./pages/CmsHub'));
const PagesList = lazyRetry(() => import('./pages/PagesList'));
const PageEditor = lazyRetry(() => import('./pages/PageEditor'));
// Operations / Marketing pages
const LeadSubmissions = lazyRetry(() => import('./pages/LeadSubmissions'));
const NewsletterAdmin = lazyRetry(() => import('./pages/NewsletterAdmin'));
// FAQ, Enrollment Links & Portal Settings
const FAQAdmin = lazyRetry(() => import('./pages/FAQAdmin'));
const SeoMetadata = lazyRetry(() => import('./pages/SeoMetadata'));
const EnrollmentLinks = lazyRetry(() => import('./pages/EnrollmentLinks'));
const PortalSettings = lazyRetry(() => import('./pages/PortalSettings'));
// Analytics
const AnalyticsOverview = lazyRetry(() => import('./pages/AnalyticsOverview'));
const UnifiedAnalytics = lazyRetry(() => import('./pages/UnifiedAnalytics'));
const MembershipSalesAnalyticsPage = lazyRetry(() => import('./pages/MembershipSalesAnalyticsPage'));
const QuoteResultsReturned = lazyRetry(() => import('./pages/QuoteResultsReturned'));
// CRM extended pages
const CRMTemplates = lazyRetry(() => import('./pages/CRMTemplates'));
const CRMCalendar = lazyRetry(() => import('./pages/CRMCalendar'));
// Operations extended
const LeadAssignment = lazyRetry(() => import('./pages/LeadAssignment'));
// Widget config
const WidgetConfig = lazyRetry(() => import('./pages/WidgetConfig'));
// Notification rules
const NotificationRules = lazyRetry(() => import('./pages/NotificationRules'));
// Command center pages
const Members = lazyRetry(() => import('./pages/Members'));
const MemberDetail = lazyRetry(() => import('./pages/MemberDetail'));
const MemberNotificationCenter = lazyRetry(() => import('./pages/MemberNotificationCenter'));
const CRMDashboard = lazyRetry(() => import('./pages/CRMDashboard'));
const CRMLeads = lazyRetry(() => import('./pages/CRMLeads'));
const CRMLeadDetail = lazyRetry(() => import('./pages/CRMLeadDetail'));
const CRMPipeline = lazyRetry(() => import('./pages/CRMPipeline'));
const SystemHealth = lazyRetry(() => import('./pages/SystemHealth'));
const ChatModeration = lazyRetry(() => import('./pages/ChatModeration'));
const PushNotifications = lazyRetry(() => import('./pages/PushNotifications'));
const Reports = lazyRetry(() => import('./pages/Reports'));
const AdvisorAccess = lazyRetry(() => import('./pages/AdvisorAccess'));
const ModuleManagement = lazyRetry(() => import('./pages/ModuleManagement'));

// Eagerly prefetch all route chunks after initial paint
if (typeof window !== 'undefined') {
  const ric = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1));
  ric(
    () => {
      // Prefetch high-priority routes
      import('./pages/Dashboard').catch(() => {});
      import('./pages/Users').catch(() => {});
      import('./pages/Members').catch(() => {});
      import('./pages/TicketsList').catch(() => {});
      import('./pages/AdvisorAccess').catch(() => {});
      import('./pages/BulletinsList').catch(() => {});
    },
    { timeout: 3000 },
  );
  ric(
    () => {
      // Prefetch remaining routes
      import('./pages/Settings').catch(() => {});
      import('./pages/Reports').catch(() => {});
      import('./pages/CRMDashboard').catch(() => {});
      import('./pages/CRMLeads').catch(() => {});
      import('./pages/Enrollments').catch(() => {});
      import('./pages/LeadSubmissions').catch(() => {});
      import('./pages/NavigationManager').catch(() => {});
      import('./pages/FormsList').catch(() => {});
      import('./pages/SOPsList').catch(() => {});
      import('./pages/TrainingModulesList').catch(() => {});
      import('./pages/QuickLinksList').catch(() => {});
      import('./pages/VideoLibraryList').catch(() => {});
      import('./pages/AuditLogs').catch(() => {});
    },
    { timeout: 8000 },
  );
}

// ── GA4 page-view tracker ─────────────────────────────────────────────────────
function GAPageTracker() {
  const location = useLocation();
  useEffect(() => {
    const gtag = (window as Window & { gtag?: (cmd: string, ev: string, params: Record<string, string>) => void }).gtag;
    if (typeof gtag === 'function') {
      gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
  return null;
}

// ── Loading fallback ─────────────────────────────────────────────────────────
function LoadingSpinner() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const id = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(id);
  }, []);
  if (!visible) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div
        style={{
          width: 40,
          height: 40,
          border: '4px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Route-level error boundary ───────────────────────────────────────────────
// Handles chunk load failures (stale cache after deploy) with proper recovery.
const CHUNK_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Failed to fetch',
  'Loading chunk',
  'ChunkLoadError',
  'ERR_CACHE_READ_FAILURE',
  'CACHE_READ_FAILURE',
  'dynamically imported module',
  'error loading dynamically imported module',
];

function isChunkLoadError(error: Error | null): boolean {
  if (!error?.message) return false;
  const msg = error.message;
  return CHUNK_ERROR_PATTERNS.some((p) => msg.includes(p));
}

class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Admin route error:', error, info.componentStack);
  }

  handleTryAgain = () => {
    // For chunk errors, a simple state reset won't help — the same chunk URL will 404 again.
    // Must do a full reload to fetch fresh HTML with current chunk URLs.
    if (isChunkLoadError(this.state.error)) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
  };

  handleClearCacheAndReload = () => {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    try {
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunk = isChunkLoadError(this.state.error);
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Page failed to load</h2>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>
            {isChunk
              ? 'This page could not be loaded. This often happens after a site update or when the browser cache is corrupted. Try "Clear Cache & Reload" or a hard refresh (Ctrl+Shift+R).'
              : this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleTryAgain}
              style={{
                padding: '0.5rem 1.5rem',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1.5rem',
                background: '#e2e8f0',
                color: '#334155',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
            {isChunk && (
              <button
                onClick={this.handleClearCacheAndReload}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: '#fef3c7',
                  color: '#92400e',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                Clear Cache & Reload
              </button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Route-level permission guard ──────────────────────────────────────────
function RequirePermission({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { hasPermission, loading } = useAdmin();
  if (loading) return <LoadingSpinner />;
  if (!hasPermission(permission)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AdminProvider>
      <GAPageTracker />
      <RouteErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<RequirePermission permission="users.manage"><Users /></RequirePermission>} />
              <Route path="advisor-access" element={<RequirePermission permission="users.manage"><AdvisorAccess /></RequirePermission>} />
              <Route path="users/:userId" element={<RequirePermission permission="users.manage"><UserDetail /></RequirePermission>} />
              <Route path="enrollments" element={<RequirePermission permission="enrollments.manage"><Enrollments /></RequirePermission>} />
              <Route path="enrollments/:enrollmentId" element={<RequirePermission permission="enrollments.manage"><EnrollmentDetail /></RequirePermission>} />
              <Route path="plans" element={<PlansList />} />
              <Route path="plans/new" element={<PlanEditor />} />
              <Route path="plans/:id" element={<PlanEditor />} />
              <Route path="cms" element={<CmsHub />} />
              <Route path="cms/pages" element={<PagesList />} />
              <Route path="cms/pages/new" element={<PageEditor />} />
              <Route path="cms/pages/:pageId" element={<PageEditor />} />
              <Route path="content/blog" element={<BlogPosts />} />
              <Route path="content/blog/new" element={<BlogEditor />} />
              <Route path="content/blog/:postId" element={<BlogEditor />} />
              <Route path="content/bulletins" element={<BulletinsList />} />
              <Route path="content/bulletins/new" element={<BulletinEditor />} />
              <Route path="content/bulletins/:bulletinId" element={<BulletinEditor />} />
              <Route path="content/resources" element={<Resources />} />
              {/* Phase 2 — CMS routes */}
              <Route path="content/training" element={<TrainingModulesList />} />
              <Route path="content/training/new" element={<TrainingModuleEditor />} />
              <Route path="content/training/:moduleId" element={<TrainingModuleEditor />} />
              <Route path="content/sops" element={<SOPsList />} />
              <Route path="content/sops/new" element={<SOPEditor />} />
              <Route path="content/sops/:sopId" element={<SOPEditor />} />
              <Route path="content/quick-links" element={<QuickLinksList />} />
              <Route path="content/videos" element={<VideoLibraryList />} />
              <Route path="content/forms" element={<FormsList />} />
              <Route path="content/contacts" element={<ContactDirectory />} />
              <Route path="content/navigation" element={<NavigationManager />} />
              <Route path="content/announcements" element={<AnnouncementManager />} />
              <Route path="content/widgets" element={<WidgetManager />} />
              <Route path="content/handbooks" element={<HandbookManager />} />
              <Route path="events" element={<EventsAdmin />} />
              <Route path="events/new" element={<EventEditor />} />
              <Route path="events/:eventId" element={<EventEditor />} />
              <Route path="content/faq" element={<FAQAdmin />} />
              <Route path="content/seo" element={<SeoMetadata />} />
              <Route path="content/enrollment-links" element={<EnrollmentLinks />} />
              <Route path="content/portal-settings" element={<PortalSettings />} />
              {/* Operations */}
              <Route path="operations/leads" element={<LeadSubmissions />} />
              <Route path="operations/newsletter" element={<NewsletterAdmin />} />
              {/* Analytics */}
              <Route path="analytics/overview" element={<AnalyticsOverview />} />
              <Route path="analytics/unified" element={<UnifiedAnalytics />} />
              <Route path="analytics/membership-sales" element={<MembershipSalesAnalyticsPage />} />
              <Route path="analytics/quote-results-returned" element={<QuoteResultsReturned />} />
              <Route path="settings" element={<RequirePermission permission="settings.manage"><Settings /></RequirePermission>} />
              <Route path="settings/payments" element={<RequirePermission permission="settings.manage"><PaymentProcessors /></RequirePermission>} />
              <Route path="settings/sms" element={<RequirePermission permission="settings.manage"><SmsAccounts /></RequirePermission>} />
              <Route path="settings/promo-codes" element={<RequirePermission permission="settings.manage"><PromoCodes /></RequirePermission>} />
              <Route path="settings/code-inventory" element={<RequirePermission permission="settings.manage"><CodeInventory /></RequirePermission>} />
              <Route path="settings/resources" element={<RequirePermission permission="settings.manage"><AdminResources /></RequirePermission>} />
              <Route path="settings/esignature" element={<RequirePermission permission="settings.manage"><ESignature /></RequirePermission>} />
              <Route path="settings/ticket-categories" element={<RequirePermission permission="settings.manage"><TicketCategoriesSettings /></RequirePermission>} />
              <Route path="support/tickets" element={<TicketsList />} />
              <Route path="support/tickets/:ticketId" element={<TicketDetail />} />
              <Route path="audit-logs" element={<RequirePermission permission="settings.manage"><AuditLogs /></RequirePermission>} />
              {/* Command center routes */}
              <Route path="members" element={<Members />} />
              <Route path="members/notifications" element={<MemberNotificationCenter />} />
              <Route path="members/:memberId" element={<MemberDetail />} />
              <Route path="crm/dashboard" element={<CRMDashboard />} />
              <Route path="crm/leads" element={<CRMLeads />} />
              <Route path="crm/leads/:leadId" element={<CRMLeadDetail />} />
              <Route path="crm/pipeline" element={<CRMPipeline />} />
              <Route path="crm/templates" element={<CRMTemplates />} />
              <Route path="crm/calendar" element={<CRMCalendar />} />
              <Route path="operations/lead-assignment" element={<LeadAssignment />} />
              <Route path="content/widgets-config" element={<WidgetConfig />} />
              <Route path="settings/notifications" element={<NotificationRules />} />
              <Route path="settings/modules" element={<RequirePermission permission="settings.manage"><ModuleManagement /></RequirePermission>} />
              <Route path="system/health" element={<SystemHealth />} />
              <Route path="messaging/chat" element={<ChatModeration />} />
              <Route path="messaging/push" element={<PushNotifications />} />
              <Route path="reports" element={<Reports />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </AdminProvider>
  );
}
