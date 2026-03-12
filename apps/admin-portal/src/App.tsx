import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AdminProvider } from './contexts/AdminContext';
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
// Command center pages
const Members = lazyRetry(() => import('./pages/Members'));
const MemberDetail = lazyRetry(() => import('./pages/MemberDetail'));
const CRMDashboard = lazyRetry(() => import('./pages/CRMDashboard'));
const CRMLeads = lazyRetry(() => import('./pages/CRMLeads'));
const CRMLeadDetail = lazyRetry(() => import('./pages/CRMLeadDetail'));
const SystemHealth = lazyRetry(() => import('./pages/SystemHealth'));
const ChatModeration = lazyRetry(() => import('./pages/ChatModeration'));
const PushNotifications = lazyRetry(() => import('./pages/PushNotifications'));
const Reports = lazyRetry(() => import('./pages/Reports'));
const AdvisorAccess = lazyRetry(() => import('./pages/AdvisorAccess'));

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
              <Route path="users" element={<Users />} />
              <Route path="advisor-access" element={<AdvisorAccess />} />
              <Route path="users/:userId" element={<UserDetail />} />
              <Route path="enrollments" element={<Enrollments />} />
              <Route path="enrollments/:enrollmentId" element={<EnrollmentDetail />} />
              <Route path="plans" element={<PlansList />} />
              <Route path="plans/new" element={<PlanEditor />} />
              <Route path="plans/:id" element={<PlanEditor />} />
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
              <Route path="settings" element={<Settings />} />
              <Route path="settings/payments" element={<PaymentProcessors />} />
              <Route path="settings/sms" element={<SmsAccounts />} />
              <Route path="settings/promo-codes" element={<PromoCodes />} />
              <Route path="settings/code-inventory" element={<CodeInventory />} />
              <Route path="settings/resources" element={<AdminResources />} />
              <Route path="settings/esignature" element={<ESignature />} />
              <Route path="settings/ticket-categories" element={<TicketCategoriesSettings />} />
              <Route path="support/tickets" element={<TicketsList />} />
              <Route path="support/tickets/:ticketId" element={<TicketDetail />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              {/* Command center routes */}
              <Route path="members" element={<Members />} />
              <Route path="members/:memberId" element={<MemberDetail />} />
              <Route path="crm/dashboard" element={<CRMDashboard />} />
              <Route path="crm/leads" element={<CRMLeads />} />
              <Route path="crm/leads/:leadId" element={<CRMLeadDetail />} />
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
