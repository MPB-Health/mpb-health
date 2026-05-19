import { supabase } from '@mpbhealth/database';

export interface CmsRedirect {
  id: string;
  from_path: string;
  to_path: string;
  status_code: 301 | 302 | 307 | 308;
  is_regex: boolean;
  hit_count: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RedirectCreateInput {
  from_path: string;
  to_path: string;
  status_code?: number;
  is_regex?: boolean;
  is_active?: boolean;
  created_by?: string | null;
}

export interface RedirectUpdateInput {
  from_path?: string;
  to_path?: string;
  status_code?: number;
  is_regex?: boolean;
  is_active?: boolean;
}

const COLS = 'id, from_path, to_path, status_code, is_regex, hit_count, is_active, created_by, created_at, updated_at';

export class RedirectService {
  async getRedirects(): Promise<CmsRedirect[]> {
    const { data, error } = await supabase
      .from('cms_redirects')
      .select(COLS)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as CmsRedirect[];
  }

  async createRedirect(input: RedirectCreateInput): Promise<CmsRedirect> {
    const { data, error } = await supabase
      .from('cms_redirects')
      .insert(input)
      .select(COLS)
      .single();
    if (error) throw error;
    return data as unknown as CmsRedirect;
  }

  async updateRedirect(id: string, input: RedirectUpdateInput): Promise<CmsRedirect> {
    const { data, error } = await supabase
      .from('cms_redirects')
      .update(input)
      .eq('id', id)
      .select(COLS)
      .single();
    if (error) throw error;
    return data as unknown as CmsRedirect;
  }

  async deleteRedirect(id: string): Promise<void> {
    const { error } = await supabase.from('cms_redirects').delete().eq('id', id);
    if (error) throw error;
  }

  async bulkImport(
    redirects: Array<{ from_path: string; to_path: string; status_code?: number }>,
    userId?: string | null
  ): Promise<number> {
    const rows = redirects.map((r) => ({
      from_path: r.from_path,
      to_path: r.to_path,
      status_code: r.status_code || 301,
      created_by: userId || null,
    }));
    const { error, count } = await supabase
      .from('cms_redirects')
      .insert(rows);
    if (error) throw error;
    return count ?? rows.length;
  }

  async toggleActive(id: string, active: boolean): Promise<void> {
    const { error } = await supabase
      .from('cms_redirects')
      .update({ is_active: active })
      .eq('id', id);
    if (error) throw error;
  }
}

export const redirectService = new RedirectService();
