import { useState, useEffect } from 'react';
import { Plus, Copy, Trash2, Edit2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { PermissionGate } from '../components/PermissionGate';
import { TemplateModal } from '../components/TemplateModal';
import type { CRMTemplate, TemplateFilters, TemplateType } from '@mpbhealth/crm-core';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'both', label: 'Both' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'nurture', label: 'Nurture' },
];

function TypeBadge({ type }: { type: TemplateType }) {
  const colors = {
    email: 'bg-blue-100 text-blue-700',
    sms: 'bg-green-100 text-green-700',
    both: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[type]}`}>
      {type.toUpperCase()}
    </span>
  );
}

export default function Templates() {
  const { templateService } = useCRM();
  const [templates, setTemplates] = useState<CRMTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TemplateFilters>({});
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<CRMTemplate | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    const data = await templateService.listTemplates(filters);
    setTemplates(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, [filters]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search: search || undefined }));
  };

  const handleTypeFilter = (type: string) => {
    setFilters((prev) => ({ ...prev, template_type: (type || undefined) as TemplateType | undefined }));
  };

  const handleCategoryFilter = (category: string) => {
    setFilters((prev) => ({ ...prev, category: category || undefined }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    const result = await templateService.deleteTemplate(id);
    if (result.success) {
      toast.success('Template deleted');
      loadTemplates();
    } else {
      toast.error(result.error || 'Failed to delete');
    }
  };

  const handleDuplicate = async (id: string) => {
    const result = await templateService.duplicateTemplate(id);
    if (result.success) {
      toast.success('Template duplicated');
      loadTemplates();
    } else {
      toast.error(result.error || 'Failed to duplicate');
    }
  };

  const handleToggleActive = async (template: CRMTemplate) => {
    const result = await templateService.updateTemplate(template.id, {
      is_active: !template.is_active,
    });
    if (result.success) {
      toast.success(template.is_active ? 'Template deactivated' : 'Template activated');
      loadTemplates();
    }
  };

  const openEdit = (template: CRMTemplate) => {
    setEditTemplate(template);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditTemplate(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Templates</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Email and SMS templates for lead communication
          </p>
        </div>
        <PermissionGate permission="settings.manage">
          <button
            onClick={openCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Template</span>
          </button>
        </PermissionGate>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center bg-white border border-neutral-200 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-neutral-400 mr-2" />
          <input
            type="text"
            placeholder="Search templates..."
            onChange={(e) => handleSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-48 text-neutral-700 placeholder-neutral-400"
          />
        </div>
        <select
          onChange={(e) => handleTypeFilter(e.target.value)}
          className="bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-700"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          onChange={(e) => handleCategoryFilter(e.target.value)}
          className="bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-700"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500 text-sm">No templates found</p>
          <button
            onClick={openCreate}
            className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Create your first template
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{template.name}</p>
                      {template.description && (
                        <p className="text-xs text-neutral-500 mt-0.5 truncate max-w-xs">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <TypeBadge type={template.template_type} />
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600 capitalize">
                    {template.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {template.usage_count} uses
                    {template.ai_performance_score !== null && (
                      <span className="ml-2 text-xs text-neutral-400">
                        AI: {template.ai_performance_score}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(template)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                        template.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {template.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEdit(template)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(template.id)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <TemplateModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTemplate(null); }}
        template={editTemplate}
        onSuccess={() => loadTemplates()}
      />
    </div>
  );
}
