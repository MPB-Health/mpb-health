import { supabase } from '@mpbhealth/database';

export type ResourceCategory = 'document' | 'template' | 'guide' | 'video' | 'link';

export interface AdminResource {
  id: string;
  org_id: string;
  category: ResourceCategory;
  name: string;
  description?: string;
  file_path?: string;
  file_type?: string;
  file_size_bytes?: number;
  external_url?: string;
  is_public: boolean;
  is_active: boolean;
  access_roles: string[];
  download_count: number;
  last_downloaded_at?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceCreateInput {
  category: ResourceCategory;
  name: string;
  description?: string;
  file_path?: string;
  file_type?: string;
  file_size_bytes?: number;
  external_url?: string;
  is_public?: boolean;
  access_roles?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ResourceUpdateInput extends Partial<ResourceCreateInput> {
  is_active?: boolean;
}

export interface ResourceFilters {
  category?: ResourceCategory;
  is_public?: boolean;
  is_active?: boolean;
  tags?: string[];
  search?: string;
  role?: string;
}

export class ResourcesService {
  async list(orgId: string, filters?: ResourceFilters): Promise<AdminResource[]> {
    let query = supabase
      .from('admin_resources')
      .select('*')
      .eq('org_id', orgId)
      .order('name', { ascending: true });

    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.is_public !== undefined) query = query.eq('is_public', filters.is_public);
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters?.tags?.length) {
      query = query.contains('tags', filters.tags);
    }
    if (filters?.role) {
      query = query.contains('access_roles', [filters.role]);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async get(id: string): Promise<AdminResource | null> {
    const { data, error } = await supabase
      .from('admin_resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(input: ResourceCreateInput, orgId: string, userId: string): Promise<AdminResource> {
    const { data, error } = await supabase
      .from('admin_resources')
      .insert({
        org_id: orgId,
        category: input.category,
        name: input.name,
        description: input.description,
        file_path: input.file_path,
        file_type: input.file_type,
        file_size_bytes: input.file_size_bytes,
        external_url: input.external_url,
        is_public: input.is_public || false,
        access_roles: input.access_roles || ['admin'],
        tags: input.tags || [],
        metadata: input.metadata || {},
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'resource.create', 'admin_resource', data.id, null, data);

    return data;
  }

  async update(id: string, input: ResourceUpdateInput, userId: string): Promise<AdminResource> {
    const before = await this.get(id);

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.category !== undefined) updateData.category = input.category;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.file_path !== undefined) updateData.file_path = input.file_path;
    if (input.file_type !== undefined) updateData.file_type = input.file_type;
    if (input.file_size_bytes !== undefined) updateData.file_size_bytes = input.file_size_bytes;
    if (input.external_url !== undefined) updateData.external_url = input.external_url;
    if (input.is_public !== undefined) updateData.is_public = input.is_public;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.access_roles !== undefined) updateData.access_roles = input.access_roles;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const { data, error } = await supabase
      .from('admin_resources')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'resource.update', 'admin_resource', id, before, data);

    return data;
  }

  async delete(id: string, userId: string): Promise<void> {
    const before = await this.get(id);

    const { error } = await supabase
      .from('admin_resources')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.logAudit(userId, 'resource.delete', 'admin_resource', id, before, null);
  }

  async recordDownload(id: string): Promise<void> {
    const resource = await this.get(id);
    if (!resource) return;

    await supabase
      .from('admin_resources')
      .update({
        download_count: resource.download_count + 1,
        last_downloaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async getDownloadUrl(id: string): Promise<string | null> {
    const resource = await this.get(id);
    if (!resource) return null;

    if (resource.external_url) {
      await this.recordDownload(id);
      return resource.external_url;
    }

    if (resource.file_path) {
      // Get signed URL from storage
      const { data, error } = await supabase.storage
        .from('resources')
        .createSignedUrl(resource.file_path, 3600); // 1 hour

      if (error) throw error;

      await this.recordDownload(id);
      return data.signedUrl;
    }

    return null;
  }

  async uploadFile(
    file: File,
    orgId: string,
    userId: string,
    metadata: Omit<ResourceCreateInput, 'file_path' | 'file_type' | 'file_size_bytes'>
  ): Promise<AdminResource> {
    // Upload to storage
    const filePath = `${orgId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Create resource record
    return this.create(
      {
        ...metadata,
        file_path: filePath,
        file_type: file.type,
        file_size_bytes: file.size,
      },
      orgId,
      userId
    );
  }

  async getStats(orgId: string): Promise<{
    total_resources: number;
    by_category: Record<ResourceCategory, number>;
    total_downloads: number;
    total_size_bytes: number;
    public_count: number;
  }> {
    const resources = await this.list(orgId);

    const stats = {
      total_resources: resources.length,
      by_category: { document: 0, template: 0, guide: 0, video: 0, link: 0 } as Record<ResourceCategory, number>,
      total_downloads: 0,
      total_size_bytes: 0,
      public_count: 0,
    };

    for (const r of resources) {
      stats.by_category[r.category]++;
      stats.total_downloads += r.download_count;
      stats.total_size_bytes += r.file_size_bytes || 0;
      if (r.is_public) stats.public_count++;
    }

    return stats;
  }

  async getAllTags(orgId: string): Promise<string[]> {
    const resources = await this.list(orgId);
    const tagSet = new Set<string>();

    for (const r of resources) {
      for (const tag of r.tags) {
        tagSet.add(tag);
      }
    }

    return Array.from(tagSet).sort();
  }

  private async logAudit(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    before: unknown,
    after: unknown
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        before_json: before,
        after_json: after,
      });
    } catch (err) {
      console.error('Audit log error:', err);
    }
  }
}

export const resourcesService = new ResourcesService();
