import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  CheckCircle,
  GripVertical,
  Clock,
  BookOpen,
  Target,
  Award,
  Search,
  Play,
  Lock,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Textarea } from '../../../components/ui/Textarea';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../../components/admin/AdminBreadcrumb';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

interface LearningPath {
  id: string;
  title: string;
  description: string | null;
  category_slug: string | null;
  icon: string;
  gradient: string;
  estimated_hours: number;
  is_required: boolean;
  unlock_requirements: any;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TrainingModule {
  id: string;
  title: string;
  description: string | null;
  category: string;
  type: 'video' | 'article' | 'quiz' | 'interactive';
  duration_minutes: number;
  thumbnail_url: string | null;
  content_url: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const AVAILABLE_GRADIENTS = [
  { value: 'bg-gradient-to-br from-blue-500 to-blue-600', label: 'Blue' },
  { value: 'bg-gradient-to-br from-purple-500 to-purple-600', label: 'Purple' },
  { value: 'bg-gradient-to-br from-green-500 to-green-600', label: 'Green' },
  { value: 'bg-gradient-to-br from-orange-500 to-orange-600', label: 'Orange' },
  { value: 'bg-gradient-to-br from-indigo-500 to-indigo-600', label: 'Indigo' },
  { value: 'bg-gradient-to-br from-pink-500 to-pink-600', label: 'Pink' },
  { value: 'bg-gradient-to-br from-red-500 to-red-600', label: 'Red' },
  { value: 'bg-gradient-to-br from-teal-500 to-teal-600', label: 'Teal' },
];

const PATH_ICONS = ['BookOpen', 'Target', 'Award', 'TrendingUp', 'GraduationCap', 'Lightbulb', 'Rocket'];

// ============================================================================
// Main Component
// ============================================================================

export default function TrainingManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'paths' | 'modules'>('paths');
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [pathForm, setPathForm] = useState<Partial<LearningPath>>({});
  const [moduleForm, setModuleForm] = useState<Partial<TrainingModule>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pathsResult, modulesResult, categoriesResult] = await Promise.all([
        supabase
          .from('advisor_learning_paths')
          .select('id, title, description, category_slug, icon, gradient, estimated_hours, is_required, unlock_requirements, order_index, is_active, created_at, updated_at')
          .order('order_index', { ascending: true }),
        supabase
          .from('training_modules')
          .select('id, title, description, category, content_type, duration_minutes, thumbnail_url, content_url, order_index, is_active, created_at, updated_at')
          .order('order_index', { ascending: true }),
        supabase
          .from('advisor_categories')
          .select('id, name, slug')
          .eq('type', 'training')
          .order('order_index', { ascending: true }),
      ]);

      if (pathsResult.error) throw pathsResult.error;
      if (modulesResult.error) throw modulesResult.error;

