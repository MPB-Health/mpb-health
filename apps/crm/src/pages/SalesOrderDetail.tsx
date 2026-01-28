import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Send,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Building2,
  Calendar,
  FileText,
  Briefcase,
  Truck,
  Package,
  Clock,
  CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { PermissionGate } from '../components/PermissionGate';
import { Modal } from '../components/Modal';
import { logAuditEvent } from '@mpbhealth/auth';
import type {
  SalesOrderWithRelations,
  SOLineItem,
  SOStatus,
  SOApprovalStatus,
  SOLineItemCreateInput,
  Product,
  AccountWithRelations,
} from '@mpbhealth/crm-core';

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

export default function SalesOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { salesOrderService, productService } = useCRM();
  const { activeOrgId, can } = useOrg();

  const [salesOrder, setSalesOrder] = useState<SalesOrderWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals
  const [showEditSO, setShowEditSO] = useState(false);
  const [showAddLineItem, setShowAddLineItem] = useState(false);
  const [showEditLineItem, setShowEditLineItem] = useState<SOLineItem | null>(null);
  const [showSubmitForApproval, setShowSubmitForApproval] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showConfirmOrder, setShowConfirmOrder] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showDeliverConfirm, setShowDeliverConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const loadSalesOrder = async () => {
    if (!id) return;

    setLoading(true);
    const soData = await salesOrderService.getSalesOrder(id);
    setSalesOrder(soData);
    setLoading(false);
  };

  useEffect(() => {
    loadSalesOrder();
  }, [id]);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salesOrder?.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSubmitForApproval = async () => {
    if (!salesOrder) return;

    setSaving(true);
    const result = await salesOrderService.submitForApproval(salesOrder.id);
    setSaving(false);

    if (result.success) {
      toast.success('Order submitted for approval');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'sales_order.submitted_for_approval',
        entityType: 'sales_order',
        entityId: salesOrder.id,
        after: { status: 'pending_approval' },
      }).catch(console.error);
      setShowSubmitForApproval(false);
      loadSalesOrder();
    } else {
      toast.error(result.error || 'Failed to submit for approval');
    }
  };

  const handleApprove = async () => {
    if (!salesOrder) return;

    setSaving(true);
    const result = await salesOrderService.approve(salesOrder.id);
    setSaving(false);

    if (result.success) {
      toast.success('Order approved');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'sales_order.approved',
        entityType: 'sales_order',
        entityId: salesOrder.id,
        after: { status: 'approved', approval_status: 'approved' },
      }).catch(console.error);
      setShowApproveConfirm(false);
      loadSalesOrder();
    } else {
      toast.error(result.error || 'Failed to approve order');
    }
  };

  const handleReject = async () => {
    if (!salesOrder) return;

    setSaving(true);
    const result = await salesOrderService.reject(salesOrder.id, rejectReason);
    setSaving(false);

    if (result.success) {
      toast.success('Order rejected');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'sales_order.rejected',
        entityType: 'sales_order',
        entityId: salesOrder.id,
        after: { approval_status: 'rejected', rejection_reason: rejectReason },
      }).catch(console.error);
      setShowRejectModal(false);
      setRejectReason('');
      loadSalesOrder();
    } else {
      toast.error(result.error || 'Failed to reject order');
    }
  };

  const handleConfirm = async () => {
    if (!salesOrder) return;

    setSaving(true);
    const result = await salesOrderService.confirm(salesOrder.id);
    setSaving(false);

    if (result.success) {
      toast.success('Order confirmed');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'sales_order.confirmed',
        entityType: 'sales_order',
        entityId: salesOrder.id,
        after: { status: 'confirmed' },
      }).catch(console.error);
      setShowConfirmOrder(false);
      loadSalesOrder();
    } else {
      toast.error(result.error || 'Failed to confirm order');
    }
  };

  const handleShip = async () => {
    if (!salesOrder) return;

    setSaving(true);
    const result = await salesOrderService.markShipped(salesOrder.id, trackingNumber || undefined);
    setSaving(false);

    if (result.success) {
      toast.success('Order marked as shipped');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'sales_order.shipped',
        entityType: 'sales_order',
        entityId: salesOrder.id,
        after: { status: 'shipped', tracking_number: trackingNumber },
      }).catch(console.error);
      setShowShipModal(false);
      setTrackingNumber('');
      loadSalesOrder();
    } else {
      toast.error(result.error || 'Failed to mark as shipped');
    }
  };

  const handleDeliver = async () => {
    if (!salesOrder) return;

    setSaving(true);
    const result = await salesOrderService.markDelivered(salesOrder.id);
    setSaving(false);

    if (result.success) {
      toast.success('Order marked as delivered');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'sales_order.delivered',
        entityType: 'sales_order',
        entityId: salesOrder.id,
        after: { status: 'delivered' },
      }).catch(console.error);
      setShowDeliverConfirm(false);
      loadSalesOrder();
    } else {
      toast.error(result.error || 'Failed to mark as delivered');
    }
  };

  const handleDeleteLineItem = async (lineItemId: string) => {
    if (!confirm('Are you sure you want to delete this line item?')) return;

    const result = await salesOrderService.removeLineItem(lineItemId);
    if (result.success) {
      toast.success('Line item deleted');
      loadSalesOrder();
    } else {
      toast.error(result.error || 'Failed to delete line item');
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
        <p className="text-th-text-tertiary">Sales order not found</p>
        <Link to="/sales-orders" className="text-th-accent-600 hover:underline mt-2 inline-block">
          Back to sales orders
        </Link>
      </div>
    );
  }

  const statusColors = getStatusColor(salesOrder.status);
  const approvalColors = getApprovalStatusColor(salesOrder.approval_status);
  const isEditable = salesOrder.status === 'draft';
  const canSubmitForApproval =
    salesOrder.status === 'draft' && (salesOrder.line_items?.length || 0) > 0;
  const canApproveReject =
    salesOrder.status === 'pending_approval' && can('sales_orders.approve');
  const canConfirm = salesOrder.status === 'approved';
  const canShip = ['confirmed', 'processing'].includes(salesOrder.status);
  const canDeliver = ['shipped', 'partially_delivered'].includes(salesOrder.status);
  const lineItems = salesOrder.line_items || [];

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
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-th-text-primary">{salesOrder.name}</h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}
              >
                {formatStatusLabel(salesOrder.status)}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${approvalColors.bg} ${approvalColors.text}`}
              >
                {formatStatusLabel(salesOrder.approval_status)}
              </span>
            </div>
            <p className="text-th-text-tertiary text-sm mt-1">{salesOrder.so_number}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Submit for Approval */}
          {canSubmitForApproval && (
            <PermissionGate permission="sales_orders.write">
              <button
                onClick={() => setShowSubmitForApproval(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm font-medium text-yellow-700 hover:bg-yellow-100"
              >
                <Send className="w-4 h-4" />
                <span>Submit for Approval</span>
              </button>
            </PermissionGate>
          )}

          {/* Approve/Reject */}
          {canApproveReject && (
            <>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-100"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => setShowApproveConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve</span>
              </button>
            </>
          )}

          {/* Confirm Order */}
          {canConfirm && (
            <PermissionGate permission="sales_orders.write">
              <button
                onClick={() => setShowConfirmOrder(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Order</span>
              </button>
            </PermissionGate>
          )}

          {/* Mark Shipped */}
          {canShip && (
            <PermissionGate permission="sales_orders.write">
              <button
                onClick={() => setShowShipModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-cyan-50 border border-cyan-200 rounded-lg text-sm font-medium text-cyan-700 hover:bg-cyan-100"
              >
                <Truck className="w-4 h-4" />
                <span>Mark Shipped</span>
              </button>
            </PermissionGate>
          )}

          {/* Mark Delivered */}
          {canDeliver && (
            <PermissionGate permission="sales_orders.write">
              <button
                onClick={() => setShowDeliverConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <Package className="w-4 h-4" />
                <span>Mark Delivered</span>
              </button>
            </PermissionGate>
          )}

          {/* Edit */}
          {isEditable && (
            <PermissionGate permission="sales_orders.write">
              <button
                onClick={() => setShowEditSO(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </PermissionGate>
          )}
        </div>
      </div>

      {/* Order Total Banner */}
      <div className="bg-gradient-to-r from-th-accent-600 to-th-accent-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-th-accent-100 text-sm">Order Total</p>
            <p className="text-4xl font-bold mt-1">{formatCurrency(salesOrder.total)}</p>
          </div>
          <div className="text-right">
            <p className="text-th-accent-100 text-sm">
              Subtotal: {formatCurrency(salesOrder.subtotal)}
            </p>
            {salesOrder.discount_percent && (
              <p className="text-th-accent-100 text-sm">Discount: {salesOrder.discount_percent}%</p>
            )}
            {salesOrder.discount_amount && (
              <p className="text-th-accent-100 text-sm">
                Discount: {formatCurrency(salesOrder.discount_amount)}
              </p>
            )}
            {salesOrder.shipping_amount && (
              <p className="text-th-accent-100 text-sm">
                Shipping: {formatCurrency(salesOrder.shipping_amount)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Reason Banner */}
      {salesOrder.approval_status === 'rejected' && salesOrder.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-700">Order Rejected</h3>
              <p className="text-sm text-red-600 mt-1">{salesOrder.rejection_reason}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <div className="bg-surface-primary rounded-xl border border-th-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-th-border">
              <h2 className="text-lg font-semibold text-th-text-primary">Line Items</h2>
              {isEditable && (
                <PermissionGate permission="sales_orders.write">
                  <button
                    onClick={() => setShowAddLineItem(true)}
                    className="flex items-center gap-1 text-sm text-th-accent-600 hover:text-th-accent-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </PermissionGate>
              )}
            </div>

            {lineItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-th-text-tertiary">
                <FileText className="w-12 h-12 mb-3 opacity-50" />
                <p>No line items yet</p>
                {isEditable && (
                  <button
                    onClick={() => setShowAddLineItem(true)}
                    className="mt-3 text-sm text-th-accent-600 hover:underline"
                  >
                    Add your first item
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-secondary">
                      <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                        Item
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                        Shipped
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                        Delivered
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                        Total
                      </th>
                      {isEditable && <th className="w-20 px-4 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-th-border">
                    {lineItems.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-secondary">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-th-text-primary">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-th-text-tertiary mt-0.5">
                              {item.description}
                            </p>
                          )}
                          {item.sku && (
                            <p className="text-xs text-th-text-tertiary mt-0.5">SKU: {item.sku}</p>
                          )}
                          {item.product && (
                            <p className="text-xs text-th-accent-600 mt-0.5">
                              Product: {item.product.name}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-th-text-secondary">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-th-text-secondary">
                          {item.quantity_shipped}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-th-text-secondary">
                          {item.quantity_delivered}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-th-text-secondary">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-th-text-primary">
                          {formatCurrency(item.total)}
                        </td>
                        {isEditable && (
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => setShowEditLineItem(item)}
                                className="p-1 text-th-text-tertiary hover:text-th-accent-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteLineItem(item.id)}
                                className="p-1 text-th-text-tertiary hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-secondary">
                      <td
                        colSpan={isEditable ? 5 : 4}
                        className="px-6 py-3 text-right text-sm font-medium text-th-text-secondary"
                      >
                        Subtotal
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-th-text-primary">
                        {formatCurrency(salesOrder.subtotal)}
                      </td>
                      {isEditable && <td></td>}
                    </tr>
                    <tr className="bg-surface-secondary border-t border-th-border">
                      <td
                        colSpan={isEditable ? 5 : 4}
                        className="px-6 py-3 text-right text-sm font-bold text-th-text-primary"
                      >
                        Total
                      </td>
                      <td className="px-6 py-3 text-right text-lg font-bold text-th-accent-600">
                        {formatCurrency(salesOrder.total)}
                      </td>
                      {isEditable && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Shipping Info */}
          {(salesOrder.tracking_number ||
            salesOrder.carrier ||
            salesOrder.shipping_method) && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {salesOrder.shipping_method && (
                  <div>
                    <p className="text-sm text-th-text-tertiary">Shipping Method</p>
                    <p className="text-th-text-primary font-medium">
                      {salesOrder.shipping_method}
                    </p>
                  </div>
                )}
                {salesOrder.carrier && (
                  <div>
                    <p className="text-sm text-th-text-tertiary">Carrier</p>
                    <p className="text-th-text-primary font-medium">{salesOrder.carrier}</p>
                  </div>
                )}
                {salesOrder.tracking_number && (
                  <div>
                    <p className="text-sm text-th-text-tertiary">Tracking Number</p>
                    <p className="text-th-text-primary font-medium">
                      {salesOrder.tracking_number}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          {salesOrder.terms_and_conditions && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4">
                Terms & Conditions
              </h2>
              <p className="text-sm text-th-text-secondary whitespace-pre-wrap">
                {salesOrder.terms_and_conditions}
              </p>
            </div>
          )}

          {/* Notes */}
          {salesOrder.notes && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4">Internal Notes</h2>
              <p className="text-sm text-th-text-secondary whitespace-pre-wrap">
                {salesOrder.notes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Details */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Order Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-th-text-tertiary" />
                <div>
                  <p className="text-sm text-th-text-tertiary">Order Date</p>
                  <p className="text-th-text-primary">{formatDate(salesOrder.order_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-th-text-tertiary" />
                <div>
                  <p className="text-sm text-th-text-tertiary">Requested Date</p>
                  <p className="text-th-text-primary">{formatDate(salesOrder.requested_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-th-text-tertiary" />
                <div>
                  <p className="text-sm text-th-text-tertiary">Promised Date</p>
                  <p className="text-th-text-primary">{formatDate(salesOrder.promised_date)}</p>
                </div>
              </div>
              {salesOrder.shipped_date && (
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-cyan-500" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">Shipped Date</p>
                    <p className="text-th-text-primary">{formatDate(salesOrder.shipped_date)}</p>
                  </div>
                </div>
              )}
              {salesOrder.delivered_date && (
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">Delivered Date</p>
                    <p className="text-th-text-primary">{formatDate(salesOrder.delivered_date)}</p>
                  </div>
                </div>
              )}
              {salesOrder.payment_terms && (
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-th-text-tertiary" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">Payment Terms</p>
                    <p className="text-th-text-primary">{salesOrder.payment_terms}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-th-text-tertiary" />
                <div>
                  <p className="text-sm text-th-text-tertiary">Created</p>
                  <p className="text-th-text-primary">{formatDate(salesOrder.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Account</h2>
            {salesOrder.account ? (
              <Link
                to={`/accounts/${salesOrder.account.id}`}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-th-text-primary">{salesOrder.account.name}</span>
              </Link>
            ) : (
              <p className="text-th-text-tertiary">No account linked</p>
            )}
          </div>

          {/* Contact */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Contact</h2>
            {salesOrder.contact ? (
              <Link
                to={`/contacts/${salesOrder.contact.id}`}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary"
              >
                <div className="w-10 h-10 bg-th-accent-100 rounded-full flex items-center justify-center">
                  <span className="text-th-accent-700 font-medium">
                    {salesOrder.contact.first_name?.[0]}
                    {salesOrder.contact.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-th-text-primary">
                    {salesOrder.contact.first_name} {salesOrder.contact.last_name}
                  </p>
                  <p className="text-sm text-th-text-tertiary">{salesOrder.contact.email}</p>
                </div>
              </Link>
            ) : (
              <p className="text-th-text-tertiary">No contact linked</p>
            )}
          </div>

          {/* Deal */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Related Deal</h2>
            {salesOrder.deal ? (
              <Link
                to={`/deals/${salesOrder.deal.id}`}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-medium text-th-text-primary">{salesOrder.deal.name}</span>
              </Link>
            ) : (
              <p className="text-th-text-tertiary">No deal linked</p>
            )}
          </div>

          {/* Source Quote */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Source Quote</h2>
            {salesOrder.quote ? (
              <Link
                to={`/quotes/${salesOrder.quote.id}`}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <span className="font-medium text-th-text-primary">{salesOrder.quote.name}</span>
                  <p className="text-sm text-th-text-tertiary">{salesOrder.quote.quote_number}</p>
                </div>
              </Link>
            ) : (
              <p className="text-th-text-tertiary">Not created from quote</p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}

      {/* Submit for Approval Confirmation */}
      <Modal
        open={showSubmitForApproval}
        onClose={() => setShowSubmitForApproval(false)}
        title="Submit for Approval"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Submit this sales order for approval? You will not be able to edit the order while it
            is pending approval.
          </p>
          <div className="p-4 bg-surface-secondary rounded-lg">
            <p className="font-medium text-th-text-primary">{salesOrder.name}</p>
            <p className="text-2xl font-bold text-th-accent-600">
              {formatCurrency(salesOrder.total)}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowSubmitForApproval(false)}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitForApproval}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Approve Confirmation */}
      <Modal
        open={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        title="Approve Order"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Approve this sales order? The order will be ready for confirmation and fulfillment.
          </p>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="font-medium text-green-700">{salesOrder.name}</p>
            <p className="text-2xl font-bold text-green-800">
              {formatCurrency(salesOrder.total)}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowApproveConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Approving...' : 'Approve Order'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason('');
        }}
        title="Reject Order"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Please provide a reason for rejecting this order.
          </p>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Rejection Reason
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Invalid pricing, Inventory not available..."
              rows={3}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason('');
              }}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Rejecting...' : 'Reject Order'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Order Modal */}
      <Modal
        open={showConfirmOrder}
        onClose={() => setShowConfirmOrder(false)}
        title="Confirm Order"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Confirm this order and begin fulfillment? This action indicates the order has been
            accepted and is being processed.
          </p>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="font-medium text-indigo-700">{salesOrder.name}</p>
            <p className="text-2xl font-bold text-indigo-800">
              {formatCurrency(salesOrder.total)}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowConfirmOrder(false)}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Confirming...' : 'Confirm Order'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Ship Modal */}
      <Modal
        open={showShipModal}
        onClose={() => {
          setShowShipModal(false);
          setTrackingNumber('');
        }}
        title="Mark as Shipped"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Mark this order as shipped. Optionally add a tracking number.
          </p>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Tracking Number (Optional)
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowShipModal(false);
                setTrackingNumber('');
              }}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleShip}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Mark Shipped'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Deliver Confirmation */}
      <Modal
        open={showDeliverConfirm}
        onClose={() => setShowDeliverConfirm(false)}
        title="Mark as Delivered"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Mark this order as delivered? This indicates the customer has received their items.
          </p>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="font-medium text-green-700">{salesOrder.name}</p>
            <p className="text-2xl font-bold text-green-800">
              {formatCurrency(salesOrder.total)}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeliverConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleDeliver}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Mark Delivered'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Line Item Modal */}
      <LineItemModal
        open={showAddLineItem || showEditLineItem !== null}
        onClose={() => {
          setShowAddLineItem(false);
          setShowEditLineItem(null);
        }}
        salesOrderId={salesOrder.id}
        lineItem={showEditLineItem}
        onSuccess={() => {
          setShowAddLineItem(false);
          setShowEditLineItem(null);
          loadSalesOrder();
        }}
      />

      {/* Edit Sales Order Modal */}
      <EditSalesOrderModal
        open={showEditSO}
        onClose={() => setShowEditSO(false)}
        salesOrder={salesOrder}
        onSuccess={() => {
          setShowEditSO(false);
          loadSalesOrder();
        }}
      />
    </div>
  );
}

// Line Item Modal
interface LineItemModalProps {
  open: boolean;
  onClose: () => void;
  salesOrderId: string;
  lineItem: SOLineItem | null;
  onSuccess: () => void;
}

function LineItemModal({ open, onClose, salesOrderId, lineItem, onSuccess }: LineItemModalProps) {
  const { salesOrderService, productService } = useCRM();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('each');
  const [unitPrice, setUnitPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [taxRate, setTaxRate] = useState('');

  useEffect(() => {
    if (!open) return;

    productService.getProducts({}, 100, 0).then(({ products: prods }) => {
      setProducts(prods);
    });

    if (lineItem) {
      setProductId(lineItem.product_id || '');
      setName(lineItem.name);
      setDescription(lineItem.description || '');
      setSku(lineItem.sku || '');
      setQuantity(lineItem.quantity.toString());
      setUnit(lineItem.unit || 'each');
      setUnitPrice(lineItem.unit_price.toString());
      setDiscountPercent(lineItem.discount_percent?.toString() || '');
      setTaxRate(lineItem.tax_rate?.toString() || '');
    } else {
      setProductId('');
      setName('');
      setDescription('');
      setSku('');
      setQuantity('1');
      setUnit('each');
      setUnitPrice('');
      setDiscountPercent('');
      setTaxRate('');
    }
  }, [open, lineItem, productService]);

  const handleProductChange = (id: string) => {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setSku(product.code || '');
      setUnitPrice(product.unit_price?.toString() || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (!unitPrice || parseFloat(unitPrice) < 0) {
      toast.error('Unit price is required');
      return;
    }

    setLoading(true);

    const input: SOLineItemCreateInput = {
      product_id: productId || undefined,
      name: name.trim(),
      description: description || undefined,
      sku: sku || undefined,
      quantity: parseFloat(quantity),
      unit: unit || 'each',
      unit_price: parseFloat(unitPrice),
      discount_percent: discountPercent ? parseFloat(discountPercent) : undefined,
      tax_rate: taxRate ? parseFloat(taxRate) : undefined,
    };

    let result;
    if (lineItem) {
      result = await salesOrderService.updateLineItem(lineItem.id, input);
    } else {
      result = await salesOrderService.addLineItem(salesOrderId, input);
    }

    setLoading(false);

    if (result.success) {
      toast.success(lineItem ? 'Line item updated' : 'Line item added');
      onSuccess();
    } else {
      toast.error(result.error || 'Failed to save line item');
    }
  };

  // Calculate preview
  const qty = parseFloat(quantity) || 0;
  const price = parseFloat(unitPrice) || 0;
  const discount = parseFloat(discountPercent) || 0;
  const tax = parseFloat(taxRate) || 0;
  let subtotal = qty * price;
  if (discount > 0) {
    subtotal = subtotal * (1 - discount / 100);
  }
  const total = tax > 0 ? subtotal * (1 + tax / 100) : subtotal;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lineItem ? 'Edit Line Item' : 'Add Line Item'}
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Selector */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Product (Optional)
          </label>
          <select
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          >
            <option value="">Custom Item</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} {product.code ? `(${product.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Item Name */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter item name"
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

        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">SKU</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Enter SKU"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0.01"
              step="0.01"
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              required
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Unit</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="each"
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>

          {/* Unit Price */}
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Unit Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-th-text-tertiary">
                $
              </span>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full border border-th-border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Discount Percent */}
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Discount %
            </label>
            <div className="relative">
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
                className="w-full border border-th-border rounded-lg px-3 py-2 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-th-text-tertiary">
                %
              </span>
            </div>
          </div>

          {/* Tax Rate */}
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Tax Rate %
            </label>
            <div className="relative">
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full border border-th-border rounded-lg px-3 py-2 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-th-text-tertiary">
                %
              </span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-surface-secondary rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-th-text-tertiary">Subtotal:</span>
            <span className="text-th-text-secondary">${subtotal.toFixed(2)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-th-text-tertiary">Tax ({tax}%):</span>
              <span className="text-th-text-secondary">${(total - subtotal).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t border-th-border">
            <span className="text-th-text-primary">Total:</span>
            <span className="text-th-accent-600">${total.toFixed(2)}</span>
          </div>
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
            {loading ? 'Saving...' : lineItem ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Edit Sales Order Modal
interface EditSalesOrderModalProps {
  open: boolean;
  onClose: () => void;
  salesOrder: SalesOrderWithRelations;
  onSuccess: () => void;
}

function EditSalesOrderModal({
  open,
  onClose,
  salesOrder,
  onSuccess,
}: EditSalesOrderModalProps) {
  const { salesOrderService, accountService, contactService, dealService } = useCRM();
  const { activeOrgId } = useOrg();

  const [loading, setLoading] = useState(false);
  const [accountsList, setAccountsList] = useState<AccountWithRelations[]>([]);
  const [deals, setDeals] = useState<{ id: string; name: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: string; first_name: string; last_name: string }[]>([]);

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
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [shippingAmount, setShippingAmount] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;

    Promise.all([
      accountService.getAccounts({}, 100, 0),
      dealService.getDeals({}, 100, 0),
    ]).then(([accountsResult, dealsResult]) => {
      setAccountsList(accountsResult.accounts);
      setDeals(dealsResult.deals);
    });

    setName(salesOrder.name);
    setDescription(salesOrder.description || '');
    setAccountId(salesOrder.account_id || '');
    setDealId(salesOrder.deal_id || '');
    setContactId(salesOrder.contact_id || '');
    setOrderDate(salesOrder.order_date?.split('T')[0] || '');
    setRequestedDate(salesOrder.requested_date?.split('T')[0] || '');
    setPromisedDate(salesOrder.promised_date?.split('T')[0] || '');
    setShippingMethod(salesOrder.shipping_method || '');
    setPaymentTerms(salesOrder.payment_terms || '');
    setDiscountPercent(salesOrder.discount_percent?.toString() || '');
    setDiscountAmount(salesOrder.discount_amount?.toString() || '');
    setShippingAmount(salesOrder.shipping_amount?.toString() || '');
    setTerms(salesOrder.terms_and_conditions || '');
    setNotes(salesOrder.notes || '');
  }, [open, salesOrder, accountService, dealService]);

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

    const result = await salesOrderService.updateSalesOrder(salesOrder.id, {
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
      discount_percent: discountPercent ? parseFloat(discountPercent) : undefined,
      discount_amount: discountAmount ? parseFloat(discountAmount) : undefined,
      shipping_amount: shippingAmount ? parseFloat(shippingAmount) : undefined,
      terms_and_conditions: terms || undefined,
      notes: notes || undefined,
    });

    setLoading(false);

    if (result.success) {
      toast.success('Sales order updated');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'sales_order.updated',
        entityType: 'sales_order',
        entityId: salesOrder.id,
        before: { name: salesOrder.name },
        after: { name },
      }).catch(console.error);
      onSuccess();
    } else {
      toast.error(result.error || 'Failed to update sales order');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Sales Order" variant="slideOver" size="lg">
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

        {/* Discounts and Shipping */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Discount %
            </label>
            <input
              type="number"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              min="0"
              max="100"
              step="0.01"
              placeholder="0"
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Discount $
            </label>
            <input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0"
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Shipping $
            </label>
            <input
              type="number"
              value={shippingAmount}
              onChange={(e) => setShippingAmount(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0"
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
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
