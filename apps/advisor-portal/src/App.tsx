import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AdvisorProvider } from './contexts/AdvisorContext';
import { nudgeAdvisorQueries } from './query/nudgeAdvisorQueries';
import { TourProvider } from './contexts/TourContext';
import MainLayout from './layouts/MainLayout';
import { AdvisorPageLoader } from './components/loading';

// Route module factories for lazy loading + prefetching
const routeModules = {
  Dashboard: () => import('./pages/Dashboard'),
  Overview: () => import('./pages/Overview'),
  Training: () => import('./pages/Training'),
  TrainingModule: () => import('./pages/TrainingModule'),
  Forms: () => import('./pages/Forms'),
  QuickLinks: () => import('./pages/QuickLinks'),
  SOPLibrary: () => import('./pages/SOPLibrary'),
  SOPDocument: () => import('./pages/SOPDocument'),
  Bulletins: () => import('./pages/Bulletins'),
  BulletinDetail: () => import('./pages/BulletinDetail'),
  SubmitGroup: () => import('./pages/SubmitGroup'),
  Contact: () => import('./pages/Contact'),
  Profile: () => import('./pages/Profile'),
  Inbox: () => import('./pages/Inbox'),
  ConversationThread: () => import('./pages/ConversationThread'),
  AuditLog: () => import('./pages/AuditLog'),
  VideoLibrary: () => import('./pages/VideoLibrary'),
  Tickets: () => import('./pages/Tickets'),
  TicketDetailPage: () => import('./pages/TicketDetailPage'),
  NewTicket: () => import('./pages/NewTicket'),
  ChatPage: () => import('./pages/Chat'),
  AdminTickets: () => import('./pages/AdminTickets'),
  AddAdvisor: () => import('./pages/AddAdvisor'),
  Login: () => import('./pages/Login'),
  ForgotPassword: () => import('./pages/ForgotPassword'),
  ResetPassword: () => import('./pages/ResetPassword'),
  ChangePassword: () => import('./pages/ChangePassword'),
  SettingsHub: () => import('./pages/settings/SettingsHub'),
  OrganizationSettings: () => import('./pages/settings/OrganizationSettings'),
  TeamManagement: () => import('./pages/settings/TeamManagement'),
  NotificationPreferences: () => import('./pages/settings/NotificationPreferences'),
  UserPreferences: () => import('./pages/settings/UserPreferences'),
  ApiKeys: () => import('./pages/settings/ApiKeys'),
  Integrations: () => import('./pages/settings/Integrations'),
} as const;

// Prefetch cache to avoid duplicate requests
const prefetched = new Set<string>();

/** Eagerly fetch a route's JS chunk so navigation feels instant. */
export function prefetchRoute(name: keyof typeof routeModules) {
  if (prefetched.has(name)) return;
  prefetched.add(name);
  routeModules[name]().catch(() => prefetched.delete(name));
}

// Map route paths to module names for link-based prefetching
const pathToModule: Record<string, keyof typeof routeModules> = {
  '/': 'Dashboard',
  '/overview': 'Overview',
  '/training': 'Training',
  '/forms': 'Forms',
  '/quick-links': 'QuickLinks',
  '/sops': 'SOPLibrary',
  '/bulletins': 'Bulletins',
  '/videos': 'VideoLibrary',
  '/tickets': 'Tickets',
  /* dynamic: /tickets/:id uses TicketDetailPage */
  '/tickets/new': 'NewTicket',
  '/contact': 'Contact',
  '/submit-group': 'SubmitGroup',
  '/chat': 'ChatPage',
  '/inbox': 'Inbox',
  '/profile': 'Profile',
  '/settings': 'SettingsHub',
  '/audit-log': 'AuditLog',
};

/** Prefetch a route chunk by path (for use in nav link onMouseEnter/onFocus). */
export function prefetchRouteByPath(path: string) {
  const mod = pathToModule[path];
  if (mod) prefetchRoute(mod);
}

