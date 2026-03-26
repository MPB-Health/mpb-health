import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, FileText, Image, Film, FileArchive } from 'lucide-react';

interface FileUploaderProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}

const FILE_ICONS: Record<string, typeof FileText> = {
  image: Image,
  video: Film,
  application: FileArchive,
};

function getFileIcon(mimeType: string) {
  const category = mimeType.split('/')[0];
  return FILE_ICONS[category] || FileText;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploader({
  onUpload,
  accept,
  maxSizeMB = 25,
  disabled = false,
  className = '',
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `File exceeds ${maxSizeMB}MB limit`;
      }
      return null;
    },
    [maxSizeMB],
  );

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setSelectedFile(file);
      setUploading(true);
      try {
        await onUpload(file);
        setSelectedFile(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [onUpload, validateFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const Icon = selectedFile ? getFileIcon(selectedFile.type) : Upload;

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && !disabled && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all
          ${dragOver ? 'border-th-accent-500 bg-th-accent-50' : 'border-th-border hover:border-th-accent-400 hover:bg-surface-secondary'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || uploading}
          aria-label="Choose file to upload"
        />

        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-th-accent-600 animate-spin" />
            <p className="text-sm font-medium text-th-text-secondary">
              Uploading {selectedFile?.name}...
            </p>
            <p className="text-xs text-th-text-tertiary">{selectedFile ? formatFileSize(selectedFile.size) : ''}</p>
          </>
        ) : (
          <>
            <Icon className="w-8 h-8 text-th-text-tertiary" />
            <p className="text-sm font-medium text-th-text-secondary">
              Drop a file here or <span className="text-th-accent-600">browse</span>
            </p>
            <p className="text-xs text-th-text-tertiary">
              Max {maxSizeMB}MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs">
          <X className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error" className="ml-auto text-red-500 hover:text-red-700">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
