import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  FileText,
  Building2,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../components/PermissionGate';
import { useCRM } from '../contexts/CRMContext';
import { Modal } from '../components/Modal';
import { InputField, SelectField, TextareaField, SubmitButton } from '../components/FormField';
import { useForm } from '../hooks/useForm';
import {
  formatTimeAgo,
  type InvoiceWithRelations,
  type InvoiceFilters,
  type AccountWithRelations,
} from '@mpbhealth/crm-core';

// Invoice status options
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'void', label: 'Void' },
];

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
    month: 'short',
    day: 'numeric',
  });
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

// Add Invoice Modal Props & Form
interface AddInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (invoiceId: string) => void;
}

interface InvoiceFormValues {
  name: string;
  description: string;
  account_id: string;
  due_date: string;
  issue_date: string;
  notes: string;
}

const defaultFormValues: InvoiceFormValues = {
  name: '',
  description: '',
  account_id: '',
  due_date: '',
  issue_date: new Date().toISOString().split('T')[0],
  notes: '',
};

function AddInvoiceModal({ open, onClose, onSuccess }: AddInvoiceModalProps) {
  const { invoiceService, accountService } = useCRM();
  const [accounts, setAccounts] = useState<AccountWithRelations[]>([]);

  // Load accounts for dropdown
  useEffect(() => {
    async function loadAccounts() {
      const { accounts: data } = await accountService.getAccounts({}, 100, 0);
      setAccounts(data);
    }
    if (open) {
      loadAccounts();
    }
  }, [open, accountService]);

  const handleSubmit = async (values: InvoiceFormValues) => {
    const result = await invoiceService.createInvoice({
      name: values.name,
      description: values.description || undefined,
      account_id: values.account_id || undefined,
      issue_date: values.issue_date || undefined,
      due_date: values.due_date || undefined,
      notes: values.notes || undefined,
      status: 'draft',
    });

    if (!result.success) {
      toast.error(result.error || 'Failed to create invoice');
      return;
    }

    toast.success('Invoice created');
    onSuccess?.(result.invoiceId!);
    onClose();
  };

  const { values, errors, loading, handleChange, handleSubmit: onFormSubmit, reset } = useForm<InvoiceFormValues>({
    initialValues: defaultFormValues,
    validate: (vals) => {
      const errs: Partial<Record<keyof InvoiceFormValues, string>> = {};
      if (!vals.name.trim()) errs.name = 'Invoice name is required';
      return errs;
    },
    onSubmit: handleSubmit,
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Invoice"
      description="Create a new invoice"
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={onFormSubmit} className="space-y-6">
        <div className="space-y-4">
          <InputField
            label="Invoice Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
            required
            placeholder="Enter invoice name"
          />

          <SelectField
            label="Account"
            name="account_id"
            value={values.account_id}
            onChange={handleChange}
            options={[
              { value: '', label: 'Select Account...' },
              ...accounts.map((a) => ({ value: a.id, label: a.name })),
            ]}
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
            label="Description"
            name="description"
            value={values.description}
            onChange={handleChange}
            rows={2}
            placeholder="Invoice description..."
          />

          <TextareaField
            label="Notes"
            name="notes"
            value={values.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Internal notes..."
          />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-th-border">
          <SubmitButton
            loading={loading}
            label="Create Invoice"
            loadingLabel="Creating..."
          />
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Invoices() {
  const navigate = useNavigate();
  const { invoiceService, accountService } = useCRM();

  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [accounts, setAccounts] = useState<AccountWithRelations[]>([]);
  const pageSize = 20;

  // Bulk selection state
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

  // Load invoices
  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { invoices: data, total: count } = await invoiceService.getInvoices(
        filters,
        pageSize,
        page * pageSize
      );
      setInvoices(data);
      setTotal(count);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [invoiceService, filters, page]);

  // Load accounts for filter dropdown
  const loadAccounts = useCallback(async () => {
    const { accounts: data } = await accountService.getAccounts({}, 100, 0);
    setAccounts(data);
  }, [accountService]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Clear selection when filters or page change
  useEffect(() => {
    setSelectedInvoices(new Set());
  }, [filters, page]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(0);
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, status: status || undefined }));
    setPage(0);
  };

  const handleAccountFilter = (account_id: string) => {
    setFilters((prev) => ({ ...prev, account_id: account_id || undefined }));
    setPage(0);
  };

  const handleDueDateFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name === 'due_from' ? 'dueFrom' : 'dueTo']: value || undefined,
    }));
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const { invoices: exportInvoices } = await invoiceService.getInvoices(filters, 1000, 0);
      const csv = generateInvoiceCSV(exportInvoices);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export invoices');
    }
  };

  const handleExportSelected = async () => {
    try {
      const selected = invoices.filter((inv) => selectedInvoices.has(inv.id));
      const csv = generateInvoiceCSV(selected);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-selected-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export invoices');
    }
  };

  // Generate CSV from invoices
  function generateInvoiceCSV(data: InvoiceWithRelations[]) {
    const headers = ['Invoice Number', 'Name', 'Account', 'Total', 'Amount Due', 'Status', 'Due Date', 'Created'];
    const rows = data.map((invoice) => [
      invoice.invoice_number,
      invoice.name,
      invoice.account?.name || '',
      invoice.total?.toString() || '0',
      invoice.amount_due?.toString() || '0',
      invoice.status,
      invoice.due_date || '',
      new Date(invoice.created_at).toLocaleDateString(),
    ]);
    return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
  }

  const toggleSelectAll = useCallback(() => {
    if (selectedInvoices.size === invoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(invoices.map((i) => i.id)));
    }
  }, [invoices, selectedInvoices.size]);

  const toggleSelectInvoice = useCallback((invoiceId: string) => {
    setSelectedInvoices((prev) => {
      const next = new Set(prev);
      if (next.has(invoiceId)) {
        next.delete(invoiceId);
      } else {
        next.add(invoiceId);
      }
      return next;
    });
  }, []);

  const handleRowClick = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Bulk Actions Toolbar */}
      {selectedInvoices.size > 0 && (
        <div className="bg-th-accent-50 border border-th-accent-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-th-accent-700">
            {selectedInvoices.size} invoice{selectedInvoices.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-3">
            <PermissionGate permission="invoices.read">
              <button
                onClick={handleExportSelected}
                className="text-sm text-th-accent-600 hover:text-th-accent-700 font-medium"
              >
                Export Selected
              </button>
            </PermissionGate>
            <button
              onClick={() => setSelectedInvoices(new Set())}
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
          <h1 className="text-2xl font-bold text-th-text-primary">Invoices</h1>
          <p className="text-th-text-tertiary text-sm mt-1">{total} total invoices</p>
        </div>
        <div className="flex items-center space-x-3">
          <PermissionGate permission="invoices.read">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </PermissionGate>
          <PermissionGate permission="invoices.write">
            <button
              onClick={() => setShowAddInvoice(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
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
              placeholder="Search by invoice number or name..."
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

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-th-border">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-th-text-tertiary mb-1">
                  Due Date From
                </label>
                <input
                  type="date"
                  name="due_from"
                  value={filters.dueFrom || ''}
                  onChange={handleDueDateFilter}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-tertiary mb-1">
                  Due Date To
                </label>
                <input
                  type="date"
                  name="due_to"
                  value={filters.dueTo || ''}
                  onChange={handleDueDateFilter}
                  className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoices table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p>No invoices found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new invoice</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-th-border">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.size === invoices.length && invoices.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-th-border"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Account
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Amount Due
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {invoices.map((invoice) => {
                  const statusColors = getStatusColors(invoice.status);
                  const isSelected = selectedInvoices.has(invoice.id);
                  const isOverdue =
                    invoice.status !== 'paid' &&
                    invoice.status !== 'void' &&
                    invoice.due_date &&
                    new Date(invoice.due_date) < new Date();

                  return (
                    <tr
                      key={invoice.id}
                      className={`hover:bg-surface-secondary cursor-pointer ${
                        isSelected ? 'bg-th-accent-50' : ''
                      }`}
                      onClick={() => handleRowClick(invoice.id)}
                    >
                      <td
                        className="w-12 px-4 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectInvoice(invoice.id)}
                          className="w-4 h-4 rounded border-th-border"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-th-accent-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-th-accent-700" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-th-text-primary hover:text-th-accent-600">
                              {invoice.invoice_number}
                            </p>
                            <p className="text-xs text-th-text-tertiary">
                              {invoice.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {invoice.account ? (
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-th-text-tertiary" />
                            <span className="text-sm text-th-text-secondary">
                              {invoice.account.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-th-text-primary">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`text-sm font-medium ${
                            invoice.amount_due > 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {formatCurrency(invoice.amount_due, invoice.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                        >
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-th-text-tertiary" />
                          <span
                            className={`text-sm ${
                              isOverdue ? 'text-red-600 font-medium' : 'text-th-text-secondary'
                            }`}
                          >
                            {formatDate(invoice.due_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-th-text-tertiary">
                        {formatTimeAgo(invoice.created_at)}
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

      {/* Add Invoice Modal */}
      <AddInvoiceModal
        open={showAddInvoice}
        onClose={() => setShowAddInvoice(false)}
        onSuccess={() => loadInvoices()}
      />
    </div>
  );
}
