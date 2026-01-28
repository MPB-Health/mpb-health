import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  PenTool,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  TestTube,
  X,
  Send,
  Eye,
  FileText,
  Users,
  Clock,
} from 'lucide-react';
import {
  eSignatureService,
  type ESignatureProviderConfig,
  type ESignatureDocument,
  type ESignatureProvider,
  type DocumentStatus,
  type DocumentType,
} from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';

const PROVIDERS: { value: ESignatureProvider; label: string }[] = [
  { value: 'docusign', label: 'DocuSign' },
  { value: 'hellosign', label: 'HelloSign' },
  { value: 'adobe_sign', label: 'Adobe Sign' },
  { value: 'pandadoc', label: 'PandaDoc' },
];

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'enrollment', label: 'Enrollment' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'amendment', label: 'Amendment' },
  { value: 'consent', label: 'Consent' },
];

const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-yellow-100 text-yellow-700',
  signed: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  voided: 'bg-gray-100 text-gray-500',
};

type TabType = 'providers' | 'documents';

export default function ESignature() {
  const { user } = useAdmin();
  const [activeTab, setActiveTab] = useState<TabType>('providers');
  const [providers, setProviders] = useState<ESignatureProviderConfig[]>([]);
  const [documents, setDocuments] = useState<ESignatureDocument[]>([]);
  const [stats, setStats] = useState<{
    total_documents: number;
    pending: number;
    completed: number;
    declined: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ESignatureProviderConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const [providerForm, setProviderForm] = useState({
    name: '',
    provider: 'docusign' as ESignatureProvider,
    webhook_url: '',
    api_key: '',
    api_secret: '',
  });

  const [docForm, setDocForm] = useState({
    name: '',
    document_type: 'enrollment' as DocumentType,
    provider_id: '',
    signers: [{ email: '', name: '' }],
  });

  const loadData = async () => {
    try {
      const [providersData, docsResult, statsData] = await Promise.all([
        eSignatureService.listProviders(),
        eSignatureService.listDocuments(),
        eSignatureService.getStats(),
      ]);
      setProviders(providersData);
      setDocuments(docsResult.data);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load e-signature data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Provider handlers
  const openProviderModal = (provider?: ESignatureProviderConfig) => {
    if (provider) {
      setEditingProvider(provider);
      setProviderForm({
        name: provider.name,
        provider: provider.provider,
        webhook_url: provider.webhook_url || '',
        api_key: '',
        api_secret: '',
      });
    } else {
      setEditingProvider(null);
      setProviderForm({
        name: '',
        provider: 'docusign',
        webhook_url: '',
        api_key: '',
        api_secret: '',
      });
    }
    setShowProviderModal(true);
  };

  const handleProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const config: Record<string, unknown> = {};
      if (providerForm.api_key) config.api_key = providerForm.api_key;
      if (providerForm.api_secret) config.api_secret = providerForm.api_secret;

      if (editingProvider) {
        await eSignatureService.updateProvider(editingProvider.id, {
          name: providerForm.name,
          provider: providerForm.provider,
          webhook_url: providerForm.webhook_url || undefined,
          config: Object.keys(config).length > 0 ? config : undefined,
        }, user.id);
        toast.success('Provider updated');
      } else {
        await eSignatureService.createProvider({
          name: providerForm.name,
          provider: providerForm.provider,
          webhook_url: providerForm.webhook_url || undefined,
          config,
        }, user.id);
        toast.success('Provider created');
      }
      setShowProviderModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to save provider:', err);
      toast.error('Failed to save provider');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!user || !confirm('Delete this provider?')) return;

    try {
      await eSignatureService.deleteProvider(id, user.id);
      toast.success('Provider deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete provider');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;

    try {
      await eSignatureService.setDefaultProvider(id, user.id);
      toast.success('Default provider updated');
      loadData();
    } catch (err) {
      toast.error('Failed to set default');
    }
  };

  const handleTestProvider = async (id: string) => {
    setTesting(id);
    try {
      const result = await eSignatureService.testProviderConnection(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('Connection test failed');
    } finally {
      setTesting(null);
    }
  };

  // Document handlers
  const openDocModal = () => {
    setDocForm({
      name: '',
      document_type: 'enrollment',
      provider_id: providers.find((p) => p.is_default)?.id || providers[0]?.id || '',
      signers: [{ email: '', name: '' }],
    });
    setShowDocModal(true);
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validSigners = docForm.signers.filter((s) => s.email && s.name);
    if (validSigners.length === 0) {
      toast.error('Add at least one signer');
      return;
    }

    setSaving(true);
    try {
      await eSignatureService.createDocument({
        name: docForm.name,
        document_type: docForm.document_type,
        provider_id: docForm.provider_id || undefined,
        signers: validSigners,
      }, user.id);
      toast.success('Document created');
      setShowDocModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to create document:', err);
      toast.error('Failed to create document');
    } finally {
      setSaving(false);
    }
  };

  const handleSendDocument = async (id: string) => {
    if (!user || !confirm('Send this document for signing?')) return;

    try {
      await eSignatureService.sendDocument(id, user.id);
      toast.success('Document sent');
      loadData();
    } catch (err) {
      toast.error('Failed to send document');
    }
  };

  const handleVoidDocument = async (id: string) => {
    if (!user || !confirm('Void this document?')) return;

    try {
      await eSignatureService.voidDocument(id, user.id);
      toast.success('Document voided');
      loadData();
    } catch (err) {
      toast.error('Failed to void document');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!user || !confirm('Delete this document?')) return;

    try {
      await eSignatureService.deleteDocument(id, user.id);
      toast.success('Document deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const addSigner = () => {
    setDocForm({
      ...docForm,
      signers: [...docForm.signers, { email: '', name: '' }],
    });
  };

  const removeSigner = (index: number) => {
    setDocForm({
      ...docForm,
      signers: docForm.signers.filter((_, i) => i !== index),
    });
  };

  const updateSigner = (index: number, field: 'email' | 'name', value: string) => {
    setDocForm({
      ...docForm,
      signers: docForm.signers.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">E-Signature</h1>
          <p className="text-sm text-th-text-tertiary mt-1">Manage document signing providers and documents</p>
        </div>
        <button
          onClick={() => (activeTab === 'providers' ? openProviderModal() : openDocModal())}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {activeTab === 'providers' ? 'Add Provider' : 'Create Document'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-surface-primary rounded-xl border border-th-border p-4">
            <p className="text-sm text-th-text-tertiary">Total Documents</p>
            <p className="text-2xl font-bold text-th-text-primary mt-1">{stats.total_documents}</p>
          </div>
          <div className="bg-surface-primary rounded-xl border border-th-border p-4">
            <p className="text-sm text-th-text-tertiary">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-surface-primary rounded-xl border border-th-border p-4">
            <p className="text-sm text-th-text-tertiary">Completed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
          </div>
          <div className="bg-surface-primary rounded-xl border border-th-border p-4">
            <p className="text-sm text-th-text-tertiary">Declined</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.declined}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-th-border">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('providers')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'providers'
                ? 'border-th-accent-600 text-th-accent-600'
                : 'border-transparent text-th-text-secondary hover:text-th-text-primary'
            }`}
          >
            Providers ({providers.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-th-accent-600 text-th-accent-600'
                : 'border-transparent text-th-text-secondary hover:text-th-text-primary'
            }`}
          >
            Documents ({documents.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : activeTab === 'providers' ? (
          providers.length === 0 ? (
            <div className="text-center py-12">
              <PenTool className="w-12 h-12 text-th-text-tertiary mx-auto mb-3" />
              <p className="text-th-text-secondary">No e-signature providers configured</p>
              <p className="text-sm text-th-text-tertiary mt-1">Add a provider to start sending documents</p>
            </div>
          ) : (
            <div className="divide-y divide-th-border">
              {providers.map((provider) => (
                <div key={provider.id} className="p-4 hover:bg-surface-secondary/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <PenTool className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-th-text-primary">{provider.name}</h3>
                          {provider.is_default && (
                            <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                              <Star className="w-3 h-3" /> Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-th-text-tertiary capitalize">{provider.provider.replace('_', ' ')}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-th-text-tertiary">
                          {provider.is_active ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                          <span>{provider.templates_synced} templates</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestProvider(provider.id)}
                        disabled={testing === provider.id}
                        className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"
                        title="Test Connection"
                      >
                        <TestTube className={`w-4 h-4 text-blue-600 ${testing === provider.id ? 'animate-pulse' : ''}`} />
                      </button>
                      {!provider.is_default && (
                        <button
                          onClick={() => handleSetDefault(provider.id)}
                          className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                          title="Set as Default"
                        >
                          <Star className="w-4 h-4 text-yellow-600" />
                        </button>
                      )}
                      <button
                        onClick={() => openProviderModal(provider)}
                        className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-th-text-secondary" />
                      </button>
                      <button
                        onClick={() => handleDeleteProvider(provider.id)}
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
          )
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-th-text-tertiary mx-auto mb-3" />
            <p className="text-th-text-secondary">No documents yet</p>
            <p className="text-sm text-th-text-tertiary mt-1">Create a document to get signatures</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-th-border bg-surface-secondary">
                  <th className="px-4 py-3 text-left text-sm font-medium text-th-text-tertiary">Document</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-th-text-tertiary">Type</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-th-text-tertiary">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-th-text-tertiary">Signers</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-th-text-tertiary">Created</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-th-text-tertiary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-surface-secondary/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-th-text-primary">{doc.name}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-th-text-secondary capitalize">{doc.document_type}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status]}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4 text-th-text-tertiary" />
                        <span className="text-sm text-th-text-secondary">
                          {doc.signers.filter((s) => s.status === 'signed').length}/{doc.signers.length}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-th-text-tertiary">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {doc.status === 'draft' && (
                          <button
                            onClick={() => handleSendDocument(doc.id)}
                            className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                            title="Send for Signing"
                          >
                            <Send className="w-4 h-4 text-blue-600" />
                          </button>
                        )}
                        {['sent', 'viewed'].includes(doc.status) && (
                          <button
                            onClick={() => handleVoidDocument(doc.id)}
                            className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                            title="Void Document"
                          >
                            <XCircle className="w-4 h-4 text-yellow-600" />
                          </button>
                        )}
                        {doc.signed_document_url && (
                          <a
                            href={doc.signed_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                            title="View Signed Document"
                          >
                            <Eye className="w-4 h-4 text-green-600" />
                          </a>
                        )}
                        {doc.status === 'draft' && (
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provider Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl border border-th-border w-full max-w-lg">
            <div className="border-b border-th-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-th-text-primary">
                {editingProvider ? 'Edit Provider' : 'Add Provider'}
              </h2>
              <button onClick={() => setShowProviderModal(false)} className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProviderSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Name *</label>
                <input
                  type="text"
                  value={providerForm.name}
                  onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Provider</label>
                <select
                  value={providerForm.provider}
                  onChange={(e) => setProviderForm({ ...providerForm, provider: e.target.value as ESignatureProvider })}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">
                  API Key {!editingProvider && '*'}
                </label>
                <input
                  type="password"
                  value={providerForm.api_key}
                  onChange={(e) => setProviderForm({ ...providerForm, api_key: e.target.value })}
                  placeholder={editingProvider ? '(unchanged)' : ''}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  required={!editingProvider}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">API Secret</label>
                <input
                  type="password"
                  value={providerForm.api_secret}
                  onChange={(e) => setProviderForm({ ...providerForm, api_secret: e.target.value })}
                  placeholder={editingProvider ? '(unchanged)' : ''}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={providerForm.webhook_url}
                  onChange={(e) => setProviderForm({ ...providerForm, webhook_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-th-border">
                <button type="button" onClick={() => setShowProviderModal(false)} className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editingProvider ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl border border-th-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface-primary border-b border-th-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-th-text-primary">Create Document</h2>
              <button onClick={() => setShowDocModal(false)} className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDocSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Document Name *</label>
                <input
                  type="text"
                  value={docForm.name}
                  onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Document Type</label>
                <select
                  value={docForm.document_type}
                  onChange={(e) => setDocForm({ ...docForm, document_type: e.target.value as DocumentType })}
                  className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {providers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Provider</label>
                  <select
                    value={docForm.provider_id}
                    onChange={(e) => setDocForm({ ...docForm, provider_id: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.is_default && '(Default)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-th-text-secondary">Signers *</label>
                  <button
                    type="button"
                    onClick={addSigner}
                    className="text-sm text-th-accent-600 hover:text-th-accent-700"
                  >
                    + Add Signer
                  </button>
                </div>
                <div className="space-y-2">
                  {docForm.signers.map((signer, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={signer.name}
                        onChange={(e) => updateSigner(index, 'name', e.target.value)}
                        placeholder="Name"
                        className="flex-1 px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary text-sm"
                      />
                      <input
                        type="email"
                        value={signer.email}
                        onChange={(e) => updateSigner(index, 'email', e.target.value)}
                        placeholder="Email"
                        className="flex-1 px-3 py-2 bg-surface-secondary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary text-sm"
                      />
                      {docForm.signers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSigner(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-th-border">
                <button type="button" onClick={() => setShowDocModal(false)} className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
