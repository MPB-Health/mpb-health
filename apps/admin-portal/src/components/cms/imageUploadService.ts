import { supabase } from '@mpbhealth/database';

// `event-images` is the bucket codified in active migrations
// (20260513000000_create_event_images_bucket.sql). The earlier `blog-images`
// bucket only exists in archive/, so on any environment that ran a clean
// migration apply it was missing entirely — uploads silently 400'd with
// "Bucket not found". event-images is public, 10MB, authenticated-write.
const BUCKET_NAME = 'event-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (client cap; bucket allows 10)
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export interface UploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Allowed: PNG, JPG, WebP' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
  }
  return { valid: true };
}

function generateFileName(originalName: string, slug?: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const sanitizedSlug = slug
    ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : 'event-image';
  return `${sanitizedSlug}-${timestamp}.${extension}`;
}

export async function uploadEventImage(
  file: File,
  options?: { slug?: string }
): Promise<UploadResult> {
  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Refresh the session before uploading. Storage requests fail with
    // "InvalidJWT" if the access token expired while the tab sat idle, and
    // the user sees a confusing "Upload failed" with no recourse. A proactive
    // refresh costs one extra round-trip and avoids that whole class of bug.
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return { success: false, error: 'You must be logged in to upload images' };
    }

    const fileName = generateFileName(file.name, options?.slug);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '31536000',
        upsert: false,
      });

    if (error) {
      // Surface Supabase's structured error fields when present — generic
      // "new row violates row-level security policy" is otherwise opaque.
      const msg =
        (error as { message?: string; error?: string }).message ||
        (error as { error?: string }).error ||
        'Failed to upload image';
      return { success: false, error: msg };
    }

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
    const publicUrl = urlData.publicUrl;

    // Post-upload sanity check. We've seen cases where the upload POST
    // returns 200 but the binary never actually lands in storage (request
    // torn down mid-stream, component unmounted, S3 backend hiccup), and
    // the user only finds out later when the saved URL renders broken.
    // HEAD the public URL — if it 404s, treat the upload as failed and
    // attempt a cleanup so we don't leave an orphaned row in storage.objects.
    const verified = await verifyPublicUrl(publicUrl);
    if (!verified.ok) {
      try {
        await supabase.storage.from(BUCKET_NAME).remove([data.path]);
      } catch {
        // Best-effort cleanup; ignore failures.
      }
      return {
        success: false,
        error: `Upload didn't complete (file not retrievable: ${verified.status}). Please try again.`,
      };
    }

    return {
      success: true,
      url: publicUrl,
      fileName: data.path,
      fileSize: file.size,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

async function verifyPublicUrl(url: string): Promise<{ ok: boolean; status: number | string }> {
  try {
    // cache: 'no-store' to bypass any intermediate cache that might be
    // serving a stale negative response from before the upload landed.
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: err instanceof Error ? err.message : 'network error' };
  }
}
