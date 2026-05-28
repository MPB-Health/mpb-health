import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Copy,
  Trash2,
  Edit2,
  Search,
  LayoutGrid,
  List,
  Eye,
  X,
  FolderPlus,
  Folder,
  FolderOpen,
  MoreVertical,
  Monitor,
  Smartphone,
  Clipboard,
  BarChart3,
  TrendingUp,
  Mail,
  MessageSquare,
  ArrowUpDown,
  Pencil,
  Tag,
  Clock,
  Send,
  MousePointerClick,
  Reply,
  Sparkles,
  Save,
  FilePlus2,
  Variable,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { PermissionGate } from '../components/PermissionGate';
import type { CRMTemplate, TemplateFilters, TemplateType } from '@mpbhealth/crm-core';
import { HelpBanner } from '../components/help';

const MasterTemplates = lazy(() => import('./MasterTemplates'));

// =============================================================================
// Constants
// =============================================================================

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'nurture', label: 'Nurture' },
  { value: 'pitch', label: 'Pitch' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'objection_handling', label: 'Objection Handling' },
  { value: 're_engagement', label: 'Re-engagement' },
  { value: 'upsell', label: 'Upsell' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'both', label: 'Both' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const SORT_OPTIONS = [
  { value: 'updated_at', label: 'Last Modified' },
  { value: 'name', label: 'Name' },
  { value: 'usage_count', label: 'Usage Count' },
  { value: 'performance_score', label: 'Performance Score' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'last_used_at', label: 'Last Used' },
];

// Sales Plan 2026 Phase 5: expose the full set of merge tokens reps actually
// use (plan, renewal_date, industry, meeting_date). Callers auto-populate
// from the lead + related deal + product row; templateService.renderTemplate
// does a pure {{key}} replace, so adding a token here is enough to make it
// available in the editor preview + send flow.
const MERGE_FIELDS = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'company', label: 'Company' },
  { key: 'industry', label: 'Industry' },
  { key: 'plan', label: 'Plan' },
  { key: 'renewal_date', label: 'Renewal Date' },
  { key: 'meeting_date', label: 'Meeting Date' },
  { key: 'product_interest', label: 'Product Interest' },
  { key: 'last_interaction_date', label: 'Last Interaction' },
  { key: 'assigned_rep_name', label: 'Rep Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
];

const SAMPLE_LEAD_DATA: Record<string, string> = {
  first_name: 'Jane',
  last_name: 'Doe',
  company: 'Acme Healthcare',
  industry: 'Health Insurance',
  plan: 'Gold PPO 2026',
  renewal_date: 'Dec 31, 2026',
  meeting_date: 'Feb 18, 2026 at 10:00 AM ET',
  product_interest: 'Enterprise Plan',
  last_interaction_date: 'Feb 10, 2026',
  assigned_rep_name: 'Alex Johnson',
  phone: '(555) 123-4567',
  email: 'jane.doe@acmehealthcare.com',
};

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-100 text-gray-700',
  follow_up: 'bg-amber-100 text-amber-700',
  welcome: 'bg-green-100 text-green-700',
  appointment: 'bg-blue-100 text-blue-700',
  nurture: 'bg-blue-100 text-blue-700',
  pitch: 'bg-blue-100 text-blue-700',
  cold_outreach: 'bg-cyan-100 text-cyan-700',
  proposal: 'bg-rose-100 text-rose-700',
  objection_handling: 'bg-orange-100 text-orange-700',
  re_engagement: 'bg-blue-100 text-blue-700',
  upsell: 'bg-blue-100 text-blue-700',
};

// =============================================================================
// Types
// =============================================================================

