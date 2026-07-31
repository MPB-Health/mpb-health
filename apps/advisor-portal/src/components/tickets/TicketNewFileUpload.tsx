import { useState, useId, useRef, type ClipboardEvent } from 'react';
import { Upload } from 'lucide-react';
import { filesFromClipboardEvent } from '../../utils/clipboardFiles';
import { PendingAttachmentPreviews } from './PendingAttachmentPreviews';

export interface TicketNewFileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  /**
   * When false, skip the filmstrip (previews live under the description editor)
   * and show a compact queued count — matches ITSTS FileUpload + TicketEditor.
   */
  showPreviews?: boolean;
}

export function TicketNewFileUpload({
  files,
  onFilesChange,
  maxFiles = 10,
  maxSizeMB = 15,
  accept = 'image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx',
  showPreviews = true,
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

  const handleFileArray = (filesArray: File[]) => {
    if (!filesArray.length) return;

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

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    handleFileArray(Array.from(newFiles));
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const clipboardFiles = filesFromClipboardEvent(e.clipboardData);
    if (!clipboardFiles.length) return;
    e.preventDefault();
    handleFileArray(clipboardFiles);
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
        onPaste={handlePaste}
        tabIndex={0}
        aria-label="Attachment drop zone. Click, drag and drop, or paste a screenshot."
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
            <span className="text-th-text-secondary">, drag and drop, or paste</span>
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

      {showPreviews && files.length > 0 ? (
        <PendingAttachmentPreviews files={files} onRemove={removeFile} />
      ) : null}

      {!showPreviews && files.length > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200/90 bg-slate-50 px-3.5 py-2.5 dark:border-neutral-700 dark:bg-neutral-900/50">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
              Queued
            </p>
            <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
              {files.length} file{files.length === 1 ? '' : 's'} — previews live in the description
            </p>
          </div>
          <span
            className="shrink-0 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-white"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--accent-600)), rgb(var(--accent-500)))',
            }}
          >
            {String(files.length).padStart(2, '0')}
          </span>
        </div>
      ) : null}
    </div>
  );
}
