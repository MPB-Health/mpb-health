import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link as LinkIcon,
  BookOpen,
  LayoutGrid,
  Tags,
  Menu,
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
  Megaphone,
  GraduationCap,
  Video,
  FileText,
  HelpCircle,
  MousePointer,
  Link2,
  Clock,
  Library,
  Newspaper,
  ScrollText,
  ClipboardList,
  FolderOpen,
  Zap,
  Activity,
  Users,
  TrendingUp,
  Bell,
  Settings,
  RefreshCw,
  Search,
  BarChart3,
  Send,
  Mail,
  CheckCircle,
  AlertCircle,
  History,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Textarea';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { AdminLayout } from '../../components/admin/AdminLayout';
import MigratedToAdminPortal from '../../components/admin/MigratedToAdminPortal';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import {
  advisorCMSService,
  type AdvisorQuickLink,
  type AdvisorLearningPath,
  type AdvisorDashboardWidget,
  type AdvisorCategory,
  type AdvisorNavMenuItem,
  type AdvisorAnnouncement,
  type TrainingModule,
  QUICK_LINK_CATEGORIES,
} from '../../lib/advisorCMSService';
import {
  advisorContentService,
  type AdvisorContent,
  type AdvisorContentCategory,
} from '../../lib/advisorContentService';
import { supabase } from '../../lib/supabase';
import { ImageUploader } from '../../components/admin/ImageUploader';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import {
  bulletinNotificationService,
  type BulletinNotification,
} from '../../lib/bulletinNotificationService';
import {
  advisorMeetingService,
  type AdvisorMeeting,
  type CreateMeetingInput,
  type UpdateMeetingInput,
} from '../../lib/advisorMeetingService';
import { MeetingManagement } from '../../components/admin/MeetingManagement';

// ============================================================================
// Types
// ============================================================================

type TabType = 'bulletins' | 'meetings' | 'quick-links' | 'learning-paths' | 'training-modules' | 'resources' | 'sops' | 'widgets' | 'categories' | 'navigation' | 'announcements';

interface SOPDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  content: string | null;
  file_url: string | null;
  version: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Available Lucide icons for selection
const AVAILABLE_ICONS = [
  'BookOpen', 'FileText', 'Users', 'Briefcase', 'Target', 'Award', 'TrendingUp',
  'Newspaper', 'HelpCircle', 'Link', 'ExternalLink', 'Home', 'Settings', 'User',
  'Calendar', 'Clock', 'CheckCircle', 'Star', 'Heart', 'Zap', 'Shield', 'Lock',
  'Unlock', 'Mail', 'Phone', 'MessageCircle', 'Bell', 'Search', 'Filter',
  'Download', 'Upload', 'Folder', 'File', 'Image', 'Video', 'Music', 'Map',
  'LayoutDashboard', 'GraduationCap', 'Lightbulb', 'Rocket', 'Globe', 'Building',
];

// Available gradients for learning paths
const AVAILABLE_GRADIENTS = [
  { value: 'bg-gradient-to-br from-blue-500 to-blue-600', label: 'Blue' },
  { value: 'bg-gradient-to-br from-purple-500 to-purple-600', label: 'Purple' },
  { value: 'bg-gradient-to-br from-green-500 to-green-600', label: 'Green' },
  { value: 'bg-gradient-to-br from-orange-500 to-orange-600', label: 'Orange' },
  { value: 'bg-gradient-to-br from-indigo-500 to-indigo-600', label: 'Indigo' },
  { value: 'bg-gradient-to-br from-pink-500 to-pink-600', label: 'Pink' },
  { value: 'bg-gradient-to-br from-red-500 to-red-600', label: 'Red' },
  { value: 'bg-gradient-to-br from-teal-500 to-teal-600', label: 'Teal' },
  { value: 'bg-gradient-to-br from-yellow-500 to-yellow-600', label: 'Yellow' },
  { value: 'bg-gradient-to-br from-cyan-500 to-cyan-600', label: 'Cyan' },
];

// ============================================================================
// Main Component
// ============================================================================

