import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  QrCode,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  X,
  Package,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import {
  codeInventoryService,
  type InventoryCode,
  type CodeBatch,
  type CodeType,
  type CodeStatus,
} from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';

const CODE_TYPES: { value: CodeType; label: string }[] = [
  { value: 'enrollment', label: 'Enrollment' },
  { value: 'referral', label: 'Referral' },
  { value: 'activation', label: 'Activation' },
  { value: 'promotional', label: 'Promotional' },
];

const STATUS_COLORS: Record<CodeStatus, string> = {
  available: 'bg-green-100 text-green-700',
  assigned: 'bg-blue-100 text-blue-700',
  used: 'bg-gray-100 text-gray-600',
  expired: 'bg-red-100 text-red-700',
  revoked: 'bg-yellow-100 text-yellow-700',
};

export default function CodeInventory() {
  const { user } = useAdmin();
  const [codes, setCodes] = useState<InventoryCode[]>([]);
  const [batches, setBatches] = useState<CodeBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState<{ status?: CodeStatus; code_type?: CodeType; search?: string }>({});
  const [showFilters, setShowFilters] = useState(false);

  const [batchForm, setBatchForm] = useState({
    code_type: 'enrollment' as CodeType,
    prefix: '',
    quantity: 10,
    valid_days: 365,
    metadata: {} as Record<string, unknown>,
  });

  const loadData = async () => {
    try {
      const [codesData, batchesData] = await Promise.all([
        codeInventoryService.listCodes(filters),
        codeInventoryService.listBatches(),
      ]);
      setCodes(codesData);
      setBatches(batchesData);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load code inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await codeInventoryService.createBatch({
        code_type: batchForm.code_type,
        prefix: batchForm.prefix || undefined,
        quantity: batchForm.quantity,
        valid_days: batchForm.valid_days,
        metadata: batchForm.metadata,
      }, user.id);
      toast.success(`Created batch of ${batchForm.quantity} codes`);
      setShowBatchModal(false);
      setBatchForm({
        code_type: 'enrollment',
        prefix: '',
        quantity: 10,
        valid_days: 365,
        metadata: {},
      });
      loadData();
    } catch (err) {
      console.error('Failed to create batch:', err);
      toast.error('Failed to create batch');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeCode = async (id: string) => {
    if (!user || !confirm('Revoke this code?')) return;

    try {
      await codeInventoryService.revokeCode(id, user.id);
      toast.success('Code revoked');
      loadData();
    } catch (err) {
      toast.error('Failed to revoke code');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied');
  };

  const exportCodes = (batch: CodeBatch) => {
    const batchCodes = codes.filter((c) => c.batch_id === batch.id);
    const csv = ['Code,Type,Status,Expires At']
      .concat(batchCodes.map((c) => `${c.code},${c.code_type},${c.status},${c.expires_at || ''}`))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-${batch.id.slice(0, 8)}-codes.csv`;
    a.click();
  };

  const stats = {
    total: codes.length,
    available: codes.filter((c) => c.status === 'available').length,
    assigned: codes.filter((c) => c.status === 'assigned').length,
    used: codes.filter((c) => c.status === 'used').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Code Inventory</h1>
          <p className="text-sm text-th-text-tertiary mt-1">Manage enrollment and activation codes</p>
        </div>
        <button
          onClick={() => setShowBatchModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Generate Batch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Total Codes</p>
          <p className="text-2xl font-bold text-th-text-primary mt-1">{stats.total}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Available</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.available}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Assigned</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.assigned}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Used</p>
          <p className="text-2xl font-bold text-th-text-tertiary mt-1">{stats.used}</p>
        </div>
      </div>

      {/* Batches */}
      {batches.length > 0 && (
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <h2 className="text-sm font-medium text-th-text-primary mb-3">Recent Batches</h2>
          <div className="flex flex-wrap gap-2">
            {batches.slice(0, 5).map((batch) => (
              <div
                key={batch.id}
                className="flex items-center gap-2 px-3 py-2 bg-surface-secondary rounded-lg border border-th-border"
              >
                <Package className="w-4 h-4 text-th-text-tertiary" />
                <span className="text-sm text-th-text-primary capitalize">{batch.code_type}</span>
                <span className="text-xs text-th-text-tertiary">
                  {batch.codes_used}/{batch.total_codes}
                </span>
                <button
                  onClick={() => exportCodes(batch)}
                  className="p-1 text-th-text-tertiary hover:text-th-text-primary rounded"
                  title="Export CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
              placeholder="Search codes..."
              className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'border-th-accent-500 text-th-accent-600 bg-th-accent-50 dark:bg-th-accent-900/20'
                : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-th-border grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: (e.target.value as CodeStatus) || undefined })}
                className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary"
              >
                <option value="">All</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="used">Used</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Type</label>
              <select
                value={filters.code_type || ''}
                onChange={(e) => setFilters({ ...filters, code_type: (e.target.value as CodeType) || undefined })}
                className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg text-th-text-primary"
              >
                <option value="">All</option>
                {CODE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Codes List */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12">
            <QrCode className="w-12 h-12 text-th-text-tertiary mx-auto mb-3" />
            <p className="text-th-text-secondary">No codes found</p>
            <p className="text-sm text-th-text-tertiary mt-1">Generate a batch to create codes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-th-border bg-surface-secondary">
                  <th className="px-4 py-3 text-left text-sm font-medium text-th-text-tertiary">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-th-text-tertiary">Type</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-th-text-tertiary">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-th-text-tertiary">Assigned To</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-th-text-tertiary">Expires</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-th-text-tertiary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {codes.slice(0, 50).map((code) => (
                  <tr key={code.id} className="hover:bg-surface-secondary/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-th-text-primary">{code.code}</span>
                        <button
                          onClick={() => copyCode(code.code)}
                          className="p-1 text-th-text-tertiary hover:text-th-text-primary rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-th-text-secondary capitalize">{code.code_type}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[code.status]}`}>
                        {code.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-th-text-secondary">
                      {code.assigned_to || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-th-text-tertiary">
                      {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {code.status === 'available' && (
                          <button
                            onClick={() => handleRevokeCode(code.id)}
                            className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                            title="Revoke"
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {codes.length > 50 && (
              <div className="px-4 py-3 text-center text-sm text-th-text-tertiary border-t border-th-border">
                Showing 50 of {codes.length} codes. Use filters to narrow results.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl border border-th-border w-full max-w-md">
            <div className="border-b border-th-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-th-text-primary">Generate Code Batch</h2>
              <button onClick={() => setShowBatchModal(false)} className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Code Type</label>
                <select
                  value={batchForm.code_type}
                  onChange={(e) => setBatchForm({ ...batchForm, code_type: e.target.value as CodeType })}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                >
                  {CODE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Prefix (optional)</label>
                <input
                  type="text"
                  value={batchForm.prefix}
                  onChange={(e) => setBatchForm({ ...batchForm, prefix: e.target.value.toUpperCase() })}
                  placeholder="e.g., ENR"
                  maxLength={5}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Quantity</label>
                <input
                  type="number"
                  value={batchForm.quantity}
                  onChange={(e) => setBatchForm({ ...batchForm, quantity: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={1000}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Valid for (days)</label>
                <input
                  type="number"
                  value={batchForm.valid_days}
                  onChange={(e) => setBatchForm({ ...batchForm, valid_days: parseInt(e.target.value) || 365 })}
                  min={1}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-th-border">
                <button type="button" onClick={() => setShowBatchModal(false)} className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50">
                  {saving ? 'Generating...' : `Generate ${batchForm.quantity} Codes`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
