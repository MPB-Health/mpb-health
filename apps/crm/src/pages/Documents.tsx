import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  FileText,
  Upload,
  Folder,
  Image,
  Table,
  File,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createDocumentService,
  formatTimeAgo,
  type DocumentWithRelations,
  type DocumentFilters,
  type DocumentCategory,
} from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

// Category options
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'contract', label: 'Contract' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'report', label: 'Report' },
  { value: 'other', label: 'Other' },
];

// Category badge colors
function getCategoryColors(category: DocumentCategory) {
  switch (category) {
    case 'contract':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'proposal':
      return { bg: 'bg-purple-100', text: 'text-purple-700' };
    case 'invoice':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'report':
      return { bg: 'bg-cyan-100', text: 'text-cyan-700' };
    case 'general':
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
    case 'other':
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

// MIME type icon mapping
function getMimeIcon(mimeType: string) {
  if (mimeType === 'application/pdf') {
    return { Icon: FileText, color: 'text-red-600', bg: 'bg-red-100' };
  }
  if (mimeType.startsWith('image/')) {
    return { Icon: Image, color: 'text-blue-600', bg: 'bg-blue-100' };
  }
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType === 'text/csv'
  ) {
    return { Icon: Table, color: 'text-green-600', bg: 'bg-green-100' };
  }
  if (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType.includes('text/')
  ) {
    return { Icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' };
  }
  return { Icon: File, color: 'text-gray-600', bg: 'bg-gray-100' };
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function Documents() {
  // Initialize document service
  const [documentService] = useState(() => createDocumentService(supabase));

  const [documents, setDocuments] = useState<DocumentWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Bulk selection state
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // Load documents
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const { documents: data, total: count } = await documentService.getDocuments(
        filters,
        pageSize,
        page * pageSize
      );
      setDocuments(data);
      setTotal(count);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [documentService, filters, page]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Clear selection when filters or page change
  useEffect(() => {
    setSelectedDocs(new Set());
  }, [filters, page]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(0);
  };

  const handleCategoryFilter = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      category: (category || undefined) as DocumentCategory | undefined,
    }));
    setPage(0);
  };

  const handleDownload = async (doc: DocumentWithRelations, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const { data, error } = await supabase.storage
        .from('crm-documents')
        .createSignedUrl(doc.file_path, 60);

      if (error) {
        toast.error('Failed to generate download link');
        return;
      }

      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = doc.file_name;
      a.target = '_blank';
      a.click();
    } catch {
      toast.error('Failed to download file');
    }
  };

  const handleOpenFile = async (doc: DocumentWithRelations) => {
    try {
      const { data, error } = await supabase.storage
        .from('crm-documents')
        .createSignedUrl(doc.file_path, 300);

      if (error) {
        toast.error('Failed to generate file link');
        return;
      }

      window.open(data.signedUrl, '_blank');
    } catch {
      toast.error('Failed to open file');
    }
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document?')) return;

    const result = await documentService.deleteDocument(docId);
    if (result.success) {
      toast.success('Document deleted');
      loadDocuments();
    } else {
      toast.error(result.error || 'Failed to delete document');
    }
  };

  const handleExport = () => {
    const csv = generateDocumentCSV(documents);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documents-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const handleExportSelected = () => {
    const selected = documents.filter((d) => selectedDocs.has(d.id));
    const csv = generateDocumentCSV(selected);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documents-selected-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  function generateDocumentCSV(data: DocumentWithRelations[]) {
    const headers = ['Name', 'File Name', 'Category', 'Size', 'MIME Type', 'Folder', 'Uploaded By', 'Created'];
    const rows = data.map((doc) => [
      doc.name,
      doc.file_name,
      doc.category,
      formatFileSize(doc.file_size),
      doc.mime_type,
      doc.folder || '',
      doc.uploader?.full_name || doc.uploader?.email || '',
      new Date(doc.created_at).toLocaleDateString(),
    ]);
    return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
  }

  const toggleSelectAll = useCallback(() => {
    if (selectedDocs.size === documents.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(documents.map((d) => d.id)));
    }
  }, [documents, selectedDocs.size]);

  const toggleSelectDoc = useCallback((docId: string) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  }, []);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Bulk Actions Toolbar */}
      {selectedDocs.size > 0 && (
        <div className="bg-th-accent-50 border border-th-accent-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-th-accent-700">
            {selectedDocs.size} document{selectedDocs.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportSelected}
              className="text-sm text-th-accent-600 hover:text-th-accent-700 font-medium"
            >
              Export Selected
            </button>
            <button
              onClick={() => setSelectedDocs(new Set())}
              className="text-sm text-th-text-tertiary hover:text-th-text-secondary"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Documents</h1>
          <p className="text-th-text-tertiary text-sm mt-1">{total} total documents</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            disabled
            title="Upload coming soon"
            className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
            <input
              type="text"
              placeholder="Search by name, file name, or description..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={filters.category || ''}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Documents table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p>No documents found</p>
            <p className="text-sm mt-1">Try adjusting your filters or upload a new document</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-th-border">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedDocs.size === documents.length && documents.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-th-border"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Size
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Created
                  </th>
                  <th className="w-24 px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {documents.map((doc) => {
                  const categoryColors = getCategoryColors(doc.category);
                  const mimeInfo = getMimeIcon(doc.mime_type);
                  const isSelected = selectedDocs.has(doc.id);

                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-surface-secondary cursor-pointer ${
                        isSelected ? 'bg-th-accent-50' : ''
                      }`}
                      onClick={() => handleOpenFile(doc)}
                    >
                      <td
                        className="w-12 px-4 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectDoc(doc.id)}
                          className="w-4 h-4 rounded border-th-border"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${mimeInfo.bg} rounded-lg flex items-center justify-center`}>
                            <mimeInfo.Icon className={`w-5 h-5 ${mimeInfo.color}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-th-text-primary hover:text-th-accent-600">
                              {doc.name}
                            </p>
                            <p className="text-xs text-th-text-tertiary">
                              {doc.file_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text}`}
                        >
                          {doc.category.charAt(0).toUpperCase() + doc.category.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {formatFileSize(doc.file_size)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {doc.uploader?.full_name || doc.uploader?.email || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-th-text-tertiary">
                        {formatTimeAgo(doc.created_at)}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => handleDownload(doc, e)}
                            title="Download"
                            className="p-1.5 rounded-lg text-th-text-tertiary hover:text-th-accent-600 hover:bg-surface-secondary"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(doc.id, e)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-th-text-tertiary hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-th-border">
                <p className="text-sm text-th-text-tertiary">
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 text-sm border border-th-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1 text-sm border border-th-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