      setLearningPaths(pathsResult.data || []);
      setModules(modulesResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error('Error loading training data:', error);
      toast.error('Failed to load training data');
    } finally {
      setLoading(false);
    }
  };

  // Learning Path handlers
  const handleCreatePath = () => {
    setEditingPath(null);
    setPathForm({
      title: '',
      description: '',
      category_slug: categories[0]?.slug || null,
      icon: 'BookOpen',
      gradient: AVAILABLE_GRADIENTS[0].value,
      estimated_hours: 1,
      is_required: false,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEditPath = (path: LearningPath) => {
    setEditingPath(path);
    setPathForm(path);
    setShowModal(true);
  };

  const handleSavePath = async () => {
    if (!pathForm.title) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      if (editingPath) {
        const { error } = await supabase
          .from('advisor_learning_paths')
          .update({
            title: pathForm.title,
            description: pathForm.description,
            category_slug: pathForm.category_slug,
            icon: pathForm.icon || 'BookOpen',
            gradient: pathForm.gradient,
            estimated_hours: pathForm.estimated_hours || 1,
            is_required: pathForm.is_required,
            is_active: pathForm.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPath.id);

        if (error) throw error;
        toast.success('Learning path updated! Changes are live.');
      } else {
        const maxOrder = Math.max(...learningPaths.map(p => p.order_index), 0);
        const { error } = await supabase
          .from('advisor_learning_paths')
          .insert({
            title: pathForm.title,
            description: pathForm.description,
            category_slug: pathForm.category_slug,
            icon: pathForm.icon || 'BookOpen',
            gradient: pathForm.gradient,
            estimated_hours: pathForm.estimated_hours || 1,
            is_required: pathForm.is_required ?? false,
            is_active: pathForm.is_active ?? true,
            order_index: maxOrder + 1,
          });

        if (error) throw error;
        toast.success('Learning path created!');
      }

      setShowModal(false);
      setEditingPath(null);
      loadData();
    } catch (error) {
      console.error('Error saving learning path:', error);
      toast.error('Failed to save learning path');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePath = async (id: string) => {
    if (!confirm('Are you sure you want to delete this learning path?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('advisor_learning_paths')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Learning path deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting learning path:', error);
      toast.error('Failed to delete learning path');
    } finally {
      setSaving(false);
    }
  };

  // Module handlers
  const handleCreateModule = () => {
    setEditingModule(null);
    setModuleForm({
      title: '',
      description: '',
      category: categories[0]?.slug || 'onboarding',
      type: 'video',
      duration_minutes: 10,
      is_published: false,
    });
    setShowModal(true);
  };

  const handleEditModule = (module: TrainingModule) => {
    setEditingModule(module);
    setModuleForm(module);
    setShowModal(true);
  };

  const handleSaveModule = async () => {
    if (!moduleForm.title) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      if (editingModule) {
        const { error } = await supabase
          .from('training_modules')
          .update({
            title: moduleForm.title,
            description: moduleForm.description,
            category: moduleForm.category,
            type: moduleForm.type,
            duration_minutes: moduleForm.duration_minutes || 10,
            content_url: moduleForm.content_url,
            thumbnail_url: moduleForm.thumbnail_url,
            is_published: moduleForm.is_published,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingModule.id);

        if (error) throw error;
        toast.success('Module updated! Changes are live.');
      } else {
        const maxOrder = Math.max(...modules.map(m => m.order_index), 0);
        const { error } = await supabase
          .from('training_modules')
          .insert({
            title: moduleForm.title,
            description: moduleForm.description,
            category: moduleForm.category || 'onboarding',
            type: moduleForm.type || 'video',
            duration_minutes: moduleForm.duration_minutes || 10,
            content_url: moduleForm.content_url,
            thumbnail_url: moduleForm.thumbnail_url,
            is_published: moduleForm.is_published ?? false,
            order_index: maxOrder + 1,
          });

        if (error) throw error;
        toast.success('Module created!');
      }

      setShowModal(false);
      setEditingModule(null);
      loadData();
    } catch (error) {
      console.error('Error saving module:', error);
      toast.error('Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('training_modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Module deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    } finally {
      setSaving(false);
    }
  };

  // Filter items
  const filteredPaths = learningPaths.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredModules = modules.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout activeView="advisor-portal-cms" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <AdminBreadcrumb currentPage="Training Manager" />
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Training Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Manage learning paths and training modules
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/advisor-cms">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to CMS
              </Button>
            </Link>
            <Button onClick={activeTab === 'paths' ? handleCreatePath : handleCreateModule}>
              <Plus className="w-4 h-4 mr-2" />
              Add {activeTab === 'paths' ? 'Path' : 'Module'}
            </Button>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800">
            Training content syncs to Advisor Portal &gt; Training
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('paths')}
            className={cn(
              'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'paths'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Learning Paths ({learningPaths.length})
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={cn(
              'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'modules'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Modules ({modules.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="pl-10"
          />
        </div>

        {/* Learning Paths */}
        {activeTab === 'paths' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Learning Paths
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : filteredPaths.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No learning paths found</p>
                  <Button onClick={handleCreatePath} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Path
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPaths.map((path) => (
                    <div
                      key={path.id}
                      className={cn(
                        'relative rounded-xl p-5 text-white overflow-hidden',
                        path.gradient,
                        !path.is_active && 'opacity-50'
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        {path.is_required && (
                          <Badge className="bg-white/20 text-white border-0">Required</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{path.title}</h3>
                      <p className="text-white/80 text-sm line-clamp-2 mb-3">
                        {path.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-white/70 mb-4">
                        <Clock className="w-4 h-4" />
                        {path.estimated_hours}h estimated
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPath(path)}
                          className="bg-white/20 hover:bg-white/30 text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePath(path.id)}
                          className="bg-white/20 hover:bg-white/30 text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modules */}
        {activeTab === 'modules' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Training Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : filteredModules.length === 0 ? (
                <div className="text-center py-12">
                  <Play className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No modules found</p>
                  <Button onClick={handleCreateModule} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Module
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredModules.map((module) => (
                    <div
                      key={module.id}
                      className={cn(
                        'flex items-center gap-4 p-4 border rounded-lg',
                        module.is_published ? 'bg-white' : 'bg-gray-50 opacity-60'
                      )}
                    >
                      <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {module.thumbnail_url ? (
                          <img
                            src={module.thumbnail_url}
                            alt={`Thumbnail for ${module.title}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Play className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{module.title}</h3>
                          <Badge variant={module.is_published ? 'default' : 'secondary'}>
                            {module.is_published ? 'Published' : 'Draft'}
                          </Badge>
                          <Badge variant="outline">{module.type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>{module.category}</span>
                          <span>{module.duration_minutes} min</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditModule(module)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteModule(module.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Path Modal */}
        {showModal && activeTab === 'paths' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">
                  {editingPath ? 'Edit Learning Path' : 'Create Learning Path'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <Input
                    value={pathForm.title || ''}
                    onChange={(e) => setPathForm({ ...pathForm, title: e.target.value })}
                    placeholder="Path title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <Textarea
                    value={pathForm.description || ''}
                    onChange={(e) => setPathForm({ ...pathForm, description: e.target.value })}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={pathForm.category_slug || ''}
                      onChange={(e) => setPathForm({ ...pathForm, category_slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {categories.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                    <Input
                      type="number"
                      value={pathForm.estimated_hours || 1}
                      onChange={(e) => setPathForm({ ...pathForm, estimated_hours: parseFloat(e.target.value) || 1 })}
                      min={0.5}
                      step={0.5}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color Theme</label>
                  <div className="flex gap-2 flex-wrap">
                    {AVAILABLE_GRADIENTS.map((g) => (
                      <button
                        key={g.value}
                        onClick={() => setPathForm({ ...pathForm, gradient: g.value })}
                        className={cn(
                          'w-10 h-10 rounded-lg transition-all',
                          g.value,
                          pathForm.gradient === g.value && 'ring-2 ring-offset-2 ring-gray-900'
                        )}
                        title={g.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={pathForm.is_required === true}
                      onChange={(e) => setPathForm({ ...pathForm, is_required: e.target.checked })}
                    />
                    <span className="text-sm">Required path</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={pathForm.is_active !== false}
                      onChange={(e) => setPathForm({ ...pathForm, is_active: e.target.checked })}
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setShowModal(false); setEditingPath(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleSavePath} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Module Modal */}
        {showModal && activeTab === 'modules' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">
                  {editingModule ? 'Edit Module' : 'Create Module'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <Input
                    value={moduleForm.title || ''}
                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                    placeholder="Module title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <Textarea
                    value={moduleForm.description || ''}
                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={moduleForm.category || ''}
                      onChange={(e) => setModuleForm({ ...moduleForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {categories.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={moduleForm.type || 'video'}
                      onChange={(e) => setModuleForm({ ...moduleForm, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="video">Video</option>
                      <option value="article">Article</option>
                      <option value="quiz">Quiz</option>
                      <option value="interactive">Interactive</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <Input
                      type="number"
                      value={moduleForm.duration_minutes || 10}
                      onChange={(e) => setModuleForm({ ...moduleForm, duration_minutes: parseInt(e.target.value) || 10 })}
                      min={1}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content URL</label>
                  <Input
                    value={moduleForm.content_url || ''}
                    onChange={(e) => setModuleForm({ ...moduleForm, content_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={moduleForm.is_published === true}
                      onChange={(e) => setModuleForm({ ...moduleForm, is_published: e.target.checked })}
                    />
                    <span className="text-sm">Published</span>
                  </label>
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setShowModal(false); setEditingModule(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveModule} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
