import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  GripVertical,
  Inbox,
  Download,
  ChevronDown,
  ChevronRight,
  Settings as SettingsIcon,
  Type,
  Mail,
  Phone,
  AlignLeft,
  List,
  CheckSquare,
  Circle,
  FileUp,
  Calendar,
  EyeOff,
  X,
  Pencil,
  FileText,
  Code,
  Copy,
  Check,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  formBuilderService,
  type CmsForm,
  type FormField,
  type FormSubmission,
  type CmsFormCreateInput,
  type FormFieldType,
} from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';

// ── Field type config ────────────────────────────────────────────────────────

const FIELD_TYPES: { type: FormFieldType; label: string; icon: typeof Type }[] = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'textarea', label: 'Textarea', icon: AlignLeft },
  { type: 'select', label: 'Select', icon: List },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'radio', label: 'Radio', icon: Circle },
  { type: 'file', label: 'File Upload', icon: FileUp },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'hidden', label: 'Hidden', icon: EyeOff },
];

function getFieldIcon(type: FormFieldType) {
  return FIELD_TYPES.find((f) => f.type === type)?.icon || Type;
}

// ── Embed Code Modal ─────────────────────────────────────────────────────────

function EmbedCodeModal({
  form,
  onClose,
}: {
  form: { id: string; slug: string | null };
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'iframe' | 'script' | 'react'>('iframe');
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const { iframe, script, react } = formBuilderService.generateEmbedCode(form, baseUrl);

  const codeMap = { iframe, script, react };
  const code = codeMap[tab];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Embed Code</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-4">
            {([
              { key: 'iframe' as const, label: 'iFrame' },
              { key: 'script' as const, label: 'JavaScript' },
              { key: 'react' as const, label: 'React' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setCopied(false); }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  tab === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 text-xs p-4 rounded-lg overflow-x-auto max-h-64">
              <code>{code}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            {tab === 'iframe'
              ? 'Paste this HTML snippet where you want the form to appear.'
              : tab === 'script'
                ? 'This script creates an auto-resizing iframe. Paste it where you want the form.'
                : 'Install @mpbhealth/form-embed and use this React component in your app.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function generateId() {
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ── Sortable field item ──────────────────────────────────────────────────────

function SortableFieldItem({
  field,
  isSelected,
  onSelect,
  onRemove,
}: {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const Icon = getFieldIcon(field.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <button
        type="button"
        className="cursor-grab text-gray-400 hover:text-gray-600 shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <Icon size={16} className="text-gray-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{field.label || 'Untitled'}</p>
        <p className="text-xs text-gray-500">
          {field.type}
          {field.required && ' · required'}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-gray-400 hover:text-red-500 shrink-0"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Field settings panel ─────────────────────────────────────────────────────

function FieldSettingsPanel({
  field,
  onChange,
}: {
  field: FormField;
  onChange: (updated: FormField) => void;
}) {
  const hasOptions = field.type === 'select' || field.type === 'radio';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Field label"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name (key)</label>
        <input
          type="text"
          value={field.name}
          onChange={(e) =>
            onChange({ ...field, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="field_name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          value={field.type}
          onChange={(e) => onChange({ ...field, type: e.target.value as FormFieldType })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {FIELD_TYPES.map((ft) => (
            <option key={ft.type} value={ft.type}>
              {ft.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
        <input
          type="text"
          value={field.placeholder || ''}
          onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Placeholder text"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Required</span>
        <button
          type="button"
          onClick={() => onChange({ ...field, required: !field.required })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            field.required ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              field.required ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {hasOptions && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Options (one per line)
          </label>
          <textarea
            value={(field.options || []).join('\n')}
            onChange={(e) =>
              onChange({
                ...field,
                options: e.target.value.split('\n').filter((l) => l.trim()),
              })
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={'Option 1\nOption 2\nOption 3'}
          />
        </div>
      )}

      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Validation</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Min length</label>
            <input
              type="number"
              min={0}
              value={field.validation?.minLength ?? ''}
              onChange={(e) =>
                onChange({
                  ...field,
                  validation: {
                    ...field.validation,
                    minLength: e.target.value ? parseInt(e.target.value) : undefined,
                  },
                })
              }
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max length</label>
            <input
              type="number"
              min={0}
              value={field.validation?.maxLength ?? ''}
              onChange={(e) =>
                onChange({
                  ...field,
                  validation: {
                    ...field.validation,
                    maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                  },
                })
              }
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Pattern (regex)</label>
          <input
            type="text"
            value={field.validation?.pattern || ''}
            onChange={(e) =>
              onChange({
                ...field,
                validation: { ...field.validation, pattern: e.target.value || undefined },
              })
            }
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="^[A-Za-z]+$"
          />
        </div>
      </div>
    </div>
  );
}

// ── Submissions table ────────────────────────────────────────────────────────

function SubmissionsInbox({
  form,
  onBack,
}: {
  form: CmsForm;
  onBack: () => void;
}) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await formBuilderService.getSubmissions(form.id);
      setSubmissions(data);
    } catch (e) {
      toast.error(`Failed to load submissions: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  }, [form.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this submission?')) return;
    try {
      await formBuilderService.deleteSubmission(id);
      setSubmissions((s) => s.filter((sub) => sub.id !== id));
      toast.success('Submission deleted');
    } catch {
      toast.error('Failed to delete submission');
    }
  };

  const handleExport = async () => {
    try {
      const csv = await formBuilderService.exportSubmissionsCsv(form.id);
      if (!csv) {
        toast.error('No submissions to export');
        return;
      }
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.slug || form.name}-submissions.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const fieldNames = form.fields.map((f) => f.name);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Submissions</h2>
            <p className="text-sm text-gray-500">
              {form.name} — {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No submissions yet</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8" />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {fieldNames.slice(0, 3).map((name) => (
                  <th
                    key={name}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {name}
                  </th>
                ))}
                <th className="w-16" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((sub) => {
                const isExpanded = expandedId === sub.id;
                return (
                  <SubmissionRow
                    key={sub.id}
                    submission={sub}
                    fieldNames={fieldNames}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : sub.id)}
                    onDelete={() => handleDelete(sub.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SubmissionRow({
  submission,
  fieldNames,
  isExpanded,
  onToggle,
  onDelete,
}: {
  submission: FormSubmission;
  fieldNames: string[];
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={onToggle}>
        <td className="pl-3 py-3">
          {isExpanded ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
          {formatDateTime(submission.created_at)}
        </td>
        <td className="px-4 py-3">
          {(() => {
            const s = (submission as FormSubmission).status || 'new';
            const statusColors: Record<string, string> = {
              new: 'bg-blue-100 text-blue-700',
              converted: 'bg-green-100 text-green-700',
              duplicate: 'bg-amber-100 text-amber-700',
              spam: 'bg-red-100 text-red-700',
            };
            return (
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s] || statusColors.new}`}>
                {s}
              </span>
            );
          })()}
        </td>
        {fieldNames.slice(0, 3).map((name) => (
          <td key={name} className="px-4 py-3 text-sm text-gray-900 truncate max-w-[200px]">
            {String(submission.data[name] ?? '')}
          </td>
        ))}
        <td className="px-4 py-3 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={fieldNames.slice(0, 3).length + 4} className="bg-gray-50 px-6 py-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm max-w-2xl">
              {Object.entries(submission.data).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium text-gray-600">{key}:</span>{' '}
                  <span className="text-gray-900">{String(value ?? '')}</span>
                </div>
              ))}
              {submission.ip_address && (
                <div>
                  <span className="font-medium text-gray-600">IP:</span>{' '}
                  <span className="text-gray-900">{submission.ip_address}</span>
                </div>
              )}
              {(submission as FormSubmission).lead_id && (
                <div>
                  <span className="font-medium text-gray-600">Lead ID:</span>{' '}
                  <span className="text-gray-900 font-mono text-xs">{(submission as FormSubmission).lead_id}</span>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Form editor ──────────────────────────────────────────────────────────────

function FormEditor({
  formId,
  onBack,
}: {
  formId: string | null;
  onBack: () => void;
}) {
  const { user } = useAdmin();
  const [form, setForm] = useState<CmsForm | null>(null);
  const [loading, setLoading] = useState(!!formId);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [notificationEmails, setNotificationEmails] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [status, setStatus] = useState<CmsForm['status']>('draft');
  const [entityType, setEntityType] = useState<CmsForm['entity_type']>('lead');
  const [showSettings, setShowSettings] = useState(false);
  const [viewSubmissions, setViewSubmissions] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    if (!formId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await formBuilderService.getForm(formId);
        if (data) {
          setForm(data);
          setName(data.name);
          setSlug(data.slug || '');
          setFields(data.fields || []);
          setNotificationEmails((data.notification_emails || []).join(', '));
          setSuccessMessage(data.settings?.success_message || '');
          setRedirectUrl(data.settings?.redirect_url || '');
          setStatus(data.status || 'draft');
          setEntityType(data.entity_type || 'lead');
        }
      } catch (e) {
        toast.error(`Failed to load form: ${e instanceof Error ? e.message : 'Unknown'}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [formId]);

  const selectedField = useMemo(
    () => fields.find((f) => f.id === selectedFieldId) || null,
    [fields, selectedFieldId],
  );

  const addField = (type: FormFieldType) => {
    const label = FIELD_TYPES.find((ft) => ft.type === type)?.label || type;
    const newField: FormField = {
      id: generateId(),
      type,
      label,
      name: slugify(label),
      required: false,
      placeholder: '',
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (updated: FormField) => {
    setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields((prev) => {
      const oldIdx = prev.findIndex((f) => f.id === active.id);
      const newIdx = prev.findIndex((f) => f.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Form name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        fields,
        status,
        entity_type: entityType,
        settings: {
          success_message: successMessage || undefined,
          redirect_url: redirectUrl || undefined,
        },
        notification_emails: notificationEmails
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
      };
      if (formId && form) {
        const updated = await formBuilderService.updateForm(formId, payload);
        setForm(updated);
        toast.success('Form saved');
      } else {
        const created = await formBuilderService.createForm({
          ...payload,
          created_by: user?.id || null,
        } as CmsFormCreateInput);
        setForm(created);
        toast.success('Form created');
        window.history.replaceState(null, '', `/cms/forms/${created.id}`);
      }
    } catch (e) {
      toast.error(`Save failed: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (viewSubmissions && form) {
    return <SubmissionsInbox form={form} onBack={() => setViewSubmissions(false)} />;
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {form ? 'Edit Form' : 'New Form'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {form && (
            <>
              <button
                onClick={() => setViewSubmissions(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Inbox size={16} />
                Submissions
              </button>
              <button
                onClick={() => setShowEmbedCode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Code size={16} />
                Embed
              </button>
            </>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showSettings
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SettingsIcon size={16} />
            Settings
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>
      </div>

      {/* Name & Slug */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Form Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!form) setSlug(slugify(e.target.value));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Contact Us"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="contact-us"
          />
        </div>
      </div>

      {/* Settings panel (collapsible) */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Form Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CmsForm['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Type</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as CmsForm['entity_type'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="lead">Lead</option>
                <option value="contact">Contact</option>
                <option value="quote_request">Quote Request</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notification Emails (comma-separated)
            </label>
            <input
              type="text"
              value={notificationEmails}
              onChange={(e) => setNotificationEmails(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="admin@example.com, support@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Success Message</label>
            <input
              type="text"
              value={successMessage}
              onChange={(e) => setSuccessMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Thank you for your submission!"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URL</label>
            <input
              type="text"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/thank-you"
            />
          </div>
        </div>
      )}

      {/* Field builder: two-pane layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: field list + add */}
        <div className="col-span-5 space-y-4">
          {/* Field type picker */}
          <div className="border border-gray-200 rounded-lg p-3 bg-white">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Add Field
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => addField(type)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  title={label}
                >
                  <Icon size={18} />
                  <span className="text-[10px] leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sortable field list */}
          <div className="space-y-1.5">
            {fields.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                Click a field type above to add fields
              </div>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field) => (
                  <SortableFieldItem
                    key={field.id}
                    field={field}
                    isSelected={selectedFieldId === field.id}
                    onSelect={() => setSelectedFieldId(field.id)}
                    onRemove={() => removeField(field.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Right: selected field settings */}
        <div className="col-span-7">
          {selectedField ? (
            <div className="border border-gray-200 rounded-lg p-4 bg-white sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Field Settings</h3>
                <button
                  onClick={() => setSelectedFieldId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
              <FieldSettingsPanel
                field={selectedField}
                onChange={updateField}
              />
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
              <Pencil className="mx-auto mb-2" size={32} />
              <p className="text-sm">Select a field to edit its settings</p>
            </div>
          )}
        </div>
      </div>

      {showEmbedCode && form && (
        <EmbedCodeModal
          form={{ id: form.id, slug: form.slug }}
          onClose={() => setShowEmbedCode(false)}
        />
      )}
    </div>
  );
}

// ── Forms list ───────────────────────────────────────────────────────────────

function FormsList({
  onSelect,
  onCreate,
}: {
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  const [forms, setForms] = useState<CmsForm[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await formBuilderService.getForms();
      setForms(data);
    } catch (e) {
      toast.error(`Failed to load forms: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its submissions?`)) return;
    try {
      await formBuilderService.deleteForm(id);
      setForms((prev) => prev.filter((f) => f.id !== id));
      toast.success('Form deleted');
    } catch {
      toast.error('Failed to delete form');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage forms, view submissions
          </p>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} />
          New Form
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 mb-4">No forms yet</p>
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={16} />
            Create your first form
          </button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fields
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submissions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forms.map((form) => {
                const statusStyles = {
                  active: 'bg-green-100 text-green-700',
                  draft: 'bg-gray-100 text-gray-600',
                  archived: 'bg-amber-100 text-amber-700',
                };
                return (
                <tr
                  key={form.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelect(form.id)}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{form.name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{form.slug || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[form.status] || statusStyles.draft}`}>
                      {form.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {(form.fields || []).length}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                      <Inbox size={14} className="text-gray-400" />
                      {form.submission_count ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(form.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelect(form.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(form.id, form.name)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main page component ──────────────────────────────────────────────────────

export default function FormBuilder() {
  const navigate = useNavigate();
  const { formId } = useParams<{ formId?: string }>();
  const [editingId, setEditingId] = useState<string | null | undefined>(formId ?? undefined);

  useEffect(() => {
    setEditingId(formId ?? undefined);
  }, [formId]);

  if (editingId !== undefined) {
    return (
      <div className="max-w-6xl mx-auto">
        <FormEditor
          formId={editingId}
          onBack={() => {
            setEditingId(undefined);
            navigate('/cms/forms');
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <FormsList
        onSelect={(id) => {
          setEditingId(id);
          navigate(`/cms/forms/${id}`);
        }}
        onCreate={() => {
          setEditingId(null);
          navigate('/cms/forms');
        }}
      />
    </div>
  );
}