interface TemplateFolder {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  parent_folder_id: string | null;
  color: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

type SortField = 'updated_at' | 'name' | 'usage_count' | 'performance_score' | 'created_at' | 'last_used_at';
type ViewMode = 'grid' | 'list';

// Extended template type with the new columns from migration
interface ExtendedTemplate extends CRMTemplate {
  folder_id?: string | null;
  version?: number;
  parent_version_id?: string | null;
  performance_score?: number;
  reply_count?: number;
  total_sent?: number;
  open_rate?: number;
  click_rate?: number;
}

// =============================================================================
// Helper Components
// =============================================================================

function TypeBadge({ type }: { type: TemplateType }) {
  const config = {
    email: { bg: 'bg-blue-100 text-blue-700', icon: Mail },
    sms: { bg: 'bg-green-100 text-green-700', icon: MessageSquare },
    both: { bg: 'bg-blue-100 text-blue-700', icon: Send },
  };
  const { bg, icon: Icon } = config[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg}`}>
      <Icon className="w-3 h-3" />
      {type.toUpperCase()}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-700';
  const label = CATEGORY_OPTIONS.find((o) => o.value === category)?.label || category;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function PerformanceIndicator({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-xs text-th-text-tertiary">--</span>;
  const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-500';
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {score.toFixed(0)}%
    </span>
  );
}

function RateBar({ label, value }: { label: string; value: number | null | undefined }) {
  const pct = value ?? 0;
  const color = pct >= 50 ? 'bg-green-500' : pct >= 25 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-th-text-tertiary">{label}</span>
        <span className="font-medium text-th-text-secondary">{pct.toFixed(1)}%</span>
      </div>
      <div className="w-full h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="bg-surface-primary rounded-xl border border-th-border p-16 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-secondary flex items-center justify-center">
        <Mail className="w-8 h-8 text-th-text-tertiary" />
      </div>
      <h3 className="text-lg font-semibold text-th-text-primary mb-1">No templates found</h3>
      <p className="text-sm text-th-text-tertiary max-w-md mx-auto mb-6">
        Create your first pitch template to streamline your sales outreach and improve team consistency.
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create Template
      </button>
    </div>
  );
}

// =============================================================================
// Dropdown component
// =============================================================================

function Dropdown({
  trigger,
  children,
  align = 'left',
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={`absolute z-30 mt-1 w-48 bg-surface-primary border border-th-border rounded-lg shadow-lg py-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Folder Sidebar
// =============================================================================

function FolderSidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  templates,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: {
  folders: TemplateFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  templates: ExtendedTemplate[];
  onCreateFolder: () => void;
  onRenameFolder: (folder: TemplateFolder) => void;
  onDeleteFolder: (id: string) => void;
}) {
  const allCount = templates.length;
  const categoryGroups = useMemo(() => {
    const map: Record<string, number> = {};
    templates.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + 1;
    });
    return map;
  }, [templates]);

  const folderCounts = useMemo(() => {
    const map: Record<string, number> = {};
    templates.forEach((t) => {
      if ((t as ExtendedTemplate).folder_id) {
        const fid = (t as ExtendedTemplate).folder_id!;
        map[fid] = (map[fid] || 0) + 1;
      }
    });
    return map;
  }, [templates]);

  return (
    <div className="w-64 flex-shrink-0 bg-surface-primary border border-th-border rounded-xl overflow-hidden">
      {/* Folder header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-th-border">
        <span className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
          Folders
        </span>
        <button
          onClick={onCreateFolder}
          className="p-1 text-th-text-tertiary hover:text-th-accent-600 rounded transition-colors"
          title="Create folder"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      <div className="py-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        {/* All templates */}
        <button
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
            selectedFolderId === null
              ? 'bg-th-accent-600/10 text-th-accent-600 font-medium'
              : 'text-th-text-secondary hover:bg-surface-secondary'
          }`}
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            <span>All Templates</span>
          </div>
          <span className="text-xs bg-surface-tertiary px-1.5 py-0.5 rounded-full">{allCount}</span>
        </button>

        {/* Category virtual folders */}
        <div className="mt-3 px-4 mb-1">
          <span className="text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider">
            Categories
          </span>
        </div>
        {CATEGORY_OPTIONS.filter((c) => c.value).map((cat) => {
          const count = categoryGroups[cat.value] || 0;
          const isSelected = selectedFolderId === `cat:${cat.value}`;
          return (
            <button
              key={cat.value}
              onClick={() => onSelectFolder(`cat:${cat.value}`)}
              className={`w-full flex items-center justify-between px-4 py-1.5 text-sm transition-colors ${
                isSelected
                  ? 'bg-th-accent-600/10 text-th-accent-600 font-medium'
                  : 'text-th-text-secondary hover:bg-surface-secondary'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                <span className="truncate">{cat.label}</span>
              </div>
              {count > 0 && (
                <span className="text-xs bg-surface-tertiary px-1.5 py-0.5 rounded-full">{count}</span>
              )}
            </button>
          );
        })}

        {/* User-created folders */}
        {folders.length > 0 && (
          <>
            <div className="mt-3 px-4 mb-1">
              <span className="text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider">
                Custom Folders
              </span>
            </div>
            {folders.map((folder) => {
              const count = folderCounts[folder.id] || 0;
              const isSelected = selectedFolderId === `folder:${folder.id}`;
              return (
                <div
                  key={folder.id}
                  className={`group flex items-center justify-between px-4 py-1.5 text-sm transition-colors ${
                    isSelected
                      ? 'bg-th-accent-600/10 text-th-accent-600 font-medium'
                      : 'text-th-text-secondary hover:bg-surface-secondary'
                  }`}
                >
                  <button
                    onClick={() => onSelectFolder(`folder:${folder.id}`)}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <Folder className="w-3.5 h-3.5 flex-shrink-0" style={{ color: folder.color }} />
                    <span className="truncate">{folder.name}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    {count > 0 && (
                      <span className="text-xs bg-surface-tertiary px-1.5 py-0.5 rounded-full">
                        {count}
                      </span>
                    )}
                    <Dropdown
                      align="right"
                      trigger={
                        <button title="Folder options" className="p-0.5 opacity-0 group-hover:opacity-100 text-th-text-tertiary hover:text-th-text-secondary rounded transition-all">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      }
                    >
                      <button
                        onClick={() => onRenameFolder(folder)}
                        className="w-full text-left px-3 py-1.5 text-sm text-th-text-secondary hover:bg-surface-secondary flex items-center gap-2"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Rename
                      </button>
                      <button
                        onClick={() => onDeleteFolder(folder.id)}
                        className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-surface-secondary flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </Dropdown>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Template Card (Grid View)
// =============================================================================

function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  onPreview,
  onToggleActive,
}: {
  template: ExtendedTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onPreview: () => void;
  onToggleActive: () => void;
}) {
  const truncatedBody = template.body.length > 120 ? template.body.slice(0, 120) + '...' : template.body;
  const truncatedSubject =
    template.subject && template.subject.length > 60
      ? template.subject.slice(0, 60) + '...'
      : template.subject;

  return (
    <div className="bg-surface-primary border border-th-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
      {/* Card Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between mb-2">
          <h3
            className="text-sm font-semibold text-th-text-primary truncate flex-1 mr-2 cursor-pointer hover:text-th-accent-600"
            onClick={onEdit}
          >
            {template.name}
          </h3>
          <Dropdown
            align="right"
            trigger={
              <button title="Template actions" className="p-1 text-th-text-tertiary hover:text-th-text-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </button>
            }
          >
            <button
              onClick={onEdit}
              className="w-full text-left px-3 py-1.5 text-sm text-th-text-secondary hover:bg-surface-secondary flex items-center gap-2"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={onDuplicate}
              className="w-full text-left px-3 py-1.5 text-sm text-th-text-secondary hover:bg-surface-secondary flex items-center gap-2"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicate
            </button>
            <button
              onClick={onPreview}
              className="w-full text-left px-3 py-1.5 text-sm text-th-text-secondary hover:bg-surface-secondary flex items-center gap-2"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <hr className="my-1 border-th-border" />
            <button
              onClick={onDelete}
              className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-surface-secondary flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </Dropdown>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <TypeBadge type={template.template_type} />
          <CategoryBadge category={template.category} />
        </div>

        {/* Subject line */}
        {truncatedSubject && (
          <p className="text-xs font-medium text-th-text-secondary mb-1 truncate">
            Subject: {truncatedSubject}
          </p>
        )}

        {/* Body preview */}
        <p className="text-xs text-th-text-tertiary leading-relaxed line-clamp-3">
          {truncatedBody}
        </p>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 border-t border-th-border bg-surface-secondary/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-th-text-tertiary">
            <span className="flex items-center gap-1">
              <Send className="w-3 h-3" />
              {template.usage_count || 0}
            </span>
            {template.open_rate != null && template.open_rate > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {template.open_rate.toFixed(0)}%
              </span>
            )}
            {template.click_rate != null && template.click_rate > 0 && (
              <span className="flex items-center gap-1">
                <MousePointerClick className="w-3 h-3" />
                {template.click_rate.toFixed(0)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {template.last_used_at && (
              <span className="text-[10px] text-th-text-tertiary">
                {new Date(template.last_used_at).toLocaleDateString()}
              </span>
            )}
            <button
              onClick={onToggleActive}
              title={template.is_active ? 'Deactivate template' : 'Activate template'}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                template.is_active ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  template.is_active ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Template Editor Modal (Full-screen, Two-pane)
// =============================================================================

function TemplateEditorModal({
  open,
  onClose,
  template,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  template: ExtendedTemplate | null;
  onSuccess: () => void;
}) {
  const { templateService } = useCRM();
  const isEdit = !!template;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState<TemplateType>('email');
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  // Reset form when template or open state changes
  useEffect(() => {
    if (open) {
      setName(template?.name || '');
      setDescription(template?.description || '');
      setTemplateType(template?.template_type || 'email');
      setCategory(template?.category || 'general');
      setSubject(template?.subject || '');
      setBody(template?.body || '');
      setIsActive(template?.is_active !== false);
    }
  }, [open, template]);

  const insertMergeField = useCallback(
    (key: string, target: 'body' | 'subject' = 'body') => {
      const token = `{{${key}}}`;
      if (target === 'subject' && subjectRef.current) {
        const el = subjectRef.current;
        const start = el.selectionStart ?? subject.length;
        const end = el.selectionEnd ?? subject.length;
        const newVal = subject.slice(0, start) + token + subject.slice(end);
        setSubject(newVal);
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(start + token.length, start + token.length);
        });
      } else if (bodyRef.current) {
        const el = bodyRef.current;
        const start = el.selectionStart ?? body.length;
        const end = el.selectionEnd ?? body.length;
        const newVal = body.slice(0, start) + token + body.slice(end);
        setBody(newVal);
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(start + token.length, start + token.length);
        });
      }
    },
    [subject, body]
  );

  const renderPreview = useCallback(
    (text: string) => {
      let rendered = text;
      for (const [key, value] of Object.entries(SAMPLE_LEAD_DATA)) {
        rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
      return rendered;
    },
    []
  );

  const showSubject = templateType === 'email' || templateType === 'both';

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (!body.trim()) {
      toast.error('Template body is required');
      return;
    }
    if (showSubject && !subject.trim()) {
      toast.error('Subject line is required for email templates');
      return;
    }

    setSaving(true);
    try {
      const detectedVars = MERGE_FIELDS.filter(
        (v) => body.includes(`{{${v.key}}}`) || subject.includes(`{{${v.key}}}`)
      );

      const input = {
        name: name.trim(),
        description: description.trim() || undefined,
        template_type: templateType,
        category,
        subject: showSubject ? subject.trim() : undefined,
        body: body.trim(),
        variables: detectedVars,
        is_active: isActive,
      };

      const result = isEdit
        ? await templateService.updateTemplate(template!.id, input)
        : await templateService.createTemplate(input);

      if (!result.success) {
        toast.error(result.error || `Failed to ${isEdit ? 'update' : 'create'} template`);
        return;
      }

      toast.success(isEdit ? 'Template updated' : 'Template created');
      onSuccess();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsNew = async () => {
    if (!name.trim() || !body.trim()) {
      toast.error('Name and body are required');
      return;
    }

    setSaving(true);
    try {
      const detectedVars = MERGE_FIELDS.filter(
        (v) => body.includes(`{{${v.key}}}`) || subject.includes(`{{${v.key}}}`)
      );

      const result = await templateService.createTemplate({
        name: `${name.trim()} (v${(template?.version || 1) + 1})`,
        description: description.trim() || undefined,
        template_type: templateType,
        category,
        subject: showSubject ? subject.trim() : undefined,
        body: body.trim(),
        variables: detectedVars,
        is_active: isActive,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to create new version');
        return;
      }

      toast.success('Saved as new version');
      onSuccess();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-stretch">
      <div className="flex flex-col w-full h-full bg-surface-primary">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-th-border bg-surface-secondary">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-th-text-primary">
              {isEdit ? 'Edit Template' : 'Create Template'}
            </h2>
            {template?.version != null && (
              <span className="text-xs bg-surface-tertiary text-th-text-tertiary px-2 py-0.5 rounded-full">
                v{template.version}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-tertiary transition-colors"
            >
              Cancel
            </button>
            {isEdit && (
              <button
                onClick={handleSaveAsNew}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-th-accent-600 border border-th-accent-600 rounded-lg hover:bg-th-accent-600/10 transition-colors disabled:opacity-50"
              >
                <FilePlus2 className="w-4 h-4" />
                Save as New Version
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Two-Pane Content */}
        <div className="flex flex-1 min-h-0">
          {/* Left Pane: Form */}
          <div className="w-1/2 border-r border-th-border overflow-y-auto p-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Initial Pitch - Enterprise"
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-600/50 focus:border-th-accent-600"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of when to use this template"
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-600/50 focus:border-th-accent-600"
              />
            </div>

            {/* Type + Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="editor-type" className="block text-sm font-medium text-th-text-secondary mb-1">Type</label>
                <select
                  id="editor-type"
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value as TemplateType)}
                  className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600/50"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label htmlFor="editor-category" className="block text-sm font-medium text-th-text-secondary mb-1">
                  Category
                </label>
                <select
                  id="editor-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600/50"
                >
                  {CATEGORY_OPTIONS.filter((c) => c.value).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject */}
            {showSubject && (
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  ref={subjectRef}
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. {{first_name}}, quick question about {{company}}"
                  className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-600/50 focus:border-th-accent-600"
                />
              </div>
            )}

            {/* Merge Fields Toolbar */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-2">
                <Variable className="w-3.5 h-3.5 inline mr-1" />
                Merge Fields
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MERGE_FIELDS.map((field) => (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() => insertMergeField(field.key)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    <span>{`{{${field.key}}}`}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Body <span className="text-red-500">*</span>
              </label>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={14}
                placeholder="Write your template content here. Use merge fields like {{first_name}} to personalize..."
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-600/50 focus:border-th-accent-600 resize-y font-mono"
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-th-text-secondary">Active</label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                title={isActive ? 'Set inactive' : 'Set active'}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right Pane: Live Preview */}
          <div className="w-1/2 overflow-y-auto bg-surface-secondary/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-th-text-secondary">Live Preview</h3>
              <span className="text-xs text-th-text-tertiary flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Sample data applied
              </span>
            </div>

            {/* Email Preview Chrome */}
            <div className="bg-surface-primary border border-th-border rounded-xl overflow-hidden shadow-sm">
              {/* Email header */}
              <div className="px-5 py-3 border-b border-th-border bg-surface-secondary/50">
                <div className="flex items-center gap-2 text-xs text-th-text-tertiary mb-1">
                  <span className="font-medium text-th-text-secondary">To:</span>
                  <span>{SAMPLE_LEAD_DATA.email}</span>
                </div>
                {showSubject && subject && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-th-text-primary">
                      {renderPreview(subject)}
                    </span>
                  </div>
                )}
              </div>

              {/* Email body */}
              <div className="px-5 py-4">
                {body ? (
                  <div className="text-sm text-th-text-secondary whitespace-pre-wrap leading-relaxed">
                    {renderPreview(body)}
                  </div>
                ) : (
                  <p className="text-sm text-th-text-tertiary italic">
                    Start typing in the body field to see a live preview...
                  </p>
                )}
              </div>
            </div>

            {/* Variables Used */}
            {body && (
              <div className="mt-4 p-3 bg-surface-primary border border-th-border rounded-lg">
                <h4 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-2">
                  Detected Merge Fields
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {MERGE_FIELDS.filter(
                    (v) => body.includes(`{{${v.key}}}`) || subject.includes(`{{${v.key}}}`)
                  ).map((v) => (
                    <span
                      key={v.key}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {v.label}
                    </span>
                  ))}
                  {MERGE_FIELDS.filter(
                    (v) => body.includes(`{{${v.key}}}`) || subject.includes(`{{${v.key}}}`)
                  ).length === 0 && (
                    <span className="text-xs text-th-text-tertiary italic">
                      No merge fields detected
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// =============================================================================
// Template Preview Modal
// =============================================================================

function TemplatePreviewModal({
  open,
  onClose,
  template,
}: {
  open: boolean;
  onClose: () => void;
  template: ExtendedTemplate | null;
}) {
  const { templateService } = useCRM();
  const [previewWidth, setPreviewWidth] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !template) return null;

  const renderPreview = (text: string) => {
    return templateService.renderTemplate(text, SAMPLE_LEAD_DATA);
  };

  const handleCopyToClipboard = () => {
    const rendered = renderPreview(template.body);
    navigator.clipboard.writeText(rendered);
    toast.success('Template copied to clipboard');
  };

  const showSubject = template.template_type === 'email' || template.template_type === 'both';

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-primary border border-th-border rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-th-border">
          <div>
            <h2 className="text-lg font-semibold text-th-text-primary">{template.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <TypeBadge type={template.template_type} />
              <CategoryBadge category={template.category} />
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close preview"
            className="p-2 text-th-text-tertiary hover:text-th-text-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview width toggle */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-th-border bg-surface-secondary/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewWidth('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                previewWidth === 'desktop'
                  ? 'bg-th-accent-600 text-white'
                  : 'text-th-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop
            </button>
            <button
              onClick={() => setPreviewWidth('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                previewWidth === 'mobile'
                  ? 'bg-th-accent-600 text-white'
                  : 'text-th-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile
            </button>
          </div>
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-th-accent-600 border border-th-accent-600 rounded-lg hover:bg-th-accent-600/10 transition-colors"
          >
            <Clipboard className="w-3.5 h-3.5" />
            Use Template
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-secondary/30 flex justify-center">
          <div
            className={`bg-surface-primary border border-th-border rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${
              previewWidth === 'mobile' ? 'w-[375px]' : 'w-full max-w-2xl'
            }`}
          >
            {/* Email chrome */}
            <div className="px-5 py-3 border-b border-th-border bg-surface-secondary/50">
              <div className="flex items-center gap-2 text-xs text-th-text-tertiary mb-1">
                <span className="font-medium text-th-text-secondary">To:</span>
                <span>{SAMPLE_LEAD_DATA.email}</span>
              </div>
              {showSubject && template.subject && (
                <p className="text-sm font-medium text-th-text-primary">
                  {renderPreview(template.subject)}
                </p>
              )}
            </div>
            <div className="px-5 py-4 text-sm text-th-text-secondary whitespace-pre-wrap leading-relaxed">
              {renderPreview(template.body)}
            </div>
          </div>
        </div>

        {/* Performance footer */}
        {(template.total_sent != null && template.total_sent > 0) && (
          <div className="px-6 py-3 border-t border-th-border bg-surface-secondary/50">
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-xs text-th-text-tertiary">Sent</p>
                <p className="text-sm font-semibold text-th-text-primary">{template.total_sent}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-th-text-tertiary">Used</p>
                <p className="text-sm font-semibold text-th-text-primary">{template.usage_count}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-th-text-tertiary">Open Rate</p>
                <PerformanceIndicator score={template.open_rate} />
              </div>
              <div className="text-center">
                <p className="text-xs text-th-text-tertiary">Click Rate</p>
                <PerformanceIndicator score={template.click_rate} />
              </div>
              <div className="text-center">
                <p className="text-xs text-th-text-tertiary">Performance</p>
                <PerformanceIndicator score={template.performance_score} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// =============================================================================
// Performance Analytics Panel
// =============================================================================

function AnalyticsPanel({
  templates,
  onClose,
}: {
  templates: ExtendedTemplate[];
  onClose: () => void;
}) {
  const sorted = useMemo(
    () =>
      [...templates]
        .filter((t) => (t.total_sent ?? 0) > 0 || t.usage_count > 0)
        .sort((a, b) => (b.performance_score ?? 0) - (a.performance_score ?? 0)),
    [templates]
  );

  return (
    <div className="bg-surface-primary border border-th-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-th-border">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-th-accent-600" />
          <h3 className="text-sm font-semibold text-th-text-primary">Performance Analytics</h3>
        </div>
        <button
          onClick={onClose}
          title="Close analytics"
          className="p-1 text-th-text-tertiary hover:text-th-text-secondary rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="p-8 text-center">
          <TrendingUp className="w-8 h-8 text-th-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-th-text-tertiary">
            No performance data yet. Start using templates to see analytics.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-th-border max-h-96 overflow-y-auto">
          {sorted.map((t) => (
            <div key={t.id} className="px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h4 className="text-sm font-medium text-th-text-primary truncate">{t.name}</h4>
                  <CategoryBadge category={t.category} />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-th-text-tertiary">{t.usage_count} uses</span>
                  <PerformanceIndicator score={t.performance_score} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <RateBar label="Open Rate" value={t.open_rate} />
                <RateBar label="Click Rate" value={t.click_rate} />
                <RateBar
                  label="Reply Rate"
                  value={
                    t.total_sent && t.total_sent > 0
                      ? ((t.reply_count ?? 0) / t.total_sent) * 100
                      : 0
                  }
                />
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-th-text-tertiary">Total Sent</span>
                    <span className="font-medium text-th-text-secondary">{t.total_sent ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-th-text-tertiary">Replies</span>
                    <span className="font-medium text-th-text-secondary">{t.reply_count ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Templates Page
// =============================================================================

type TemplatesTab = 'my' | 'master';

export default function Templates() {
  const { can } = useOrg();
  const [activeTab, setActiveTab] = useState<TemplatesTab>('my');
  const hasMasterPerm = can('templates.master.manage');

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-surface-secondary rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('my')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'my'
              ? 'bg-surface-primary text-th-accent-700 shadow-sm'
              : 'text-th-text-tertiary hover:text-th-text-secondary'
          }`}
        >
          <Mail className="w-4 h-4" />
          My Templates
        </button>
        {hasMasterPerm && (
          <button
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'master'
                ? 'bg-surface-primary text-th-accent-700 shadow-sm'
                : 'text-th-text-tertiary hover:text-th-text-secondary'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Master Library
          </button>
        )}
      </div>

      {activeTab === 'my' ? (
        <MyTemplatesTab />
      ) : hasMasterPerm ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12 text-th-text-tertiary">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
            </div>
          }
        >
          <MasterTemplates />
        </Suspense>
      ) : null}
    </div>
  );
}

function MyTemplatesTab() {
  const { templateService, supabase } = useCRM();
  const { activeOrgId } = useOrg();

  // Data state
  const [templates, setTemplates] = useState<ExtendedTemplate[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('updated_at');

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Modal state
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editTemplate, setEditTemplate] = useState<ExtendedTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ExtendedTemplate | null>(null);

  // Debounced search
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // ----- Data Loading -----

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const filters: TemplateFilters = {};
      if (typeFilter) filters.template_type = typeFilter as TemplateType;
      if (statusFilter === 'active') filters.is_active = true;
      else if (statusFilter === 'inactive') filters.is_active = false;
      if (debouncedSearch) filters.search = debouncedSearch;

      // If filtering by a category folder, add category filter
      if (selectedFolderId?.startsWith('cat:')) {
        filters.category = selectedFolderId.replace('cat:', '');
      } else if (categoryFilter) {
        filters.category = categoryFilter;
      }

      const data = await templateService.listTemplates(filters);
      setTemplates(data as unknown as ExtendedTemplate[]);
    } catch (err) {
      console.error('Failed to load templates:', err);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [templateService, typeFilter, statusFilter, categoryFilter, debouncedSearch, selectedFolderId]);

  const loadFolders = useCallback(async () => {
    if (!activeOrgId) return;
    try {
      const { data } = await supabase
        .from('crm_template_folders')
        .select('id, org_id, name, description, parent_folder_id, color, created_by, created_at, updated_at')
        .eq('org_id', activeOrgId)
        .order('name');
      if (data) setFolders(data);
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  }, [supabase, activeOrgId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  // ----- Sorted and Filtered Templates -----

  const sortedTemplates = useMemo(() => {
    let filtered = [...templates];

    // Filter by folder
    if (selectedFolderId?.startsWith('folder:')) {
      const folderId = selectedFolderId.replace('folder:', '');
      filtered = filtered.filter((t) => (t as ExtendedTemplate).folder_id === folderId);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage_count':
          return (b.usage_count || 0) - (a.usage_count || 0);
        case 'performance_score':
          return ((b as ExtendedTemplate).performance_score ?? 0) - ((a as ExtendedTemplate).performance_score ?? 0);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'last_used_at':
          return (
            new Date(b.last_used_at || '1970-01-01').getTime() -
            new Date(a.last_used_at || '1970-01-01').getTime()
          );
        case 'updated_at':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return filtered;
  }, [templates, sortBy, selectedFolderId]);

  // ----- Handlers -----

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template? This action cannot be undone.')) return;
    const result = await templateService.deleteTemplate(id);
    if (result.success) {
      toast.success('Template deleted');
      loadTemplates();
    } else {
      toast.error(result.error || 'Failed to delete');
    }
  };

  const handleDuplicate = async (id: string) => {
    const result = await templateService.duplicateTemplate(id);
    if (result.success) {
      toast.success('Template duplicated');
      loadTemplates();
    } else {
      toast.error(result.error || 'Failed to duplicate');
    }
  };

  const handleToggleActive = async (template: ExtendedTemplate) => {
    const result = await templateService.updateTemplate(template.id, {
      is_active: !template.is_active,
    });
    if (result.success) {
      toast.success(template.is_active ? 'Template deactivated' : 'Template activated');
      loadTemplates();
    }
  };

  const openCreate = () => {
    setEditTemplate(null);
    setShowEditor(true);
  };

  const openEdit = (template: ExtendedTemplate) => {
    setEditTemplate(template);
    setShowEditor(true);
  };

  const openPreview = (template: ExtendedTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  // ----- Folder Handlers -----

  const handleCreateFolder = async () => {
    const name = prompt('Folder name:');
    if (!name?.trim() || !activeOrgId) return;
    try {
      const { error } = await supabase.from('crm_template_folders').insert({
        org_id: activeOrgId,
        name: name.trim(),
      });
      if (error) throw error;
      toast.success('Folder created');
      loadFolders();
    } catch {
      toast.error('Failed to create folder');
    }
  };

  const handleRenameFolder = async (folder: TemplateFolder) => {
    const name = prompt('Rename folder:', folder.name);
    if (!name?.trim() || name === folder.name) return;
    try {
      const { error } = await supabase
        .from('crm_template_folders')
        .update({ name: name.trim() })
        .eq('id', folder.id);
      if (error) throw error;
      toast.success('Folder renamed');
      loadFolders();
    } catch {
      toast.error('Failed to rename folder');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Delete this folder? Templates inside will be unfiled, not deleted.')) return;
    try {
      // Unfile templates first
      await supabase.from('crm_templates').update({ folder_id: null }).eq('folder_id', id);
      const { error } = await supabase.from('crm_template_folders').delete().eq('id', id);
      if (error) throw error;
      toast.success('Folder deleted');
      if (selectedFolderId === `folder:${id}`) setSelectedFolderId(null);
      loadFolders();
      loadTemplates();
    } catch {
      toast.error('Failed to delete folder');
    }
  };

  // ----- Render -----

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Pitch Templates</h1>
          <p className="text-sm text-th-text-tertiary mt-1">
            Craft, organize, and track your sales pitch templates for maximum outreach impact.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showAnalytics
                ? 'bg-th-accent-600/10 text-th-accent-600 border-th-accent-600'
                : 'text-th-text-secondary border-th-border hover:bg-surface-secondary'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <PermissionGate permission="settings.manage">
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          </PermissionGate>
        </div>
      </div>

      <HelpBanner pageKey="templates" title="Welcome to Templates" tip="Create reusable email and document templates. Use merge fields to personalize content automatically. Templates save time and ensure consistent messaging." />

      {/* Analytics Panel */}
      {showAnalytics && (
        <AnalyticsPanel templates={templates} onClose={() => setShowAnalytics(false)} />
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center bg-surface-primary border border-th-border rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-th-text-tertiary mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-th-text-primary placeholder-th-text-tertiary"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} title="Clear search" className="ml-1 text-th-text-tertiary hover:text-th-text-secondary">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="bg-surface-primary border border-th-border rounded-lg px-3 py-2 text-sm text-th-text-secondary"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Type */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by type"
          className="bg-surface-primary border border-th-border rounded-lg px-3 py-2 text-sm text-th-text-secondary"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="bg-surface-primary border border-th-border rounded-lg px-3 py-2 text-sm text-th-text-secondary"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <div className="flex items-center gap-1.5 bg-surface-primary border border-th-border rounded-lg px-3 py-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-th-text-tertiary" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            aria-label="Sort templates"
            className="bg-transparent border-none outline-none text-sm text-th-text-secondary"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-surface-primary border border-th-border rounded-lg overflow-hidden ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-th-accent-600 text-white'
                : 'text-th-text-tertiary hover:text-th-text-secondary'
            }`}
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-th-accent-600 text-white'
                : 'text-th-text-tertiary hover:text-th-text-secondary'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content: Sidebar + Templates */}
      <div className="flex gap-5">
        {/* Folder Sidebar */}
        <FolderSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          templates={templates}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
        />

        {/* Templates Area */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
            </div>
          ) : sortedTemplates.length === 0 ? (
            <EmptyState onCreateClick={openCreate} />
          ) : viewMode === 'grid' ? (
            /* ---- Grid View ---- */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={() => openEdit(template)}
                  onDuplicate={() => handleDuplicate(template.id)}
                  onDelete={() => handleDelete(template.id)}
                  onPreview={() => openPreview(template)}
                  onToggleActive={() => handleToggleActive(template)}
                />
              ))}
            </div>
          ) : (
            /* ---- List View ---- */
            <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
              <table className="min-w-full divide-y divide-th-border">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                      Last Used
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border">
                  {sortedTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="min-w-0">
                          <p
                            className="text-sm font-medium text-th-text-primary truncate max-w-[240px] cursor-pointer hover:text-th-accent-600"
                            onClick={() => openEdit(template)}
                          >
                            {template.name}
                          </p>
                          {template.subject && (
                            <p className="text-xs text-th-text-tertiary truncate max-w-[240px] mt-0.5">
                              {template.subject}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <TypeBadge type={template.template_type} />
                      </td>
                      <td className="px-5 py-3">
                        <CategoryBadge category={template.category} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-sm text-th-text-secondary">
                          {template.usage_count || 0}
                          {(template.total_sent ?? 0) > 0 && (
                            <span className="text-xs text-th-text-tertiary ml-1">
                              ({template.total_sent} sent)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <PerformanceIndicator score={template.performance_score} />
                          {template.open_rate != null && template.open_rate > 0 && (
                            <span className="text-[10px] text-th-text-tertiary">
                              {template.open_rate.toFixed(0)}% open
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-th-text-tertiary">
                        {template.last_used_at ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(template.last_used_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-xs">Never</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleToggleActive(template)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            template.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {template.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openPreview(template)}
                            className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary rounded transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(template)}
                            className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(template.id)}
                            className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary rounded transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="p-1.5 text-th-text-tertiary hover:text-red-600 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Template count footer */}
          {!loading && sortedTemplates.length > 0 && (
            <div className="flex items-center justify-between mt-3 px-1">
              <p className="text-xs text-th-text-tertiary">
                Showing {sortedTemplates.length} template{sortedTemplates.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-th-text-tertiary">
                {templates.filter((t) => t.is_active).length} active ·{' '}
                {templates.filter((t) => !t.is_active).length} inactive
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TemplateEditorModal
        open={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditTemplate(null);
        }}
        template={editTemplate}
        onSuccess={loadTemplates}
      />

      <TemplatePreviewModal
        open={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewTemplate(null);
        }}
        template={previewTemplate}
      />
    </>
  );
}
