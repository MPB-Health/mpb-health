import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Search,
  Upload,
  X,
  Loader2,
  Check,
  Image as ImageIcon,
  FileText,
  Film,
} from 'lucide-react';
import { mediaLibraryService, type MediaAsset } from '@mpbhealth/admin-core';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  mimeFilter?: 'image' | 'video' | 'document';
  uploadedBy?: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMimeIcon(mime: string) {
  if (mime.startsWith('image/')) return ImageIcon;
  if (mime.startsWith('video/')) return Film;
  return FileText;
}

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  mimeFilter,
  uploadedBy,
}: MediaPickerModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const mimePrefix = mimeFilter === 'image' ? 'image/' : mimeFilter === 'video' ? 'video/' : mimeFilter === 'document' ? 'application/' : undefined;
      const data = await mediaLibraryService.getAssets({
        search: search.trim() || undefined,
        mime_type: mimePrefix,
      });
      setAssets(data);
    } catch {
      // Silently fail; the modal can still show an empty state
    } finally {
      setLoading(false);
    }
  }, [search, mimeFilter]);

  useEffect(() => {
    if (open) {
      loadAssets();
      setSelected(null);
    }
  }, [open, loadAssets]);

  const handleUpload = async (files: FileList) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const asset = await mediaLibraryService.upload(files[0], {
        uploaded_by: uploadedBy || null,
      });
      onSelect(asset);
    } catch {
      // Fall through to let user retry
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirm = () => {
    const asset = assets.find((a) => a.id === selected);
    if (asset) onSelect(asset);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-surface-primary rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-th-border">
          <h2 className="text-lg font-semibold text-th-text-primary">Choose from Media Library</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-th-border">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files…"
              className="w-full pl-9 pr-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-3 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary text-sm disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload New
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={mimeFilter === 'image' ? 'image/*' : mimeFilter === 'video' ? 'video/*' : '*'}
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-th-accent-600" />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <ImageIcon className="w-10 h-10 text-th-text-tertiary mb-3" />
              <p className="text-th-text-secondary">No files found</p>
              <p className="text-sm text-th-text-tertiary mt-1">Try uploading a new file</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {assets.map((asset) => {
                const isSelected = selected === asset.id;
                const Icon = getMimeIcon(asset.mime_type);
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setSelected(asset.id)}
                    onDoubleClick={() => onSelect(asset)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                      isSelected ? 'border-th-accent-600 ring-2 ring-th-accent-600/30' : 'border-transparent hover:border-th-border'
                    }`}
                  >
                    <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                      {asset.mime_type.startsWith('image/') ? (
                        <img src={asset.url} alt={asset.alt_text} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <Icon className="w-8 h-8 text-th-text-tertiary" />
                      )}
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-th-accent-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">{asset.original_filename}</p>
                      <p className="text-white/70 text-xs">{formatFileSize(asset.file_size)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-th-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selected}
            className="px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50 text-sm"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}

export default MediaPickerModal;
