import { supabase } from '@mpbhealth/database';

export interface AdminHandbook {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pdf_path: string;
  flipbook_url: string | null;
  plan_type: 'individual' | 'family' | 'employer' | 'hsa' | 'general';
  color: string;
  icon: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type HandbookCreateInput = Omit<AdminHandbook, 'id' | 'created_at' | 'updated_at'>;
export type HandbookUpdateInput = Partial<Omit<AdminHandbook, 'id' | 'created_at' | 'updated_at'>>;

const HANDBOOK_COLUMNS =
  'id, slug, name, description, pdf_path, flipbook_url, plan_type, color, icon, features, is_active, sort_order, created_at, updated_at';

const HANDBOOK_BUCKET = 'advisor-documents';

function normalizeSlug(slug: string): string {
  return slug.replace(/^\/+|\/+$/g, '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

function defaultFlipbookUrl(slug: string): string {
  return `https://mpb.health/3d-flip-book/${slug}`;
}

function parseFeatures(features: unknown): string[] {
  if (Array.isArray(features)) return features.map(String);
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function asHandbook(row: Record<string, unknown>): AdminHandbook {
  return {
    ...(row as unknown as AdminHandbook),
    features: parseFeatures(row.features),
  };
}

export class HandbookAdminService {
  /**
   * Member handbooks are a single global CMS table (no org_id).
   * Filtering by org_id 404s the query and empties the Admin Portal list.
   */
  async getAll(): Promise<AdminHandbook[]> {
    const { data, error } = await supabase
      .from('handbooks')
      .select(HANDBOOK_COLUMNS)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []).map((row) => asHandbook(row as Record<string, unknown>));
  }

  async getById(id: string): Promise<AdminHandbook | null> {
    const { data, error } = await supabase
      .from('handbooks')
      .select(HANDBOOK_COLUMNS)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? asHandbook(data as Record<string, unknown>) : null;
  }

  async getBySlug(slug: string): Promise<AdminHandbook | null> {
    const { data, error } = await supabase
      .from('handbooks')
      .select(HANDBOOK_COLUMNS)
      .eq('slug', normalizeSlug(slug))
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? asHandbook(data as Record<string, unknown>) : null;
  }

  async create(input: HandbookCreateInput): Promise<AdminHandbook> {
    const slug = normalizeSlug(input.slug);
    const { data, error } = await supabase
      .from('handbooks')
      .insert({
        slug,
        name: input.name,
        description: input.description || null,
        pdf_path: input.pdf_path,
        flipbook_url: input.flipbook_url?.trim() || defaultFlipbookUrl(slug),
        plan_type: input.plan_type,
        color: input.color || 'blue',
        icon: input.icon || 'BookOpen',
        features: input.features || [],
        is_active: input.is_active ?? true,
        sort_order: input.sort_order ?? 999,
      })
      .select(HANDBOOK_COLUMNS)
      .single();

    if (error) throw error;
    return asHandbook(data as Record<string, unknown>);
  }

  async update(id: string, input: HandbookUpdateInput): Promise<AdminHandbook> {
    const updateData: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() };
    if (typeof updateData.slug === 'string') {
      updateData.slug = normalizeSlug(updateData.slug);
    }

    const { data, error } = await supabase
      .from('handbooks')
      .update(updateData)
      .eq('id', id)
      .select(HANDBOOK_COLUMNS)
      .single();

    if (error) throw error;
    return asHandbook(data as Record<string, unknown>);
  }

  /** Replace the PDF for an existing slug so the public /3d-flip-book/:slug link stays stable. */
  async upsertBySlug(input: HandbookCreateInput): Promise<AdminHandbook> {
    const existing = await this.getBySlug(input.slug);
    if (existing) {
      return this.update(existing.id, {
        name: input.name,
        description: input.description,
        pdf_path: input.pdf_path,
        flipbook_url: input.flipbook_url || existing.flipbook_url || defaultFlipbookUrl(existing.slug),
        plan_type: input.plan_type,
        color: input.color,
        icon: input.icon,
        features: input.features,
        is_active: input.is_active,
        sort_order: input.sort_order,
      });
    }
    return this.create(input);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('handbooks').delete().eq('id', id);
    if (error) throw error;
  }

  async toggleActive(id: string): Promise<AdminHandbook> {
    const handbook = await this.getById(id);
    if (!handbook) throw new Error('Handbook not found');
    return this.update(id, { is_active: !handbook.is_active });
  }

  async reorder(ids: string[]): Promise<void> {
    const updates = ids.map((id, index) =>
      supabase.from('handbooks').update({ sort_order: index + 1 }).eq('id', id),
    );
    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
  }

  async getStats(): Promise<{ total: number; active: number }> {
    const { data, error } = await supabase.from('handbooks').select('is_active');
    if (error) throw error;
    const items = data || [];
    return { total: items.length, active: items.filter((h) => h.is_active).length };
  }

  async uploadPdf(file: File, slug: string): Promise<string> {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) throw new Error('Please upload a PDF file');

    const safeSlug = normalizeSlug(slug) || 'handbook';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(0, 80);
    const path = `handbooks/${safeSlug}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from(HANDBOOK_BUCKET).upload(path, file, {
      contentType: 'application/pdf',
      upsert: true,
      cacheControl: '3600',
    });

    if (error) throw error;

    const { data } = supabase.storage.from(HANDBOOK_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}

export const handbookAdminService = new HandbookAdminService();
