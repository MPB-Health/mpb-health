// ============================================================================
// Settings Hub — Navigation hub for all settings pages
// ============================================================================

import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Bell,
  Key,
  Plug,
  Palette,
  User,
  ChevronRight,
} from 'lucide-react';
import { useTeamManagement, useApiKeys, useIntegrations } from '../../hooks/useSettings';

const settingsCategories = [
  {
    title: 'Organization',
    description: 'Manage your organization profile and preferences',
    items: [
      {
        name: 'Organization Settings',
        description: 'Business info, branding, and defaults',
        href: '/settings/organization',
        icon: Building2,
        color: 'bg-blue-100 text-blue-600',
      },
      {
        name: 'Team Management',
        description: 'Manage members and invitations',
        href: '/settings/team',
        icon: Users,
        color: 'bg-blue-100 text-blue-600',
      },
    ],
  },
  {
    title: 'Personal',
    description: 'Configure your personal preferences',
    items: [
      {
        name: 'Profile',
        description: 'Your personal information',
        href: '/profile',
        icon: User,
        color: 'bg-green-100 text-green-600',
      },
      {
        name: 'Notifications',
        description: 'Email, SMS, and push preferences',
        href: '/settings/notifications',
        icon: Bell,
        color: 'bg-orange-100 text-orange-600',
      },
      {
        name: 'Appearance',
        description: 'Theme and display settings',
        href: '/settings/preferences',
        icon: Palette,
        color: 'bg-pink-100 text-pink-600',
      },
    ],
  },
  {
    title: 'Developer',
    description: 'API access and integrations',
    items: [
      {
        name: 'API Keys',
        description: 'Manage API keys for integrations',
        href: '/settings/api-keys',
        icon: Key,
        color: 'bg-yellow-100 text-yellow-600',
      },
      {
        name: 'Integrations',
        description: 'Connect third-party services',
        href: '/settings/integrations',
        icon: Plug,
        color: 'bg-blue-100 text-blue-600',
      },
    ],
  },
];

export default function SettingsHub() {
  // Fetch real stats from hooks
  const { members, loading: teamLoading } = useTeamManagement();
  const { apiKeys, loading: keysLoading } = useApiKeys();
  const { integrations, loading: integrationsLoading } = useIntegrations();

  // Calculate stats
  const teamMemberCount = members?.length ?? 0;
  const activeApiKeyCount = apiKeys?.filter(k => k.is_active).length ?? 0;
  const connectedIntegrationCount = integrations?.filter(i => i.is_enabled).length ?? 0;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-th-text-primary">Settings</h1>
          <p className="text-th-text-secondary mt-1">
            Manage your account and organization settings
          </p>
        </div>

        {/* Settings Categories */}
        <div className="space-y-8">
          {settingsCategories.map((category) => (
            <div key={category.title}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-th-text-primary">{category.title}</h2>
                <p className="text-sm text-th-text-secondary">{category.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.items.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="group flex items-center gap-4 p-4 bg-surface-primary rounded-xl border border-th-border-primary hover:border-th-accent-300 hover:shadow-sm transition-all"
                  >
                    <div className={`p-3 rounded-xl ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-th-text-primary group-hover:text-th-accent-600 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-sm text-th-text-secondary truncate">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-th-text-muted group-hover:text-th-accent-600 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 p-6 bg-surface-secondary rounded-xl">
          <h3 className="text-sm font-medium text-th-text-secondary mb-4">Account Overview</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-2xl font-bold text-th-text-primary">
                {teamLoading ? '...' : teamMemberCount}
              </p>
              <p className="text-sm text-th-text-muted">Team Members</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">
                {keysLoading ? '...' : activeApiKeyCount}
              </p>
              <p className="text-sm text-th-text-muted">API Keys</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">
                {integrationsLoading ? '...' : connectedIntegrationCount}
              </p>
              <p className="text-sm text-th-text-muted">Integrations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
