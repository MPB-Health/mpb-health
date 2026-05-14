import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Send,
  CheckCircle,
  XCircle,
  Copy,
  Receipt,
  Plus,
  Trash2,
  Building2,
  User,
  Calendar,
  DollarSign,
  FileText,
  Briefcase,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { PermissionGate } from '../components/PermissionGate';
import { Modal } from '../components/Modal';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type {
  QuoteWithRelations,
  QuoteLineItem,
  QuoteStatus,
  QuoteLineItemCreateInput,
  Product,
} from '@mpbhealth/crm-core';

function getStatusColor(status: QuoteStatus): { bg: string; text: string } {
  switch (status) {
    case 'draft':
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
    case 'pending':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    case 'sent':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'accepted':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'rejected':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    case 'expired':
      return { bg: 'bg-orange-100', text: 'text-orange-700' };
    case 'revised':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quoteService, invoiceService, productService } = useCRM();
  const { activeOrgId } = useOrg();

  const [quote, setQuote] = useState<QuoteWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals
  const [showEditQuote, setShowEditQuote] = useState(false);
  const [showAddLineItem, setShowAddLineItem] = useState(false);
  const [showEditLineItem, setShowEditLineItem] = useState<QuoteLineItem | null>(null);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCloneConfirm, setShowCloneConfirm] = useState(false);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const loadQuote = async () => {
    if (!id) return;

    setLoading(true);
    const quoteData = await quoteService.getQuote(id);
    setQuote(quoteData);
    setLoading(false);
  };

  useEffect(() => {
    loadQuote();
  }, [id]);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: quote?.currency || 'USD',
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

  const handleSendQuote = async () => {
    if (!quote) return;

    setSaving(true);
    const result = await quoteService.sendQuote(quote.id);
    setSaving(false);

    if (result.success) {
      toast.success('Quote sent successfully');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.QUOTE_SENT || 'quote.sent',
        entityType: 'quote',
        entityId: quote.id,
        after: { status: 'sent' },
      }).catch(console.error);
      setShowSendConfirm(false);
      loadQuote();
    } else {
      toast.error(result.error || 'Failed to send quote');
    }
  };

  const handleAcceptQuote = async () => {
    if (!quote) return;

    setSaving(true);
    const result = await quoteService.markAccepted(quote.id);
    setSaving(false);

    if (result.success) {
      toast.success('Quote marked as accepted');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.QUOTE_ACCEPTED || 'quote.accepted',
        entityType: 'quote',
        entityId: quote.id,
        after: { status: 'accepted' },
      }).catch(console.error);
      setShowAcceptConfirm(false);
      loadQuote();
    } else {
      toast.error(result.error || 'Failed to accept quote');
    }
  };

  const handleRejectQuote = async () => {
    if (!quote) return;

    setSaving(true);
    const result = await quoteService.markRejected(quote.id, rejectReason);
    setSaving(false);

    if (result.success) {
      toast.success('Quote marked as rejected');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.QUOTE_REJECTED || 'quote.rejected',
        entityType: 'quote',
        entityId: quote.id,
        after: { status: 'rejected', rejection_reason: rejectReason },
      }).catch(console.error);
      setShowRejectModal(false);
      setRejectReason('');
      loadQuote();
    } else {
      toast.error(result.error || 'Failed to reject quote');
    }
  };

  const handleCloneQuote = async () => {
    if (!quote) return;

    setSaving(true);
    const result = await quoteService.cloneQuote(quote.id);
    setSaving(false);

    if (result.success && result.quoteId) {
      toast.success('Quote cloned successfully');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.QUOTE_CLONED || 'quote.cloned',
        entityType: 'quote',
        entityId: result.quoteId,
        before: { source_quote_id: quote.id },
      }).catch(console.error);
      setShowCloneConfirm(false);
      navigate(`/quotes/${result.quoteId}`);
    } else {
      toast.error(result.error || 'Failed to clone quote');
    }
  };

  const handleConvertToInvoice = async () => {
    if (!quote) return;

    setSaving(true);
    const result = await invoiceService.createFromQuote(quote.id);
    setSaving(false);

    if (result.success && result.invoiceId) {
      toast.success('Invoice created from quote');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.INVOICE_CREATED || 'invoice.created',
        entityType: 'invoice',
        entityId: result.invoiceId,
        before: { source_quote_id: quote.id },
      }).catch(console.error);
      setShowConvertConfirm(false);
      navigate(`/invoices/${result.invoiceId}`);
    } else {
      toast.error(result.error || 'Failed to create invoice');
    }
  };

  const handleDeleteLineItem = async (lineItemId: string) => {
    if (!confirm('Are you sure you want to delete this line item?')) return;

    const result = await quoteService.removeLineItem(lineItemId);
    if (result.success) {
      toast.success('Line item deleted');
      loadQuote();
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

  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-th-text-tertiary">Quote not found</p>
        <Link to="/quotes/legacy" className="text-th-accent-600 hover:underline mt-2 inline-block">
          Back to quotes
        </Link>
      </div>
    );
  }

  const statusColors = getStatusColor(quote.status);
  const isEditable = quote.status === 'draft' || quote.status === 'revised';
  const canSend = quote.status === 'draft' || quote.status === 'revised';
  const canAcceptReject = quote.status === 'sent' || quote.status === 'pending';
  const canConvert = quote.status === 'accepted';
  const lineItems = quote.line_items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/quotes/legacy')}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-th-text-primary">{quote.name}</h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColors.bg} ${statusColors.text}`}
              >
                {quote.status}
              </span>
            </div>
            <p className="text-th-text-tertiary text-sm mt-1">{quote.quote_number}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Clone */}
          <button
            onClick={() => setShowCloneConfirm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
          >
            <Copy className="w-4 h-4" />
            <span>Clone</span>
          </button>

          {/* Print */}
          <button
            onClick={() => window.open(`/quotes/${id}/print`, '_blank')}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>

          {/* Convert to Invoice */}
          {canConvert && (
            <PermissionGate permission="invoices.write">
              <button
                onClick={() => setShowConvertConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <Receipt className="w-4 h-4" />
                <span>Convert to Invoice</span>
              </button>
            </PermissionGate>
          )}

          {/* Accept/Reject */}
          {canAcceptReject && (
            <PermissionGate permission="quotes.write">
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-100"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => setShowAcceptConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Accept</span>
              </button>
            </PermissionGate>
          )}

          {/* Send */}
          {canSend && (
            <PermissionGate permission="quotes.write">
              <button
                onClick={() => setShowSendConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
              >
                <Send className="w-4 h-4" />
                <span>Send Quote</span>
              </button>
            </PermissionGate>
          )}

          {/* Edit */}
          {isEditable && (
            <PermissionGate permission="quotes.write">
              <button
                onClick={() => setShowEditQuote(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </PermissionGate>
          )}
        </div>
      </div>

      {/* Quote Total Banner */}
      <div className="bg-gradient-to-r from-th-accent-600 to-th-accent-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-th-accent-100 text-sm">Quote Total</p>
            <p className="text-4xl font-bold mt-1">{formatCurrency(quote.total)}</p>
          </div>
          <div className="text-right">
            <p className="text-th-accent-100 text-sm">Subtotal: {formatCurrency(quote.subtotal)}</p>
            {quote.discount_percent && (
              <p className="text-th-accent-100 text-sm">Discount: {quote.discount_percent}%</p>
            )}
            {quote.discount_amount && (
              <p className="text-th-accent-100 text-sm">Discount: {formatCurrency(quote.discount_amount)}</p>
            )}
            {quote.shipping_amount && (
              <p className="text-th-accent-100 text-sm">Shipping: {formatCurrency(quote.shipping_amount)}</p>
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
                <PermissionGate permission="quotes.write">
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
                        Unit Price
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                        Discount
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
                    {lineItems.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-secondary">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-th-text-primary">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-th-text-tertiary mt-0.5">{item.description}</p>
                          )}
                          {item.product && (
                            <p className="text-xs text-th-accent-600 mt-0.5">
                              Product: {item.product.name}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-th-text-secondary">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-th-text-secondary">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-th-text-secondary">
                          {item.discount_percent
                            ? `${item.discount_percent}%`
                            : item.discount_amount
                            ? formatCurrency(item.discount_amount)
                            : '-'}
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
                        {formatCurrency(quote.subtotal)}
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
                        {formatCurrency(quote.total)}
                      </td>
                      {isEditable && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          {quote.terms_and_conditions && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4">Terms & Conditions</h2>
              <p className="text-sm text-th-text-secondary whitespace-pre-wrap">
                {quote.terms_and_conditions}
              </p>
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4">Internal Notes</h2>
              <p className="text-sm text-th-text-secondary whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          {/* Rejection Reason */}
          {quote.status === 'rejected' && quote.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-red-700 mb-2">Rejection Reason</h2>
              <p className="text-sm text-red-600">{quote.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quote Details */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Quote Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-th-text-tertiary" />
                <div>
                  <p className="text-sm text-th-text-tertiary">Valid Until</p>
                  <p className="text-th-text-primary">{formatDate(quote.valid_until)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-th-text-tertiary" />
                <div>
                  <p className="text-sm text-th-text-tertiary">Created</p>
                  <p className="text-th-text-primary">{formatDate(quote.created_at)}</p>
                </div>
              </div>
              {quote.sent_at && (
                <div className="flex items-center gap-3">
                  <Send className="w-4 h-4 text-th-text-tertiary" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">Sent</p>
                    <p className="text-th-text-primary">{formatDate(quote.sent_at)}</p>
                  </div>
                </div>
              )}
              {quote.accepted_at && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">Accepted</p>
                    <p className="text-th-text-primary">{formatDate(quote.accepted_at)}</p>
                  </div>
                </div>
              )}
              {quote.rejected_at && (
                <div className="flex items-center gap-3">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-sm text-th-text-tertiary">Rejected</p>
                    <p className="text-th-text-primary">{formatDate(quote.rejected_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Account</h2>
            {quote.account ? (
              <Link
                to={`/accounts/${quote.account.id}`}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-th-text-primary">{quote.account.name}</span>
              </Link>
            ) : (
              <p className="text-th-text-tertiary">No account linked</p>
            )}
          </div>

          {/* Contact */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Contact</h2>
            {quote.contact ? (
              <Link
                to={`/members/${quote.contact.id}`}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary"
              >
                <div className="w-10 h-10 bg-th-accent-100 rounded-full flex items-center justify-center">
                  <span className="text-th-accent-700 font-medium">
                    {quote.contact.first_name?.[0]}
                    {quote.contact.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-th-text-primary">
                    {quote.contact.first_name} {quote.contact.last_name}
                  </p>
                  <p className="text-sm text-th-text-tertiary">{quote.contact.email}</p>
                </div>
              </Link>
            ) : (
              <p className="text-th-text-tertiary">No contact linked</p>
            )}
          </div>

          {/* Deal */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Related Deal</h2>
            {quote.deal ? (
              <Link
                to={`/deals/${quote.deal.id}`}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-th-text-primary">{quote.deal.name}</span>
              </Link>
            ) : (
              <p className="text-th-text-tertiary">No deal linked</p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}

      {/* Send Confirmation */}
      <Modal
        open={showSendConfirm}
        onClose={() => setShowSendConfirm(false)}
        title="Send Quote"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Are you sure you want to send this quote to the customer?
          </p>
          <div className="p-4 bg-surface-secondary rounded-lg">
            <p className="font-medium text-th-text-primary">{quote.name}</p>
            <p className="text-2xl font-bold text-th-accent-600">{formatCurrency(quote.total)}</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowSendConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSendQuote}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 hover:bg-th-accent-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Sending...' : 'Send Quote'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Accept Confirmation */}
      <Modal
        open={showAcceptConfirm}
        onClose={() => setShowAcceptConfirm(false)}
        title="Accept Quote"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Mark this quote as accepted by the customer?
          </p>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="font-medium text-green-700">{quote.name}</p>
            <p className="text-2xl font-bold text-green-800">{formatCurrency(quote.total)}</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowAcceptConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleAcceptQuote}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Accepting...' : 'Accept Quote'}
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
        title="Reject Quote"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Please provide a reason for rejecting this quote.
          </p>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Rejection Reason
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Price too high, Requirements changed..."
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
              onClick={handleRejectQuote}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Rejecting...' : 'Reject Quote'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Clone Confirmation */}
      <Modal
        open={showCloneConfirm}
        onClose={() => setShowCloneConfirm(false)}
        title="Clone Quote"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            This will create a copy of the quote with all line items. The new quote will be in draft status.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCloneConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCloneQuote}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 hover:bg-th-accent-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Cloning...' : 'Clone Quote'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Convert to Invoice Confirmation */}
      <Modal
        open={showConvertConfirm}
        onClose={() => setShowConvertConfirm(false)}
        title="Convert to Invoice"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            This will create a new invoice from this quote with all line items copied over. The invoice will be in draft status.
          </p>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="font-medium text-green-700">{quote.name}</p>
            <p className="text-2xl font-bold text-green-800">{formatCurrency(quote.total)}</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowConvertConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleConvertToInvoice}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Creating Invoice...' : 'Create Invoice'}
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
        quoteId={quote.id}
        lineItem={showEditLineItem}
        onSuccess={() => {
          setShowAddLineItem(false);
          setShowEditLineItem(null);
          loadQuote();
        }}
      />

      {/* Edit Quote Modal */}
      <EditQuoteModal
        open={showEditQuote}
        onClose={() => setShowEditQuote(false)}
        quote={quote}
        onSuccess={() => {
          setShowEditQuote(false);
          loadQuote();
        }}
      />
    </div>
  );
}

// Line Item Modal
interface LineItemModalProps {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  lineItem: QuoteLineItem | null;
  onSuccess: () => void;
}

function LineItemModal({ open, onClose, quoteId, lineItem, onSuccess }: LineItemModalProps) {
  const { quoteService, productService, productFormService } = useCRM();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [configFields, setConfigFields] = useState<any[]>([]);
  const [configAnswers, setConfigAnswers] = useState<Record<string, unknown>>({});

  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [taxRate, setTaxRate] = useState('');

  useEffect(() => {
    if (!open) return;

    productService.getProducts({}, 100, 0).then(({ products }) => {
      setProducts(products);
    });

    if (lineItem) {
      setProductId(lineItem.product_id || '');
      setName(lineItem.name);
      setDescription(lineItem.description || '');
      setQuantity(lineItem.quantity.toString());
      setUnitPrice(lineItem.unit_price.toString());
      setDiscountPercent(lineItem.discount_percent?.toString() || '');
      setTaxRate(lineItem.tax_rate?.toString() || '');

      if (lineItem.product_id) {
        productFormService.getProductFields(lineItem.product_id).then(setConfigFields);
        productFormService.getLineItemAnswers(lineItem.id).then((answers) => {
          const map: Record<string, unknown> = {};
          answers.forEach((a) => { map[a.field_id] = a.value; });
          setConfigAnswers(map);
        });
      }
    } else {
      setProductId('');
      setName('');
      setDescription('');
      setQuantity('1');
      setUnitPrice('');
      setDiscountPercent('');
      setTaxRate('');
      setConfigFields([]);
      setConfigAnswers({});
    }
  }, [open, lineItem, productService, productFormService]);

  const handleProductChange = (id: string) => {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setUnitPrice(product.unit_price?.toString() || '');
    }
    if (id) {
      productFormService.getProductFields(id).then(setConfigFields);
    } else {
      setConfigFields([]);
    }
    setConfigAnswers({});
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

    const missingRequired = configFields.filter(
      (f) => f.required && !configAnswers[f.id]
    );
    if (missingRequired.length > 0) {
      toast.error(`Please fill in: ${missingRequired.map((f) => f.label).join(', ')}`);
      return;
    }

    setLoading(true);

    const input: QuoteLineItemCreateInput = {
      product_id: productId || undefined,
      name: name.trim(),
      description: description || undefined,
      quantity: parseFloat(quantity),
      unit_price: parseFloat(unitPrice),
      discount_percent: discountPercent ? parseFloat(discountPercent) : undefined,
      tax_rate: taxRate ? parseFloat(taxRate) : undefined,
    };

    let result: { success: boolean; lineItemId?: string; error?: string };
    if (lineItem) {
      result = await quoteService.updateLineItem(lineItem.id, input);
    } else {
      result = await quoteService.addLineItem(quoteId, input);
    }

    if (result.success && configFields.length > 0) {
      const resolvedLineItemId = lineItem?.id || result.lineItemId;
      if (resolvedLineItemId) {
        const answers = Object.entries(configAnswers)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([field_id, value]) => ({ field_id, value }));
        if (answers.length > 0) {
          await productFormService.saveLineItemAnswers(
            resolvedLineItemId,
            answers
          );
        }
      }
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

        {/* Product Configuration Fields */}
        {configFields.length > 0 && (
          <div className="border border-th-border rounded-lg p-4 space-y-4">
            <p className="text-sm font-medium text-th-text-primary">Product Configuration</p>
            {configFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {(field.field_type === 'text' || field.field_type === 'email' || field.field_type === 'phone') && (
                  <input
                    type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : 'text'}
                    value={(configAnswers[field.id] as string) || ''}
                    onChange={(e) => setConfigAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                    placeholder={field.placeholder || ''}
                    className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                )}
                {field.field_type === 'number' && (
                  <input
                    type="number"
                    value={(configAnswers[field.id] as string) || ''}
                    onChange={(e) => setConfigAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                    placeholder={field.placeholder || ''}
                    className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                )}
                {field.field_type === 'textarea' && (
                  <textarea
                    value={(configAnswers[field.id] as string) || ''}
                    onChange={(e) => setConfigAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                    placeholder={field.placeholder || ''}
                    rows={2}
                    className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                )}
                {field.field_type === 'select' && (
                  <select
                    value={(configAnswers[field.id] as string) || ''}
                    onChange={(e) => setConfigAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                    className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  >
                    <option value="">Select...</option>
                    {(field.options || []).map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {field.field_type === 'radio' && (
                  <div className="space-y-1">
                    {(field.options || []).map((opt: string) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-th-text-secondary">
                        <input
                          type="radio"
                          name={`config_${field.id}`}
                          value={opt}
                          checked={configAnswers[field.id] === opt}
                          onChange={() => setConfigAnswers((prev) => ({ ...prev, [field.id]: opt }))}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
                {field.field_type === 'checkbox' && (
                  <label className="flex items-center gap-2 text-sm text-th-text-secondary">
                    <input
                      type="checkbox"
                      checked={!!configAnswers[field.id]}
                      onChange={(e) => setConfigAnswers((prev) => ({ ...prev, [field.id]: e.target.checked }))}
                    />
                    {field.placeholder || field.label}
                  </label>
                )}
                {field.field_type === 'date' && (
                  <input
                    type="date"
                    value={(configAnswers[field.id] as string) || ''}
                    onChange={(e) => setConfigAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                    className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
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

          {/* Unit Price */}
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">
              Unit Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-th-text-tertiary">$</span>
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-th-text-tertiary">%</span>
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-th-text-tertiary">%</span>
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

// Edit Quote Modal
interface EditQuoteModalProps {
  open: boolean;
  onClose: () => void;
  quote: QuoteWithRelations;
  onSuccess: () => void;
}

function EditQuoteModal({ open, onClose, quote, onSuccess }: EditQuoteModalProps) {
  const { quoteService, accountService, contactService, dealService } = useCRM();
  const { activeOrgId } = useOrg();

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [dealId, setDealId] = useState('');
  const [contactId, setContactId] = useState('');
  const [validUntil, setValidUntil] = useState('');
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
      setAccounts(accountsResult.accounts);
      setDeals(dealsResult.deals);
    });

    setName(quote.name);
    setDescription(quote.description || '');
    setAccountId(quote.account_id || '');
    setDealId(quote.deal_id || '');
    setContactId(quote.contact_id || '');
    setValidUntil(quote.valid_until?.split('T')[0] || '');
    setDiscountPercent(quote.discount_percent?.toString() || '');
    setDiscountAmount(quote.discount_amount?.toString() || '');
    setShippingAmount(quote.shipping_amount?.toString() || '');
    setTerms(quote.terms_and_conditions || '');
    setNotes(quote.notes || '');
  }, [open, quote, accountService, dealService]);

  useEffect(() => {
    if (!accountId) {
      setContacts([]);
      return;
    }

    contactService.getContacts({ account_id: accountId }, 100, 0).then(({ contacts }) => {
      setContacts(contacts);
    });
  }, [accountId, contactService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Quote name is required');
      return;
    }

    setLoading(true);

    const result = await quoteService.updateQuote(quote.id, {
      name: name.trim(),
      description: description || undefined,
      account_id: accountId || undefined,
      deal_id: dealId || undefined,
      contact_id: contactId || undefined,
      valid_until: validUntil || undefined,
      discount_percent: discountPercent ? parseFloat(discountPercent) : undefined,
      discount_amount: discountAmount ? parseFloat(discountAmount) : undefined,
      shipping_amount: shippingAmount ? parseFloat(shippingAmount) : undefined,
      terms_and_conditions: terms || undefined,
      notes: notes || undefined,
    });

    setLoading(false);

    if (result.success) {
      toast.success('Quote updated');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.QUOTE_UPDATED || 'quote.updated',
        entityType: 'quote',
        entityId: quote.id,
        before: { name: quote.name },
        after: { name },
      }).catch(console.error);
      onSuccess();
    } else {
      toast.error(result.error || 'Failed to update quote');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Quote"
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quote Name */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Quote Name <span className="text-red-500">*</span>
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
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Account
          </label>
          <select
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setContactId('');
            }}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          >
            <option value="">Select an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Contact
          </label>
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

        {/* Valid Until */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Valid Until
          </label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
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
