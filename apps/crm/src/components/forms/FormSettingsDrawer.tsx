import { useState } from 'react';
import { X } from 'lucide-react';
import type { FormSettings, FormStyling, FormEntityType } from '@mpbhealth/crm-core';

interface FormSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  name: string;
  description: string;
  slug: string;
  entityType: FormEntityType;
  settings: FormSettings;
  styling: FormStyling;
  onUpdateName: (name: string) => void;
  onUpdateDescription: (description: string) => void;
  onUpdateSlug: (slug: string) => void;
  onUpdateEntityType: (entityType: FormEntityType) => void;
  onUpdateSettings: (settings: FormSettings) => void;
  onUpdateStyling: (styling: FormStyling) => void;
}

type Tab = 'general' | 'submit' | 'notifications' | 'lead' | 'styling';

export function FormSettingsDrawer({
  open,
  onClose,
  name,
  description,
  slug,
  entityType,
  settings,
  styling,
  onUpdateName,
  onUpdateDescription,
  onUpdateSlug,
  onUpdateEntityType,
  onUpdateSettings,
  onUpdateStyling,
}: FormSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  if (!open) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'submit', label: 'After Submit' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'lead', label: 'Lead Settings' },
    { id: 'styling', label: 'Styling' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[480px] bg-surface-primary shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-primary border-b border-th-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-th-text-primary">Form Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-secondary">
            <X className="w-5 h-5 text-th-text-tertiary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-th-border px-6">
          <div className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-th-accent-600 text-th-accent-600'
                    : 'border-transparent text-th-text-tertiary hover:text-th-text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6 space-y-4">
          {activeTab === 'general' && (
            <>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Form Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => onUpdateName(e.target.value)}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => onUpdateDescription(e.target.value)}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  URL Slug
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-th-text-tertiary">/forms/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => onUpdateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="flex-1 border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Entity Type
                </label>
                <select
                  value={entityType}
                  onChange={(e) => onUpdateEntityType(e.target.value as FormEntityType)}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                >
                  <option value="lead">Lead</option>
                  <option value="contact">Contact</option>
                  <option value="quote_request">Quote Request</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'submit' && (
            <>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Redirect URL (optional)
                </label>
                <input
                  type="url"
                  value={settings.redirectUrl || ''}
                  onChange={(e) => onUpdateSettings({ ...settings, redirectUrl: e.target.value || undefined })}
                  placeholder="https://example.com/thank-you"
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
                <p className="text-xs text-th-text-tertiary mt-1">
                  Leave empty to show a success message instead
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Success Message
                </label>
                <textarea
                  value={styling.successMessage || ''}
                  onChange={(e) => onUpdateStyling({ ...styling, successMessage: e.target.value })}
                  placeholder="Thank you! Your submission has been received."
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  rows={3}
                />
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Notification Email
                </label>
                <input
                  type="email"
                  value={settings.notificationEmail || ''}
                  onChange={(e) => onUpdateSettings({ ...settings, notificationEmail: e.target.value || undefined })}
                  placeholder="notify@yourcompany.com"
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
                <p className="text-xs text-th-text-tertiary mt-1">
                  Receive an email each time someone submits this form
                </p>
              </div>

              <div className="border-t border-th-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-th-text-secondary">Auto-Response Email</label>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, autoResponseEnabled: !settings.autoResponseEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.autoResponseEnabled ? 'bg-th-accent-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.autoResponseEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {settings.autoResponseEnabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-th-text-secondary mb-1">Subject</label>
                      <input
                        type="text"
                        value={settings.autoResponseSubject || ''}
                        onChange={(e) => onUpdateSettings({ ...settings, autoResponseSubject: e.target.value })}
                        placeholder="Thanks for reaching out!"
                        className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-th-text-secondary mb-1">Body (HTML)</label>
                      <textarea
                        value={settings.autoResponseBody || ''}
                        onChange={(e) => onUpdateSettings({ ...settings, autoResponseBody: e.target.value })}
                        placeholder="<p>Thank you for your interest! We'll be in touch soon.</p>"
                        className="w-full border border-th-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                        rows={5}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'lead' && (
            <>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Auto-Assign To (User ID)
                </label>
                <input
                  type="text"
                  value={settings.assignTo || ''}
                  onChange={(e) => onUpdateSettings({ ...settings, assignTo: e.target.value || undefined })}
                  placeholder="User ID to assign leads to"
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={(settings.tags || []).join(', ')}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="web-form, inbound"
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Duplicate Handling
                </label>
                <select
                  value={settings.duplicateHandling || 'create_new'}
                  onChange={(e) => onUpdateSettings({ ...settings, duplicateHandling: e.target.value as any })}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                >
                  <option value="create_new">Create New Record</option>
                  <option value="update">Update Existing</option>
                  <option value="skip">Skip Duplicate</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'styling' && (
            <>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={styling.primaryColor || '#2563eb'}
                    onChange={(e) => onUpdateStyling({ ...styling, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded border border-th-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styling.primaryColor || '#2563eb'}
                    onChange={(e) => onUpdateStyling({ ...styling, primaryColor: e.target.value })}
                    className="flex-1 border border-th-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Button Text
                </label>
                <input
                  type="text"
                  value={styling.buttonText || ''}
                  onChange={(e) => onUpdateStyling({ ...styling, buttonText: e.target.value })}
                  placeholder="Submit"
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Form Header
                </label>
                <input
                  type="text"
                  value={styling.headerText || ''}
                  onChange={(e) => onUpdateStyling({ ...styling, headerText: e.target.value })}
                  placeholder="Contact Us"
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Form Description
                </label>
                <textarea
                  value={styling.descriptionText || ''}
                  onChange={(e) => onUpdateStyling({ ...styling, descriptionText: e.target.value })}
                  placeholder="Fill out the form below and we'll get back to you."
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={styling.logoUrl || ''}
                  onChange={(e) => onUpdateStyling({ ...styling, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
