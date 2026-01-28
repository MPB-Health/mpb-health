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
  DollarSign,
  FileText,
  Package,
  Clock,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { PermissionGate } from '../components/PermissionGate';
import { Modal } from '../components/Modal';
import { logAuditEvent } from '@mpbhealth/auth';
import type {
  PurchaseOrderWithRelations,
  POLineItem,
  POStatus,
  POApprovalStatus,
  POLineItemCreateInput,
  Product,
  VendorWithRelations,
} from '@mpbhealth/crm-core';

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

export default function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { purchaseOrderService, productService, vendorService } = useCRM();
  const { activeOrgId, can } = useOrg();

  const [po, setPO] = useState<PurchaseOrderWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals
  const [showEditPO, setShowEditPO] = useState(false);
  const [showAddLineItem, setShowAddLineItem] = useState(false);
  const [showEditLineItem, setShowEditLineItem] = useState<POLineItem | null>(null);
  const [showSubmitApproval, setShowSubmitApproval] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const loadPurchaseOrder = async () => {
    if (!id) return;

    setLoading(true);
    const poData = await purchaseOrderService.getPurchaseOrder(id);
    setPO(poData);
    setLoading(false);
  };

  useEffect(() => {
    loadPurchaseOrder();
  }, [id]);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: po?.currency || 'USD',
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
    if (!po) return;

    setSaving(true);
    const result = await purchaseOrderService.submitForApproval(po.id);
    setSaving(false);

    if (result.success) {
      toast.success('Purchase order submitted for approval');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'purchase_order.submitted',
        entityType: 'purchase_order',
        entityId: po.id,
        after: { status: 'pending_approval' },
      }).catch(console.error);
      setShowSubmitApproval(false);
      loadPurchaseOrder();
    } else {
      toast.error(result.error || 'Failed to submit for approval');
    }
  };

  const handleApprove = async () => {
    if (!po) return;

    setSaving(true);
    const result = await purchaseOrderService.approve(po.id);
    setSaving(false);

    if (result.success) {
      toast.success('Purchase order approved');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'purchase_order.approved',
        entityType: 'purchase_order',
        entityId: po.id,
        after: { status: 'approved', approval_status: 'approved' },
      }).catch(console.error);
      setShowApproveConfirm(false);
      loadPurchaseOrder();
    } else {
      toast.error(result.error || 'Failed to approve purchase order');
    }
  };

  const handleReject = async () => {
    if (!po) return;

    setSaving(true);
    const result = await purchaseOrderService.reject(po.id, rejectReason);
    setSaving(false);

    if (result.success) {
      toast.success('Purchase order rejected');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'purchase_order.rejected',
        entityType: 'purchase_order',
        entityId: po.id,
        after: { approval_status: 'rejected', rejection_reason: rejectReason },
      }).catch(console.error);
      setShowRejectModal(false);
      setRejectReason('');
      loadPurchaseOrder();
    } else {
      toast.error(result.error || 'Failed to reject purchase order');
    }
  };

  const handleSendPO = async () => {
    if (!po) return;

    setSaving(true);
    const result = await purchaseOrderService.send(po.id);
    setSaving(false);

    if (result.success) {
      toast.success('Purchase order sent to vendor');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'purchase_order.sent',
        entityType: 'purchase_order',
        entityId: po.id,
        after: { status: 'sent' },
      }).catch(console.error);
      setShowSendConfirm(false);
      loadPurchaseOrder();
    } else {
      toast.error(result.error || 'Failed to send purchase order');
    }
  };

  const handleMarkReceived = async () => {
    if (!po) return;

    setSaving(true);
    const result = await purchaseOrderService.markReceived(po.id);
    setSaving(false);

    if (result.success) {
      toast.success('Purchase order marked as received');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'purchase_order.received',
        entityType: 'purchase_order',
        entityId: po.id,
        after: { status: 'received' },
      }).catch(console.error);
      setShowReceiveModal(false);
      loadPurchaseOrder();
    } else {
      toast.error(result.error || 'Failed to mark as received');
    }
  };

  const handleDeleteLineItem = async (lineItemId: string) => {
    if (!confirm('Are you sure you want to delete this line item?')) return;

    const result = await purchaseOrderService.removeLineItem(lineItemId);
    if (result.success) {
      toast.success('Line item deleted');
      loadPurchaseOrder();
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

  if (!po) {
    return (
      <div className="text-center py-12">
        <p className="text-th-text-tertiary">Purchase order not found</p>
        <Link to="/purchase-orders" className="text-th-accent-600 hover:underline mt-2 inline-block">
          Back to purchase orders
        </Link>
      </div>
    );
  }

  const statusColors = getStatusColor(po.status);
  const approvalColors = getApprovalStatusColor(po.approval_status);
  const isEditable = po.status === 'draft';
  const canSubmitForApproval = po.status === 'draft' && (po.line_items?.length || 0) > 0;
  const canApproveReject = po.status === 'pending_approval' && can('purchase_orders.approve');
  const canSend = po.status === 'approved' || (po.status === 'draft' && po.approval_status === 'not_required');
  const canReceive = po.status === 'sent' || po.status === 'acknowledged' || po.status === 'partially_received';
  const lineItems = po.line_items || [];

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
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-th-text-primary">{po.name}</h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColors.bg} ${statusColors.text}`}
              >
                {po.status.replace(/_/g, ' ')}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${approvalColors.bg} ${approvalColors.text}`}
              >
                {po.approval_status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-th-text-tertiary text-sm mt-1">{po.po_number}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Mark Received */}
          {canReceive && (
            <PermissionGate permission="purchase_orders.write">
              <button
                onClick={() => setShowReceiveModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <Package className="w-4 h-4" />
                <span>Mark Received</span>
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

          {/* Send to Vendor */}
          {canSend && (
            <PermissionGate permission="purchase_orders.write">
              <button
                onClick={() => setShowSendConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
              >
                <Send className="w-4 h-4" />
                <span>Send to Vendor</span>
              </button>
            </PermissionGate>
          )}

          {/* Submit for Approval */}
          {canSubmitForApproval && (
            <PermissionGate permission="purchase_orders.write">
              <button
                onClick={() => setShowSubmitApproval(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm font-medium text-yellow-700 hover:bg-yellow-100"
              >
                <Clock className="w-4 h-4" />
                <span>Submit for Approval</span>
              </button>
            </PermissionGate>
          )}

          {/* Edit */}
          {isEditable && (
            <PermissionGate permission="purchase_orders.write">
              <button
                onClick={() => setShowEditPO(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </PermissionGate>
          )}
        </div>
      </div>

      {/* Rejection Warning */}
      {po.approval_status === 'rejected' && po.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-700">Approval Rejected</p>
            <p className="text-sm text-red-600 mt-1">{po.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* PO Total Banner */}
      <div className="bg-gradient-to-r from-th-accent-600 to-th-accent-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-th-accent-100 text-sm">Purchase Order Total</p>
            <p className="text-4xl font-bold mt-1">{formatCurrency(po.total)}</p>
          </div>
          <div className="text-right">
            <p className="text-th-accent-100 text-sm">Subtotal: {formatCurrency(po.subtotal)}</p>
            {po.discount_percent && (
              <p className="text-th-accent-100 text-sm">Discount: {po.discount_percent}%</p>
            )}
            {po.discount_amount && (
              <p className="text-th-accent-100 text-sm">
                Discount: {formatCurrency(po.discount_amount)}
              </p>
            )}
            {po.tax_amount && (
              <p className="text-th-accent-100 text-sm">Tax: {formatCurrency(po.tax_amount)}</p>
            )}
            {po.shipping_amount && (
              <p className="text-th-accent-100 text-sm">
                Shipping: {formatCurrency(po.shipping_amount)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <div className="bg-surface-primary rounded-xl border border-th-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-th-border">
              <h2 className="text-lg font-semibold text-th-text-primary">Line Items</h2>
              {isEditable && (
                <PermissionGate permission="purchase_orders.write">
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
                        Received
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                        Tax
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                        Total
                      </th>
                      {isEditable && <th className="w-20 px-4 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-th-border">
                    {lineItems.map((item: POLineItem) => (
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
                        <td className="px-4 py-4 text-right">
                          <span
                            className={`text-sm ${
                              item.quantity_received >= item.quantity
                                ? 'text-green-600 font-medium'
                                : item.quantity_received > 0
                                ? 'text-orange-600'
                                : 'text-th-text-secondary'
                            }`}
                          >
                            {item.quantity_received}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-th-text-secondary">
                          {formatCurrency(item.unit_cost)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-th-text-secondary">
                          {item.tax_rate ? `${item.tax_rate}%` : '-'}
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
                        {formatCurrency(po.subtotal)}
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
                        {formatCurrency(po.total)}
                      </td>
                      {isEditable && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          {po.terms_and_conditions && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4">
                Terms & Conditions
              </h2>
              <p className="text-sm text-th-text-secondary whitespace-pre-wrap">
                {po.terms_and_conditions}
              </p>
            </div>
          )}

          {/* Notes */}
          {po.notes && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4">Internal Notes</h2>
              <p className="text-sm text-th-text-secondary whitespace-pre-wrap">{po.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* PO Details */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">PO Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-th-text-tertiary" />
                <div>
                  <p className="text-sm text-th-text-tertiary">Order Date</p>
                  <p className="text-th-text-primary">{formatDate(po.order_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-th-text-tertiary" />
                <div>
                  <p className="text-sm text-th-text-tertiary">Expected Delivery</p>
                  <p className="text-th-text-primary">{formatDate(po.expected_date)}</p>
                </div>
              </div>
              {po.received_date && (
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">Received Date</p>
                    <p className="text-th-text-primary">{formatDate(po.received_date)}</p>
                  </div>
                </div>
              )}
              {po.sent_at && (
                <div className="flex items-center gap-3">
                  <Send className="w-4 h-4 text-th-text-tertiary" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">Sent</p>
                    <p className="text-th-text-primary">{formatDate(po.sent_at)}</p>
                  </div>
                </div>
              )}
              {po.approved_at && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">Approved</p>
                    <p className="text-th-text-primary">{formatDate(po.approved_at)}</p>
                  </div>
                </div>
              )}
              {po.payment_terms && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-th-text-tertiary" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">Payment Terms</p>
                    <p className="text-th-text-primary">{po.payment_terms}</p>
                  </div>
                </div>
              )}
              {po.shipping_method && (
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-th-text-tertiary" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">Shipping Method</p>
                    <p className="text-th-text-primary">{po.shipping_method}</p>
                  </div>
                </div>
              )}
              {po.tracking_number && (
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-th-text-tertiary" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">Tracking Number</p>
                    <p className="text-th-text-primary font-mono">{po.tracking_number}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-th-text-tertiary" />
                <div>
                  <p className="text-sm text-th-text-tertiary">Created</p>
                  <p className="text-th-text-primary">{formatDate(po.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vendor */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Vendor</h2>
            {po.vendor ? (
              <Link
                to={`/vendors/${po.vendor.id}`}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span className="font-medium text-th-text-primary">{po.vendor.name}</span>
                  {po.vendor.email && (
                    <p className="text-sm text-th-text-tertiary">{po.vendor.email}</p>
                  )}
                </div>
              </Link>
            ) : (
              <p className="text-th-text-tertiary">No vendor linked</p>
            )}
          </div>

          {/* Ship To Address */}
          {po.ship_to_address && Object.keys(po.ship_to_address).length > 0 && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4">Ship To</h2>
              <div className="text-sm text-th-text-secondary">
                {(po.ship_to_address as Record<string, string>).street && (
                  <p>{(po.ship_to_address as Record<string, string>).street}</p>
                )}
                {((po.ship_to_address as Record<string, string>).city ||
                  (po.ship_to_address as Record<string, string>).state ||
                  (po.ship_to_address as Record<string, string>).zip) && (
                  <p>
                    {(po.ship_to_address as Record<string, string>).city}
                    {(po.ship_to_address as Record<string, string>).state &&
                      `, ${(po.ship_to_address as Record<string, string>).state}`}{' '}
                    {(po.ship_to_address as Record<string, string>).zip}
                  </p>
                )}
                {(po.ship_to_address as Record<string, string>).country && (
                  <p>{(po.ship_to_address as Record<string, string>).country}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}

      {/* Submit for Approval Confirmation */}
      <Modal
        open={showSubmitApproval}
        onClose={() => setShowSubmitApproval(false)}
        title="Submit for Approval"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Submit this purchase order for approval? Once submitted, you won't be able to edit it
            until it's approved or rejected.
          </p>
          <div className="p-4 bg-surface-secondary rounded-lg">
            <p className="font-medium text-th-text-primary">{po.name}</p>
            <p className="text-2xl font-bold text-th-accent-600">{formatCurrency(po.total)}</p>
            <p className="text-sm text-th-text-tertiary mt-1">{lineItems.length} line items</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowSubmitApproval(false)}
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
        title="Approve Purchase Order"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Approve this purchase order? Once approved, it can be sent to the vendor.
          </p>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="font-medium text-green-700">{po.name}</p>
            <p className="text-2xl font-bold text-green-800">{formatCurrency(po.total)}</p>
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
              {saving ? 'Approving...' : 'Approve'}
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
        title="Reject Purchase Order"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Please provide a reason for rejecting this purchase order.
          </p>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Rejection Reason
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Budget exceeded, Wrong vendor, etc."
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
              disabled={saving || !rejectReason.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Send Confirmation */}
      <Modal
        open={showSendConfirm}
        onClose={() => setShowSendConfirm(false)}
        title="Send to Vendor"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Send this purchase order to the vendor? This will mark the PO as sent.
          </p>
          <div className="p-4 bg-surface-secondary rounded-lg">
            <p className="font-medium text-th-text-primary">{po.name}</p>
            <p className="text-2xl font-bold text-th-accent-600">{formatCurrency(po.total)}</p>
            {po.vendor && (
              <p className="text-sm text-th-text-tertiary mt-1">To: {po.vendor.name}</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowSendConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSendPO}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 hover:bg-th-accent-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Sending...' : 'Send to Vendor'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Receive Confirmation */}
      <Modal
        open={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title="Mark as Received"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Mark this purchase order as fully received? This will update the status to "Received".
          </p>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="font-medium text-green-700">{po.name}</p>
            <p className="text-sm text-green-600 mt-1">{lineItems.length} line items</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowReceiveModal(false)}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkReceived}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Mark Received'}
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
        purchaseOrderId={po.id}
        lineItem={showEditLineItem}
        onSuccess={() => {
          setShowAddLineItem(false);
          setShowEditLineItem(null);
          loadPurchaseOrder();
        }}
      />

      {/* Edit PO Modal */}
      <EditPurchaseOrderModal
        open={showEditPO}
        onClose={() => setShowEditPO(false)}
        purchaseOrder={po}
        onSuccess={() => {
          setShowEditPO(false);
          loadPurchaseOrder();
        }}
      />
    </div>
  );
}

// Line Item Modal
interface LineItemModalProps {
  open: boolean;
  onClose: () => void;
  purchaseOrderId: string;
  lineItem: POLineItem | null;
  onSuccess: () => void;
}

function LineItemModal({
  open,
  onClose,
  purchaseOrderId,
  lineItem,
  onSuccess,
}: LineItemModalProps) {
  const { purchaseOrderService, productService } = useCRM();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('each');
  const [unitCost, setUnitCost] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [taxRate, setTaxRate] = useState('');

  useEffect(() => {
    if (!open) return;

    productService.getProducts({}, 100, 0).then(({ products: p }: { products: Product[] }) => {
      setProducts(p);
    });

    if (lineItem) {
      setProductId(lineItem.product_id || '');
      setName(lineItem.name);
      setDescription(lineItem.description || '');
      setSku(lineItem.sku || '');
      setQuantity(lineItem.quantity.toString());
      setUnit(lineItem.unit || 'each');
      setUnitCost(lineItem.unit_cost.toString());
      setDiscountPercent(lineItem.discount_percent?.toString() || '');
      setTaxRate(lineItem.tax_rate?.toString() || '');
    } else {
      setProductId('');
      setName('');
      setDescription('');
      setSku('');
      setQuantity('1');
      setUnit('each');
      setUnitCost('');
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
      setUnitCost(product.unit_price?.toString() || '');
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
    if (!unitCost || parseFloat(unitCost) < 0) {
      toast.error('Unit cost is required');
      return;
    }

    setLoading(true);

    const input: POLineItemCreateInput = {
      product_id: productId || undefined,
      name: name.trim(),
      description: description || undefined,
      sku: sku || undefined,
      quantity: parseFloat(quantity),
      unit: unit || 'each',
      unit_cost: parseFloat(unitCost),
      discount_percent: discountPercent ? parseFloat(discountPercent) : undefined,
      tax_rate: taxRate ? parseFloat(taxRate) : undefined,
    };

    let result;
    if (lineItem) {
      result = await purchaseOrderService.updateLineItem(lineItem.id, input);
    } else {
      result = await purchaseOrderService.addLineItem(purchaseOrderId, input);
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
  const cost = parseFloat(unitCost) || 0;
  const discount = parseFloat(discountPercent) || 0;
  const tax = parseFloat(taxRate) || 0;
  let subtotal = qty * cost;
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
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="each">Each</option>
              <option value="box">Box</option>
              <option value="case">Case</option>
              <option value="pallet">Pallet</option>
              <option value="kg">Kilogram</option>
              <option value="lb">Pound</option>
              <option value="liter">Liter</option>
              <option value="gallon">Gallon</option>
            </select>
          </div>

          {/* Unit Cost */}
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Unit Cost <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-th-text-tertiary">
                $
              </span>
              <input
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
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

// Edit Purchase Order Modal
interface EditPurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrderWithRelations;
  onSuccess: () => void;
}

function EditPurchaseOrderModal({
  open,
  onClose,
  purchaseOrder,
  onSuccess,
}: EditPurchaseOrderModalProps) {
  const { purchaseOrderService, vendorService } = useCRM();
  const { activeOrgId } = useOrg();

  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<VendorWithRelations[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [shippingAmount, setShippingAmount] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;

    vendorService.getVendors({}, 100, 0).then(({ vendors: v }: { vendors: VendorWithRelations[] }) => {
      setVendors(v);
    });

    setName(purchaseOrder.name);
    setDescription(purchaseOrder.description || '');
    setVendorId(purchaseOrder.vendor_id);
    setOrderDate(purchaseOrder.order_date?.split('T')[0] || '');
    setExpectedDate(purchaseOrder.expected_date?.split('T')[0] || '');
    setPaymentTerms(purchaseOrder.payment_terms || '');
    setShippingMethod(purchaseOrder.shipping_method || '');
    setTrackingNumber(purchaseOrder.tracking_number || '');
    setDiscountPercent(purchaseOrder.discount_percent?.toString() || '');
    setDiscountAmount(purchaseOrder.discount_amount?.toString() || '');
    setShippingAmount(purchaseOrder.shipping_amount?.toString() || '');
    setTerms(purchaseOrder.terms_and_conditions || '');
    setNotes(purchaseOrder.notes || '');
  }, [open, purchaseOrder, vendorService]);

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

    const result = await purchaseOrderService.updatePurchaseOrder(purchaseOrder.id, {
      name: name.trim(),
      description: description || undefined,
      vendor_id: vendorId,
      order_date: orderDate || undefined,
      expected_date: expectedDate || undefined,
      payment_terms: paymentTerms || undefined,
      shipping_method: shippingMethod || undefined,
      tracking_number: trackingNumber || undefined,
      discount_percent: discountPercent ? parseFloat(discountPercent) : undefined,
      discount_amount: discountAmount ? parseFloat(discountAmount) : undefined,
      shipping_amount: shippingAmount ? parseFloat(shippingAmount) : undefined,
      terms_and_conditions: terms || undefined,
      notes: notes || undefined,
    });

    setLoading(false);

    if (result.success) {
      toast.success('Purchase order updated');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'purchase_order.updated',
        entityType: 'purchase_order',
        entityId: purchaseOrder.id,
        before: { name: purchaseOrder.name },
        after: { name },
      }).catch(console.error);
      onSuccess();
    } else {
      toast.error(result.error || 'Failed to update purchase order');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Purchase Order"
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

        {/* Tracking Number */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Tracking Number
          </label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
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
