import { useState, useEffect, useCallback } from 'react';
import {
  Paperclip,
  Download,
  Trash2,
  FileText,
  Image,
  Film,
  FileArchive,
  Loader2,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUploader } from './FileUploader';
import type { AttachmentWithUploader, AttachmentEntityType } from '@mpbhealth/crm-core';
import { createAttachmentService } from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

const attachmentService = createAttachmentService(supabase);

interface AttachmentListProps {
  entityType: AttachmentEntityType;
  entityId: string;
  readOnly?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return FileArchive;
  return FileText;
}

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AttachmentList({ entityType, entityId, readOnly = false }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<AttachmentWithUploader[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAttachments = useCallback(async () => {
    setLoading(true);
    const data = await attachmentService.getAttachments(entityType, entityId);
    setAttachments(data);
    setLoading(false);
  }, [entityType, entityId]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  const handleUpload = async (file: File) => {
    const result = await attachmentService.uploadAttachment(file, {
      entity_type: entityType,
      entity_id: entityId,
    });
    if (result.success) {
      toast.success(`${file.name} uploaded`);
      loadAttachments();
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await attachmentService.deleteAttachment(id);
    if (result.success) {
      setAttachments((prev) => prev.filter((a) => a.id !== id));
      toast.success('Attachment deleted');
    } else {
      toast.error(result.error || 'Delete failed');
    }
    setDeletingId(null);
  };

  const handleDownload = async (attachment: AttachmentWithUploader) => {
    const url = await attachmentService.getDownloadUrl(attachment.file_path);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('Could not generate download link');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-th-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <FileUploader onUpload={handleUpload} maxSizeMB={25} />
      )}

      {attachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-th-text-tertiary">
          <Paperclip className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm font-medium text-th-text-secondary">No attachments</p>
          <p className="text-xs mt-0.5">
            {readOnly ? 'No files have been attached to this record.' : 'Upload files to attach them to this record.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((a) => {
            const Icon = getFileIcon(a.mime_type);
            const isDeleting = deletingId === a.id;
            const isImage = a.mime_type.startsWith('image/');

            return (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary/50 hover:bg-surface-secondary transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-th-text-tertiary" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-th-text-primary truncate">{a.file_name}</p>
                  <div className="flex items-center gap-2 text-xs text-th-text-tertiary">
                    <span>{formatFileSize(a.file_size)}</span>
                    <span>·</span>
                    <span>{formatTimeAgo(a.created_at)}</span>
                    {a.category !== 'general' && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{a.category}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isImage && (
                    <button
                      onClick={() => handleDownload(a)}
                      className="p-1.5 rounded-lg text-th-text-tertiary hover:text-th-accent-600 hover:bg-th-accent-50 transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(a)}
                    className="p-1.5 rounded-lg text-th-text-tertiary hover:text-th-accent-600 hover:bg-th-accent-50 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {!readOnly && (
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg text-th-text-tertiary hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
