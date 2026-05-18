// ============================================================================
// Notification Preferences Page — Configure notification settings
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Monitor,
  Clock,
  Volume2,
  Moon,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@mpbhealth/ui';
import { useNotificationSettings } from '../../hooks/useSettings';
import type { UpdateNotificationSettingsInput } from '@mpbhealth/champion-core';
import PushNotificationOptIn from '../../components/notifications/PushNotificationOptIn';
import { useAdvisorPageDebugLog } from '../../hooks/useAdvisorPageDebugLog';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

function ToggleSwitch({ enabled, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:ring-offset-2 ${
        enabled ? 'bg-th-accent-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

interface NotificationOptionProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  indent?: boolean;
}

function NotificationOption({
  label,
  description,
  enabled,
  onChange,
  disabled,
  indent,
}: NotificationOptionProps) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${
        indent ? 'pl-6 border-l-2 border-th-border-primary ml-2' : ''
      }`}
    >
      <div>
        <p className={`font-medium ${indent ? 'text-sm' : ''} text-th-text-primary`}>{label}</p>
        {description && <p className="text-sm text-th-text-secondary mt-0.5">{description}</p>}
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export default function NotificationPreferences() {
  useAdvisorPageDebugLog('NotificationPreferences');
  const { settings, loading, error, saving, updateSettings, refresh } = useNotificationSettings();
  const [formData, setFormData] = useState<UpdateNotificationSettingsInput>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  // Timeout: if loading takes > 8s, show retry UI
  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Initialize form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        email_enabled: settings.email_enabled,
        email_new_lead: settings.email_new_lead,
        email_new_message: settings.email_new_message,
        email_task_reminder: settings.email_task_reminder,
        email_compliance_alert: settings.email_compliance_alert,
        email_weekly_digest: settings.email_weekly_digest,
        email_marketing: settings.email_marketing,
        sms_enabled: settings.sms_enabled,
        sms_phone_number: settings.sms_phone_number || '',
        sms_urgent_only: settings.sms_urgent_only,
        push_enabled: settings.push_enabled,
        push_new_lead: settings.push_new_lead,
        push_new_message: settings.push_new_message,
        push_task_reminder: settings.push_task_reminder,
        push_chat_messages: settings.push_chat_messages,
        push_chat_mentions: settings.push_chat_mentions,
        push_ticket_updates: settings.push_ticket_updates,
        push_bulletins: settings.push_bulletins,
        in_app_enabled: settings.in_app_enabled,
        in_app_sound: settings.in_app_sound,
        in_app_desktop: settings.in_app_desktop,
        digest_frequency: settings.digest_frequency,
        digest_time: settings.digest_time,
        digest_day: settings.digest_day,
        quiet_hours_enabled: settings.quiet_hours_enabled,
        quiet_hours_start: settings.quiet_hours_start,
        quiet_hours_end: settings.quiet_hours_end,
      });
    }
  }, [settings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-th-accent-600 mx-auto" />
          {timedOut && (
            <div className="mt-4">
              <p className="text-sm text-th-text-secondary mb-3">Taking longer than expected...</p>
              <Button type="button" variant="primary" size="sm" onClick={refresh}>
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-th-text-secondary mb-4">{error}</p>
          <Button type="button" variant="primary" size="sm" onClick={refresh}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setFormError(null);
      await updateSettings(formData);
      setSuccessMessage('Notification preferences saved!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setFormError('Failed to save preferences. Please try again.');
    }
  };

  const updateField = <K extends keyof UpdateNotificationSettingsInput>(
    field: K,
    value: UpdateNotificationSettingsInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-th-text-primary">Notification Preferences</h1>
          <p className="text-th-text-secondary mt-1">
            Choose how and when you want to be notified
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

        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-th-text-primary">Email Notifications</h2>
                <p className="text-sm text-th-text-secondary">Receive notifications via email</p>
              </div>
              <div className="ml-auto">
                <ToggleSwitch
                  enabled={formData.email_enabled ?? false}
                  onChange={(v) => updateField('email_enabled', v)}
                />
              </div>
            </div>

            {formData.email_enabled && (
              <div className="border-t border-th-border-primary pt-4 space-y-1">
                <NotificationOption
                  label="New Lead Assigned"
                  description="When a new lead is assigned to you"
                  enabled={formData.email_new_lead ?? false}
                  onChange={(v) => updateField('email_new_lead', v)}
                  indent
                />
                <NotificationOption
                  label="New Messages"
                  description="When you receive a new message from a lead"
                  enabled={formData.email_new_message ?? false}
                  onChange={(v) => updateField('email_new_message', v)}
                  indent
                />
                <NotificationOption
                  label="Task Reminders"
                  description="Reminders for upcoming and overdue tasks"
                  enabled={formData.email_task_reminder ?? false}
                  onChange={(v) => updateField('email_task_reminder', v)}
                  indent
                />
                <NotificationOption
                  label="Compliance Alerts"
                  description="Important compliance-related notifications"
                  enabled={formData.email_compliance_alert ?? false}
                  onChange={(v) => updateField('email_compliance_alert', v)}
                  indent
                />
                <NotificationOption
                  label="Weekly Digest"
                  description="Weekly summary of your activity and performance"
                  enabled={formData.email_weekly_digest ?? false}
                  onChange={(v) => updateField('email_weekly_digest', v)}
                  indent
                />
                <NotificationOption
                  label="Product Updates"
                  description="News about new features and improvements"
                  enabled={formData.email_marketing ?? false}
                  onChange={(v) => updateField('email_marketing', v)}
                  indent
                />
              </div>
            )}
          </div>

          {/* SMS Notifications */}
          <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-th-text-primary">SMS Notifications</h2>
                <p className="text-sm text-th-text-secondary">Receive text messages for urgent updates</p>
              </div>
              <div className="ml-auto">
                <ToggleSwitch
                  enabled={formData.sms_enabled ?? false}
                  onChange={(v) => updateField('sms_enabled', v)}
                />
              </div>
            </div>

            {formData.sms_enabled && (
              <div className="border-t border-th-border-primary pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.sms_phone_number || ''}
                    onChange={(e) => updateField('sms_phone_number', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <NotificationOption
                  label="Urgent Only"
                  description="Only send SMS for high-priority notifications"
                  enabled={formData.sms_urgent_only ?? false}
                  onChange={(v) => updateField('sms_urgent_only', v)}
                />
              </div>
            )}
          </div>

          {/* Push Notifications */}
          <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-th-text-primary">Push Notifications</h2>
                <p className="text-sm text-th-text-secondary">Browser and mobile push notifications</p>
              </div>
              <div className="ml-auto">
                <ToggleSwitch
                  enabled={formData.push_enabled ?? false}
                  onChange={(v) => updateField('push_enabled', v)}
                />
              </div>
            </div>

            {formData.push_enabled && (
              <div className="border-t border-th-border-primary pt-4 space-y-1">
                {/* Device subscription opt-in */}
                <div className="mb-4">
                  <PushNotificationOptIn />
                </div>

                <div className="border-t border-th-border-primary pt-3 space-y-1">
                  <p className="text-xs font-medium text-th-text-muted uppercase tracking-wider mb-2 pl-6">
                    Notification types
                  </p>
                  <NotificationOption
                    label="Chat Messages"
                    description="New messages in your conversations"
                    enabled={formData.push_chat_messages ?? true}
                    onChange={(v) => updateField('push_chat_messages', v)}
                    indent
                  />
                  <NotificationOption
                    label="Chat Mentions"
                    description="When someone mentions you in a channel"
                    enabled={formData.push_chat_mentions ?? true}
                    onChange={(v) => updateField('push_chat_mentions', v)}
                    indent
                  />
                  <NotificationOption
                    label="Ticket Updates"
                    description="Status changes and replies on your tickets"
                    enabled={formData.push_ticket_updates ?? true}
                    onChange={(v) => updateField('push_ticket_updates', v)}
                    indent
                  />
                  <NotificationOption
                    label="Bulletins"
                    description="New bulletins and announcements"
                    enabled={formData.push_bulletins ?? true}
                    onChange={(v) => updateField('push_bulletins', v)}
                    indent
                  />
                  <NotificationOption
                    label="New Lead Assigned"
                    enabled={formData.push_new_lead ?? false}
                    onChange={(v) => updateField('push_new_lead', v)}
                    indent
                  />
                  <NotificationOption
                    label="New Messages"
                    enabled={formData.push_new_message ?? false}
                    onChange={(v) => updateField('push_new_message', v)}
                    indent
                  />
                  <NotificationOption
                    label="Task Reminders"
                    enabled={formData.push_task_reminder ?? false}
                    onChange={(v) => updateField('push_task_reminder', v)}
                    indent
                  />
                </div>
              </div>
            )}
          </div>

          {/* In-App Notifications */}
          <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-th-text-primary">In-App Notifications</h2>
                <p className="text-sm text-th-text-secondary">Notifications within the application</p>
              </div>
              <div className="ml-auto">
                <ToggleSwitch
                  enabled={formData.in_app_enabled ?? false}
                  onChange={(v) => updateField('in_app_enabled', v)}
                />
              </div>
            </div>

            {formData.in_app_enabled && (
              <div className="border-t border-th-border-primary pt-4 space-y-1">
                <NotificationOption
                  label="Sound"
                  description="Play a sound when notifications arrive"
                  enabled={formData.in_app_sound ?? false}
                  onChange={(v) => updateField('in_app_sound', v)}
                  indent
                />
                <NotificationOption
                  label="Desktop Notifications"
                  description="Show system notifications on desktop"
                  enabled={formData.in_app_desktop ?? false}
                  onChange={(v) => updateField('in_app_desktop', v)}
                  indent
                />
              </div>
            )}
          </div>

          {/* Digest Settings */}
          <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-th-text-primary">Digest Schedule</h2>
                <p className="text-sm text-th-text-secondary">When to receive notification digests</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Frequency
                </label>
                <select
                  value={formData.digest_frequency || 'daily'}
                  onChange={(e) =>
                    updateField('digest_frequency', e.target.value as 'realtime' | 'hourly' | 'daily' | 'weekly')
                  }
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                >
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Delivery Time
                </label>
                <input
                  type="time"
                  value={formData.digest_time || '09:00'}
                  onChange={(e) => updateField('digest_time', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                />
              </div>

              {formData.digest_frequency === 'weekly' && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                    Day of Week
                  </label>
                  <select
                    value={formData.digest_day || 1}
                    onChange={(e) => updateField('digest_day', parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="bg-surface-primary rounded-xl border border-th-border-primary p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Moon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-th-text-primary">Quiet Hours</h2>
                <p className="text-sm text-th-text-secondary">Pause notifications during specific hours</p>
              </div>
              <div className="ml-auto">
                <ToggleSwitch
                  enabled={formData.quiet_hours_enabled ?? false}
                  onChange={(v) => updateField('quiet_hours_enabled', v)}
                />
              </div>
            </div>

            {formData.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-4 border-t border-th-border-primary pt-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.quiet_hours_start || '22:00'}
                    onChange={(e) => updateField('quiet_hours_start', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.quiet_hours_end || '08:00'}
                    onChange={(e) => updateField('quiet_hours_end', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
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
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
