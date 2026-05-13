import { useEffect, useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadEventImage, validateImageFile } from './imageUploadService';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  slug?: string;
  // Surfaces upload state to the parent so Save/Publish can block until the
  // file is verifiably in storage. Same pattern as EventGallerySection.
  onUploadingChange?: (uploading: boolean) => void;
}

export function ImageUploader({ value, onChange, slug, onUploadingChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);
    setError(null);

    const result = await uploadEventImage(file, { slug });
    setUploading(false);

    if (result.success && result.url) {
      onChange(result.url);
    } else {
      setError(result.error || 'Upload failed');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Featured"
            className="w-full h-48 object-cover rounded-lg border border-th-border"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-th-border rounded-lg p-8 text-center cursor-pointer hover:border-th-accent-400 hover:bg-surface-tertiary transition-all"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-th-accent-600 animate-spin" />
              <span className="text-sm text-th-text-secondary">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-th-text-tertiary" />
              <span className="text-sm text-th-text-secondary">Click to upload image</span>
              <span className="text-xs text-th-text-tertiary">PNG, JPG, WebP up to 5MB</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste image URL..."
        className="w-full px-3 py-2 text-sm bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

export default ImageUploader;