// Lazy-loaded page components (using shared module factories)
const Dashboard = React.lazy(routeModules.Dashboard);
const Overview = React.lazy(routeModules.Overview);
const Training = React.lazy(routeModules.Training);
const TrainingModule = React.lazy(routeModules.TrainingModule);
const Forms = React.lazy(routeModules.Forms);
const QuickLinks = React.lazy(routeModules.QuickLinks);
const SOPLibrary = React.lazy(routeModules.SOPLibrary);
const SOPDocument = React.lazy(routeModules.SOPDocument);
const Bulletins = React.lazy(routeModules.Bulletins);
const BulletinDetail = React.lazy(routeModules.BulletinDetail);
const SubmitGroup = React.lazy(routeModules.SubmitGroup);
const Contact = React.lazy(routeModules.Contact);
const Profile = React.lazy(routeModules.Profile);
const Inbox = React.lazy(routeModules.Inbox);
const ConversationThread = React.lazy(routeModules.ConversationThread);
const AuditLog = React.lazy(routeModules.AuditLog);
const VideoLibrary = React.lazy(routeModules.VideoLibrary);
const Tickets = React.lazy(routeModules.Tickets);
const TicketDetailPage = React.lazy(routeModules.TicketDetailPage);
const NewTicket = React.lazy(routeModules.NewTicket);
const ChatPage = React.lazy(routeModules.ChatPage);
const AdminTickets = React.lazy(routeModules.AdminTickets);
const AddAdvisor = React.lazy(routeModules.AddAdvisor);
const Login = React.lazy(routeModules.Login);
const ForgotPassword = React.lazy(routeModules.ForgotPassword);
const ResetPassword = React.lazy(routeModules.ResetPassword);
const ChangePassword = React.lazy(routeModules.ChangePassword);
const SettingsHub = React.lazy(routeModules.SettingsHub);
const OrganizationSettings = React.lazy(routeModules.OrganizationSettings);
const TeamManagement = React.lazy(routeModules.TeamManagement);
const NotificationPreferences = React.lazy(routeModules.NotificationPreferences);
const UserPreferences = React.lazy(routeModules.UserPreferences);
const ApiKeys = React.lazy(routeModules.ApiKeys);
const Integrations = React.lazy(routeModules.Integrations);

function routeFallback(message: string, subtitle?: string) {
  return (
    <AdvisorPageLoader
      message={message}
      subtitle={subtitle ?? 'Fetching this section…'}
      delayMs={0}
    />
  );
}

// ── Route-level error boundary ───────────────────────────────────────────────
class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  private readonly chunkReloadKey = 'advisor-route-chunk-reload-ts';

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Advisor route error:', error, info.componentStack);

    const isChunkError =
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('error loading dynamically imported module');

    if (isChunkError) {
      try {
        const last = Number(sessionStorage.getItem(this.chunkReloadKey) || '0');
        if (Date.now() - last > 30000) {
          sessionStorage.setItem(this.chunkReloadKey, String(Date.now()));
          window.location.reload();
        }
      } catch (_) {
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Page failed to load</h2>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '0.5rem 1.5rem',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              marginRight: '0.5rem',
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
        </div>
      );
    }
    return this.props.children;
  }
}

// Eagerly prefetch all route chunks after initial paint so in-app
// navigation never shows a loading spinner (the full set is ~200 KB
// gzipped — acceptable on any broadband or LTE connection).
if (typeof window !== 'undefined') {
  const ric = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1));

  // High-priority routes first (most-visited)
  ric(
    () => {
      prefetchRoute('Dashboard');
      prefetchRoute('Bulletins');
      prefetchRoute('Training');
      prefetchRoute('QuickLinks');
      prefetchRoute('Forms');
      prefetchRoute('SOPLibrary');
      prefetchRoute('Tickets');
      prefetchRoute('VideoLibrary');
    },
    { timeout: 3000 },
  );

  // Everything else on next idle
  ric(
    () => {
      const alreadyQueued = new Set([
        'Dashboard', 'Bulletins', 'Training', 'QuickLinks',
        'Forms', 'SOPLibrary', 'Tickets', 'VideoLibrary',
      ]);
      (Object.keys(routeModules) as (keyof typeof routeModules)[]).forEach((name) => {
        if (!alreadyQueued.has(name)) prefetchRoute(name);
      });
    },
    { timeout: 8000 },
  );
}

/**
 * In-tab navigations do not fire visibility/focus; after idle or a network blip, active queries
 * can stay pending until a full reload. Resume paused work and refetch mounted observers.
 */
