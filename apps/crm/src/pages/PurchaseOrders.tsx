import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  DollarSign,
  Building2,
  Calendar,
  ShoppingCart,
  Package,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { PermissionGate } from '../components/PermissionGate';
import { Modal } from '../components/Modal';
import { logAuditEvent } from '@mpbhealth/auth';
import type {
  PurchaseOrderWithRelations,
  POFilters,
  POStatus,
  POApprovalStatus,
  VendorWithRelations,
} from '@mpbhealth/crm-core';

const PO_STATUSES: { value: POStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'closed', label: 'Closed' },
];

const APPROVAL_STATUSES: { value: POApprovalStatus | ''; label: string }[] = [
  { value: '', label: 'All Approval Statuses' },
  { value: 'not_required', label: 'Not Required' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

function getStatusColor(status: POStatus): { bg: string; text: string } {
  switch (status) {
    case 'draft':
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
    case 'pending_approval':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    case 'approved':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'sent':
      return { bg: 'bg-indigo-100', text: 'text-indigo-700' };
    case 'acknowledged':
      return { bg: 'bg-cyan-100', text: 'text-cyan-700' };
    case 'partially_received':
      return { bg: 'bg-orange-100', text: 'text-orange-700' };
    case 'received':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'cancelled':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    case 'closed':
      return { bg: 'bg-purple-100', text: 'text-purple-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

function getApprovalStatusColor(status: POApprovalStatus): { bg: string; text: string } {
  switch (status) {
    case 'not_required':
      return { bg: 'bg-gray-100', text: 'text-gray-600' };
    case 'pending':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    case 'approved':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'rejected':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600' };
  }
}

export default function PurchaseOrders() {
  const { purchaseOrderService, vendorService } = useCRM();
  const { activeOrgId } = useOrg();

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<POFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddPO, setShowAddPO] = useState(false);
  const pageSize = 20;

  // For filter dropdowns
  const [vendors, setVendors] = useState<VendorWithRelations[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalPOs: 0,
    totalValue: 0,
    pendingApproval: 0,
    pendingReceiving: 0,
  });

  const loadPurchaseOrders = useCallback(async () => {
    setLoading(true);
    const { purchaseOrders: pos, total: t } = await purchaseOrderService.getPurchaseOrders(
      filters,
      pageSize,
      page * pageSize
    );
    setPurchaseOrders(pos);
    setTotal(t);

    // Calculate stats
    const allPOs = await purchaseOrderService.getPurchaseOrders({}, 1000, 0);
    const pendingApprovalPOs = allPOs.purchaseOrders.filter(
      (po: PurchaseOrderWithRelations) => po.status === 'pending_approval'
    );
    const pendingReceivingPOs = allPOs.purchaseOrders.filter(
      (po: PurchaseOrderWithRelations) =>
        po.status === 'sent' || po.status === 'acknowledged' || po.status === 'partially_received'
    );

    setStats({
      totalPOs: allPOs.total,
      totalValue: allPOs.purchaseOrders.reduce(
        (sum: number, po: PurchaseOrderWithRelations) => sum + (po.total || 0),
        0
      ),
      pendingApproval: pendingApprovalPOs.length,
      pendingReceiving: pendingReceivingPOs.length,
    });

    setLoading(false);
  }, [purchaseOrderService, filters, page]);

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  // Load vendors for filters
  useEffect(() => {
    vendorService.getVendors({}, 100, 0).then(({ vendors: v }: { vendors: VendorWithRelations[] }) => {
      setVendors(v);
    });
  }, [vendorService]);

  const handleSearch = (search: string) => {
    setFilters((prev: POFilters) => ({ ...prev, search }));
    setPage(0);
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev: POFilters) => ({ ...prev, status: (status as POStatus) || undefined }));
    setPage(0);
  };

  const handleApprovalStatusFilter = (approvalStatus: string) => {
    setFilters((prev: POFilters) => ({
      ...prev,
      approval_status: (approvalStatus as POApprovalStatus) || undefined,
    }));
    setPage(0);
  };

  const handleVendorFilter = (vendorId: string) => {
    setFilters((prev: POFilters) => ({ ...prev, vendor_id: vendorId || undefined }));
    setPage(0);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Purchase Orders</h1>
          <p className="text-th-text-tertiary text-sm mt-1">{total} total purchase orders</p>
        </div>
        <PermissionGate permission="purchase_orders.write">
          <button
            onClick={() => setShowAddPO(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
          </button>
        </PermissionGate>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Total POs</p>
              <p className="text-xl font-semibold text-th-text-primary">{stats.totalPOs}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Total Value</p>
              <p className="text-xl font-semibold text-th-text-primary">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Pending Approval</p>
              <p className="text-xl font-semibold text-th-text-primary">{stats.pendingApproval}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Pending Receiving</p>
              <p className="text-xl font-semibold text-th-text-primary">{stats.pendingReceiving}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px] flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
            <input
              type="text"
              placeholder="Search POs by name or number..."
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
              {PO_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* Approval Status filter */}
          <div className="relative">
            <select
              value={filters.approval_status || ''}
              onChange={(e) => handleApprovalStatusFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              {APPROVAL_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* Vendor filter */}
          <div className="relative">
            <select
              value={filters.vendor_id || ''}
              onChange={(e) => handleVendorFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* More filters button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'border-th-accent-500 text-th-accent-700 bg-th-accent-50'
                : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>More</span>
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-th-border grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Min Total */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Min Total
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minTotal || ''}
                onChange={(e) =>
                  setFilters((prev: POFilters) => ({
                    ...prev,
                    minTotal: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {/* Max Total */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Max Total
              </label>
              <input
                type="number"
                placeholder="Any"
                value={filters.maxTotal || ''}
                onChange={(e) =>
                  setFilters((prev: POFilters) => ({
                    ...prev,
                    maxTotal: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {/* Order From */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Order Date From
              </label>
              <input
                type="date"
                value={filters.orderFrom || ''}
                onChange={(e) =>
                  setFilters((prev: POFilters) => ({ ...prev, orderFrom: e.target.value || undefined }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {/* Order To */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Order Date To
              </label>
              <input
                type="date"
                value={filters.orderTo || ''}
                onChange={(e) =>
                  setFilters((prev: POFilters) => ({ ...prev, orderTo: e.target.value || undefined }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Purchase Orders table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
            <p>No purchase orders found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new purchase order</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-th-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    PO
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Approval
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Expected Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {purchaseOrders.map((po) => {
                  const statusColors = getStatusColor(po.status);
                  const approvalColors = getApprovalStatusColor(po.approval_status);

                  return (
                    <tr key={po.id} className="hover:bg-surface-secondary">
                      <td className="px-6 py-4">
                        <Link to={`/purchase-orders/${po.id}`} className="block">
                          <p className="text-sm font-medium text-th-text-primary hover:text-th-accent-600">
                            {po.name}
                          </p>
                          <p className="text-xs text-th-text-tertiary mt-0.5">{po.po_number}</p>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {po.vendor ? (
                          <Link
                            to={`/vendors/${po.vendor.id}`}
                            className="flex items-center gap-2 text-sm text-th-text-secondary hover:text-th-accent-600"
                          >
                            <Building2 className="w-4 h-4 text-th-text-tertiary" />
                            {po.vendor.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-th-text-primary">
                          {formatCurrency(po.total)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors.bg} ${statusColors.text}`}
                        >
                          {po.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${approvalColors.bg} ${approvalColors.text}`}
                        >
                          {po.approval_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {po.expected_date ? (
                          <div className="flex items-center gap-1 text-sm text-th-text-secondary">
                            <Calendar className="w-4 h-4" />
                            {formatDate(po.expected_date)}
                          </div>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
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
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of{' '}
                  {total}
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

      {/* Add Purchase Order Modal */}
      <AddPurchaseOrderModal
        open={showAddPO}
        onClose={() => setShowAddPO(false)}
        onSuccess={() => loadPurchaseOrders()}
      />
    </div>
  );
}

// Add Purchase Order Modal Component
interface AddPurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (poId: string) => void;
}

function AddPurchaseOrderModal({ open, onClose, onSuccess }: AddPurchaseOrderModalProps) {
  const { purchaseOrderService, vendorService } = useCRM();
  const { activeOrgId } = useOrg();

  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<VendorWithRelations[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');

  // Load vendors
  useEffect(() => {
    if (!open) return;

    vendorService.getVendors({ is_active: true }, 100, 0).then(({ vendors: v }: { vendors: VendorWithRelations[] }) => {
      setVendors(v);
    });

    // Reset form
    setName('');
    setDescription('');
    setVendorId('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setExpectedDate('');
    setPaymentTerms('');
    setShippingMethod('');
    setTerms('');
    setNotes('');
  }, [open, vendorService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('PO name is required');
      return;
    }

    if (!vendorId) {
      toast.error('Vendor is required');
      return;
    }

    setLoading(true);

    const result = await purchaseOrderService.createPurchaseOrder({
      name: name.trim(),
      description: description || undefined,
      vendor_id: vendorId,
      order_date: orderDate || undefined,
      expected_date: expectedDate || undefined,
      payment_terms: paymentTerms || undefined,
      shipping_method: shippingMethod || undefined,
      terms_and_conditions: terms || undefined,
      notes: notes || undefined,
    });

    setLoading(false);

    if (result.success && result.purchaseOrderId) {
      toast.success('Purchase order created');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'purchase_order.created',
        entityType: 'purchase_order',
        entityId: result.purchaseOrderId,
        after: { name },
      }).catch(console.error);
      onSuccess?.(result.purchaseOrderId);
      onClose();
    } else {
      toast.error(result.error || 'Failed to create purchase order');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Purchase Order"
      description="Create a new purchase order"
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PO Name */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            PO Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter purchase order name"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={2}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Vendor */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Vendor <span className="text-red-500">*</span>
          </label>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            required
          >
            <option value="">Select a vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Order Date */}
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Order Date
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>

          {/* Expected Date */}
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Expected Delivery
            </label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Payment Terms */}
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Payment Terms
            </label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">Select terms</option>
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 45">Net 45</option>
              <option value="Net 60">Net 60</option>
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="50% Upfront">50% Upfront</option>
            </select>
          </div>

          {/* Shipping Method */}
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Shipping Method
            </label>
            <input
              type="text"
              value={shippingMethod}
              onChange={(e) => setShippingMethod(e.target.value)}
              placeholder="e.g., Ground, Express"
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
        </div>

        {/* Terms & Conditions */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Terms & Conditions
          </label>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Add terms and conditions..."
            rows={3}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Internal Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes..."
            rows={2}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-th-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 hover:bg-th-accent-700 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
