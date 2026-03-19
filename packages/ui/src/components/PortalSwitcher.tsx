import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, LayoutDashboard, Users, GraduationCap, Globe, Check } from 'lucide-react';
import { cn } from '../utils';

export type PortalKey = 'admin' | 'crm' | 'advisors' | 'website';

export interface PortalSwitcherProps {
  /** The current portal the user is on */
  currentPortal: PortalKey;
  /** Whether the user can access the Admin Portal */
  canAccessAdmin: boolean;
  /** Whether the user can access the CRM */
  canAccessCRM: boolean;
  /** Whether the user can access the Advisor Portal */
  canAccessAdvisor: boolean;
  /** Whether the user can access the Website Backend */
  canAccessWebsite?: boolean;
  /** Function to get the URL for a portal */
  getPortalUrl: (portal: PortalKey) => string;
  /** Optional: async SSO URL for cross-portal nav. If provided and returns URL, use it; else fall back to getPortalUrl */
  getPortalUrlWithSSO?: (portal: PortalKey) => Promise<string | null>;
  /** Optional className for the container */
  className?: string;
}

interface PortalOption {
  key: PortalKey;
  name: string;
  description: string;
  icon: React.ElementType;
}

const PORTAL_OPTIONS: PortalOption[] = [
  {
    key: 'admin',
    name: 'Admin Portal',
    description: 'Users, enrollments, content',
    icon: LayoutDashboard,
  },
  {
    key: 'crm',
    name: 'CRM',
    description: 'Leads & sales pipeline',
    icon: Users,
  },
  {
    key: 'advisors',
    name: 'Advisor Portal',
    description: 'Training & resources',
    icon: GraduationCap,
  },
  {
    key: 'website',
    name: 'Website Backend',
    description: 'CMS, blog & site settings',
    icon: Globe,
  },
];

export function PortalSwitcher({
  currentPortal,
  canAccessAdmin,
  canAccessCRM,
  canAccessAdvisor,
  canAccessWebsite,
  getPortalUrl,
  getPortalUrlWithSSO,
  className,
}: PortalSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState<PortalKey | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter available portals based on access (memoized to avoid re-filtering every render)
  const availablePortals = useMemo(() => PORTAL_OPTIONS.filter((portal) => {
    if (portal.key === 'admin') return canAccessAdmin;
    if (portal.key === 'crm') return canAccessCRM;
    if (portal.key === 'advisors') return canAccessAdvisor;
    if (portal.key === 'website') return !!canAccessWebsite;
    return false;
  }), [canAccessAdmin, canAccessCRM, canAccessAdvisor, canAccessWebsite]);

  // Don't show the switcher if user only has access to one portal
  if (availablePortals.length <= 1) {
    return null;
  }

  const currentPortalInfo = PORTAL_OPTIONS.find((p) => p.key === currentPortal);
  const CurrentIcon = currentPortalInfo?.icon || LayoutDashboard;

  const handlePortalSwitch = async (portal: PortalKey) => {
    if (portal === currentPortal) {
      setIsOpen(false);
      return;
    }

    setLoadingPortal(portal);
    try {
      if (getPortalUrlWithSSO) {
        const ssoUrl = await getPortalUrlWithSSO(portal);
        if (ssoUrl) {
          window.location.href = ssoUrl;
          return;
        }
      }
    } catch (err) {
      console.error('[PortalSwitcher] SSO failed, using direct link:', err);
    } finally {
      setLoadingPortal(null);
    }

    window.location.href = getPortalUrl(portal);
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
          'text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover))]',
          isOpen && 'bg-[rgb(var(--sidebar-hover))] text-[rgb(var(--sidebar-text-active))]'
        )}
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{currentPortalInfo?.name}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 py-2 rounded-xl bg-[rgb(var(--sidebar-bg))] border border-[rgb(var(--sidebar-text)_/_0.1)] shadow-xl z-50">
          <div className="px-3 py-2 border-b border-[rgb(var(--sidebar-text)_/_0.1)]">
            <p className="text-xs font-medium text-[rgb(var(--sidebar-text)_/_0.6)] uppercase tracking-wider">
              Switch Portal
            </p>
          </div>
          <div className="py-1">
            {availablePortals.map((portal) => {
              const isActive = portal.key === currentPortal;
              const isLoading = loadingPortal === portal.key;
              const Icon = portal.icon;

              return (
                <button
                  key={portal.key}
                  onClick={() => handlePortalSwitch(portal.key)}
                  disabled={isLoading}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150',
                    isActive
                      ? 'bg-[rgb(var(--sidebar-hover))] text-[rgb(var(--sidebar-text-active))]'
                      : 'text-[rgb(var(--sidebar-text))] hover:text-[rgb(var(--sidebar-text-active))] hover:bg-[rgb(var(--sidebar-hover)_/_0.5)]'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      isActive ? 'bg-[rgb(var(--sidebar-text)_/_0.15)]' : 'bg-[rgb(var(--sidebar-text)_/_0.08)]'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{portal.name}</p>
                    <p className="text-xs text-[rgb(var(--sidebar-text)_/_0.6)] truncate">{portal.description}</p>
                  </div>
                  {isActive && (
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
