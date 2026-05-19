import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Plus,
  ArrowLeft,
  Trash2,
  Loader2,
  Save,
  Eye,
  EyeOff,
  MousePointerClick,
  Clock,
  ArrowDownToLine,
  Zap,
  BarChart3,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  popupService,
  type CmsPopup,
  type PopupCreateInput,
  type PopupTrigger,
  type PopupTargeting,
} from '@mpbhealth/admin-core';

const TRIGGER_TYPES: { value: PopupTrigger['type']; label: string; icon: typeof Clock }[] = [
  { value: 'time_delay', label: 'Time Delay', icon: Clock },
  { value: 'exit_intent', label: 'Exit Intent', icon: MousePointerClick },
  { value: 'scroll_percent', label: 'Scroll %', icon: ArrowDownToLine },
  { value: 'page_load', label: 'Page Load', icon: Zap },
  { value: 'button_click', label: 'Button Click', icon: MousePointerClick },
];

const FREQUENCY_OPTIONS = [
  { value: 'once', label: 'Once ever' },
  { value: 'once_per_session', label: 'Once per session' },
  { value: 'always', label: 'Every page view' },
] as const;

const VISITOR_TYPES = [
  { value: 'all', label: 'All visitors' },
  { value: 'new', label: 'New visitors only' },
  { value: 'returning', label: 'Returning visitors only' },
] as const;

function triggerLabel(type: string) {
  return TRIGGER_TYPES.find((t) => t.value === type)?.label ?? type;
}

function closeRate(popup: CmsPopup) {
  if (!popup.impressions) return 0;
  return Math.round((popup.closes / popup.impressions) * 100);
}

function conversionRate(popup: CmsPopup) {
  if (!popup.impressions) return 0;
  return Math.round((popup.conversions / popup.impressions) * 100);
}

