// ============================================================================
// Email Signatures Management Page
// Enterprise-grade signature management with live preview
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  Star,
  Loader2,
  FileSignature,
  Eye,
  Upload,
  X,
  AlertTriangle,
  Palette,
  Type,
  LayoutTemplate,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import type {
  EmailSignature,
  SignatureCreateInput,
  SocialLink,
} from '@mpbhealth/crm-core';
import { sanitizeHtml } from '@mpbhealth/utils';

// ============================================================================
// Constants
// ============================================================================

const FONT_OPTIONS = [
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Verdana, sans-serif',
  'Times New Roman, serif',
];

const FONT_DISPLAY_NAMES: Record<string, string> = {
  'Arial, sans-serif': 'Arial',
  'Helvetica, sans-serif': 'Helvetica',
  'Georgia, serif': 'Georgia',
  'Verdana, sans-serif': 'Verdana',
  'Times New Roman, serif': 'Times New Roman',
};

const SOCIAL_PLATFORMS: SocialLink['platform'][] = [
  'linkedin',
  'twitter',
  'facebook',
  'instagram',
  'youtube',
  'website',
];

const PLATFORM_LABELS: Record<SocialLink['platform'], string> = {
  linkedin: 'LinkedIn',
  twitter: 'Twitter / X',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  website: 'Website',
};

const DEFAULT_VARIABLES: Record<string, string> = {
  user_name: '',
  user_title: '',
  phone: '',
  email: '',
  company_name: '',
};

const DEFAULT_CONTENT = `
<table cellpadding="0" cellspacing="0" style="font-family: {{font_family}}; font-size: 14px; color: #333;">
  <tr>
    <td style="padding-right: 15px; border-right: 2px solid {{primary_color}};">
      <img src="{{logo_url}}" alt="Logo" style="max-height: 60px; max-width: 120px;">
    </td>
    <td style="padding-left: 15px;">
      <div style="font-weight: bold; font-size: 16px; color: {{primary_color}};">{{user_name}}</div>
      <div style="color: #666;">{{user_title}}</div>
      <div style="margin-top: 8px;">
        <span>{{phone}}</span>
        <span style="margin: 0 8px;">|</span>
        <a href="mailto:{{email}}" style="color: {{primary_color}}; text-decoration: none;">{{email}}</a>
      </div>
      <div style="margin-top: 4px; color: #888;">{{company_name}}</div>
    </td>
  </tr>
</table>`.trim();

// ============================================================================
// Types
// ============================================================================

interface SignatureFormState {
  name: string;
  is_default: boolean;
  content: string;
  variables: Record<string, string>;
  social_links: SocialLink[];
  font_family: string;
  primary_color: string;
  logo_url: string | null;
  logo_storage_path: string | null;
  banner_url: string | null;
  banner_storage_path: string | null;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function renderPreview(form: SignatureFormState): string {
  let html = form.content;
  const vars: Record<string, string> = { ...form.variables };

  // Inject style vars
  vars['font_family'] = form.font_family;
  vars['primary_color'] = form.primary_color;

  if (form.logo_url) {
    vars['logo_url'] = form.logo_url;
  }
  if (form.banner_url) {
    vars['banner_url'] = form.banner_url;
  }

  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    html = html.replace(regex, value || '');
  }

  return html;
}

function emptyForm(): SignatureFormState {
  return {
    name: '',
    is_default: false,
    content: DEFAULT_CONTENT,
    variables: { ...DEFAULT_VARIABLES },
    social_links: [],
    font_family: 'Arial, sans-serif',
    primary_color: '#6366F1',
    logo_url: null,
    logo_storage_path: null,
    banner_url: null,
    banner_storage_path: null,
  };
}

function signatureToForm(sig: EmailSignature): SignatureFormState {
  return {
    name: sig.name,
    is_default: sig.is_default,
    content: sig.content,
    variables: { ...DEFAULT_VARIABLES, ...sig.variables },
    social_links: [...sig.social_links],
    font_family: sig.font_family,
    primary_color: sig.primary_color,
    logo_url: sig.logo_url,
    logo_storage_path: sig.logo_storage_path,
    banner_url: sig.banner_url,
    banner_storage_path: sig.banner_storage_path,
  };
}

// ============================================================================
// Component: Delete Confirmation Dialog
// ============================================================================

