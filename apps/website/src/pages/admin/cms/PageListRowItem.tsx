import { Link } from 'react-router-dom';
import { Globe, EyeOff, ExternalLink, Copy, Trash2, Loader2 } from 'lucide-react';
import type { CmsPage } from '@mpbhealth/database';
import type { PageListRow, SitePageCatalogEntry } from '@mpbhealth/admin-core';

const PUBLIC_SITE_URL =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ||
  'https://mpb.health';

interface PageListRowItemProps {
  row: PageListRow;
  pendingAction: string | null;
  formatRelative: (iso: string | null) => string;
  onTogglePublish: (page: CmsPage) => void;
  onDuplicate: (page: CmsPage) => void;
  onDelete: (page: CmsPage) => void;
  onEnableInCms: (entry: SitePageCatalogEntry) => void;
  editorBasePath: string;
}

export function PageListRowItem({
  row,
  pendingAction,
  formatRelative,
  onTogglePublish,
  onDuplicate,
  onDelete,
  onEnableInCms,
  editorBasePath,
}: PageListRowItemProps) {
  if (row.kind === 'catalog') {
    const { entry } = row;
    return (
      <div className="p-4 sm:p-5 hover:bg-surface-secondary/40 transition-colors flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-th-text-primary truncate">{entry.title}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300">
              Static site
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-th-text-tertiary">
            <code className="bg-surface-tertiary px-1.5 py-0.5 rounded">{entry.path}</code>
            <span>Legacy React page — enable CMS to edit with blocks</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={`${PUBLIC_SITE_URL}${entry.path}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View current page"
            className="p-2 rounded-md text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => onEnableInCms(entry)}
            disabled={pendingAction === entry.path}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-th-accent-600 text-white hover:bg-th-accent-700 disabled:opacity-50"
          >
            {pendingAction === entry.path ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Enable in CMS'
            )}
          </button>
        </div>
      </div>
    );
  }

  const { page } = row;
  return (
    <div className="p-4 sm:p-5 hover:bg-surface-secondary/40 transition-colors flex flex-col sm:flex-row sm:items-center gap-4">
      <Link to={`${editorBasePath}/${page.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-th-text-primary truncate">{page.title}</span>
          {page.is_published ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <Globe className="w-3 h-3" />
              Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <EyeOff className="w-3 h-3" />
              Draft
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-th-text-tertiary">
          <code className="bg-surface-tertiary px-1.5 py-0.5 rounded">{page.path}</code>
          <span>{page.sections.length} sections</span>
          <span>Updated {formatRelative(page.updated_at)}</span>
        </div>
      </Link>

      <div className="flex items-center gap-1">
        <a
          href={`${PUBLIC_SITE_URL}${page.path}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View on site"
          className="p-2 rounded-md text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <button
          type="button"
          onClick={() => onTogglePublish(page)}
          disabled={pendingAction === page.id}
          title={page.is_published ? 'Unpublish' : 'Publish'}
          className="p-2 rounded-md text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors disabled:opacity-50"
        >
          {pendingAction === page.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : page.is_published ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Globe className="w-4 h-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(page)}
          disabled={pendingAction === page.id}
          title="Duplicate"
          className="p-2 rounded-md text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors disabled:opacity-50"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(page)}
          disabled={pendingAction === page.id}
          title="Delete"
          className="p-2 rounded-md text-th-text-tertiary hover:bg-rose-500/10 hover:text-rose-600 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
