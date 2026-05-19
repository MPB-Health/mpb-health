import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
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
  PanelRightOpen,
  PanelLeftOpen,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
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
  CmsBannerProps,
  CmsTestimonialProps,
  CmsTestimonialCarouselProps,
  CmsPricingTableProps,
  CmsTabsProps,
  CmsAccordionProps,
  CmsTeamGridProps,
  CmsLogoWallProps,
  CmsCountdownProps,
  CmsNewsletterSignupProps,
  CmsDividerProps,
  CmsVideoHeroProps,
  CmsIconGridProps,
  CmsAlertBoxProps,
  CmsButtonGroupProps,
  CmsMapProps,
  CmsTableProps,
  CmsSectionProps,
  CmsColumnsProps,
  CmsContainerProps,
} from '@mpbhealth/database';
import { useAuth } from '../../../contexts/AuthContext';
import RichTextEditor from '../../../components/admin/RichTextEditor';
import { ImageUploader } from '../../../components/admin/cms/ImageUploader';
import { PageBuilderCanvas } from '../../../components/admin/cms/PageBuilderCanvas';
import { BlockPalette } from '../../../components/admin/cms/BlockPalette';
import { BlockInspector } from '../../../components/admin/cms/BlockInspector';

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
  {
    kind: 'banner',
    label: 'Banner',
    description: 'Announcement bar',
    defaultProps: { text: 'Announcement text here', variant: 'info', dismissible: true } as CmsBannerProps,
  },
  {
    kind: 'testimonial',
    label: 'Testimonial',
    description: 'Quote with author',
    defaultProps: { quote: 'Great experience!', author_name: 'John Doe', author_title: 'CEO' } as CmsTestimonialProps,
  },
  {
    kind: 'testimonial_carousel',
    label: 'Testimonial Carousel',
    description: 'Rotating quotes',
    defaultProps: { items: [{ quote: 'Amazing service!', author_name: 'Jane Doe' }], auto_rotate: true } as CmsTestimonialCarouselProps,
  },
  {
    kind: 'pricing_table',
    label: 'Pricing Table',
    description: 'Plan comparison columns',
    defaultProps: { plans: [{ name: 'Basic', price: '$29', features: ['Feature 1'], cta: { label: 'Get started', href: '/signup' } }] } as CmsPricingTableProps,
  },
  {
    kind: 'tabs',
    label: 'Tabs',
    description: 'Tabbed content sections',
    defaultProps: { tabs: [{ label: 'Tab 1', content_html: '<p>Content</p>' }] } as CmsTabsProps,
  },
  {
    kind: 'accordion',
    label: 'Accordion',
    description: 'Expandable sections',
    defaultProps: { items: [{ heading: 'Section 1', content_html: '<p>Content</p>' }] } as CmsAccordionProps,
  },
  {
    kind: 'team_grid',
    label: 'Team Grid',
    description: 'People cards',
    defaultProps: { columns: 3, members: [{ name: 'Team Member', role: 'Role' }] } as CmsTeamGridProps,
  },
  {
    kind: 'logo_wall',
    label: 'Logo Wall',
    description: 'Partner/client logos',
    defaultProps: { logos: [], columns: 4, grayscale: true } as CmsLogoWallProps,
  },
  {
    kind: 'countdown',
    label: 'Countdown',
    description: 'Timer to a date',
    defaultProps: { title: 'Coming soon', target_date: new Date(Date.now() + 7 * 86400000).toISOString(), show_days: true, show_hours: true, show_minutes: true, show_seconds: true } as CmsCountdownProps,
  },
  {
    kind: 'newsletter_signup',
    label: 'Newsletter Signup',
    description: 'Email capture form',
    defaultProps: { title: 'Stay updated', subtitle: 'Subscribe to our newsletter', button_label: 'Subscribe', placeholder: 'your@email.com' } as CmsNewsletterSignupProps,
  },
  {
    kind: 'divider',
    label: 'Divider',
    description: 'Styled separator',
    defaultProps: { style: 'line', spacing: 'md' } as CmsDividerProps,
  },
  {
    kind: 'video_hero',
    label: 'Video Hero',
    description: 'Hero with background video',
    defaultProps: { title: 'Video Title', video_url: '', overlay_opacity: 0.5 } as CmsVideoHeroProps,
  },
  {
    kind: 'icon_grid',
    label: 'Icon Grid',
    description: 'Feature cards with icons',
    defaultProps: { columns: 3, items: [{ icon: '⭐', title: 'Feature', description: 'Description' }] } as CmsIconGridProps,
  },
  {
    kind: 'alert_box',
    label: 'Alert Box',
    description: 'Info/warning callout',
    defaultProps: { variant: 'info', title: 'Note', content_html: '<p>Important information here.</p>' } as CmsAlertBoxProps,
  },
  {
    kind: 'button_group',
    label: 'Button Group',
    description: 'Multiple CTA buttons',
    defaultProps: { alignment: 'center', buttons: [{ label: 'Primary', href: '#', variant: 'primary' }] } as CmsButtonGroupProps,
  },
  {
    kind: 'map',
    label: 'Map',
    description: 'Embedded Google Map',
    defaultProps: { address: '', zoom: 14, height: '400px' } as CmsMapProps,
  },
  {
    kind: 'table',
    label: 'Table',
    description: 'Data table',
    defaultProps: { headers: ['Column 1', 'Column 2'], rows: [['Cell 1', 'Cell 2']], striped: true } as CmsTableProps,
  },
  {
    kind: 'section',
    label: 'Section',
    description: 'Full-width section with background',
    defaultProps: { padding_top: 'lg', padding_bottom: 'lg', children: [] } as CmsSectionProps,
  },
  {
    kind: 'columns',
    label: 'Columns',
    description: 'Multi-column grid',
    defaultProps: { layout: '1/2-1/2', gap: 'md', columns: [{ blocks: [] }, { blocks: [] }] } as CmsColumnsProps,
  },
  {
    kind: 'container',
    label: 'Container',
    description: 'Centered max-width wrapper',
    defaultProps: { max_width: 'lg', alignment: 'center', padding: 'md', children: [] } as CmsContainerProps,
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
  const { user } = useAuth();
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
          navigate('/admin/cms/pages');
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
        navigate('/admin/cms/pages');
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
          navigate(`/admin/cms/pages/${created.id}`, { replace: true });
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

  // DnD sensors for the visual builder
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setForm((prev) => {
      const oldIdx = prev.sections.findIndex((s) => s.id === active.id);
      const newIdx = prev.sections.findIndex((s) => s.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return prev;
      return { ...prev, sections: arrayMove(prev.sections, oldIdx, newIdx) };
    });
  };

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const selectedBlock = form.sections.find((s) => s.id === openSectionId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar */}
      <div className="flex-shrink-0 z-20 px-4 py-2 bg-surface-secondary/90 backdrop-blur border-b border-th-border/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/cms/pages')}
            disabled={saving}
            className="flex items-center gap-2 text-th-text-secondary hover:text-th-text-primary disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Pages</span>
          </button>
          <div className="h-5 w-px bg-th-border" />
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Page title…"
            className={`text-lg font-semibold text-th-text-primary bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-th-text-tertiary w-48 sm:w-64 ${
              missing.has('title') ? 'text-red-600' : ''
            }`}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLeftPanel((v) => !v)}
            className="p-2 rounded-md text-th-text-tertiary hover:bg-surface-tertiary"
            title="Toggle page settings"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowRightPanel((v) => !v)}
            className="p-2 rounded-md text-th-text-tertiary hover:bg-surface-tertiary"
            title="Toggle block palette"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>
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
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{saving ? 'Saving…' : 'Unpublish'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="hidden sm:inline">{saving ? 'Saving…' : 'Draft'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                <span className="hidden sm:inline">{saving ? 'Publishing…' : 'Publish'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Three-panel builder */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Page settings & inspector */}
        {showLeftPanel && (
          <div className="w-80 flex-shrink-0 border-r border-th-border bg-surface-primary overflow-y-auto">
            {selectedBlock ? (
              <BlockInspector
                block={selectedBlock}
                onUpdate={(b) => updateSection(selectedBlock.id, () => b)}
                onClose={() => setOpenSectionId(null)}
                renderBlockForm={(block, onChange) => <BlockForm block={block} onChange={onChange} />}
              />
            ) : (
              <div className="p-4 space-y-4">
                <h3 className="text-sm font-semibold text-th-text-primary">Page Settings</h3>

                <div>
                  <label className="block text-xs font-medium text-th-text-secondary mb-1">URL Path *</label>
                  <input
                    type="text"
                    value={form.path}
                    onChange={(e) => setForm((p) => ({ ...p, path: e.target.value }))}
                    placeholder="/p/your-slug"
                    className={`w-full px-3 py-2 bg-surface-primary border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary font-mono text-sm ${
                      missing.has('path') ? 'border-red-400' : 'border-th-border'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-th-text-secondary mb-1">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                    placeholder="auto-generated"
                    className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-th-text-secondary mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="SEO description…"
                    rows={2}
                    className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowMeta((v) => !v)}
                  className="inline-flex items-center gap-2 text-xs text-th-text-secondary hover:text-th-text-primary"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  {showMeta ? 'Hide' : 'Show'} SEO settings
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showMeta ? 'rotate-90' : ''}`} />
                </button>
                {showMeta && <MetaEditor meta={form.meta} onChange={(meta) => setForm((p) => ({ ...p, meta }))} />}
              </div>
            )}
          </div>
        )}

        {/* Center: Visual canvas */}
        <div className="flex-1 min-w-0">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <PageBuilderCanvas
              blocks={form.sections}
              selectedBlockId={openSectionId}
              onSelectBlock={(id) => setOpenSectionId(id)}
              onRemoveBlock={(id) => removeSection(id)}
            />
          </DndContext>
        </div>

        {/* Right panel: Block palette */}
        {showRightPanel && (
          <div className="w-64 flex-shrink-0 border-l border-th-border bg-surface-primary overflow-y-auto p-4">
            <BlockPalette onAddBlock={addSection} />
          </div>
        )}
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
    case 'banner':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'testimonial':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'testimonial_carousel':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'pricing_table':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'tabs':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'accordion':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'team_grid':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'logo_wall':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'countdown':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'newsletter_signup':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'divider':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'video_hero':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'icon_grid':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'alert_box':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'button_group':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'map':
      return <GenericJsonForm block={block} onChange={onChange} />;
    case 'table':
      return <GenericJsonForm block={block} onChange={onChange} />;
    default:
      return <GenericJsonForm block={block} onChange={onChange} />;
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
          onChange={(html: string) => onChange(setBlockProps(block, { html }))}
          placeholder="Start writing…"

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
          onChange={(html: string) => onChange(setBlockProps(block, { body_html: html }))}
          placeholder="Section body…"

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
              onChange={(html: string) => update(idx, { answer_html: html })}
              placeholder="Answer…"

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

function GenericJsonForm({
  block,
  onChange,
}: {
  block: CmsBlock;
  onChange: (b: CmsBlock) => void;
}) {
  const [json, setJson] = useState(() => JSON.stringify(block.props, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleBlur = () => {
    try {
      const parsed = JSON.parse(json);
      setError(null);
      onChange({ ...block, props: parsed } as CmsBlock);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  return (
    <div className="space-y-2">
      <Field label={`${block.kind.replace(/_/g, ' ')} properties (JSON)`} hint="Edit the raw JSON properties for this block.">
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          onBlur={handleBlur}
          rows={12}
          className={`${inputClass} font-mono text-xs`}
          spellCheck={false}
        />
      </Field>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

