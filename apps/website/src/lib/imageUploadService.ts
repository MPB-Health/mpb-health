/**
 * Image Upload Service for MPB Health Blog
 * Handles image uploads to Supabase Storage with validation and URL generation
 */

import { supabase } from './supabase';

// Configuration
const BUCKET_NAME = 'blog-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export interface UploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Validates a file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: PNG, JPG, WebP`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Generates a unique filename for upload
 */
export function generateFileName(originalName: string, slug?: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const sanitizedSlug = slug
    ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : 'blog-image';
  
  return `${sanitizedSlug}-${timestamp}.${extension}`;
}

/**
 * Gets the public URL for an uploaded file
 */
export function getPublicUrl(fileName: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Uploads an image to Supabase Storage
 */
export async function uploadBlogImage(
  file: File,
  options?: {
    slug?: string;
    folder?: string;
    onProgress?: (progress: UploadProgress) => void;
  }
): Promise<UploadResult> {
  try {
    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return {
        success: false,
        error: 'You must be logged in to upload images',
      };
    }

    // Generate filename
    const fileName = generateFileName(file.name, options?.slug);
    const filePath = options?.folder ? `${options.folder}/${fileName}` : fileName;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      });

    if (error) {
      console.error('[ImageUpload] Upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image',
      };
    }

    // Get public URL
    const publicUrl = getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrl,
      fileName: data.path,
      fileSize: file.size,
    };
  } catch (error) {
    console.error('[ImageUpload] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteBlogImage(fileName: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return {
        success: false,
        error: 'You must be logged in to delete images',
      };
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.error('[ImageUpload] Delete error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete image',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[ImageUpload] Delete unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Lists all images in the blog-images bucket
 */
export async function listBlogImages(folder?: string): Promise<{
  success: boolean;
  files?: Array<{ name: string; url: string; size: number; createdAt: string }>;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folder || '', {
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const files = data
      .filter((item) => item.name !== '.emptyFolderPlaceholder')
      .map((item) => ({
        name: item.name,
        url: getPublicUrl(folder ? `${folder}/${item.name}` : item.name),
        size: item.metadata?.size || 0,
        createdAt: item.created_at || '',
      }));

    return {
      success: true,
      files,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list images',
    };
  }
}

/**
 * Helper to format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Extracts filename from a Supabase storage URL
 */
export function extractFileNameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1];
  } catch {
    return null;
  }
}
