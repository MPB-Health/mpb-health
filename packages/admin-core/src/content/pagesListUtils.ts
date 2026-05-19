import type { CmsPage } from '@mpbhealth/database';
import { SITE_PAGES_CATALOG, type SitePageCatalogEntry } from './sitePagesCatalog';

export type PageListRow =
  | { kind: 'cms'; page: CmsPage }
  | { kind: 'catalog'; entry: SitePageCatalogEntry };

export type PageListFilter = 'all' | 'published' | 'drafts';

function matchesSearch(
  text: string,
  search: string
): boolean {
  return text.toLowerCase().includes(search.toLowerCase());
}

export function buildPageListRows(
  cmsPages: CmsPage[],
  options?: { search?: string; filter?: PageListFilter }
): PageListRow[] {
  const search = options?.search?.trim() ?? '';
  const filter = options?.filter ?? 'all';

  const cmsByPath = new Map(cmsPages.map((p) => [p.path, p]));
  const rows: PageListRow[] = [];

  for (const entry of SITE_PAGES_CATALOG) {
    if (
      search &&
      !matchesSearch(entry.title, search) &&
      !matchesSearch(entry.path, search) &&
      !matchesSearch(entry.slug, search)
    ) {
      continue;
    }

    const cms = cmsByPath.get(entry.path);
    if (cms) {
      cmsByPath.delete(entry.path);
      if (filter === 'published' && !cms.is_published) continue;
      if (filter === 'drafts' && cms.is_published) continue;
      rows.push({ kind: 'cms', page: cms });
    } else if (filter !== 'published') {
      rows.push({ kind: 'catalog', entry });
    }
  }

  for (const page of cmsByPath.values()) {
    if (
      search &&
      !matchesSearch(page.title, search) &&
      !matchesSearch(page.path, search) &&
      !matchesSearch(page.slug, search)
    ) {
      continue;
    }
    if (filter === 'published' && !page.is_published) continue;
    if (filter === 'drafts' && page.is_published) continue;
    rows.push({ kind: 'cms', page });
  }

  return rows.sort((a, b) => {
    const titleA = a.kind === 'cms' ? a.page.title : a.entry.title;
    const titleB = b.kind === 'cms' ? b.page.title : b.entry.title;
    return titleA.localeCompare(titleB);
  });
}
