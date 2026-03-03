import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider } from './contexts/AdminContext';
import MainLayout from './layouts/MainLayout';

// ── Lazy-loaded page components ──────────────────────────────────────────────
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Users = React.lazy(() => import('./pages/Users'));
const UserDetail = React.lazy(() => import('./pages/UserDetail'));
const Enrollments = React.lazy(() => import('./pages/Enrollments'));
const EnrollmentDetail = React.lazy(() => import('./pages/EnrollmentDetail'));
const BlogPosts = React.lazy(() => import('./pages/BlogPosts'));
const BlogEditor = React.lazy(() => import('./pages/BlogEditor'));
const Resources = React.lazy(() => import('./pages/Resources'));
const BulletinsList = React.lazy(() => import('./pages/BulletinsList'));
const BulletinEditor = React.lazy(() => import('./pages/BulletinEditor'));
const Settings = React.lazy(() => import('./pages/Settings'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs'));
const Login = React.lazy(() => import('./pages/Login'));
const AcceptInvite = React.lazy(() => import('./pages/AcceptInvite'));
const PaymentProcessors = React.lazy(() => import('./pages/PaymentProcessors'));
const SmsAccounts = React.lazy(() => import('./pages/SmsAccounts'));
const PromoCodes = React.lazy(() => import('./pages/PromoCodes'));
const CodeInventory = React.lazy(() => import('./pages/CodeInventory'));
const AdminResources = React.lazy(() => import('./pages/AdminResources'));
const ESignature = React.lazy(() => import('./pages/ESignature'));
const PlansList = React.lazy(() => import('./pages/PlansList'));
const PlanEditor = React.lazy(() => import('./pages/PlanEditor'));
const TicketsList = React.lazy(() => import('./pages/TicketsList'));
const TicketDetail = React.lazy(() => import('./pages/TicketDetail'));
const TicketCategoriesSettings = React.lazy(() => import('./pages/TicketCategoriesSettings'));
// Phase 2 — CMS pages
const TrainingModulesList = React.lazy(() => import('./pages/TrainingModulesList'));
const TrainingModuleEditor = React.lazy(() => import('./pages/TrainingModuleEditor'));
const SOPsList = React.lazy(() => import('./pages/SOPsList'));
const SOPEditor = React.lazy(() => import('./pages/SOPEditor'));
const QuickLinksList = React.lazy(() => import('./pages/QuickLinksList'));
const VideoLibraryList = React.lazy(() => import('./pages/VideoLibraryList'));
const FormsList = React.lazy(() => import('./pages/FormsList'));
const ContactDirectory = React.lazy(() => import('./pages/ContactDirectory'));
const NavigationManager = React.lazy(() => import('./pages/NavigationManager'));

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
    console.error('Admin route error:', error, info.componentStack);
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
    <AdminProvider>
      <RouteErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
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
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </AdminProvider>
  );
}
