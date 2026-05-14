import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Settings,
  Eye,
  Box,
  FileText,
  Users,
  Briefcase,
  Building2,
  ShoppingCart,
  Folder,
  Database,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import {
  createModuleService,
  type StudioModule,
  type ModuleFilters,
} from '@mpbhealth/crm-core';

// Map icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Box,
  FileText,
  Users,
  Briefcase,
  Building2,
  ShoppingCart,
  Folder,
  Database,
  LayoutGrid,
};

// Get icon component by name
function getIconComponent(iconName: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[iconName] || Box;
}

// Get color classes from color name
function getColorClasses(color: string): { bg: string; text: string; border: string } {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
  };
  return colorMap[color] || colorMap.blue;
}

export default function StudioHome() {
  const { supabase } = useCRM();

  // Initialize module service
  const moduleService = useMemo(() => createModuleService(supabase), [supabase]);

  // State
  const [modules, setModules] = useState<StudioModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ModuleFilters>({ is_active: true });
  const [searchTerm, setSearchTerm] = useState('');

  // Load modules
  const loadModules = useCallback(async () => {
    try {
      const data = await moduleService.getModules({
        ...filters,
        search: searchTerm || undefined,
      });
      setModules(data);
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  }, [moduleService, filters, searchTerm]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadModules();
      setLoading(false);
    };
    init();
  }, [loadModules]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadModules();
    setRefreshing(false);
  };

  // Search handler with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        loadModules();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Toggle active filter
  const handleActiveFilterChange = (showInactive: boolean) => {
    setFilters((prev) => ({
      ...prev,
      is_active: showInactive ? undefined : true,
    }));
  };

  // Separate system and custom modules
  const systemModules = modules.filter((m) => m.is_system);
  const customModules = modules.filter((m) => !m.is_system);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">CRM Studio</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Customize modules, fields, layouts, and views
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/studio/legacy/modules/new"
            className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
          >
            <Plus className="w-4 h-4" />
            <span>Create Module</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
          </div>

          {/* Show inactive toggle */}
          <label className="flex items-center space-x-2 text-sm text-th-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={filters.is_active === undefined}
              onChange={(e) => handleActiveFilterChange(e.target.checked)}
              className="w-4 h-4 rounded border-th-border"
            />
            <span>Show inactive</span>
          </label>
        </div>
      </div>

      {/* Custom Modules Section */}
      <div>
        <h2 className="text-lg font-semibold text-th-text-primary mb-4">
          Custom Modules
          <span className="ml-2 text-sm font-normal text-th-text-tertiary">
            ({customModules.length})
          </span>
        </h2>

        {customModules.length === 0 ? (
          <div className="bg-surface-primary rounded-xl border border-th-border p-8 text-center">
            <Database className="w-12 h-12 mx-auto text-th-text-tertiary opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-th-text-primary mb-2">
              No custom modules yet
            </h3>
            <p className="text-sm text-th-text-tertiary mb-4">
              Create your first custom module to extend your CRM
            </p>
            <Link
              to="/studio/legacy/modules/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Module</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customModules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        )}
      </div>

      {/* System Modules Section */}
      {systemModules.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-th-text-primary mb-4">
            System Modules
            <span className="ml-2 text-sm font-normal text-th-text-tertiary">
              ({systemModules.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemModules.map((module) => (
              <ModuleCard key={module.id} module={module} isSystem />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Module Card Component
interface ModuleCardProps {
  module: StudioModule;
  isSystem?: boolean;
}

function ModuleCard({ module, isSystem = false }: ModuleCardProps) {
  const IconComponent = getIconComponent(module.icon);
  const colorClasses = getColorClasses(module.color);

  return (
    <div
      className={`bg-surface-primary rounded-xl border border-th-border p-5 hover:shadow-md transition-shadow ${
        !module.is_active ? 'opacity-60' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses.bg}`}
          >
            <IconComponent className={`w-5 h-5 ${colorClasses.text}`} />
          </div>
          <div>
            <h3 className="font-medium text-th-text-primary">{module.name}</h3>
            <p className="text-xs text-th-text-tertiary">{module.api_name}</p>
          </div>
        </div>
        {!module.is_active && (
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
            Inactive
          </span>
        )}
        {isSystem && (
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">
            System
          </span>
        )}
      </div>

      {/* Description */}
      {module.description && (
        <p className="text-sm text-th-text-secondary mb-4 line-clamp-2">
          {module.description}
        </p>
      )}

      {/* Features */}
      <div className="flex items-center space-x-3 mb-4 text-xs text-th-text-tertiary">
        {module.allow_activities && (
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span>Activities</span>
          </span>
        )}
        {module.allow_notes && (
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <span>Notes</span>
          </span>
        )}
        {module.allow_attachments && (
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <span>Attachments</span>
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-th-border">
        <Link
          to={`/studio/modules/${module.id}`}
          className="flex items-center space-x-1 text-sm text-th-accent-600 hover:text-th-accent-700 font-medium"
        >
          <Eye className="w-4 h-4" />
          <span>View</span>
        </Link>
        <Link
          to={`/studio/modules/${module.id}/settings`}
          className="flex items-center space-x-1 text-sm text-th-text-tertiary hover:text-th-text-secondary"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
