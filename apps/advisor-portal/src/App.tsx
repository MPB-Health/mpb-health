import { Routes, Route, Navigate } from 'react-router-dom';
import { AdvisorProvider } from './contexts/AdvisorContext';
import { TourProvider } from './contexts/TourContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Training from './pages/Training';
import TrainingModule from './pages/TrainingModule';
import Meetings from './pages/Meetings';
import MeetingRoom from './pages/MeetingRoom';
import Forms from './pages/Forms';
import QuickLinks from './pages/QuickLinks';
import SOPLibrary from './pages/SOPLibrary';
import SOPDocument from './pages/SOPDocument';
import Bulletins from './pages/Bulletins';
import SubmitGroup from './pages/SubmitGroup';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Inbox from './pages/Inbox';
import ConversationThread from './pages/ConversationThread';
import AuditLog from './pages/AuditLog';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import {
  SettingsHub,
  OrganizationSettings,
  TeamManagement,
  NotificationPreferences,
  UserPreferences,
  ApiKeys,
  Integrations,
} from './pages/settings';

export default function App() {
  return (
    <AdvisorProvider>
      <TourProvider>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="training" element={<Training />} />
          <Route path="training/mpb" element={<Training section="mpb" />} />
          <Route path="training/sedera" element={<Training section="sedera" />} />
          <Route path="training/zion" element={<Training section="zion" />} />
          <Route path="training/:moduleId" element={<TrainingModule />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="meetings/:meetingId" element={<MeetingRoom />} />
          <Route path="forms" element={<Forms />} />
          <Route path="forms/advisor" element={<Forms section="advisor" />} />
          <Route path="forms/employer" element={<Forms section="employer" />} />
          <Route path="forms/member" element={<Forms section="member" />} />
          <Route path="quick-links" element={<QuickLinks />} />
          <Route path="sops" element={<SOPLibrary />} />
          <Route path="sops/presentations" element={<SOPLibrary section="presentations" />} />
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
          <Route path="sops/:documentId" element={<SOPDocument />} />
          <Route path="bulletins" element={<Bulletins />} />
          <Route path="submit-group" element={<SubmitGroup />} />
          <Route path="contact" element={<Contact />} />
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
      </TourProvider>
    </AdvisorProvider>
  );
}
