import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, FileText, Loader2 } from 'lucide-react';
import {
  buildPageListRows,
  pagesAdminService,
  type SitePageCatalogEntry,
} from '@mpbhealth/admin-core';
import { PageListRowItem } from '../components/cms/PageListRowItem';
import { supabase, safeRemoveChannel } from '@mpbhealth/database';
import type { CmsPage } from '@mpbhealth/database';

type Filter = 'all' | 'published' | 'drafts';

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function PagesList() {
  const navigate = useNavigate();
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const fetchPages = useMemo(
    () => async () => {
      try {
        const data = await pagesAdminService.getPages({
          search: search.trim() || undefined,
        });
        setPages(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        // Migration not run yet? Show empty state instead of a scary error.
        if (msg.includes('schema cache') || msg.includes('does not exist')) {
          setPages([]);
        } else {
          toast.error(`Failed to load pages: ${msg}`);
        }
      } finally {
        setLoading(false);
      }
    },
    [search]
  );

  const rows = useMemo(
    () => buildPageListRows(pages, { search: search.trim(), filter }),
    [pages, search, filter]
  );

  useEffect(() => {
    setLoading(true);
    fetchPages();
  }, [fetchPages]);

  // Realtime: keep the list fresh as other admins (or this admin from another
  // tab) make changes.
  useEffect(() => {
    const channel = supabase
      .channel('cms-pages-admin-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cms_pages' },
        () => {
          fetchPages();
        }
      )
      .subscribe();

    return () => safeRemoveChannel(channel);
  }, [fetchPages]);

  const handleTogglePublish = async (page: CmsPage) => {
    setPendingAction(page.id);
    const toastId = toast.loading(
      page.is_published ? 'Unpublishing…' : 'Publishing…'
    );
    try {
      if (page.is_published) await pagesAdminService.unpublishPage(page.id);
      else await pagesAdminService.publishPage(page.id);
      toast.success(page.is_published ? 'Unpublished' : 'Published', { id: toastId });
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`, {
        id: toastId,
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleDuplicate = async (page: CmsPage) => {
    setPendingAction(page.id);
    const toastId = toast.loading('Duplicating page…');
    try {
      const copy = await pagesAdminService.duplicatePage(page.id);
      toast.success('Page duplicated', { id: toastId });
      navigate(`/cms/pages/${copy.id}`);
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`, {
        id: toastId,
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleEnableInCms = async (entry: SitePageCatalogEntry) => {
    setPendingAction(entry.path);
    const toastId = toast.loading('Preparing page in CMS…');
    try {
      const page = await pagesAdminService.ensureSitePage(entry);
      toast.success('Ready to edit', { id: toastId });
      navigate(`/cms/pages/${page.id}`);
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`, {
        id: toastId,
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async (page: CmsPage) => {
    if (!window.confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    setPendingAction(page.id);
    const toastId = toast.loading('Deleting page…');
    try {
      await pagesAdminService.deletePage(page.id);
      toast.success('Page deleted', { id: toastId });
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`, {
        id: toastId,
      });
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Pages</h1>
          <p className="text-sm text-th-text-secondary mt-1">
            Edit every page on the public site. Published CMS content replaces the legacy
            React page at the same URL (e.g.{' '}
            <code className="px-1.5 py-0.5 bg-surface-tertiary rounded text-xs">/about-us</code>
            ). Extra pages can also live at{' '}
            <code className="px-1.5 py-0.5 bg-surface-tertiary rounded text-xs">/p/&lt;slug&gt;</code>.
          </p>
        </div>
        <Link
          to="/cms/pages/new"
          className="inline-flex items-center gap-2 bg-th-accent-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Page
        </Link>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, path, or slug…"
            className="w-full pl-9 pr-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
          />
        </div>
        <div className="inline-flex rounded-lg border border-th-border bg-surface-primary p-0.5">
          {(['all', 'published', 'drafts'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                filter === f
                  ? 'bg-th-accent-600 text-white'
                  : 'text-th-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface-primary border border-th-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-th-accent-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-th-text-tertiary mx-auto mb-3" />
            <p className="text-th-text-secondary">
              {search.trim()
                ? 'No pages match your search.'
                : 'No pages yet. Create your first one.'}
            </p>
            {!search.trim() && (
              <Link
                to="/cms/pages/new"
                className="inline-flex items-center gap-2 mt-4 bg-th-accent-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Page
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-th-border/60">
            {rows.map((row) => (
              <PageListRowItem
                key={row.kind === 'cms' ? row.page.id : row.entry.path}
                row={row}
                pendingAction={pendingAction}
                formatRelative={formatRelative}
                onTogglePublish={handleTogglePublish}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onEnableInCms={handleEnableInCms}
                editorBasePath="/cms/pages"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
