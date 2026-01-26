import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  FileText,
  BookOpen,
  Save,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  advisorAuthService,
  TrainingModule,
  SOPDocument,
  OnboardingStep,
} from '../../lib/advisorAuthService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';

type TabType = 'modules' | 'sops' | 'onboarding';

export default function AdvisorTrainingAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('modules');
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [sops, setSops] = useState<SOPDocument[]>([]);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showSOPForm, setShowSOPForm] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    category: 'onboarding',
    content_type: 'document' as const,
    content_url: '',
    duration_minutes: 0,
    is_required: false,
    order_index: 0,
  });

  const [sopForm, setSOPForm] = useState({
    title: '',
    description: '',
    category: 'claims_processing',
    tags: '',
    content: '',
    file_url: '',
    version: '1.0',
  });

  const [stepForm, setStepForm] = useState({
    title: '',
    description: '',
    order_index: 0,
    required_modules: '',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'modules') {
        const data = await advisorAuthService.getTrainingModules();
        setModules(data);
      } else if (activeTab === 'sops') {
        const data = await advisorAuthService.getSOPDocuments();
        setSops(data);
      } else if (activeTab === 'onboarding') {
        const data = await advisorAuthService.getOnboardingSteps();
        setSteps(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModule = async () => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('training_modules')
          .update(moduleForm)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('training_modules')
          .insert([moduleForm]);
        if (error) throw error;
      }
      setShowModuleForm(false);
      setEditingItem(null);
      resetModuleForm();
      loadData();
    } catch (error) {
      console.error('Error saving module:', error);
      alert('Error saving module. Please try again.');
    }
  };

  const handleSaveSOP = async () => {
    try {
      const sopData = {
        ...sopForm,
        tags: sopForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (editingItem) {
        const { error } = await supabase
          .from('sop_documents')
          .update(sopData)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sop_documents')
          .insert([sopData]);
        if (error) throw error;
      }
      setShowSOPForm(false);
      setEditingItem(null);
      resetSOPForm();
      loadData();
    } catch (error) {
      console.error('Error saving SOP:', error);
      alert('Error saving SOP. Please try again.');
    }
  };

  const handleSaveStep = async () => {
    try {
      const stepData = {
        ...stepForm,
        required_modules: stepForm.required_modules
          .split(',')
          .map(m => m.trim())
          .filter(Boolean),
      };

      if (editingItem) {
        const { error } = await supabase
          .from('onboarding_steps')
          .update(stepData)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('onboarding_steps')
          .insert([stepData]);
        if (error) throw error;
      }
      setShowStepForm(false);
      setEditingItem(null);
      resetStepForm();
      loadData();
    } catch (error) {
      console.error('Error saving step:', error);
      alert('Error saving onboarding step. Please try again.');
    }
  };

  const handleDelete = async (id: string, table: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item. Please try again.');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'modules') {
      setModuleForm({
        title: item.title,
        description: item.description || '',
        category: item.category,
        content_type: item.content_type,
        content_url: item.content_url || '',
        duration_minutes: item.duration_minutes,
        is_required: item.is_required,
        order_index: item.order_index,
      });
      setShowModuleForm(true);
    } else if (activeTab === 'sops') {
      setSOPForm({
        title: item.title,
        description: item.description || '',
        category: item.category,
        tags: item.tags.join(', '),
        content: item.content || '',
        file_url: item.file_url || '',
        version: item.version,
      });
      setShowSOPForm(true);
    } else if (activeTab === 'onboarding') {
      setStepForm({
        title: item.title,
        description: item.description || '',
        order_index: item.order_index,
        required_modules: item.required_modules.join(', '),
      });
      setShowStepForm(true);
    }
  };

  const resetModuleForm = () => {
    setModuleForm({
      title: '',
      description: '',
      category: 'onboarding',
      content_type: 'document',
      content_url: '',
      duration_minutes: 0,
      is_required: false,
      order_index: 0,
    });
  };

  const resetSOPForm = () => {
    setSOPForm({
      title: '',
      description: '',
      category: 'claims_processing',
      tags: '',
      content: '',
      file_url: '',
      version: '1.0',
    });
  };

  const resetStepForm = () => {
    setStepForm({
      title: '',
      description: '',
      order_index: 0,
      required_modules: '',
    });
  };

  return (
    <AdminLayout activeView="advisor-training" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <div>
        <AdminBreadcrumb currentPage="Advisor Training" />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Training Content Management
          </h1>
          <p className="text-gray-600">
            Manage training modules, SOPs, and onboarding steps
          </p>
        </div>

        <Card className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('modules')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'modules'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                Training Modules
              </button>
              <button
                onClick={() => setActiveTab('sops')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'sops'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                SOPs
              </button>
              <button
                onClick={() => setActiveTab('onboarding')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'onboarding'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Onboarding Steps
              </button>
            </nav>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeTab === 'modules' && 'Training Modules'}
                {activeTab === 'sops' && 'SOP Documents'}
                {activeTab === 'onboarding' && 'Onboarding Steps'}
              </h2>
              <Button
                onClick={() => {
                  setEditingItem(null);
                  if (activeTab === 'modules') {
                    resetModuleForm();
                    setShowModuleForm(true);
                  } else if (activeTab === 'sops') {
                    resetSOPForm();
                    setShowSOPForm(true);
                  } else {
                    resetStepForm();
                    setShowStepForm(true);
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTab === 'modules' &&
                  modules.map(module => (
                    <Card key={module.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{module.title}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{module.category}</Badge>
                            <Badge variant="outline">{module.content_type}</Badge>
                            {module.is_required && <Badge>Required</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(module)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(module.id, 'training_modules')}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                {activeTab === 'sops' &&
                  sops.map(sop => (
                    <Card key={sop.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{sop.title}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{sop.category}</Badge>
                            <Badge variant="outline">v{sop.version}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(sop)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(sop.id, 'sop_documents')}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                {activeTab === 'onboarding' &&
                  steps.map(step => (
                    <Card key={step.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{step.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Order: {step.order_index}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(step)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(step.id, 'onboarding_steps')}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </Card>

        {showModuleForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Edit' : 'Add'} Training Module
                </h3>
                <button
                  onClick={() => {
                    setShowModuleForm(false);
                    setEditingItem(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <Input
                    value={moduleForm.title}
                    onChange={(e) =>
                      setModuleForm({ ...moduleForm, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={moduleForm.description}
                    onChange={(e) =>
                      setModuleForm({ ...moduleForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={moduleForm.category}
                      onChange={(e) =>
                        setModuleForm({ ...moduleForm, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="onboarding">Onboarding</option>
                      <option value="claims">Claims</option>
                      <option value="compliance">Compliance</option>
                      <option value="product_knowledge">Product Knowledge</option>
                      <option value="customer_service">Customer Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Type *
                    </label>
                    <select
                      value={moduleForm.content_type}
                      onChange={(e) =>
                        setModuleForm({
                          ...moduleForm,
                          content_type: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="video">Video</option>
                      <option value="document">Document</option>
                      <option value="interactive">Interactive</option>
                      <option value="quiz">Quiz</option>
                      <option value="external_link">External Link</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content URL
                  </label>
                  <Input
                    value={moduleForm.content_url}
                    onChange={(e) =>
                      setModuleForm({ ...moduleForm, content_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <Input
                      type="number"
                      value={moduleForm.duration_minutes}
                      onChange={(e) =>
                        setModuleForm({
                          ...moduleForm,
                          duration_minutes: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Index
                    </label>
                    <Input
                      type="number"
                      value={moduleForm.order_index}
                      onChange={(e) =>
                        setModuleForm({
                          ...moduleForm,
                          order_index: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="required"
                    checked={moduleForm.is_required}
                    onChange={(e) =>
                      setModuleForm({ ...moduleForm, is_required: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <label htmlFor="required" className="text-sm text-gray-700">
                    Required module
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSaveModule} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Module
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowModuleForm(false);
                      setEditingItem(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {(showSOPForm || showStepForm) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Edit' : 'Add'}{' '}
                  {showSOPForm ? 'SOP Document' : 'Onboarding Step'}
                </h3>
                <button
                  onClick={() => {
                    setShowSOPForm(false);
                    setShowStepForm(false);
                    setEditingItem(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Form interface ready for {showSOPForm ? 'SOP' : 'onboarding step'}{' '}
                content management
              </p>
              <Button
                onClick={() => {
                  if (showSOPForm) handleSaveSOP();
                  else handleSaveStep();
                }}
              >
                Save
              </Button>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
