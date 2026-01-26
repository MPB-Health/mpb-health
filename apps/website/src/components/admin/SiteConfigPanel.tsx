import React, { useEffect, useState } from 'react';
import { Settings, Globe, Mail, Shield } from 'lucide-react';
import { Card } from '../ui/Card';
import { adminAnalyticsService, SiteSetting } from '../../lib/adminAnalyticsService';
import { useAuth } from '../../contexts/AuthContext';

export const SiteConfigPanel: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await adminAnalyticsService.getSiteSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    if (!user?.id) return;

    try {
      await adminAnalyticsService.updateSiteSetting(key, value, user.id);
      setSettings(settings.map(s => s.key === key ? { ...s, value } : s));
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Failed to update setting');
    }
  };

  const categories = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'social', label: 'Social Media', icon: Globe },
    { id: 'features', label: 'Features', icon: Shield }
  ];

  const getSettingsByCategory = (category: string) => {
    return settings.filter(s => s.category === category);
  };

  const parseValue = (value: any) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  };

  const renderSettingInput = (setting: SiteSetting) => {
    const value = parseValue(setting.value);

    if (typeof value === 'boolean') {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updateSetting(setting.key, e.target.checked)}
            className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-neutral-700">{setting.description}</span>
        </label>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div className="space-y-2">
          {Object.keys(value).map(key => (
            <div key={key}>
              <label className="block text-xs text-neutral-600 mb-1 capitalize">
                {key.replace('_', ' ')}
              </label>
              <input
                type="text"
                value={value[key] || ''}
                onChange={(e) => {
                  const newValue = { ...value, [key]: e.target.value };
                  updateSetting(setting.key, newValue);
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => updateSetting(setting.key, e.target.value)}
        placeholder={setting.description}
        className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-neutral-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Site Configuration</h2>
        <p className="text-neutral-600">Manage global site settings and preferences</p>
      </div>

      <div className="flex gap-2 border-b border-neutral-200">
        {categories.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-3 border-b-2 transition-colors inline-flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4">
        {getSettingsByCategory(activeCategory).map(setting => (
          <Card key={setting.id} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-neutral-900 mb-1">
                {setting.key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </label>
              {setting.description && (
                <p className="text-xs text-neutral-500">{setting.description}</p>
              )}
            </div>
            {renderSettingInput(setting)}
          </Card>
        ))}
      </div>

      {getSettingsByCategory(activeCategory).length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-neutral-600">No settings found in this category</p>
        </Card>
      )}
    </div>
  );
};
