import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Mail,
  MessageSquare,
  Edit2,
  Trash2,
  Copy,
  Search,
  Sparkles,
  Save,
  X,
  AlertCircle,
  Eye,
  BarChart2,
} from 'lucide-react';
import { SEOHead } from '../../components/SEOHead';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

// ============================================================================
// Types
// ============================================================================

interface Template {
  id: string;
  name: string;
  description: string | null;
  template_type: 'email' | 'sms' | 'both';
  category: string;
  subject: string | null;
  body: string;
  variables: string[];
  usage_count: number;
  last_used_at: string | null;
  is_ai_generated: boolean;
  ai_performance_score: number | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

interface TemplateFormData {
  name: string;
  description: string;
  template_type: 'email' | 'sms' | 'both';
  category: string;
  subject: string;
  body: string;
}

// ============================================================================
// Template Card Component
// ============================================================================

interface TemplateCardProps {
  template: Template;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
}) => {
  const typeIcon = template.template_type === 'email' ? Mail : 
                   template.template_type === 'sms' ? MessageSquare : Mail;
  const TypeIcon = typeIcon;

  const categoryColors: Record<string, string> = {
    follow_up: 'bg-blue-100 text-blue-700',
    hot_lead: 'bg-red-100 text-red-700',
    appointment: 'bg-purple-100 text-purple-700',
    welcome: 'bg-green-100 text-green-700',
    general: 'bg-gray-100 text-gray-700',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              template.template_type === 'email' ? 'bg-blue-100' :
              template.template_type === 'sms' ? 'bg-green-100' : 'bg-purple-100'
            )}>
              <TypeIcon className={cn(
                'h-5 w-5',
                template.template_type === 'email' ? 'text-blue-600' :
                template.template_type === 'sms' ? 'text-green-600' : 'text-purple-600'
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  categoryColors[template.category] || categoryColors.general
                )}>
                  {template.category.replace(/_/g, ' ')}
                </span>
                {template.is_ai_generated && (
                  <span className="flex items-center gap-1 text-xs text-purple-600">
                    <Sparkles className="h-3 w-3" />
                    AI
                  </span>
                )}
                {template.is_default && (
                  <span className="text-xs text-green-600 font-medium">Default</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={onPreview}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Preview"
            >
              <Eye className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Edit"
            >
              <Edit2 className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={onDuplicate}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Duplicate"
            >
              <Copy className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>

        {template.description && (
          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
        )}

        {template.subject && (
          <div className="text-sm mb-2">
            <span className="text-gray-500">Subject: </span>
            <span className="text-gray-900">{template.subject}</span>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">
            {template.body}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <BarChart2 className="h-3 w-3" />
              {template.usage_count} uses
            </span>
            {template.variables.length > 0 && (
              <span>{template.variables.length} variables</span>
            )}
          </div>
          {template.last_used_at && (
            <span>Last used {new Date(template.last_used_at).toLocaleDateString()}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Template Editor Modal
// ============================================================================

interface TemplateEditorProps {
  template?: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TemplateFormData) => Promise<void>;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    template_type: 'email',
    category: 'general',
    subject: '',
    body: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        template_type: template.template_type,
        category: template.category,
        subject: template.subject || '',
        body: template.body,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        template_type: 'email',
        category: 'general',
        subject: '',
        body: '',
      });
    }
    setError(null);
  }, [template, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.body) {
      setError('Name and body are required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  // Extract variables from body
  const extractedVariables = formData.body.match(/\{\{([^}]+)\}\}/g)?.map(
    v => v.replace(/\{\{|\}\}/g, '').trim()
  ) || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {template ? 'Edit Template' : 'Create Template'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Initial Follow-up"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={formData.template_type}
                  onChange={(e) => setFormData({ ...formData, template_type: e.target.value as TemplateFormData['template_type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="hot_lead">Hot Lead</option>
                  <option value="appointment">Appointment</option>
                  <option value="welcome">Welcome</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Brief description"
                />
              </div>
            </div>

            {(formData.template_type === 'email' || formData.template_type === 'both') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., {{first_name}}, your health plan options"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message Body *
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                placeholder="Hi {{first_name}},&#10;&#10;Thank you for your interest in our health sharing programs..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {"{{variable_name}}"} for dynamic content
              </p>
            </div>

            {extractedVariables.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Detected Variables
                </h4>
                <div className="flex flex-wrap gap-2">
                  {extractedVariables.map((v, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {template ? 'Save Changes' : 'Create Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// Main CRM Templates Page
// ============================================================================

const CRMTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_templates')
        .select('id, name, description, template_type, category, subject, body, variables, usage_count, last_used_at, is_ai_generated, ai_performance_score, is_active, is_default, created_at')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (formData: TemplateFormData) => {
    const variables = formData.body.match(/\{\{([^}]+)\}\}/g)?.map(
      v => v.replace(/\{\{|\}\}/g, '').trim()
    ) || [];

    if (editingTemplate) {
      // Update existing template
      const { error } = await supabase
        .from('crm_templates')
        .update({
          ...formData,
          variables,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;
    } else {
      // Create new template
      const { error } = await supabase
        .from('crm_templates')
        .insert({
          ...formData,
          variables,
          is_active: true,
          usage_count: 0,
        });

      if (error) throw error;
    }

    await loadTemplates();
    setEditingTemplate(null);
    setIsEditorOpen(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    const { error } = await supabase
      .from('crm_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Failed to delete template:', error);
      return;
    }

    await loadTemplates();
  };

  const handleDuplicateTemplate = async (template: Template) => {
    const { error } = await supabase
      .from('crm_templates')
      .insert({
        name: `${template.name} (Copy)`,
        description: template.description,
        template_type: template.template_type,
        category: template.category,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
        is_active: true,
        usage_count: 0,
      });

    if (error) {
      console.error('Failed to duplicate template:', error);
      return;
    }

    await loadTemplates();
  };

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || t.template_type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <AdminLayout activeView="crm-templates" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <SEOHead
        title="CRM Templates | MPB Health Admin"
        description="Manage email and SMS templates for lead outreach"
      />

      <div className="p-6">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'CRM', href: '/admin/crm' },
            { label: 'Templates' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Library</h1>
            <p className="text-gray-500">Create and manage email/SMS templates for outreach</p>
          </div>
          <Button onClick={() => { setEditingTemplate(null); setIsEditorOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="both">Both</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Try a different search term' : 'Create your first template to get started'}
              </p>
              <Button onClick={() => { setEditingTemplate(null); setIsEditorOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => { setEditingTemplate(template); setIsEditorOpen(true); }}
                onDelete={() => handleDeleteTemplate(template.id)}
                onDuplicate={() => handleDuplicateTemplate(template)}
                onPreview={() => setPreviewTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      <TemplateEditor
        template={editingTemplate}
        isOpen={isEditorOpen}
        onClose={() => { setIsEditorOpen(false); setEditingTemplate(null); }}
        onSave={handleSaveTemplate}
      />

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{previewTemplate.name}</h2>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {previewTemplate.subject && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <span className="text-sm text-gray-500">Subject: </span>
                  <span className="text-gray-900 font-medium">{previewTemplate.subject}</span>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{previewTemplate.body}</p>
              </div>
              {previewTemplate.variables.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Variables:</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.variables.map((v, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CRMTemplates;

