import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingCart,
  DollarSign,
  Package,
  FileText,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useOrg } from '../contexts/OrgContext';
import {
  createSalesOrderService,
  formatTimeAgo,
  type SalesOrderWithRelations,
} from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

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
function formatCurrency(amount: number | null | undefined): string {
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

// Format address object to string
function formatAddress(address: Record<string, string> | null | undefined): string {
  if (!address) return '';
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zip,
    address.country,
  ].filter(Boolean);
  return parts.join(', ');
}

export default function SalesOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeOrgId } = useOrg();

  // Initialize service
  const [salesOrderService] = useState(() => createSalesOrderService(supabase));

  // State
  const [salesOrder, setSalesOrder] = useState<SalesOrderWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'line_items'>('overview');
  const [actionLoading, setActionLoading] = useState(false);

  // Load sales order
  const loadSalesOrder = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const data = await salesOrderService.getSalesOrder(id);
      setSalesOrder(data);
    } catch (error) {
      console.error('Failed to load sales order:', error);
      toast.error('Failed to load sales order');
    } finally {
      setLoading(false);
    }
  }, [id, salesOrderService]);

  useEffect(() => {
    loadSalesOrder();
  }, [loadSalesOrder]);

  // Action handlers
  const handleSubmitForApproval = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await salesOrderService.updateSalesOrder(id, { status: 'pending_approval' });
      toast.success('Sales order submitted for approval');
      loadSalesOrder();
    } catch (error) {
      console.error('Failed to submit for approval:', error);
      toast.error('Failed to submit for approval');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await salesOrderService.updateSalesOrder(id, { status: 'approved', approval_status: 'approved' });
      toast.success('Sales order approved');
      loadSalesOrder();
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve sales order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await salesOrderService.updateSalesOrder(id, { status: 'draft', approval_status: 'rejected' });
      toast.success('Sales order rejected');
      loadSalesOrder();
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('Failed to reject sales order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await salesOrderService.updateSalesOrder(id, { status: 'confirmed' });
      toast.success('Sales order confirmed');
      loadSalesOrder();
    } catch (error) {
      console.error('Failed to confirm:', error);
      toast.error('Failed to confirm sales order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkShipped = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await salesOrderService.updateSalesOrder(id, { status: 'shipped', shipped_date: new Date().toISOString() });
      toast.success('Sales order marked as shipped');
      loadSalesOrder();
    } catch (error) {
      console.error('Failed to mark shipped:', error);
      toast.error('Failed to mark as shipped');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await salesOrderService.updateSalesOrder(id, { status: 'delivered', delivered_date: new Date().toISOString() });
      toast.success('Sales order marked as delivered');
      loadSalesOrder();
    } catch (error) {
      console.error('Failed to mark delivered:', error);
      toast.error('Failed to mark as delivered');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (!salesOrder) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-12 h-12 text-th-text-tertiary mx-auto mb-4" />
        <p className="text-th-text-tertiary">Sales order not found</p>
        <Link to="/sales-orders" className="text-th-accent-600 hover:underline mt-2 inline-block">
          Back to sales orders
        </Link>
      </div>
    );
  }

  const statusColors = getStatusColors(salesOrder.status);
  const approvalColors = getApprovalColors(salesOrder.approval_status);
  const lineItems = salesOrder.line_items || [];
  const subtotal = salesOrder.subtotal ?? 0;
  const tax = salesOrder.tax_amount ?? 0;
  const totalAmount = salesOrder.total ?? 0;
  const billingAddressStr = formatAddress(salesOrder.billing_address as Record<string, string>);
  const shippingAddressStr = formatAddress(salesOrder.shipping_address as Record<string, string>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/sales-orders')}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-th-accent-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-7 h-7 text-th-accent-700" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-th-text-primary">
                  {salesOrder.so_number || 'Sales Order'}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                >
                  {formatStatusLabel(salesOrder.status)}
                </span>
                {salesOrder.approval_status && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${approvalColors.bg} ${approvalColors.text}`}
                  >
                    {formatStatusLabel(salesOrder.approval_status)}
                  </span>
                )}
              </div>
              <p className="text-th-text-tertiary text-sm">
                {salesOrder.name || 'No description'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {salesOrder.status === 'draft' && (
            <button
              onClick={handleSubmitForApproval}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700 disabled:opacity-50"
            >
              <span>Submit for Approval</span>
            </button>
          )}
          {salesOrder.status === 'pending_approval' && (
            <>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <span>Reject</span>
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <span>Approve</span>
              </button>
            </>
          )}
          {salesOrder.status === 'approved' && (
            <button
              onClick={handleConfirm}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <span>Confirm</span>
            </button>
          )}
          {(salesOrder.status === 'confirmed' || salesOrder.status === 'processing') && (
            <button
              onClick={handleMarkShipped}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <span>Mark Shipped</span>
            </button>
          )}
          {salesOrder.status === 'shipped' && (
            <button
              onClick={handleMarkDelivered}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 rounded-lg text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <span>Mark Delivered</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{lineItems.length}</p>
              <p className="text-xs text-th-text-tertiary">Line Items</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{formatCurrency(subtotal)}</p>
              <p className="text-xs text-th-text-tertiary">Subtotal</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{formatCurrency(tax)}</p>
              <p className="text-xs text-th-text-tertiary">Tax</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{formatCurrency(totalAmount)}</p>
              <p className="text-xs text-th-text-tertiary">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface-primary rounded-xl border border-th-border">
        <div className="flex border-b border-th-border">
          {(['overview', 'line_items'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === tab
                  ? 'text-th-accent-600 border-b-2 border-th-accent-600'
                  : 'text-th-text-tertiary hover:text-th-text-secondary'
              }`}
            >
              {tab === 'overview' ? 'Overview' : `Line Items (${lineItems.length})`}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Order Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-th-text-primary">Order Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        SO Number
                      </label>
                      <p className="text-sm text-th-text-primary">{salesOrder.so_number || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Name
                      </label>
                      <p className="text-sm text-th-text-primary">{salesOrder.name || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Status
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                      >
                        {formatStatusLabel(salesOrder.status)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Approval Status
                      </label>
                      {salesOrder.approval_status ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${approvalColors.bg} ${approvalColors.text}`}
                        >
                          {formatStatusLabel(salesOrder.approval_status)}
                        </span>
                      ) : (
                        <p className="text-sm text-th-text-tertiary">-</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Account
                      </label>
                      {salesOrder.account ? (
                        <Link
                          to={`/accounts/${salesOrder.account.id}`}
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {salesOrder.account.name}
                        </Link>
                      ) : (
                        <p className="text-sm text-th-text-tertiary">-</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Contact
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {salesOrder.contact
                          ? `${salesOrder.contact.first_name || ''} ${salesOrder.contact.last_name || ''}`.trim() || '-'
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Deal
                      </label>
                      {salesOrder.deal ? (
                        <Link
                          to={`/deals/${salesOrder.deal.id}`}
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {salesOrder.deal.name}
                        </Link>
                      ) : (
                        <p className="text-sm text-th-text-tertiary">-</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Quote
                      </label>
                      {salesOrder.quote ? (
                        <Link
                          to={`/quotes/legacy/${salesOrder.quote.id}`}
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {salesOrder.quote.quote_number || salesOrder.quote.name || 'View Quote'}
                        </Link>
                      ) : (
                        <p className="text-sm text-th-text-tertiary">-</p>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <h4 className="text-sm font-semibold text-th-text-primary pt-4">Dates</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Order Date
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {salesOrder.order_date
                          ? new Date(salesOrder.order_date).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Requested Date
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {salesOrder.requested_date
                          ? new Date(salesOrder.requested_date).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Promised Date
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {salesOrder.promised_date
                          ? new Date(salesOrder.promised_date).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Shipped Date
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {salesOrder.shipped_date
                          ? new Date(salesOrder.shipped_date).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Delivered Date
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {salesOrder.delivered_date
                          ? new Date(salesOrder.delivered_date).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Shipping */}
                  <h4 className="text-sm font-semibold text-th-text-primary pt-4">Shipping</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Payment Terms
                      </label>
                      <p className="text-sm text-th-text-primary">{salesOrder.payment_terms || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Shipping Method
                      </label>
                      <p className="text-sm text-th-text-primary">{salesOrder.shipping_method || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Tracking Number
                      </label>
                      <p className="text-sm text-th-text-primary">{salesOrder.tracking_number || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Carrier
                      </label>
                      <p className="text-sm text-th-text-primary">{salesOrder.carrier || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Addresses & Notes */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-th-text-primary">Addresses & Notes</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                      Billing Address
                    </label>
                    <p className="text-sm text-th-text-primary">{billingAddressStr || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                      Shipping Address
                    </label>
                    <p className="text-sm text-th-text-primary">{shippingAddressStr || '-'}</p>
                  </div>
                  {salesOrder.notes && (
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Notes
                      </label>
                      <p className="text-sm text-th-text-secondary whitespace-pre-wrap">{salesOrder.notes}</p>
                    </div>
                  )}
                  {salesOrder.terms_and_conditions && (
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Terms & Conditions
                      </label>
                      <p className="text-sm text-th-text-secondary whitespace-pre-wrap">
                        {salesOrder.terms_and_conditions}
                      </p>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="pt-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Created</label>
                        <p className="text-sm text-th-text-primary">{formatTimeAgo(salesOrder.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Line Items Tab */}
          {activeTab === 'line_items' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-th-text-primary">
                Line Items ({lineItems.length})
              </h3>
              {lineItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-th-text-tertiary mx-auto mb-4 opacity-50" />
                  <p className="text-th-text-tertiary">No line items</p>
                  <p className="text-sm text-th-text-tertiary mt-1">
                    Add line items to this sales order
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-th-border">
                        <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Qty Shipped
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Qty Delivered
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Discount
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Tax
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-th-border">
                      {lineItems.map((item: any) => {
                        const qty = item.quantity ?? 0;
                        const qtyShipped = item.quantity_shipped ?? 0;
                        const qtyDelivered = item.quantity_delivered ?? 0;
                        const shippedPct = qty > 0 ? Math.min((qtyShipped / qty) * 100, 100) : 0;
                        const deliveredPct = qty > 0 ? Math.min((qtyDelivered / qty) * 100, 100) : 0;

                        return (
                          <tr key={item.id} className="hover:bg-surface-secondary">
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-th-text-primary">
                                {item.item_name || item.name || '-'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-th-text-secondary">
                                {item.sku || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-th-text-primary">{qty}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col items-end space-y-1">
                                <span className="text-sm text-th-text-primary">{qtyShipped}</span>
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${shippedPct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col items-end space-y-1">
                                <span className="text-sm text-th-text-primary">{qtyDelivered}</span>
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${deliveredPct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-th-text-primary">
                                {formatCurrency(item.unit_price)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-th-text-secondary">
                                {formatCurrency(item.discount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-th-text-secondary">
                                {formatCurrency(item.tax)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-medium text-th-text-primary">
                                {formatCurrency(item.total)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Totals summary */}
                  <div className="border-t border-th-border px-6 py-4">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-th-text-tertiary">Subtotal</span>
                          <span className="text-th-text-primary font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-th-text-tertiary">Tax</span>
                          <span className="text-th-text-primary font-medium">{formatCurrency(tax)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-th-border pt-2">
                          <span className="text-th-text-primary font-semibold">Total</span>
                          <span className="text-th-text-primary font-bold">{formatCurrency(totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
