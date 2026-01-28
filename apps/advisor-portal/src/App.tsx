import { Routes, Route, Navigate } from 'react-router-dom';
import { AdvisorProvider } from './contexts/AdvisorContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Training from './pages/Training';
import TrainingModule from './pages/TrainingModule';
import Meetings from './pages/Meetings';
import MeetingRoom from './pages/MeetingRoom';
import Forms from './pages/Forms';
import SOPLibrary from './pages/SOPLibrary';
import SOPDocument from './pages/SOPDocument';
import Bulletins from './pages/Bulletins';
import Profile from './pages/Profile';
import MyLeads from './pages/MyLeads';
import PowerList from './pages/PowerList';
import LeadDetail from './pages/LeadDetail';
import Inbox from './pages/Inbox';
import ConversationThread from './pages/ConversationThread';
import Sequences from './pages/Sequences';
import SequenceEditor from './pages/SequenceEditor';
import Compliance from './pages/Compliance';
import AuditLog from './pages/AuditLog';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  return (
    <AdvisorProvider>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="training" element={<Training />} />
          <Route path="training/:moduleId" element={<TrainingModule />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="meetings/:meetingId" element={<MeetingRoom />} />
          <Route path="forms" element={<Forms />} />
          <Route path="sops" element={<SOPLibrary />} />
          <Route path="sops/:documentId" element={<SOPDocument />} />
          <Route path="bulletins" element={<Bulletins />} />
          <Route path="leads" element={<MyLeads />} />
          <Route path="leads/:leadId" element={<LeadDetail />} />
          <Route path="power-list" element={<PowerList />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="inbox/:conversationId" element={<ConversationThread />} />
          <Route path="sequences" element={<Sequences />} />
          <Route path="sequences/:sequenceId" element={<SequenceEditor />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="audit-log" element={<AuditLog />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdvisorProvider>
  );
}
