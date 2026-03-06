import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  DollarSign,
  Package,
  Calendar,
  Truck,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../components/PermissionGate';
import { useOrg } from '../contexts/OrgContext';
import {
  createPurchaseOrderService,
  formatTimeAgo,
  type PurchaseOrderWithRelations,
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
    case 'sent':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'acknowledged':
      return { bg: 'bg-cyan-100', text: 'text-cyan-700' };
    case 'partially_received':
      return { bg: 'bg-orange-100', text: 'text-orange-700' };
    case 'received':
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
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Format address from JSONB
function formatAddress(address: Record<string, string> | null): string {
  if (!address) return '';
  const parts = [
    address.street,
    address.street2,
    address.city,
    address.state,
    address.zip,
    address.country,
  ].filter(Boolean);
  return parts.join(', ');
}

export default function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeOrgId } = useOrg();

  // Initialize service
  const [purchaseOrderService] = useState(() => createPurchaseOrderService(supabase));

  // State
  const [po, setPO] = useState<PurchaseOrderWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'line_items'>('overview');

  // Load purchase order
  const loadPurchaseOrder = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const data = await purchaseOrderService.getPurchaseOrder(id);
      setPO(data);
    } catch (error) {
      console.error('Failed to load purchase order:', error);
      toast.error('Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  }, [id, purchaseOrderService]);

  useEffect(() => {
    loadPurchaseOrder();
  }, [loadPurchaseOrder]);

  // Action handlers
  const handleSubmitForApproval = async () => {
    if (!id) return;
    try {
      await purchaseOrderService.updatePurchaseOrder(id, {
        status: 'pending_approval',
        approval_status: 'pending',
      });
      toast.success('Purchase order submitted for approval');
      loadPurchaseOrder();
    } catch (error) {
      console.error('Failed to submit for approval:', error);
      toast.error('Failed to submit for approval');
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      await purchaseOrderService.updatePurchaseOrder(id, {
        status: 'approved',
        approval_status: 'approved',
      });
      toast.success('Purchase order approved');
      loadPurchaseOrder();
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve purchase order');
    }
  };

  const handleReject = async () => {
    if (!id) return;
    try {
      await purchaseOrderService.updatePurchaseOrder(id, {
        status: 'draft',
        approval_status: 'rejected',
      });
      toast.success('Purchase order rejected');
      loadPurchaseOrder();
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('Failed to reject purchase order');
    }
  };

  const handleSend = async () => {
    if (!id) return;
    try {
      await purchaseOrderService.updatePurchaseOrder(id, { status: 'sent' });
      toast.success('Purchase order sent');
      loadPurchaseOrder();
    } catch (error) {
      console.error('Failed to send:', error);
      toast.error('Failed to send purchase order');
    }
  };

  const handleMarkReceived = async () => {
    if (!id) return;
    try {
      await purchaseOrderService.updatePurchaseOrder(id, {
        status: 'received',
        received_date: new Date().toISOString(),
      });
      toast.success('Purchase order marked as received');
      loadPurchaseOrder();
    } catch (error) {
      console.error('Failed to mark as received:', error);
      toast.error('Failed to mark as received');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="w-12 h-12 text-th-text-tertiary mx-auto mb-4" />
        <p className="text-th-text-tertiary">Purchase order not found</p>
        <Link to="/purchase-orders" className="text-th-accent-600 hover:underline mt-2 inline-block">
          Back to purchase orders
        </Link>
      </div>
    );
  }

  const statusColors = getStatusColors(po.status);
  const approvalColors = getApprovalColors(po.approval_status);
  const lineItems = po.line_items || [];
  const subtotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const taxTotal = lineItems.reduce((sum, item) => sum + (item.tax || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/purchase-orders')}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-th-accent-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-th-accent-700" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-th-text-primary">{po.po_number}</h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                >
                  {formatStatusLabel(po.status)}
                </span>
                {po.approval_status && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${approvalColors.bg} ${approvalColors.text}`}
                  >
                    {formatStatusLabel(po.approval_status)}
                  </span>
                )}
              </div>
              <p className="text-th-text-tertiary text-sm">{po.name || 'Untitled Purchase Order'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <PermissionGate permission="purchase_orders.write">
            {po.status === 'draft' && (
              <button
                onClick={handleSubmitForApproval}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-600 rounded-lg text-sm font-medium text-white hover:bg-amber-700"
              >
                <span>Submit for Approval</span>
              </button>
            )}
            {po.status === 'pending_approval' && (
              <>
                <button
                  onClick={handleApprove}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700"
                >
                  <span>Approve</span>
                </button>
                <button
                  onClick={handleReject}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 rounded-lg text-sm font-medium text-white hover:bg-red-700"
                >
                  <span>Reject</span>
                </button>
              </>
            )}
            {po.status === 'approved' && (
              <button
                onClick={handleSend}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700"
              >
                <span>Send</span>
              </button>
            )}
            {(po.status === 'sent' || po.status === 'acknowledged') && (
              <button
                onClick={handleMarkReceived}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 rounded-lg text-sm font-medium text-white hover:bg-emerald-700"
              >
                <span>Mark Received</span>
              </button>
            )}
          </PermissionGate>
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
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{formatCurrency(taxTotal)}</p>
              <p className="text-xs text-th-text-tertiary">Tax</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-th-accent-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-th-accent-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{formatCurrency(po.total)}</p>
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
              {/* PO Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-th-text-primary">Purchase Order Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        PO Number
                      </label>
                      <p className="text-sm text-th-text-primary">{po.po_number}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Name
                      </label>
                      <p className="text-sm text-th-text-primary">{po.name || '-'}</p>
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
                        {formatStatusLabel(po.status)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Approval Status
                      </label>
                      {po.approval_status ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${approvalColors.bg} ${approvalColors.text}`}
                        >
                          {formatStatusLabel(po.approval_status)}
                        </span>
                      ) : (
                        <p className="text-sm text-th-text-primary">-</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Vendor
                      </label>
                      {po.vendor ? (
                        <Link
                          to={`/vendors/${po.vendor.id}`}
                          className="text-sm text-th-accent-600 hover:underline"
                        >
                          {po.vendor.name}
                        </Link>
                      ) : (
                        <p className="text-sm text-th-text-primary">-</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Order Date
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {po.order_date ? new Date(po.order_date).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Expected Date
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Received Date
                      </label>
                      <p className="text-sm text-th-text-primary">
                        {po.received_date ? new Date(po.received_date).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Payment Terms
                      </label>
                      <p className="text-sm text-th-text-primary">{po.payment_terms || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                        Shipping Method
                      </label>
                      <p className="text-sm text-th-text-primary">{po.shipping_method || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-1">
                      Tracking Number
                    </label>
                    <p className="text-sm text-th-text-primary">{po.tracking_number || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-th-text-primary">Additional Information</h3>
                <div className="space-y-4">
                  {po.ship_to_address && (
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                        <Truck className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Ship-to Address</label>
                        <p className="text-sm text-th-text-primary">
                          {formatAddress(po.ship_to_address as Record<string, string>)}
                        </p>
                      </div>
                    </div>
                  )}
                  {po.notes && (
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Notes</label>
                        <p className="text-sm text-th-text-secondary whitespace-pre-wrap">{po.notes}</p>
                      </div>
                    </div>
                  )}
                  {po.terms_and_conditions && (
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-tertiary">Terms & Conditions</label>
                        <p className="text-sm text-th-text-secondary whitespace-pre-wrap">{po.terms_and_conditions}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-th-text-tertiary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-th-text-tertiary">Created</label>
                      <p className="text-sm text-th-text-primary">{formatTimeAgo(po.created_at)}</p>
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
                  <p className="text-th-text-tertiary">No line items yet</p>
                  <p className="text-sm text-th-text-tertiary mt-1">
                    Add line items to this purchase order
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
                          Qty Received
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                          Unit Cost
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
                      {lineItems.map((item) => {
                        const qty = item.quantity || 0;
                        const qtyReceived = item.quantity_received || 0;
                        const receivedPercent = qty > 0 ? Math.min((qtyReceived / qty) * 100, 100) : 0;

                        return (
                          <tr key={item.id} className="hover:bg-surface-secondary">
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-th-text-primary">{item.item_name}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-th-text-secondary">{item.sku || '-'}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-th-text-primary">{qty}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col items-end space-y-1">
                                <span className="text-sm text-th-text-primary">{qtyReceived}</span>
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      receivedPercent >= 100
                                        ? 'bg-emerald-500'
                                        : receivedPercent > 0
                                        ? 'bg-amber-500'
                                        : 'bg-gray-300'
                                    }`}
                                    style={{ width: `${receivedPercent}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-th-text-primary">{formatCurrency(item.unit_cost)}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-th-text-secondary">{formatCurrency(item.discount)}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-th-text-secondary">{formatCurrency(item.tax)}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-medium text-th-text-primary">{formatCurrency(item.total)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-th-border">
                      <tr>
                        <td colSpan={5} />
                        <td className="px-6 py-3 text-right text-xs font-medium text-th-text-tertiary uppercase">Subtotal</td>
                        <td />
                        <td className="px-6 py-3 text-right text-sm font-medium text-th-text-primary">{formatCurrency(subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={5} />
                        <td className="px-6 py-3 text-right text-xs font-medium text-th-text-tertiary uppercase">Tax</td>
                        <td />
                        <td className="px-6 py-3 text-right text-sm font-medium text-th-text-primary">{formatCurrency(taxTotal)}</td>
                      </tr>
                      <tr className="border-t border-th-border">
                        <td colSpan={5} />
                        <td className="px-6 py-3 text-right text-xs font-bold text-th-text-primary uppercase">Total</td>
                        <td />
                        <td className="px-6 py-3 text-right text-sm font-bold text-th-text-primary">{formatCurrency(po.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
