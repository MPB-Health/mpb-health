import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  BookOpen,
  Tag,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../components/PermissionGate';
import { useOrg } from '../contexts/OrgContext';
import {
  createPriceBookService,
  formatTimeAgo,
  type PriceBookWithRelations,
  type PriceBookFilters,
} from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

// Active status options
const ACTIVE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export default function PriceBooks() {
  const navigate = useNavigate();
  const { activeOrgId } = useOrg();

  // Initialize price book service
  const [priceBookService] = useState(() => createPriceBookService(supabase));

  const [priceBooks, setPriceBooks] = useState<PriceBookWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PriceBookFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 20;

  // Bulk selection state
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());

  // Load price books
  const loadPriceBooks = useCallback(async () => {
    setLoading(true);
    try {
      const { priceBooks: data, total: count } = await priceBookService.getPriceBooks(
        filters,
        pageSize,
        page * pageSize
      );
      setPriceBooks(data);
      setTotal(count);
    } catch (error) {
      console.error('Failed to load price books:', error);
      toast.error('Failed to load price books');
    } finally {
      setLoading(false);
    }
  }, [priceBookService, filters, page]);

  useEffect(() => {
    loadPriceBooks();
  }, [loadPriceBooks]);

  // Clear selection when filters or page change
  useEffect(() => {
    setSelectedBooks(new Set());
  }, [filters, page]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(0);
  };

  const handleActiveFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      is_active: value === '' ? undefined : value === 'true',
    }));
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const exportBooks = priceBooks;
      const csv = generatePriceBookCSV(exportBooks);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `price-books-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export price books');
    }
  };

  const handleExportSelected = async () => {
    try {
      const ids = Array.from(selectedBooks);
      const exportBooks = priceBooks.filter((pb) => ids.includes(pb.id));
      const csv = generatePriceBookCSV(exportBooks);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `price-books-selected-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export price books');
    }
  };

  // Generate CSV from price books
  function generatePriceBookCSV(data: PriceBookWithRelations[]) {
    const headers = ['Name', 'Description', 'Default', 'Status', 'Products', 'Currency', 'Effective From', 'Effective To', 'Created'];
    const rows = data.map((pb) => [
      pb.name,
      pb.description || '',
      pb.is_default ? 'Yes' : 'No',
      pb.is_active ? 'Active' : 'Inactive',
      String(pb.items_count ?? 0),
      pb.currency || '',
      pb.effective_from ? new Date(pb.effective_from).toLocaleDateString() : '',
      pb.effective_to ? new Date(pb.effective_to).toLocaleDateString() : '',
      new Date(pb.created_at).toLocaleDateString(),
    ]);
    return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
  }

  const toggleSelectAll = useCallback(() => {
    if (selectedBooks.size === priceBooks.length) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(priceBooks.map((pb) => pb.id)));
    }
  }, [priceBooks, selectedBooks.size]);

  const toggleSelectBook = useCallback((bookId: string) => {
    setSelectedBooks((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  }, []);

  const handleRowClick = (bookId: string) => {
    navigate(`/price-books/${bookId}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Bulk Actions Toolbar */}
      {selectedBooks.size > 0 && (
        <div className="bg-th-accent-50 border border-th-accent-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-th-accent-700">
            {selectedBooks.size} price book{selectedBooks.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-3">
            <PermissionGate permission="price_books.read">
              <button
                onClick={handleExportSelected}
                className="text-sm text-th-accent-600 hover:text-th-accent-700 font-medium"
              >
                Export Selected
              </button>
            </PermissionGate>
            <button
              onClick={() => setSelectedBooks(new Set())}
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
          <h1 className="text-2xl font-bold text-th-text-primary">Price Books</h1>
          <p className="text-th-text-tertiary text-sm mt-1">{total} total price books</p>
        </div>
        <div className="flex items-center space-x-3">
          <PermissionGate permission="price_books.read">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </PermissionGate>
          <PermissionGate permission="price_books.write">
            <button
              onClick={() => navigate('/price-books/new')}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Price Book</span>
            </button>
          </PermissionGate>
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
              placeholder="Search by name or description..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
          </div>

          {/* Active status filter */}
          <div className="relative">
            <select
              value={
                filters.is_active === undefined
                  ? ''
                  : filters.is_active
                    ? 'true'
                    : 'false'
              }
              onChange={(e) => handleActiveFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              {ACTIVE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* More filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'border-th-accent-500 text-th-accent-700 bg-th-accent-50'
                : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Price Books table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : priceBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <BookOpen className="w-12 h-12 mb-4 opacity-50" />
            <p>No price books yet</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new price book</p>
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
                      checked={selectedBooks.size === priceBooks.length && priceBooks.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-th-border"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Default
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Products
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Effective From
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Effective To
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {priceBooks.map((priceBook) => {
                  const isSelected = selectedBooks.has(priceBook.id);

                  return (
                    <tr
                      key={priceBook.id}
                      className={`hover:bg-surface-secondary cursor-pointer ${
                        isSelected ? 'bg-th-accent-50' : ''
                      }`}
                      onClick={() => handleRowClick(priceBook.id)}
                    >
                      <td
                        className="w-12 px-4 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectBook(priceBook.id)}
                          className="w-4 h-4 rounded border-th-border"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-th-accent-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-th-accent-700" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-th-text-primary hover:text-th-accent-600">
                              {priceBook.name}
                            </p>
                            {priceBook.description && (
                              <p className="text-xs text-th-text-tertiary truncate max-w-xs">
                                {priceBook.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {priceBook.is_default ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            <Star className="w-3 h-3" />
                            <span>Default</span>
                          </span>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            priceBook.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {priceBook.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {priceBook.items_count ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-th-text-secondary">
                        {priceBook.effective_from
                          ? new Date(priceBook.effective_from).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-th-text-secondary">
                        {priceBook.effective_to
                          ? new Date(priceBook.effective_to).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {priceBook.currency || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-th-text-tertiary">
                        {formatTimeAgo(priceBook.created_at)}
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
