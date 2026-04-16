import { supabase } from '@mpbhealth/database';

export interface AdminTrainingModule {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content_type: 'video' | 'document' | 'interactive' | 'quiz' | 'external_link';
  content_url: string | null;
  content: string | null;
  thumbnail_url: string | null;
  duration_minutes: number;
  order_index: number;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TrainingModuleCreateInput = Omit<AdminTrainingModule, 'id' | 'created_at' | 'updated_at'>;
export type TrainingModuleUpdateInput = Partial<Omit<AdminTrainingModule, 'id' | 'created_at' | 'updated_at'>>;

export interface TrainingAdminStats {
  total: number;
  active: number;
  inactive: number;
  required: number;
}

export class TrainingAdminService {
  async getModules(filters?: { category?: string; is_active?: boolean }): Promise<AdminTrainingModule[]> {
    let query = supabase
      .from('training_modules')
      .select('id, title, description, category, content_type, content_url, content, thumbnail_url, duration_minutes, order_index, is_required, is_active, created_at, updated_at')
      .order('order_index', { ascending: true })
      .order('title', { ascending: true });

    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any;
  }

  async getModule(id: string): Promise<AdminTrainingModule | null> {
    const { data, error } = await supabase
      .from('training_modules')
      .select('id, title, description, category, content_type, content_url, content, thumbnail_url, duration_minutes, order_index, is_required, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  async createModule(input: TrainingModuleCreateInput): Promise<AdminTrainingModule> {
    const { data, error } = await supabase
      .from('training_modules')
      .insert(input)
      .select('id, title, description, category, content_type, content_url, content, thumbnail_url, duration_minutes, order_index, is_required, is_active, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  async updateModule(id: string, input: TrainingModuleUpdateInput): Promise<AdminTrainingModule> {
    const { data, error } = await supabase
      .from('training_modules')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, title, description, category, content_type, content_url, content, thumbnail_url, duration_minutes, order_index, is_required, is_active, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  async deleteModule(id: string): Promise<void> {
    const { error } = await supabase
      .from('training_modules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleActive(id: string): Promise<AdminTrainingModule> {
    const module = await this.getModule(id);
    if (!module) throw new Error('Module not found');
    return this.updateModule(id, { is_active: !module.is_active });
  }

  async reorderModules(moduleIds: string[]): Promise<void> {
    const updates = moduleIds.map((id, index) =>
      supabase.from('training_modules').update({ order_index: index }).eq('id', id),
    );
    await Promise.all(updates);
  }

  async getStats(): Promise<TrainingAdminStats> {
    const { data, error } = await supabase
      .from('training_modules')
      .select('is_active, is_required');

    if (error) throw error;

    const modules = data || [];
    return {
      total: modules.length,
      active: modules.filter((m) => m.is_active).length,
      inactive: modules.filter((m) => !m.is_active).length,
      required: modules.filter((m) => m.is_required).length,
    };
  }

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('training_modules')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;
    return [...new Set((data || []).map((m) => m.category).filter(Boolean))].sort();
  }

  async uploadThumbnail(file: File, moduleId: string): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `training/thumbnails/${moduleId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('public-assets').getPublicUrl(path);
    return data.publicUrl;
  }
}

export const trainingAdminService = new TrainingAdminService();
