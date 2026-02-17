import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Link } from 'lucide-react';
import { navigationService, type QuickLink } from '@mpbhealth/advisor-core';

function getIconComponent(iconName: string): LucideIcons.LucideIcon {
  const lucideModule = LucideIcons as Record<string, unknown>;
  if (lucideModule[iconName] && typeof lucideModule[iconName] === 'function') {
    return lucideModule[iconName] as LucideIcons.LucideIcon;
  }
  return Link;
}

interface QuickActionItem {
  label: string;
  url: string;
  icon: string;
  highlight?: boolean;
  description?: string;
  is_external?: boolean;
}

const fallbackQuickActions: QuickActionItem[] = [
  { label: 'Inbox', url: '/inbox', icon: 'Inbox', highlight: true },
  { label: 'Training', url: '/training', icon: 'GraduationCap' },
  { label: 'Forms', url: '/forms', icon: 'FileText' },
  { label: 'SOPs', url: '/sops', icon: 'FileText' },
  { label: 'Profile', url: '/profile', icon: 'Award' },
];

export default function QuickLinks() {
  const navigate = useNavigate();
  const [cmsQuickActions, setCmsQuickActions] = useState<QuickLink[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const actions = await navigationService.getDashboardQuickActions();
        setCmsQuickActions(actions);
      } catch (error) {
        console.error('Failed to load quick actions:', error);
      }
    };
    load();
  }, []);

  const quickActions = useMemo((): QuickActionItem[] => {
    if (cmsQuickActions.length > 0) {
      return cmsQuickActions.map((action) => ({
        label: action.label,
        url: action.url,
        icon: action.icon,
        highlight: action.icon === 'Zap' || action.label.toLowerCase().includes('power'),
        description: action.description ?? undefined,
        is_external: action.is_external,
      }));
    }
    return fallbackQuickActions;
  }, [cmsQuickActions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-th-text-primary">Quick Links</h1>
        <p className="mt-1 text-th-text-secondary">
          Shortcuts to common actions and resources.
        </p>
      </div>

      <div className="bg-surface-primary rounded-xl border border-th-border p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = getIconComponent(action.icon);
            const isHighlight = action.highlight;

            const handleClick = () => {
              if (action.is_external) {
                window.open(action.url, '_blank');
              } else {
                navigate(action.url);
              }
            };

            return (
              <button
                key={`${action.url}-${index}`}
                onClick={handleClick}
                title={action.description || action.label}
                className={`flex flex-col items-center p-4 rounded-lg border transition-colors ${
                  isHighlight
                    ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-400 hover:bg-yellow-100'
                    : 'border-th-border hover:border-th-accent-300 hover:bg-th-accent-50'
                }`}
              >
                <IconComponent
                  className={`w-8 h-8 mb-2 ${
                    isHighlight ? 'text-yellow-600' : 'text-th-accent-600'
                  }`}
                />
                <span
                  className={`text-sm font-medium text-center ${
                    isHighlight ? 'text-yellow-700' : 'text-th-text-secondary'
                  }`}
                >
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
