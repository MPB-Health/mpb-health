import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Video,
  FileText,
  BookOpen,
  Bell,
  User,
  LogOut,
  Radio,
} from 'lucide-react';
import { AppLayout, PortalSwitcher, type NavItem } from '@mpbhealth/ui';
import { getPortalUrl } from '@mpbhealth/config';
import { useAdvisor } from '../contexts/AdvisorContext';
import LiveMeetingBanner from '../components/LiveMeetingBanner';

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Training', href: '/training', icon: GraduationCap },
  { name: 'Meetings', href: '/meetings', icon: Video },
  { name: 'Forms', href: '/forms', icon: FileText },
  { name: 'SOPs & Playbooks', href: '/sops', icon: BookOpen },
  { name: 'Bulletins', href: '/bulletins', icon: Bell },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const { profile, liveMeetings, unreadBulletinCount, logout, loading } = useAdvisor();

  // Redirect to login if not authenticated
  if (!loading && !profile) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

  // Add badge to Bulletins nav item
  const navWithBadges: NavItem[] = navigation.map((item) => {
    if (item.name === 'Bulletins' && unreadBulletinCount > 0) {
      return {
        ...item,
        badge: (
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
            {unreadBulletinCount}
          </span>
        ),
      };
    }
    return item;
  });

  const userSection = (
    <div className="space-y-1">
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            isActive
              ? 'bg-white/15 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
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
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white/80" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate text-white">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-xs text-white/50 truncate">
            {profile?.specialization}
          </p>
        </div>
      </NavLink>

      <button
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.08] transition-all duration-150"
      >
        <LogOut className="w-[18px] h-[18px]" />
        <span>Sign Out</span>
      </button>
    </div>
  );

  const topBarActions = (
    <>
      {/* Live meeting indicator */}
      {liveMeetings.length > 0 && (
        <button
          onClick={() => navigate(`/meetings/${liveMeetings[0].id}`)}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium animate-pulse"
        >
          <Radio className="w-4 h-4" />
          <span>Live Meeting</span>
        </button>
      )}

      {/* Notification bell */}
      <button
        onClick={() => navigate('/bulletins')}
        className="relative p-2 text-th-text-secondary hover:text-th-text-primary rounded-lg hover:bg-surface-tertiary transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadBulletinCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>
    </>
  );

  return (
    <>
      {/* Live Meeting Banner */}
      {liveMeetings.length > 0 && <LiveMeetingBanner meetings={liveMeetings} />}

      <AppLayout
        appName="Advisor Portal"
        logoSrc="/logo.png"
        navigation={navWithBadges}
        portalSwitcher={
          <PortalSwitcher
            currentPortal="advisors"
            canAccessAdmin={false}
            canAccessCRM={false}
            canAccessAdvisor={true}
            getPortalUrl={getPortalUrl}
          />
        }
        userSection={userSection}
        topBarActions={topBarActions}
        renderNavLink={(item, props) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `${props.className} ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
              }`
            }
            onClick={props.onClick}
          >
            {props.children}
          </NavLink>
        )}
      >
        <Outlet />
      </AppLayout>
    </>
  );
}
