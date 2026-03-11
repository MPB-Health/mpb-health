import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdvisorProvider } from './contexts/AdvisorContext';
import { TourProvider } from './contexts/TourContext';
import MainLayout from './layouts/MainLayout';

// ── Lazy-loaded page components ──────────────────────────────────────────────
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Training = React.lazy(() => import('./pages/Training'));
const TrainingModule = React.lazy(() => import('./pages/TrainingModule'));
const Forms = React.lazy(() => import('./pages/Forms'));
const QuickLinks = React.lazy(() => import('./pages/QuickLinks'));
const SOPLibrary = React.lazy(() => import('./pages/SOPLibrary'));
const SOPDocument = React.lazy(() => import('./pages/SOPDocument'));
const Bulletins = React.lazy(() => import('./pages/Bulletins'));
const BulletinDetail = React.lazy(() => import('./pages/BulletinDetail'));
const SubmitGroup = React.lazy(() => import('./pages/SubmitGroup'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Inbox = React.lazy(() => import('./pages/Inbox'));
const ConversationThread = React.lazy(() => import('./pages/ConversationThread'));
const AuditLog = React.lazy(() => import('./pages/AuditLog'));
const VideoLibrary = React.lazy(() => import('./pages/VideoLibrary'));
const Tickets = React.lazy(() => import('./pages/Tickets'));
const NewTicket = React.lazy(() => import('./pages/NewTicket'));
const ChatPage = React.lazy(() => import('./pages/Chat'));
const AdminTickets = React.lazy(() => import('./pages/AdminTickets'));
const KnowledgeBase = React.lazy(() => import('./pages/KnowledgeBase'));
const EventsManager = React.lazy(() => import('./pages/EventsManager'));
const EventForm = React.lazy(() => import('./pages/EventForm'));
const Login = React.lazy(() => import('./pages/Login'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const ChangePassword = React.lazy(() => import('./pages/ChangePassword'));

// Settings pages (lazy-loaded individually instead of barrel import)
const SettingsHub = React.lazy(() => import('./pages/settings/SettingsHub'));
const OrganizationSettings = React.lazy(() => import('./pages/settings/OrganizationSettings'));
const TeamManagement = React.lazy(() => import('./pages/settings/TeamManagement'));
const NotificationPreferences = React.lazy(() => import('./pages/settings/NotificationPreferences'));
const UserPreferences = React.lazy(() => import('./pages/settings/UserPreferences'));
const ApiKeys = React.lazy(() => import('./pages/settings/ApiKeys'));
const Integrations = React.lazy(() => import('./pages/settings/Integrations'));

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

// Content-area spinner for lazy route chunks (rendered inside the layout shell)
function RouteSpinner() {
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
    </div>
  );
}

export default function App() {
  return (
    <AdvisorProvider>
      <TourProvider>
        <RouteErrorBoundary>
          <Routes>
            {/* Auth routes — own Suspense so they don't depend on MainLayout */}
            <Route path="/login" element={<Suspense fallback={<LoadingSpinner />}><Login /></Suspense>} />
            <Route path="/forgot-password" element={<Suspense fallback={<LoadingSpinner />}><ForgotPassword /></Suspense>} />
            <Route path="/reset-password" element={<Suspense fallback={<LoadingSpinner />}><ResetPassword /></Suspense>} />
            <Route path="/change-password" element={<Suspense fallback={<LoadingSpinner />}><ChangePassword /></Suspense>} />

            {/* Authenticated routes — Suspense renders inside the layout shell */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Suspense fallback={<RouteSpinner />}><Dashboard /></Suspense>} />
              <Route path="training" element={<Suspense fallback={<RouteSpinner />}><Training /></Suspense>} />
              <Route path="training/mpb" element={<Suspense fallback={<RouteSpinner />}><Training section="mpb" /></Suspense>} />
              <Route path="training/sedera" element={<Suspense fallback={<RouteSpinner />}><Training section="sedera" /></Suspense>} />
              <Route path="training/zion" element={<Suspense fallback={<RouteSpinner />}><Training section="zion" /></Suspense>} />
              <Route path="training/mpb-cards" element={<Suspense fallback={<RouteSpinner />}><Training section="mpb-cards" /></Suspense>} />
              <Route path="training/secure-hsa" element={<Suspense fallback={<RouteSpinner />}><Training section="secure-hsa" /></Suspense>} />
              <Route path="training/care-plus" element={<Suspense fallback={<RouteSpinner />}><Training section="care-plus" /></Suspense>} />
              <Route path="training/:moduleId" element={<Suspense fallback={<RouteSpinner />}><TrainingModule /></Suspense>} />
              <Route path="forms" element={<Suspense fallback={<RouteSpinner />}><Forms /></Suspense>} />
              <Route path="forms/advisor" element={<Suspense fallback={<RouteSpinner />}><Forms section="advisor" /></Suspense>} />
              <Route path="forms/employer" element={<Suspense fallback={<RouteSpinner />}><Forms section="employer" /></Suspense>} />
              <Route path="forms/member" element={<Suspense fallback={<RouteSpinner />}><Forms section="member" /></Suspense>} />
              <Route path="quick-links" element={<Suspense fallback={<RouteSpinner />}><QuickLinks /></Suspense>} />
              <Route path="sops" element={<Suspense fallback={<RouteSpinner />}><SOPLibrary /></Suspense>} />
              <Route path="sops/advisor-toolkit" element={<Suspense fallback={<RouteSpinner />}><SOPLibrary section="advisor-toolkit" /></Suspense>} />
              <Route path="sops/pricing-charts" element={<Suspense fallback={<RouteSpinner />}><SOPLibrary section="pricing-charts" /></Suspense>} />
              <Route path="sops/reference-materials" element={<Suspense fallback={<RouteSpinner />}><SOPLibrary section="reference-materials" /></Suspense>} />
              <Route path="sops/quick-reference" element={<Suspense fallback={<RouteSpinner />}><SOPLibrary section="quick-reference" /></Suspense>} />
              <Route path="sops/flyers-sedera" element={<Suspense fallback={<RouteSpinner />}><SOPLibrary section="flyers-sedera" /></Suspense>} />
              <Route path="sops/flyers" element={<Suspense fallback={<RouteSpinner />}><SOPLibrary section="flyers" /></Suspense>} />
              <Route path="sops/sharing-guidelines" element={<Suspense fallback={<RouteSpinner />}><SOPLibrary section="sharing-guidelines" /></Suspense>} />
              <Route path="sops/healthsharing-zion" element={<Suspense fallback={<RouteSpinner />}><SOPLibrary section="healthsharing-zion" /></Suspense>} />
              <Route path="sops/zion" element={<Suspense fallback={<RouteSpinner />}><SOPLibrary section="zion" /></Suspense>} />
              <Route path="sops/arm" element={<Suspense fallback={<RouteSpinner />}><SOPLibrary section="arm" /></Suspense>} />
              <Route path="sops/rx" element={<Suspense fallback={<RouteSpinner />}><SOPLibrary section="rx" /></Suspense>} />
              <Route path="sops/handbooks" element={<Suspense fallback={<RouteSpinner />}><SOPLibrary section="handbooks" /></Suspense>} />
              <Route path="sops/:documentId" element={<Suspense fallback={<RouteSpinner />}><SOPDocument /></Suspense>} />
              <Route path="bulletins" element={<Suspense fallback={<RouteSpinner />}><Bulletins /></Suspense>} />
              <Route path="bulletins/:slug" element={<Suspense fallback={<RouteSpinner />}><BulletinDetail /></Suspense>} />
              <Route path="events/manage" element={<Suspense fallback={<RouteSpinner />}><EventsManager /></Suspense>} />
              <Route path="events/manage/new" element={<Suspense fallback={<RouteSpinner />}><EventForm /></Suspense>} />
              <Route path="events/manage/:id/edit" element={<Suspense fallback={<RouteSpinner />}><EventForm /></Suspense>} />
              <Route path="videos" element={<Suspense fallback={<RouteSpinner />}><VideoLibrary /></Suspense>} />
              <Route path="submit-group" element={<Suspense fallback={<RouteSpinner />}><SubmitGroup /></Suspense>} />
              <Route path="contact" element={<Suspense fallback={<RouteSpinner />}><Contact /></Suspense>} />
              <Route path="tickets" element={<Suspense fallback={<RouteSpinner />}><Tickets /></Suspense>} />
              <Route path="tickets/new" element={<Suspense fallback={<RouteSpinner />}><NewTicket /></Suspense>} />
              <Route path="knowledge-base" element={<Suspense fallback={<RouteSpinner />}><KnowledgeBase /></Suspense>} />
              <Route path="admin/tickets" element={<Suspense fallback={<RouteSpinner />}><AdminTickets /></Suspense>} />
              <Route path="chat" element={<Suspense fallback={<RouteSpinner />}><ChatPage /></Suspense>} />
              <Route path="chat/:conversationId" element={<Suspense fallback={<RouteSpinner />}><ChatPage /></Suspense>} />
              <Route path="inbox" element={<Suspense fallback={<RouteSpinner />}><Inbox /></Suspense>} />
              <Route path="inbox/:conversationId" element={<Suspense fallback={<RouteSpinner />}><ConversationThread /></Suspense>} />
              <Route path="audit-log" element={<Suspense fallback={<RouteSpinner />}><AuditLog /></Suspense>} />
              <Route path="profile" element={<Suspense fallback={<RouteSpinner />}><Profile /></Suspense>} />
              {/* Settings Routes */}
              <Route path="settings" element={<Suspense fallback={<RouteSpinner />}><SettingsHub /></Suspense>} />
              <Route path="settings/organization" element={<Suspense fallback={<RouteSpinner />}><OrganizationSettings /></Suspense>} />
              <Route path="settings/team" element={<Suspense fallback={<RouteSpinner />}><TeamManagement /></Suspense>} />
              <Route path="settings/notifications" element={<Suspense fallback={<RouteSpinner />}><NotificationPreferences /></Suspense>} />
              <Route path="settings/preferences" element={<Suspense fallback={<RouteSpinner />}><UserPreferences /></Suspense>} />
              <Route path="settings/api-keys" element={<Suspense fallback={<RouteSpinner />}><ApiKeys /></Suspense>} />
              <Route path="settings/integrations" element={<Suspense fallback={<RouteSpinner />}><Integrations /></Suspense>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RouteErrorBoundary>
      </TourProvider>
    </AdvisorProvider>
  );
}
