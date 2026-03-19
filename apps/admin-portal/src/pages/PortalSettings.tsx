import { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { portalSettingsAdminService, type PortalSetting } from '@mpbhealth/admin-core';

export default function PortalSettings() {
  const [settings, setSettings] = useState<PortalSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await portalSettingsAdminService.getAll();
      setSettings(data);
      // Populate edits map with current values
      const map: Record<string, string> = {};
      data.forEach((s) => { map[s.key] = s.value ?? ''; });
      setEdits(map);
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('Failed to load portal settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(key: string) {
    setSaving(key);
    try {
      await portalSettingsAdminService.set(key, edits[key] ?? '');
      toast.success(`Saved "${key}"`);
      load();
    } catch {
      toast.error('Failed to save setting');
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(key: string) {
    if (!confirm(`Delete the setting "${key}"?`)) return;
    try {
      await portalSettingsAdminService.delete(key);
      toast.success(`Deleted "${key}"`);
      load();
    } catch {
      toast.error('Failed to delete setting');
    }
  }

  async function handleAdd() {
    const key = newKey.trim();
    const value = newValue.trim();
    if (!key) { toast.error('Key is required'); return; }
    setAdding(true);
    try {
      await portalSettingsAdminService.set(key, value);
      toast.success(`Added "${key}"`);
      setNewKey('');
      setNewValue('');
      load();
    } catch {
      toast.error('Failed to add setting');
    } finally {
      setAdding(false);
    }
  }

  const isDirty = (key: string, current: string | null) =>
    edits[key] !== undefined && edits[key] !== (current ?? '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-th-text-primary">Portal Settings</h1>
        <p className="text-sm text-th-text-tertiary mt-1">Key-value configuration for the advisor portal</p>
      </div>

      {/* Add new setting */}
      <div className="bg-surface-primary border border-th-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-th-text-primary mb-4">Add Setting</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Setting key (e.g. welcome_message)"
            className="flex-1 px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm font-mono"
          />
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value"
            className="flex-1 px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !newKey.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Existing settings */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
          </div>
        ) : settings.length > 0 ? (
          <div className="divide-y divide-th-border-subtle">
            {settings.map((s) => (
              <div key={s.key} className="px-5 py-4 flex items-center gap-4">
                <div className="w-48 shrink-0">
                  <p className="text-sm font-mono font-medium text-th-text-primary truncate" title={s.key}>
                    {s.key}
                  </p>
                  <p className="text-xs text-th-text-tertiary mt-0.5">
                    Updated {new Date(s.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <input
                  type="text"
                  value={edits[s.key] ?? s.value ?? ''}
                  onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })}
                  className="flex-1 px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSave(s.key)}
                    disabled={!isDirty(s.key, s.value) || saving === s.key}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-40 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving === s.key ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.key)}
                    className="p-1.5 text-th-text-tertiary hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    aria-label={`Delete ${s.key}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Settings className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No settings configured yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
