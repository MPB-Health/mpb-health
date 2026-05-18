import { useState, useId, useRef } from 'react';
import { Upload, X, FileIcon, Image as ImageIcon } from 'lucide-react';

export interface TicketNewFileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
}

export function TicketNewFileUpload({
  files,
  onFilesChange,
  maxFiles = 10,
  maxSizeMB = 15,
  accept = 'image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx',
}: TicketNewFileUploadProps) {
  const inputId = useId();
  const dragDepthRef = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `${file.name} exceeds ${maxSizeMB} MB limit`;
    }
    return null;
  };

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const filesArray = Array.from(newFiles);
    const currentCount = files.length;

    if (currentCount + filesArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: File[] = [];
    let hasError = false;

    for (const file of filesArray) {
      const err = validateFile(file);
      if (err) {
        setError(err);
        hasError = true;
        break;
      }
      validFiles.push(file);
    }

    if (!hasError && validFiles.length > 0) {
      const combined = [...files, ...validFiles];
      const deduped = combined.filter(
        (file, idx, arr) =>
          arr.findIndex(
            (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified,
          ) === idx,
      );
      if (deduped.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }
      onFilesChange(deduped);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
    setError(null);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (file: File) => file.type.startsWith('image/');

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? 'border-th-accent-500 bg-th-accent-50/40 dark:bg-th-accent-950/20'
            : 'border-th-border hover:border-th-text-tertiary/50 dark:border-neutral-600 dark:hover:border-neutral-500'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          id={inputId}
          type="file"
          multiple
          accept={accept}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
          className="sr-only"
        />

        <label htmlFor={inputId} className="flex flex-col items-center space-y-3 cursor-pointer">
          <div className="w-12 h-12 bg-surface-tertiary rounded-full flex items-center justify-center">
            <Upload className="text-th-text-tertiary" size={24} />
          </div>

          <div className="text-sm">
            <span className="font-medium text-th-accent-600 dark:text-th-accent-400">Click to upload</span>
            <span className="text-th-text-secondary"> or drag and drop</span>
          </div>

          <p className="text-sm text-th-text-tertiary">
            Images, PDFs, documents (max {maxSizeMB} MB each, up to {maxFiles} files)
          </p>
        </label>
      </div>

      {error ? (
        <div
          role="alert"
          className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-red-800 dark:text-red-200 text-sm"
        >
          {error}
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-th-text-primary">
            Attached files ({files.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg border border-th-border"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {isImage(file) ? (
                      <ImageIcon className="text-th-accent-600" size={20} />
                    ) : (
                      <FileIcon className="text-th-text-tertiary" size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-th-text-primary truncate">{file.name}</p>
                    <p className="text-xs text-th-text-tertiary">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 ml-3 p-1 hover:bg-surface-tertiary rounded transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="text-th-text-tertiary" size={18} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
