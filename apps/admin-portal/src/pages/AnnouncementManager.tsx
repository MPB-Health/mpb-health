import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Bell,
  Loader2,
  X,
  Save,
  Info,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  announcementAdminService,
  type AdminAnnouncement,
  type AnnouncementCreateInput,
} from '@mpbhealth/admin-core';

const TYPE_CONFIG = {
  info: { icon: Info, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Info' },
  warning: { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Warning' },
  success: { icon: CheckCircle, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Success' },
  error: { icon: AlertCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Error' },
};

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Advisors' },
  { value: 'new_advisors', label: 'New Advisors Only' },
  { value: 'certified', label: 'Certified Advisors Only' },
];

const EMPTY_FORM: AnnouncementCreateInput = {
  title: '',
  content: '',
  type: 'info',
  start_date: new Date().toISOString().slice(0, 16),
  end_date: null,
  is_dismissible: true,
  is_active: true,
  target_audience: 'all',
  link_url: null,
  link_text: null,
};

export default function AnnouncementManager() {
  const [items, setItems] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, scheduled: 0 });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<AdminAnnouncement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AnnouncementCreateInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, statsData] = await Promise.all([
        announcementAdminService.getAll(),
        announcementAdminService.getStats(),
      ]);
      setItems(itemsData);
      setStats(statsData);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (item: AdminAnnouncement) => {
    try {
      await announcementAdminService.toggleActive(item.id);
      toast.success(item.is_active ? 'Announcement deactivated' : 'Announcement activated');
      loadData();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    setDeleting(id);
    try {
      await announcementAdminService.delete(id);
      toast.success('Deleted');
      loadData();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = (item: AdminAnnouncement) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      content: item.content,
      type: item.type,
      start_date: item.start_date ? item.start_date.slice(0, 16) : new Date().toISOString().slice(0, 16),
      end_date: item.end_date ? item.end_date.slice(0, 16) : null,
      is_dismissible: item.is_dismissible,
      is_active: item.is_active,
      target_audience: item.target_audience,
      link_url: item.link_url,
      link_text: item.link_text,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title?.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title!.trim(),
        start_date: form.start_date ? new Date(form.start_date).toISOString() : new Date().toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      };
      if (editingItem) {
        await announcementAdminService.update(editingItem.id, payload);
        toast.success('Updated!');
      } else {
        await announcementAdminService.create(payload as AnnouncementCreateInput);
        toast.success('Created!');
      }
      setShowModal(false);
      loadData();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const isCurrentlyActive = (a: AdminAnnouncement) => {
    if (!a.is_active) return false;
    const now = new Date().toISOString();
    return a.start_date <= now && (!a.end_date || a.end_date >= now);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Announcement Manager</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Create banners that appear at the top of the advisor portal dashboard
          </p>
        </div>
        <button type="button" onClick={openCreate} className="flex items-center space-x-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Active Now', value: stats.active, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
          { label: 'Scheduled', value: stats.scheduled, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${s.color}`}><Bell className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{s.value}</p>
              <p className="text-sm text-th-text-tertiary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-sm text-blue-800 dark:text-blue-300">
        Active announcements appear as banners at the top of the Advisor Portal dashboard in real time.
      </div>

      {/* List */}
      <div className="bg-surface-primary rounded-xl border border-th-border divide-y divide-th-border">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <h3 className="text-lg font-semibold text-th-text-primary mb-1">No announcements</h3>
            <p className="text-th-text-tertiary mb-6">Create your first announcement banner</p>
          </div>
        ) : (
          items.map((item) => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
            const TypeIcon = cfg.icon;
            const active = isCurrentlyActive(item);
            return (
              <div key={item.id} className={`flex items-center gap-4 p-4 group ${!item.is_active ? 'opacity-50' : ''}`}>
                <div className={`p-2 rounded-lg ${cfg.color}`}>
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-th-text-primary text-sm">{item.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                    {active && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Live
                      </span>
                    )}
                    {!item.is_active && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Inactive</span>
                    )}
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {AUDIENCE_OPTIONS.find((o) => o.value === item.target_audience)?.label || item.target_audience}
                    </span>
                    {item.link_url && <ExternalLink className="w-3 h-3 text-th-text-tertiary" />}
                  </div>
                  <p className="text-xs text-th-text-tertiary mt-0.5 truncate">
                    {item.content || 'No content'}
                    {item.end_date && ` | Expires: ${new Date(item.end_date).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => handleToggleActive(item)} title={item.is_active ? 'Deactivate' : 'Activate'} className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary transition-colors">
                    {item.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button type="button" onClick={() => openEdit(item)} title="Edit" className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} disabled={deleting === item.id} title="Delete" className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
                    {deleting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-th-border">
              <h3 className="text-lg font-semibold text-th-text-primary">
                {editingItem ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Close" className="p-2 text-th-text-tertiary hover:text-th-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Title *</label>
                <input type="text" value={form.title || ''} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Announcement title" className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Content</label>
                <textarea rows={3} value={form.content || ''} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} placeholder="Announcement message..." className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Type</label>
                  <select value={form.type || 'info'} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as 'info' | 'warning' | 'success' | 'error' }))} className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500">
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error / Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Audience</label>
                  <select value={form.target_audience || 'all'} onChange={(e) => setForm((p) => ({ ...p, target_audience: e.target.value as 'all' | 'new_advisors' | 'certified' }))} className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500">
                    {AUDIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Start Date</label>
                  <input type="datetime-local" value={form.start_date?.slice(0, 16) || ''} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">End Date (optional)</label>
                  <input type="datetime-local" value={form.end_date?.slice(0, 16) || ''} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value || null }))} className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Link URL (optional)</label>
                  <input type="text" value={form.link_url || ''} onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value || null }))} placeholder="https://..." className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Link Text</label>
                  <input type="text" value={form.link_text || ''} onChange={(e) => setForm((p) => ({ ...p, link_text: e.target.value || null }))} placeholder="Learn more" className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500" />
                </div>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500" />
                  <span className="text-sm text-th-text-secondary">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_dismissible ?? true} onChange={(e) => setForm((p) => ({ ...p, is_dismissible: e.target.checked }))} className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500" />
                  <span className="text-sm text-th-text-secondary">Dismissible</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-th-border">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-th-border rounded-xl text-th-text-secondary hover:bg-surface-tertiary transition-colors">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{editingItem ? 'Update' : 'Create'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
