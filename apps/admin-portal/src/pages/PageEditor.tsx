import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Globe,
  EyeOff,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  ExternalLink,
  Settings as SettingsIcon,
  ChevronRight,
} from 'lucide-react';
import { pagesAdminService } from '@mpbhealth/admin-core';
import { isTimeoutError, withTimeout } from '@mpbhealth/utils';
import type {
  CmsBlock,
  CmsBlockKind,
  CmsPage,
  CmsPageMeta,
  CmsHeroProps,
  CmsRichTextProps,
  CmsImageProps,
  CmsImageGridProps,
  CmsCtaBandProps,
  CmsStatsProps,
  CmsTwoColumnProps,
  CmsFaqProps,
  CmsEmbedProps,
  CmsSpacerProps,
} from '@mpbhealth/database';
import { useAdmin } from '../contexts/AdminContext';
import RichTextEditor from '../components/RichTextEditor';
import { ImageUploader } from '../components/cms/ImageUploader';

const PAGE_SAVE_TIMEOUT_MS = 30_000;

const PUBLIC_SITE_URL =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ||
  'https://mpb.health';

interface BlockMeta {
  kind: CmsBlockKind;
  label: string;
  description: string;
  defaultProps: CmsBlock['props'];
}

const BLOCKS: BlockMeta[] = [
  {
    kind: 'hero',
    label: 'Hero',
    description: 'Large title, subtitle, and CTA buttons',
    defaultProps: {
      title: 'Section title',
      subtitle: 'Supporting subtitle',
      primary_cta: { label: 'Get started', href: '/contact' },
    } as CmsHeroProps,
  },
  {
    kind: 'rich_text',
    label: 'Rich Text',
    description: 'Formatted body content',
    defaultProps: { html: '<p>Start writing…</p>' } as CmsRichTextProps,
  },
  {
    kind: 'image',
    label: 'Image',
    description: 'Single image with caption',
    defaultProps: { src: '', alt: '', aspect_ratio: '16:9' } as CmsImageProps,
  },
  {
    kind: 'image_grid',
    label: 'Image Grid',
    description: 'Multi-image gallery',
    defaultProps: { columns: 3, items: [] } as CmsImageGridProps,
  },
  {
    kind: 'cta_band',
    label: 'CTA Band',
    description: 'Full-width call to action',
    defaultProps: {
      title: 'Ready to get started?',
      cta: { label: 'Contact us', href: '/contact' },
    } as CmsCtaBandProps,
  },
  {
    kind: 'stats',
    label: 'Stats',
    description: 'Number+label cards',
    defaultProps: {
      items: [
        { value: '50k+', label: 'Members' },
        { value: '20+', label: 'States' },
        { value: '$1B', label: 'Shared' },
      ],
    } as CmsStatsProps,
  },
  {
    kind: 'two_column',
    label: 'Two-Column',
    description: 'Image + text side-by-side',
    defaultProps: {
      title: 'Section title',
      body_html: '<p>Body content.</p>',
      image_src: '',
      image_alt: '',
      image_position: 'right',
    } as CmsTwoColumnProps,
  },
  {
    kind: 'faq',
    label: 'FAQ',
    description: 'Collapsible Q&A list',
    defaultProps: {
      title: 'Frequently asked questions',
      items: [{ question: 'Sample question?', answer_html: '<p>Sample answer.</p>' }],
    } as CmsFaqProps,
  },
  {
    kind: 'embed',
    label: 'Embed',
    description: 'YouTube, Vimeo, or iframe URL',
    defaultProps: { url: '', aspect_ratio: '16:9' } as CmsEmbedProps,
  },
  {
    kind: 'spacer',
    label: 'Spacer',
    description: 'Vertical empty space',
    defaultProps: { size: 'md' } as CmsSpacerProps,
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generateBlockId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface FormState {
  title: string;
  path: string;
  slug: string;
  description: string;
  sections: CmsBlock[];
  meta: CmsPageMeta;
}

const EMPTY_FORM: FormState = {
  title: '',
  path: '/p/',
  slug: '',
  description: '',
  sections: [],
  meta: {},
};

export default function PageEditor() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { user } = useAdmin();
  const isNew = !pageId || pageId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [showMeta, setShowMeta] = useState(false);
  const [missing, setMissing] = useState<Set<'title' | 'path'>>(new Set());

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      try {
        const page = await pagesAdminService.getPage(pageId!);
        if (!page) {
          toast.error('Page not found');
          navigate('/cms/pages');
          return;
        }
        setForm({
          title: page.title,
          path: page.path,
          slug: page.slug,
          description: page.description ?? '',
          sections: page.sections ?? [],
          meta: page.meta ?? {},
        });
        setIsPublished(page.is_published);
      } catch (e) {
        toast.error(`Failed to load: ${e instanceof Error ? e.message : 'Unknown error'}`);
        navigate('/cms/pages');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isNew, pageId, navigate]);

  const handleTitleChange = (title: string) => {
    setForm((prev) => {
      const next: FormState = { ...prev, title };
      // Auto-generate slug + path from the first edit only — once the admin
      // has hand-edited either, leave them alone.
      if (!prev.slug && title.trim()) {
        const auto = slugify(title);
        next.slug = auto;
        if (prev.path === '/p/' || !prev.path.startsWith('/p/')) {
          // Only auto-fill the path if it's still the default `/p/` stub.
          next.path = `/p/${auto}`;
        }
      }
      return next;
    });
    if (missing.has('title') && title.trim()) {
      setMissing((s) => {
        const n = new Set(s);
        n.delete('title');
        return n;
      });
    }
  };

  const handleSave = useCallback(
    async (publish?: boolean) => {
      if (saving) return;
      const m = new Set<'title' | 'path'>();
      if (!form.title.trim()) m.add('title');
      if (!form.path.trim() || form.path === '/' || form.path === '/p/') m.add('path');
      if (m.size > 0) {
        setMissing(m);
        toast.error('Please fill in: ' + Array.from(m).join(', '));
        return;
      }
      setMissing(new Set());

      const shouldPublish = publish ?? isPublished;
      const toastId = toast.loading(
        shouldPublish
          ? isNew
            ? 'Publishing page…'
            : 'Saving & publishing…'
          : 'Saving draft…'
      );
      setSaving(true);

      try {
        const payload = {
          title: form.title.trim(),
          path: form.path.trim(),
          slug: form.slug.trim() || slugify(form.title),
          description: form.description.trim() || null,
          sections: form.sections,
          meta: form.meta,
          is_published: shouldPublish,
        };

        if (isNew) {
          const created = await withTimeout(
            pagesAdminService.createPage({ ...payload, created_by: user?.id ?? null }),
            PAGE_SAVE_TIMEOUT_MS,
            'page_create'
          );
          toast.success(shouldPublish ? 'Page published!' : 'Page saved as draft', {
            id: toastId,
          });
          navigate(`/cms/pages/${created.id}`, { replace: true });
        } else {
          await withTimeout(
            pagesAdminService.updatePage(pageId!, payload),
            PAGE_SAVE_TIMEOUT_MS,
            'page_update'
          );
          setIsPublished(shouldPublish);
          toast.success(
            shouldPublish && !isPublished
              ? 'Page published!'
              : !shouldPublish && isPublished
                ? 'Page unpublished'
                : 'Page updated!',
            { id: toastId }
          );
        }
      } catch (err) {
        console.warn('[PageEditor] save failed', err);
        const message = isTimeoutError(err)
          ? 'Save took too long. Check your connection and try again.'
          : err instanceof Error
            ? err.message
            : 'Unknown error';
        toast.error(`Failed to save: ${message}`, { id: toastId });
      } finally {
        setSaving(false);
      }
    },
    [saving, form, isPublished, isNew, pageId, user, navigate]
  );

  // ----- Section operations -----
  const updateSection = useCallback(
    (id: string, mutate: (block: CmsBlock) => CmsBlock) => {
      setForm((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => (s.id === id ? mutate(s) : s)),
      }));
    },
    []
  );

  const addSection = (kind: CmsBlockKind) => {
    const meta = BLOCKS.find((b) => b.kind === kind);
    if (!meta) return;
    const block = {
      id: generateBlockId(),
      kind,
      props: structuredClone(meta.defaultProps),
    } as CmsBlock;
    setForm((prev) => ({ ...prev, sections: [...prev.sections, block] }));
    setOpenSectionId(block.id);
  };

  const removeSection = (id: string) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
    }));
    if (openSectionId === id) setOpenSectionId(null);
  };

  const moveSection = (id: string, direction: -1 | 1) => {
    setForm((prev) => {
      const idx = prev.sections.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.sections.length) return prev;
      const next = [...prev.sections];
      const [moved] = next.splice(idx, 1);
      next.splice(newIdx, 0, moved);
      return { ...prev, sections: next };
    });
  };

  const previewHref = isPublished ? `${PUBLIC_SITE_URL}${form.path}` : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header — sticky so the action buttons are always reachable. */}
      <div className="sticky top-11 z-20 -mx-2 px-2 py-2 bg-surface-secondary/90 backdrop-blur border-b border-th-border/40 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/cms/pages')}
          disabled={saving}
          className="flex items-center gap-2 text-th-text-secondary hover:text-th-text-primary disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Pages</span>
        </button>
        <div className="flex items-center gap-2">
          {previewHref && (
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm text-th-text-secondary hover:text-th-text-primary"
            >
              <ExternalLink className="w-4 h-4" />
              View live
            </a>
          )}
          {isPublished && !isNew ? (
            <>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
                <span>{saving ? 'Saving…' : 'Unpublish'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving…' : 'Save'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving…' : 'Save Draft'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                <span>{saving ? 'Publishing…' : 'Publish'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Page-level fields */}
      <div className="bg-surface-primary border border-th-border rounded-xl p-6 space-y-4">
        <div>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Page title…"
            className={`w-full text-3xl font-bold text-th-text-primary bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-th-text-tertiary ${
              missing.has('title')
                ? 'outline-2 outline-dashed outline-red-300 rounded-lg px-2 -mx-2'
                : ''
            }`}
          />
          {missing.has('title') && (
            <p className="text-xs text-red-600 mt-1">Title is required.</p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              URL Path *
            </label>
            <input
              type="text"
              value={form.path}
              onChange={(e) => setForm((p) => ({ ...p, path: e.target.value }))}
              placeholder="/p/your-slug"
              className={`w-full px-3 py-2 bg-surface-primary border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary font-mono text-sm ${
                missing.has('path') ? 'border-red-400' : 'border-th-border'
              }`}
            />
            <p className="text-xs text-th-text-tertiary mt-1">
              Where this page lives on the public site (e.g. <code>/p/about</code>).
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Slug
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
              placeholder="auto-generated from title"
              className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary font-mono text-sm"
            />
            <p className="text-xs text-th-text-tertiary mt-1">
              Short identifier (lowercase, dashes only).
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Short description — used for SEO meta and previews."
            rows={2}
            className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowMeta((v) => !v)}
          className="inline-flex items-center gap-2 text-sm text-th-text-secondary hover:text-th-text-primary"
        >
          <SettingsIcon className="w-4 h-4" />
          {showMeta ? 'Hide' : 'Show'} SEO / social settings
          <ChevronRight className={`w-4 h-4 transition-transform ${showMeta ? 'rotate-90' : ''}`} />
        </button>
        {showMeta && <MetaEditor meta={form.meta} onChange={(meta) => setForm((p) => ({ ...p, meta }))} />}
      </div>

      {/* Sections list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-th-text-primary">
            Sections{' '}
            <span className="text-sm font-normal text-th-text-tertiary">
              ({form.sections.length})
            </span>
          </h2>
        </div>

        {form.sections.length === 0 ? (
          <div className="bg-surface-primary border border-dashed border-th-border rounded-xl p-12 text-center">
            <p className="text-th-text-secondary mb-4">
              No sections yet. Add your first block below.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {form.sections.map((block, idx) => (
              <SectionRow
                key={block.id}
                block={block}
                index={idx}
                total={form.sections.length}
                open={openSectionId === block.id}
                onToggle={() =>
                  setOpenSectionId((id) => (id === block.id ? null : block.id))
                }
                onUpdate={(b) => updateSection(block.id, () => b)}
                onMoveUp={() => moveSection(block.id, -1)}
                onMoveDown={() => moveSection(block.id, 1)}
                onRemove={() => removeSection(block.id)}
              />
            ))}
          </div>
        )}

        <AddBlockPicker onAdd={addSection} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta editor
// ---------------------------------------------------------------------------

function MetaEditor({
  meta,
  onChange,
}: {
  meta: CmsPageMeta;
  onChange: (meta: CmsPageMeta) => void;
}) {
  return (
    <div className="mt-3 pt-4 border-t border-th-border space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            OG / Social image URL
          </label>
          <input
            type="url"
            value={meta.og_image ?? ''}
            onChange={(e) => onChange({ ...meta, og_image: e.target.value || undefined })}
            placeholder="https://…"
            className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Canonical URL
          </label>
          <input
            type="url"
            value={meta.canonical_url ?? ''}
            onChange={(e) =>
              onChange({ ...meta, canonical_url: e.target.value || undefined })
            }
            placeholder="https://mpb.health/…"
            className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-th-text-secondary mb-1">
          OG description
        </label>
        <textarea
          value={meta.og_description ?? ''}
          onChange={(e) =>
            onChange({ ...meta, og_description: e.target.value || undefined })
          }
          rows={2}
          placeholder="Falls back to the page description if blank."
          className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
        />
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-th-text-secondary cursor-pointer">
        <input
          type="checkbox"
          checked={meta.noindex ?? false}
          onChange={(e) => onChange({ ...meta, noindex: e.target.checked || undefined })}
          className="rounded border-th-border"
        />
        Hide this page from search engines (noindex,nofollow)
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section row (collapsible)
// ---------------------------------------------------------------------------

function SectionRow({
  block,
  index,
  total,
  open,
  onToggle,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  block: CmsBlock;
  index: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  onUpdate: (b: CmsBlock) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const meta = BLOCKS.find((b) => b.kind === block.kind);
  return (
    <div className="bg-surface-primary border border-th-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-md bg-th-accent-600/10 text-th-accent-700 dark:text-th-accent-300 tabular-nums">
            {index + 1}
          </span>
          <span className="font-medium text-th-text-primary">
            {meta?.label ?? block.kind}
          </span>
          <span className="text-xs text-th-text-tertiary truncate">
            {summarize(block)}
          </span>
        </button>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move up"
            className="p-1.5 rounded text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary disabled:opacity-30"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="Move down"
            className="p-1.5 rounded text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary disabled:opacity-30"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Remove section"
            className="p-1.5 rounded text-th-text-tertiary hover:bg-rose-500/10 hover:text-rose-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-th-border p-4 bg-surface-secondary/40">
          <BlockForm block={block} onChange={onUpdate} />
        </div>
      )}
    </div>
  );
}

function summarize(block: CmsBlock): string {
  switch (block.kind) {
    case 'hero':
      return block.props.title || 'Untitled hero';
    case 'rich_text':
      return (block.props.html || '').replace(/<[^>]+>/g, '').slice(0, 60) || 'Empty';
    case 'image':
      return block.props.src ? block.props.src.split('/').pop() ?? '' : 'No image';
    case 'image_grid':
      return `${block.props.items.length} images`;
    case 'cta_band':
      return block.props.title || 'Untitled CTA';
    case 'stats':
      return `${block.props.items.length} stats`;
    case 'two_column':
      return block.props.title || 'Two-column';
    case 'faq':
      return `${block.props.items.length} questions`;
    case 'embed':
      return block.props.url || 'No URL';
    case 'spacer':
      return `${block.props.size ?? 'md'} spacer`;
  }
}

// ---------------------------------------------------------------------------
// Block form router
// ---------------------------------------------------------------------------

function BlockForm({
  block,
  onChange,
}: {
  block: CmsBlock;
  onChange: (b: CmsBlock) => void;
}) {
  switch (block.kind) {
    case 'hero':
      return <HeroForm block={block} onChange={onChange} />;
    case 'rich_text':
      return <RichTextForm block={block} onChange={onChange} />;
    case 'image':
      return <ImageForm block={block} onChange={onChange} />;
    case 'image_grid':
      return <ImageGridForm block={block} onChange={onChange} />;
    case 'cta_band':
      return <CtaBandForm block={block} onChange={onChange} />;
    case 'stats':
      return <StatsForm block={block} onChange={onChange} />;
    case 'two_column':
      return <TwoColumnForm block={block} onChange={onChange} />;
    case 'faq':
      return <FaqForm block={block} onChange={onChange} />;
    case 'embed':
      return <EmbedForm block={block} onChange={onChange} />;
    case 'spacer':
      return <SpacerForm block={block} onChange={onChange} />;
  }
}

// ---------------------------------------------------------------------------
// Per-block forms
// ---------------------------------------------------------------------------

// Small utility — strongly-typed `setProps` for a single block.
function setBlockProps<B extends CmsBlock>(
  block: B,
  patch: Partial<B['props']>
): B {
  return { ...block, props: { ...block.props, ...patch } } as B;
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-th-text-secondary mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-th-text-tertiary mt-1">{hint}</p>}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary';

function HeroForm({
  block,
  onChange,
}: {
  block: Extract<CmsBlock, { kind: 'hero' }>;
  onChange: (b: CmsBlock) => void;
}) {
  const p = block.props;
  return (
    <div className="space-y-4">
      <Field label="Title">
        <input
          type="text"
          value={p.title}
          onChange={(e) => onChange(setBlockProps(block, { title: e.target.value }))}
          className={inputClass}
        />
      </Field>
      <Field label="Subtitle">
        <textarea
          value={p.subtitle ?? ''}
          onChange={(e) => onChange(setBlockProps(block, { subtitle: e.target.value }))}
          rows={2}
          className={inputClass}
        />
      </Field>
      <Field label="Background image URL" hint="Leave blank for no background image.">
        <input
          type="url"
          value={p.background_image ?? ''}
          onChange={(e) =>
            onChange(setBlockProps(block, { background_image: e.target.value }))
          }
          placeholder="https://…"
          className={inputClass}
        />
      </Field>
      <Field label="Alignment">
        <select
          value={p.alignment ?? 'center'}
          onChange={(e) =>
            onChange(setBlockProps(block, { alignment: e.target.value as 'left' | 'center' }))
          }
          className={inputClass}
        >
          <option value="center">Center</option>
          <option value="left">Left</option>
        </select>
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <CtaFields
          label="Primary CTA"
          value={p.primary_cta}
          onChange={(v) => onChange(setBlockProps(block, { primary_cta: v }))}
        />
        <CtaFields
          label="Secondary CTA"
          value={p.secondary_cta}
          onChange={(v) => onChange(setBlockProps(block, { secondary_cta: v }))}
        />
      </div>
    </div>
  );
}

function CtaFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { label: string; href: string } | undefined;
  onChange: (v: { label: string; href: string } | undefined) => void;
}) {
  return (
    <div className="space-y-2 p-3 rounded-lg border border-th-border bg-surface-primary">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-th-text-primary">{label}</span>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs text-rose-600 hover:underline"
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onChange({ label: 'Click here', href: '/' })}
            className="text-xs text-th-accent-600 hover:underline"
          >
            Add
          </button>
        )}
      </div>
      {value && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={value.label}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
            placeholder="Button label"
            className={inputClass}
          />
          <input
            type="text"
            value={value.href}
            onChange={(e) => onChange({ ...value, href: e.target.value })}
            placeholder="/path or https://…"
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}

function RichTextForm({
  block,
  onChange,
}: {
  block: Extract<CmsBlock, { kind: 'rich_text' }>;
  onChange: (b: CmsBlock) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Content">
        <RichTextEditor
          content={block.props.html}
          onChange={(html) => onChange(setBlockProps(block, { html }))}
          placeholder="Start writing…"
          minHeight="220px"
        />
      </Field>
      <Field label="Max width">
        <select
          value={block.props.max_width ?? 'prose'}
          onChange={(e) =>
            onChange(
              setBlockProps(block, { max_width: e.target.value as 'prose' | 'wide' })
            )
          }
          className={inputClass}
        >
          <option value="prose">Narrow (reading width)</option>
          <option value="wide">Wide</option>
        </select>
      </Field>
    </div>
  );
}

function ImageForm({
  block,
  onChange,
}: {
  block: Extract<CmsBlock, { kind: 'image' }>;
  onChange: (b: CmsBlock) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Image">
        <ImageUploader
          value={block.props.src}
          onChange={(src) => onChange(setBlockProps(block, { src }))}
          slug="cms-page"
        />
      </Field>
      <Field label="Alt text" hint="Describes the image for screen readers and SEO.">
        <input
          type="text"
          value={block.props.alt}
          onChange={(e) => onChange(setBlockProps(block, { alt: e.target.value }))}
          className={inputClass}
        />
      </Field>
      <Field label="Caption">
        <input
          type="text"
          value={block.props.caption ?? ''}
          onChange={(e) =>
            onChange(setBlockProps(block, { caption: e.target.value || undefined }))
          }
          className={inputClass}
        />
      </Field>
      <Field label="Aspect ratio">
        <select
          value={block.props.aspect_ratio ?? '16:9'}
          onChange={(e) =>
            onChange(
              setBlockProps(block, {
                aspect_ratio: e.target.value as '16:9' | '4:3' | '1:1' | 'auto',
              })
            )
          }
          className={inputClass}
        >
          <option value="16:9">16:9 (widescreen)</option>
          <option value="4:3">4:3</option>
          <option value="1:1">1:1 (square)</option>
          <option value="auto">Natural</option>
        </select>
      </Field>
    </div>
  );
}

function ImageGridForm({
  block,
  onChange,
}: {
  block: Extract<CmsBlock, { kind: 'image_grid' }>;
  onChange: (b: CmsBlock) => void;
}) {
  const items = block.props.items;
  const update = (idx: number, patch: Partial<{ src: string; alt: string; caption: string }>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(setBlockProps(block, { items: next }));
  };
  const remove = (idx: number) =>
    onChange(setBlockProps(block, { items: items.filter((_, i) => i !== idx) }));
  const add = () =>
    onChange(setBlockProps(block, { items: [...items, { src: '', alt: '' }] }));
  return (
    <div className="space-y-4">
      <Field label="Columns">
        <select
          value={block.props.columns ?? 3}
          onChange={(e) =>
            onChange(setBlockProps(block, { columns: Number(e.target.value) as 2 | 3 | 4 }))
          }
          className={inputClass}
        >
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </Field>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg border border-th-border bg-surface-primary space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-th-text-secondary">Image {idx + 1}</span>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-xs text-rose-600 hover:underline"
              >
                Remove
              </button>
            </div>
            <input
              type="url"
              value={item.src}
              onChange={(e) => update(idx, { src: e.target.value })}
              placeholder="Image URL (or paste — uploads aren't supported in grids yet)"
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={item.alt}
                onChange={(e) => update(idx, { alt: e.target.value })}
                placeholder="Alt text"
                className={inputClass}
              />
              <input
                type="text"
                value={item.caption ?? ''}
                onChange={(e) => update(idx, { caption: e.target.value })}
                placeholder="Caption (optional)"
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary"
      >
        <Plus className="w-4 h-4" />
        Add image
      </button>
    </div>
  );
}

function CtaBandForm({
  block,
  onChange,
}: {
  block: Extract<CmsBlock, { kind: 'cta_band' }>;
  onChange: (b: CmsBlock) => void;
}) {
  const p = block.props;
  return (
    <div className="space-y-4">
      <Field label="Title">
        <input
          type="text"
          value={p.title}
          onChange={(e) => onChange(setBlockProps(block, { title: e.target.value }))}
          className={inputClass}
        />
      </Field>
      <Field label="Subtitle">
        <input
          type="text"
          value={p.subtitle ?? ''}
          onChange={(e) =>
            onChange(setBlockProps(block, { subtitle: e.target.value || undefined }))
          }
          className={inputClass}
        />
      </Field>
      <Field label="Variant">
        <select
          value={p.variant ?? 'primary'}
          onChange={(e) =>
            onChange(setBlockProps(block, { variant: e.target.value as 'primary' | 'subtle' }))
          }
          className={inputClass}
        >
          <option value="primary">Primary (gradient)</option>
          <option value="subtle">Subtle (neutral)</option>
        </select>
      </Field>
      <div className="grid sm:grid-cols-2 gap-2">
        <Field label="Button label">
          <input
            type="text"
            value={p.cta.label}
            onChange={(e) =>
              onChange(setBlockProps(block, { cta: { ...p.cta, label: e.target.value } }))
            }
            className={inputClass}
          />
        </Field>
        <Field label="Button URL">
          <input
            type="text"
            value={p.cta.href}
            onChange={(e) =>
              onChange(setBlockProps(block, { cta: { ...p.cta, href: e.target.value } }))
            }
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
}

function StatsForm({
  block,
  onChange,
}: {
  block: Extract<CmsBlock, { kind: 'stats' }>;
  onChange: (b: CmsBlock) => void;
}) {
  const items = block.props.items;
  const update = (idx: number, patch: Partial<{ value: string; label: string }>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(setBlockProps(block, { items: next }));
  };
  const remove = (idx: number) =>
    onChange(setBlockProps(block, { items: items.filter((_, i) => i !== idx) }));
  const add = () =>
    onChange(setBlockProps(block, { items: [...items, { value: '0', label: 'New stat' }] }));
  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
          <input
            type="text"
            value={item.value}
            onChange={(e) => update(idx, { value: e.target.value })}
            placeholder="50k+"
            className={inputClass}
          />
          <input
            type="text"
            value={item.label}
            onChange={(e) => update(idx, { label: e.target.value })}
            placeholder="Members"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => remove(idx)}
            className="p-2 rounded-md text-th-text-tertiary hover:bg-rose-500/10 hover:text-rose-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary"
      >
        <Plus className="w-4 h-4" />
        Add stat
      </button>
    </div>
  );
}

function TwoColumnForm({
  block,
  onChange,
}: {
  block: Extract<CmsBlock, { kind: 'two_column' }>;
  onChange: (b: CmsBlock) => void;
}) {
  const p = block.props;
  return (
    <div className="space-y-4">
      <Field label="Title (optional)">
        <input
          type="text"
          value={p.title ?? ''}
          onChange={(e) =>
            onChange(setBlockProps(block, { title: e.target.value || undefined }))
          }
          className={inputClass}
        />
      </Field>
      <Field label="Body">
        <RichTextEditor
          content={p.body_html}
          onChange={(html) => onChange(setBlockProps(block, { body_html: html }))}
          placeholder="Section body…"
          minHeight="180px"
        />
      </Field>
      <Field label="Image">
        <ImageUploader
          value={p.image_src}
          onChange={(src) => onChange(setBlockProps(block, { image_src: src }))}
          slug="cms-page-2col"
        />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Image alt text">
          <input
            type="text"
            value={p.image_alt}
            onChange={(e) => onChange(setBlockProps(block, { image_alt: e.target.value }))}
            className={inputClass}
          />
        </Field>
        <Field label="Image position">
          <select
            value={p.image_position ?? 'right'}
            onChange={(e) =>
              onChange(
                setBlockProps(block, { image_position: e.target.value as 'left' | 'right' })
              )
            }
            className={inputClass}
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

function FaqForm({
  block,
  onChange,
}: {
  block: Extract<CmsBlock, { kind: 'faq' }>;
  onChange: (b: CmsBlock) => void;
}) {
  const items = block.props.items;
  const update = (
    idx: number,
    patch: Partial<{ question: string; answer_html: string }>
  ) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(setBlockProps(block, { items: next }));
  };
  const remove = (idx: number) =>
    onChange(setBlockProps(block, { items: items.filter((_, i) => i !== idx) }));
  const add = () =>
    onChange(
      setBlockProps(block, {
        items: [...items, { question: 'New question?', answer_html: '<p>Answer.</p>' }],
      })
    );
  return (
    <div className="space-y-4">
      <Field label="Section title (optional)">
        <input
          type="text"
          value={block.props.title ?? ''}
          onChange={(e) =>
            onChange(setBlockProps(block, { title: e.target.value || undefined }))
          }
          className={inputClass}
        />
      </Field>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg border border-th-border bg-surface-primary space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-th-text-secondary">Q&A {idx + 1}</span>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-xs text-rose-600 hover:underline"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              value={item.question}
              onChange={(e) => update(idx, { question: e.target.value })}
              placeholder="Question"
              className={inputClass}
            />
            <RichTextEditor
              content={item.answer_html}
              onChange={(html) => update(idx, { answer_html: html })}
              placeholder="Answer…"
              minHeight="120px"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary"
      >
        <Plus className="w-4 h-4" />
        Add question
      </button>
    </div>
  );
}

function EmbedForm({
  block,
  onChange,
}: {
  block: Extract<CmsBlock, { kind: 'embed' }>;
  onChange: (b: CmsBlock) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="URL" hint="YouTube, Vimeo, or any https iframe URL.">
        <input
          type="url"
          value={block.props.url}
          onChange={(e) => onChange(setBlockProps(block, { url: e.target.value }))}
          placeholder="https://www.youtube.com/watch?v=…"
          className={inputClass}
        />
      </Field>
      <Field label="Accessible title">
        <input
          type="text"
          value={block.props.title ?? ''}
          onChange={(e) =>
            onChange(setBlockProps(block, { title: e.target.value || undefined }))
          }
          className={inputClass}
        />
      </Field>
      <Field label="Aspect ratio">
        <select
          value={block.props.aspect_ratio ?? '16:9'}
          onChange={(e) =>
            onChange(
              setBlockProps(block, {
                aspect_ratio: e.target.value as '16:9' | '4:3' | '1:1',
              })
            )
          }
          className={inputClass}
        >
          <option value="16:9">16:9</option>
          <option value="4:3">4:3</option>
          <option value="1:1">1:1</option>
        </select>
      </Field>
    </div>
  );
}

function SpacerForm({
  block,
  onChange,
}: {
  block: Extract<CmsBlock, { kind: 'spacer' }>;
  onChange: (b: CmsBlock) => void;
}) {
  return (
    <Field label="Size">
      <select
        value={block.props.size ?? 'md'}
        onChange={(e) =>
          onChange(setBlockProps(block, { size: e.target.value as 'sm' | 'md' | 'lg' | 'xl' }))
        }
        className={inputClass}
      >
        <option value="sm">Small</option>
        <option value="md">Medium</option>
        <option value="lg">Large</option>
        <option value="xl">Extra large</option>
      </select>
    </Field>
  );
}

// ---------------------------------------------------------------------------
// Add-block picker (shown below the section list)
// ---------------------------------------------------------------------------

function AddBlockPicker({ onAdd }: { onAdd: (kind: CmsBlockKind) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-surface-primary border border-dashed border-th-border rounded-xl p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-3 text-th-accent-600 font-medium hover:bg-surface-tertiary rounded-lg transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add section
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-3 border-t border-th-border">
          {BLOCKS.map((b) => (
            <button
              key={b.kind}
              type="button"
              onClick={() => {
                onAdd(b.kind);
                setOpen(false);
              }}
              className="text-left p-3 rounded-lg border border-th-border hover:border-th-accent-500 hover:bg-surface-tertiary transition-colors"
            >
              <div className="font-medium text-th-text-primary">{b.label}</div>
              <div className="text-xs text-th-text-tertiary mt-0.5">{b.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
