import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Video,
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
  Search,
  Play,
  Image,
  X,
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

interface AdvisorVideo {
  id: string;
  title: string;
  vimeo_id: string;
  vimeo_hash: string | null;
  thumbnail_url: string | null;
  description: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function VideosManager() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<AdvisorVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AdvisorVideo | null>(null);
  const [form, setForm] = useState<Partial<AdvisorVideo>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('advisor_videos')
        .select('id, title, vimeo_id, vimeo_hash, thumbnail_url, description, order_index, is_active, created_at, updated_at')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(filteredVideos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index,
    }));

    setVideos((prev) => {
      const otherItems = prev.filter(
        (v) => !updatedItems.find((u) => u.id === v.id)
      );
      return [...updatedItems, ...otherItems].sort(
        (a, b) => a.order_index - b.order_index
      );
    });

    setSaving(true);
    try {
      for (const item of updatedItems) {
        await supabase
          .from('advisor_videos')
          .update({ order_index: item.order_index })
          .eq('id', item.id);
      }
      toast.success('Order updated! Changes are live.');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
      loadVideos();
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setForm({
      title: '',
      vimeo_id: '',
      vimeo_hash: '',
      thumbnail_url: '',
      description: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (item: AdvisorVideo) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      vimeo_id: item.vimeo_id,
      vimeo_hash: item.vimeo_hash || '',
      thumbnail_url: item.thumbnail_url || '',
      description: item.description || '',
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.vimeo_id) {
      toast.error('Title and Vimeo ID are required');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('advisor_videos')
          .update({
            title: form.title,
            vimeo_id: form.vimeo_id,
            vimeo_hash: form.vimeo_hash || null,
            thumbnail_url: form.thumbnail_url || null,
            description: form.description || null,
            is_active: form.is_active,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Video updated! Changes are live in Advisor Portal.');
      } else {
        const maxOrder = Math.max(...videos.map((v) => v.order_index), -1);
        const { error } = await supabase
          .from('advisor_videos')
          .insert({
            title: form.title,
            vimeo_id: form.vimeo_id,
            vimeo_hash: form.vimeo_hash || null,
            thumbnail_url: form.thumbnail_url || null,
            description: form.description || null,
            order_index: maxOrder + 1,
            is_active: form.is_active ?? true,
          });

        if (error) throw error;
        toast.success('Video created! Now visible in Advisor Portal.');
      }

      setShowModal(false);
      loadVideos();
    } catch (error) {
      console.error('Error saving video:', error);
      toast.error('Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('advisor_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Video deleted');
      loadVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: AdvisorVideo) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('advisor_videos')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(item.is_active ? 'Video hidden from portal' : 'Video activated!');
      loadVideos();
    } catch (error) {
      console.error('Error toggling active state:', error);
      toast.error('Failed to update video');
    } finally {
      setSaving(false);
    }
  };

  const getThumbnailUrl = (video: AdvisorVideo): string => {
    if (video.thumbnail_url) return video.thumbnail_url;
    return `https://vumbnail.com/${video.vimeo_id}.jpg`;
  };

  const getVimeoEmbedUrl = (video: AdvisorVideo): string => {
    let url = `https://player.vimeo.com/video/${video.vimeo_id}`;
    if (video.vimeo_hash) url += `?h=${video.vimeo_hash}`;
    return url;
  };

  // Filter videos
  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.vimeo_id.includes(searchQuery);
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && video.is_active) ||
      (filterStatus === 'inactive' && !video.is_active);
    return matchesSearch && matchesStatus;
  });

  const activeCount = videos.filter((v) => v.is_active).length;
  const inactiveCount = videos.filter((v) => !v.is_active).length;

  return (
    <AdminLayout activeView="advisor-portal-cms" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <AdminBreadcrumb currentPage="Video Library Manager" />
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Video Library Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Manage the advisor portal video library
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/advisor-cms">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to CMS
              </Button>
            </Link>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800">
            Videos appear on the Advisor Portal Dashboard video library
          </span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Total Videos</p>
                  <p className="text-2xl font-bold text-blue-900">{videos.length}</p>
                </div>
                <Video className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Active</p>
                  <p className="text-2xl font-bold text-green-900">{activeCount}</p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">Hidden</p>
                  <p className="text-2xl font-bold text-gray-900">{inactiveCount}</p>
                </div>
                <EyeOff className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos by title or Vimeo ID..."
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            title="Filter by status"
            aria-label="Filter by status"
          >
            <option value="all">All Videos</option>
            <option value="active">Active Only</option>
            <option value="inactive">Hidden Only</option>
          </select>
        </div>

        {/* Videos List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Video Library
                </span>
                <Badge variant="secondary">{filteredVideos.length} videos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredVideos.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No videos found</p>
                  <Button onClick={handleCreate} variant="outline" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Video
                  </Button>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="videos">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
                      >
                        {filteredVideos.map((video, index) => (
                          <Draggable key={video.id} draggableId={video.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  'flex items-center gap-4 p-4 bg-white border rounded-lg transition-all',
                                  snapshot.isDragging && 'shadow-lg ring-2 ring-primary-500',
                                  !video.is_active && 'opacity-50'
                                )}
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="w-5 h-5 text-gray-400" />
                                </div>

                                {/* Thumbnail */}
                                <div
                                  className="relative w-28 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 cursor-pointer group"
                                  onClick={() => setPreviewVideoId(video.id)}
                                >
                                  <img
                                    src={getThumbnailUrl(video)}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://vumbnail.com/${video.vimeo_id}.jpg`;
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="w-6 h-6 text-white" />
                                  </div>
                                </div>

                                {/* Video Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 truncate">
                                      {video.title}
                                    </span>
                                    {!video.is_active && (
                                      <Badge variant="secondary" className="text-xs">
                                        Hidden
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-sm text-gray-500">
                                      Vimeo ID: {video.vimeo_id}
                                    </span>
                                    {video.vimeo_hash && (
                                      <span className="text-sm text-gray-400">
                                        Hash: {video.vimeo_hash}
                                      </span>
                                    )}
                                  </div>
                                  {video.description && (
                                    <p className="text-sm text-gray-500 mt-1 truncate">
                                      {video.description}
                                    </p>
                                  )}
                                </div>

                                {/* Order badge */}
                                <div className="flex-shrink-0">
                                  <Badge variant="outline" className="text-xs">
                                    #{video.order_index}
                                  </Badge>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPreviewVideoId(video.id)}
                                    title="Preview"
                                  >
                                    <Play className="w-4 h-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleActive(video)}
                                    title={video.is_active ? 'Hide' : 'Show'}
                                  >
                                    {video.is_active ? (
                                      <Eye className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <EyeOff className="w-4 h-4 text-gray-400" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(video)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(video.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
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
        )}

        {/* Video Preview Modal */}
        {previewVideoId && (() => {
          const previewVideo = videos.find((v) => v.id === previewVideoId);
          if (!previewVideo) return null;
          return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4">
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{previewVideo.title}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewVideoId(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="p-4">
                  <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                    <iframe
                      src={getVimeoEmbedUrl(previewVideo)}
                      className="absolute inset-0 w-full h-full rounded-lg"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={previewVideo.title}
                    />
                  </div>
                  {previewVideo.description && (
                    <p className="text-sm text-gray-600 mt-3">{previewVideo.description}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">
                  {editingItem ? 'Edit Video' : 'Add Video'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <Input
                    value={form.title || ''}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., MPB.Health Membership Overview"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vimeo ID *
                  </label>
                  <Input
                    value={form.vimeo_id || ''}
                    onChange={(e) => setForm({ ...form, vimeo_id: e.target.value })}
                    placeholder="e.g., 560882524"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The numeric ID from the Vimeo URL (e.g., vimeo.com/560882524)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vimeo Hash (optional)
                  </label>
                  <Input
                    value={form.vimeo_hash || ''}
                    onChange={(e) => setForm({ ...form, vimeo_hash: e.target.value })}
                    placeholder="e.g., 8a7898b305"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required for private/unlisted Vimeo videos (the hash after ?h= in the URL)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail URL (optional)
                  </label>
                  <Input
                    value={form.thumbnail_url || ''}
                    onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to auto-generate from Vimeo
                  </p>
                  {/* Thumbnail Preview */}
                  {(form.thumbnail_url || form.vimeo_id) && (
                    <div className="mt-2 relative w-full h-32 rounded-md overflow-hidden bg-gray-100">
                      <img
                        src={form.thumbnail_url || `https://vumbnail.com/${form.vimeo_id}.jpg`}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          <Image className="w-3 h-3 mr-1" />
                          Preview
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <Textarea
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of the video..."
                    rows={3}
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
              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
