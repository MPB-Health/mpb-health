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
  User,
  Calendar,
  DollarSign,
  FileText,
  CreditCard,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { PermissionGate } from '../components/PermissionGate';
import { Modal } from '../components/Modal';
import { InputField, SelectField, TextareaField, SubmitButton } from '../components/FormField';
import { useForm } from '../hooks/useForm';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type {
  InvoiceWithRelations,
  InvoiceLineItem,
  InvoicePayment,
  Product,
} from '@mpbhealth/crm-core';
import { formatTimeAgo } from '@mpbhealth/crm-core';

type TabType = 'line_items' | 'payments' | 'details';

// Get status badge colors
function getStatusColors(status: string) {
  switch (status) {
    case 'draft':
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
    case 'sent':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'paid':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'partially_paid':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    case 'overdue':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    case 'void':
      return { bg: 'bg-gray-100', text: 'text-gray-500' };
    case 'cancelled':
      return { bg: 'bg-gray-100', text: 'text-gray-500' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

// Status display name
function getStatusLabel(status: string) {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'sent':
      return 'Sent';
    case 'paid':
      return 'Paid';
    case 'partially_paid':
      return 'Partially Paid';
    case 'overdue':
      return 'Overdue';
    case 'void':
      return 'Void';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

// Format currency
function formatCurrency(amount: number | null | undefined, currency = 'USD') {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format date
function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// -------------------------------------------------------------------------
// Add Line Item Modal
// -------------------------------------------------------------------------
interface AddLineItemModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  onSuccess: () => void;
  lineItem?: InvoiceLineItem | null;
}

interface LineItemFormValues {
  product_id: string;
  name: string;
  description: string;
  quantity: string;
  unit_price: string;
  discount_percent: string;
  tax_rate: string;
}

const defaultLineItemValues: LineItemFormValues = {
  product_id: '',
  name: '',
  description: '',
  quantity: '1',
  unit_price: '0',
  discount_percent: '0',
  tax_rate: '0',
};

function AddLineItemModal({ open, onClose, invoiceId, onSuccess, lineItem }: AddLineItemModalProps) {
  const { invoiceService, productService } = useCRM();
  const [products, setProducts] = useState<Product[]>([]);
  const isEdit = !!lineItem;

  // Load products for dropdown
  useEffect(() => {
    async function loadProducts() {
      const { products: data } = await productService.getProducts({}, 100, 0);
      setProducts(data);
    }
    if (open) {
      loadProducts();
    }
  }, [open, productService]);

  const getInitialValues = (): LineItemFormValues => {
    if (!lineItem) return defaultLineItemValues;
    return {
      product_id: lineItem.product_id || '',
      name: lineItem.name || '',
      description: lineItem.description || '',
      quantity: lineItem.quantity?.toString() || '1',
      unit_price: lineItem.unit_price?.toString() || '0',
      discount_percent: lineItem.discount_percent?.toString() || '0',
      tax_rate: lineItem.tax_rate?.toString() || '0',
    };
  };

  const handleSubmit = async (values: LineItemFormValues) => {
    const lineItemData = {
      product_id: values.product_id || undefined,
      name: values.name,
      description: values.description || undefined,
      quantity: Number(values.quantity) || 1,
      unit_price: Number(values.unit_price) || 0,
      discount_percent: Number(values.discount_percent) || undefined,
      tax_rate: Number(values.tax_rate) || undefined,
    };

    let result;
    if (isEdit && lineItem) {
      result = await invoiceService.updateLineItem(lineItem.id, lineItemData);
    } else {
      result = await invoiceService.addLineItem(invoiceId, lineItemData);
    }

    if (!result.success) {
      toast.error(result.error || 'Failed to save line item');
      return;
    }

    toast.success(isEdit ? 'Line item updated' : 'Line item added');
    onSuccess();
    onClose();
  };

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setFieldValue('name', product.name);
      setFieldValue('description', product.description || '');
      setFieldValue('unit_price', product.unit_price?.toString() || '0');
    }
    setFieldValue('product_id', productId);
  };

  const { values, errors, loading, handleChange, handleSubmit: onFormSubmit, setFieldValue, reset } = useForm<LineItemFormValues>({
    initialValues: getInitialValues(),
    validate: (vals) => {
      const errs: Partial<Record<keyof LineItemFormValues, string>> = {};
      if (!vals.name.trim()) errs.name = 'Name is required';
      if (!vals.quantity || Number(vals.quantity) <= 0) errs.quantity = 'Quantity must be greater than 0';
      if (vals.unit_price === '' || isNaN(Number(vals.unit_price))) errs.unit_price = 'Valid price required';
      return errs;
    },
    onSubmit: handleSubmit,
  });

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, lineItem]);

  // Calculate totals for preview
  const quantity = Number(values.quantity) || 0;
  const unitPrice = Number(values.unit_price) || 0;
  const discountPercent = Number(values.discount_percent) || 0;
  const taxRate = Number(values.tax_rate) || 0;
  let subtotal = quantity * unitPrice;
  if (discountPercent > 0) {
    subtotal = subtotal * (1 - discountPercent / 100);
  }
  let total = subtotal;
  if (taxRate > 0) {
    total = subtotal * (1 + taxRate / 100);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Line Item' : 'Add Line Item'}
      size="lg"
    >
      <form onSubmit={onFormSubmit} className="space-y-4">
        <SelectField
          label="Product"
          name="product_id"
          value={values.product_id}
          onChange={(e) => handleProductChange(e.target.value)}
          options={[
            { value: '', label: 'Select Product (Optional)...' },
            ...products.map((p) => ({ value: p.id, label: `${p.name} - ${formatCurrency(p.unit_price)}` })),
          ]}
        />

        <InputField
          label="Name"
          name="name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          required
          placeholder="Line item name"
        />

        <TextareaField
          label="Description"
          name="description"
          value={values.description}
          onChange={handleChange}
          rows={2}
          placeholder="Description..."
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Quantity"
            name="quantity"
            type="number"
            value={values.quantity}
            onChange={handleChange}
            error={errors.quantity}
            required
          />
          <InputField
            label="Unit Price"
            name="unit_price"
            type="number"
            value={values.unit_price}
            onChange={handleChange}
            error={errors.unit_price}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Discount %"
            name="discount_percent"
            type="number"
            value={values.discount_percent}
            onChange={handleChange}
          />
          <InputField
            label="Tax Rate %"
            name="tax_rate"
            type="number"
            value={values.tax_rate}
            onChange={handleChange}
          />
        </div>

        {/* Preview */}
        <div className="bg-surface-secondary rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-th-text-tertiary">Subtotal:</span>
            <span className="text-th-text-primary">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-th-text-tertiary">Total (with tax):</span>
            <span className="font-medium text-th-text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-th-border">
          <SubmitButton
            loading={loading}
            label={isEdit ? 'Update Item' : 'Add Item'}
            loadingLabel="Saving..."
          />
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// -------------------------------------------------------------------------
// Record Payment Modal
// -------------------------------------------------------------------------
interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  amountDue: number;
  currency: string;
  onSuccess: () => void;
}

interface PaymentFormValues {
  amount: string;
  payment_method: string;
  payment_date: string;
  reference_number: string;
  notes: string;
}

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'Select Method...' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'cash', label: 'Cash' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'other', label: 'Other' },
];

