import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  DollarSign,
  FileText,
  Building2,
  Calendar,
  Package,
  Clock,
  Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { PermissionGate } from '../components/PermissionGate';
import { Modal } from '../components/Modal';
import { logAuditEvent } from '@mpbhealth/auth';
import type {
  SalesOrderWithRelations,
  SOFilters,
  SOStatus,
  SOApprovalStatus,
  AccountWithRelations,
  QuoteWithRelations,
} from '@mpbhealth/crm-core';

const SO_STATUSES: { value: SOStatus | ''; label: string }[] = [
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

const APPROVAL_STATUSES: { value: SOApprovalStatus | ''; label: string }[] = [
  { value: '', label: 'All Approval Statuses' },
  { value: 'not_required', label: 'Not Required' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

function getStatusColor(status: SOStatus): { bg: string; text: string } {
  switch (status) {
    case 'draft':
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
    case 'pending_approval':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    case 'approved':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'confirmed':
      return { bg: 'bg-indigo-100', text: 'text-indigo-700' };
    case 'processing':
      return { bg: 'bg-purple-100', text: 'text-purple-700' };
    case 'shipped':
      return { bg: 'bg-cyan-100', text: 'text-cyan-700' };
    case 'partially_delivered':
      return { bg: 'bg-orange-100', text: 'text-orange-700' };
    case 'delivered':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'cancelled':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    case 'closed':
      return { bg: 'bg-slate-100', text: 'text-slate-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

function getApprovalStatusColor(status: SOApprovalStatus): { bg: string; text: string } {
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
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function SalesOrders() {
  const { salesOrderService, accountService, quoteService } = useCRM();
  const { activeOrgId } = useOrg();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [salesOrders, setSalesOrders] = useState<SalesOrderWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SOFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddSO, setShowAddSO] = useState(false);
  const [showCreateFromQuote, setShowCreateFromQuote] = useState(false);
  const pageSize = 20;

  // For filter dropdowns
  const [accounts, setAccounts] = useState<AccountWithRelations[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalValue: 0,
    pendingApproval: 0,
    inFulfillment: 0,
  });

  const loadSalesOrders = useCallback(async () => {
    setLoading(true);
    const { salesOrders: orders, total: orderTotal } = await salesOrderService.getSalesOrders(
      filters,
      pageSize,
      page * pageSize
    );
    setSalesOrders(orders);
    setTotal(orderTotal);

    // Calculate stats
    const allOrders = await salesOrderService.getSalesOrders({}, 1000, 0);
    const pendingApprovalOrders = allOrders.salesOrders.filter(
      (so) => so.status === 'pending_approval'
    );
    const inFulfillmentOrders = allOrders.salesOrders.filter((so) =>
      ['confirmed', 'processing', 'shipped', 'partially_delivered'].includes(so.status)
    );

    setStats({
      totalOrders: allOrders.total,
      totalValue: allOrders.salesOrders.reduce((sum, so) => sum + (so.total || 0), 0),
      pendingApproval: pendingApprovalOrders.length,
      inFulfillment: inFulfillmentOrders.length,
    });

    setLoading(false);
  }, [salesOrderService, filters, page]);

  useEffect(() => {
    loadSalesOrders();
  }, [loadSalesOrders]);

  // Load accounts for filters
  useEffect(() => {
    accountService.getAccounts({}, 100, 0).then(({ accounts: accts }) => {
      setAccounts(accts);
    });
  }, [accountService]);

  // Check for create from quote parameter
  useEffect(() => {
    const fromQuote = searchParams.get('fromQuote');
    if (fromQuote) {
      setShowCreateFromQuote(true);
    }
  }, [searchParams]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(0);
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, status: (status as SOStatus) || undefined }));
    setPage(0);
  };

  const handleApprovalStatusFilter = (approvalStatus: string) => {
    setFilters((prev) => ({
      ...prev,
      approval_status: (approvalStatus as SOApprovalStatus) || undefined,
    }));
    setPage(0);
  };

  const handleAccountFilter = (accountId: string) => {
    setFilters((prev) => ({ ...prev, account_id: accountId || undefined }));
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
          <h1 className="text-2xl font-bold text-th-text-primary">Sales Orders</h1>
          <p className="text-th-text-tertiary text-sm mt-1">{total} total orders</p>
        </div>
        <div className="flex items-center gap-3">
          <PermissionGate permission="sales_orders.write">
            <button
              onClick={() => setShowCreateFromQuote(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <FileText className="w-4 h-4" />
              <span>From Quote</span>
            </button>
            <button
              onClick={() => setShowAddSO(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Sales Order</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Total Orders</p>
              <p className="text-xl font-semibold text-th-text-primary">{stats.totalOrders}</p>
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
              <Truck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">In Fulfillment</p>
              <p className="text-xl font-semibold text-th-text-primary">{stats.inFulfillment}</p>
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
              placeholder="Search orders by name or number..."
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
              {SO_STATUSES.map((status) => (
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

          {/* Account filter */}
          <div className="relative">
            <select
              value={filters.account_id || ''}
              onChange={(e) => handleAccountFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
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
                  setFilters((prev) => ({
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
                  setFilters((prev) => ({
                    ...prev,
                    maxTotal: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {/* Order Date From */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Order Date From
              </label>
              <input
                type="date"
                value={filters.orderFrom || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, orderFrom: e.target.value || undefined }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {/* Order Date To */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Order Date To
              </label>
              <input
                type="date"
                value={filters.orderTo || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, orderTo: e.target.value || undefined }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sales Orders table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : salesOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <Package className="w-12 h-12 mb-3 opacity-50" />
            <p>No sales orders found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new order</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-th-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Order
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Account
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
                    Order Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {salesOrders.map((so) => {
                  const statusColors = getStatusColor(so.status);
                  const approvalColors = getApprovalStatusColor(so.approval_status);

                  return (
                    <tr key={so.id} className="hover:bg-surface-secondary">
                      <td className="px-6 py-4">
                        <Link to={`/sales-orders/${so.id}`} className="block">
                          <p className="text-sm font-medium text-th-text-primary hover:text-th-accent-600">
                            {so.name}
                          </p>
                          <p className="text-xs text-th-text-tertiary mt-0.5">{so.so_number}</p>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {so.account ? (
                          <Link
                            to={`/accounts/${so.account.id}`}
                            className="flex items-center gap-2 text-sm text-th-text-secondary hover:text-th-accent-600"
                          >
                            <Building2 className="w-4 h-4 text-th-text-tertiary" />
                            {so.account.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-th-text-primary">
                          {formatCurrency(so.total)}
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
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${approvalColors.bg} ${approvalColors.text}`}
                        >
                          {formatStatusLabel(so.approval_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {so.order_date ? (
                          <div className="flex items-center gap-1 text-sm text-th-text-secondary">
                            <Calendar className="w-4 h-4" />
                            {formatDate(so.order_date)}
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

      {/* Add Sales Order Modal */}
      <AddSalesOrderModal
        open={showAddSO}
        onClose={() => setShowAddSO(false)}
        onSuccess={(soId) => {
          loadSalesOrders();
          navigate(`/sales-orders/${soId}`);
        }}
      />

      {/* Create from Quote Modal */}
      <CreateFromQuoteModal
        open={showCreateFromQuote}
        onClose={() => setShowCreateFromQuote(false)}
        onSuccess={(soId) => {
          loadSalesOrders();
          navigate(`/sales-orders/${soId}`);
        }}
      />
    </div>
  );
}

// Add Sales Order Modal Component
interface AddSalesOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (salesOrderId: string) => void;
}

function AddSalesOrderModal({ open, onClose, onSuccess }: AddSalesOrderModalProps) {
  const { salesOrderService, accountService, contactService, dealService } = useCRM();
  const { activeOrgId } = useOrg();

  const [loading, setLoading] = useState(false);
  const [accountsList, setAccountsList] = useState<AccountWithRelations[]>([]);
  const [deals, setDeals] = useState<{ id: string; name: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: string; first_name: string; last_name: string; email: string | null }[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [dealId, setDealId] = useState('');
  const [contactId, setContactId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [promisedDate, setPromisedDate] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');

  // Load accounts and deals
  useEffect(() => {
    if (!open) return;

    Promise.all([
      accountService.getAccounts({}, 100, 0),
      dealService.getDeals({}, 100, 0),
    ]).then(([accountsResult, dealsResult]) => {
      setAccountsList(accountsResult.accounts);
      setDeals(dealsResult.deals);
    });

    // Reset form
    setName('');
    setDescription('');
    setAccountId('');
    setDealId('');
    setContactId('');
    setOrderDate('');
    setRequestedDate('');
    setPromisedDate('');
    setShippingMethod('');
    setPaymentTerms('');
    setNotes('');
  }, [open, accountService, dealService]);

  // Load contacts when account changes
  useEffect(() => {
    if (!accountId) {
      setContacts([]);
      return;
    }

    contactService.getContacts({ account_id: accountId }, 100, 0).then(({ contacts: contactsList }) => {
      setContacts(contactsList);
    });
  }, [accountId, contactService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Order name is required');
      return;
    }

    setLoading(true);

    const result = await salesOrderService.createSalesOrder({
      name: name.trim(),
      description: description || undefined,
      account_id: accountId || undefined,
      deal_id: dealId || undefined,
      contact_id: contactId || undefined,
      order_date: orderDate || undefined,
      requested_date: requestedDate || undefined,
      promised_date: promisedDate || undefined,
      shipping_method: shippingMethod || undefined,
      payment_terms: paymentTerms || undefined,
      notes: notes || undefined,
    });

    setLoading(false);

    if (result.success && result.salesOrderId) {
      toast.success('Sales order created');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'sales_order.created',
        entityType: 'sales_order',
        entityId: result.salesOrderId,
        after: { name },
      }).catch(console.error);
      onSuccess?.(result.salesOrderId);
      onClose();
    } else {
      toast.error(result.error || 'Failed to create sales order');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Sales Order"
      description="Create a new sales order"
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Name */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Order Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter order name"
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

        {/* Account */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">Account</label>
          <select
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setContactId('');
            }}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          >
            <option value="">Select an account</option>
            {accountsList.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">Contact</label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            disabled={!accountId}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 disabled:opacity-50"
          >
            <option value="">{accountId ? 'Select a contact' : 'Select an account first'}</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.first_name} {contact.last_name}
                {contact.email ? ` (${contact.email})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Deal */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Related Deal
          </label>
          <select
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          >
            <option value="">Select a deal (optional)</option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-3 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Requested Date
            </label>
            <input
              type="date"
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Promised Date
            </label>
            <input
              type="date"
              value={promisedDate}
              onChange={(e) => setPromisedDate(e.target.value)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
        </div>

        {/* Shipping & Payment */}
        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Payment Terms
            </label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="e.g., Net 30, Due on Receipt"
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
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
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Create from Quote Modal Component
interface CreateFromQuoteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (salesOrderId: string) => void;
}

function CreateFromQuoteModal({ open, onClose, onSuccess }: CreateFromQuoteModalProps) {
  const { salesOrderService, quoteService } = useCRM();
  const { activeOrgId } = useOrg();

  const [loading, setLoading] = useState(false);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotes, setQuotes] = useState<QuoteWithRelations[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');

  // Load accepted quotes
  useEffect(() => {
    if (!open) return;

    setQuotesLoading(true);
    quoteService.getQuotes({ status: 'accepted' }, 100, 0).then(({ quotes: quotesList }) => {
      setQuotes(quotesList);
      setQuotesLoading(false);
    });

    setSelectedQuoteId('');
  }, [open, quoteService]);

  const selectedQuote = quotes.find((q) => q.id === selectedQuoteId);

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleSubmit = async () => {
    if (!selectedQuoteId) {
      toast.error('Please select a quote');
      return;
    }

    setLoading(true);

    const result = await salesOrderService.createFromQuote(selectedQuoteId);

    setLoading(false);

    if (result.success && result.salesOrderId) {
      toast.success('Sales order created from quote');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'sales_order.created',
        entityType: 'sales_order',
        entityId: result.salesOrderId,
        before: { source_quote_id: selectedQuoteId },
      }).catch(console.error);
      onSuccess?.(result.salesOrderId);
      onClose();
    } else {
      toast.error(result.error || 'Failed to create sales order');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Sales Order from Quote" size="md">
      <div className="space-y-6">
        <p className="text-th-text-secondary">
          Select an accepted quote to create a new sales order. All line items will be copied over.
        </p>

        {quotesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-8 text-th-text-tertiary">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No accepted quotes available</p>
            <p className="text-sm mt-1">Accept a quote first to create a sales order</p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Select Quote
              </label>
              <select
                value={selectedQuoteId}
                onChange={(e) => setSelectedQuoteId(e.target.value)}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              >
                <option value="">Select a quote...</option>
                {quotes.map((quote) => (
                  <option key={quote.id} value={quote.id}>
                    {quote.quote_number} - {quote.name} ({formatCurrency(quote.total)})
                  </option>
                ))}
              </select>
            </div>

            {selectedQuote && (
              <div className="p-4 bg-surface-secondary rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-th-text-primary">{selectedQuote.name}</p>
                    <p className="text-sm text-th-text-tertiary">{selectedQuote.quote_number}</p>
                    {selectedQuote.account && (
                      <p className="text-sm text-th-text-secondary mt-1">
                        Account: {selectedQuote.account.name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-th-accent-600">
                      {formatCurrency(selectedQuote.total)}
                    </p>
                    <p className="text-sm text-th-text-tertiary">
                      {selectedQuote.line_items?.length || 0} line items
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-th-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedQuoteId}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 hover:bg-th-accent-700 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Sales Order'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
