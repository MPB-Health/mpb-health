import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Save,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Phone,
  Mail,
  Video,
  Users,
  Globe,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../../components/admin/AdminBreadcrumb';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

interface PortalSetting {
  id: string;
  key: string;
  value: string;
  label: string;
  description?: string | null;
  category: string;
  updated_at: string;
  updated_by?: string | null;
}

// Category display configuration
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  contact: { label: 'Contact Information', icon: Phone, color: 'blue' },
  meetings: { label: 'Meetings', icon: Video, color: 'purple' },
  affiliates: { label: 'Affiliates', icon: Users, color: 'green' },
  general: { label: 'General', icon: Globe, color: 'slate' },
};

const colorClasses: Record<string, string> = {
  blue: 'border-blue-200 bg-blue-50',
  purple: 'border-purple-200 bg-purple-50',
  green: 'border-green-200 bg-green-50',
  slate: 'border-slate-200 bg-slate-50',
};

const iconColorClasses: Record<string, string> = {
  blue: 'text-blue-600 bg-blue-100',
  purple: 'text-purple-600 bg-purple-100',
  green: 'text-green-600 bg-green-100',
  slate: 'text-slate-600 bg-slate-100',
};

// ============================================================================
// Main Component
// ============================================================================

export default function PortalSettingsManager() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PortalSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('advisor_portal_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setSettings((data || []) as PortalSetting[]);
      setEditedValues({});
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load portal settings');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const getDisplayValue = (setting: PortalSetting): string => {
    return editedValues[setting.key] !== undefined
      ? editedValues[setting.key]
      : setting.value;
  };

  const hasChanges = Object.keys(editedValues).some((key) => {
    const original = settings.find((s) => s.key === key);
    return original && editedValues[key] !== original.value;
  });

  const changedCount = Object.keys(editedValues).filter((key) => {
    const original = settings.find((s) => s.key === key);
    return original && editedValues[key] !== original.value;
  }).length;

  const handleSave = async () => {
    const changedKeys = Object.keys(editedValues).filter((key) => {
      const original = settings.find((s) => s.key === key);
      return original && editedValues[key] !== original.value;
    });

    if (changedKeys.length === 0) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      for (const key of changedKeys) {
        const { error } = await supabase
          .from('advisor_portal_settings')
          .update({ value: editedValues[key], updated_by: userId })
          .eq('key', key);
        if (error) throw error;
      }

      toast.success(`${changedKeys.length} setting${changedKeys.length > 1 ? 's' : ''} updated successfully`);
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Group settings by category
  const groupedSettings = settings.reduce<Record<string, PortalSetting[]>>((acc, setting) => {
    const cat = setting.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(setting);
    return acc;
  }, {});

  // Sort categories in display order
  const categoryOrder = ['contact', 'meetings', 'affiliates', 'general'];
  const sortedCategories = categoryOrder.filter((cat) => groupedSettings[cat]);

  return (
    <AdminLayout activeView="advisor-portal-cms" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <AdminBreadcrumb
              currentPage="Portal Settings"
              items={[
                { label: 'Advisor CMS', href: '/admin/advisor-cms' },
                { label: 'Portal Settings' },
              ]}
            />
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Portal Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Manage configurable values used across the Advisor Portal
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/advisor-cms')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hub
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSettings}
              disabled={loading}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
              {changedCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {changedCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Unsaved changes banner */}
        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-900">
                  {changedCount} unsaved change{changedCount > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-amber-700">
                  Click "Save Changes" to apply your updates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditedValues({})}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Loading settings...</p>
            </div>
          </div>
        ) : settings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Settings className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Settings Found</h3>
              <p className="text-gray-500 text-sm">
                Run the migration to seed default portal settings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedCategories.map((category) => {
              const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;
              const Icon = config.icon;
              const categorySettings = groupedSettings[category];
              const color = config.color;

              return (
                <Card key={category} className={cn('border-2', colorClasses[color])}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconColorClasses[color])}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{config.label}</h2>
                        <p className="text-sm text-gray-500 font-normal mt-0.5">
                          {categorySettings.length} setting{categorySettings.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categorySettings.map((setting) => {
                      const isEdited =
                        editedValues[setting.key] !== undefined &&
                        editedValues[setting.key] !== setting.value;
                      return (
                        <div
                          key={setting.id}
                          className={cn(
                            'p-4 rounded-lg border bg-white transition-all',
                            isEdited
                              ? 'border-amber-300 ring-1 ring-amber-200'
                              : 'border-gray-200'
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <label
                                htmlFor={`setting-${setting.key}`}
                                className="text-sm font-semibold text-gray-900"
                              >
                                {setting.label}
                              </label>
                              {setting.description && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {setting.description}
                                </p>
                              )}
                            </div>
                            {isEdited && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-amber-100 text-amber-700 border-amber-200"
                              >
                                Modified
                              </Badge>
                            )}
                          </div>
                          <Input
                            id={`setting-${setting.key}`}
                            value={getDisplayValue(setting)}
                            onChange={(e) =>
                              handleValueChange(setting.key, e.target.value)
                            }
                            placeholder={`Enter ${setting.label.toLowerCase()}`}
                            className="mt-1"
                          />
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400 font-mono">
                              key: {setting.key}
                            </span>
                            <span className="text-xs text-gray-400">
                              Updated {new Date(setting.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Success indicator */}
        {!loading && settings.length > 0 && !hasChanges && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700">
              All settings are saved and live in the Advisor Portal.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
