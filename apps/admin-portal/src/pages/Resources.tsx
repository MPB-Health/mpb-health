import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FolderOpen,
  Search,
  Filter,
  Upload,
  Download,
  Trash2,
  FileText,
  File,
  Image,
  Video,
  Globe,
  Lock,
} from 'lucide-react';
import { contentService, type Resource } from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';

export default function Resources() {
  const { user } = useAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: '',
    isPublic: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resourcesData, catsData] = await Promise.all([
          contentService.getResources({
            category: categoryFilter || undefined,
            search: searchQuery || undefined,
          }),
          contentService.getResourceCategories(),
        ]);
        setResources(resourcesData);
        setCategories(catsData);
      } catch (err) {
        console.error('Failed to load resources:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchQuery, categoryFilter]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadData((prev) => ({
        ...prev,
        title: prev.title || file.name.split('.')[0],
      }));
      setShowUploadModal(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadData.title || !uploadData.category || !user) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      const resource = await contentService.uploadResource(selectedFile, {
        title: uploadData.title,
        description: uploadData.description,
        category: uploadData.category,
        isPublic: uploadData.isPublic,
        uploadedBy: user.id,
      });
      setResources((prev) => [resource, ...prev]);
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadData({ title: '', description: '', category: '', isPublic: false });
      toast.success('Resource uploaded!');
    } catch (err) {
      toast.error('Failed to upload resource');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      await contentService.deleteResource(resourceId);
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      toast.success('Resource deleted');
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  const handleDownload = async (resource: Resource) => {
    await contentService.trackDownload(resource.id);
    window.open(resource.file_url, '_blank');
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return Video;
    if (fileType.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Resources</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Manage downloadable files and documents
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Upload className="w-5 h-5" />
          <span>Upload</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-th-text-tertiary" />
          <input
            aria-label="Search resources"
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent text-th-text-primary placeholder-th-text-tertiary"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-th-text-tertiary" />
          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resources grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600"></div>
        </div>
      ) : resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => {
            const FileIcon = getFileIcon(resource.file_type);
            return (
              <div
                key={resource.id}
                className="bg-surface-primary rounded-xl border border-th-border p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-th-accent-100 dark:bg-th-accent-900/30 rounded-lg flex items-center justify-center">
                      <FileIcon className="w-5 h-5 text-th-accent-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-th-text-primary truncate">
                        {resource.title}
                      </p>
                      <p className="text-sm text-th-text-tertiary">
                        {formatFileSize(resource.file_size)}
                      </p>
                    </div>
                  </div>
                  {resource.is_public ? (
                    <Globe className="w-4 h-4 text-green-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-th-text-tertiary" />
                  )}
                </div>

                {resource.description && (
                  <p className="text-sm text-th-text-tertiary mt-3 line-clamp-2">
                    {resource.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-th-border-subtle">
                  <div className="flex items-center space-x-2 text-sm text-th-text-tertiary">
                    <Download className="w-4 h-4" />
                    <span>{resource.download_count}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(resource)}
                      aria-label="Download resource"
                      className="p-2 text-th-accent-600 hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20 rounded-lg"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      aria-label="Delete resource"
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface-primary rounded-xl border border-th-border p-12 text-center">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
          <p className="text-th-text-tertiary">No resources found</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 text-th-accent-600 hover:text-th-accent-700 font-medium"
          >
            Upload your first resource
          </button>
        </div>
      )}

      {/* Upload modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-surface-primary rounded-xl shadow-xl w-full max-w-md p-6 border border-th-border">
              <h3 className="text-lg font-semibold text-th-text-primary mb-4">
                Upload Resource
              </h3>

              {selectedFile && (
                <div className="flex items-center space-x-3 p-3 bg-surface-secondary rounded-lg mb-4">
                  <File className="w-5 h-5 text-th-text-tertiary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-th-text-primary truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-th-text-tertiary">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="resource-title" className="block text-sm font-medium text-th-text-secondary mb-1">
                    Title *
                  </label>
                  <input
                    id="resource-title"
                    type="text"
                    value={uploadData.title}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
                <div>
                  <label htmlFor="resource-description" className="block text-sm font-medium text-th-text-secondary mb-1">
                    Description
                  </label>
                  <textarea
                    id="resource-description"
                    value={uploadData.description}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={uploadData.category}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, category: e.target.value })
                    }
                    placeholder="e.g., Documents, Templates, Training"
                    className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
                  />
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadData.isPublic}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, isPublic: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                  />
                  <span className="text-sm text-th-text-secondary">
                    Make publicly accessible
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
