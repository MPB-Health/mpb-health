import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calculator,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Tag,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  Trash2,
  UserPlus,
  X,
  GripVertical,
  MoreHorizontal,
  Shield,
  Heart,
  Stethoscope,
  Landmark,
  Star,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import type { QuoteSubmission } from '@mpbhealth/crm-core';

const PAGE_SIZE = 20;
const zohoConfigured = !!import.meta.env.VITE_ZOHO_API_KEY;

// ── Labels & Products ────────────────────────────────────────────────────────

const PRODUCT_LABELS = [
  { id: 'premium-care', label: 'Premium Care', color: 'bg-blue-100 text-blue-700', icon: Shield },
  { id: 'premium-hsa', label: 'Premium HSA', color: 'bg-purple-100 text-purple-700', icon: Landmark },
  { id: 'essential-care', label: 'Essential Care', color: 'bg-green-100 text-green-700', icon: Heart },
  { id: 'basic-care', label: 'Basic Care', color: 'bg-teal-100 text-teal-700', icon: Stethoscope },
] as const;

const STATUS_LABELS = [
  { id: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { id: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'qualified', label: 'Qualified', color: 'bg-green-100 text-green-700' },
  { id: 'converted', label: 'Converted', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700' },
] as const;

const TAG_PRESETS = [
  'hot-lead', 'follow-up', 'callback-requested', 'price-sensitive',
  'large-family', 'self-employed', 'employer-group', 'spanish-speaker',
  'quick-rate-estimate', 'hero-calculator', 'referral',
];

// ── Column definitions ───────────────────────────────────────────────────────

interface ColumnDef {
  id: string;
  label: string;
  minWidth: number;
  defaultWidth: number;
  visible: boolean;
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'name', label: 'Name', minWidth: 120, defaultWidth: 180, visible: true },
  { id: 'contact', label: 'Contact', minWidth: 160, defaultWidth: 220, visible: true },
  { id: 'household', label: 'Household', minWidth: 80, defaultWidth: 100, visible: true },
  { id: 'coverage', label: 'Coverage', minWidth: 100, defaultWidth: 140, visible: true },
  { id: 'source', label: 'Source', minWidth: 120, defaultWidth: 180, visible: true },
  { id: 'tags', label: 'Tags', minWidth: 100, defaultWidth: 160, visible: true },
  { id: 'stage', label: 'Stage', minWidth: 90, defaultWidth: 110, visible: true },
  ...(zohoConfigured ? [{ id: 'status', label: 'Sync', minWidth: 80, defaultWidth: 90, visible: true }] : []),
  { id: 'date', label: 'Date', minWidth: 120, defaultWidth: 160, visible: true },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getSyncBadge(status: string) {
  switch (status) {
    case 'success': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Synced</span>;
    case 'pending': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" />Pending</span>;
    case 'failed': case 'retrying': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><AlertCircle className="w-3 h-3" />{status === 'retrying' ? 'Retrying' : 'Failed'}</span>;
    default: return null;
  }
}

function getStageBadge(stage: string | null | undefined) {
  const s = STATUS_LABELS.find(l => l.id === stage);
  if (!s) return <span className="text-xs text-th-text-tertiary">-</span>;
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function QuickRateEstimateLeads() {
  const { importService } = useCRM();

  // Data
  const [submissions, setSubmissions] = useState<QuoteSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [syncFilter, setSyncFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // UI state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [detailSub, setDetailSub] = useState<QuoteSubmission | null>(null);
  const [actionMenu, setActionMenu] = useState<{ type: string; anchorRect?: DOMRect } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Columns (drag & resize)
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLUMNS);
  const [colWidths, setColWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(DEFAULT_COLUMNS.map(c => [c.id, c.defaultWidth]))
  );
  const resizingCol = useRef<{ id: string; startX: number; startW: number } | null>(null);
  const dragCol = useRef<{ id: string; startIdx: number } | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // ── Data Loading ─────────────────────────────────────────────────────────

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const { leads: data, total: count } = await importService.getQuickRateEstimateLeads(
        { search: searchTerm || undefined, syncStatus: syncFilter || undefined },
        PAGE_SIZE,
        (page - 1) * PAGE_SIZE,
      );
      setSubmissions(data);
      setTotal(count);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [importService, searchTerm, syncFilter, page]);

  useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

  // ── Toast ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });

  // ── Selection ────────────────────────────────────────────────────────────

  const handleSelectAll = () => {
    setSelectedIds(prev => prev.size === submissions.length ? new Set() : new Set(submissions.map(s => s.id)));
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Expand/Collapse ─────────────────────────────────────────────────────

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Bulk Actions ─────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    const res = await importService.deleteLeadSubmissions(Array.from(selectedIds));
    if (res.success) {
      showToast(`Deleted ${res.deletedCount} lead(s)`);
      setSelectedIds(new Set());
      setConfirmDelete(false);
      loadSubmissions();
    } else {
      showToast(res.error || 'Delete failed', 'error');
    }
  };

  const handleAddTag = async (tag: string) => {
    const res = await importService.addTagsToLeads(Array.from(selectedIds), [tag]);
    if (res.success) { showToast(`Added "${tag}" tag`); loadSubmissions(); }
    else showToast(res.error || 'Failed', 'error');
    setActionMenu(null);
  };

  const handleSetProduct = async (plan: string) => {
    const res = await importService.setInterestedPlans(Array.from(selectedIds), [plan]);
    if (res.success) { showToast(`Set product interest: ${plan}`); loadSubmissions(); }
    else showToast(res.error || 'Failed', 'error');
    setActionMenu(null);
  };

  const handleSetStage = async (stage: string) => {
    const res = await importService.updateLeadStage(Array.from(selectedIds), stage);
    if (res.success) { showToast(`Updated stage to "${stage}"`); loadSubmissions(); }
    else showToast(res.error || 'Failed', 'error');
    setActionMenu(null);
  };

  const handleConvert = async () => {
    const res = await importService.convertLeadsToContacts(Array.from(selectedIds));
    if (res.convertedCount > 0) {
      showToast(`Converted ${res.convertedCount} lead(s) to contacts`);
      setSelectedIds(new Set());
      loadSubmissions();
    }
    if (res.errors.length > 0) showToast(res.errors[0], 'error');
    setActionMenu(null);
  };

  const handleLabelQuickRate = async () => {
    const res = await importService.importQuoteSubmissionsAsLeads(Array.from(selectedIds));
    if (res.success) { showToast(`Labeled ${res.importedCount} lead(s)`); setSelectedIds(new Set()); loadSubmissions(); }
    setActionMenu(null);
  };

  // ── Column Resize ────────────────────────────────────────────────────────

  const onResizeStart = (colId: string, e: React.MouseEvent) => {
    e.preventDefault();
    resizingCol.current = { id: colId, startX: e.clientX, startW: colWidths[colId] || 150 };
    const onMove = (ev: MouseEvent) => {
      if (!resizingCol.current) return;
      const col = columns.find(c => c.id === resizingCol.current!.id);
      const newW = Math.max(col?.minWidth || 80, resizingCol.current.startW + (ev.clientX - resizingCol.current.startX));
      setColWidths(prev => ({ ...prev, [resizingCol.current!.id]: newW }));
    };
    const onUp = () => { resizingCol.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Column Drag Reorder ──────────────────────────────────────────────────

  const onDragStart = (colId: string, idx: number) => {
    dragCol.current = { id: colId, startIdx: idx };
  };
  const onDragOver = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const onDrop = (targetIdx: number) => {
    if (!dragCol.current) return;
    const srcIdx = columns.findIndex(c => c.id === dragCol.current!.id);
    if (srcIdx === targetIdx) { dragCol.current = null; setDragOverIdx(null); return; }
    const next = [...columns];
    const [moved] = next.splice(srcIdx, 1);
    next.splice(targetIdx, 0, moved);
    setColumns(next);
    dragCol.current = null;
    setDragOverIdx(null);
  };

  // ── Render Helpers ───────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const visibleCols = columns.filter(c => c.visible);

  const renderCellContent = (col: ColumnDef, sub: QuoteSubmission) => {
    const fd = (sub.form_data || {}) as Record<string, unknown>;
    const tags: string[] = sub.tags || [];
    const stage = sub.pipeline_stage;
    const plans: string[] = sub.interested_plans || [];

    switch (col.id) {
      case 'name':
        return (
          <div>
            <div className="font-medium text-th-text-primary">{sub.first_name} {sub.last_name}</div>
            {sub.zip_code && <div className="text-[10px] text-th-text-tertiary flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />ZIP {sub.zip_code}</div>}
          </div>
        );
      case 'contact':
        return (
          <div className="flex flex-col gap-0.5 text-sm">
            <a href={`mailto:${sub.email}`} className="text-th-accent-600 hover:underline truncate">{sub.email}</a>
            {sub.phone && <span className="text-th-text-tertiary text-xs">{sub.phone}</span>}
          </div>
        );
      case 'household':
        return <span className="text-sm text-th-text-secondary">{sub.household_size || '-'}</span>;
      case 'coverage':
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-th-text-secondary">{sub.coverage_preference || '-'}</span>
            {plans.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {plans.map(p => {
                  const pl = PRODUCT_LABELS.find(l => l.id === p);
                  return pl ? <span key={p} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${pl.color}`}>{pl.label}</span> : null;
                })}
              </div>
            )}
          </div>
        );
      case 'source':
        return <span className="text-sm text-th-text-secondary">{sub.source_cta || sub.source_page || '-'}</span>;
      case 'tags':
        return tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map(t => (
              <span key={t} className="px-1.5 py-0.5 bg-surface-tertiary text-th-text-secondary rounded text-[10px] font-medium">{t}</span>
            ))}
            {tags.length > 3 && <span className="text-[10px] text-th-text-tertiary">+{tags.length - 3}</span>}
          </div>
        ) : <span className="text-xs text-th-text-tertiary">-</span>;
      case 'stage':
        return getStageBadge(stage);
      case 'status':
        return getSyncBadge(sub.zoho_sync_status);
      case 'date':
        return <span className="text-sm text-th-text-tertiary whitespace-nowrap">{formatDate(sub.created_at)}</span>;
      default:
        return null;
    }
  };

  const renderExpandedRow = (sub: QuoteSubmission) => {
    const fd = (sub.form_data || {}) as Record<string, unknown>;
    const tags: string[] = sub.tags || [];
    const plans: string[] = sub.interested_plans || [];
    return (
      <tr className="bg-surface-secondary/50">
        <td colSpan={visibleCols.length + 2} className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact details */}
            <div>
              <h4 className="text-xs font-semibold text-th-text-secondary uppercase mb-2">Contact</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-th-text-tertiary" /><a href={`mailto:${sub.email}`} className="text-th-accent-600 hover:underline">{sub.email}</a></div>
                {sub.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-th-text-tertiary" /><a href={`tel:${sub.phone}`} className="text-th-accent-600 hover:underline">{sub.phone}</a></div>}
                {sub.zip_code && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-th-text-tertiary" /><span>ZIP: {sub.zip_code}</span></div>}
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-th-text-tertiary" /><span>{formatDate(sub.created_at)}</span></div>
              </div>
            </div>
            {/* Quote details */}
            <div>
              <h4 className="text-xs font-semibold text-th-text-secondary uppercase mb-2">Quote Details</h4>
              <div className="space-y-1 text-sm">
                {sub.household_size && <div className="flex justify-between"><span className="text-th-text-tertiary">Household</span><span className="font-medium">{sub.household_size}</span></div>}
                {sub.current_insurance && <div className="flex justify-between"><span className="text-th-text-tertiary">Insurance</span><span className="font-medium">{sub.current_insurance}</span></div>}
                {sub.monthly_premium && <div className="flex justify-between"><span className="text-th-text-tertiary">Premium</span><span className="font-medium">${sub.monthly_premium}/mo</span></div>}
                {sub.coverage_preference && <div className="flex justify-between"><span className="text-th-text-tertiary">Coverage</span><span className="font-medium">{sub.coverage_preference}</span></div>}
                {sub.primary_concern && <div className="flex justify-between"><span className="text-th-text-tertiary">Concern</span><span className="font-medium">{sub.primary_concern}</span></div>}
                {sub.contact_preference && <div className="flex justify-between"><span className="text-th-text-tertiary">Prefers</span><span className="font-medium capitalize">{sub.contact_preference}</span></div>}
              </div>
            </div>
            {/* Attribution & Labels */}
            <div>
              <h4 className="text-xs font-semibold text-th-text-secondary uppercase mb-2">Attribution</h4>
              <div className="space-y-1 text-sm mb-3">
                {sub.source_page && <div className="flex justify-between"><span className="text-th-text-tertiary">Page</span><span>{sub.source_page}</span></div>}
                {sub.source_cta && <div className="flex justify-between"><span className="text-th-text-tertiary">CTA</span><span>{sub.source_cta}</span></div>}
                {sub.utm_source && <div className="flex justify-between"><span className="text-th-text-tertiary">UTM</span><span>{sub.utm_source}</span></div>}
              </div>
              {(tags.length > 0 || plans.length > 0) && (
                <>
                  <h4 className="text-xs font-semibold text-th-text-secondary uppercase mb-2">Labels</h4>
                  <div className="flex flex-wrap gap-1">
                    {plans.map(p => { const pl = PRODUCT_LABELS.find(l => l.id === p); return pl ? <span key={p} className={`px-2 py-0.5 rounded-full text-xs font-medium ${pl.color}`}>{pl.label}</span> : null; })}
                    {tags.map(t => <span key={t} className="px-2 py-0.5 bg-surface-tertiary text-th-text-secondary rounded-full text-xs font-medium">{t}</span>)}
                  </div>
                </>
              )}
              {zohoConfigured && sub.zoho_lead_id && (
                <a href={`https://crm.zoho.com/crm/org/tab/Leads/${sub.zoho_lead_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs text-th-accent-600 hover:underline"><ExternalLink className="w-3 h-3" />View in Zoho</a>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-th-accent-100 rounded-lg">
            <Calculator className="w-6 h-6 text-th-accent-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">Julia's Quick Rate Leads</h1>
            <p className="text-sm text-th-text-secondary">Leads from the hero calculator and Quick Rate Estimate forms</p>
          </div>
          <div className="flex-1" />
          <span className="text-sm text-th-text-tertiary">{total} total leads</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-surface-primary rounded-xl border border-th-border mb-4">
        <div className="p-3 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name or email..."
              className="w-full pl-9 pr-8 py-2 border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500/30 bg-surface-primary" />
            {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-th-text-tertiary hover:text-th-text-primary"><X className="w-3.5 h-3.5" /></button>}
          </div>

          {/* Sync filter */}
          {zohoConfigured && (
            <select value={syncFilter} onChange={e => setSyncFilter(e.target.value)} aria-label="Filter by sync status" className="px-3 py-2 border border-th-border rounded-lg text-sm bg-surface-primary text-th-text-primary">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="success">Synced</option>
              <option value="failed">Failed</option>
            </select>
          )}

          <button type="button" onClick={() => { setRefreshing(true); loadSubmissions(); }} disabled={refreshing} className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary transition-colors" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 text-th-text-tertiary ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-th-text-secondary font-medium">{selectedIds.size} selected</span>

              {/* Tag menu */}
              <div className="relative">
                <button type="button" onClick={() => setActionMenu(prev => prev?.type === 'tag' ? null : { type: 'tag' })} className="flex items-center gap-1.5 px-3 py-1.5 border border-th-border rounded-lg text-sm hover:bg-surface-secondary">
                  <Tag className="w-3.5 h-3.5" />Tag
                </button>
                {actionMenu?.type === 'tag' && (
                  <div className="absolute top-full mt-1 right-0 z-50 bg-surface-primary border border-th-border rounded-lg shadow-xl py-1 w-52 max-h-60 overflow-y-auto">
                    {TAG_PRESETS.map(tag => (
                      <button key={tag} type="button" onClick={() => handleAddTag(tag)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-surface-secondary text-th-text-primary">{tag}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product menu */}
              <div className="relative">
                <button type="button" onClick={() => setActionMenu(prev => prev?.type === 'product' ? null : { type: 'product' })} className="flex items-center gap-1.5 px-3 py-1.5 border border-th-border rounded-lg text-sm hover:bg-surface-secondary">
                  <Star className="w-3.5 h-3.5" />Product
                </button>
                {actionMenu?.type === 'product' && (
                  <div className="absolute top-full mt-1 right-0 z-50 bg-surface-primary border border-th-border rounded-lg shadow-xl py-1 w-48">
                    {PRODUCT_LABELS.map(p => {
                      const Icon = p.icon;
                      return (
                        <button key={p.id} type="button" onClick={() => handleSetProduct(p.id)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-surface-secondary flex items-center gap-2 text-th-text-primary">
                          <Icon className="w-3.5 h-3.5" />{p.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Stage menu */}
              <div className="relative">
                <button type="button" onClick={() => setActionMenu(prev => prev?.type === 'stage' ? null : { type: 'stage' })} className="flex items-center gap-1.5 px-3 py-1.5 border border-th-border rounded-lg text-sm hover:bg-surface-secondary">
                  <MoreHorizontal className="w-3.5 h-3.5" />Stage
                </button>
                {actionMenu?.type === 'stage' && (
                  <div className="absolute top-full mt-1 right-0 z-50 bg-surface-primary border border-th-border rounded-lg shadow-xl py-1 w-40">
                    {STATUS_LABELS.map(s => (
                      <button key={s.id} type="button" onClick={() => handleSetStage(s.id)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-surface-secondary text-th-text-primary">{s.label}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Label as QRE */}
              <button type="button" onClick={handleLabelQuickRate} className="flex items-center gap-1.5 px-3 py-1.5 bg-th-accent-600 text-white rounded-lg text-sm hover:bg-th-accent-700">
                <Tag className="w-3.5 h-3.5" />Label QRE
              </button>

              {/* Convert */}
              <button type="button" onClick={handleConvert} className="flex items-center gap-1.5 px-3 py-1.5 border border-green-300 text-green-700 rounded-lg text-sm hover:bg-green-50">
                <UserPlus className="w-3.5 h-3.5" />Convert
              </button>

              {/* Delete */}
              <button type="button" onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5" />Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 40 }} /> {/* checkbox */}
              {visibleCols.map(col => <col key={col.id} style={{ width: colWidths[col.id] || col.defaultWidth }} />)}
              <col style={{ width: 48 }} /> {/* expand */}
            </colgroup>
            <thead>
              <tr className="bg-surface-secondary">
                <th className="px-3 py-3">
                  <input type="checkbox" checked={selectedIds.size === submissions.length && submissions.length > 0} onChange={handleSelectAll} aria-label="Select all" className="h-4 w-4 rounded border-th-border text-th-accent-600" />
                </th>
                {visibleCols.map((col, idx) => (
                  <th
                    key={col.id}
                    className={`px-3 py-3 text-left text-xs font-medium text-th-text-secondary uppercase select-none relative group ${dragOverIdx === idx ? 'bg-th-accent-100/50' : ''}`}
                    draggable
                    onDragStart={() => onDragStart(col.id, idx)}
                    onDragOver={e => onDragOver(idx, e)}
                    onDrop={() => onDrop(idx)}
                    onDragEnd={() => setDragOverIdx(null)}
                  >
                    <div className="flex items-center gap-1">
                      <GripVertical className="w-3 h-3 text-th-text-tertiary opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />
                      <span className="truncate">{col.label}</span>
                    </div>
                    {/* Resize handle */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-th-accent-400/40"
                      onMouseDown={e => onResizeStart(col.id, e)}
                    />
                  </th>
                ))}
                <th className="px-3 py-3 w-12"><span className="sr-only">Expand</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border">
              {loading ? (
                <tr><td colSpan={visibleCols.length + 2} className="px-4 py-12 text-center"><div className="flex items-center justify-center gap-2 text-th-text-tertiary"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-th-accent-600" />Loading...</div></td></tr>
              ) : submissions.length === 0 ? (
                <tr><td colSpan={visibleCols.length + 2} className="px-4 py-12 text-center"><Calculator className="w-12 h-12 mx-auto text-th-text-tertiary mb-3" /><p className="text-th-text-secondary">No leads found</p></td></tr>
              ) : (
                submissions.map(sub => (
                  <>
                    <tr key={sub.id} className={`hover:bg-surface-secondary/50 transition-colors ${selectedIds.has(sub.id) ? 'bg-th-accent-50/30' : ''}`}>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(sub.id)} onChange={() => handleSelectRow(sub.id)} aria-label={`Select ${sub.first_name}`} className="h-4 w-4 rounded border-th-border text-th-accent-600" />
                      </td>
                      {visibleCols.map(col => (
                        <td key={col.id} className="px-3 py-3 overflow-hidden" onClick={() => setDetailSub(sub)} style={{ cursor: 'pointer' }}>
                          {renderCellContent(col, sub)}
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <button type="button" onClick={() => toggleExpand(sub.id)} aria-label="Expand row" className="p-1 rounded hover:bg-surface-tertiary">
                          {expandedIds.has(sub.id) ? <ChevronUp className="w-4 h-4 text-th-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-th-text-tertiary" />}
                        </button>
                      </td>
                    </tr>
                    {expandedIds.has(sub.id) && renderExpandedRow(sub)}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-4 py-3 border-t border-th-border flex items-center justify-between">
            <p className="text-sm text-th-text-tertiary">Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, total)} of {total}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage(p => p - 1)} disabled={page === 1} aria-label="Previous page" className="p-1.5 border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-th-text-secondary">Page {page} of {totalPages}</span>
              <button type="button" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} aria-label="Next page" className="p-1.5 border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-primary rounded-xl border border-th-border shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-th-text-primary mb-2">Delete {selectedIds.size} lead(s)?</h3>
            <p className="text-sm text-th-text-secondary mb-6">This action cannot be undone. Selected leads will be permanently removed.</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setConfirmDelete(false)} className="px-4 py-2 border border-th-border rounded-lg text-sm hover:bg-surface-secondary">Cancel</button>
              <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail slide-over panel */}
      {detailSub && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDetailSub(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-surface-primary shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-th-text-primary">Lead Details</h3>
                <button type="button" onClick={() => setDetailSub(null)} aria-label="Close" className="p-1 rounded hover:bg-surface-secondary"><X className="w-5 h-5 text-th-text-tertiary" /></button>
              </div>

              {/* Contact card */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-th-accent-100 flex items-center justify-center"><span className="text-th-accent-600 font-semibold">{detailSub.first_name?.[0]}{detailSub.last_name?.[0]}</span></div>
                  <div>
                    <div className="font-medium text-th-text-primary text-lg">{detailSub.first_name} {detailSub.last_name}</div>
                    {getStageBadge(detailSub.pipeline_stage)}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-th-text-tertiary" /><a href={`mailto:${detailSub.email}`} className="text-th-accent-600 hover:underline">{detailSub.email}</a></div>
                  {detailSub.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-th-text-tertiary" /><a href={`tel:${detailSub.phone}`} className="text-th-accent-600 hover:underline">{detailSub.phone}</a></div>}
                  {detailSub.zip_code && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-th-text-tertiary" /><span>ZIP: {detailSub.zip_code}</span></div>}
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-th-text-tertiary" /><span>{formatDate(detailSub.created_at)}</span></div>
                </div>
              </div>

              {/* Quote details */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-th-text-secondary mb-3">Quote Details</h4>
                <div className="bg-surface-secondary rounded-lg p-4 space-y-2 text-sm">
                  {detailSub.household_size && <div className="flex justify-between"><span className="text-th-text-tertiary">Household Size</span><span className="font-medium">{detailSub.household_size}</span></div>}
                  {detailSub.current_insurance && <div className="flex justify-between"><span className="text-th-text-tertiary">Current Insurance</span><span className="font-medium">{detailSub.current_insurance}</span></div>}
                  {detailSub.monthly_premium && <div className="flex justify-between"><span className="text-th-text-tertiary">Monthly Premium</span><span className="font-medium">${detailSub.monthly_premium}</span></div>}
                  {detailSub.coverage_preference && <div className="flex justify-between"><span className="text-th-text-tertiary">Coverage</span><span className="font-medium">{detailSub.coverage_preference}</span></div>}
                  {detailSub.primary_concern && <div className="flex justify-between"><span className="text-th-text-tertiary">Primary Concern</span><span className="font-medium">{detailSub.primary_concern}</span></div>}
                  {detailSub.contact_preference && <div className="flex justify-between"><span className="text-th-text-tertiary">Contact Preference</span><span className="font-medium capitalize">{detailSub.contact_preference}</span></div>}
                </div>
              </div>

              {/* Labels */}
              {(() => {
                const tags: string[] = detailSub.tags || [];
                const plans: string[] = detailSub.interested_plans || [];
                return (tags.length > 0 || plans.length > 0) ? (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-th-text-secondary mb-3">Labels & Products</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {plans.map(p => { const pl = PRODUCT_LABELS.find(l => l.id === p); return pl ? <span key={p} className={`px-2.5 py-1 rounded-full text-xs font-medium ${pl.color}`}>{pl.label}</span> : null; })}
                      {tags.map(t => <span key={t} className="px-2.5 py-1 bg-surface-tertiary text-th-text-secondary rounded-full text-xs font-medium">{t}</span>)}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Attribution */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-th-text-secondary mb-3">Attribution</h4>
                <div className="bg-surface-secondary rounded-lg p-4 space-y-2 text-sm">
                  {detailSub.source_page && <div className="flex justify-between"><span className="text-th-text-tertiary">Source Page</span><span>{detailSub.source_page}</span></div>}
                  {detailSub.source_cta && <div className="flex justify-between"><span className="text-th-text-tertiary">Source CTA</span><span>{detailSub.source_cta}</span></div>}
                  {detailSub.utm_source && <div className="flex justify-between"><span className="text-th-text-tertiary">UTM Source</span><span>{detailSub.utm_source}</span></div>}
                  {detailSub.utm_medium && <div className="flex justify-between"><span className="text-th-text-tertiary">UTM Medium</span><span>{detailSub.utm_medium}</span></div>}
                  {detailSub.utm_campaign && <div className="flex justify-between"><span className="text-th-text-tertiary">UTM Campaign</span><span>{detailSub.utm_campaign}</span></div>}
                </div>
              </div>

              {zohoConfigured && detailSub.zoho_lead_id && (
                <a href={`https://crm.zoho.com/crm/org/tab/Leads/${detailSub.zoho_lead_id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-th-accent-600 hover:underline mb-6"><ExternalLink className="w-4 h-4" />View in Zoho CRM</a>
              )}

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { importService.importQuoteSubmissionsAsLeads([detailSub.id]); setDetailSub(null); loadSubmissions(); }} className="px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700">Label as QRE</button>
                <button type="button" onClick={async () => { await importService.convertLeadsToContacts([detailSub.id]); showToast('Converted to contact'); setDetailSub(null); loadSubmissions(); }} className="px-4 py-2 border border-green-300 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50">Convert to Contact</button>
                <button type="button" onClick={async () => { await importService.deleteLeadSubmissions([detailSub.id]); showToast('Deleted'); setDetailSub(null); loadSubmissions(); }} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