// ── List View ────────────────────────────────────────────────────────────────
function PopupList() {
  const navigate = useNavigate();
  const [popups, setPopups] = useState<CmsPopup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setPopups(await popupService.getPopups());
    } catch {
      toast.error('Failed to load popups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (popup: CmsPopup) => {
    const next = !popup.is_active;
    if (next && !confirm(`Activate "${popup.name}"? It will be shown to website visitors.`)) return;
    try {
      await popupService.toggleActive(popup.id, next);
      toast.success(next ? 'Popup activated' : 'Popup deactivated');
      load();
    } catch {
      toast.error('Failed to update popup');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this popup? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await popupService.deletePopup(id);
      toast.success('Popup deleted');
      load();
    } catch {
      toast.error('Failed to delete popup');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  const totalImpressions = popups.reduce((s, p) => s + p.impressions, 0);
  const totalConversions = popups.reduce((s, p) => s + p.conversions, 0);
  const activeCount = popups.filter((p) => p.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Popups & Modals</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Create and manage website popups with trigger rules and targeting
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/cms/popups/new')}
          className="flex items-center space-x-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Popup</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Popups', value: popups.length, icon: MessageSquare, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Active', value: activeCount, icon: Eye, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
          { label: 'Impressions', value: totalImpressions.toLocaleString(), icon: BarChart3, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
          { label: 'Conversions', value: totalConversions.toLocaleString(), icon: Zap, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{s.value}</p>
              <p className="text-sm text-th-text-tertiary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {popups.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <h3 className="text-lg font-semibold text-th-text-primary mb-1">No popups yet</h3>
            <p className="text-th-text-tertiary">Create your first popup to engage website visitors</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-th-border">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-text-tertiary">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-text-tertiary">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-text-tertiary">Trigger</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-text-tertiary text-right">Impressions</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-text-tertiary text-right">Close %</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-text-tertiary text-right">Conv %</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-text-tertiary text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {popups.map((popup) => (
                  <tr
                    key={popup.id}
                    className="hover:bg-surface-secondary transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/cms/popups/${popup.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-th-text-primary">{popup.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          popup.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {popup.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-th-text-secondary">
                      {triggerLabel((popup.trigger_config as PopupTrigger)?.type ?? 'time_delay')}
                    </td>
                    <td className="px-4 py-3 text-sm text-th-text-secondary text-right tabular-nums">
                      {popup.impressions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-th-text-secondary text-right tabular-nums">
                      {closeRate(popup)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-th-text-secondary text-right tabular-nums">
                      {conversionRate(popup)}%
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggle(popup)}
                          title={popup.is_active ? 'Deactivate' : 'Activate'}
                          className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                        >
                          {popup.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(popup.id)}
                          disabled={deleting === popup.id}
                          title="Delete"
                          className="p-2 rounded-lg text-th-text-tertiary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        >
                          {deleting === popup.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Editor View ──────────────────────────────────────────────────────────────
function PopupEditor({ popupId }: { popupId: string }) {
  const navigate = useNavigate();
  const isNew = popupId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [blocksJson, setBlocksJson] = useState('[]');
  const [triggerType, setTriggerType] = useState<PopupTrigger['type']>('time_delay');
  const [delayMs, setDelayMs] = useState(5000);
  const [scrollPercent, setScrollPercent] = useState(50);
  const [pagesMode, setPagesMode] = useState<'all' | 'specific'>('all');
  const [pagesList, setPagesList] = useState('');
  const [visitorType, setVisitorType] = useState<'all' | 'new' | 'returning'>('all');
  const [frequency, setFrequency] = useState<'once' | 'once_per_session' | 'always'>('once_per_session');
  const [isActive, setIsActive] = useState(false);
  const [popup, setPopup] = useState<CmsPopup | null>(null);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const p = await popupService.getPopup(popupId);
        if (!p) {
          toast.error('Popup not found');
          navigate('/admin/cms/popups');
          return;
        }
        setPopup(p);
        setName(p.name);
        setBlocksJson(JSON.stringify(p.blocks, null, 2));
        const trigger = p.trigger_config as PopupTrigger;
        setTriggerType(trigger.type ?? 'time_delay');
        setDelayMs(trigger.delay_ms ?? 5000);
        setScrollPercent(trigger.scroll_percent ?? 50);
        const tgt = p.targeting as PopupTargeting;
        if (tgt.pages === 'all') {
          setPagesMode('all');
        } else {
          setPagesMode('specific');
          setPagesList((tgt.pages as string[]).join('\n'));
        }
        setVisitorType(tgt.visitor_type ?? 'all');
        setFrequency(p.frequency);
        setIsActive(p.is_active);
      } catch {
        toast.error('Failed to load popup');
        navigate('/admin/cms/popups');
      } finally {
        setLoading(false);
      }
    })();
  }, [popupId]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    let blocks: unknown[];
    try {
      blocks = JSON.parse(blocksJson);
      if (!Array.isArray(blocks)) throw new Error();
    } catch {
      toast.error('Blocks must be valid JSON array');
      return;
    }

    const trigger_config: PopupTrigger = { type: triggerType };
    if (triggerType === 'time_delay') trigger_config.delay_ms = delayMs;
    if (triggerType === 'scroll_percent') trigger_config.scroll_percent = scrollPercent;

    const targeting: PopupTargeting = {
      pages: pagesMode === 'all' ? 'all' : pagesList.split('\n').map((s) => s.trim()).filter(Boolean),
      visitor_type: visitorType,
    };

    setSaving(true);
    try {
      if (isNew) {
        const created = await popupService.createPopup({
          name,
          blocks,
          trigger_config,
          targeting,
          frequency,
          is_active: isActive,
        } as PopupCreateInput);
        toast.success('Popup created!');
        navigate(`/admin/cms/popups/${created.id}`, { replace: true });
      } else {
        await popupService.updatePopup(popupId, {
          name,
          blocks,
          trigger_config,
          targeting,
          frequency,
          is_active: isActive,
        });
        toast.success('Popup saved!');
      }
    } catch {
      toast.error('Failed to save popup');
    } finally {
      setSaving(false);
    }
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/cms/popups')}
            className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">
              {isNew ? 'New Popup' : 'Edit Popup'}
            </h1>
            {!isNew && popup && (
              <p className="text-th-text-tertiary text-sm mt-0.5">
                Created {new Date(popup.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isNew ? 'Create' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Analytics (existing popup only) */}
      {!isNew && popup && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Impressions', value: popup.impressions.toLocaleString() },
            { label: 'Closes', value: popup.closes.toLocaleString() },
            { label: 'Close Rate', value: `${closeRate(popup)}%` },
            { label: 'Conv. Rate', value: `${conversionRate(popup)}%` },
          ].map((s) => (
            <div key={s.label} className="bg-surface-primary rounded-xl border border-th-border p-4 text-center">
              <p className="text-2xl font-bold text-th-text-primary tabular-nums">{s.value}</p>
              <p className="text-sm text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Name */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Popup Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Sale Banner"
              className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>

          {/* Block content */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Block Content (JSON)</label>
            <textarea
              value={blocksJson}
              onChange={(e) => setBlocksJson(e.target.value)}
              rows={12}
              className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 font-mono text-sm resize-y"
            />
            <p className="text-xs text-th-text-tertiary mt-1">
              JSON array of content blocks (same schema as the page builder)
            </p>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Active toggle */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-th-text-secondary">Active on website</span>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? 'bg-th-accent-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Trigger config */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-4">
            <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wider">Trigger</h3>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Type</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as PopupTrigger['type'])}
                className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 appearance-none"
              >
                {TRIGGER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {triggerType === 'time_delay' && (
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Delay (ms)
                </label>
                <input
                  type="number"
                  value={delayMs}
                  onChange={(e) => setDelayMs(parseInt(e.target.value) || 0)}
                  min={0}
                  step={500}
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
                <p className="text-xs text-th-text-tertiary mt-1">{(delayMs / 1000).toFixed(1)}s</p>
              </div>
            )}
            {triggerType === 'scroll_percent' && (
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Scroll Percentage
                </label>
                <input
                  type="number"
                  value={scrollPercent}
                  onChange={(e) => setScrollPercent(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
            )}
          </div>

          {/* Targeting */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-4">
            <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wider">Targeting</h3>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Pages</label>
              <div className="flex gap-3 mb-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pages"
                    checked={pagesMode === 'all'}
                    onChange={() => setPagesMode('all')}
                    className="text-th-accent-600 focus:ring-th-accent-500"
                  />
                  <span className="text-sm text-th-text-secondary">All pages</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pages"
                    checked={pagesMode === 'specific'}
                    onChange={() => setPagesMode('specific')}
                    className="text-th-accent-600 focus:ring-th-accent-500"
                  />
                  <span className="text-sm text-th-text-secondary">Specific</span>
                </label>
              </div>
              {pagesMode === 'specific' && (
                <textarea
                  value={pagesList}
                  onChange={(e) => setPagesList(e.target.value)}
                  rows={4}
                  placeholder={'/pricing\n/about\n/contact'}
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 font-mono text-sm resize-y"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Visitor Type</label>
              <select
                value={visitorType}
                onChange={(e) => setVisitorType(e.target.value as 'all' | 'new' | 'returning')}
                className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 appearance-none"
              >
                {VISITOR_TYPES.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Frequency */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-4">
            <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wider">Frequency</h3>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as typeof frequency)}
              className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 appearance-none"
            >
              {FREQUENCY_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Router Switch ────────────────────────────────────────────────────────────
export default function PopupBuilder() {
  const { popupId } = useParams<{ popupId?: string }>();
  if (popupId) return <PopupEditor popupId={popupId} />;
  return <PopupList />;
}
