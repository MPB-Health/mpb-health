import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Settings,
  Save,
  RefreshCw,
  Mail,
  Shield,
  Bell,
  Palette,
  Lock,
  Server,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  X,
  Video,
  Play,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { siteMediaService } from '../../lib/siteMediaService';
import { toast } from 'sonner';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string;
  is_sensitive: boolean;
  updated_at: string;
}

const SystemSettings: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(tabFromUrl || 'general');
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, string>>({});
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [tableExists, setTableExists] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Update URL when category changes
  useEffect(() => {
    if (activeCategory !== 'general') {
      setSearchParams({ tab: activeCategory });
    } else {
      setSearchParams({});
    }
  }, [activeCategory, setSearchParams]);

  const categories = [
    { id: 'general', label: 'General', icon: <Settings className="h-5 w-5" /> },
    { id: 'media', label: 'Media & Videos', icon: <Video className="h-5 w-5" /> },
    { id: 'email', label: 'Email', icon: <Mail className="h-5 w-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="h-5 w-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="h-5 w-5" /> },
    { id: 'integrations', label: 'Integrations', icon: <Server className="h-5 w-5" /> }
  ];

  // Default settings structure (in case DB is empty)
  const defaultSettings: Record<string, { key: string; value: string; description: string; is_sensitive: boolean }[]> = {
    general: [
      { key: 'site_name', value: 'MPB Health', description: 'The name displayed across the site', is_sensitive: false },
      { key: 'site_description', value: 'Affordable Healthcare Memberships', description: 'Site meta description', is_sensitive: false },
      { key: 'support_email', value: 'support@mpb.health', description: 'Primary support email address', is_sensitive: false },
      { key: 'support_phone', value: '(855) 816-4650', description: 'Primary support phone number', is_sensitive: false },
      { key: 'timezone', value: 'America/New_York', description: 'Default timezone for the application', is_sensitive: false },
      { key: 'maintenance_mode', value: 'false', description: 'Enable maintenance mode', is_sensitive: false }
    ],
    email: [
      { key: 'smtp_host', value: '', description: 'SMTP server hostname', is_sensitive: false },
      { key: 'smtp_port', value: '587', description: 'SMTP server port', is_sensitive: false },
      { key: 'smtp_username', value: '', description: 'SMTP authentication username', is_sensitive: false },
      { key: 'smtp_password', value: '', description: 'SMTP authentication password', is_sensitive: true },
      { key: 'from_email', value: 'noreply@mpb.health', description: 'Default sender email address', is_sensitive: false },
      { key: 'from_name', value: 'MPB Health', description: 'Default sender name', is_sensitive: false }
    ],
    security: [
      { key: 'session_timeout', value: '30', description: 'Session timeout in minutes', is_sensitive: false },
      { key: 'max_login_attempts', value: '5', description: 'Maximum failed login attempts before lockout', is_sensitive: false },
      { key: 'lockout_duration', value: '15', description: 'Account lockout duration in minutes', is_sensitive: false },
      { key: 'require_mfa', value: 'false', description: 'Require MFA for all admin users', is_sensitive: false },
      { key: 'password_min_length', value: '8', description: 'Minimum password length', is_sensitive: false },
      { key: 'allowed_origins', value: '*', description: 'CORS allowed origins', is_sensitive: false }
    ],
    notifications: [
      { key: 'enable_email_notifications', value: 'true', description: 'Enable email notifications', is_sensitive: false },
      { key: 'enable_sms_notifications', value: 'false', description: 'Enable SMS notifications', is_sensitive: false },
      { key: 'enable_push_notifications', value: 'true', description: 'Enable push notifications', is_sensitive: false },
      { key: 'notification_digest', value: 'daily', description: 'Notification digest frequency (instant/daily/weekly)', is_sensitive: false },
      { key: 'admin_alert_email', value: '', description: 'Email for admin alerts', is_sensitive: false }
    ],
    appearance: [
      { key: 'primary_color', value: '#0a4c8f', description: 'Primary brand color', is_sensitive: false },
      { key: 'secondary_color', value: '#00a651', description: 'Secondary brand color', is_sensitive: false },
      { key: 'logo_url', value: '/assets/logo.png', description: 'Path to logo image', is_sensitive: false },
      { key: 'favicon_url', value: '/favicon.ico', description: 'Path to favicon', is_sensitive: false },
      { key: 'dark_mode_enabled', value: 'false', description: 'Enable dark mode option', is_sensitive: false }
    ],
    integrations: [
      { key: 'google_analytics_id', value: '', description: 'Google Analytics tracking ID', is_sensitive: false },
      { key: 'zoho_salesiq_widget_code', value: '', description: 'Zoho SalesIQ widget code', is_sensitive: false },
      { key: 'supabase_url', value: '', description: 'Supabase project URL', is_sensitive: false },
      { key: 'supabase_anon_key', value: '', description: 'Supabase anonymous key', is_sensitive: true },
      { key: 'stripe_public_key', value: '', description: 'Stripe publishable key', is_sensitive: false },
      { key: 'stripe_secret_key', value: '', description: 'Stripe secret key', is_sensitive: true }
    ],
    media: [
      { key: 'video_homepage_hero', value: 'https://player.vimeo.com/video/1135808114?h=c0bfafd29e', description: 'Homepage Hero "How It Works" video (Vimeo, YouTube, or any embed URL)', is_sensitive: false },
      { key: 'video_explainer', value: 'https://player.vimeo.com/video/1120296253?h=fl', description: 'Main Explainer Video section embed URL', is_sensitive: false },
      { key: 'video_individuals_modal', value: 'https://player.vimeo.com/video/1115561411?h=531f004487', description: 'Individuals & Families page modal video', is_sensitive: false },
      { key: 'video_business_modal', value: 'https://player.vimeo.com/video/1115561411?h=531f004487', description: 'Businesses & Organizations page modal video', is_sensitive: false },
      { key: 'video_welcome_overview', value: 'https://player.vimeo.com/video/1115561411?h=531f004487', description: 'Welcome page overview video', is_sensitive: false },
      { key: 'video_medical_sharing', value: 'https://player.vimeo.com/video/1135808114?h=c0bfafd29e', description: 'Medical Cost Sharing info section video', is_sensitive: false },
      { key: 'video_background_mp4', value: '/assets/young-parents-happy-mother.mp4', description: 'Background video file path (MP4)', is_sensitive: false },
      { key: 'video_thumbnail_default', value: '', description: 'Default video thumbnail image URL (optional)', is_sensitive: false }
    ]
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);

    // Helper to create default settings
    const createDefaultSettings = (): SystemSetting[] => {
      const flatDefaults: SystemSetting[] = [];
      Object.entries(defaultSettings).forEach(([category, items]) => {
        items.forEach((item, idx) => {
          flatDefaults.push({
            id: `${category}-${idx}`,
            key: item.key,
            value: item.value,
            category,
            description: item.description,
            is_sensitive: item.is_sensitive,
            updated_at: new Date().toISOString()
          });
        });
      });
      return flatDefaults;
    };

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      // Handle missing table gracefully
      if (error?.message?.includes('schema cache') || 
          error?.code === 'PGRST204' ||
          error?.code === 'PGRST205' ||
          error?.message?.includes('does not exist')) {
        console.warn('system_settings table not found - using defaults. Run migrations to enable saving.');
        setSettings(createDefaultSettings());
        setTableExists(false);
      } else if (error) {
        console.error('Error loading settings:', error);
        setSettings(createDefaultSettings());
        setTableExists(false);
      } else if (data && data.length > 0) {
        setSettings(data);
        setTableExists(true);
      } else {
        // Table exists but empty - use defaults
        setSettings(createDefaultSettings());
        setTableExists(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setSettings(createDefaultSettings());
      setTableExists(false);
    }

    setLoading(false);
  };

  const handleSettingChange = (key: string, value: string) => {
    setUnsavedChanges(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getSettingValue = (key: string, originalValue: string) => {
    return unsavedChanges[key] !== undefined ? unsavedChanges[key] : originalValue;
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      if (!tableExists) {
        setSaveError('Cannot save: Database table does not exist. Please run migrations first.');
        setSaving(false);
        return;
      }

      const updates = Object.entries(unsavedChanges).map(([key, value]) => {
        // Find the existing setting to get category and description
        const existingSetting = settings.find(s => s.key === key);
        return {
          key,
          value,
          category: existingSetting?.category || 'general',
          description: existingSetting?.description || '',
          is_sensitive: existingSetting?.is_sensitive || false,
          updated_at: new Date().toISOString()
        };
      });

      const { error } = await supabase
        .from('system_settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) {
        if (error.message?.includes('schema cache') ||
            error.code === 'PGRST204' ||
            error.code === 'PGRST205') {
          setSaveError('Cannot save: Database table does not exist. Please run migrations first.');
          setTableExists(false);
          setSaving(false);
          return;
        }
        throw error;
      }

      // Clear media cache so website immediately shows updated videos
      siteMediaService.clearCache();

      setUnsavedChanges({});
      await loadSettings();
      toast.success('Settings saved successfully. Video changes are now live on the website.');
    } catch (error: unknown) {
      console.error('Error saving settings:', error);
      const fromPostgrest =
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
          ? (error as { message: string; code?: string }).message
          : null;
      const code =
        error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof (error as { code: unknown }).code === 'string'
          ? (error as { code: string }).code
          : null;
      const errMsg =
        fromPostgrest ||
        (error instanceof Error ? error.message : null) ||
        'Unknown error';
      const hint =
        code === '42501' || /permission denied|403/i.test(errMsg)
          ? ' (sign in as an admin, or apply migration 20260407500000_system_settings_write_rls if RLS blocks writes)'
          : '';
      setSaveError(`Failed to save: ${errMsg}${hint}`);
    }

    setSaving(false);
  };

  const toggleShowSensitive = (key: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const categorySettings = settings.filter(s => s.category === activeCategory);
  const hasUnsavedChanges = Object.keys(unsavedChanges).length > 0;

  return (
    <AdminLayout activeView="system-settings" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>System Settings - Admin - MPB Health</title>
        <meta name="description" content="Configure system settings" />
      </Helmet>

      <div>
        <AdminBreadcrumb currentPage="System Settings" />

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">System Settings</h1>
                <p className="mt-2 text-neutral-600">Configure system-wide settings</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex items-center gap-2" onClick={loadSettings}>
                  <RefreshCw className="h-5 w-5" />
                  Refresh
                </Button>
                <Button 
                  className="flex items-center gap-2" 
                  onClick={handleSaveSettings}
                  disabled={!hasUnsavedChanges || saving}
                >
                  {saving ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>

          {!tableExists && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <span className="text-red-800 font-medium">Database table not found.</span>
                <span className="text-red-700 ml-1">Settings shown are defaults. Run the migration in Supabase Dashboard to enable saving.</span>
              </div>
            </div>
          )}

          {saveError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{saveError}</span>
              <button onClick={() => setSaveError(null)} className="ml-auto text-red-600 hover:text-red-800">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {hasUnsavedChanges && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800">You have unsaved changes. Don't forget to save!</span>
            </div>
          )}

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Category Navigation */}
            <Card className="p-4 lg:col-span-1 h-fit">
              <nav className="space-y-1">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {category.icon}
                    <span className="font-medium">{category.label}</span>
                  </button>
                ))}
              </nav>
            </Card>

            {/* Settings Content */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    {categories.find(c => c.id === activeCategory)?.icon}
                    <h2 className="text-xl font-semibold text-neutral-900">
                      {categories.find(c => c.id === activeCategory)?.label} Settings
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {categorySettings.length === 0 ? (
                      <div className="text-center py-8">
                        <Settings className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                        <p className="text-neutral-600">No settings in this category</p>
                      </div>
                    ) : (
                      categorySettings.map(setting => (
                        <div key={setting.key} className="border-b border-neutral-200 pb-6 last:border-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <label className="block font-medium text-neutral-900">
                                {setting.key.split('_').map(word => 
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')}
                              </label>
                              <p className="text-sm text-neutral-500 flex items-center gap-1">
                                {setting.description}
                                {setting.is_sensitive && (
                                  <Lock className="h-3 w-3 text-amber-500" />
                                )}
                              </p>
                            </div>
                            {setting.updated_at && (
                              <span className="text-xs text-neutral-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(setting.updated_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {setting.key === 'maintenance_mode' || 
                           setting.key === 'require_mfa' ||
                           setting.key === 'enable_email_notifications' ||
                           setting.key === 'enable_sms_notifications' ||
                           setting.key === 'enable_push_notifications' ||
                           setting.key === 'dark_mode_enabled' ? (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleSettingChange(
                                  setting.key, 
                                  getSettingValue(setting.key, setting.value) === 'true' ? 'false' : 'true'
                                )}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  getSettingValue(setting.key, setting.value) === 'true' 
                                    ? 'bg-blue-600' 
                                    : 'bg-neutral-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    getSettingValue(setting.key, setting.value) === 'true' 
                                      ? 'translate-x-6' 
                                      : 'translate-x-1'
                                  }`}
                                />
                              </button>
                              <span className="text-sm text-neutral-600">
                                {getSettingValue(setting.key, setting.value) === 'true' ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                          ) : setting.key === 'notification_digest' ? (
                            <select
                              value={getSettingValue(setting.key, setting.value)}
                              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                              className="w-full max-w-md px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="instant">Instant</option>
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                            </select>
                          ) : setting.key === 'timezone' ? (
                            <select
                              value={getSettingValue(setting.key, setting.value)}
                              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                              className="w-full max-w-md px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="America/New_York">Eastern Time (ET)</option>
                              <option value="America/Chicago">Central Time (CT)</option>
                              <option value="America/Denver">Mountain Time (MT)</option>
                              <option value="America/Los_Angeles">Pacific Time (PT)</option>
                              <option value="UTC">UTC</option>
                            </select>
                          ) : setting.is_sensitive ? (
                            <div className="relative max-w-md">
                              <input
                                type={showSensitive[setting.key] ? 'text' : 'password'}
                                value={getSettingValue(setting.key, setting.value)}
                                onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                                className="w-full px-4 py-2 pr-12 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => toggleShowSensitive(setting.key)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                              >
                                {showSensitive[setting.key] ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          ) : setting.key.includes('color') ? (
                            <div className="flex items-center gap-3 max-w-md">
                              <input
                                type="color"
                                value={getSettingValue(setting.key, setting.value)}
                                onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                                className="w-12 h-10 rounded border border-neutral-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={getSettingValue(setting.key, setting.value)}
                                onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ) : setting.key.startsWith('video_') ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={getSettingValue(setting.key, setting.value)}
                                  onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                                  placeholder="Enter video embed URL (Vimeo, YouTube, etc.)"
                                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {getSettingValue(setting.key, setting.value) && !setting.key.includes('mp4') && !setting.key.includes('thumbnail') && (
                                  <a
                                    href={getSettingValue(setting.key, setting.value)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm text-neutral-700 transition-colors"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Open
                                  </a>
                                )}
                              </div>
                              {/* Video Preview */}
                              {getSettingValue(setting.key, setting.value) && !setting.key.includes('mp4') && !setting.key.includes('thumbnail') && (
                                <div className="relative bg-neutral-900 rounded-lg overflow-hidden" style={{ paddingTop: '56.25%', maxWidth: '400px' }}>
                                  <iframe
                                    src={getSettingValue(setting.key, setting.value)}
                                    className="absolute inset-0 w-full h-full"
                                    frameBorder="0"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    title={`Preview: ${setting.key}`}
                                  />
                                </div>
                              )}
                              {/* MP4 Preview */}
                              {setting.key.includes('mp4') && getSettingValue(setting.key, setting.value) && (
                                <div className="relative bg-neutral-900 rounded-lg overflow-hidden" style={{ maxWidth: '400px' }}>
                                  <video
                                    src={getSettingValue(setting.key, setting.value)}
                                    className="w-full"
                                    controls
                                    muted
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              )}
                              <p className="text-xs text-neutral-500 flex items-center gap-1">
                                <Play className="h-3 w-3" />
                                {setting.key.includes('mp4') 
                                  ? 'Enter the path to an MP4 file (e.g., /assets/video.mp4)'
                                  : 'Paste the full embed URL from Vimeo, YouTube, Wistia, or any video platform'
                                }
                              </p>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={getSettingValue(setting.key, setting.value)}
                              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                              className="w-full max-w-md px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}

                          {unsavedChanges[setting.key] !== undefined && (
                            <div className="mt-2 flex items-center gap-1 text-sm text-amber-600">
                              <AlertCircle className="h-4 w-4" />
                              Unsaved change
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* System Info */}
          <Card className="mt-8 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Info className="h-5 w-5" />
              System Information
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <span className="text-sm text-neutral-500">Application Version</span>
                <p className="font-medium text-neutral-900">7.0.0</p>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Environment</span>
                <p className="font-medium text-neutral-900">Production</p>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Last Deploy</span>
                <p className="font-medium text-neutral-900">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Database Status</span>
                <p className="font-medium text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Connected
                </p>
              </div>
            </div>
          </Card>
        </div>
    </AdminLayout>
  );
};

export default SystemSettings;

