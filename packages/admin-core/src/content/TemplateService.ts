import { supabase } from '@mpbhealth/database';

export interface CmsTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string | null;
  sections: Record<string, unknown>[];
  category: string;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GlobalBlock {
  id: string;
  name: string;
  description: string;
  sections: Record<string, unknown>[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateCreateInput {
  name: string;
  description?: string;
  thumbnail_url?: string | null;
  sections: Record<string, unknown>[];
  category?: string;
  is_system?: boolean;
  created_by?: string | null;
}

export interface GlobalBlockCreateInput {
  name: string;
  description?: string;
  sections: Record<string, unknown>[];
  created_by?: string | null;
}

const TEMPLATE_COLUMNS =
  'id, name, description, thumbnail_url, sections, category, is_system, created_by, created_at, updated_at';

const GLOBAL_BLOCK_COLUMNS =
  'id, name, description, sections, created_by, created_at, updated_at';

export class TemplateService {
  // ── Templates ──────────────────────────────────────────────────────────────

  async getTemplates(): Promise<CmsTemplate[]> {
    const { data, error } = await supabase
      .from('cms_templates')
      .select(TEMPLATE_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as CmsTemplate[];
  }

  async getTemplate(id: string): Promise<CmsTemplate | null> {
    const { data, error } = await supabase
      .from('cms_templates')
      .select(TEMPLATE_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as CmsTemplate | null) ?? null;
  }

  async createTemplate(input: TemplateCreateInput): Promise<CmsTemplate> {
    const { data, error } = await supabase
      .from('cms_templates')
      .insert({
        name: input.name,
        description: input.description || '',
        thumbnail_url: input.thumbnail_url || null,
        sections: input.sections,
        category: input.category || 'custom',
        is_system: input.is_system || false,
        created_by: input.created_by || null,
      })
      .select(TEMPLATE_COLUMNS)
      .single();

    if (error) throw error;
    return data as unknown as CmsTemplate;
  }

  async updateTemplate(id: string, input: Partial<TemplateCreateInput>): Promise<CmsTemplate> {
    const { data, error } = await supabase
      .from('cms_templates')
      .update(input)
      .eq('id', id)
      .select(TEMPLATE_COLUMNS)
      .single();

    if (error) throw error;
    return data as unknown as CmsTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('cms_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ── Global Blocks ──────────────────────────────────────────────────────────

  async getGlobalBlocks(): Promise<GlobalBlock[]> {
    const { data, error } = await supabase
      .from('cms_global_blocks')
      .select(GLOBAL_BLOCK_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as GlobalBlock[];
  }

  async createGlobalBlock(input: GlobalBlockCreateInput): Promise<GlobalBlock> {
    const { data, error } = await supabase
      .from('cms_global_blocks')
      .insert({
        name: input.name,
        description: input.description || '',
        sections: input.sections,
        created_by: input.created_by || null,
      })
      .select(GLOBAL_BLOCK_COLUMNS)
      .single();

    if (error) throw error;
    return data as unknown as GlobalBlock;
  }

  async updateGlobalBlock(id: string, input: Partial<GlobalBlockCreateInput>): Promise<GlobalBlock> {
    const { data, error } = await supabase
      .from('cms_global_blocks')
      .update(input)
      .eq('id', id)
      .select(GLOBAL_BLOCK_COLUMNS)
      .single();

    if (error) throw error;
    return data as unknown as GlobalBlock;
  }

  async deleteGlobalBlock(id: string): Promise<void> {
    const { error } = await supabase
      .from('cms_global_blocks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const templateService = new TemplateService();
