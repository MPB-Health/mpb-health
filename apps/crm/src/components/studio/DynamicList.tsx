import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  MoreVertical,
  Trash2,
  Eye,
  Edit2,
  Download,
} from 'lucide-react';
import type { StudioModule, StudioField, StudioView, DynamicRecord } from '@mpbhealth/crm-core';
import { DynamicFieldDisplay } from './DynamicFieldRenderer';

interface DynamicListProps {
  module: StudioModule;
  fields: StudioField[];
  view?: StudioView | null;
  records: DynamicRecord[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRecordClick: (record: DynamicRecord) => void;
  onEdit?: (record: DynamicRecord) => void;
  onDelete?: (recordIds: string[]) => void;
  onExport?: (recordIds: string[]) => void;
  onSort?: (fieldId: string, direction: 'asc' | 'desc') => void;
  onSearch?: (search: string) => void;
  sortFieldId?: string | null;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  loading?: boolean;
}

export function DynamicList({
  module,
  fields,
  view,
  records,
  total,
  page,
  pageSize,
  onPageChange,
  onRecordClick,
  onEdit,
  onDelete,
  onExport,
  onSort,
  onSearch,
  sortFieldId,
  sortDirection = 'desc',
  searchTerm = '',
  loading = false,
}: DynamicListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Build field lookup
  const fieldMap = useMemo(() => {
    const map = new Map<string, StudioField>();
    for (const field of fields) {
      map.set(field.id, field);
    }
    return map;
  }, [fields]);

  // Determine which columns to show
  const columns = useMemo(() => {
    if (view?.columns && view.columns.length > 0) {
      // Use view columns
      return view.columns
        .map((col) => {
          const field = fieldMap.get(col.field_id);
          return field ? { field, width: col.width, sortable: col.sortable } : null;
        })
        .filter(Boolean) as { field: StudioField; width?: number; sortable?: boolean }[];
    }

    // Default: show first 5 fields
    const defaultFields = fields
      .filter((f) => !['owner_id', 'created_by'].includes(f.api_name))
      .slice(0, 5);
    return defaultFields.map((field) => ({ field, sortable: true }));
  }, [view, fields, fieldMap]);

  const totalPages = Math.ceil(total / pageSize);
  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  const handleSelectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSearch = () => {
    onSearch?.(localSearch);
  };

  const handleSort = (field: StudioField) => {
    if (!onSort) return;
    const newDirection =
      sortFieldId === field.id && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(field.id, newDirection);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size > 0 && onDelete) {
      onDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleBulkExport = () => {
    if (selectedIds.size > 0 && onExport) {
      onExport(Array.from(selectedIds));
    }
  };

  return (
    <div className="bg-white rounded-xl border border-th-border">
      {/* Toolbar */}
      <div className="p-4 border-b border-th-border flex items-center justify-between gap-4">
        {/* Search */}
        {onSearch && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={`Search ${module.plural_name}...`}
              className="w-full pl-9 pr-3 py-2 border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
        )}

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-th-text-secondary">
              {selectedIds.size} selected
            </span>
            {onDelete && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            {onExport && (
              <button
                onClick={handleBulkExport}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-th-text-secondary hover:bg-surface-secondary rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        )}

        {/* View name */}
        {view && (
          <div className="text-sm text-th-text-tertiary">
            View: <span className="font-medium text-th-text-secondary">{view.name}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-secondary">
              {/* Checkbox column */}
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === records.length && records.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                />
              </th>

              {/* Data columns */}
              {columns.map(({ field, sortable }) => (
                <th
                  key={field.id}
                  className={`px-4 py-3 text-left text-xs font-medium text-th-text-secondary uppercase tracking-wider ${
                    sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => sortable && handleSort(field)}
                >
                  <div className="flex items-center gap-1">
                    {field.label}
                    {sortFieldId === field.id && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </div>
                </th>
              ))}

              {/* Actions column */}
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-th-border">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-th-text-tertiary">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-th-accent-600" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-12 text-center">
                  <p className="text-th-text-tertiary">No {module.plural_name.toLowerCase()} found</p>
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-surface-secondary transition-colors cursor-pointer"
                  onClick={() => onRecordClick(record)}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(record.id)}
                      onChange={() => handleSelectRow(record.id)}
                      className="h-4 w-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                    />
                  </td>

                  {/* Data cells */}
                  {columns.map(({ field }) => (
                    <td key={field.id} className="px-4 py-3 text-sm">
                      <DynamicFieldDisplay field={field} value={record[field.api_name]} />
                    </td>
                  ))}

                  {/* Actions */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActionMenuId(actionMenuId === record.id ? null : record.id)
                        }
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-th-text-tertiary" />
                      </button>

                      {actionMenuId === record.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-th-border rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              onRecordClick(record);
                              setActionMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-th-text-secondary hover:bg-surface-secondary"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          {onEdit && (
                            <button
                              onClick={() => {
                                onEdit(record);
                                setActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-th-text-secondary hover:bg-surface-secondary"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => {
                                onDelete([record.id]);
                                setActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="px-4 py-3 border-t border-th-border flex items-center justify-between">
          <p className="text-sm text-th-text-tertiary">
            Showing {startRecord} to {endRecord} of {total} {module.plural_name.toLowerCase()}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-1.5 border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-th-accent-600 text-white'
                        : 'hover:bg-surface-secondary text-th-text-secondary'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-1.5 border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close action menu */}
      {actionMenuId && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => setActionMenuId(null)}
        />
      )}
    </div>
  );
}

export default DynamicList;