function RecordPaymentModal({ open, onClose, invoiceId, amountDue, currency, onSuccess }: RecordPaymentModalProps) {
  const { invoiceService } = useCRM();

  const defaultPaymentValues: PaymentFormValues = {
    amount: amountDue.toString(),
    payment_method: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
  };

  const handleSubmit = async (values: PaymentFormValues) => {
    const result = await invoiceService.recordPayment(invoiceId, {
      amount: Number(values.amount),
      payment_method: values.payment_method || undefined,
      payment_date: values.payment_date || undefined,
      reference_number: values.reference_number || undefined,
      notes: values.notes || undefined,
    });

    if (!result.success) {
      toast.error(result.error || 'Failed to record payment');
      return;
    }

    toast.success('Payment recorded');
    onSuccess();
    onClose();
  };

  const { values, errors, loading, handleChange, handleSubmit: onFormSubmit, reset } = useForm<PaymentFormValues>({
    initialValues: defaultPaymentValues,
    validate: (vals) => {
      const errs: Partial<Record<keyof PaymentFormValues, string>> = {};
      if (!vals.amount || Number(vals.amount) <= 0) errs.amount = 'Amount must be greater than 0';
      if (Number(vals.amount) > amountDue) errs.amount = `Amount cannot exceed ${formatCurrency(amountDue, currency)}`;
      return errs;
    },
    onSubmit: handleSubmit,
  });

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, amountDue]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Payment"
      size="md"
    >
      <form onSubmit={onFormSubmit} className="space-y-4">
        <div className="bg-th-accent-50 border border-th-accent-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-th-accent-700">
            Amount Due: <span className="font-bold">{formatCurrency(amountDue, currency)}</span>
          </p>
        </div>

        <InputField
          label="Amount"
          name="amount"
          type="number"
          value={values.amount}
          onChange={handleChange}
          error={errors.amount}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Payment Method"
            name="payment_method"
            value={values.payment_method}
            onChange={handleChange}
            options={PAYMENT_METHOD_OPTIONS}
          />
          <InputField
            label="Payment Date"
            name="payment_date"
            type="date"
            value={values.payment_date}
            onChange={handleChange}
          />
        </div>

        <InputField
          label="Reference Number"
          name="reference_number"
          value={values.reference_number}
          onChange={handleChange}
          placeholder="Check #, Transaction ID, etc."
        />

        <TextareaField
          label="Notes"
          name="notes"
          value={values.notes}
          onChange={handleChange}
          rows={2}
          placeholder="Payment notes..."
        />

        <div className="flex items-center gap-3 pt-4 border-t border-th-border">
          <SubmitButton
            loading={loading}
            label="Record Payment"
            loadingLabel="Recording..."
          />
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// -------------------------------------------------------------------------
// Edit Invoice Modal
// -------------------------------------------------------------------------
interface EditInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceWithRelations;
  onSuccess: () => void;
}

