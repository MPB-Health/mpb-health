import { supabase } from '@mpbhealth/database';
import type {
  CmsPage,
  CmsBlock,
  CmsPageMeta,
} from '@mpbhealth/database';
import type { SitePageCatalogEntry } from './sitePagesCatalog';

export interface PageCreateInput {
  path: string;
  slug?: string;
  title: string;
  description?: string | null;
  sections?: CmsBlock[];
  is_published?: boolean;
  meta?: CmsPageMeta;
  created_by?: string | null;
}

export interface PageUpdateInput {
  path?: string;
  slug?: string;
  title?: string;
  description?: string | null;
  sections?: CmsBlock[];
  is_published?: boolean;
  meta?: CmsPageMeta;
}

export interface PageFilters {
  is_published?: boolean;
  search?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

const SELECT_COLUMNS =
  'id, path, slug, title, description, sections, is_published, meta, created_by, created_at, updated_at';

export class PagesAdminService {
  async getPages(filters?: PageFilters): Promise<CmsPage[]> {
    let query = supabase
      .from('cms_pages')
      .select(SELECT_COLUMNS)
      .order('updated_at', { ascending: false });

    if (filters?.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published);
    }
    if (filters?.search) {
      const term = filters.search.replace(/[%_]/g, (m) => `\\${m}`);
      query = query.or(
        `title.ilike.%${term}%,path.ilike.%${term}%,slug.ilike.%${term}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as CmsPage[];
  }

  async getPage(id: string): Promise<CmsPage | null> {
    const { data, error } = await supabase
      .from('cms_pages')
      .select(SELECT_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as CmsPage | null) ?? null;
  }

  async getPageByPath(path: string): Promise<CmsPage | null> {
    const { data, error } = await supabase
      .from('cms_pages')
      .select(SELECT_COLUMNS)
      .eq('path', normalizePath(path))
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as CmsPage | null) ?? null;
  }

  async createPage(input: PageCreateInput): Promise<CmsPage> {
    const path = normalizePath(input.path);
    const slug = (input.slug && slugify(input.slug)) || slugify(input.title);

    const payload = {
      path,
      slug,
      title: input.title.trim(),
      description: input.description ?? null,
      sections: input.sections ?? [],
      is_published: input.is_published ?? false,
      meta: input.meta ?? {},
      created_by: input.created_by ?? null,
    };

    const { data, error } = await supabase
      .from('cms_pages')
      .insert(payload)
      .select(SELECT_COLUMNS)
      .single();

    if (error) throw error;
    return data as unknown as CmsPage;
  }

  async updatePage(id: string, updates: PageUpdateInput): Promise<CmsPage> {
    const payload: Record<string, unknown> = { ...updates };
    if (typeof updates.path === 'string') payload.path = normalizePath(updates.path);
    if (typeof updates.slug === 'string') payload.slug = slugify(updates.slug);

    const { data, error } = await supabase
      .from('cms_pages')
      .update(payload)
      .eq('id', id)
      .select(SELECT_COLUMNS)
      .single();

    if (error) throw error;
    return data as unknown as CmsPage;
  }

  async publishPage(id: string): Promise<CmsPage> {
    return this.updatePage(id, { is_published: true });
  }

  async unpublishPage(id: string): Promise<CmsPage> {
    return this.updatePage(id, { is_published: false });
  }

  async deletePage(id: string): Promise<void> {
    const { error } = await supabase
      .from('cms_pages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Duplicate a page including its sections. The duplicate is created as a
   * draft and gets a `-copy` suffix on path + slug to avoid the unique-constraint
   * collision.
   */
  /**
   * Ensure a `cms_pages` row exists for a known site route so admins can edit it
   * in the block editor. Returns the existing row if the path is already taken.
   */
  async ensureSitePage(entry: SitePageCatalogEntry): Promise<CmsPage> {
    const path = normalizePath(entry.path);
    const existing = await this.getPageByPath(path);
    if (existing) return existing;

    return this.createPage({
      path,
      slug: entry.slug,
      title: entry.title,
      description: entry.description ?? null,
      sections: [],
      is_published: false,
    });
  }

  async duplicatePage(id: string): Promise<CmsPage> {
    const source = await this.getPage(id);
    if (!source) throw new Error('Page not found');

    let path = `${source.path}-copy`;
    let slug = `${source.slug}-copy`;
    let suffix = 1;
    // If a -copy already exists, walk forward until we find a free slot.
    // Capped to avoid an infinite loop on malformed data.
    while (suffix < 50) {
      const { data: existing } = await supabase
        .from('cms_pages')
        .select('id')
        .or(`path.eq.${path},slug.eq.${slug}`)
        .limit(1);
      if (!existing || existing.length === 0) break;
      suffix += 1;
      path = `${source.path}-copy-${suffix}`;
      slug = `${source.slug}-copy-${suffix}`;
    }

    return this.createPage({
      path,
      slug,
      title: `${source.title} (copy)`,
      description: source.description,
      sections: source.sections,
      is_published: false,
      meta: source.meta,
      created_by: source.created_by,
    });
  }
}

export const pagesAdminService = new PagesAdminService();
