import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  FileText,
  Megaphone,
  HelpCircle,
  BookOpen,
  ClipboardList,
  Link as LinkIcon,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  ArrowUpRight,
  Sparkles,
  AlertCircle,
  LayoutTemplate,
  FolderOpen,
  ArrowRightLeft,
  Calendar,
  Search,
  Shield,
  Layers,
  Palette,
  FormInput,
  MessageSquare,
} from 'lucide-react';
import { supabase, safeRemoveChannel } from '@mpbhealth/database';
import type { LucideIcon } from 'lucide-react';

interface ContentType {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  table?: string;
  publishedColumn?: string;
  draftColumn?: string;
  adminListPath: string;
  adminNewPath: string;
  publicPath?: string;
  accent: string;
}

const CONTENT_TYPES: ContentType[] = [
  {
    key: 'pages',
    label: 'Pages',
    description: 'Edit all public site pages (home, about, plans, contact, and more) with the block editor',
    icon: LayoutTemplate,
    table: 'cms_pages',
    publishedColumn: 'is_published',
    adminListPath: '/cms/pages',
    adminNewPath: '/cms/pages/new',
    accent: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  },
  {
    key: 'media',
    label: 'Media Library',
    description: 'Upload, organize, and manage images, videos, and documents',
    icon: FolderOpen,
    table: 'cms_media',
    adminListPath: '/cms/media',
    adminNewPath: '/cms/media',
    accent: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
  },
  {
    key: 'templates',
    label: 'Templates',
    description: 'Reusable page layouts and global blocks',
    icon: Layers,
    table: 'cms_templates',
    adminListPath: '/cms/templates',
    adminNewPath: '/cms/templates',
    accent: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
  },
  {
    key: 'theme',
    label: 'Theme & Styles',
    description: 'Colors, typography, buttons, and global design settings',
    icon: Palette,
    table: 'cms_theme',
    adminListPath: '/cms/theme',
    adminNewPath: '/cms/theme',
    accent: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30',
  },
  {
    key: 'forms',
    label: 'Form Builder',
    description: 'Drag-and-drop forms with submissions inbox',
    icon: FormInput,
    table: 'cms_forms',
    adminListPath: '/cms/forms',
    adminNewPath: '/cms/forms',
    accent: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  },
  {
    key: 'popups',
    label: 'Popups',
    description: 'Modal builder with triggers, targeting, and analytics',
    icon: MessageSquare,
    table: 'cms_popups',
    adminListPath: '/cms/popups',
    adminNewPath: '/cms/popups',
    accent: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  },
  {
    key: 'redirects',
    label: 'Redirects',
    description: 'Manage 301/302 URL redirects with hit tracking',
    icon: ArrowRightLeft,
    table: 'cms_redirects',
    adminListPath: '/cms/redirects',
    adminNewPath: '/cms/redirects',
    accent: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
  },
  {
    key: 'calendar',
    label: 'Content Calendar',
    description: 'Visual calendar of all scheduled and published content',
    icon: Calendar,
    adminListPath: '/cms/calendar',
    adminNewPath: '/cms/calendar',
    accent: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  },
  {
    key: 'seo',
    label: 'SEO Suite',
    description: 'Sitemap, meta management, SEO scoring, and schema markup',
    icon: Search,
    adminListPath: '/cms/seo',
    adminNewPath: '/cms/seo',
    accent: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  {
    key: 'permissions',
    label: 'Permissions',
    description: 'Content roles, approval workflows, and team access',
    icon: Shield,
    adminListPath: '/cms/permissions',
    adminNewPath: '/cms/permissions',
    accent: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  {
    key: 'events',
    label: 'Events',
    description: 'Conferences, webinars, and community gatherings',
    icon: CalendarDays,
    table: 'events',
    publishedColumn: 'is_published',
    adminListPath: '/events',
    adminNewPath: '/events/new',
    publicPath: '/events',
    accent: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  {
    key: 'blog',
    label: 'Blog Posts',
    description: 'Articles, insights, and healthcare updates',
    icon: BookOpen,
    table: 'blog_articles',
    publishedColumn: 'is_published',
    adminListPath: '/content/blog',
    adminNewPath: '/content/blog/new',
    publicPath: '/blog',
    accent: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  },
  {
    key: 'bulletins',
    label: 'Bulletins',
    description: 'Newsletter-style internal posts',
    icon: FileText,
    table: 'advisor_content',
    publishedColumn: 'is_published',
    adminListPath: '/content/bulletins',
    adminNewPath: '/content/bulletins/new',
    accent: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  {
    key: 'announcements',
    label: 'Announcements',
    description: 'Organization-wide broadcasts and notices',
    icon: Megaphone,
    table: 'advisor_announcements',
    adminListPath: '/content/announcements',
    adminNewPath: '/content/announcements',
    accent: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  },
  {
    key: 'faq',
    label: 'FAQs',
    description: 'Frequently asked questions and answers',
    icon: HelpCircle,
    table: 'faq_items',
    adminListPath: '/content/faq',
    adminNewPath: '/content/faq',
    publicPath: '/faq',
    accent: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  },
  {
    key: 'sops',
    label: 'SOPs',
    description: 'Standard Operating Procedures',
    icon: ClipboardList,
    table: 'sop_documents',
    adminListPath: '/content/sops',
    adminNewPath: '/content/sops/new',
    accent: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
  },
  {
    key: 'training',
    label: 'Training',
    description: 'Courses, modules, and lessons',
    icon: BookOpen,
    table: 'training_modules',
    adminListPath: '/content/training',
    adminNewPath: '/content/training/new',
    accent: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  },
  {
    key: 'quick-links',
    label: 'Quick Links',
    description: 'Navigation helpers across the portal',
    icon: LinkIcon,
    table: 'advisor_quick_links',
    adminListPath: '/content/quick-links',
    adminNewPath: '/content/quick-links',
    accent: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
  },
  {
    key: 'videos',
    label: 'Video Library',
    description: 'Embedded and uploaded videos',
    icon: Video,
    table: 'advisor_videos',
    adminListPath: '/content/videos',
    adminNewPath: '/content/videos',
    accent: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
  },
  {
    key: 'seo',
    label: 'SEO Metadata',
    description: 'Per-page title, description, and Open Graph',
    icon: Sparkles,
    table: 'seo_metadata',
    adminListPath: '/content/seo',
    adminNewPath: '/content/seo',
    accent: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
  },
];

interface TypeStats {
  total: number;
  published: number | null;
  drafts: number | null;
  lastUpdated: string | null;
  error: string | null;
}

const PUBLIC_SITE_URL =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ||
  'https://mpb.health';

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'warn' | 'muted';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-700 dark:text-emerald-300'
      : tone === 'warn'
        ? 'text-amber-700 dark:text-amber-300'
        : tone === 'muted'
          ? 'text-th-text-tertiary'
          : 'text-th-text-primary';
  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-sm font-semibold tabular-nums ${toneClass}`}>{value}</span>
      <span className="text-xs text-th-text-tertiary">{label}</span>
    </div>
  );
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.round((now - then) / 1000));
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function CmsHub() {
  const [stats, setStats] = useState<Record<string, TypeStats>>({});
  const [loading, setLoading] = useState(true);

  const loadStats = useMemo(
    () => async () => {
      const next: Record<string, TypeStats> = {};
      await Promise.all(
        CONTENT_TYPES.map(async (ct) => {
          if (!ct.table) {
            next[ct.key] = { total: 0, published: null, drafts: null, lastUpdated: null, error: null };
            return;
          }
          try {
            // Total count
            const totalRes = await supabase
              .from(ct.table)
              .select('*', { count: 'exact', head: true });

            // Tables that don't exist yet (migrations not run) surface as
            // PGRST205/204 — show "—" instead of an error toast so the hub
            // stays usable when the schema is partial.
            if (
              totalRes.error?.code === 'PGRST205' ||
              totalRes.error?.code === 'PGRST204'
            ) {
              next[ct.key] = {
                total: 0,
                published: null,
                drafts: null,
                lastUpdated: null,
                error: 'Table not in schema',
              };
              return;
            }

            const total = totalRes.count ?? 0;
            let published: number | null = null;
            let drafts: number | null = null;

            if (ct.publishedColumn) {
              const pubRes = await supabase
                .from(ct.table)
                .select('*', { count: 'exact', head: true })
                .eq(ct.publishedColumn, true);
              published = pubRes.count ?? 0;
              drafts = Math.max(0, total - published);
            }

            // Most recent update
            const lastRes = await supabase
              .from(ct.table)
              .select('updated_at')
              .order('updated_at', { ascending: false })
              .limit(1);
            const lastUpdated =
              (lastRes.data?.[0] as { updated_at?: string } | undefined)?.updated_at ??
              null;

            next[ct.key] = {
              total,
              published,
              drafts,
              lastUpdated,
              error: totalRes.error?.message ?? null,
            };
          } catch (e) {
            next[ct.key] = {
              total: 0,
              published: null,
              drafts: null,
              lastUpdated: null,
              error: e instanceof Error ? e.message : 'Failed to load',
            };
          }
        })
      );
      setStats(next);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    loadStats();

    // Realtime: refresh stats whenever any CMS table changes so the hub
    // stays accurate without manual refresh.
    const channels = CONTENT_TYPES.filter((ct) => ct.table).map((ct) =>
      supabase
        .channel(`cms-hub:${ct.table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: ct.table! },
          () => {
            // Debounce slightly — Realtime can fire bursts on bulk updates.
            window.clearTimeout((window as unknown as { __cmsHubTimer?: number }).__cmsHubTimer);
            (window as unknown as { __cmsHubTimer?: number }).__cmsHubTimer = window.setTimeout(
              loadStats,
              250
            );
          }
        )
        .subscribe()
    );

    return () => {
      channels.forEach(safeRemoveChannel);
    };
  }, [loadStats]);

  const totalPublished = useMemo(
    () =>
      Object.values(stats).reduce((acc, s) => acc + (s.published ?? 0), 0),
    [stats]
  );
  const totalDrafts = useMemo(
    () =>
      Object.values(stats).reduce((acc, s) => acc + (s.drafts ?? 0), 0),
    [stats]
  );
  const totalItems = useMemo(
    () => Object.values(stats).reduce((acc, s) => acc + s.total, 0),
    [stats]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">CMS Hub</h1>
          <p className="text-sm text-th-text-secondary mt-1">
            Manage everything that appears on{' '}
            <a
              href={PUBLIC_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-th-accent-600 hover:underline"
            >
              {PUBLIC_SITE_URL.replace(/^https?:\/\//, '')}
              <ExternalLink className="inline w-3 h-3 ml-0.5 -mt-0.5" />
            </a>
            . Edits publish in real-time — open the public site in a second tab to preview live.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="px-4 py-2 rounded-lg bg-surface-secondary border border-th-border">
            <div className="text-xs text-th-text-tertiary">Published</div>
            <div className="text-xl font-bold text-emerald-600 tabular-nums">{totalPublished}</div>
          </div>
          <div className="px-4 py-2 rounded-lg bg-surface-secondary border border-th-border">
            <div className="text-xs text-th-text-tertiary">Drafts</div>
            <div className="text-xl font-bold text-amber-600 tabular-nums">{totalDrafts}</div>
          </div>
          <div className="px-4 py-2 rounded-lg bg-surface-secondary border border-th-border">
            <div className="text-xs text-th-text-tertiary">Total items</div>
            <div className="text-xl font-bold text-th-text-primary tabular-nums">{totalItems}</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONTENT_TYPES.map((ct) => {
          const s = stats[ct.key];
          const Icon = ct.icon;
          return (
            <div
              key={ct.key}
              className="group relative bg-surface-primary border border-th-border rounded-xl p-5 hover:border-th-accent-500 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg border ${ct.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    to={ct.adminNewPath}
                    title={`New ${ct.label}`}
                    className="p-1.5 rounded-md text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                  {ct.publicPath && (
                    <a
                      href={`${PUBLIC_SITE_URL}${ct.publicPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on site"
                      className="p-1.5 rounded-md text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <Link
                to={ct.adminListPath}
                className="block group/link"
              >
                <h3 className="font-semibold text-th-text-primary group-hover/link:text-th-accent-600 transition-colors flex items-center gap-1">
                  {ct.label}
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-th-text-secondary mt-1 line-clamp-2 min-h-[2rem]">
                  {ct.description}
                </p>
              </Link>

              <div className="mt-4 pt-3 border-t border-th-border/60 flex items-center justify-between gap-3">
                {s?.error ? (
                  <div className="flex items-center gap-1.5 text-xs text-th-text-tertiary">
                    <AlertCircle className="w-3 h-3" />
                    <span>{s.error === 'Table not in schema' ? 'Not provisioned' : 'Error loading'}</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {s?.published != null ? (
                      <>
                        <StatChip label="published" value={s.published} tone="success" />
                        <StatChip label="drafts" value={s?.drafts ?? 0} tone="warn" />
                      </>
                    ) : (
                      <StatChip
                        label="total"
                        value={loading ? '…' : (s?.total ?? 0)}
                      />
                    )}
                  </div>
                )}
                <div className="text-xs text-th-text-tertiary whitespace-nowrap">
                  {formatRelative(s?.lastUpdated ?? null)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="bg-surface-primary border border-th-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-th-text-primary mb-3 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-th-text-secondary" />
          How publishing works
        </h2>
        <ul className="text-sm text-th-text-secondary space-y-1.5">
          <li className="flex gap-2">
            <span className="text-th-accent-600">1.</span>
            <span>
              Edit any content type above and click <strong>Publish</strong>. Changes write to
              the database immediately.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-th-accent-600">2.</span>
            <span>
              The public site subscribes to live updates — visitors with the page open see new
              content within ~1 second.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-th-accent-600">3.</span>
            <span>
              SEO / social previews currently serve the static fallback metadata from
              index.html — the per-page runtime injection pipeline is being rebuilt.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