export default function AdvisorPortalCMS() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('bulletins');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data states
  const [bulletins, setBulletins] = useState<AdvisorContent[]>([]);
  const [bulletinNotifications, setBulletinNotifications] = useState<Record<string, BulletinNotification | null>>({});
  const [sendingNotification, setSendingNotification] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<AdvisorMeeting[]>([]);
  const [quickLinks, setQuickLinks] = useState<AdvisorQuickLink[]>([]);
  const [learningPaths, setLearningPaths] = useState<AdvisorLearningPath[]>([]);
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([]);
  const [resources, setResources] = useState<AdvisorContent[]>([]);
  const [resourceCategories, setResourceCategories] = useState<AdvisorContentCategory[]>([]);
  const [widgets, setWidgets] = useState<AdvisorDashboardWidget[]>([]);
  const [categories, setCategories] = useState<AdvisorCategory[]>([]);
  const [navItems, setNavItems] = useState<AdvisorNavMenuItem[]>([]);
  const [announcements, setAnnouncements] = useState<AdvisorAnnouncement[]>([]);
  const [sops, setSops] = useState<SOPDocument[]>([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [quickLinkForm, setQuickLinkForm] = useState<Partial<AdvisorQuickLink>>({});
  const [learningPathForm, setLearningPathForm] = useState<Partial<AdvisorLearningPath>>({});
  const [trainingModuleForm, setTrainingModuleForm] = useState<Partial<TrainingModule>>({});
  const [resourceForm, setResourceForm] = useState<Partial<AdvisorContent>>({});
  const [categoryForm, setCategoryForm] = useState<Partial<AdvisorCategory>>({});
  const [navItemForm, setNavItemForm] = useState<Partial<AdvisorNavMenuItem>>({});
  const [announcementForm, setAnnouncementForm] = useState<Partial<AdvisorAnnouncement>>({});
  const [meetingForm, setMeetingForm] = useState<Partial<AdvisorMeeting>>({});
  const [sopForm, setSopForm] = useState<Partial<SOPDocument>>({});

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'bulletins': {
          // Load bulletins (content_type = 'bulletin')
          const { data: bulletinData, error } = await supabase
            .from('advisor_content')
            .select(`
              *,
              category:advisor_content_categories(*)
            `)
            .eq('content_type', 'bulletin')
            .order('published_date', { ascending: false });
          if (!error && bulletinData) {
            setBulletins(bulletinData);
            // Load notification status for each bulletin
            const notificationStatuses: Record<string, BulletinNotification | null> = {};
            for (const bulletin of bulletinData) {
              const notification = await bulletinNotificationService.getLatestNotification(bulletin.id);
              notificationStatuses[bulletin.id] = notification;
            }
            setBulletinNotifications(notificationStatuses);
          }
          break;
        }
        case 'meetings': {
          const allMeetings = await advisorMeetingService.getMeetings();
          setMeetings(allMeetings);
          break;
        }
        case 'quick-links': {
          const links = await advisorCMSService.getAllQuickLinks();
          setQuickLinks(links);
          break;
        }
        case 'learning-paths': {
          const paths = await advisorCMSService.getAllLearningPaths();
          setLearningPaths(paths);
          break;
        }
        case 'training-modules': {
          const modules = await advisorCMSService.getAllTrainingModules();
          setTrainingModules(modules);
          // Also load categories for the dropdown
          const cats = await advisorCMSService.getAllCategories();
          setCategories(cats);
          break;
        }
        case 'resources': {
          // Get all resources (including unpublished for admin)
          const { data: allResources, error } = await supabase
            .from('advisor_content')
            .select(`
              *,
              category:advisor_content_categories(*)
            `)
            .order('published_date', { ascending: false });
          if (!error && allResources) {
            setResources(allResources);
          }
          // Also load categories for the dropdown
          const resCats = await advisorContentService.getCategories();
          setResourceCategories(resCats);
          break;
        }
        case 'sops': {
          // Load all SOP documents for admin
          const { data: sopData, error: sopError } = await supabase
            .from('sop_documents')
            .select('*')
            .order('title', { ascending: true });
          if (!sopError && sopData) {
            setSops(sopData);
          }
          break;
        }
        case 'widgets': {
          const widgetList = await advisorCMSService.getDashboardWidgets();
          setWidgets(widgetList);
          break;
        }
        case 'categories': {
          const cats = await advisorCMSService.getAllCategories();
          setCategories(cats);
          break;
        }
        case 'navigation': {
          const nav = await advisorCMSService.getAllNavMenuItems();
          setNavItems(nav);
          break;
        }
        case 'announcements': {
          const anns = await advisorCMSService.getAllAnnouncements();
          setAnnouncements(anns);
          break;
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Drag and Drop Handler
  // ============================================================================

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    setSaving(true);
    try {
      switch (activeTab) {
        case 'quick-links': {
          const reordered = Array.from(quickLinks);
          const [removed] = reordered.splice(sourceIndex, 1);
          reordered.splice(destIndex, 0, removed);
          setQuickLinks(reordered);
          await advisorCMSService.reorderQuickLinks(reordered.map(l => l.id));
          toast.success('Order updated');
          break;
        }
        case 'learning-paths': {
          const reordered = Array.from(learningPaths);
          const [removed] = reordered.splice(sourceIndex, 1);
          reordered.splice(destIndex, 0, removed);
          setLearningPaths(reordered);
          await advisorCMSService.reorderLearningPaths(reordered.map(p => p.id));
          toast.success('Order updated');
          break;
        }
        case 'training-modules': {
          const reordered = Array.from(trainingModules);
          const [removed] = reordered.splice(sourceIndex, 1);
          reordered.splice(destIndex, 0, removed);
          setTrainingModules(reordered);
          await advisorCMSService.reorderTrainingModules(reordered.map(m => m.id));
          toast.success('Order updated');
          break;
        }
        case 'widgets': {
          const reordered = Array.from(widgets);
          const [removed] = reordered.splice(sourceIndex, 1);
          reordered.splice(destIndex, 0, removed);
          setWidgets(reordered);
          await advisorCMSService.reorderDashboardWidgets(reordered.map(w => w.id));
          toast.success('Order updated');
          break;
        }
        case 'navigation': {
          const reordered = Array.from(navItems);
          const [removed] = reordered.splice(sourceIndex, 1);
          reordered.splice(destIndex, 0, removed);
          setNavItems(reordered);
          await advisorCMSService.reorderNavMenu(reordered.map(n => n.id));
          toast.success('Order updated');
          break;
        }
      }
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder');
      loadData(); // Reload on error
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // CRUD Handlers
  // ============================================================================

  const openCreateModal = () => {
    setEditingItem(null);
    resetForms();
    // Set content_type for bulletins
    if (activeTab === 'bulletins') {
      setResourceForm({
        is_published: false,
        content_type: 'bulletin',
        published_date: new Date().toISOString(),
      });
    }
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    switch (activeTab) {
      case 'bulletins':
        setResourceForm(item);
        break;
      case 'meetings':
        setMeetingForm(item);
        break;
      case 'quick-links':
        setQuickLinkForm(item);
        break;
      case 'learning-paths':
        setLearningPathForm(item);
        break;
      case 'training-modules':
        setTrainingModuleForm(item);
        break;
      case 'resources':
        setResourceForm(item);
        break;
      case 'categories':
        setCategoryForm(item);
        break;
      case 'navigation':
        setNavItemForm(item);
        break;
      case 'announcements':
        setAnnouncementForm(item);
        break;
    }
    setShowModal(true);
  };

  const resetForms = () => {
    setQuickLinkForm({ is_active: true, is_external: false, requires_auth: true, icon: 'Link' });
    setLearningPathForm({ is_active: true, is_required: false, icon: 'BookOpen', gradient: AVAILABLE_GRADIENTS[0].value });
    setTrainingModuleForm({
      is_active: true,
      is_required: false,
      content_type: 'video',
      category: 'onboarding',
      duration_minutes: 15,
      order_index: trainingModules.length + 1,
      prerequisites: [],
    });
    setResourceForm({
      is_published: false,
      content_type: 'resource',
      published_date: new Date().toISOString(),
    });
    setCategoryForm({ is_active: true, type: 'training', icon: 'Folder', color: '#3b82f6' });
    setNavItemForm({ is_active: true, is_external: false, requires_auth: true, icon: 'Link' });
    setAnnouncementForm({ is_active: true, is_dismissible: true, type: 'info', target_audience: 'all' });
    setMeetingForm({
      status: 'scheduled',
      is_recurring: false,
      recurrence_pattern: 'biweekly',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      switch (activeTab) {
        case 'bulletins':
          try {
            // Auto-generate slug from title if not provided
            const bulletinData = {
              ...resourceForm,
              content_type: 'bulletin' as const,
              slug: resourceForm.slug || resourceForm.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '',
            };
            if (editingItem) {
              await advisorContentService.updateContent(editingItem.id, bulletinData);
            } else {
              await advisorContentService.createContent(bulletinData);
            }
            result = { success: true };
          } catch (error: unknown) {
            result = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
          break;
        case 'meetings':
          try {
            if (editingItem) {
              await advisorMeetingService.updateMeeting(editingItem.id, meetingForm as UpdateMeetingInput);
            } else {
              await advisorMeetingService.createMeeting(meetingForm as CreateMeetingInput);
            }
            result = { success: true };
          } catch (error: unknown) {
            result = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
          break;
        case 'quick-links':
          if (editingItem) {
            result = await advisorCMSService.updateQuickLink(editingItem.id, quickLinkForm);
          } else {
            result = await advisorCMSService.createQuickLink(quickLinkForm as any);
          }
          break;
        case 'learning-paths':
          if (editingItem) {
            result = await advisorCMSService.updateLearningPath(editingItem.id, learningPathForm);
          } else {
            result = await advisorCMSService.createLearningPath(learningPathForm as any);
          }
          break;
        case 'training-modules':
          if (editingItem) {
            result = await advisorCMSService.updateTrainingModule(editingItem.id, trainingModuleForm);
          } else {
            result = await advisorCMSService.createTrainingModule(trainingModuleForm as any);
          }
          break;
        case 'resources':
          try {
            // Auto-generate slug from title if not provided
            const resourceData = {
              ...resourceForm,
              slug: resourceForm.slug || resourceForm.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '',
            };
            if (editingItem) {
              await advisorContentService.updateContent(editingItem.id, resourceData);
            } else {
              await advisorContentService.createContent(resourceData);
            }
            result = { success: true };
          } catch (error: unknown) {
            result = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
          break;
        case 'sops':
          try {
            const sopData = {
              ...sopForm,
              tags: sopForm.tags || [],
              is_active: sopForm.is_active !== false,
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
                .insert(sopData);
              if (error) throw error;
            }
            result = { success: true };
          } catch (error: unknown) {
            result = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
          break;
        case 'categories':
          if (editingItem) {
            result = await advisorCMSService.updateCategory(editingItem.id, categoryForm);
          } else {
            result = await advisorCMSService.createCategory(categoryForm as any);
          }
          break;
        case 'navigation':
          if (editingItem) {
            result = await advisorCMSService.updateNavMenuItem(editingItem.id, navItemForm);
          } else {
            result = await advisorCMSService.createNavMenuItem(navItemForm as any);
          }
          break;
        case 'announcements':
          if (editingItem) {
            result = await advisorCMSService.updateAnnouncement(editingItem.id, announcementForm);
          } else {
            result = await advisorCMSService.createAnnouncement(announcementForm as any);
          }
          break;
      }

      if (result?.success) {
        toast.success(editingItem ? 'Updated successfully' : 'Created successfully');
        setShowModal(false);
        loadData();
      } else {
        toast.error(result?.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idOrItem: string | { id: string }) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const id = typeof idOrItem === 'string' ? idOrItem : idOrItem.id;

    setSaving(true);
    try {
      let result;
      switch (activeTab) {
        case 'bulletins':
          try {
            await advisorContentService.deleteContent(id);
            result = { success: true };
          } catch (error: unknown) {
            result = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
          break;
        case 'meetings':
          try {
            await advisorMeetingService.deleteMeeting(id);
            result = { success: true };
          } catch (error: unknown) {
            result = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
          break;
        case 'quick-links':
          result = await advisorCMSService.deleteQuickLink(id);
          break;
        case 'learning-paths':
          result = await advisorCMSService.deleteLearningPath(id);
          break;
        case 'training-modules':
          result = await advisorCMSService.deleteTrainingModule(id);
          break;
        case 'resources':
          try {
            await advisorContentService.deleteContent(id);
            result = { success: true };
          } catch (error: unknown) {
            result = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
          break;
        case 'categories':
          result = await advisorCMSService.deleteCategory(id);
          break;
        case 'navigation':
          result = await advisorCMSService.deleteNavMenuItem(id);
          break;
        case 'announcements':
          result = await advisorCMSService.deleteAnnouncement(id);
          break;
      }

      if (result?.success) {
        toast.success('Deleted successfully');
        loadData();
      } else {
        toast.error(result?.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An error occurred while deleting');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
    setSaving(true);
    try {
      let result;
      switch (activeTab) {
        case 'quick-links':
          result = await advisorCMSService.updateQuickLink(id, { is_active: !currentStatus });
          break;
        case 'learning-paths':
          result = await advisorCMSService.updateLearningPath(id, { is_active: !currentStatus });
          break;
        case 'training-modules':
          result = await advisorCMSService.updateTrainingModule(id, { is_active: !currentStatus });
          break;
        case 'resources':
          try {
            await advisorContentService.updateContent(id, { is_published: !currentStatus });
            result = { success: true };
          } catch (error: unknown) {
            result = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
          break;
        case 'widgets':
          result = await advisorCMSService.updateDashboardWidget(id, { is_visible: !currentStatus });
          break;
        case 'categories':
          result = await advisorCMSService.updateCategory(id, { is_active: !currentStatus });
          break;
        case 'navigation':
          result = await advisorCMSService.updateNavMenuItem(id, { is_active: !currentStatus });
          break;
        case 'announcements':
          result = await advisorCMSService.updateAnnouncement(id, { is_active: !currentStatus });
          break;
      }

      if (result?.success) {
        toast.success('Visibility updated');
        loadData();
      }
    } catch (error) {
      console.error('Toggle error:', error);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // Tab Configuration
  // ============================================================================

  const tabs = [
    { id: 'bulletins' as TabType, label: 'Bulletins', icon: Newspaper },
    { id: 'meetings' as TabType, label: 'Meetings', icon: Video },
    { id: 'quick-links' as TabType, label: 'Quick Links', icon: LinkIcon },
    { id: 'learning-paths' as TabType, label: 'Learning Paths', icon: BookOpen },
    { id: 'training-modules' as TabType, label: 'Training Modules', icon: GraduationCap },
    { id: 'resources' as TabType, label: 'Resources', icon: Library },
    { id: 'sops' as TabType, label: 'SOP Library', icon: ScrollText },
    { id: 'widgets' as TabType, label: 'Dashboard Widgets', icon: LayoutGrid },
    { id: 'categories' as TabType, label: 'Categories', icon: Tags },
    { id: 'navigation' as TabType, label: 'Navigation', icon: Menu },
    { id: 'announcements' as TabType, label: 'Announcements', icon: Megaphone },
  ];

  // Send bulletin notification
  const handleSendNotification = async (bulletin: AdvisorContent) => {
    if (!bulletin.is_published) {
      toast.error('Bulletin must be published before sending notifications');
      return;
    }

    const existingNotification = bulletinNotifications[bulletin.id];
    if (existingNotification?.status === 'completed') {
      const confirmed = window.confirm(
        `This bulletin has already been sent to advisors on ${new Date(existingNotification.sent_at).toLocaleDateString()}. Send again?`
      );
      if (!confirmed) return;
    }

    setSendingNotification(bulletin.id);
    try {
      const result = await bulletinNotificationService.sendBulletinNotification(
        bulletin.id,
        bulletin.title,
        bulletin.excerpt || '',
        bulletin.slug
      );

      if (result.success) {
        toast.success(result.message);
        // Refresh notification status
        const notification = await bulletinNotificationService.getLatestNotification(bulletin.id);
        setBulletinNotifications(prev => ({ ...prev, [bulletin.id]: notification }));
      } else {
        toast.error(result.message || 'Failed to send notification');
      }
    } catch (error) {
      toast.error('Failed to send notification');
      console.error('Notification error:', error);
    } finally {
      setSendingNotification(null);
    }
  };

  // Calculate stats
  const totalBulletins = bulletins.length;
  const publishedBulletins = bulletins.filter(b => b.is_published).length;
  const sentBulletins = Object.values(bulletinNotifications).filter(n => n?.status === 'completed').length;
  const totalQuickLinks = quickLinks.length;
  const activeQuickLinks = quickLinks.filter(l => l.is_active).length;
  const totalModules = trainingModules.length;
  const activeModules = trainingModules.filter(m => m.is_active).length;
  const publishedResources = resources.filter(r => r.is_published).length;
  const activeAnnouncements = announcements.filter(a => a.is_active).length;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AdminLayout activeView="advisor-portal-cms" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <MigratedToAdminPortal adminPath="/content/training" sectionName="Advisor Portal CMS" />

      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Advisor Portal CMS', href: '/admin/advisor-cms' },
          ]}
        />

        {/* Command Center Header */}
        <div className="mt-4 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Advisor Portal Command Center</h1>
                <p className="text-gray-600 mt-1">
                  Manage content, training, and configuration for the Advisor Portal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/advisor"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Eye className="w-4 h-4" />
                View Portal
              </a>
              <button
                onClick={() => loadData()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <LinkIcon className="w-5 h-5 text-blue-600" />
                <span className="text-xs text-green-600 font-medium">{activeQuickLinks} active</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalQuickLinks}</div>
              <div className="text-sm text-gray-600">Quick Links</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <span className="text-xs text-green-600 font-medium">{activeModules} active</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalModules}</div>
              <div className="text-sm text-gray-600">Training Modules</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Library className="w-5 h-5 text-green-600" />
                <span className="text-xs text-green-600 font-medium">{publishedResources} published</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{resources.length}</div>
              <div className="text-sm text-gray-600">Resources</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Bell className="w-5 h-5 text-orange-600" />
                <span className="text-xs text-green-600 font-medium">{activeAnnouncements} active</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{announcements.length}</div>
              <div className="text-sm text-gray-600">Announcements</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => { setActiveTab('resources'); openCreateModal(); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md text-sm font-medium"
            >
              <Newspaper className="w-4 h-4" />
              New Bulletin
            </button>
            <button
              onClick={() => { setActiveTab('training-modules'); openCreateModal(); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md text-sm font-medium"
            >
              <GraduationCap className="w-4 h-4" />
              New Training Module
            </button>
            <button
              onClick={() => { setActiveTab('quick-links'); openCreateModal(); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md text-sm font-medium"
            >
              <LinkIcon className="w-4 h-4" />
              New Quick Link
            </button>
            <button
              onClick={() => { setActiveTab('announcements'); openCreateModal(); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all shadow-md text-sm font-medium"
            >
              <Megaphone className="w-4 h-4" />
              New Announcement
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Card className="mb-6 shadow-lg border-0 overflow-hidden">
          <div className="border-b border-gray-200 bg-white">
            <nav className="flex flex-wrap -mb-px px-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'px-4 py-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2',
                      activeTab === tab.id
                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400')} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <CardContent className="pt-6">
            {/* Action Bar */}
            {activeTab !== 'widgets' && (
              <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-gray-600">
                  Drag items to reorder. Changes are saved automatically.
                </p>
                <Button onClick={openCreateModal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New
                </Button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {/* Bulletins Tab */}
                {activeTab === 'bulletins' && (
                  <div className="space-y-6">
                    {/* Bulletins Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Manage Bulletins</h3>
                        <p className="text-sm text-gray-600">Create bulletins and send email notifications to all advisors</p>
                      </div>
                      <Button onClick={openCreateModal}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Bulletin
                      </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between mb-1">
                          <Newspaper className="w-5 h-5 text-blue-600" />
                          <Badge className="bg-blue-100 text-blue-700 text-xs">{publishedBulletins} published</Badge>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{totalBulletins}</div>
                        <div className="text-sm text-gray-600">Total Bulletins</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center justify-between mb-1">
                          <Send className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{sentBulletins}</div>
                        <div className="text-sm text-gray-600">Notifications Sent</div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="flex items-center justify-between mb-1">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">-</div>
                        <div className="text-sm text-gray-600">Active Advisors</div>
                      </div>
                    </div>

                    {/* Bulletins List */}
                    {bulletins.length === 0 ? (
                      <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
                        <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No bulletins yet</h3>
                        <p className="text-gray-600 mb-4">Create your first bulletin to notify advisors</p>
                        <Button onClick={openCreateModal}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Bulletin
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bulletins.map((bulletin) => {
                          const notification = bulletinNotifications[bulletin.id];
                          const isSending = sendingNotification === bulletin.id;

                          return (
                            <div
                              key={bulletin.id}
                              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-gray-900 truncate">{bulletin.title}</h4>
                                    {bulletin.is_published ? (
                                      <Badge className="bg-green-100 text-green-700">Published</Badge>
                                    ) : (
                                      <Badge className="bg-gray-100 text-gray-700">Draft</Badge>
                                    )}
                                    {notification?.status === 'completed' && (
                                      <Badge className="bg-blue-100 text-blue-700">
                                        <Mail className="w-3 h-3 mr-1" />
                                        Sent
                                      </Badge>
                                    )}
                                  </div>
                                  {bulletin.excerpt && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                      {bulletin.excerpt.replace(/<[^>]*>/g, '')}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>Created: {new Date(bulletin.published_date).toLocaleDateString()}</span>
                                    {notification?.status === 'completed' && (
                                      <span className="flex items-center gap-1 text-blue-600">
                                        <CheckCircle className="w-3 h-3" />
                                        Notified {notification.successful_sends} advisors on {new Date(notification.sent_at).toLocaleDateString()}
                                      </span>
                                    )}
                                    {notification?.status === 'failed' && (
                                      <span className="flex items-center gap-1 text-red-600">
                                        <AlertCircle className="w-3 h-3" />
                                        Notification failed
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditModal(bulletin)}
                                    title="Edit Bulletin"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(`/advisor/content/${bulletin.slug}`, '_blank')}
                                    title="Preview"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant={notification?.status === 'completed' ? 'outline' : 'primary'}
                                    size="sm"
                                    onClick={() => handleSendNotification(bulletin)}
                                    disabled={!bulletin.is_published || isSending}
                                    title={bulletin.is_published ? 'Send Email Notification' : 'Publish bulletin first'}
                                    className={notification?.status === 'completed' ? '' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}
                                  >
                                    {isSending ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4 mr-1" />
                                        {notification?.status === 'completed' ? 'Resend' : 'Send'}
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(bulletin)}
                                    className="text-red-600 hover:bg-red-50"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Meetings */}
                {activeTab === 'meetings' && (
                  <MeetingManagement />
                )}

                {/* Quick Links */}
                {activeTab === 'quick-links' && (
                  <QuickLinksEditor
                    items={quickLinks}
                    onDragEnd={handleDragEnd}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onToggle={handleToggleVisibility}
                  />
                )}

                {/* Learning Paths */}
                {activeTab === 'learning-paths' && (
                  <LearningPathsEditor
                    items={learningPaths}
                    onDragEnd={handleDragEnd}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onToggle={handleToggleVisibility}
                  />
                )}

                {/* Training Modules */}
                {activeTab === 'training-modules' && (
                  <TrainingModulesEditor
                    items={trainingModules}
                    onDragEnd={handleDragEnd}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onToggle={handleToggleVisibility}
                  />
                )}

                {/* Resources */}
                {activeTab === 'resources' && (
                  <ResourcesEditor
                    items={resources}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onToggle={handleToggleVisibility}
                  />
                )}

                {/* SOP Library */}
                {activeTab === 'sops' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Manage SOPs</h3>
                        <p className="text-sm text-gray-600">Create and manage Standard Operating Procedures for advisors</p>
                      </div>
                      <Button onClick={() => {
                        setSopForm({
                          title: '',
                          description: '',
                          category: 'general',
                          tags: [],
                          file_url: '',
                          version: '1.0',
                          is_active: true,
                        });
                        setEditingItem(null);
                        setShowModal(true);
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        New SOP
                      </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between mb-1">
                          <ScrollText className="w-5 h-5 text-blue-600" />
                          <Badge className="bg-blue-100 text-blue-700 text-xs">{sops.filter(s => s.is_active).length} active</Badge>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{sops.length}</div>
                        <div className="text-sm text-gray-600">Total SOPs</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="text-2xl font-bold text-gray-900">
                          {new Set(sops.map(s => s.category)).size}
                        </div>
                        <div className="text-sm text-gray-600">Categories</div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="text-2xl font-bold text-gray-900">
                          {sops.filter(s => s.file_url).length}
                        </div>
                        <div className="text-sm text-gray-600">With Documents</div>
                      </div>
                    </div>

                    {/* SOP List */}
                    {sops.length === 0 ? (
                      <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
                        <ScrollText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No SOPs yet</h3>
                        <p className="text-gray-600 mb-4">Create your first Standard Operating Procedure</p>
                        <Button onClick={() => {
                          setSopForm({
                            title: '',
                            description: '',
                            category: 'general',
                            tags: [],
                            file_url: '',
                            version: '1.0',
                            is_active: true,
                          });
                          setEditingItem(null);
                          setShowModal(true);
                        }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create SOP
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sops.map(sop => (
                          <Card key={sop.id} className={`p-4 ${!sop.is_active ? 'opacity-60' : ''}`}>
                            <div className="flex items-start gap-4">
                              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                <ScrollText className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900">{sop.title}</h4>
                                  <Badge variant="outline" className="text-xs">v{sop.version}</Badge>
                                  {!sop.is_active && (
                                    <Badge variant="outline" className="text-xs text-orange-600">Inactive</Badge>
                                  )}
                                </div>
                                {sop.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{sop.description}</p>
                                )}
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {sop.category.replace(/_/g, ' ')}
                                  </Badge>
                                  {sop.tags?.slice(0, 2).map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {sop.file_url && (
                                    <a
                                      href={sop.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      View Document
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    setSaving(true);
                                    try {
                                      const { error } = await supabase
                                        .from('sop_documents')
                                        .update({ is_active: !sop.is_active })
                                        .eq('id', sop.id);
                                      if (error) throw error;
                                      setSops(prev => prev.map(s =>
                                        s.id === sop.id ? { ...s, is_active: !s.is_active } : s
                                      ));
                                      toast.success(sop.is_active ? 'SOP deactivated' : 'SOP activated');
                                    } catch (error) {
                                      toast.error('Failed to update SOP');
                                    } finally {
                                      setSaving(false);
                                    }
                                  }}
                                >
                                  {sop.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSopForm({
                                      ...sop,
                                      tags: sop.tags || [],
                                    });
                                    setEditingItem(sop);
                                    setShowModal(true);
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={async () => {
                                    if (!confirm('Are you sure you want to delete this SOP?')) return;
                                    setSaving(true);
                                    try {
                                      const { error } = await supabase
                                        .from('sop_documents')
                                        .delete()
                                        .eq('id', sop.id);
                                      if (error) throw error;
                                      setSops(prev => prev.filter(s => s.id !== sop.id));
                                      toast.success('SOP deleted');
                                    } catch (error) {
                                      toast.error('Failed to delete SOP');
                                    } finally {
                                      setSaving(false);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Dashboard Widgets */}
                {activeTab === 'widgets' && (
                  <WidgetsEditor
                    items={widgets}
                    onDragEnd={handleDragEnd}
                    onToggle={handleToggleVisibility}
                  />
                )}

                {/* Categories */}
                {activeTab === 'categories' && (
                  <CategoriesEditor
                    items={categories}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onToggle={handleToggleVisibility}
                  />
                )}

                {/* Navigation */}
                {activeTab === 'navigation' && (
                  <NavigationEditor
                    items={navItems}
                    onDragEnd={handleDragEnd}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onToggle={handleToggleVisibility}
                  />
                )}

                {/* Announcements */}
                {activeTab === 'announcements' && (
                  <AnnouncementsEditor
                    items={announcements}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onToggle={handleToggleVisibility}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editingItem ? 'Edit' : 'Create'} {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
                </CardTitle>
                <button onClick={() => setShowModal(false)} aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent>
                {/* Bulletin Form */}
                {activeTab === 'bulletins' && (
                  <ResourceForm
                    form={{ ...resourceForm, content_type: 'bulletin' }}
                    setForm={(form) => setResourceForm({ ...form, content_type: 'bulletin' })}
                    categories={resourceCategories}
                  />
                )}

                {/* Meeting Form */}
                {activeTab === 'meetings' && (
                  <MeetingForm form={meetingForm} setForm={setMeetingForm} />
                )}

                {/* Quick Link Form */}
                {activeTab === 'quick-links' && (
                  <QuickLinkForm form={quickLinkForm} setForm={setQuickLinkForm} />
                )}

                {/* Learning Path Form */}
                {activeTab === 'learning-paths' && (
                  <LearningPathForm
                    form={learningPathForm}
                    setForm={setLearningPathForm}
                    categories={categories.filter(c => c.type === 'training' || c.type === 'all')}
                  />
                )}

                {/* Training Module Form */}
                {activeTab === 'training-modules' && (
                  <TrainingModuleForm
                    form={trainingModuleForm}
                    setForm={setTrainingModuleForm}
                    categories={categories.filter(c => c.type === 'training' || c.type === 'all')}
                    modules={trainingModules}
                  />
                )}

                {/* Resource Form */}
                {activeTab === 'resources' && (
                  <ResourceForm
                    form={resourceForm}
                    setForm={setResourceForm}
                    categories={resourceCategories}
                  />
                )}

                {/* SOP Form */}
                {activeTab === 'sops' && (
                  <SOPForm form={sopForm} setForm={setSopForm} />
                )}

                {/* Category Form */}
                {activeTab === 'categories' && (
                  <CategoryForm form={categoryForm} setForm={setCategoryForm} />
                )}

                {/* Navigation Item Form */}
                {activeTab === 'navigation' && (
                  <NavItemForm form={navItemForm} setForm={setNavItemForm} navItems={navItems} />
                )}

                {/* Announcement Form */}
                {activeTab === 'announcements' && (
                  <AnnouncementForm form={announcementForm} setForm={setAnnouncementForm} />
                )}

                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    Save
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
}

// ============================================================================
// Sub-Components: Editors
// ============================================================================

interface EditorProps<T> {
  items: T[];
  onDragEnd?: (result: DropResult) => void;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  onToggle?: (id: string, currentStatus: boolean) => void;
}

const QuickLinksEditor: React.FC<EditorProps<AdvisorQuickLink>> = ({
  items,
  onDragEnd,
  onEdit,
  onDelete,
  onToggle,
}) => {
  // Get category label for display
  const getCategoryLabel = (category: string | undefined) => {
    const cat = QUICK_LINK_CATEGORIES.find(c => c.value === category);
    return cat?.label || 'Resources & Tools';
  };

  // Get category color for badge
  const getCategoryColor = (category: string | undefined) => {
    switch (category) {
      case 'resources': return 'bg-green-100 text-green-700';
      case 'advisor_forms': return 'bg-purple-100 text-purple-700';
      case 'employer_forms': return 'bg-blue-100 text-blue-700';
      case 'member_forms': return 'bg-orange-100 text-orange-700';
      case 'bulletins': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd!}>
      <Droppable droppableId="quick-links">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={cn(
                      'flex items-center gap-4 p-4 bg-white border rounded-lg',
                      !item.is_active && 'opacity-50'
                    )}
                  >
                    <div {...provided.dragHandleProps}>
                      <GripVertical className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{item.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(item.category)}`}>
                          {getCategoryLabel(item.category)}
                        </span>
                        {item.is_external && <ExternalLink className="w-3 h-3 text-gray-400" />}
                      </div>
                      <p className="text-sm text-gray-500">{item.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggle?.(item.id, item.is_active)}
                        title={item.is_active ? 'Hide' : 'Show'}
                      >
                        {item.is_active ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button onClick={() => onEdit?.(item)} aria-label="Edit">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button onClick={() => onDelete?.(item.id)} aria-label="Delete">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
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
  );
};

const LearningPathsEditor: React.FC<EditorProps<AdvisorLearningPath>> = ({
  items,
  onDragEnd,
  onEdit,
  onDelete,
  onToggle,
}) => (
  <DragDropContext onDragEnd={onDragEnd!}>
    <Droppable droppableId="learning-paths">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
          {items.map((item, index) => (
            <Draggable key={item.id} draggableId={item.id} index={index}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  className={cn(
                    'flex items-center gap-4 p-4 bg-white border rounded-lg',
                    !item.is_active && 'opacity-50'
                  )}
                >
                  <div {...provided.dragHandleProps}>
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className={cn('w-10 h-10 rounded-lg', item.gradient)} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      {item.is_required && <Badge>Required</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                  </div>
                  <Badge variant="outline">{item.estimated_hours}h</Badge>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onToggle?.(item.id, item.is_active)} aria-label={item.is_active ? 'Hide' : 'Show'}>
                      {item.is_active ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button onClick={() => onEdit?.(item)} aria-label="Edit">
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button onClick={() => onDelete?.(item.id)} aria-label="Delete">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
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
);

// Content type icons mapping
const CONTENT_TYPE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  video: Video,
  document: FileText,
  quiz: HelpCircle,
  interactive: MousePointer,
  external_link: Link2,
};

const TrainingModulesEditor: React.FC<EditorProps<TrainingModule>> = ({
  items,
  onDragEnd,
  onEdit,
  onDelete,
  onToggle,
}) => (
  <DragDropContext onDragEnd={onDragEnd!}>
    <Droppable droppableId="training-modules">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No training modules yet</p>
              <p className="text-sm text-gray-500">Click "Add New" to create your first training module</p>
            </div>
          ) : (
            items.map((item, index) => {
              const ContentIcon = CONTENT_TYPE_ICONS[item.content_type] || FileText;
              return (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn(
                        'flex items-center gap-4 p-4 bg-white border rounded-lg',
                        !item.is_active && 'opacity-50'
                      )}
                    >
                      <div {...provided.dragHandleProps}>
                        <GripVertical className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <ContentIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{item.title}</span>
                          {item.is_required && <Badge className="bg-red-100 text-red-700">Required</Badge>}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1">{item.description || 'No description'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.duration_minutes} min
                          </span>
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{item.content_type.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggle?.(item.id, item.is_active)}
                          title={item.is_active ? 'Hide' : 'Show'}
                        >
                          {item.is_active ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button type="button" onClick={() => onEdit?.(item)} title="Edit">
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button type="button" onClick={() => onDelete?.(item.id)} title="Delete">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>
);

// Content type icons for resources
const RESOURCE_TYPE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  bulletin: Newspaper,
  resource: FolderOpen,
  guideline: ScrollText,
  form: ClipboardList,
};

const ResourcesEditor: React.FC<EditorProps<AdvisorContent>> = ({
  items,
  onEdit,
  onDelete,
  onToggle,
}) => (
  <div className="space-y-2">
    {items.length === 0 ? (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <Library className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No resources yet</p>
        <p className="text-sm text-gray-500">Click "Add New" to create your first resource</p>
      </div>
    ) : (
      items.map((item) => {
        const ContentIcon = RESOURCE_TYPE_ICONS[item.content_type] || FileText;
        return (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-4 p-4 bg-white border rounded-lg',
              !item.is_published && 'opacity-50 border-dashed'
            )}
          >
            {item.featured_image_url ? (
              <img
                src={item.featured_image_url}
                alt={item.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <ContentIcon className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{item.title}</span>
                {!item.is_published && (
                  <Badge className="bg-yellow-100 text-yellow-700">Draft</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 line-clamp-1">{item.excerpt || 'No excerpt'}</p>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="text-xs capitalize">{item.content_type}</Badge>
                {item.category && (
                  <Badge variant="outline" className="text-xs">{item.category.name}</Badge>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(item.published_date).toLocaleDateString()}
                </span>
                <span className="text-xs text-gray-400">{item.view_count} views</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggle?.(item.id, item.is_published)}
                title={item.is_published ? 'Unpublish' : 'Publish'}
              >
                {item.is_published ? (
                  <Eye className="w-4 h-4 text-green-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button type="button" onClick={() => onEdit?.(item)} title="Edit">
                <Edit2 className="w-4 h-4 text-blue-600" />
              </button>
              <button type="button" onClick={() => onDelete?.(item.id)} title="Delete">
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        );
      })
    )}
  </div>
);

const WidgetsEditor: React.FC<EditorProps<AdvisorDashboardWidget>> = ({
  items,
  onDragEnd,
  onToggle,
}) => (
  <DragDropContext onDragEnd={onDragEnd!}>
    <Droppable droppableId="widgets">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
          {items.map((item, index) => (
            <Draggable key={item.id} draggableId={item.id} index={index}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  className={cn(
                    'flex items-center gap-4 p-4 bg-white border rounded-lg',
                    !item.is_visible && 'opacity-50'
                  )}
                >
                  <div {...provided.dragHandleProps}>
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{item.label}</span>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <Badge variant="outline">{item.grid_column}</Badge>
                  <button onClick={() => onToggle?.(item.id, item.is_visible)} aria-label={item.is_visible ? 'Hide' : 'Show'}>
                    {item.is_visible ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>
);

const CategoriesEditor: React.FC<EditorProps<AdvisorCategory>> = ({
  items,
  onEdit,
  onDelete,
  onToggle,
}) => (
  <div className="space-y-2">
    {items.map((item) => (
      <div
        key={item.id}
        className={cn(
          'flex items-center gap-4 p-4 bg-white border rounded-lg',
          !item.is_active && 'opacity-50'
        )}
      >
        <div
          className="w-4 h-4 rounded bg-[var(--item-color)]"
          style={{ '--item-color': item.color } as React.CSSProperties}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.name}</span>
            <Badge variant="outline">{item.slug}</Badge>
          </div>
          <p className="text-sm text-gray-500">{item.description}</p>
        </div>
        <Badge>{item.type}</Badge>
        <div className="flex items-center gap-2">
          <button onClick={() => onToggle?.(item.id, item.is_active)} aria-label={item.is_active ? 'Hide' : 'Show'}>
            {item.is_active ? (
              <Eye className="w-4 h-4 text-green-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button onClick={() => onEdit?.(item)} aria-label="Edit">
            <Edit2 className="w-4 h-4 text-blue-600" />
          </button>
          <button onClick={() => onDelete?.(item.id)} aria-label="Delete">
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    ))}
  </div>
);

const NavigationEditor: React.FC<EditorProps<AdvisorNavMenuItem>> = ({
  items,
  onDragEnd,
  onEdit,
  onDelete,
  onToggle,
}) => (
  <DragDropContext onDragEnd={onDragEnd!}>
    <Droppable droppableId="navigation">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
          {items.map((item, index) => (
            <Draggable key={item.id} draggableId={item.id} index={index}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  className={cn(
                    'flex items-center gap-4 p-4 bg-white border rounded-lg',
                    !item.is_active && 'opacity-50'
                  )}
                >
                  <div {...provided.dragHandleProps}>
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.label}</span>
                      {item.badge_text && (
                        <Badge className={`bg-${item.badge_color}-100 text-${item.badge_color}-800`}>
                          {item.badge_text}
                        </Badge>
                      )}
                      {item.is_external && <ExternalLink className="w-3 h-3 text-gray-400" />}
                    </div>
                    <p className="text-sm text-gray-500">{item.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onToggle?.(item.id, item.is_active)} aria-label={item.is_active ? 'Hide' : 'Show'}>
                      {item.is_active ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button onClick={() => onEdit?.(item)} aria-label="Edit">
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button onClick={() => onDelete?.(item.id)} aria-label="Delete">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
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
);

const AnnouncementsEditor: React.FC<EditorProps<AdvisorAnnouncement>> = ({
  items,
  onEdit,
  onDelete,
  onToggle,
}) => (
  <div className="space-y-2">
    {items.map((item) => (
      <div
        key={item.id}
        className={cn(
          'flex items-center gap-4 p-4 bg-white border rounded-lg',
          !item.is_active && 'opacity-50'
        )}
      >
        <Badge
          className={cn(
            item.type === 'info' && 'bg-blue-100 text-blue-800',
            item.type === 'warning' && 'bg-yellow-100 text-yellow-800',
            item.type === 'success' && 'bg-green-100 text-green-800',
            item.type === 'error' && 'bg-red-100 text-red-800'
          )}
        >
          {item.type}
        </Badge>
        <div className="flex-1">
          <span className="font-medium">{item.title}</span>
          <p className="text-sm text-gray-500 line-clamp-1">{item.content}</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date(item.start_date).toLocaleDateString()}
          {item.end_date && ` - ${new Date(item.end_date).toLocaleDateString()}`}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onToggle?.(item.id, item.is_active)} aria-label={item.is_active ? 'Hide' : 'Show'}>
            {item.is_active ? (
              <Eye className="w-4 h-4 text-green-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button onClick={() => onEdit?.(item)} aria-label="Edit">
            <Edit2 className="w-4 h-4 text-blue-600" />
          </button>
          <button onClick={() => onDelete?.(item.id)} aria-label="Delete">
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    ))}
  </div>
);

// ============================================================================
// Sub-Components: Forms
// ============================================================================

interface FormProps<T> {
  form: Partial<T>;
  setForm: React.Dispatch<React.SetStateAction<Partial<T>>>;
}

const QuickLinkForm: React.FC<FormProps<AdvisorQuickLink>> = ({ form, setForm }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
      <Input
        value={form.label || ''}
        onChange={(e) => setForm({ ...form, label: e.target.value })}
        placeholder="Link label"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
      <Input
        value={form.url || ''}
        onChange={(e) => setForm({ ...form, url: e.target.value })}
        placeholder="/path or https://..."
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
      <select
        value={form.category || 'resources'}
        onChange={(e) => setForm({ ...form, category: e.target.value as AdvisorQuickLink['category'] })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        aria-label="Category"
      >
        {QUICK_LINK_CATEGORIES.map((cat) => (
          <option key={cat.value} value={cat.value}>{cat.label}</option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
      <select
        value={form.icon || 'Link'}
        onChange={(e) => setForm({ ...form, icon: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        aria-label="Icon"
      >
        {AVAILABLE_ICONS.map((icon) => (
          <option key={icon} value={icon}>{icon}</option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <Input
        value={form.description || ''}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Optional description"
      />
    </div>
    <div className="flex gap-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_external || false}
          onChange={(e) => setForm({ ...form, is_external: e.target.checked })}
        />
        <span className="text-sm">Opens in new tab</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_active !== false}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        <span className="text-sm">Active</span>
      </label>
    </div>
  </div>
);

interface LearningPathFormProps extends FormProps<AdvisorLearningPath> {
  categories: AdvisorCategory[];
}

const LearningPathForm: React.FC<LearningPathFormProps> = ({ form, setForm, categories }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
      <Input
        value={form.title || ''}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Learning path title"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <Textarea
        value={form.description || ''}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Path description"
        rows={3}
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={form.category_slug || ''}
          onChange={(e) => setForm({ ...form, category_slug: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Category"
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
        <Input
          type="number"
          step="0.5"
          value={form.estimated_hours || 1}
          onChange={(e) => setForm({ ...form, estimated_hours: parseFloat(e.target.value) })}
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
        <select
          value={form.icon || 'BookOpen'}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Icon"
        >
          {AVAILABLE_ICONS.map((icon) => (
            <option key={icon} value={icon}>{icon}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Color Theme</label>
        <select
          value={form.gradient || AVAILABLE_GRADIENTS[0].value}
          onChange={(e) => setForm({ ...form, gradient: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Color theme"
        >
          {AVAILABLE_GRADIENTS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>
    </div>
    <div className="flex gap-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_required || false}
          onChange={(e) => setForm({ ...form, is_required: e.target.checked })}
        />
        <span className="text-sm">Required</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_active !== false}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        <span className="text-sm">Active</span>
      </label>
    </div>
  </div>
);

// Training Module Categories (from database schema)
const TRAINING_CATEGORIES = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'claims', label: 'Claims' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'product_knowledge', label: 'Product Knowledge' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'sales', label: 'Sales' },
  { value: 'general', label: 'General' },
];

const CONTENT_TYPES = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle },
  { value: 'interactive', label: 'Interactive', icon: MousePointer },
  { value: 'external_link', label: 'External Link', icon: Link2 },
];

interface TrainingModuleFormProps extends FormProps<TrainingModule> {
  categories: AdvisorCategory[];
  modules: TrainingModule[];
}

const TrainingModuleForm: React.FC<TrainingModuleFormProps> = ({ form, setForm, modules }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
      <Input
        value={form.title || ''}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Module title"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <Textarea
        value={form.description || ''}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Brief description of this module"
        rows={3}
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <select
          value={form.category || 'onboarding'}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Module category"
        >
          {TRAINING_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content Type *</label>
        <select
          value={form.content_type || 'video'}
          onChange={(e) => setForm({ ...form, content_type: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Content type"
        >
          {CONTENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Content URL {form.content_type === 'external_link' ? '*' : '(optional)'}
      </label>
      <Input
        value={form.content_url || ''}
        onChange={(e) => setForm({ ...form, content_url: e.target.value })}
        placeholder={
          form.content_type === 'video' ? 'https://youtube.com/watch?v=...' :
          form.content_type === 'document' ? 'https://drive.google.com/file/...' :
          form.content_type === 'external_link' ? 'https://example.com/course' :
          'URL to content'
        }
      />
      <p className="text-xs text-gray-500 mt-1">
        {form.content_type === 'video' && 'YouTube, Vimeo, or direct video URL'}
        {form.content_type === 'document' && 'Google Drive, PDF link, or document URL'}
        {form.content_type === 'external_link' && 'External training platform URL'}
        {form.content_type === 'quiz' && 'Quiz platform URL (optional)'}
        {form.content_type === 'interactive' && 'Interactive content URL'}
      </p>
    </div>

    <ImageUploader
      value={form.thumbnail_url || ''}
      onChange={(url) => setForm({ ...form, thumbnail_url: url })}
      slug={form.title?.toLowerCase().replace(/\s+/g, '-') || 'module'}
      label="Thumbnail Image (optional)"
      showUrlInput={true}
    />

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Content HTML (optional)</label>
      <RichTextEditor
        content={form.content_html || ''}
        onChange={(html) => setForm({ ...form, content_html: html })}
        placeholder="Additional content, instructions, or notes..."
        minHeight="150px"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
        <Input
          type="number"
          min={1}
          value={form.duration_minutes || 15}
          onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 15 })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Order Index</label>
        <Input
          type="number"
          min={1}
          value={form.order_index || 1}
          onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) || 1 })}
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisites (optional)</label>
      <select
        multiple
        value={form.prerequisites || []}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions, option => option.value);
          setForm({ ...form, prerequisites: selected });
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[100px]"
        aria-label="Select prerequisite modules"
      >
        {modules.filter(m => m.id !== (form as any).id).map((module) => (
          <option key={module.id} value={module.id}>{module.title}</option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple modules</p>
    </div>

    <div className="flex gap-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_required || false}
          onChange={(e) => setForm({ ...form, is_required: e.target.checked })}
        />
        <span className="text-sm">Required Module</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_active !== false}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        <span className="text-sm">Active</span>
      </label>
    </div>
  </div>
);

// Resource content types
const RESOURCE_CONTENT_TYPES = [
  { value: 'bulletin', label: 'Bulletin', icon: Newspaper },
  { value: 'resource', label: 'Resource', icon: FolderOpen },
  { value: 'guideline', label: 'Guideline', icon: ScrollText },
  { value: 'form', label: 'Form', icon: ClipboardList },
];

interface ResourceFormProps extends FormProps<AdvisorContent> {
  categories: AdvisorContentCategory[];
}

const ResourceForm: React.FC<ResourceFormProps> = ({ form, setForm, categories }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
      <Input
        value={form.title || ''}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Resource title"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
      <Input
        value={form.slug || ''}
        onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
        placeholder="Auto-generated from title if left empty"
      />
      <p className="text-xs text-gray-500 mt-1">URL-friendly identifier (auto-generated if empty)</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
      <Textarea
        value={form.excerpt || ''}
        onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
        placeholder="Brief summary shown in listings"
        rows={2}
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content Type *</label>
        <select
          value={form.content_type || 'resource'}
          onChange={(e) => setForm({ ...form, content_type: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Resource content type"
        >
          {RESOURCE_CONTENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={form.category_id || ''}
          onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Resource category"
        >
          <option value="">No Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
    </div>

    <ImageUploader
      value={form.featured_image_url || ''}
      onChange={(url) => setForm({ ...form, featured_image_url: url })}
      slug={form.slug || form.title?.toLowerCase().replace(/\s+/g, '-') || 'resource'}
      label="Featured Image"
      showUrlInput={true}
    />

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
      <RichTextEditor
        content={form.content || ''}
        onChange={(html) => setForm({ ...form, content: html })}
        placeholder="Full resource content..."
        minHeight="200px"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Published Date</label>
      <Input
        type="datetime-local"
        value={form.published_date?.slice(0, 16) || new Date().toISOString().slice(0, 16)}
        onChange={(e) => setForm({ ...form, published_date: new Date(e.target.value).toISOString() })}
      />
    </div>

    <div className="flex gap-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_published || false}
          onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
        />
        <span className="text-sm">Published</span>
      </label>
    </div>
  </div>
);

const CategoryForm: React.FC<FormProps<AdvisorCategory>> = ({ form, setForm }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
      <Input
        value={form.name || ''}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Category name"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
      <Input
        value={form.slug || ''}
        onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
        placeholder="category_slug"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <Textarea
        value={form.description || ''}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={2}
      />
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          value={form.type || 'training'}
          onChange={(e) => setForm({ ...form, type: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Type"
        >
          <option value="training">Training</option>
          <option value="sop">SOP</option>
          <option value="content">Content</option>
          <option value="all">All</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
        <select
          value={form.icon || 'Folder'}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Icon"
        >
          {AVAILABLE_ICONS.map((icon) => (
            <option key={icon} value={icon}>{icon}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
        <Input
          type="color"
          value={form.color || '#3b82f6'}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
        />
      </div>
    </div>
  </div>
);

interface NavItemFormProps extends FormProps<AdvisorNavMenuItem> {
  navItems: AdvisorNavMenuItem[];
}

const NavItemForm: React.FC<NavItemFormProps> = ({ form, setForm, navItems }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
      <Input
        value={form.label || ''}
        onChange={(e) => setForm({ ...form, label: e.target.value })}
        placeholder="Menu item label"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
      <Input
        value={form.url || ''}
        onChange={(e) => setForm({ ...form, url: e.target.value })}
        placeholder="/path or https://..."
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
        <select
          value={form.icon || 'Link'}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Icon"
        >
          {AVAILABLE_ICONS.map((icon) => (
            <option key={icon} value={icon}>{icon}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Parent Item</label>
        <select
          value={form.parent_id || ''}
          onChange={(e) => setForm({ ...form, parent_id: e.target.value || undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Parent item"
        >
          <option value="">None (Top Level)</option>
          {navItems.filter(n => !n.parent_id).map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
        <Input
          value={form.badge_text || ''}
          onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
          placeholder="e.g., New, Beta"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Badge Color</label>
        <select
          value={form.badge_color || 'blue'}
          onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Badge color"
        >
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="red">Red</option>
          <option value="yellow">Yellow</option>
          <option value="purple">Purple</option>
        </select>
      </div>
    </div>
    <div className="flex gap-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_external || false}
          onChange={(e) => setForm({ ...form, is_external: e.target.checked })}
        />
        <span className="text-sm">External link</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_active !== false}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        <span className="text-sm">Active</span>
      </label>
    </div>
  </div>
);

const AnnouncementForm: React.FC<FormProps<AdvisorAnnouncement>> = ({ form, setForm }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
      <Input
        value={form.title || ''}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Announcement title"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
      <RichTextEditor
        content={form.content_html || ''}
        onChange={(html) => setForm({ ...form, content_html: html, content: html.replace(/<[^>]*>/g, '') })}
        placeholder="Announcement content..."
        minHeight="150px"
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          value={form.type || 'info'}
          onChange={(e) => setForm({ ...form, type: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Type"
        >
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
        <select
          value={form.target_audience || 'all'}
          onChange={(e) => setForm({ ...form, target_audience: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Target audience"
        >
          <option value="all">All Advisors</option>
          <option value="new_advisors">New Advisors Only</option>
          <option value="certified">Certified Advisors Only</option>
        </select>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <Input
          type="date"
          value={form.start_date?.split('T')[0] || ''}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
        <Input
          type="date"
          value={form.end_date?.split('T')[0] || ''}
          onChange={(e) => setForm({ ...form, end_date: e.target.value || undefined })}
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
        <Input
          value={form.link_url || ''}
          onChange={(e) => setForm({ ...form, link_url: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link Text</label>
        <Input
          value={form.link_text || ''}
          onChange={(e) => setForm({ ...form, link_text: e.target.value })}
          placeholder="Learn more"
        />
      </div>
    </div>
    <div className="flex gap-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_dismissible !== false}
          onChange={(e) => setForm({ ...form, is_dismissible: e.target.checked })}
        />
        <span className="text-sm">Dismissible</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_active !== false}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        <span className="text-sm">Active</span>
      </label>
    </div>
  </div>
);

const MeetingForm: React.FC<FormProps<AdvisorMeeting>> = ({ form, setForm }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title *</label>
      <Input
        value={form.title || ''}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="e.g., Advisor Town Hall"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <Textarea
        value={form.description || ''}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Brief description of the meeting"
        rows={2}
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date *</label>
        <Input
          type="datetime-local"
          value={form.scheduled_at?.slice(0, 16) || ''}
          onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
        <Input
          type="number"
          value={form.duration_minutes || 60}
          onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
          min={15}
          max={480}
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Agenda (optional)</label>
      <Textarea
        value={form.agenda || ''}
        onChange={(e) => setForm({ ...form, agenda: e.target.value })}
        placeholder="Meeting agenda or talking points..."
        rows={3}
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
      <select
        value={form.status || 'scheduled'}
        onChange={(e) => setForm({ ...form, status: e.target.value as AdvisorMeeting['status'] })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        aria-label="Status"
      >
        <option value="scheduled">Scheduled</option>
        <option value="live">Live</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
    <div className="border-t pt-4">
      <label className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          checked={form.is_recurring || false}
          onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
        />
        <span className="text-sm font-medium">Recurring Meeting</span>
      </label>
      {form.is_recurring && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence Pattern</label>
          <select
            value={form.recurrence_pattern || 'biweekly'}
            onChange={(e) => setForm({ ...form, recurrence_pattern: e.target.value as AdvisorMeeting['recurrence_pattern'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            aria-label="Recurrence pattern"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      )}
    </div>
  </div>
);

// SOP Form Component
const SOPForm: React.FC<FormProps<SOPDocument>> = ({ form, setForm }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
      <Input
        value={form.title || ''}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="SOP title"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <Textarea
        value={form.description || ''}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Brief description of this SOP"
        rows={3}
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <select
          value={form.category || 'general'}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          aria-label="Category"
        >
          <option value="general">General</option>
          <option value="sales">Sales</option>
          <option value="enrollment">Enrollment</option>
          <option value="member_services">Member Services</option>
          <option value="compliance">Compliance</option>
          <option value="training">Training</option>
          <option value="operations">Operations</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
        <Input
          value={form.version || '1.0'}
          onChange={(e) => setForm({ ...form, version: e.target.value })}
          placeholder="1.0"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Document URL</label>
      <Input
        value={form.file_url || ''}
        onChange={(e) => setForm({ ...form, file_url: e.target.value })}
        placeholder="https://... (link to PDF or document)"
      />
      <p className="text-xs text-gray-500 mt-1">Link to the SOP document (PDF, Google Doc, etc.)</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
      <Input
        value={(form.tags || []).join(', ')}
        onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
        placeholder="tag1, tag2, tag3"
      />
      <p className="text-xs text-gray-500 mt-1">Comma-separated tags for search</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Content (Optional)</label>
      <Textarea
        value={form.content || ''}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        placeholder="Optional content preview or summary..."
        rows={4}
      />
    </div>

    <div className="flex gap-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_active !== false}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        <span className="text-sm">Active (visible to advisors)</span>
      </label>
    </div>
  </div>
);
