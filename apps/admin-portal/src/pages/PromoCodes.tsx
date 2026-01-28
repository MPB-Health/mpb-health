import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  X,
  Calendar,
  Users,
  DollarSign,
  Percent,
} from 'lucide-react';
import {
  promoCodeService,
  type PromoCode,
  type DiscountType,
} from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';

const DISCOUNT_TYPES: { value: DiscountType; label: string }[] = [
  { value: 'percentage', label: 'Percentage Off' },
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'free_months', label: 'Free Months' },
];

interface FormData {
  code: string;
  name: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  usage_limit: number;
  per_user_limit: number;
  min_purchase_amount: number;
  valid_from: string;
  valid_until: string;
}

const DEFAULT_FORM: FormData = {
  code: '',
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 10,
  usage_limit: 0,
  per_user_limit: 1,
  min_purchase_amount: 0,
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: '',
};

export default function PromoCodes() {
  const { user } = useAdmin();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const loadCodes = async () => {
    if (!user?.org_id) return;
    try {
      const data = await promoCodeService.list(user.org_id);
      setCodes(data);
    } catch (err) {
      console.error('Failed to load codes:', err);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.org_id) loadCodes();
  }, [user?.org_id]);

  const openModal = (code?: PromoCode) => {
    if (code) {
      setEditing(code);
      setForm({
        code: code.code,
        name: code.name,
        description: code.description || '',
        discount_type: code.discount_type,
        discount_value: code.discount_value,
        usage_limit: code.usage_limit || 0,
        per_user_limit: code.per_user_limit,
        min_purchase_amount: code.min_purchase_amount || 0,
        valid_from: code.valid_from?.split('T')[0] || '',
        valid_until: code.valid_until?.split('T')[0] || '',
      });
    } else {
      setEditing(null);
      setForm(DEFAULT_FORM);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(DEFAULT_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.org_id) return;

    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        name: form.name,
        description: form.description || undefined,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        usage_limit: form.usage_limit || undefined,
        per_user_limit: form.per_user_limit,
        min_purchase_amount: form.min_purchase_amount || undefined,
        valid_from: form.valid_from || undefined,
        valid_until: form.valid_until || undefined,
      };

      if (editing) {
        await promoCodeService.update(editing.id, payload, user.id);
        toast.success('Promo code updated');
      } else {
        await promoCodeService.create(payload, user.org_id, user.id);
        toast.success('Promo code created');
      }
      closeModal();
      loadCodes();
    } catch (err) {
      console.error('Failed to save code:', err);
      toast.error('Failed to save promo code');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this promo code?')) return;

    try {
      await promoCodeService.delete(id, user.id);
      toast.success('Promo code deleted');
      loadCodes();
    } catch (err) {
      toast.error('Failed to delete code');
    }
  };

  const handleToggleActive = async (code: PromoCode) => {
    if (!user) return;

    try {
      await promoCodeService.update(code.id, { is_active: !code.is_active }, user.id);
      toast.success(code.is_active ? 'Code deactivated' : 'Code activated');
      loadCodes();
    } catch (err) {
      toast.error('Failed to update code');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({ ...form, code });
  };

  const getDiscountLabel = (code: PromoCode) => {
    switch (code.discount_type) {
      case 'percentage':
        return `${code.discount_value}% off`;
      case 'fixed':
        return `$${code.discount_value} off`;
      case 'free_months':
        return `${code.discount_value} months free`;
      default:
        return `${code.discount_value}`;
    }
  };

  const totalRedemptions = codes.reduce((sum, c) => sum + c.usage_count, 0);
  const activeCodes = codes.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Promo Codes</h1>
          <p className="text-sm text-th-text-tertiary mt-1">Manage discount and promotional codes</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Total Codes</p>
          <p className="text-2xl font-bold text-th-text-primary mt-1">{codes.length}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeCodes}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Total Redemptions</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalRedemptions}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Expired</p>
          <p className="text-2xl font-bold text-th-text-tertiary mt-1">
            {codes.filter((c) => c.valid_until && new Date(c.valid_until) < new Date()).length}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 text-th-text-tertiary mx-auto mb-3" />
            <p className="text-th-text-secondary">No promo codes yet</p>
            <p className="text-sm text-th-text-tertiary mt-1">Create a code to offer discounts</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-th-border bg-surface-secondary">
                  <th className="px-4 py-3 text-left text-sm font-medium text-th-text-tertiary">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-th-text-tertiary">Name</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-th-text-tertiary">Discount</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-th-text-tertiary">Usage</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-th-text-tertiary">Valid Until</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-th-text-tertiary">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-th-text-tertiary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-surface-secondary/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-th-text-primary">{code.code}</span>
                        <button
                          onClick={() => copyCode(code.code)}
                          className="p-1 text-th-text-tertiary hover:text-th-text-primary rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-th-text-primary">{code.name}</p>
                      {code.description && (
                        <p className="text-xs text-th-text-tertiary truncate max-w-[200px]">{code.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {code.discount_type === 'percentage' && <Percent className="w-3 h-3" />}
                        {code.discount_type === 'fixed' && <DollarSign className="w-3 h-3" />}
                        {code.discount_type === 'free_months' && <Calendar className="w-3 h-3" />}
                        {getDiscountLabel(code)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Users className="w-4 h-4 text-th-text-tertiary" />
                        <span className="text-th-text-primary">{code.usage_count}</span>
                        {code.usage_limit && (
                          <span className="text-th-text-tertiary">/ {code.usage_limit}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-th-text-secondary">
                      {code.valid_until
                        ? new Date(code.valid_until).toLocaleDateString()
                        : 'No expiry'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(code)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          code.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {code.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(code)}
                          className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-th-text-secondary" />
                        </button>
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl border border-th-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface-primary border-b border-th-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-th-text-primary">
                {editing ? 'Edit Promo Code' : 'Create Promo Code'}
              </h2>
              <button onClick={closeModal} className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Code *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    className="flex-1 px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary font-mono"
                    required
                    disabled={!!editing}
                  />
                  {!editing && (
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-3 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary"
                    >
                      Generate
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Summer Sale"
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Discount Type</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value as DiscountType })}
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  >
                    {DISCOUNT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    Value {form.discount_type === 'percentage' ? '(%)' : form.discount_type === 'fixed' ? '($)' : '(days)'}
                  </label>
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={form.discount_type === 'percentage' ? 100 : undefined}
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Usage Limit (0 = unlimited)</label>
                  <input
                    type="number"
                    value={form.usage_limit}
                    onChange={(e) => setForm({ ...form, usage_limit: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Per User Limit</label>
                  <input
                    type="number"
                    value={form.per_user_limit}
                    onChange={(e) => setForm({ ...form, per_user_limit: parseInt(e.target.value) || 1 })}
                    min={1}
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Valid From</label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-th-border">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
