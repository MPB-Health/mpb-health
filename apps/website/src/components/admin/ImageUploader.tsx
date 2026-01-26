import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  uploadBlogImage,
  validateImageFile,
  formatFileSize,
  deleteBlogImage,
  extractFileNameFromUrl,
  type UploadResult,
} from '../../lib/imageUploadService';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onError?: (error: string) => void;
  slug?: string;
  label?: string;
  className?: string;
  showUrlInput?: boolean;
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  onError,
  slug,
  label = 'Featured Image',
  className = '',
  showUrlInput = true,
}) => {
  const [state, setState] = useState<UploadState>(value ? 'success' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Get image dimensions when value changes
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setState('error');
      onError?.(validation.error || 'Invalid file');
      return;
    }

    // Start upload
    setState('uploading');
    setError(null);
    setUploadProgress(0);
    setFileName(file.name);
    setFileSize(file.size);

    // Simulate progress (Supabase doesn't provide real progress)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result: UploadResult = await uploadBlogImage(file, { slug });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.url) {
        setState('success');
        setFileName(result.fileName || file.name);
        setFileSize(result.fileSize || file.size);
        onChange(result.url);
      } else {
        setState('error');
        setError(result.error || 'Upload failed');
        onError?.(result.error || 'Upload failed');
      }
    } catch (err) {
      clearInterval(progressInterval);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setState('error');
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [slug, onChange, onError]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState('dragging');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setState(value ? 'success' : 'idle');
    }
  }, [value]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(value ? 'success' : 'idle');

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((f) => f.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      setError('Please drop an image file (PNG, JPG, or WebP)');
      setState('error');
    }
  }, [value, handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle manual URL submission
  const handleManualUrlSubmit = useCallback(() => {
    if (manualUrl.trim()) {
      onChange(manualUrl.trim());
      setState('success');
      setShowManualInput(false);
      setManualUrl('');
    }
  }, [manualUrl, onChange]);

  // Copy URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    if (value) {
      try {
        await navigator.clipboard.writeText(value);
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
    }
  }, [value]);

  // Remove/clear the image
  const handleRemove = useCallback(async () => {
    if (value) {
      const fileNameToDelete = extractFileNameFromUrl(value);
      if (fileNameToDelete && value.includes('supabase')) {
        // Try to delete from storage (ignore errors - image might be referenced elsewhere)
        await deleteBlogImage(fileNameToDelete);
      }
    }
    
    onChange('');
    setState('idle');
    setFileName(null);
    setFileSize(null);
    setImageDimensions(null);
    setError(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [value, onChange]);

  // Retry upload after error
  const handleRetry = useCallback(() => {
    setState('idle');
    setError(null);
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`image-uploader ${className}`}>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {label}
      </label>

      {/* Success State - Show Preview */}
      {state === 'success' && value && (
        <div className="border border-green-200 rounded-lg bg-green-50 p-4">
          <div className="flex items-start gap-4">
            {/* Image Preview */}
            <div className="relative flex-shrink-0">
              <img
                src={value}
                alt="Uploaded preview"
                className="w-32 h-32 object-cover rounded-lg border border-neutral-200"
                onLoad={handleImageLoad}
                onError={() => setImageDimensions(null)}
              />
              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Image Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-green-800 truncate">
                  {fileName || 'Image uploaded'}
                </span>
              </div>
              <div className="text-xs text-green-700 space-y-1">
                {fileSize && <p>Size: {formatFileSize(fileSize)}</p>}
                {imageDimensions && (
                  <p>Dimensions: {imageDimensions.width} × {imageDimensions.height}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded hover:bg-neutral-50 transition-colors"
                  title="Copy URL"
                >
                  <Copy className="h-3 w-3" />
                  Copy URL
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-white border border-red-200 rounded hover:bg-red-50 transition-colors"
                  title="Remove image"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Replace Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 w-full text-center text-sm text-green-700 hover:text-green-800 font-medium"
          >
            Replace Image
          </button>
        </div>
      )}

      {/* Uploading State */}
      {state === 'uploading' && (
        <div className="border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-blue-800">Uploading...</p>
            {fileName && (
              <p className="text-xs text-blue-600 mt-1 truncate">{fileName}</p>
            )}
            {fileSize && (
              <p className="text-xs text-blue-600">{formatFileSize(fileSize)}</p>
            )}
            
            {/* Progress Bar */}
            <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-blue-600 mt-1">{uploadProgress}%</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="border-2 border-dashed border-red-300 rounded-lg bg-red-50 p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-red-800">Upload Failed</p>
            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Idle/Dragging State - Drop Zone */}
      {(state === 'idle' || state === 'dragging') && (
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${state === 'dragging'
              ? 'border-blue-500 bg-blue-50'
              : 'border-neutral-300 hover:border-blue-400 hover:bg-neutral-50'
            }
          `}
        >
          <div className="flex flex-col items-center">
            {state === 'dragging' ? (
              <>
                <Upload className="h-10 w-10 text-blue-500 mb-3" />
                <p className="text-sm font-medium text-blue-700">Drop image here</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-neutral-400 mb-3" />
                <p className="text-sm font-medium text-neutral-700">
                  Drop image here or click to browse
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  PNG, JPG, WebP up to 5MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Manual URL Input Option */}
      {showUrlInput && state !== 'uploading' && (
        <div className="mt-3">
          {!showManualInput ? (
            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              Or enter URL manually
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleManualUrlSubmit}
                disabled={!manualUrl.trim()}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Use URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowManualInput(false);
                  setManualUrl('');
                }}
                className="p-2 text-neutral-500 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
