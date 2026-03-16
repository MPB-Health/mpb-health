// ============================================================================
// Organization Settings Page — Configure organization-wide settings
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Building2,
  Palette,
  Clock,
  Mail,
  Shield,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@mpbhealth/ui';
import { useOrgSettings } from '../../hooks/useSettings';
import type { BusinessHours, BusinessAddress, UpdateOrgSettingsInput } from '@mpbhealth/champion-core';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (AZ)' },
  { value: 'America/Anchorage', label: 'Alaska (AK)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HI)' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_BUSINESS_HOURS: BusinessHours[] = DAYS.map((_, i) => ({
  day: i,
  enabled: i >= 1 && i <= 5, // Mon-Fri enabled
  start: '09:00',
  end: '17:00',
}));

/** Sanitize hex color for safe use in CSS (prevents injection) */
function sanitizeHexColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const hex = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  const match = value.match(hex);
  return match ? (value.startsWith('#') ? value : `#${match[1]}`) : fallback;
}

export default function OrganizationSettings() {
  const { settings, loading, error, saving, updateSettings } = useOrgSettings();
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'hours' | 'messaging' | 'compliance'>('general');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpdateOrgSettingsInput>({});

  // Initialize form when settings load
  const initializeForm = () => {
    if (settings) {
      setFormData({
        business_name: settings.business_name || '',
        business_phone: settings.business_phone || '',
        business_email: settings.business_email || '',
        business_address: settings.business_address || {},
        website_url: settings.website_url || '',
        default_timezone: settings.default_timezone,
        default_language: settings.default_language,
        date_format: settings.date_format,
        time_format: settings.time_format,
        currency: settings.currency,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        business_hours: settings.business_hours?.length ? settings.business_hours : DEFAULT_BUSINESS_HOURS,
        default_email_from_name: settings.default_email_from_name || '',
        default_email_from_address: settings.default_email_from_address || '',
        email_signature: settings.email_signature || '',
        require_message_approval: settings.require_message_approval,
        message_disclaimer: settings.message_disclaimer || '',
        hipaa_mode: settings.hipaa_mode,
      });
    }
  };

  // Reset form when settings load
  useEffect(() => {
    initializeForm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-th-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setFormError(null);
      await updateSettings(formData);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setFormError('Failed to save settings. Please try again.');
    }
  };

  const updateFormField = <K extends keyof UpdateOrgSettingsInput>(
    field: K,
    value: UpdateOrgSettingsInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateAddress = (field: keyof BusinessAddress, value: string) => {
    setFormData((prev) => ({
      ...prev,
      business_address: { ...prev.business_address, [field]: value },
    }));
  };

  const updateBusinessHours = (dayIndex: number, field: keyof BusinessHours, value: unknown) => {
    const hours = [...(formData.business_hours || DEFAULT_BUSINESS_HOURS)];
    hours[dayIndex] = { ...hours[dayIndex], [field]: value };
    setFormData((prev) => ({ ...prev, business_hours: hours }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'hours', label: 'Business Hours', icon: Clock },
    { id: 'messaging', label: 'Messaging', icon: Mail },
    { id: 'compliance', label: 'Compliance', icon: Shield },
  ] as const;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-th-text-primary">Organization Settings</h1>
          <p className="text-th-text-secondary mt-1">
            Configure your organization&apos;s profile, branding, and business rules
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}
        {formError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{formError}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-th-border-primary">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-th-accent-600 text-th-accent-600'
                  : 'border-transparent text-th-text-secondary hover:text-th-text-primary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-th-text-primary mb-4">Business Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.business_name || ''}
                      onChange={(e) => updateFormField('business_name', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website_url || ''}
                      onChange={(e) => updateFormField('website_url', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.business_phone || ''}
                      onChange={(e) => updateFormField('business_phone', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.business_email || ''}
                      onChange={(e) => updateFormField('business_email', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-th-text-secondary mb-3">Business Address</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={formData.business_address?.line1 || ''}
                      onChange={(e) => updateAddress('line1', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                      placeholder="Street Address"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={formData.business_address?.line2 || ''}
                      onChange={(e) => updateAddress('line2', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                      placeholder="Suite, Unit, etc. (optional)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.business_address?.city || ''}
                      onChange={(e) => updateAddress('city', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                      placeholder="City"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={formData.business_address?.state || ''}
                      onChange={(e) => updateAddress('state', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                      placeholder="State"
                    />
                    <input
                      type="text"
                      value={formData.business_address?.postal_code || ''}
                      onChange={(e) => updateAddress('postal_code', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                      placeholder="ZIP"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-th-text-primary mb-4">Regional Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="default-timezone" className="block text-sm font-medium text-th-text-secondary mb-1.5">
                      Default Timezone
                    </label>
                    <select
                      id="default-timezone"
                      aria-label="Default timezone"
                      value={formData.default_timezone || 'America/New_York'}
                      onChange={(e) => updateFormField('default_timezone', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="time-format" className="block text-sm font-medium text-th-text-secondary mb-1.5">
                      Time Format
                    </label>
                    <select
                      id="time-format"
                      aria-label="Time format"
                      value={formData.time_format || '12h'}
                      onChange={(e) => updateFormField('time_format', e.target.value as '12h' | '24h')}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                    >
                      <option value="12h">12-hour (1:30 PM)</option>
                      <option value="24h">24-hour (13:30)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="date-format" className="block text-sm font-medium text-th-text-secondary mb-1.5">
                      Date Format
                    </label>
                    <select
                      id="date-format"
                      aria-label="Date format"
                      value={formData.date_format || 'MM/DD/YYYY'}
                      onChange={(e) => updateFormField('date_format', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-th-text-secondary mb-1.5">
                      Currency
                    </label>
                    <select
                      id="currency"
                      aria-label="Currency"
                      value={formData.currency || 'USD'}
                      onChange={(e) => updateFormField('currency', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-th-text-primary mb-4">Brand Colors</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="primary-color-picker" className="block text-sm font-medium text-th-text-secondary mb-1.5">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="primary-color-picker"
                        type="color"
                        aria-label="Primary color picker"
                        value={formData.primary_color || '#4F46E5'}
                        onChange={(e) => updateFormField('primary_color', e.target.value)}
                        className="w-12 h-10 rounded border border-th-border-primary cursor-pointer"
                      />
                      <input
                        id="primary-color-hex"
                        type="text"
                        aria-label="Primary color hex value"
                        value={formData.primary_color || '#4F46E5'}
                        onChange={(e) => updateFormField('primary_color', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent font-mono"
                        placeholder="#4F46E5"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="secondary-color-picker" className="block text-sm font-medium text-th-text-secondary mb-1.5">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="secondary-color-picker"
                        type="color"
                        aria-label="Secondary color picker"
                        value={formData.secondary_color || '#818CF8'}
                        onChange={(e) => updateFormField('secondary_color', e.target.value)}
                        className="w-12 h-10 rounded border border-th-border-primary cursor-pointer"
                      />
                      <input
                        id="secondary-color-hex"
                        type="text"
                        aria-label="Secondary color hex value"
                        value={formData.secondary_color || '#818CF8'}
                        onChange={(e) => updateFormField('secondary_color', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent font-mono"
                        placeholder="#818CF8"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-th-text-primary mb-4">Logo</h3>
                <div className="border-2 border-dashed border-th-border-primary rounded-lg p-8 text-center">
                  {settings?.logo_url ? (
                    <div className="space-y-4">
                      <img
                        src={settings.logo_url}
                        alt="Organization logo"
                        className="h-16 mx-auto object-contain"
                      />
                      <button type="button" className="text-sm text-th-accent-600 hover:text-th-accent-700">
                        Change logo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-16 h-16 bg-surface-tertiary rounded-lg mx-auto flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-th-text-muted" />
                      </div>
                      <p className="text-sm text-th-text-secondary">
                        Drop your logo here or click to upload
                      </p>
                      <p className="text-xs text-th-text-muted">PNG, JPG up to 2MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-th-text-primary mb-4">Preview</h3>
                <style
                  dangerouslySetInnerHTML={{
                    __html: `.brand-preview-dynamic { --brand-preview-bg: ${sanitizeHexColor(formData.primary_color, '#4F46E5')}; --brand-preview-btn: ${sanitizeHexColor(formData.secondary_color, '#818CF8')}; }`,
                  }}
                />
                <div className="p-6 rounded-lg brand-preview-bg brand-preview-dynamic">
                  <p className="text-white font-medium">
                    {formData.business_name || 'Your Business Name'}
                  </p>
                  <button
                    type="button"
                    className="mt-3 px-4 py-2 rounded-lg text-sm font-medium brand-preview-btn"
                  >
                    Sample Button
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Business Hours Tab */}
          {activeTab === 'hours' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-th-text-primary mb-4">Business Hours</h3>
                <p className="text-sm text-th-text-secondary mb-6">
                  Set your standard operating hours. These are used for scheduling and availability.
                </p>

                <div className="space-y-3">
                  {(formData.business_hours || DEFAULT_BUSINESS_HOURS).map((hours, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 rounded-lg bg-surface-secondary"
                    >
                      <label className="flex items-center gap-2 w-32">
                        <input
                          type="checkbox"
                          checked={hours.enabled}
                          onChange={(e) => updateBusinessHours(index, 'enabled', e.target.checked)}
                          className="rounded border-th-border-primary text-th-accent-600 focus:ring-th-accent-500"
                        />
                        <span className="text-sm font-medium text-th-text-primary">
                          {DAYS[index]}
                        </span>
                      </label>

                      {hours.enabled ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            aria-label={`${DAYS[index]} start time`}
                            value={hours.start || '09:00'}
                            onChange={(e) => updateBusinessHours(index, 'start', e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-th-border-primary bg-surface-primary text-th-text-primary text-sm focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                          />
                          <span className="text-th-text-muted">to</span>
                          <input
                            type="time"
                            aria-label={`${DAYS[index]} end time`}
                            value={hours.end || '17:00'}
                            onChange={(e) => updateBusinessHours(index, 'end', e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-th-border-primary bg-surface-primary text-th-text-primary text-sm focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-th-text-muted">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messaging Tab */}
          {activeTab === 'messaging' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-th-text-primary mb-4">Email Defaults</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={formData.default_email_from_name || ''}
                      onChange={(e) => updateFormField('default_email_from_name', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                      placeholder="Your Company"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                      From Address
                    </label>
                    <input
                      type="email"
                      value={formData.default_email_from_address || ''}
                      onChange={(e) => updateFormField('default_email_from_address', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                      placeholder="noreply@yourcompany.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Email Signature
                </label>
                <textarea
                  value={formData.email_signature || ''}
                  onChange={(e) => updateFormField('email_signature', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  placeholder="Best regards,&#10;Your Company&#10;1-800-123-4567"
                />
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-th-text-primary mb-4">Message Compliance</h3>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-4 rounded-lg bg-surface-secondary cursor-pointer hover:bg-surface-tertiary transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.require_message_approval || false}
                      onChange={(e) => updateFormField('require_message_approval', e.target.checked)}
                      className="mt-0.5 rounded border-th-border-primary text-th-accent-600 focus:ring-th-accent-500"
                    />
                    <div>
                      <p className="font-medium text-th-text-primary">Require Message Approval</p>
                      <p className="text-sm text-th-text-secondary mt-0.5">
                        All outgoing messages must be approved by a supervisor before sending
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-lg bg-surface-secondary cursor-pointer hover:bg-surface-tertiary transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.hipaa_mode || false}
                      onChange={(e) => updateFormField('hipaa_mode', e.target.checked)}
                      className="mt-0.5 rounded border-th-border-primary text-th-accent-600 focus:ring-th-accent-500"
                    />
                    <div>
                      <p className="font-medium text-th-text-primary">HIPAA Compliance Mode</p>
                      <p className="text-sm text-th-text-secondary mt-0.5">
                        Enable additional security and audit features for healthcare compliance
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Message Disclaimer
                </label>
                <textarea
                  value={formData.message_disclaimer || ''}
                  onChange={(e) => updateFormField('message_disclaimer', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  placeholder="This message may contain confidential information..."
                />
                <p className="text-xs text-th-text-muted mt-1.5">
                  This disclaimer will be appended to all outgoing messages
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
