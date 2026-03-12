import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  GripVertical,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  Briefcase,
  Users,
  CheckCircle,
  AlertCircle,
  Code,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Textarea';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import {
  formsService,
  type CognitoFormRecord,
  type CreateFormInput,
  AVAILABLE_FORM_ICONS,
  MENU_SECTIONS,
} from '../../lib/formsService';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { sanitizeHtml } from '@mpbhealth/utils';

// ============================================================================
// Types
// ============================================================================

type TabType = 'all' | 'employer' | 'member';

// ============================================================================
// Main Component
// ============================================================================

const FormsManager: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableAvailable, setTableAvailable] = useState(true);

  // Data states
  const [forms, setForms] = useState<CognitoFormRecord[]>([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingForm, setEditingForm] = useState<CognitoFormRecord | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<CreateFormInput>>({
    slug: '',
    label: '',
    category: 'member',
    description: '',
    icon: 'FileText',
    estimated_minutes: 5,
    cognito_embed: '',
    is_active: true,
    requires_auth: false,
    show_in_menu: false,
    menu_section: 'member-forms',
    menu_order: 99,
  });

  // Preview state
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    checkTableAndLoadData();
  }, []);

  const checkTableAndLoadData = async () => {
    const available = await formsService.isFormsTableAvailable();
    setTableAvailable(available);
    await loadData();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const allForms = await formsService.getAllForms();
      setForms(allForms);
    } catch (error) {
      console.error('Error loading forms:', error);
      toast.error('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  // Filter forms by tab
  const filteredForms = activeTab === 'all' 
    ? forms 
    : forms.filter(form => form.category === activeTab);

  // ============================================================================
  // Drag and Drop Handler
  // ============================================================================

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    // Reorder locally
    const reordered = Array.from(filteredForms);
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, removed);

    // Update full forms array
    const newForms = forms.map(form => {
      const reorderedIndex = reordered.findIndex(r => r.id === form.id);
      if (reorderedIndex !== -1) {
        return { ...form, sort_order: reorderedIndex + 1 };
      }
      return form;
    });
    setForms(newForms);

    // Save to database
    setSaving(true);
    try {
      const result = await formsService.reorderForms(reordered.map(f => f.id));
      if (result.success) {
        toast.success('Order updated');
      } else {
        toast.error(result.error || 'Failed to reorder');
        await loadData(); // Reload on error
      }
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder');
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // CRUD Handlers
  // ============================================================================

  const openCreateModal = () => {
    setEditingForm(null);
    setFormData({
      slug: '',
      label: '',
      category: 'member',
      description: '',
      icon: 'FileText',
      estimated_minutes: 5,
      cognito_embed: '',
      is_active: true,
      requires_auth: false,
      show_in_menu: false,
      menu_section: 'member-forms',
      menu_order: 99,
    });
    setShowPreview(false);
    setShowModal(true);
  };

  const openEditModal = (form: CognitoFormRecord) => {
    setEditingForm(form);
    setFormData({
      slug: form.slug,
      label: form.label,
      category: form.category,
      description: form.description || '',
      icon: form.icon,
      estimated_minutes: form.estimated_minutes,
      cognito_embed: form.cognito_embed || '',
      is_active: form.is_active,
      requires_auth: form.requires_auth,
      show_in_menu: form.show_in_menu || false,
      menu_section: form.menu_section || 'member-forms',
      menu_order: form.menu_order || 99,
    });
    setShowPreview(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.label || !formData.slug) {
      toast.error('Label and slug are required');
      return;
    }

    setSaving(true);
    try {
      let result;
      if (editingForm) {
        result = await formsService.updateForm(editingForm.id, formData);
      } else {
        result = await formsService.createForm(formData as CreateFormInput);
      }

      if (result.success) {
        toast.success(editingForm ? 'Form updated' : 'Form created');
        setShowModal(false);
        await loadData();
      } else {
        toast.error(result.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form? This cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      const result = await formsService.deleteForm(id);
      if (result.success) {
        toast.success('Form deleted');
        await loadData();
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An error occurred while deleting');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setSaving(true);
    try {
      const result = await formsService.toggleFormActive(id, !currentStatus);
      if (result.success) {
        toast.success('Visibility updated');
        await loadData();
      }
    } catch (error) {
      console.error('Toggle error:', error);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  const tabs = [
    { id: 'all' as TabType, label: 'All Forms', icon: FileText, count: forms.length },
    { id: 'employer' as TabType, label: 'Employer Forms', icon: Briefcase, count: forms.filter(f => f.category === 'employer').length },
    { id: 'member' as TabType, label: 'Member Forms', icon: Users, count: forms.filter(f => f.category === 'member').length },
  ];

  return (
    <AdminLayout activeView="forms-manager" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Forms Manager - Admin - MPB Health</title>
        <meta name="description" content="Manage Cognito Forms" />
      </Helmet>

      <div className="p-6">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Forms Manager', href: '/admin/forms' },
          ]}
        />

        <div className="mt-4 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Forms Manager</h1>
            <p className="text-gray-600 mt-1">
              Manage Cognito Forms embed codes and form configurations
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add Form
            </Button>
          </div>
        </div>

        {!tableAvailable && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <span className="text-yellow-800 font-medium">Database table not found.</span>
              <span className="text-yellow-700 ml-1">Using static fallback. Run the migration to enable saving.</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Card className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <Badge variant="outline" className="ml-1">
                      {tab.count}
                    </Badge>
                  </button>
                );
              })}
            </nav>
          </div>

          <CardContent className="pt-6">
            {/* Action Bar */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-600">
                Drag items to reorder. Changes are saved automatically.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No forms found</p>
                <Button onClick={openCreateModal} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Form
                </Button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="forms">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                      {filteredForms.map((form, index) => (
                        <Draggable key={form.id} draggableId={form.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                'flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow',
                                !form.is_active && 'opacity-50 bg-gray-50'
                              )}
                            >
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical className="w-5 h-5 text-gray-400" />
                              </div>
                              
                              {/* Category Badge */}
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  form.category === 'employer' 
                                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                    : 'bg-green-50 text-green-700 border-green-200'
                                )}
                              >
                                {form.category === 'employer' ? <Briefcase className="w-3 h-3 mr-1" /> : <Users className="w-3 h-3 mr-1" />}
                                {form.category}
                              </Badge>

                              {/* Form Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{form.label}</span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">{form.slug}</p>
                              </div>

                              {/* Embed Status */}
                              <div className="flex items-center gap-2">
                                {form.cognito_embed ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Configured
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    No Embed
                                  </Badge>
                                )}
                              </div>

                              {/* Time Estimate */}
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                {form.estimated_minutes}m
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleActive(form.id, form.is_active)}
                                  title={form.is_active ? 'Hide form' : 'Show form'}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  {form.is_active ? (
                                    <Eye className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                                <button 
                                  onClick={() => openEditModal(form)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <Edit2 className="w-4 h-4 text-blue-600" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(form.id)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                                <a
                                  href={form.slug}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <ExternalLink className="w-4 h-4 text-gray-400" />
                                </a>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total Forms</div>
            <div className="text-2xl font-bold text-gray-900">{forms.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Active Forms</div>
            <div className="text-2xl font-bold text-green-600">{forms.filter(f => f.is_active).length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Configured</div>
            <div className="text-2xl font-bold text-blue-600">{forms.filter(f => f.cognito_embed).length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Pending Embed</div>
            <div className="text-2xl font-bold text-yellow-600">{forms.filter(f => !f.cognito_embed).length}</div>
          </Card>
        </div>

        {/* Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {editingForm ? 'Edit Form' : 'Create New Form'}
                </CardTitle>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Label */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Form Label *
                    </label>
                    <Input
                      value={formData.label || ''}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="e.g., Member Feedback"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL Slug *
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-500 text-sm mr-1">mpb.health</span>
                      <Input
                        value={formData.slug || ''}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="/member-feedback/"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Include leading and trailing slashes, e.g., /member-feedback/
                    </p>
                  </div>

                  {/* Category & Icon */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category || 'member'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as 'employer' | 'member' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="member">Member Form</option>
                        <option value="employer">Employer Form</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Icon
                      </label>
                      <select
                        value={formData.icon || 'FileText'}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {AVAILABLE_FORM_ICONS.map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Input
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the form"
                    />
                  </div>

                  {/* Estimated Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Minutes
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.estimated_minutes || 5}
                      onChange={(e) => setFormData({ ...formData, estimated_minutes: parseInt(e.target.value) || 5 })}
                    />
                  </div>

                  {/* Cognito Embed Code */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        <Code className="w-4 h-4 inline mr-1" />
                        Cognito Embed Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                      </button>
                    </div>
                    <Textarea
                      value={formData.cognito_embed || ''}
                      onChange={(e) => setFormData({ ...formData, cognito_embed: e.target.value })}
                      placeholder='Paste an iframe embed code here, e.g.:
<iframe src="https://www.cognitoforms.com/f/YOUR_KEY/123" style="border:0;width:100%" height="1400"></iframe>'
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Copy the embed code from Cognito Forms → Publish → Embed
                    </p>

                    {/* Preview */}
                    {showPreview && formData.cognito_embed && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                        <div 
                          className="bg-white border rounded p-4"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.cognito_embed, { ADD_TAGS: ['iframe', 'script'], ADD_ATTR: ['src', 'frameborder', 'allowfullscreen', 'allow', 'loading', 'scrolling'] }) }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Toggles */}
                  <div className="flex gap-6 pt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active !== false}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Active (visible to users)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.requires_auth || false}
                        onChange={(e) => setFormData({ ...formData, requires_auth: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Requires login</span>
                    </label>
                  </div>

                  {/* Menu Visibility */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Navigation Menu Settings
                    </h4>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.show_in_menu || false}
                        onChange={(e) => setFormData({ ...formData, show_in_menu: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Show in navigation mega menu</span>
                    </label>
                    {formData.show_in_menu && (
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Menu Section
                          </label>
                          <select
                            value={formData.menu_section || 'member-forms'}
                            onChange={(e) => setFormData({ ...formData, menu_section: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            {MENU_SECTIONS.map((section) => (
                              <option key={section.value} value={section.value}>
                                {section.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Menu Order
                          </label>
                          <Input
                            type="number"
                            value={formData.menu_order || 99}
                            onChange={(e) => setFormData({ ...formData, menu_order: parseInt(e.target.value) || 99 })}
                            min={1}
                            max={99}
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-blue-600">
                      When enabled, this form will appear in the Members mega menu for all visitors.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    {editingForm ? 'Save Changes' : 'Create Form'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default FormsManager;