function DeleteDialog({
  sigName,
  onConfirm,
  onCancel,
  deleting,
}: {
  sigName: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-primary rounded-xl border border-th-border shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-th-text-primary">
              Delete Signature
            </h3>
            <p className="text-sm text-th-text-secondary">
              This action cannot be undone.
            </p>
          </div>
        </div>
        <p className="text-sm text-th-text-secondary mb-6">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-th-text-primary">&quot;{sigName}&quot;</span>?
          Any emails currently using this signature will not be affected.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Component: Signature Card
// ============================================================================

function SignatureCard({
  signature,
  renderedHtml,
  onEdit,
  onDuplicate,
  onSetDefault,
  onDelete,
}: {
  signature: EmailSignature;
  renderedHtml: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden hover:shadow-md transition-shadow">
      {/* Preview */}
      <div className="relative h-40 overflow-hidden border-b border-th-border bg-surface-primary">
        <div
          className="absolute inset-0 p-4 pointer-events-none origin-top-left scale-[0.65]"
          style={{ width: '154%' }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderedHtml) }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80" />
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold text-th-text-primary truncate">
              {signature.name}
            </h3>
            {signature.is_default && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-th-accent-600 bg-th-accent-600/10 rounded-full">
                <Star className="w-3 h-3" />
                Default
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-th-text-tertiary mb-3">
          Updated {formatDate(signature.updated_at)}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-th-text-secondary rounded-md hover:bg-surface-secondary transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={onDuplicate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-th-text-secondary rounded-md hover:bg-surface-secondary transition-colors"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {!signature.is_default && (
            <button
              onClick={onSetDefault}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-th-text-secondary rounded-md hover:bg-surface-secondary transition-colors"
              title="Set as default"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-500 rounded-md hover:bg-red-50 transition-colors ml-auto"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Component: File Upload Field
// ============================================================================

function FileUploadField({
  label,
  accept,
  maxSizeMB,
  currentUrl,
  onUpload,
  onRemove,
  uploading,
}: {
  label: string;
  accept: string;
  maxSizeMB: number;
  currentUrl: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }
    onUpload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
        {label}
      </label>
      {currentUrl ? (
        <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg border border-th-border">
          <img
            src={currentUrl}
            alt={label}
            className="h-10 max-w-[120px] object-contain rounded"
          />
          <span className="text-xs text-th-text-tertiary flex-1 truncate">
            {currentUrl.split('/').pop()}
          </span>
          <button
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 p-1"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-th-border rounded-lg cursor-pointer hover:border-th-accent-600 hover:bg-surface-secondary transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-th-accent-600 animate-spin" />
          ) : (
            <>
              <Upload className="w-5 h-5 text-th-text-tertiary" />
              <span className="text-sm text-th-text-tertiary">
                Click to upload (max {maxSizeMB}MB)
              </span>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        aria-label={label}
      />
    </div>
  );
}

// ============================================================================
// Component: Social Links Editor
// ============================================================================

function SocialLinksEditor({
  links,
  onChange,
}: {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}) {
  const addLink = () => {
    // Pick first platform not already used, or default to 'website'
    const usedPlatforms = new Set(links.map((l) => l.platform));
    const available = SOCIAL_PLATFORMS.find((p) => !usedPlatforms.has(p)) || 'website';
    onChange([...links, { platform: available, url: '' }]);
  };

  const updateLink = (index: number, field: keyof SocialLink, value: string) => {
    const updated = links.map((link, i) =>
      i === index ? { ...link, [field]: value } : link,
    );
    onChange(updated);
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-th-text-secondary">
          Social Links
        </label>
        <button
          type="button"
          onClick={addLink}
          className="flex items-center gap-1 text-xs font-medium text-th-accent-600 hover:text-th-accent-700"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Link
        </button>
      </div>
      {links.length === 0 ? (
        <p className="text-xs text-th-text-tertiary py-2">
          No social links added yet.
        </p>
      ) : (
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={link.platform}
                onChange={(e) =>
                  updateLink(i, 'platform', e.target.value as SocialLink['platform'])
                }
                aria-label="Social platform"
                className="w-36 px-2.5 py-2 text-sm bg-surface-secondary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600"
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </select>
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateLink(i, 'url', e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 text-sm bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-600"
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                aria-label="Remove social link"
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Component: Signature Editor Modal (Full-screen slide-over)
// ============================================================================

function SignatureEditorModal({
  editingSignature,
  form,
  setForm,
  saving,
  onSave,
  onCancel,
  signatureService,
}: {
  editingSignature: EmailSignature | null;
  form: SignatureFormState;
  setForm: React.Dispatch<React.SetStateAction<SignatureFormState>>;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  signatureService: ReturnType<typeof useCRM>['signatureService'];
}) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const previewHtml = renderPreview(form);

  const handleLogoUpload = async (file: File) => {
    if (!editingSignature) {
      // For new signatures, create object URL for preview
      const url = URL.createObjectURL(file);
      setForm((f) => ({ ...f, logo_url: url, _pendingLogoFile: file } as any));
      toast.success('Logo added. Save to upload permanently.');
      return;
    }

    setUploadingLogo(true);
    try {
      const result = await signatureService.uploadLogo(editingSignature.id, file);
      setForm((f) => ({
        ...f,
        logo_url: result.url,
        logo_storage_path: result.path,
      }));
      toast.success('Logo uploaded');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (file: File) => {
    if (!editingSignature) {
      const url = URL.createObjectURL(file);
      setForm((f) => ({ ...f, banner_url: url, _pendingBannerFile: file } as any));
      toast.success('Banner added. Save to upload permanently.');
      return;
    }

    setUploadingBanner(true);
    try {
      const result = await signatureService.uploadBanner(editingSignature.id, file);
      setForm((f) => ({
        ...f,
        banner_url: result.url,
        banner_storage_path: result.path,
      }));
      toast.success('Banner uploaded');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const updateVariable = (key: string, value: string) => {
    setForm((f) => ({
      ...f,
      variables: { ...f.variables, [key]: value },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      {/* Slide-over panel */}
      <div className="relative ml-auto w-full max-w-5xl bg-surface-primary shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-th-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-th-accent-600/10 flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-th-accent-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-th-text-primary">
                {editingSignature ? 'Edit Signature' : 'Create Signature'}
              </h2>
              <p className="text-xs text-th-text-tertiary">
                {editingSignature
                  ? `Editing "${editingSignature.name}"`
                  : 'Build a new email signature'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving || !form.name.trim() || !form.content.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingSignature ? 'Save Changes' : 'Create Signature'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left: Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-th-border">
            {/* Signature Name */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                Signature Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. My Professional Signature"
                className="w-full px-3 py-2 text-sm bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-600"
              />
            </div>

            {/* Default Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-th-text-secondary">
                  Set as Default
                </span>
                <p className="text-xs text-th-text-tertiary">
                  Automatically applied to new emails
                </p>
              </div>
              <label className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={() => setForm((f) => ({ ...f, is_default: !f.is_default }))}
                  aria-label="Set as default signature"
                  className="sr-only peer"
                />
                <span
                  className={`absolute inset-0 rounded-full border-2 border-transparent transition-colors ${
                    form.is_default ? 'bg-th-accent-600' : 'bg-gray-300'
                  }`}
                />
                <span
                  className={`pointer-events-none absolute top-0.5 left-0.5 inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    form.is_default ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </label>
            </div>

            {/* Variables */}
            <div>
              <h4 className="text-sm font-medium text-th-text-secondary mb-3 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Variables
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(DEFAULT_VARIABLES).map(([key]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-th-text-tertiary mb-1 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      value={form.variables[key] || ''}
                      onChange={(e) => updateVariable(key, e.target.value)}
                      placeholder={`{{${key}}}`}
                      className="w-full px-3 py-2 text-sm bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-600"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* HTML Content */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1.5 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4" />
                HTML Content <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-th-text-tertiary mb-2">
                Use {'{{variable_name}}'} placeholders. Available: {'{{'}{Object.keys(DEFAULT_VARIABLES).join('}}, {{')}{'}}'}, {'{{'}font_family{'}}'}, {'{{'}primary_color{'}}'}, {'{{'}logo_url{'}}'}, {'{{'}banner_url{'}}'}
              </p>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={12}
                spellCheck={false}
                aria-label="HTML content"
                placeholder="Enter HTML signature content..."
                className="w-full px-3 py-2 text-sm font-mono bg-surface-secondary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-600 resize-y"
              />
            </div>

            {/* Logo & Banner Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FileUploadField
                label="Logo"
                accept="image/png,image/jpeg,image/gif,image/svg+xml"
                maxSizeMB={2}
                currentUrl={form.logo_url}
                onUpload={handleLogoUpload}
                onRemove={() =>
                  setForm((f) => ({
                    ...f,
                    logo_url: null,
                    logo_storage_path: null,
                  }))
                }
                uploading={uploadingLogo}
              />
              <FileUploadField
                label="Banner"
                accept="image/png,image/jpeg,image/gif"
                maxSizeMB={5}
                currentUrl={form.banner_url}
                onUpload={handleBannerUpload}
                onRemove={() =>
                  setForm((f) => ({
                    ...f,
                    banner_url: null,
                    banner_storage_path: null,
                  }))
                }
                uploading={uploadingBanner}
              />
            </div>

            {/* Social Links */}
            <SocialLinksEditor
              links={form.social_links}
              onChange={(social_links) => setForm((f) => ({ ...f, social_links }))}
            />

            {/* Font & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Font Family
                </label>
                <select
                  value={form.font_family}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, font_family: e.target.value }))
                  }
                  aria-label="Font family"
                  className="w-full px-3 py-2 text-sm bg-surface-secondary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>
                      {FONT_DISPLAY_NAMES[font] || font}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, primary_color: e.target.value }))
                    }
                    aria-label="Primary color picker"
                    title="Primary color"
                    className="w-10 h-10 rounded-lg border border-th-border cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={form.primary_color}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, primary_color: e.target.value }))
                    }
                    aria-label="Primary color hex value"
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 text-sm font-mono bg-surface-secondary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="w-full lg:w-[420px] flex flex-col shrink-0">
            {/* Mobile tab switcher */}
            <div className="lg:hidden flex border-b border-th-border">
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                  activeTab === 'edit'
                    ? 'text-th-accent-600 border-b-2 border-th-accent-600'
                    : 'text-th-text-tertiary'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                  activeTab === 'preview'
                    ? 'text-th-accent-600 border-b-2 border-th-accent-600'
                    : 'text-th-text-tertiary'
                }`}
              >
                Preview
              </button>
            </div>

            <div
              className={`flex-1 overflow-y-auto p-6 ${
                activeTab === 'edit' ? 'hidden lg:block' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-th-text-tertiary" />
                <h4 className="text-sm font-medium text-th-text-secondary">
                  Live Preview
                </h4>
              </div>

              {/* Email container mockup */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="ml-2">Email Preview</span>
                  </div>
                </div>
                <div className="p-4 text-sm text-gray-600">
                  <p className="mb-3">Hi there,</p>
                  <p className="mb-4 text-gray-400 italic">
                    [Your email content goes here...]
                  </p>
                  <hr className="border-gray-200 my-4" />
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml) }} />
                </div>
              </div>

              {/* Raw HTML preview */}
              <details className="mt-4">
                <summary className="text-xs font-medium text-th-text-tertiary cursor-pointer hover:text-th-text-secondary">
                  View rendered HTML
                </summary>
                <pre className="mt-2 p-3 bg-surface-secondary rounded-lg text-xs font-mono text-th-text-secondary overflow-x-auto max-h-48 overflow-y-auto border border-th-border">
                  {previewHtml}
                </pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component: EmailSignatures
// ============================================================================

export default function EmailSignatures() {
  const { signatureService } = useCRM();
  const { activeOrgId } = useOrg();

  // State
  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [showEditor, setShowEditor] = useState(false);
  const [editingSignature, setEditingSignature] = useState<EmailSignature | null>(null);
  const [form, setForm] = useState<SignatureFormState>(emptyForm());

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<EmailSignature | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Templates
  const [templates] = useState(() => signatureService.getSignatureTemplates());

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadSignatures = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    try {
      const data = await signatureService.getUserSignatures(activeOrgId);
      setSignatures(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load signatures');
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, signatureService]);

  useEffect(() => {
    loadSignatures();
  }, [loadSignatures]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const openCreate = () => {
    setEditingSignature(null);
    setForm(emptyForm());
    setShowEditor(true);
  };

  const openCreateFromTemplate = (template: { name: string; content: string }) => {
    setEditingSignature(null);
    setForm({
      ...emptyForm(),
      name: template.name,
      content: template.content.trim(),
    });
    setShowEditor(true);
  };

  const openEdit = (sig: EmailSignature) => {
    setEditingSignature(sig);
    setForm(signatureToForm(sig));
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingSignature(null);
    setForm(emptyForm());
  };

  const handleSave = async () => {
    if (!activeOrgId || !form.name.trim() || !form.content.trim()) return;

    setSaving(true);
    try {
      const input: SignatureCreateInput = {
        name: form.name.trim(),
        is_default: form.is_default,
        content: form.content,
        variables: form.variables,
        social_links: form.social_links.filter((l) => l.url.trim()),
        font_family: form.font_family,
        primary_color: form.primary_color,
        logo_url: form.logo_url ?? undefined,
        logo_storage_path: form.logo_storage_path ?? undefined,
        banner_url: form.banner_url ?? undefined,
        banner_storage_path: form.banner_storage_path ?? undefined,
      };

      if (editingSignature) {
        await signatureService.updateSignature(editingSignature.id, input);
        toast.success('Signature updated');
      } else {
        const created = await signatureService.createSignature(activeOrgId, input);

        // Handle pending file uploads for new signatures
        const formAny = form as any;
        if (formAny._pendingLogoFile) {
          try {
            await signatureService.uploadLogo(created.id, formAny._pendingLogoFile);
          } catch {
            // Non-critical; logo can be uploaded later
          }
        }
        if (formAny._pendingBannerFile) {
          try {
            await signatureService.uploadBanner(created.id, formAny._pendingBannerFile);
          } catch {
            // Non-critical; banner can be uploaded later
          }
        }
        toast.success('Signature created');
      }

      closeEditor();
      await loadSignatures();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save signature');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (sig: EmailSignature) => {
    try {
      await signatureService.duplicateSignature(sig.id);
      toast.success(`Duplicated "${sig.name}"`);
      await loadSignatures();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate signature');
    }
  };

  const handleSetDefault = async (sig: EmailSignature) => {
    try {
      await signatureService.updateSignature(sig.id, { is_default: true });
      toast.success(`"${sig.name}" set as default`);
      await loadSignatures();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to set default');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await signatureService.deleteSignature(deleteTarget.id);
      toast.success(`Deleted "${deleteTarget.name}"`);
      setDeleteTarget(null);
      await loadSignatures();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete signature');
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">
            Email Signatures
          </h1>
          <p className="text-sm text-th-text-tertiary mt-1">
            Create and manage professional email signatures for your outgoing
            messages.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Signature
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-th-accent-600 animate-spin" />
            <p className="text-sm text-th-text-tertiary">Loading signatures...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && signatures.length === 0 && (
        <div className="bg-surface-primary rounded-xl border border-th-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-th-accent-600/10 flex items-center justify-center">
            <FileSignature className="w-8 h-8 text-th-accent-600" />
          </div>
          <h3 className="text-lg font-semibold text-th-text-primary mb-2">
            No signatures yet
          </h3>
          <p className="text-sm text-th-text-tertiary mb-6 max-w-md mx-auto">
            Create a professional email signature to include in your outgoing
            emails. Start from scratch or use one of our templates.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Signature
          </button>
        </div>
      )}

      {/* Signature Grid */}
      {!loading && signatures.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {signatures.map((sig) => {
            const rendered = signatureService.renderSignature(sig);
            return (
              <SignatureCard
                key={sig.id}
                signature={sig}
                renderedHtml={rendered}
                onEdit={() => openEdit(sig)}
                onDuplicate={() => handleDuplicate(sig)}
                onSetDefault={() => handleSetDefault(sig)}
                onDelete={() => setDeleteTarget(sig)}
              />
            );
          })}
        </div>
      )}

      {/* Templates Section */}
      {!loading && (
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <div className="flex items-center gap-2 mb-1">
            <LayoutTemplate className="w-5 h-5 text-th-accent-600" />
            <h2 className="text-lg font-semibold text-th-text-primary">
              Start from Template
            </h2>
          </div>
          <p className="text-sm text-th-text-tertiary mb-5">
            Kickstart your signature with a pre-built template, then customize
            it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <button
                key={tpl.name}
                onClick={() => openCreateFromTemplate(tpl)}
                className="group text-left p-4 bg-surface-secondary rounded-xl border border-th-border hover:border-th-accent-600 hover:shadow-md transition-all"
              >
                {/* Mini preview */}
                <div className="relative h-24 overflow-hidden rounded-lg bg-white border border-gray-100 mb-3">
                  <div
                    className="absolute inset-0 p-2 pointer-events-none origin-top-left scale-50"
                    style={{ width: '200%' }}
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(tpl.content
                        .replace(/\{\{font_family\}\}/g, 'Arial, sans-serif')
                        .replace(/\{\{primary_color\}\}/g, '#6366F1')
                        .replace(/\{\{user_name\}\}/g, 'John Doe')
                        .replace(/\{\{user_title\}\}/g, 'Sales Manager')
                        .replace(/\{\{phone\}\}/g, '(555) 123-4567')
                        .replace(/\{\{email\}\}/g, 'john@company.com')
                        .replace(/\{\{company_name\}\}/g, 'Acme Corp')
                        .replace(/\{\{logo_url\}\}/g, '')),
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-th-text-primary group-hover:text-th-accent-600 transition-colors">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-th-text-tertiary mt-0.5">
                      {tpl.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-th-text-tertiary group-hover:text-th-accent-600 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <SignatureEditorModal
          editingSignature={editingSignature}
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={handleSave}
          onCancel={closeEditor}
          signatureService={signatureService}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <DeleteDialog
          sigName={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
