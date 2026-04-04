import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  TestTube,
  X,
} from 'lucide-react';
import {
  paymentProcessorService,
  type PaymentProcessor,
  type PaymentProvider,
  type PaymentMethod,
} from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';

const PROVIDERS: { value: PaymentProvider; label: string }[] = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'square', label: 'Square' },
  { value: 'authorize_net', label: 'Authorize.net' },
  { value: 'paypal', label: 'PayPal' },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'ach', label: 'ACH Bank Transfer' },
  { value: 'apple_pay', label: 'Apple Pay' },
  { value: 'google_pay', label: 'Google Pay' },
];

interface FormData {
  name: string;
  provider: PaymentProvider;
  supported_methods: PaymentMethod[];
  api_key: string;
  api_secret: string;
  webhook_secret: string;
}

const DEFAULT_FORM: FormData = {
  name: '',
  provider: 'stripe',
  supported_methods: ['card'],
  api_key: '',
  api_secret: '',
  webhook_secret: '',
};

export default function PaymentProcessors() {
  const { user } = useAdmin();
  const [processors, setProcessors] = useState<PaymentProcessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PaymentProcessor | null>(null);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const loadProcessors = async () => {
    if (!user?.org_id) return;
    try {
      const data = await paymentProcessorService.list(user.org_id);
      setProcessors(data);
    } catch (err) {
      console.error('Failed to load processors:', err);
      toast.error('Failed to load payment processors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.org_id) {
      loadProcessors();
    } else if (user) {
      setLoading(false);
    }
  }, [user?.org_id]);

  const openModal = (processor?: PaymentProcessor) => {
    if (processor) {
      setEditing(processor);
      setForm({
        name: processor.name,
        provider: processor.provider,
        supported_methods: processor.supported_methods,
        api_key: '',
        api_secret: '',
        webhook_secret: '',
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
      const config: Record<string, unknown> = {};
      if (form.api_key) config.api_key = form.api_key;
      if (form.api_secret) config.api_secret = form.api_secret;
      if (form.webhook_secret) config.webhook_secret = form.webhook_secret;

      if (editing) {
        await paymentProcessorService.update(editing.id, {
          name: form.name,
          provider: form.provider,
          supported_methods: form.supported_methods,
          config: Object.keys(config).length > 0 ? config : undefined,
        }, user.id);
        toast.success('Processor updated');
      } else {
        await paymentProcessorService.create({
          name: form.name,
          provider: form.provider,
          supported_methods: form.supported_methods,
          config,
        }, user.org_id, user.id);
        toast.success('Processor created');
      }
      closeModal();
      loadProcessors();
    } catch (err) {
      console.error('Failed to save processor:', err);
      toast.error('Failed to save processor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this payment processor?')) return;

    try {
      await paymentProcessorService.delete(id, user.id);
      toast.success('Processor deleted');
      loadProcessors();
    } catch (err) {
      toast.error('Failed to delete processor');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user?.org_id) return;

    try {
      await paymentProcessorService.setDefault(id, user.org_id, user.id);
      toast.success('Default processor updated');
      loadProcessors();
    } catch (err) {
      toast.error('Failed to set default');
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      const result = await paymentProcessorService.testConnection(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      loadProcessors();
    } catch (err) {
      toast.error('Connection test failed');
    } finally {
      setTesting(null);
    }
  };

  const toggleMethod = (method: PaymentMethod) => {
    setForm((prev) => ({
      ...prev,
      supported_methods: prev.supported_methods.includes(method)
        ? prev.supported_methods.filter((m) => m !== method)
        : [...prev.supported_methods, method],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Payment Processors</h1>
          <p className="text-sm text-th-text-tertiary mt-1">Manage payment gateway integrations</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Processor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Total Processors</p>
          <p className="text-2xl font-bold text-th-text-primary mt-1">{processors.length}</p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {processors.filter((p) => p.is_active).length}
          </p>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <p className="text-sm text-th-text-tertiary">Default Set</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {processors.filter((p) => p.is_default).length}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : processors.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-th-text-tertiary mx-auto mb-3" />
            <p className="text-th-text-secondary">No payment processors configured</p>
            <p className="text-sm text-th-text-tertiary mt-1">Add a processor to start accepting payments</p>
          </div>
        ) : (
          <div className="divide-y divide-th-border">
            {processors.map((processor) => (
              <div key={processor.id} className="p-4 hover:bg-surface-secondary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-th-accent-100 dark:bg-th-accent-900/30 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-th-accent-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-th-text-primary">{processor.name}</h3>
                        {processor.is_default && (
                          <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3" /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-th-text-tertiary capitalize">{processor.provider.replace('_', ' ')}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {processor.is_active ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                        <span className="text-xs text-th-text-tertiary">
                          Methods: {processor.supported_methods.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTest(processor.id)}
                      disabled={testing === processor.id}
                      className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"
                      title="Test Connection"
                    >
                      <TestTube className={`w-4 h-4 text-blue-600 ${testing === processor.id ? 'animate-pulse' : ''}`} />
                    </button>
                    {!processor.is_default && (
                      <button
                        onClick={() => handleSetDefault(processor.id)}
                        className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                        title="Set as Default"
                      >
                        <Star className="w-4 h-4 text-yellow-600" />
                      </button>
                    )}
                    <button
                      onClick={() => openModal(processor)}
                      className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-th-text-secondary" />
                    </button>
                    <button
                      onClick={() => handleDelete(processor.id)}
                      className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl border border-th-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface-primary border-b border-th-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-th-text-primary">
                {editing ? 'Edit Processor' : 'Add Processor'}
              </h2>
              <button onClick={closeModal} aria-label="Close" className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="payment-name" className="block text-sm font-medium text-th-text-secondary mb-1">Name *</label>
                <input
                  id="payment-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  required
                />
              </div>

              <div>
                <label htmlFor="payment-provider" className="block text-sm font-medium text-th-text-secondary mb-1">Provider</label>
                <select
                  id="payment-provider"
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value as PaymentProvider })}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-2">Payment Methods</label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => toggleMethod(m.value)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                        form.supported_methods.includes(m.value)
                          ? 'border-th-accent-500 bg-th-accent-50 text-th-accent-700 dark:bg-th-accent-900/20'
                          : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  API Key {!editing && '*'}
                </label>
                <input
                  type="password"
                  value={form.api_key}
                  onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                  placeholder={editing ? '(unchanged)' : ''}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  required={!editing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">API Secret</label>
                <input
                  type="password"
                  value={form.api_secret}
                  onChange={(e) => setForm({ ...form, api_secret: e.target.value })}
                  placeholder={editing ? '(unchanged)' : ''}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                />
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
