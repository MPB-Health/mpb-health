import { supabase } from '@mpbhealth/database';

export interface MediaAsset {
  id: string;
  filename: string;
  original_filename: string;
  url: string;
  alt_text: string;
  caption: string;
  tags: string[];
  folder: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaUploadInput {
  filename: string;
  original_filename: string;
  url: string;
  alt_text?: string;
  caption?: string;
  tags?: string[];
  folder?: string;
  mime_type: string;
  file_size: number;
  width?: number | null;
  height?: number | null;
  uploaded_by?: string | null;
}

export interface MediaUpdateInput {
  alt_text?: string;
  caption?: string;
  tags?: string[];
  folder?: string;
}

export interface MediaFilters {
  folder?: string;
  mime_type?: string;
  search?: string;
  tags?: string[];
}

const SELECT_COLUMNS =
  'id, filename, original_filename, url, alt_text, caption, tags, folder, mime_type, file_size, width, height, uploaded_by, created_at, updated_at';

const BUCKET_NAME = 'event-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
  'video/webm',
];

export class MediaLibraryService {
  async getAssets(filters?: MediaFilters): Promise<MediaAsset[]> {
    let query = supabase
      .from('cms_media')
      .select(SELECT_COLUMNS)
      .order('created_at', { ascending: false });

    if (filters?.folder && filters.folder !== '/') {
      query = query.eq('folder', filters.folder);
    }
    if (filters?.mime_type) {
      query = query.like('mime_type', `${filters.mime_type}%`);
    }
    if (filters?.search) {
      const term = filters.search.replace(/[%_]/g, (m) => `\\${m}`);
      query = query.or(
        `filename.ilike.%${term}%,original_filename.ilike.%${term}%,alt_text.ilike.%${term}%,caption.ilike.%${term}%`
      );
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as MediaAsset[];
  }

  async getAsset(id: string): Promise<MediaAsset | null> {
    const { data, error } = await supabase
      .from('cms_media')
      .select(SELECT_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as MediaAsset | null) ?? null;
  }

  async getFolders(): Promise<string[]> {
    const { data, error } = await supabase
      .from('cms_media')
      .select('folder');

    if (error) throw error;
    const folders = [...new Set((data || []).map((r: { folder: string }) => r.folder))];
    return folders.sort();
  }

  async getAllTags(): Promise<string[]> {
    const { data, error } = await supabase
      .from('cms_media')
      .select('tags');

    if (error) throw error;
    const tags = new Set<string>();
    (data || []).forEach((r: { tags: string[] }) => {
      r.tags?.forEach((t) => tags.add(t));
    });
    return [...tags].sort();
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.type}. Allowed: PNG, JPG, WebP, GIF, SVG, PDF, MP4, WebM`,
      };
    }
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }
    return { valid: true };
  }

  async upload(
    file: File,
    options?: { folder?: string; alt_text?: string; tags?: string[]; uploaded_by?: string | null }
  ): Promise<MediaAsset> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const { error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error('Authentication required to upload files');

    const timestamp = Date.now();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const sanitized = file.name
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const storagePath = `cms/${sanitized}-${timestamp}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(
        (uploadError as { message?: string }).message || 'Failed to upload file'
      );
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path);

    let width: number | null = null;
    let height: number | null = null;
    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      try {
        const dims = await this.getImageDimensions(file);
        width = dims.width;
        height = dims.height;
      } catch {
        // Non-fatal; dimensions are optional metadata
      }
    }

    const record: MediaUploadInput = {
      filename: uploadData.path,
      original_filename: file.name,
      url: urlData.publicUrl,
      alt_text: options?.alt_text || '',
      caption: '',
      tags: options?.tags || [],
      folder: options?.folder || '/',
      mime_type: file.type,
      file_size: file.size,
      width,
      height,
      uploaded_by: options?.uploaded_by || null,
    };

    const { data, error } = await supabase
      .from('cms_media')
      .insert(record)
      .select(SELECT_COLUMNS)
      .single();

    if (error) throw error;
    return data as unknown as MediaAsset;
  }

  async updateAsset(id: string, updates: MediaUpdateInput): Promise<MediaAsset> {
    const { data, error } = await supabase
      .from('cms_media')
      .update(updates)
      .eq('id', id)
      .select(SELECT_COLUMNS)
      .single();

    if (error) throw error;
    return data as unknown as MediaAsset;
  }

  async deleteAsset(id: string): Promise<void> {
    const asset = await this.getAsset(id);
    if (!asset) throw new Error('Asset not found');

    // Remove from storage
    if (asset.filename) {
      await supabase.storage.from(BUCKET_NAME).remove([asset.filename]);
    }

    const { error } = await supabase.from('cms_media').delete().eq('id', id);
    if (error) throw error;
  }

  async deleteAssets(ids: string[]): Promise<void> {
    const { data: assets } = await supabase
      .from('cms_media')
      .select('id, filename')
      .in('id', ids);

    if (assets && assets.length > 0) {
      const paths = assets
        .map((a: { filename: string }) => a.filename)
        .filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from(BUCKET_NAME).remove(paths);
      }
    }

    const { error } = await supabase.from('cms_media').delete().in('id', ids);
    if (error) throw error;
  }

  async moveToFolder(ids: string[], folder: string): Promise<void> {
    const { error } = await supabase
      .from('cms_media')
      .update({ folder })
      .in('id', ids);
    if (error) throw error;
  }

  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not read image dimensions'));
      };
      img.src = url;
    });
  }
}

export const mediaLibraryService = new MediaLibraryService();
