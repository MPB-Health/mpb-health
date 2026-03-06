import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../components/PermissionGate';
import { useOrg } from '../contexts/OrgContext';
import {
  createSalesOrderService,
  formatTimeAgo,
  type SalesOrderWithRelations,
  type SOFilters,
} from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

// Status options
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'partially_delivered', label: 'Partially Delivered' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'closed', label: 'Closed' },
];

// Approval options
const APPROVAL_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'not_required', label: 'Not Required' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// Get status badge colors
function getStatusColors(status: string) {
  switch (status) {
    case 'draft':
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
    case 'pending_approval':
      return { bg: 'bg-amber-100', text: 'text-amber-700' };
    case 'approved':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'confirmed':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'processing':
      return { bg: 'bg-cyan-100', text: 'text-cyan-700' };
    case 'shipped':
      return { bg: 'bg-indigo-100', text: 'text-indigo-700' };
    case 'partially_delivered':
      return { bg: 'bg-orange-100', text: 'text-orange-700' };
    case 'delivered':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    case 'cancelled':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    case 'closed':
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

// Get approval badge colors
function getApprovalColors(approval: string | null) {
  switch (approval) {
    case 'not_required':
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
    case 'pending':
      return { bg: 'bg-amber-100', text: 'text-amber-700' };
    case 'approved':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'rejected':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

// Format currency
function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format status label
function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function SalesOrders() {
  const navigate = useNavigate();
  const { activeOrgId } = useOrg();

  // Initialize sales order service
  const [salesOrderService] = useState(() => createSalesOrderService(supabase));

  const [salesOrders, setSalesOrders] = useState<SalesOrderWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SOFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 20;

  // Bulk selection state
  const [selectedSOs, setSelectedSOs] = useState<Set<string>>(new Set());

  // Load sales orders
  const loadSalesOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { salesOrders: data, total: count } = await salesOrderService.getSalesOrders(
        filters,
        pageSize,
        page * pageSize
      );
      setSalesOrders(data);
      setTotal(count);
    } catch (error) {
      console.error('Failed to load sales orders:', error);
      toast.error('Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  }, [salesOrderService, filters, page]);

  useEffect(() => {
    loadSalesOrders();
  }, [loadSalesOrders]);

  // Clear selection when filters or page change
  useEffect(() => {
    setSelectedSOs(new Set());
  }, [filters, page]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(0);
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, status: (status || undefined) as SOFilters['status'] }));
    setPage(0);
  };

  const handleApprovalFilter = (approval_status: string) => {
    setFilters((prev) => ({ ...prev, approval_status: (approval_status || undefined) as SOFilters['approval_status'] }));
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const csv = generateSOCSV(salesOrders);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-orders-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export sales orders');
    }
  };

  const handleExportSelected = async () => {
    try {
      const selected = salesOrders.filter((so) => selectedSOs.has(so.id));
      const csv = generateSOCSV(selected);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-orders-selected-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export sales orders');
    }
  };

  // Generate CSV from sales orders
  function generateSOCSV(data: SalesOrderWithRelations[]) {
    const headers = ['SO Number', 'Name', 'Account', 'Status', 'Approval', 'Total', 'Order Date', 'Created'];
    const rows = data.map((so) => [
      so.so_number || '',
      so.name || '',
      so.account?.name || '',
      so.status || '',
      so.approval_status || '',
      so.total != null ? so.total.toString() : '',
      so.order_date ? new Date(so.order_date).toLocaleDateString() : '',
      new Date(so.created_at).toLocaleDateString(),
    ]);
    return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
  }

  const toggleSelectAll = useCallback(() => {
    if (selectedSOs.size === salesOrders.length) {
      setSelectedSOs(new Set());
    } else {
      setSelectedSOs(new Set(salesOrders.map((so) => so.id)));
    }
  }, [salesOrders, selectedSOs.size]);

  const toggleSelectSO = useCallback((soId: string) => {
    setSelectedSOs((prev) => {
      const next = new Set(prev);
      if (next.has(soId)) {
        next.delete(soId);
      } else {
        next.add(soId);
      }
      return next;
    });
  }, []);

  const handleRowClick = (soId: string) => {
    navigate(`/sales-orders/${soId}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Bulk Actions Toolbar */}
      {selectedSOs.size > 0 && (
        <div className="bg-th-accent-50 border border-th-accent-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-th-accent-700">
            {selectedSOs.size} sales order{selectedSOs.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-3">
            <PermissionGate permission="sales_orders.read">
              <button
                onClick={handleExportSelected}
                className="text-sm text-th-accent-600 hover:text-th-accent-700 font-medium"
              >
                Export Selected
              </button>
            </PermissionGate>
            <button
              onClick={() => setSelectedSOs(new Set())}
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
          <h1 className="text-2xl font-bold text-th-text-primary">Sales Orders</h1>
          <p className="text-th-text-tertiary text-sm mt-1">{total} total sales orders</p>
        </div>
        <div className="flex items-center space-x-3">
          <PermissionGate permission="sales_orders.read">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </PermissionGate>
          <PermissionGate permission="sales_orders.write">
            <button
              onClick={() => navigate('/sales-orders/new')}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Sales Order</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
            <input
              type="text"
              placeholder="Search by SO number, name, or account..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* Approval filter */}
          <div className="relative">
            <select
              value={filters.approval_status || ''}
              onChange={(e) => handleApprovalFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              {APPROVAL_OPTIONS.map((opt) => (
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

      {/* Sales Orders table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : salesOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <ShoppingCart className="w-12 h-12 mb-4 opacity-50" />
            <p>No sales orders found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new sales order</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-th-border">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedSOs.size === salesOrders.length && salesOrders.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-th-border"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    SO Number
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Account
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Approval
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {salesOrders.map((so) => {
                  const statusColors = getStatusColors(so.status);
                  const approvalColors = getApprovalColors(so.approval_status);
                  const isSelected = selectedSOs.has(so.id);

                  return (
                    <tr
                      key={so.id}
                      className={`hover:bg-surface-secondary cursor-pointer ${
                        isSelected ? 'bg-th-accent-50' : ''
                      }`}
                      onClick={() => handleRowClick(so.id)}
                    >
                      <td
                        className="w-12 px-4 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectSO(so.id)}
                          className="w-4 h-4 rounded border-th-border"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-th-accent-100 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-th-accent-700" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-th-text-primary hover:text-th-accent-600">
                              {so.so_number || '-'}
                            </p>
                            {so.name && (
                              <p className="text-xs text-th-text-tertiary">{so.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {so.account?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                        >
                          {formatStatusLabel(so.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {so.approval_status && (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${approvalColors.bg} ${approvalColors.text}`}
                          >
                            {formatStatusLabel(so.approval_status)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-th-text-primary">
                          {formatCurrency(so.total)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-th-text-secondary">
                        {so.order_date
                          ? new Date(so.order_date).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-th-text-tertiary">
                        {formatTimeAgo(so.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

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
