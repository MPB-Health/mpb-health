import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Upload,
  Search,
  Grid3X3,
  List,
  FolderOpen,
  Trash2,
  Tag,
  Image as ImageIcon,
  FileText,
  Film,
  Loader2,
  Check,
  X,
  FolderPlus,
  MoveRight,
  Copy,
  Download,
} from 'lucide-react';
import { mediaLibraryService, type MediaAsset, type MediaFilters } from '@mpbhealth/admin-core';
import { useAuth } from '../../../contexts/AuthContext';

type ViewMode = 'grid' | 'list';
type TypeFilter = 'all' | 'image' | 'video' | 'document';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getMimeIcon(mime: string) {
  if (mime.startsWith('image/')) return ImageIcon;
  if (mime.startsWith('video/')) return Film;
  return FileText;
}

export default function MediaLibrary() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [currentFolder, setCurrentFolder] = useState('/');
  const [folders, setFolders] = useState<string[]>(['/']);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const filters: MediaFilters = useMemo(() => {
    const f: MediaFilters = {};
    if (currentFolder !== '/') f.folder = currentFolder;
    if (search.trim()) f.search = search.trim();
    if (typeFilter === 'image') f.mime_type = 'image/';
    else if (typeFilter === 'video') f.mime_type = 'video/';
    else if (typeFilter === 'document') f.mime_type = 'application/';
    return f;
  }, [currentFolder, search, typeFilter]);

  const loadAssets = useCallback(async () => {
    try {
      const data = await mediaLibraryService.getAssets(filters);
      setAssets(data);
    } catch (e) {
      toast.error(`Failed to load media: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadFolders = useCallback(async () => {
    try {
      const f = await mediaLibraryService.getFolders();
      setFolders(f.length > 0 ? f : ['/']);
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    const toastId = toast.loading(`Uploading ${fileArray.length} file${fileArray.length > 1 ? 's' : ''}…`);
    let successCount = 0;
    let failCount = 0;

    for (const file of fileArray) {
      try {
        await mediaLibraryService.upload(file, {
          folder: currentFolder,
          uploaded_by: user?.id || null,
        });
        successCount++;
      } catch (e) {
        failCount++;
        console.warn(`Upload failed for ${file.name}:`, e);
      }
    }

    setUploading(false);
    if (failCount === 0) {
      toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded`, { id: toastId });
    } else {
      toast.error(`${successCount} uploaded, ${failCount} failed`, { id: toastId });
    }
    loadAssets();
    loadFolders();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} file${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return;

    const toastId = toast.loading('Deleting…');
    try {
      await mediaLibraryService.deleteAssets([...selectedIds]);
      toast.success('Deleted', { id: toastId });
      setSelectedIds(new Set());
      loadAssets();
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`, { id: toastId });
    }
  };

  const handleMove = async (targetFolder: string) => {
    if (selectedIds.size === 0) return;
    const toastId = toast.loading('Moving…');
    try {
      await mediaLibraryService.moveToFolder([...selectedIds], targetFolder);
      toast.success('Moved', { id: toastId });
      setSelectedIds(new Set());
      setShowMoveModal(false);
      loadAssets();
      loadFolders();
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`, { id: toastId });
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const name = '/' + newFolderName.trim().toLowerCase().replace(/[^a-z0-9-/]+/g, '-').replace(/^\/+|\/+$/g, '');
    if (!folders.includes(name)) {
      setFolders([...folders, name].sort());
    }
    setCurrentFolder(name);
    setShowNewFolder(false);
    setNewFolderName('');
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied');
  };

  const handleUpdateAsset = async (id: string, updates: { alt_text?: string; caption?: string; tags?: string[] }) => {
    try {
      await mediaLibraryService.updateAsset(id, updates);
      toast.success('Updated');
      setEditingAsset(null);
      loadAssets();
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === assets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assets.map((a) => a.id)));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Media Library</h1>
          <p className="text-sm text-th-text-secondary mt-1">
            Upload, organize, and manage all your media assets.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 bg-th-accent-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-th-accent-700 transition-colors disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
          className="hidden"
        />
      </header>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename, alt text, caption…"
            className="w-full pl-9 pr-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
          />
        </div>

        {/* Type filter */}
        <div className="inline-flex rounded-lg border border-th-border bg-surface-primary p-0.5">
          {(['all', 'image', 'video', 'document'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                typeFilter === f
                  ? 'bg-th-accent-600 text-white'
                  : 'text-th-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
            </button>
          ))}
        </div>

        {/* View mode */}
        <div className="inline-flex rounded-lg border border-th-border bg-surface-primary p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-th-accent-600 text-white' : 'text-th-text-secondary hover:bg-surface-tertiary'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-th-accent-600 text-white' : 'text-th-text-secondary hover:bg-surface-tertiary'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Folder bar + bulk actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <FolderOpen className="w-4 h-4 text-th-text-tertiary" />
          {folders.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setCurrentFolder(f)}
              className={`px-2.5 py-1 text-sm rounded-md transition-colors ${
                currentFolder === f
                  ? 'bg-th-accent-600/10 text-th-accent-700 font-medium'
                  : 'text-th-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              {f === '/' ? 'All Files' : f.replace(/^\//, '')}
            </button>
          ))}
          {showNewFolder ? (
            <div className="inline-flex items-center gap-1">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                placeholder="folder-name"
                autoFocus
                className="w-32 px-2 py-1 text-sm border border-th-border rounded-md focus:outline-none focus:ring-1 focus:ring-th-accent-500 text-th-text-primary"
              />
              <button type="button" onClick={handleCreateFolder} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="p-1 text-th-text-tertiary hover:bg-surface-tertiary rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewFolder(true)}
              className="inline-flex items-center gap-1 px-2 py-1 text-sm text-th-text-secondary hover:bg-surface-tertiary rounded-md"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              New
            </button>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-th-text-secondary">{selectedIds.size} selected</span>
            <button
              type="button"
              onClick={() => setShowMoveModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary"
            >
              <MoveRight className="w-3.5 h-3.5" />
              Move
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-rose-300 rounded-lg text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Drop zone + grid */}
      <div
        ref={dropZoneRef}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative min-h-[300px] rounded-xl border-2 transition-colors ${
          dragOver
            ? 'border-th-accent-500 bg-th-accent-500/5'
            : 'border-transparent'
        }`}
      >
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="px-6 py-4 bg-th-accent-600 text-white rounded-xl text-lg font-medium shadow-lg">
              Drop files to upload
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 border border-dashed border-th-border rounded-xl bg-surface-primary">
            <Upload className="w-12 h-12 text-th-text-tertiary mb-4" />
            <p className="text-th-text-secondary font-medium">No media files yet</p>
            <p className="text-sm text-th-text-tertiary mt-1">
              Drag and drop files here, or click Upload Files
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {/* Select all toggle */}
            <button
              type="button"
              onClick={selectAll}
              className="absolute -top-8 right-0 text-xs text-th-text-secondary hover:text-th-text-primary"
            >
              {selectedIds.size === assets.length ? 'Deselect all' : 'Select all'}
            </button>
            {assets.map((asset) => {
              const isSelected = selectedIds.has(asset.id);
              const Icon = getMimeIcon(asset.mime_type);
              return (
                <div
                  key={asset.id}
                  className={`group relative bg-surface-primary border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'border-th-accent-600 ring-2 ring-th-accent-600/30' : 'border-th-border'
                  }`}
                  onClick={() => setEditingAsset(asset)}
                >
                  {/* Select checkbox */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleSelect(asset.id); }}
                    className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-th-accent-600 border-th-accent-600 text-white'
                        : 'bg-white/80 border-neutral-300 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </button>

                  {/* Thumbnail */}
                  <div className="aspect-square bg-neutral-100 flex items-center justify-center overflow-hidden">
                    {asset.mime_type.startsWith('image/') ? (
                      <img
                        src={asset.url}
                        alt={asset.alt_text || asset.original_filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Icon className="w-10 h-10 text-th-text-tertiary" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-xs font-medium text-th-text-primary truncate">
                      {asset.original_filename}
                    </p>
                    <p className="text-xs text-th-text-tertiary">
                      {formatFileSize(asset.file_size)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface-primary border border-th-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary/60 border-b border-th-border">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === assets.length && assets.length > 0}
                      onChange={selectAll}
                      className="rounded border-th-border"
                    />
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-th-text-secondary">File</th>
                  <th className="text-left px-3 py-2 font-medium text-th-text-secondary hidden md:table-cell">Type</th>
                  <th className="text-left px-3 py-2 font-medium text-th-text-secondary hidden sm:table-cell">Size</th>
                  <th className="text-left px-3 py-2 font-medium text-th-text-secondary hidden lg:table-cell">Uploaded</th>
                  <th className="w-20 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border/60">
                {assets.map((asset) => {
                  const Icon = getMimeIcon(asset.mime_type);
                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-surface-secondary/40 transition-colors cursor-pointer"
                      onClick={() => setEditingAsset(asset)}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(asset.id)}
                          onChange={() => toggleSelect(asset.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-th-border"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-neutral-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {asset.mime_type.startsWith('image/') ? (
                              <img src={asset.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <Icon className="w-5 h-5 text-th-text-tertiary" />
                            )}
                          </div>
                          <span className="font-medium text-th-text-primary truncate max-w-[200px]">
                            {asset.original_filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-th-text-secondary hidden md:table-cell">
                        {asset.mime_type.split('/')[1]?.toUpperCase()}
                      </td>
                      <td className="px-3 py-2 text-th-text-secondary hidden sm:table-cell">
                        {formatFileSize(asset.file_size)}
                      </td>
                      <td className="px-3 py-2 text-th-text-secondary hidden lg:table-cell">
                        {formatDate(asset.created_at)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleCopyUrl(asset.url); }}
                            title="Copy URL"
                            className="p-1.5 rounded text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Asset detail/edit modal */}
      {editingAsset && (
        <AssetDetailModal
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onUpdate={handleUpdateAsset}
          onDelete={async (id) => {
            await mediaLibraryService.deleteAsset(id);
            setEditingAsset(null);
            loadAssets();
            toast.success('Deleted');
          }}
          onCopyUrl={handleCopyUrl}
        />
      )}

      {/* Move modal */}
      {showMoveModal && (
        <MoveModal
          folders={folders}
          currentFolder={currentFolder}
          onMove={handleMove}
          onClose={() => setShowMoveModal(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asset detail modal
// ---------------------------------------------------------------------------

function AssetDetailModal({
  asset,
  onClose,
  onUpdate,
  onDelete,
  onCopyUrl,
}: {
  asset: MediaAsset;
  onClose: () => void;
  onUpdate: (id: string, updates: { alt_text?: string; caption?: string; tags?: string[] }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCopyUrl: (url: string) => void;
}) {
  const [altText, setAltText] = useState(asset.alt_text);
  const [caption, setCaption] = useState(asset.caption);
  const [tags, setTags] = useState(asset.tags.join(', '));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(asset.id, {
      alt_text: altText,
      caption,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setSaving(false);
  };

  const Icon = getMimeIcon(asset.mime_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-surface-primary rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-th-border">
          <h2 className="text-lg font-semibold text-th-text-primary truncate">{asset.original_filename}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 grid md:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="bg-neutral-100 rounded-xl overflow-hidden flex items-center justify-center min-h-[200px]">
            {asset.mime_type.startsWith('image/') ? (
              <img src={asset.url} alt={asset.alt_text} className="max-w-full max-h-[400px] object-contain" />
            ) : asset.mime_type.startsWith('video/') ? (
              <video src={asset.url} controls className="max-w-full max-h-[400px]" />
            ) : (
              <Icon className="w-16 h-16 text-th-text-tertiary" />
            )}
          </div>

          {/* Metadata form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Alt Text</label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe this image for accessibility"
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                placeholder="Optional caption"
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                <Tag className="w-3.5 h-3.5 inline mr-1" />
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="hero, banner, team"
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
              />
            </div>

            {/* File info */}
            <div className="pt-3 border-t border-th-border space-y-1 text-sm text-th-text-secondary">
              <p><span className="font-medium">Size:</span> {formatFileSize(asset.file_size)}</p>
              <p><span className="font-medium">Type:</span> {asset.mime_type}</p>
              {asset.width && asset.height && (
                <p><span className="font-medium">Dimensions:</span> {asset.width} x {asset.height}px</p>
              )}
              <p><span className="font-medium">Uploaded:</span> {formatDate(asset.created_at)}</p>
              <p><span className="font-medium">Folder:</span> {asset.folder}</p>
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={asset.url}
                  readOnly
                  className="flex-1 px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-xs text-th-text-secondary font-mono truncate"
                />
                <button
                  type="button"
                  onClick={() => onCopyUrl(asset.url)}
                  className="px-3 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-5 border-t border-th-border">
          <div className="flex items-center gap-2">
            <a
              href={asset.url}
              download={asset.original_filename}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary text-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
            <button
              type="button"
              onClick={() => onDelete(asset.id)}
              className="inline-flex items-center gap-2 px-3 py-2 border border-rose-300 rounded-lg text-rose-600 hover:bg-rose-50 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-60 text-sm"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Move modal
// ---------------------------------------------------------------------------

function MoveModal({
  folders,
  currentFolder,
  onMove,
  onClose,
}: {
  folders: string[];
  currentFolder: string;
  onMove: (folder: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-surface-primary rounded-xl shadow-xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-th-border">
          <h3 className="text-lg font-semibold text-th-text-primary">Move to folder</h3>
        </div>
        <div className="p-4 space-y-1 max-h-[300px] overflow-y-auto">
          {folders.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onMove(f)}
              disabled={f === currentFolder}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                f === currentFolder
                  ? 'bg-surface-tertiary text-th-text-tertiary cursor-not-allowed'
                  : 'text-th-text-primary hover:bg-surface-tertiary'
              }`}
            >
              <FolderOpen className="w-4 h-4 inline mr-2" />
              {f === '/' ? 'Root (All Files)' : f.replace(/^\//, '')}
              {f === currentFolder && <span className="ml-2 text-xs text-th-text-tertiary">(current)</span>}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-th-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