interface EditInvoiceFormValues {
  name: string;
  description: string;
  due_date: string;
  issue_date: string;
  notes: string;
  terms_and_conditions: string;
}

function EditInvoiceModal({ open, onClose, invoice, onSuccess }: EditInvoiceModalProps) {
  const { invoiceService } = useCRM();
  const { activeOrgId } = useOrg();

  const getInitialValues = (): EditInvoiceFormValues => ({
    name: invoice.name || '',
    description: invoice.description || '',
    due_date: invoice.due_date?.split('T')[0] || '',
    issue_date: invoice.issue_date?.split('T')[0] || '',
    notes: invoice.notes || '',
    terms_and_conditions: invoice.terms_and_conditions || '',
  });

  const handleSubmit = async (values: EditInvoiceFormValues) => {
    const result = await invoiceService.updateInvoice(invoice.id, {
      name: values.name,
      description: values.description || undefined,
      due_date: values.due_date || undefined,
      issue_date: values.issue_date || undefined,
      notes: values.notes || undefined,
      terms_and_conditions: values.terms_and_conditions || undefined,
    });

    if (!result.success) {
      toast.error(result.error || 'Failed to update invoice');
      return;
    }

    toast.success('Invoice updated');
    logAuditEvent({
      orgId: activeOrgId || '',
      action: 'invoice.updated',
      entityType: 'invoice',
      entityId: invoice.id,
    }).catch(console.error);
    onSuccess();
    onClose();
  };

  const { values, errors, loading, handleChange, handleSubmit: onFormSubmit, reset } = useForm<EditInvoiceFormValues>({
    initialValues: getInitialValues(),
    validate: (vals) => {
      const errs: Partial<Record<keyof EditInvoiceFormValues, string>> = {};
      if (!vals.name.trim()) errs.name = 'Name is required';
      return errs;
    },
    onSubmit: handleSubmit,
  });

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, invoice]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Invoice"
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={onFormSubmit} className="space-y-4">
        <InputField
          label="Invoice Name"
          name="name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          required
        />

        <TextareaField
          label="Description"
          name="description"
          value={values.description}
          onChange={handleChange}
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Issue Date"
            name="issue_date"
            type="date"
            value={values.issue_date}
            onChange={handleChange}
          />
          <InputField
            label="Due Date"
            name="due_date"
            type="date"
            value={values.due_date}
            onChange={handleChange}
          />
        </div>

        <TextareaField
          label="Notes"
          name="notes"
          value={values.notes}
          onChange={handleChange}
          rows={2}
        />

        <TextareaField
          label="Terms and Conditions"
          name="terms_and_conditions"
          value={values.terms_and_conditions}
          onChange={handleChange}
          rows={3}
        />

        <div className="flex items-center gap-3 pt-4 border-t border-th-border">
          <SubmitButton
            loading={loading}
            label="Update Invoice"
            loadingLabel="Updating..."
          />
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// -------------------------------------------------------------------------
// Main InvoiceDetail Component
// -------------------------------------------------------------------------
export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoiceService } = useCRM();
  const { activeOrgId } = useOrg();

  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('line_items');
  const [showEditInvoice, setShowEditInvoice] = useState(false);
  const [showAddLineItem, setShowAddLineItem] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [editingLineItem, setEditingLineItem] = useState<InvoiceLineItem | null>(null);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadInvoice = async () => {
    if (!id) return;

    setLoading(true);
    const invoiceData = await invoiceService.getInvoice(id);
    setInvoice(invoiceData);
    setLoading(false);
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const handleSendInvoice = async () => {
    if (!invoice) return;

    setActionLoading(true);
    const result = await invoiceService.sendInvoice(invoice.id);
    setActionLoading(false);

    if (result.success) {
      toast.success('Invoice sent');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'invoice.sent',
        entityType: 'invoice',
        entityId: invoice.id,
      }).catch(console.error);
      loadInvoice();
    } else {
      toast.error(result.error || 'Failed to send invoice');
    }
  };

  const handleMarkPaid = async () => {
    if (!invoice) return;

    setActionLoading(true);
    const result = await invoiceService.markPaid(invoice.id);
    setActionLoading(false);

    if (result.success) {
      toast.success('Invoice marked as paid');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'invoice.paid',
        entityType: 'invoice',
        entityId: invoice.id,
      }).catch(console.error);
      setShowMarkPaidModal(false);
      loadInvoice();
    } else {
      toast.error(result.error || 'Failed to mark invoice as paid');
    }
  };

  const handleVoidInvoice = async () => {
    if (!invoice) return;

    setActionLoading(true);
    const result = await invoiceService.voidInvoice(invoice.id);
    setActionLoading(false);

    if (result.success) {
      toast.success('Invoice voided');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'invoice.voided',
        entityType: 'invoice',
        entityId: invoice.id,
      }).catch(console.error);
      setShowVoidModal(false);
      loadInvoice();
    } else {
      toast.error(result.error || 'Failed to void invoice');
    }
  };

  const handleDeleteLineItem = async (lineItemId: string) => {
    if (!confirm('Are you sure you want to delete this line item?')) return;

    const result = await invoiceService.removeLineItem(lineItemId);
    if (result.success) {
      toast.success('Line item removed');
      loadInvoice();
    } else {
      toast.error(result.error || 'Failed to remove line item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-th-text-tertiary">Invoice not found</p>
        <Link to="/invoices" className="text-th-accent-600 hover:underline mt-2 inline-block">
          Back to invoices
        </Link>
      </div>
    );
  }

  const statusColors = getStatusColors(invoice.status);
  const isVoided = invoice.status === 'void' || invoice.status === 'cancelled';
  const isPaid = invoice.status === 'paid';
  const canEdit = invoice.status === 'draft';
  const canSend = invoice.status === 'draft' && (invoice.line_items?.length || 0) > 0;
  const canRecordPayment = !isVoided && !isPaid && invoice.amount_due > 0;
  const canMarkPaid = !isVoided && !isPaid && invoice.amount_due > 0;
  const canVoid = !isVoided;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'line_items', label: `Line Items (${invoice.line_items?.length || 0})`, icon: <FileText className="w-4 h-4" /> },
    { id: 'payments', label: `Payments (${invoice.payments?.length || 0})`, icon: <CreditCard className="w-4 h-4" /> },
    { id: 'details', label: 'Details', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 hover:bg-surface-tertiary rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-th-text-primary">{invoice.invoice_number}</h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}
              >
                {getStatusLabel(invoice.status)}
              </span>
            </div>
            <p className="text-th-text-tertiary text-sm mt-1">{invoice.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {canSend && (
            <PermissionGate permission="invoices.write">
              <button
                onClick={handleSendInvoice}
                disabled={actionLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Send Invoice</span>
              </button>
            </PermissionGate>
          )}
          {canRecordPayment && (
            <PermissionGate permission="invoices.write">
              <button
                onClick={() => setShowRecordPayment(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <DollarSign className="w-4 h-4" />
                <span>Record Payment</span>
              </button>
            </PermissionGate>
          )}
          {canMarkPaid && (
            <PermissionGate permission="invoices.write">
              <button
                onClick={() => setShowMarkPaidModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Paid</span>
              </button>
            </PermissionGate>
          )}
          {canVoid && (
            <PermissionGate permission="invoices.write">
              <button
                onClick={() => setShowVoidModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-100"
              >
                <XCircle className="w-4 h-4" />
                <span>Void</span>
              </button>
            </PermissionGate>
          )}
          <PermissionGate permission="invoices.write">
            <button
              onClick={() => setShowEditInvoice(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Subtotal</p>
          <p className="text-xl font-bold text-th-text-primary mt-1">
            {formatCurrency(invoice.subtotal, invoice.currency)}
          </p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Tax</p>
          <p className="text-xl font-bold text-th-text-primary mt-1">
            {formatCurrency(invoice.tax_amount, invoice.currency)}
          </p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Total</p>
          <p className="text-xl font-bold text-th-text-primary mt-1">
            {formatCurrency(invoice.total, invoice.currency)}
          </p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Paid</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {formatCurrency(invoice.amount_paid, invoice.currency)}
          </p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Amount Due</p>
          <p className={`text-xl font-bold mt-1 ${invoice.amount_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(invoice.amount_due, invoice.currency)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-th-border">
        <div className="flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-th-accent-600 border-th-accent-600'
                  : 'text-th-text-tertiary border-transparent hover:text-th-text-secondary'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {activeTab === 'line_items' && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-th-text-primary">Line Items</h2>
                {canEdit && (
                  <PermissionGate permission="invoices.write">
                    <button
                      onClick={() => {
                        setEditingLineItem(null);
                        setShowAddLineItem(true);
                      }}
                      className="flex items-center gap-1 text-sm text-th-accent-600 hover:underline"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  </PermissionGate>
                )}
              </div>

              {!invoice.line_items || invoice.line_items.length === 0 ? (
                <p className="text-th-text-tertiary text-center py-8">No line items yet</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-th-border">
                      <th className="text-left py-2 text-sm font-medium text-th-text-tertiary">Item</th>
                      <th className="text-right py-2 text-sm font-medium text-th-text-tertiary">Qty</th>
                      <th className="text-right py-2 text-sm font-medium text-th-text-tertiary">Unit Price</th>
                      <th className="text-right py-2 text-sm font-medium text-th-text-tertiary">Discount</th>
                      <th className="text-right py-2 text-sm font-medium text-th-text-tertiary">Tax</th>
                      <th className="text-right py-2 text-sm font-medium text-th-text-tertiary">Total</th>
                      {canEdit && <th className="w-16"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.line_items.map((item) => (
                      <tr key={item.id} className="border-b border-th-border">
                        <td className="py-3">
                          <p className="text-th-text-primary font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-th-text-tertiary">{item.description}</p>
                          )}
                        </td>
                        <td className="py-3 text-right text-th-text-secondary">{item.quantity}</td>
                        <td className="py-3 text-right text-th-text-secondary">
                          {formatCurrency(item.unit_price, invoice.currency)}
                        </td>
                        <td className="py-3 text-right text-th-text-secondary">
                          {item.discount_percent ? `${item.discount_percent}%` : '-'}
                        </td>
                        <td className="py-3 text-right text-th-text-secondary">
                          {item.tax_rate ? `${item.tax_rate}%` : '-'}
                        </td>
                        <td className="py-3 text-right font-medium text-th-text-primary">
                          {formatCurrency(item.total, invoice.currency)}
                        </td>
                        {canEdit && (
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingLineItem(item);
                                  setShowAddLineItem(true);
                                }}
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
                </table>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-th-text-primary">Payment History</h2>
                {canRecordPayment && (
                  <PermissionGate permission="invoices.write">
                    <button
                      onClick={() => setShowRecordPayment(true)}
                      className="flex items-center gap-1 text-sm text-th-accent-600 hover:underline"
                    >
                      <Plus className="w-4 h-4" />
                      Record Payment
                    </button>
                  </PermissionGate>
                )}
              </div>

              {!invoice.payments || invoice.payments.length === 0 ? (
                <p className="text-th-text-tertiary text-center py-8">No payments recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {invoice.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-th-text-primary">
                            {formatCurrency(payment.amount, invoice.currency)}
                          </p>
                          <p className="text-sm text-th-text-tertiary">
                            {payment.payment_method
                              ? payment.payment_method.replace('_', ' ').charAt(0).toUpperCase() +
                                payment.payment_method.replace('_', ' ').slice(1)
                              : 'Payment'}
                            {payment.reference_number && ` - ${payment.reference_number}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-th-text-secondary">{formatDate(payment.payment_date)}</p>
                        {payment.notes && (
                          <p className="text-xs text-th-text-tertiary mt-1">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6 space-y-6">
              <h2 className="text-lg font-semibold text-th-text-primary">Invoice Details</h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Invoice Number</label>
                  <p className="text-th-text-primary font-medium">{invoice.invoice_number}</p>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Currency</label>
                  <p className="text-th-text-primary">{invoice.currency}</p>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Issue Date</label>
                  <p className="text-th-text-primary">{formatDate(invoice.issue_date)}</p>
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Due Date</label>
                  <p className="text-th-text-primary">{formatDate(invoice.due_date)}</p>
                </div>
                {invoice.sent_at && (
                  <div>
                    <label className="block text-sm text-th-text-tertiary mb-1">Sent At</label>
                    <p className="text-th-text-primary">{formatDate(invoice.sent_at)}</p>
                  </div>
                )}
                {invoice.paid_at && (
                  <div>
                    <label className="block text-sm text-th-text-tertiary mb-1">Paid At</label>
                    <p className="text-th-text-primary">{formatDate(invoice.paid_at)}</p>
                  </div>
                )}
              </div>

              {invoice.description && (
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Description</label>
                  <p className="text-th-text-secondary">{invoice.description}</p>
                </div>
              )}

              {invoice.notes && (
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Notes</label>
                  <p className="text-th-text-secondary whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}

              {invoice.terms_and_conditions && (
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Terms and Conditions</label>
                  <p className="text-th-text-secondary whitespace-pre-wrap">{invoice.terms_and_conditions}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Account */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Account</h2>
            {invoice.account ? (
              <Link
                to={`/accounts/${invoice.account.id}`}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-th-text-primary">{invoice.account.name}</span>
              </Link>
            ) : (
              <p className="text-th-text-tertiary">No account linked</p>
            )}
          </div>

          {/* Contact */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Contact</h2>
            {invoice.contact ? (
              <Link
                to={`/contacts/${invoice.contact.id}`}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary"
              >
                <div className="w-10 h-10 bg-th-accent-100 rounded-full flex items-center justify-center">
                  <span className="text-th-accent-700 font-medium">
                    {invoice.contact.first_name?.[0]}
                    {invoice.contact.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-th-text-primary">
                    {invoice.contact.first_name} {invoice.contact.last_name}
                  </p>
                  <p className="text-sm text-th-text-tertiary">{invoice.contact.email}</p>
                </div>
              </Link>
            ) : (
              <p className="text-th-text-tertiary">No contact linked</p>
            )}
          </div>

          {/* Related Quote/Deal */}
          {(invoice.quote || invoice.deal) && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4">Related</h2>
              <div className="space-y-3">
                {invoice.quote && (
                  <Link
                    to={`/quotes/${invoice.quote.id}`}
                    className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary"
                  >
                    <FileText className="w-5 h-5 text-th-text-tertiary" />
                    <div>
                      <p className="text-sm text-th-text-tertiary">Quote</p>
                      <p className="font-medium text-th-text-primary">{invoice.quote.quote_number}</p>
                    </div>
                  </Link>
                )}
                {invoice.deal && (
                  <Link
                    to={`/deals/${invoice.deal.id}`}
                    className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary"
                  >
                    <DollarSign className="w-5 h-5 text-th-text-tertiary" />
                    <div>
                      <p className="text-sm text-th-text-tertiary">Deal</p>
                      <p className="font-medium text-th-text-primary">{invoice.deal.name}</p>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Key Dates */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Key Dates</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-th-text-tertiary" />
                <div>
                  <p className="text-sm text-th-text-tertiary">Due Date</p>
                  <p className="text-th-text-primary">{formatDate(invoice.due_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-th-text-tertiary" />
                <div>
                  <p className="text-sm text-th-text-tertiary">Created</p>
                  <p className="text-th-text-primary">{formatTimeAgo(invoice.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditInvoiceModal
        open={showEditInvoice}
        onClose={() => setShowEditInvoice(false)}
        invoice={invoice}
        onSuccess={() => loadInvoice()}
      />

      <AddLineItemModal
        open={showAddLineItem}
        onClose={() => {
          setShowAddLineItem(false);
          setEditingLineItem(null);
        }}
        invoiceId={invoice.id}
        lineItem={editingLineItem}
        onSuccess={() => loadInvoice()}
      />

      <RecordPaymentModal
        open={showRecordPayment}
        onClose={() => setShowRecordPayment(false)}
        invoiceId={invoice.id}
        amountDue={invoice.amount_due}
        currency={invoice.currency}
        onSuccess={() => loadInvoice()}
      />

      {/* Void Confirmation Modal */}
      <Modal
        open={showVoidModal}
        onClose={() => setShowVoidModal(false)}
        title="Void Invoice"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            Are you sure you want to void this invoice? This action cannot be undone.
          </p>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="font-medium text-red-700">{invoice.invoice_number}</p>
            <p className="text-sm text-red-600">{formatCurrency(invoice.total, invoice.currency)}</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowVoidModal(false)}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleVoidInvoice}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
            >
              {actionLoading ? 'Voiding...' : 'Void Invoice'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Mark Paid Confirmation Modal */}
      <Modal
        open={showMarkPaidModal}
        onClose={() => setShowMarkPaidModal(false)}
        title="Mark Invoice as Paid"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-th-text-secondary">
            This will record a payment for the full remaining amount and mark the invoice as paid.
          </p>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="font-medium text-green-700">{invoice.invoice_number}</p>
            <p className="text-2xl font-bold text-green-800">
              {formatCurrency(invoice.amount_due, invoice.currency)}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowMarkPaidModal(false)}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkPaid}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Confirm Paid'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
