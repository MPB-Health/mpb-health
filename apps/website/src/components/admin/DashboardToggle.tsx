import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { getPortalUrl } from '@mpbhealth/config';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

/**
 * DashboardToggle - Floating toolbar for admins to quickly switch between portals
 * Only shows for users with admin or super_admin roles
 */
const DashboardToggle: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSuperAdmin, isAdmin, isAdvisor, rolesLoading } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show if user is not logged in or has no elevated roles
  if (!user || rolesLoading) return null;
  if (!isSuperAdmin && !isAdmin && !isAdvisor) return null;

  // Determine current portal
  const currentPath = location.pathname;
  const isOnAdmin = currentPath.startsWith('/admin');
  const isOnAdvisor = currentPath.startsWith('/advisor');
  const isOnMember = currentPath.startsWith('/member');

  const getCurrentPortal = () => {
    if (isOnAdmin) return 'admin';
    if (isOnAdvisor) return 'advisor';
    if (isOnMember) return 'member';
    return 'public';
  };

  const currentPortal = getCurrentPortal();

  const portals = [
    {
      id: 'admin',
      label: 'Admin Dashboard',
      shortLabel: 'Admin',
      icon: LayoutDashboard,
      path: '/admin',
      canAccess: isSuperAdmin || isAdmin,
      color: 'bg-blue-600 hover:bg-blue-700',
      activeColor: 'bg-blue-700',
      external: false,
    },
    {
      id: 'advisor',
      label: 'Advisor Dashboard',
      shortLabel: 'Advisor',
      icon: Briefcase,
      path: getPortalUrl('advisors'),
      canAccess: isSuperAdmin || isAdvisor,
      color: 'bg-green-600 hover:bg-green-700',
      activeColor: 'bg-green-700',
      external: true,
    },
    {
      id: 'crm',
      label: 'CRM Dashboard',
      shortLabel: 'CRM',
      icon: Building2,
      path: getPortalUrl('crm'),
      canAccess: isSuperAdmin || isAdmin,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      activeColor: 'bg-indigo-700',
      external: true,
    },
    {
      id: 'member',
      label: 'Member Dashboard',
      shortLabel: 'Member',
      icon: Users,
      path: '/member/dashboard',
      canAccess: true, // All authenticated users
      color: 'bg-purple-600 hover:bg-purple-700',
      activeColor: 'bg-purple-700',
      external: false,
    },
  ];

  const accessiblePortals = portals.filter((p) => p.canAccess);

  // Don't show if only one portal accessible
  if (accessiblePortals.length <= 1) return null;

  const handleNavigate = (path: string, external?: boolean) => {
    if (external) {
      window.location.href = path;
      return;
    }
    navigate(path);
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded Menu */}
      {isExpanded && (
        <div className="mb-3 bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          <div className="p-3 bg-neutral-50 border-b border-neutral-200">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <Eye className="h-4 w-4" />
              Quick Portal Access
            </div>
          </div>
          <div className="p-2 space-y-1">
            {accessiblePortals.map((portal) => {
              const Icon = portal.icon;
              const isActive = currentPortal === portal.id;
              return (
                <button
                  key={portal.id}
                  onClick={() => handleNavigate(portal.path, portal.external)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      isActive ? portal.activeColor : 'bg-neutral-200',
                      isActive && 'text-white'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{portal.label}</div>
                    {isActive && (
                      <div className="text-xs text-blue-500">Currently viewing</div>
                    )}
                  </div>
                  {!isActive && <ExternalLink className="h-4 w-4 text-neutral-400" />}
                </button>
              );
            })}
          </div>
          <div className="p-2 bg-neutral-50 border-t border-neutral-200">
            <div className="text-xs text-neutral-500 text-center">
              {isSuperAdmin ? 'Super Admin Access' : 'Staff Access'}
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all',
          'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
          'hover:from-blue-700 hover:to-indigo-700',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        )}
      >
        <Eye className="h-5 w-5" />
        <span className="font-medium text-sm">
          {isExpanded ? 'Close' : 'Switch Portal'}
        </span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

export default DashboardToggle;
