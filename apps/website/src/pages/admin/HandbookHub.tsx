import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  BookOpen,
  Download,
  ExternalLink,
  Copy,
  Check,
  Search,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Heart,
  Star,
  Zap,
  Building2,
  Users,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  GripVertical,
  Loader2,
  AlertCircle,
  FileText,
  Briefcase,
  Award,
  CheckCircle,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';
import MigratedToAdminPortal from '../../components/admin/MigratedToAdminPortal';
import {
  handbooksService,
  type HandbookRecord,
  type CreateHandbookInput,
  type PlanType,
  AVAILABLE_HANDBOOK_ICONS,
  AVAILABLE_COLORS,
  PLAN_TYPES,
} from '../../lib/handbooksService';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

// ============================================================================
// Icon Component Map
// ============================================================================

const IconMap: Record<string, React.FC<{ className?: string }>> = {
  BookOpen,
  Heart,
  Shield,
  Star,
  Zap,
  Building2,
  Users,
  FileText,
  Briefcase,
  Award,
  CheckCircle,
  Sparkles,
};

const getIcon = (iconName: string) => {
  const Icon = IconMap[iconName] || BookOpen;
  return <Icon className="h-6 w-6" />;
};

// ============================================================================
// Types
// ============================================================================

type TabType = 'all' | PlanType;

// ============================================================================
// Main Component
// ============================================================================

const HandbookHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableAvailable, setTableAvailable] = useState(true);

  // Data states
  const [handbooks, setHandbooks] = useState<HandbookRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingHandbook, setEditingHandbook] = useState<HandbookRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<CreateHandbookInput>>({
    slug: '',
    name: '',
    description: '',
    pdf_path: '',
    plan_type: 'individual',
    color: 'blue',
    icon: 'BookOpen',
    features: [],
    is_active: true,
  });
  const [featuresInput, setFeaturesInput] = useState('');

  useEffect(() => {
    checkTableAndLoadData();
  }, []);

  const checkTableAndLoadData = async () => {
    const available = await handbooksService.isHandbooksTableAvailable();
    setTableAvailable(available);
    await loadData();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const allHandbooks = await handbooksService.getAllHandbooks();
      setHandbooks(allHandbooks);
    } catch (error) {
      console.error('Error loading handbooks:', error);
      toast.error('Failed to load handbooks');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      name: '',
      description: '',
      pdf_path: '',
      plan_type: 'individual',
      color: 'blue',
      icon: 'BookOpen',
      features: [],
      is_active: true,
    });
    setFeaturesInput('');
    setEditingHandbook(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (handbook: HandbookRecord) => {
    setEditingHandbook(handbook);
    setFormData({
      slug: handbook.slug,
      name: handbook.name,
      description: handbook.description || '',
      pdf_path: handbook.pdf_path,
      plan_type: handbook.plan_type,
      color: handbook.color,
      icon: handbook.icon,
      features: handbook.features,
      is_active: handbook.is_active,
    });
    setFeaturesInput(handbook.features.join(', '));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug || !formData.pdf_path) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // Parse features from comma-separated string
      const features = featuresInput
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const input: CreateHandbookInput = {
        slug: formData.slug!,
        name: formData.name!,
        description: formData.description,
        pdf_path: formData.pdf_path!,
        plan_type: formData.plan_type!,
        color: formData.color,
        icon: formData.icon,
        features,
        is_active: formData.is_active,
      };

      let result;
      if (editingHandbook) {
        result = await handbooksService.updateHandbook(editingHandbook.id, input);
      } else {
        result = await handbooksService.createHandbook(input);
      }

      if (result.success) {
        toast.success(editingHandbook ? 'Handbook updated!' : 'Handbook created!');
        closeModal();
        await loadData();
      } else {
        toast.error(result.error || 'Failed to save handbook');
      }
    } catch (error) {
      console.error('Error saving handbook:', error);
      toast.error('Failed to save handbook');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      const result = await handbooksService.deleteHandbook(id);
      if (result.success) {
        toast.success('Handbook deleted');
        setDeleteConfirm(null);
        await loadData();
      } else {
        toast.error(result.error || 'Failed to delete handbook');
      }
    } catch (error) {
      console.error('Error deleting handbook:', error);
      toast.error('Failed to delete handbook');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (handbook: HandbookRecord) => {
    try {
      const result = await handbooksService.toggleHandbookVisibility(handbook.id, !handbook.is_active);
      if (result.success) {
        toast.success(handbook.is_active ? 'Handbook hidden' : 'Handbook visible');
        await loadData();
      } else {
        toast.error(result.error || 'Failed to update visibility');
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(filteredHandbooks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for responsiveness
    setHandbooks(items);

    // Persist to database
    const orderedIds = items.map((h) => h.id);
    const updateResult = await handbooksService.reorderHandbooks(orderedIds);
    if (!updateResult.success) {
      toast.error('Failed to save order');
      await loadData(); // Reload on failure
    }
  };

  const getBaseUrl = () => window.location.origin;

  const getShareableLink = (handbook: HandbookRecord) => {
    return `${getBaseUrl()}/3d-flip-book/${handbook.slug}`;
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = (handbook: HandbookRecord) => {
    const link = document.createElement('a');
    link.href = handbook.pdf_path;
    link.download = handbook.pdf_path.split('/').pop() || 'handbook.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = (handbook: HandbookRecord) => {
    window.open(`/3d-flip-book/${handbook.slug}`, '_blank');
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; light: string }> = {
      blue: { bg: 'bg-blue-600', border: 'border-blue-200', text: 'text-blue-600', light: 'bg-blue-50' },
      green: { bg: 'bg-green-600', border: 'border-green-200', text: 'text-green-600', light: 'bg-green-50' },
      emerald: { bg: 'bg-emerald-600', border: 'border-emerald-200', text: 'text-emerald-600', light: 'bg-emerald-50' },
      sky: { bg: 'bg-sky-600', border: 'border-sky-200', text: 'text-sky-600', light: 'bg-sky-50' },
      purple: { bg: 'bg-purple-600', border: 'border-purple-200', text: 'text-purple-600', light: 'bg-purple-50' },
      amber: { bg: 'bg-amber-600', border: 'border-amber-200', text: 'text-amber-600', light: 'bg-amber-50' },
      indigo: { bg: 'bg-indigo-600', border: 'border-indigo-200', text: 'text-indigo-600', light: 'bg-indigo-50' },
      slate: { bg: 'bg-slate-600', border: 'border-slate-200', text: 'text-slate-600', light: 'bg-slate-50' },
      teal: { bg: 'bg-teal-600', border: 'border-teal-200', text: 'text-teal-600', light: 'bg-teal-50' },
      pink: { bg: 'bg-pink-600', border: 'border-pink-200', text: 'text-pink-600', light: 'bg-pink-50' },
      rose: { bg: 'bg-rose-600', border: 'border-rose-200', text: 'text-rose-600', light: 'bg-rose-50' },
      orange: { bg: 'bg-orange-600', border: 'border-orange-200', text: 'text-orange-600', light: 'bg-orange-50' },
    };
    return colors[color] || colors.blue;
  };

  const getPlanTypeLabel = (type: string) => {
    const found = PLAN_TYPES.find((p) => p.value === type);
    return found?.label || type;
  };

  const getPlanTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      individual: 'bg-blue-100 text-blue-700',
      family: 'bg-pink-100 text-pink-700',
      employer: 'bg-purple-100 text-purple-700',
      hsa: 'bg-emerald-100 text-emerald-700',
      general: 'bg-slate-100 text-slate-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  // Filter handbooks
  const filteredHandbooks = handbooks.filter((handbook) => {
    const matchesSearch =
      !searchQuery ||
      handbook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      handbook.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeTab === 'all' || handbook.plan_type === activeTab;
    return matchesSearch && matchesType;
  });

  // Stats
  const stats = {
    total: handbooks.length,
    active: handbooks.filter((h) => h.is_active).length,
    individual: handbooks.filter((h) => h.plan_type === 'individual').length,
    family: handbooks.filter((h) => h.plan_type === 'family').length,
    hsa: handbooks.filter((h) => h.plan_type === 'hsa').length,
  };

  if (loading) {
    return (
      <AdminLayout activeView="handbooks" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeView="handbooks" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Member Handbooks - Admin - MPB Health</title>
        <meta name="description" content="Manage member handbooks - add, edit, hide, and share" />
      </Helmet>

      <MigratedToAdminPortal adminPath="/content/handbooks" sectionName="Member Handbooks" />

      <div>
        <AdminBreadcrumb currentPage="Member Handbooks" />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Member Handbooks</h1>
              <p className="mt-2 text-neutral-600">
                Manage, share, and organize handbook links for members and advisors
              </p>
            </div>
            <Button onClick={openCreateModal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Handbook
            </Button>
          </div>
        </div>

        {/* Database Warning */}
        {!tableAvailable && (
          <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Database Not Configured</h4>
                <p className="text-sm text-amber-700 mt-1">
                  The handbooks table doesn't exist yet. Run the migration to enable full CMS functionality.
                  Currently showing static fallback data.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 bg-blue-50 border-l-4 border-blue-600">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-neutral-600">Total</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-green-50 border-l-4 border-green-600">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-sm font-medium text-neutral-600">Active</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.active}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-sky-50 border-l-4 border-sky-600">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-sky-600" />
              <div>
                <div className="text-sm font-medium text-neutral-600">Individual</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.individual}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-pink-50 border-l-4 border-pink-600">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-pink-600" />
              <div>
                <div className="text-sm font-medium text-neutral-600">Family</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.family}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-l-4 border-emerald-600">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-emerald-600" />
              <div>
                <div className="text-sm font-medium text-neutral-600">HSA</div>
                <div className="text-2xl font-bold text-neutral-900">{stats.hsa}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search handbooks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('all')}
              >
                All
              </Button>
              {PLAN_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={activeTab === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Handbooks List with Drag & Drop */}
        <Card className="mb-6">
          <div className="p-4 border-b border-neutral-200">
            <h3 className="font-semibold text-neutral-900">
              Handbooks ({filteredHandbooks.length})
            </h3>
            <p className="text-sm text-neutral-500">Drag to reorder. Changes save automatically.</p>
          </div>
          <div className="p-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="handbooks">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {filteredHandbooks.map((handbook, index) => {
                      const colors = getColorClasses(handbook.color);
                      return (
                        <Draggable key={handbook.id} draggableId={handbook.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                'flex items-center gap-4 p-4 bg-white border rounded-lg transition-shadow',
                                snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-sm',
                                !handbook.is_active && 'opacity-60'
                              )}
                            >
                              {/* Drag Handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600"
                              >
                                <GripVertical className="h-5 w-5" />
                              </div>

                              {/* Icon */}
                              <div className={cn('p-2 rounded-lg', colors.light, colors.text)}>
                                {getIcon(handbook.icon)}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-neutral-900 truncate">
                                    {handbook.name}
                                  </h4>
                                  <Badge className={getPlanTypeColor(handbook.plan_type)}>
                                    {getPlanTypeLabel(handbook.plan_type)}
                                  </Badge>
                                  {!handbook.is_active && (
                                    <Badge variant="outline" className="text-neutral-500">
                                      Hidden
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-neutral-500 truncate">
                                  /3d-flip-book/{handbook.slug}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(getShareableLink(handbook), handbook.id)}
                                  title="Copy Link"
                                >
                                  {copiedId === handbook.id ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenInNewTab(handbook)}
                                  title="View"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownload(handbook)}
                                  title="Download PDF"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleVisibility(handbook)}
                                  title={handbook.is_active ? 'Hide' : 'Show'}
                                >
                                  {handbook.is_active ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(handbook)}
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirm(handbook.id)}
                                  title="Delete"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {filteredHandbooks.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No handbooks found</h3>
                <p className="text-neutral-600 mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'Add your first handbook to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Handbook
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Bulk Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Bulk Actions</h3>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                const allLinks = handbooks
                  .filter((h) => h.is_active)
                  .map((h) => `${h.name}: ${getShareableLink(h)}`)
                  .join('\n');
                copyToClipboard(allLinks, 'all-links');
              }}
            >
              {copiedId === 'all-links' ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Copied All Links!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy All Links
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Tips */}
        <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Tips for Managing Handbooks
          </h3>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Drag to reorder</strong> handbooks - order saves automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Hide</strong> handbooks to remove them from public view without deleting</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>PDF files should be uploaded to the <strong>/docs/</strong> folder</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Use <strong>Copy Link</strong> to share handbook URLs with members</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-900">
                  {editingHandbook ? 'Edit Handbook' : 'Add New Handbook'}
                </h2>
                <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Handbook Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Care+ Handbook"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-neutral-500 mr-2">/3d-flip-book/</span>
                  <Input
                    value={formData.slug || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })
                    }
                    placeholder="careplus"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* PDF Path */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  PDF File Path <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.pdf_path || ''}
                  onChange={(e) => setFormData({ ...formData, pdf_path: e.target.value })}
                  placeholder="/docs/My-Handbook.pdf"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Upload PDFs to the /docs/ folder, then enter the path here
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this handbook..."
                  rows={3}
                />
              </div>

              {/* Plan Type & Color */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Plan Type
                  </label>
                  <select
                    value={formData.plan_type || 'individual'}
                    onChange={(e) => setFormData({ ...formData, plan_type: e.target.value as PlanType })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PLAN_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Color Theme
                  </label>
                  <select
                    value={formData.color || 'blue'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {AVAILABLE_COLORS.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_HANDBOOK_ICONS.map((iconName) => {
                    const Icon = IconMap[iconName] || BookOpen;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all',
                          formData.icon === iconName
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-neutral-200 hover:border-neutral-300'
                        )}
                        title={iconName}
                      >
                        <Icon className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Features (comma-separated)
                </label>
                <Input
                  value={featuresInput}
                  onChange={(e) => setFeaturesInput(e.target.value)}
                  placeholder="Feature 1, Feature 2, Feature 3"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  These appear as tags on the handbook card
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm text-neutral-700">
                  Visible to public (uncheck to hide)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingHandbook ? 'Update' : 'Create'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Delete Handbook</h3>
                <p className="text-sm text-neutral-600">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={saving}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default HandbookHub;
