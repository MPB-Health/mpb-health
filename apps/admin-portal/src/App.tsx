import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider } from './contexts/AdminContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Enrollments from './pages/Enrollments';
import EnrollmentDetail from './pages/EnrollmentDetail';
import BlogPosts from './pages/BlogPosts';
import BlogEditor from './pages/BlogEditor';
import Resources from './pages/Resources';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import Login from './pages/Login';
import AcceptInvite from './pages/AcceptInvite';
import PaymentProcessors from './pages/PaymentProcessors';
import SmsAccounts from './pages/SmsAccounts';
import PromoCodes from './pages/PromoCodes';
import CodeInventory from './pages/CodeInventory';
import AdminResources from './pages/AdminResources';
import ESignature from './pages/ESignature';
import PlansList from './pages/PlansList';
import PlanEditor from './pages/PlanEditor';

export default function App() {
  return (
    <AdminProvider>
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
          <Route path="content/resources" element={<Resources />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/payments" element={<PaymentProcessors />} />
          <Route path="settings/sms" element={<SmsAccounts />} />
          <Route path="settings/promo-codes" element={<PromoCodes />} />
          <Route path="settings/code-inventory" element={<CodeInventory />} />
          <Route path="settings/resources" element={<AdminResources />} />
          <Route path="settings/esignature" element={<ESignature />} />
          <Route path="audit-logs" element={<AuditLogs />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminProvider>
  );
}
