import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  LayoutTemplate,
  Loader2,
  Search,
  Trash2,
  Pencil,
  X,
  Layers,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  templateService,
  type CmsTemplate,
  type GlobalBlock,
  type TemplateCreateInput,
  type GlobalBlockCreateInput,
} from '@mpbhealth/admin-core';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type ModalMode = 'create' | 'edit';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TemplateLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<CmsTemplate[]>([]);
  const [globalBlocks, setGlobalBlocks] = useState<GlobalBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateModalMode, setTemplateModalMode] = useState<ModalMode>('create');
  const [editingTemplate, setEditingTemplate] = useState<CmsTemplate | null>(null);

  // Global block modal state
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockModalMode, setBlockModalMode] = useState<ModalMode>('create');
  const [editingBlock, setEditingBlock] = useState<GlobalBlock | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [t, b] = await Promise.all([
        templateService.getTemplates(),
        templateService.getGlobalBlocks(),
      ]);
      setTemplates(t);
      setGlobalBlocks(b);
    } catch (e) {
      toast.error(`Failed to load: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categories = ['all', ...Array.from(new Set(templates.map((t) => t.category)))];

  const filteredTemplates = templates.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    try {
      await templateService.deleteTemplate(id);
      toast.success('Template deleted');
      loadData();
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!window.confirm('Delete this global block? This cannot be undone.')) return;
    try {
      await templateService.deleteGlobalBlock(id);
      toast.success('Global block deleted');
      loadData();
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleStartFromTemplate = (template: CmsTemplate) => {
    const params = new URLSearchParams({ from_template: template.id });
    navigate(`/admin/cms/pages/new?${params.toString()}`);
  };

  const handleDuplicateTemplate = async (template: CmsTemplate) => {
    try {
      await templateService.createTemplate({
        name: `${template.name} (Copy)`,
        description: template.description,
        thumbnail_url: template.thumbnail_url,
        sections: template.sections,
        category: template.category,
        created_by: user?.id || null,
      });
      toast.success('Template duplicated');
      loadData();
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Template Library</h1>
          <p className="text-sm text-th-text-secondary mt-1">
            Create and manage reusable page templates and global blocks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setTemplateModalMode('create');
            setEditingTemplate(null);
            setShowTemplateModal(true);
          }}
          className="inline-flex items-center gap-2 bg-th-accent-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full pl-9 pr-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
          />
        </div>
        <div className="inline-flex rounded-lg border border-th-border bg-surface-primary p-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                categoryFilter === cat
                  ? 'bg-th-accent-600 text-white'
                  : 'text-th-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-8 border border-dashed border-th-border rounded-xl bg-surface-primary">
          <LayoutTemplate className="w-12 h-12 text-th-text-tertiary mb-4" />
          <p className="text-th-text-secondary font-medium">No templates yet</p>
          <p className="text-sm text-th-text-tertiary mt-1">
            Create your first template to speed up page creation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group bg-surface-primary border border-th-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-neutral-100 flex items-center justify-center overflow-hidden relative">
                {template.thumbnail_url ? (
                  <img
                    src={template.thumbnail_url}
                    alt={template.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <LayoutTemplate className="w-12 h-12 text-th-text-tertiary" />
                )}
                {template.is_system && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-th-accent-600 text-white text-xs font-medium rounded-full">
                    System
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-th-text-primary truncate">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-th-text-secondary line-clamp-2 mt-0.5">
                        {template.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-th-text-tertiary">
                  <span className="capitalize">{template.category}</span>
                  <span>{template.sections.length} section{template.sections.length !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-xs text-th-text-tertiary">{formatDate(template.created_at)}</p>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-th-border/60">
                  <button
                    type="button"
                    onClick={() => handleStartFromTemplate(template)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-th-accent-600 text-white text-sm rounded-md hover:bg-th-accent-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Use
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicateTemplate(template)}
                    title="Duplicate"
                    className="p-1.5 rounded-md text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateModalMode('edit');
                      setEditingTemplate(template);
                      setShowTemplateModal(true);
                    }}
                    title="Edit"
                    className="p-1.5 rounded-md text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(template.id)}
                    title="Delete"
                    className="p-1.5 rounded-md text-th-text-tertiary hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Global Blocks ──────────────────────────────────────────────────── */}
      <section className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-th-text-primary flex items-center gap-2">
              <Layers className="w-5 h-5 text-th-accent-600" />
              Global Blocks
            </h2>
            <p className="text-sm text-th-text-secondary mt-0.5">
              Reusable section groups shared across pages.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setBlockModalMode('create');
              setEditingBlock(null);
              setShowBlockModal(true);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-surface-tertiary transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Block
          </button>
        </div>

        {globalBlocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[120px] text-center p-6 border border-dashed border-th-border rounded-xl bg-surface-primary">
            <Layers className="w-10 h-10 text-th-text-tertiary mb-3" />
            <p className="text-th-text-secondary font-medium">No global blocks yet</p>
            <p className="text-sm text-th-text-tertiary mt-1">
              Create reusable block groups to share across pages.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalBlocks.map((block) => (
              <div
                key={block.id}
                className="bg-surface-primary border border-th-border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-th-text-primary truncate">{block.name}</h3>
                    {block.description && (
                      <p className="text-sm text-th-text-secondary line-clamp-2 mt-0.5">
                        {block.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setBlockModalMode('edit');
                        setEditingBlock(block);
                        setShowBlockModal(true);
                      }}
                      className="p-1.5 rounded-md text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-1.5 rounded-md text-th-text-tertiary hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-th-text-tertiary">
                  <span>{block.sections.length} section{block.sections.length !== 1 ? 's' : ''}</span>
                  <span>{formatDate(block.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Template Modal ──────────────────────────────────────────────────── */}
      {showTemplateModal && (
        <TemplateModal
          mode={templateModalMode}
          template={editingTemplate}
          userId={user?.id || null}
          onClose={() => setShowTemplateModal(false)}
          onSaved={() => {
            setShowTemplateModal(false);
            loadData();
          }}
        />
      )}

      {/* ── Global Block Modal ──────────────────────────────────────────────── */}
      {showBlockModal && (
        <GlobalBlockModal
          mode={blockModalMode}
          block={editingBlock}
          userId={user?.id || null}
          onClose={() => setShowBlockModal(false)}
          onSaved={() => {
            setShowBlockModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template Create/Edit Modal
// ---------------------------------------------------------------------------

function TemplateModal({
  mode,
  template,
  userId,
  onClose,
  onSaved,
}: {
  mode: ModalMode;
  template: CmsTemplate | null;
  userId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(template?.thumbnail_url || '');
  const [category, setCategory] = useState(template?.category || 'custom');
  const [sectionsJson, setSectionsJson] = useState(
    template ? JSON.stringify(template.sections, null, 2) : '[]'
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    let sections: Record<string, unknown>[];
    try {
      sections = JSON.parse(sectionsJson);
      if (!Array.isArray(sections)) throw new Error('Must be an array');
    } catch {
      toast.error('Sections must be valid JSON array');
      return;
    }

    setSaving(true);
    try {
      const input: TemplateCreateInput = {
        name: name.trim(),
        description: description.trim(),
        thumbnail_url: thumbnailUrl.trim() || null,
        sections,
        category: category.trim() || 'custom',
        created_by: userId,
      };

      if (mode === 'edit' && template) {
        await templateService.updateTemplate(template.id, input);
        toast.success('Template updated');
      } else {
        await templateService.createTemplate(input);
        toast.success('Template created');
      }
      onSaved();
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-surface-primary rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-th-border">
          <h2 className="text-lg font-semibold text-th-text-primary">
            {mode === 'edit' ? 'Edit Template' : 'Create Template'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Landing Page Hero"
              className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of this template"
              className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Thumbnail URL</label>
            <input
              type="text"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="custom"
              className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Sections (JSON)
            </label>
            <textarea
              value={sectionsJson}
              onChange={(e) => setSectionsJson(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-th-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-60 text-sm"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'edit' ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Global Block Create/Edit Modal
// ---------------------------------------------------------------------------

function GlobalBlockModal({
  mode,
  block,
  userId,
  onClose,
  onSaved,
}: {
  mode: ModalMode;
  block: GlobalBlock | null;
  userId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(block?.name || '');
  const [description, setDescription] = useState(block?.description || '');
  const [sectionsJson, setSectionsJson] = useState(
    block ? JSON.stringify(block.sections, null, 2) : '[]'
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    let sections: Record<string, unknown>[];
    try {
      sections = JSON.parse(sectionsJson);
      if (!Array.isArray(sections)) throw new Error('Must be an array');
    } catch {
      toast.error('Sections must be valid JSON array');
      return;
    }

    setSaving(true);
    try {
      const input: GlobalBlockCreateInput = {
        name: name.trim(),
        description: description.trim(),
        sections,
        created_by: userId,
      };

      if (mode === 'edit' && block) {
        await templateService.updateGlobalBlock(block.id, input);
        toast.success('Global block updated');
      } else {
        await templateService.createGlobalBlock(input);
        toast.success('Global block created');
      }
      onSaved();
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-surface-primary rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-th-border">
          <h2 className="text-lg font-semibold text-th-text-primary">
            {mode === 'edit' ? 'Edit Global Block' : 'Create Global Block'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Footer CTA Block"
              className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this block group is used for"
              className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Sections (JSON)
            </label>
            <textarea
              value={sectionsJson}
              onChange={(e) => setSectionsJson(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-th-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-60 text-sm"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'edit' ? 'Save Changes' : 'Create Block'}
          </button>
        </div>
      </div>
    </div>
  );
}
