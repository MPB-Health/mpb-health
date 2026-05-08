import { supabase } from '@mpbhealth/database';

export interface SeoMetadataRow {
  id: string;
  page_path: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_type: string | null;
  twitter_card: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image: string | null;
  canonical_url: string | null;
  robots: string | null;
  structured_data: Record<string, unknown> | null;
  priority: number | null;
  change_frequency: string | null;
  last_crawled: string | null;
  crawl_status: string | null;
  created_at: string;
  updated_at: string;
}

export type SeoMetadataCreateInput = Omit<
  SeoMetadataRow,
  'id' | 'created_at' | 'updated_at' | 'last_crawled' | 'crawl_status'
>;

export type SeoMetadataUpdateInput = Partial<
  Omit<SeoMetadataRow, 'id' | 'page_path' | 'created_at' | 'updated_at'>
>;

export interface SeoStats {
  total: number;
  withTitle: number;
  withDescription: number;
  withOgImage: number;
  missingTitle: number;
  missingDescription: number;
}

export interface SitemapImportResult {
  fetched: number;
  added: number;
  skipped: number;
  errors: string[];
}

const SELECT_COLUMNS =
  'id,page_path,meta_title,meta_description,meta_keywords,og_title,og_description,og_image,og_type,twitter_card,twitter_title,twitter_description,twitter_image,canonical_url,robots,structured_data,priority,change_frequency,last_crawled,crawl_status,created_at,updated_at';

export class SeoAdminService {
  async getAll(filters?: { search?: string }): Promise<SeoMetadataRow[]> {
    let query = supabase
      .from('seo_metadata')
      .select(SELECT_COLUMNS)
      .order('page_path', { ascending: true });

    if (filters?.search) {
      const term = filters.search;
      query = query.or(
        `page_path.ilike.%${term}%,meta_title.ilike.%${term}%,meta_description.ilike.%${term}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as SeoMetadataRow[];
  }

  async getByPath(page_path: string): Promise<SeoMetadataRow | null> {
    const { data, error } = await supabase
      .from('seo_metadata')
      .select(SELECT_COLUMNS)
      .eq('page_path', page_path)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as SeoMetadataRow | null;
  }

  async getById(id: string): Promise<SeoMetadataRow | null> {
    const { data, error } = await supabase
      .from('seo_metadata')
      .select(SELECT_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as SeoMetadataRow | null;
  }

  async create(input: SeoMetadataCreateInput): Promise<SeoMetadataRow> {
    const { data, error } = await supabase
      .from('seo_metadata')
      .insert(input)
      .select(SELECT_COLUMNS)
      .single();
    if (error) throw error;
    return data as unknown as SeoMetadataRow;
  }

  async update(id: string, input: SeoMetadataUpdateInput): Promise<SeoMetadataRow> {
    const { data, error } = await supabase
      .from('seo_metadata')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(SELECT_COLUMNS)
      .single();
    if (error) throw error;
    return data as unknown as SeoMetadataRow;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('seo_metadata').delete().eq('id', id);
    if (error) throw error;
  }

  async getStats(): Promise<SeoStats> {
    const all = await this.getAll();
    const withTitle = all.filter((r) => r.meta_title && r.meta_title.trim()).length;
    const withDescription = all.filter((r) => r.meta_description && r.meta_description.trim()).length;
    const withOgImage = all.filter((r) => r.og_image && r.og_image.trim()).length;
    return {
      total: all.length,
      withTitle,
      withDescription,
      withOgImage,
      missingTitle: all.length - withTitle,
      missingDescription: all.length - withDescription,
    };
  }

  /**
   * Fetch the website's sitemap.xml and add `seo_metadata` rows for any path
   * that doesn't already have one. Existing rows are NOT modified.
   * Pass the live sitemap URL (e.g. `https://www.mpb.health/sitemap.xml`).
   */
  async importFromSitemap(sitemapUrl: string): Promise<SitemapImportResult> {
    const result: SitemapImportResult = { fetched: 0, added: 0, skipped: 0, errors: [] };

    let xml: string;
    try {
      const res = await fetch(sitemapUrl, { headers: { Accept: 'application/xml' } });
      if (!res.ok) {
        result.errors.push(`Sitemap fetch failed: HTTP ${res.status}`);
        return result;
      }
      xml = await res.text();
    } catch (err) {
      result.errors.push(`Sitemap fetch error: ${(err as Error).message}`);
      return result;
    }

    // Extract <loc> URLs. Supports both single sitemap and sitemap-index forms.
    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi)).map((m) => m[1].trim());

    // If this is a sitemap index, recurse one level
    const childSitemaps = locs.filter((u) => u.endsWith('.xml'));
    const pageUrls = locs.filter((u) => !u.endsWith('.xml'));

    for (const child of childSitemaps) {
      const childResult = await this.importFromSitemap(child);
      result.fetched += childResult.fetched;
      result.added += childResult.added;
      result.skipped += childResult.skipped;
      result.errors.push(...childResult.errors);
    }

    if (pageUrls.length === 0) {
      return result;
    }

    result.fetched += pageUrls.length;

    // Convert URLs to paths
    const paths = pageUrls
      .map((u) => {
        try {
          return new URL(u).pathname || '/';
        } catch {
          return null;
        }
      })
      .filter((p): p is string => Boolean(p));

    // Find which paths already exist
    const { data: existing, error } = await supabase
      .from('seo_metadata')
      .select('page_path')
      .in('page_path', paths);
    if (error) {
      result.errors.push(`Existing-row lookup failed: ${error.message}`);
      return result;
    }
    const existingSet = new Set((existing || []).map((r) => r.page_path as string));
    const newPaths = paths.filter((p) => !existingSet.has(p));
    result.skipped += paths.length - newPaths.length;

    if (newPaths.length === 0) {
      return result;
    }

    const rows = newPaths.map((p) => ({
      page_path: p,
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
      structured_data: {},
      priority: 0.5,
      change_frequency: 'weekly',
    }));

    const { error: insertErr } = await supabase.from('seo_metadata').insert(rows);
    if (insertErr) {
      result.errors.push(`Bulk insert failed: ${insertErr.message}`);
    } else {
      result.added += rows.length;
    }

    return result;
  }
}

export const seoAdminService = new SeoAdminService();
