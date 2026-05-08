import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Globe,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  seoAdminService,
  type SeoMetadataRow,
  type SeoMetadataCreateInput,
  type SeoStats,
  type SitemapImportResult,
} from '@mpbhealth/admin-core';
import { DOMAINS } from '@mpbhealth/config';

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;
const DEFAULT_OG_IMAGE = 'https://mpb.health/assets/MPB-Health-No-background.png?v=2';
const SITEMAP_URL = `https://${DOMAINS.website}/sitemap.xml`;

const EMPTY_FORM: SeoMetadataCreateInput = {
  page_path: '',
  meta_title: null,
  meta_description: null,
  meta_keywords: null,
  og_title: null,
  og_description: null,
  og_image: null,
  og_type: 'website',
  twitter_card: 'summary_large_image',
  twitter_title: null,
  twitter_description: null,
  twitter_image: null,
  canonical_url: null,
  robots: 'index,follow',
  structured_data: null,
  priority: 0.5,
  change_frequency: 'weekly',
};

type EditingRow = SeoMetadataRow | null;

export default function SeoMetadata() {
  const [rows, setRows] = useState<SeoMetadataRow[]>([]);
  const [stats, setStats] = useState<SeoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<EditingRow>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<SeoMetadataCreateInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<SitemapImportResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        seoAdminService.getAll({ search: search || undefined }),
        seoAdminService.getStats(),
      ]);
      setRows(data);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load SEO metadata:', err);
      toast.error('Failed to load SEO metadata');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditing(null);
    setCreating(true);
  }

  function openEdit(row: SeoMetadataRow) {
    setForm({
      page_path: row.page_path,
      meta_title: row.meta_title,
      meta_description: row.meta_description,
      meta_keywords: row.meta_keywords,
      og_title: row.og_title,
      og_description: row.og_description,
      og_image: row.og_image,
      og_type: row.og_type,
      twitter_card: row.twitter_card,
      twitter_title: row.twitter_title,
      twitter_description: row.twitter_description,
      twitter_image: row.twitter_image,
      canonical_url: row.canonical_url,
      robots: row.robots,
      structured_data: row.structured_data,
      priority: row.priority,
      change_frequency: row.change_frequency,
    });
    setEditing(row);
    setCreating(false);
  }

  function closeDrawer() {
    setEditing(null);
    setCreating(false);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.page_path.trim()) {
      toast.error('Page path is required (e.g. /, /plans, /about)');
      return;
    }
    if (!form.page_path.startsWith('/')) {
      toast.error('Page path must start with /');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await seoAdminService.update(editing.id, form);
        toast.success('SEO metadata updated');
      } else {
        await seoAdminService.create(form);
        toast.success('SEO metadata created');
      }
      closeDrawer();
      await load();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error(`Save failed: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: SeoMetadataRow) {
    if (!confirm(`Delete SEO metadata for ${row.page_path}? This cannot be undone.`)) return;
    try {
      await seoAdminService.delete(row.id);
      toast.success('Deleted');
      await load();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Delete failed');
    }
  }

  async function handleSitemapImport() {
    if (!confirm(`Import paths from ${SITEMAP_URL}? Existing rows will not be modified.`)) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await seoAdminService.importFromSitemap(SITEMAP_URL);
      setImportResult(result);
      if (result.errors.length > 0) {
        toast.error(`Imported with ${result.errors.length} error(s)`);
      } else {
        toast.success(`Added ${result.added} new path(s), skipped ${result.skipped} existing`);
      }
      await load();
    } catch (err) {
      console.error('Sitemap import failed:', err);
      toast.error('Sitemap import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="h-6 w-6 text-indigo-600" />
            SEO Metadata
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Edit per-page meta tags (title, description, OG, Twitter) for the public website.
            Changes propagate within 5 minutes via Vercel Edge Middleware — no redeploy needed.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleSitemapImport}
            disabled={importing}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Sync from sitemap
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add page
          </button>
        </div>
      </header>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Total pages" value={stats.total} />
          <StatCard label="With title" value={stats.withTitle} />
          <StatCard label="With description" value={stats.withDescription} />
          <StatCard label="With OG image" value={stats.withOgImage} />
          <StatCard label="Missing description" value={stats.missingDescription} tone={stats.missingDescription > 0 ? 'warn' : 'ok'} />
        </div>
      )}

      {importResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
          <p className="font-medium text-blue-900">Sitemap import — fetched {importResult.fetched}, added {importResult.added}, skipped {importResult.skipped}.</p>
          {importResult.errors.length > 0 && (
            <ul className="list-disc list-inside text-red-700 mt-1">
              {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by path, title, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No SEO metadata rows yet.</p>
            <p className="text-sm text-gray-500 mt-1">Click "Sync from sitemap" or "Add page" to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Path</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Description</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-700">{row.page_path}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-gray-800">{row.meta_title || <span className="italic text-gray-400">— missing —</span>}</td>
                  <td className="px-4 py-3 max-w-md truncate text-gray-600">{row.meta_description || <span className="italic text-gray-400">— missing —</span>}</td>
                  <td className="px-4 py-3">
                    <CompletenessBadge row={row} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(row)}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(row)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded ml-1"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(editing || creating) && (
        <EditorDrawer
          form={form}
          setForm={setForm}
          isCreating={creating}
          saving={saving}
          onClose={closeDrawer}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'warn' }) {
  const toneClass = tone === 'warn' ? 'text-amber-700' : 'text-gray-900';
  return (
    <div className="bg-white border border-gray-200 rounded-md px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function CompletenessBadge({ row }: { row: SeoMetadataRow }) {
  const missing: string[] = [];
  if (!row.meta_title?.trim()) missing.push('title');
  if (!row.meta_description?.trim()) missing.push('description');
  if (!row.og_image?.trim()) missing.push('OG image');

  if (missing.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
        <CheckCircle2 className="h-3 w-3" />
        Complete
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800" title={`Missing: ${missing.join(', ')}`}>
      <AlertCircle className="h-3 w-3" />
      Missing {missing.length}
    </span>
  );
}

// ─── Editor Drawer ─────────────────────────────────────────────────────────

interface EditorDrawerProps {
  form: SeoMetadataCreateInput;
  setForm: (next: SeoMetadataCreateInput) => void;
  isCreating: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}

function EditorDrawer({ form, setForm, isCreating, saving, onClose, onSave }: EditorDrawerProps) {
  const update = (patch: Partial<SeoMetadataCreateInput>) => setForm({ ...form, ...patch });

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-3xl bg-white shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            {isCreating ? 'Add page metadata' : `Edit ${form.page_path}`}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
          <Section title="Page">
            <Field label="Page path" hint="The URL path on the public website. Must start with /." required>
              <input
                type="text"
                value={form.page_path}
                onChange={(e) => update({ page_path: e.target.value })}
                disabled={!isCreating}
                placeholder="/plans"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono disabled:bg-gray-100"
              />
            </Field>
            <Field label="Canonical URL" hint="Override the canonical URL. Leave blank to use the path on the website domain.">
              <input
                type="text"
                value={form.canonical_url ?? ''}
                onChange={(e) => update({ canonical_url: e.target.value || null })}
                placeholder={`https://${DOMAINS.website}${form.page_path || '/'}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </Field>
            <Field label="Robots">
              <select
                value={form.robots ?? 'index,follow'}
                onChange={(e) => update({ robots: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="index,follow">index, follow (default)</option>
                <option value="noindex,follow">noindex, follow</option>
                <option value="index,nofollow">index, nofollow</option>
                <option value="noindex,nofollow">noindex, nofollow</option>
              </select>
            </Field>
          </Section>

          <Section title="Search engine listing">
            <Field
              label="Meta title"
              hint={`Shown as the headline in Google. ${TITLE_LIMIT} chars max for best display.`}
              warn={(form.meta_title?.length ?? 0) > TITLE_LIMIT}
            >
              <input
                type="text"
                value={form.meta_title ?? ''}
                onChange={(e) => update({ meta_title: e.target.value || null })}
                placeholder="MPB Health — Affordable Health Sharing"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <CharCounter value={form.meta_title} limit={TITLE_LIMIT} />
            </Field>
            <Field
              label="Meta description"
              hint={`Shown as the snippet in Google. ${DESCRIPTION_LIMIT} chars max.`}
              warn={(form.meta_description?.length ?? 0) > DESCRIPTION_LIMIT}
            >
              <textarea
                value={form.meta_description ?? ''}
                onChange={(e) => update({ meta_description: e.target.value || null })}
                rows={3}
                placeholder="A 1-2 sentence summary of the page that will appear in search results."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <CharCounter value={form.meta_description} limit={DESCRIPTION_LIMIT} />
            </Field>
            <Field label="Keywords" hint="Comma-separated; mostly ignored by Google but read by some bots.">
              <input
                type="text"
                value={(form.meta_keywords ?? []).join(', ')}
                onChange={(e) =>
                  update({
                    meta_keywords: e.target.value.trim()
                      ? e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                      : null,
                  })
                }
                placeholder="health sharing, healthcare, families"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </Field>
          </Section>

          <Section title="Social link preview (Open Graph + Twitter)">
            <p className="text-xs text-gray-500">
              Defaults to the meta title/description if not overridden.
            </p>
            <Field label="OG title (override)">
              <input
                type="text"
                value={form.og_title ?? ''}
                onChange={(e) => update({ og_title: e.target.value || null })}
                placeholder="Defaults to meta title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </Field>
            <Field label="OG description (override)">
              <textarea
                value={form.og_description ?? ''}
                onChange={(e) => update({ og_description: e.target.value || null })}
                rows={2}
                placeholder="Defaults to meta description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </Field>
            <Field label="OG image URL" hint="1200×630 px recommended. Must be a public URL.">
              <input
                type="text"
                value={form.og_image ?? ''}
                onChange={(e) => update({ og_image: e.target.value || null })}
                placeholder={DEFAULT_OG_IMAGE}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Twitter card">
                <select
                  value={form.twitter_card ?? 'summary_large_image'}
                  onChange={(e) => update({ twitter_card: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="summary_large_image">summary_large_image</option>
                  <option value="summary">summary</option>
                </select>
              </Field>
              <Field label="OG type">
                <select
                  value={form.og_type ?? 'website'}
                  onChange={(e) => update({ og_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="website">website</option>
                  <option value="article">article</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Live preview">
            <PreviewGoogle title={form.meta_title} description={form.meta_description} pagePath={form.page_path} />
            <PreviewSocial
              title={form.og_title || form.meta_title}
              description={form.og_description || form.meta_description}
              image={form.og_image}
              pagePath={form.page_path}
            />
          </Section>
        </div>

        <footer className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : isCreating ? 'Create' : 'Save'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-1">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  warn,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && (
        <p className={`text-xs mt-1 ${warn ? 'text-amber-700' : 'text-gray-500'}`}>{hint}</p>
      )}
    </div>
  );
}

function CharCounter({ value, limit }: { value: string | null | undefined; limit: number }) {
  const count = value?.length ?? 0;
  const over = count > limit;
  return (
    <p className={`text-xs mt-0.5 text-right ${over ? 'text-red-600' : count > limit * 0.9 ? 'text-amber-600' : 'text-gray-400'}`}>
      {count} / {limit}
    </p>
  );
}

// ─── Live preview cards ────────────────────────────────────────────────────

function PreviewGoogle({
  title,
  description,
  pagePath,
}: {
  title: string | null;
  description: string | null;
  pagePath: string;
}) {
  const url = `https://${DOMAINS.website}${pagePath || '/'}`;
  return (
    <div className="bg-white border border-gray-200 rounded-md p-4 max-w-2xl">
      <div className="text-[11px] text-gray-500 mb-0.5">Google search result</div>
      <div className="text-xs text-gray-700">{url.replace('https://', '')}</div>
      <div className="text-base text-blue-700 hover:underline cursor-pointer mt-0.5">
        {title || 'MPB Health'}
      </div>
      <div className="text-sm text-gray-700 mt-1 line-clamp-2">
        {description || 'No description set — Google will auto-generate one from page content.'}
      </div>
    </div>
  );
}

function PreviewSocial({
  title,
  description,
  image,
  pagePath,
}: {
  title: string | null;
  description: string | null;
  image: string | null;
  pagePath: string;
}) {
  const previewImage = image || DEFAULT_OG_IMAGE;
  const domain = DOMAINS.website;
  const url = `${domain}${pagePath || '/'}`;
  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden max-w-md">
      <div className="text-[11px] text-gray-500 mb-0.5 px-3 pt-2">Slack / Facebook / iMessage card</div>
      <img
        src={previewImage}
        alt=""
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
        className="w-full aspect-[1200/630] object-cover bg-gray-100"
      />
      <div className="px-3 py-2 border-t border-gray-100">
        <div className="text-[11px] uppercase tracking-wide text-gray-500">{url}</div>
        <div className="text-sm font-semibold text-gray-900 line-clamp-1 mt-0.5">
          {title || 'MPB Health'}
        </div>
        <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">
          {description || 'No description set.'}
        </div>
      </div>
    </div>
  );
}
