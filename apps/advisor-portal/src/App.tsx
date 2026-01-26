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
import Login from './pages/Login';

export default function App() {
  return (
    <AdvisorProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
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
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdvisorProvider>
  );
}
