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
const AdminTickets = React.lazy(() => import('./pages/AdminTickets'));
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
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Advisor route error:', error, info.componentStack);
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

export default function App() {
  return (
    <AdvisorProvider>
      <TourProvider>
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="training" element={<Training />} />
                <Route path="training/mpb" element={<Training section="mpb" />} />
                <Route path="training/sedera" element={<Training section="sedera" />} />
                <Route path="training/zion" element={<Training section="zion" />} />
                <Route path="training/:moduleId" element={<TrainingModule />} />
                <Route path="forms" element={<Forms />} />
                <Route path="forms/advisor" element={<Forms section="advisor" />} />
                <Route path="forms/employer" element={<Forms section="employer" />} />
                <Route path="forms/member" element={<Forms section="member" />} />
                <Route path="quick-links" element={<QuickLinks />} />
                <Route path="sops" element={<SOPLibrary />} />
                <Route path="sops/advisor-toolkit" element={<SOPLibrary section="advisor-toolkit" />} />
                <Route path="sops/pricing-charts" element={<SOPLibrary section="pricing-charts" />} />
                <Route path="sops/reference-materials" element={<SOPLibrary section="reference-materials" />} />
                <Route path="sops/quick-reference" element={<SOPLibrary section="quick-reference" />} />
                <Route path="sops/flyers-sedera" element={<SOPLibrary section="flyers-sedera" />} />
                <Route path="sops/flyers" element={<SOPLibrary section="flyers" />} />
                <Route path="sops/sharing-guidelines" element={<SOPLibrary section="sharing-guidelines" />} />
                <Route path="sops/healthsharing-zion" element={<SOPLibrary section="healthsharing-zion" />} />
                <Route path="sops/zion" element={<SOPLibrary section="zion" />} />
                <Route path="sops/arm" element={<SOPLibrary section="arm" />} />
                <Route path="sops/rx" element={<SOPLibrary section="rx" />} />
                <Route path="sops/handbooks" element={<SOPLibrary section="handbooks" />} />
                <Route path="sops/:documentId" element={<SOPDocument />} />
                <Route path="bulletins" element={<Bulletins />} />
                <Route path="bulletins/:slug" element={<BulletinDetail />} />
                <Route path="videos" element={<VideoLibrary />} />
                <Route path="submit-group" element={<SubmitGroup />} />
                <Route path="contact" element={<Contact />} />
                <Route path="tickets" element={<Tickets />} />
                <Route path="admin/tickets" element={<AdminTickets />} />
                <Route path="inbox" element={<Inbox />} />
                <Route path="inbox/:conversationId" element={<ConversationThread />} />
                <Route path="audit-log" element={<AuditLog />} />
                <Route path="profile" element={<Profile />} />
                {/* Settings Routes */}
                <Route path="settings" element={<SettingsHub />} />
                <Route path="settings/organization" element={<OrganizationSettings />} />
                <Route path="settings/team" element={<TeamManagement />} />
                <Route path="settings/notifications" element={<NotificationPreferences />} />
                <Route path="settings/preferences" element={<UserPreferences />} />
                <Route path="settings/api-keys" element={<ApiKeys />} />
                <Route path="settings/integrations" element={<Integrations />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </TourProvider>
    </AdvisorProvider>
  );
}