function RouteChangeQueryRecovery() {
  const { pathname } = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const t0 = window.setTimeout(() => {
      nudgeAdvisorQueries(queryClient, 'route');
    }, 0);
    const t1 = window.setTimeout(() => {
      nudgeAdvisorQueries(queryClient, 'route-deferred');
    }, 75);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
    };
  }, [pathname, queryClient]);

  return null;
}

export default function App() {
  return (
    <AdvisorProvider>
      <TourProvider>
        <RouteErrorBoundary>
          <RouteChangeQueryRecovery />
          <Routes>
            {/* Auth routes — own Suspense so they don't depend on MainLayout */}
            <Route path="/login" element={<Suspense fallback={routeFallback('Loading…', 'Preparing sign-in.')}><Login /></Suspense>} />
            <Route path="/forgot-password" element={<Suspense fallback={routeFallback('Loading…', 'Preparing password reset.')}><ForgotPassword /></Suspense>} />
            <Route path="/reset-password" element={<Suspense fallback={routeFallback('Loading…', 'Preparing reset form.')}><ResetPassword /></Suspense>} />
            <Route path="/change-password" element={<Suspense fallback={routeFallback('Loading…', 'Preparing password change.')}><ChangePassword /></Suspense>} />

            {/* Authenticated routes — Suspense renders inside the layout shell */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Suspense fallback={routeFallback('Loading page…')}><Dashboard /></Suspense>} />
              <Route path="overview" element={<Suspense fallback={routeFallback('Loading page…')}><Overview /></Suspense>} />
              <Route path="training" element={<Suspense fallback={routeFallback('Loading page…')}><Training /></Suspense>} />
              <Route path="training/mpb" element={<Suspense fallback={routeFallback('Loading page…')}><Training section="mpb" /></Suspense>} />
              <Route path="training/sedera" element={<Suspense fallback={routeFallback('Loading page…')}><Training section="sedera" /></Suspense>} />
              <Route path="training/zion" element={<Suspense fallback={routeFallback('Loading page…')}><Training section="zion" /></Suspense>} />
              <Route path="training/mpb-cards" element={<Suspense fallback={routeFallback('Loading page…')}><Training section="mpb-cards" /></Suspense>} />
              <Route path="training/secure-hsa" element={<Suspense fallback={routeFallback('Loading page…')}><Training section="secure-hsa" /></Suspense>} />
              <Route path="training/care-plus" element={<Suspense fallback={routeFallback('Loading page…')}><Training section="care-plus" /></Suspense>} />
              <Route path="training/:moduleId" element={<Suspense fallback={routeFallback('Loading page…')}><TrainingModule /></Suspense>} />
              <Route path="forms" element={<Suspense fallback={routeFallback('Loading page…')}><Forms /></Suspense>} />
              <Route path="forms/advisor" element={<Suspense fallback={routeFallback('Loading page…')}><Forms section="advisor" /></Suspense>} />
              <Route path="forms/employer" element={<Suspense fallback={routeFallback('Loading page…')}><Forms section="employer" /></Suspense>} />
              <Route path="forms/member" element={<Suspense fallback={routeFallback('Loading page…')}><Forms section="member" /></Suspense>} />
              <Route path="quick-links" element={<Suspense fallback={routeFallback('Loading page…')}><QuickLinks /></Suspense>} />
              <Route path="sops" element={<Suspense fallback={routeFallback('Loading page…')}><SOPLibrary /></Suspense>} />
              <Route path="sops/advisor-toolkit" element={<Suspense fallback={routeFallback('Loading page…')}><SOPLibrary section="advisor-toolkit" /></Suspense>} />
              <Route path="sops/pricing-charts" element={<Suspense fallback={routeFallback('Loading page…')}><SOPLibrary section="pricing-charts" /></Suspense>} />
              <Route path="sops/reference-materials" element={<Suspense fallback={routeFallback('Loading page…')}><SOPLibrary section="reference-materials" /></Suspense>} />
              <Route path="sops/quick-reference" element={<Suspense fallback={routeFallback('Loading page…')}><SOPLibrary section="quick-reference" /></Suspense>} />
              <Route path="sops/flyers-sedera" element={<Suspense fallback={routeFallback('Loading page…')}><SOPLibrary section="flyers-sedera" /></Suspense>} />
              <Route path="sops/flyers" element={<Suspense fallback={routeFallback('Loading page…')}><SOPLibrary section="flyers" /></Suspense>} />
              <Route path="sops/sharing-guidelines" element={<Suspense fallback={routeFallback('Loading page…')}><SOPLibrary section="sharing-guidelines" /></Suspense>} />
              <Route path="sops/healthsharing-zion" element={<Suspense fallback={routeFallback('Loading page…')}><SOPLibrary section="healthsharing-zion" /></Suspense>} />
              <Route path="sops/zion" element={<Suspense fallback={routeFallback('Loading page…')}><SOPLibrary section="zion" /></Suspense>} />
              <Route path="sops/arm" element={<Suspense fallback={routeFallback('Loading page…')}><SOPLibrary section="arm" /></Suspense>} />
              <Route path="sops/rx" element={<Suspense fallback={routeFallback('Loading page…')}><SOPLibrary section="rx" /></Suspense>} />
              <Route path="sops/handbooks" element={<Suspense fallback={routeFallback('Loading page…')}><SOPLibrary section="handbooks" /></Suspense>} />
              <Route path="sops/:documentId" element={<Suspense fallback={routeFallback('Loading page…')}><SOPDocument /></Suspense>} />
              <Route path="bulletins" element={<Suspense fallback={routeFallback('Loading page…')}><Bulletins /></Suspense>} />
              <Route path="bulletins/:slug" element={<Suspense fallback={routeFallback('Loading page…')}><BulletinDetail /></Suspense>} />
              <Route path="videos" element={<Suspense fallback={routeFallback('Loading page…')}><VideoLibrary /></Suspense>} />
              <Route path="submit-group" element={<Suspense fallback={routeFallback('Loading page…')}><SubmitGroup /></Suspense>} />
              <Route path="contact" element={<Suspense fallback={routeFallback('Loading page…')}><Contact /></Suspense>} />
              <Route path="tickets/new" element={<Suspense fallback={routeFallback('Loading page…')}><NewTicket /></Suspense>} />
              <Route
                path="tickets/:ticketId"
                element={<Suspense fallback={routeFallback('Loading page…')}><TicketDetailPage /></Suspense>}
              />
              <Route path="tickets" element={<Suspense fallback={routeFallback('Loading page…')}><Tickets /></Suspense>} />
              <Route path="admin/tickets" element={<Suspense fallback={routeFallback('Loading page…')}><AdminTickets /></Suspense>} />
              <Route path="add-advisor" element={<Suspense fallback={routeFallback('Loading page…')}><AddAdvisor /></Suspense>} />
              <Route path="chat" element={<Suspense fallback={routeFallback('Loading page…')}><ChatPage /></Suspense>} />
              <Route path="chat/:conversationId" element={<Suspense fallback={routeFallback('Loading page…')}><ChatPage /></Suspense>} />
              <Route path="inbox" element={<Suspense fallback={routeFallback('Loading page…')}><Inbox /></Suspense>} />
              <Route path="inbox/:conversationId" element={<Suspense fallback={routeFallback('Loading page…')}><ConversationThread /></Suspense>} />
              <Route path="audit-log" element={<Suspense fallback={routeFallback('Loading page…')}><AuditLog /></Suspense>} />
              <Route path="profile" element={<Suspense fallback={routeFallback('Loading page…')}><Profile /></Suspense>} />
              {/* Settings Routes */}
              <Route path="settings" element={<Suspense fallback={routeFallback('Loading page…')}><SettingsHub /></Suspense>} />
              <Route path="settings/organization" element={<Suspense fallback={routeFallback('Loading page…')}><OrganizationSettings /></Suspense>} />
              <Route path="settings/team" element={<Suspense fallback={routeFallback('Loading page…')}><TeamManagement /></Suspense>} />
              <Route path="settings/notifications" element={<Suspense fallback={routeFallback('Loading page…')}><NotificationPreferences /></Suspense>} />
              <Route path="settings/preferences" element={<Suspense fallback={routeFallback('Loading page…')}><UserPreferences /></Suspense>} />
              <Route path="settings/api-keys" element={<Suspense fallback={routeFallback('Loading page…')}><ApiKeys /></Suspense>} />
              <Route path="settings/integrations" element={<Suspense fallback={routeFallback('Loading page…')}><Integrations /></Suspense>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RouteErrorBoundary>
      </TourProvider>
    </AdvisorProvider>
  );
}
