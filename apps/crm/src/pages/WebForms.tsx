import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileInput, ChevronDown } from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { PermissionGate } from '../components/PermissionGate';
import { FormCard } from '../components/forms/FormCard';
import { EmbedCodeModal } from '../components/forms/EmbedCodeModal';
import type { WebForm, FormStatus } from '@mpbhealth/crm-core';
import { HelpBanner } from '../components/help';

export default function WebForms() {
  const { formService } = useCRM();
  const navigate = useNavigate();
  const [forms, setForms] = useState<WebForm[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FormStatus | ''>('');

  // Embed modal state
  const [embedModal, setEmbedModal] = useState<{ open: boolean; iframe: string; script: string }>({
    open: false,
    iframe: '',
    script: '',
  });

  const loadForms = useCallback(async () => {
    setLoading(true);
    const { forms, total } = await formService.getForms({
      status: statusFilter || undefined,
      search: search || undefined,
    });
    setForms(forms);
    setTotal(total);
    setLoading(false);
  }, [formService, search, statusFilter]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleDuplicate = async (id: string) => {
    const result = await formService.duplicateForm(id);
    if (result.success) {
      loadForms();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form? This cannot be undone.')) return;
    const result = await formService.deleteForm(id);
    if (result.success) {
      loadForms();
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/forms/${slug}`;
    navigator.clipboard.writeText(url);
  };

  const handleShowEmbed = (form: WebForm) => {
    const { iframe, script } = formService.generateEmbedCode(form.id, window.location.origin);
    setEmbedModal({ open: true, iframe, script });
  };

  const activeForms = forms.filter((f) => f.status === 'active').length;
  const totalSubmissions = forms.reduce((sum, f) => sum + f.submit_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Web Forms</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            {total} form{total !== 1 ? 's' : ''} &middot; {activeForms} active &middot; {totalSubmissions} total submissions
          </p>
        </div>
        <PermissionGate permission="campaigns.write">
          <button
            onClick={() => navigate('/web-forms/new')}
            className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Form</span>
          </button>
        </PermissionGate>
      </div>
      <HelpBanner pageKey="web-forms" title="Welcome to Web Forms" tip="Build custom lead capture forms to embed on your website. Design form fields, set up thank-you pages, and track submissions. Leads from forms are automatically added to your CRM." />

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px] flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
            <input
              type="text"
              placeholder="Search forms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FormStatus | '')}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Forms grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-surface-primary rounded-xl border border-th-border flex flex-col items-center justify-center h-64 text-th-text-tertiary">
          <FileInput className="w-12 h-12 mb-4 opacity-50" />
          <p>No forms found</p>
          <p className="text-sm mt-1">Create your first web form to start capturing leads</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {forms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onCopyLink={handleCopyLink}
              onShowEmbed={handleShowEmbed}
            />
          ))}
        </div>
      )}

      {/* Embed code modal */}
      <EmbedCodeModal
        open={embedModal.open}
        onClose={() => setEmbedModal({ open: false, iframe: '', script: '' })}
        iframe={embedModal.iframe}
        script={embedModal.script}
      />
    </div>
  );
}
