import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Video,
  FileText,
  BookOpen,
  Bell,
  User,
  Users,
  LogOut,
  Menu,
  X,
  Radio,
} from 'lucide-react';
import { useState } from 'react';
import { useAdvisor } from '../contexts/AdvisorContext';
import LiveMeetingBanner from '../components/LiveMeetingBanner';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'My Leads', href: '/leads', icon: Users },
  { name: 'Training', href: '/training', icon: GraduationCap },
  { name: 'Meetings', href: '/meetings', icon: Video },
  { name: 'Forms', href: '/forms', icon: FileText },
  { name: 'SOPs & Playbooks', href: '/sops', icon: BookOpen },
  { name: 'Bulletins', href: '/bulletins', icon: Bell },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const { profile, liveMeetings, unreadBulletinCount, logout, loading } = useAdvisor();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  if (!loading && !profile) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Live Meeting Banner */}
      {liveMeetings.length > 0 && <LiveMeetingBanner meetings={liveMeetings} />}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-neutral-200 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MPB</span>
            </div>
            <span className="font-semibold text-neutral-900">Advisor Portal</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-neutral-500 hover:text-neutral-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
              {item.name === 'Bulletins' && unreadBulletinCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {unreadBulletinCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200">
          <NavLink
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`
            }
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-neutral-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {profile?.specialization}
              </p>
            </div>
          </NavLink>

          <button
            onClick={logout}
            className="flex items-center space-x-3 px-3 py-2 mt-2 w-full rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-neutral-500 hover:text-neutral-700"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center space-x-4">
              {/* Live indicator */}
              {liveMeetings.length > 0 && (
                <button
                  onClick={() => navigate(`/meetings/${liveMeetings[0].id}`)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium animate-pulse"
                >
                  <Radio className="w-4 h-4" />
                  <span>Live Meeting</span>
                </button>
              )}

              {/* Notifications */}
              <button
                onClick={() => navigate('/bulletins')}
                className="relative p-2 text-neutral-500 hover:text-neutral-700"
              >
                <Bell className="w-5 h-5" />
                {unreadBulletinCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
