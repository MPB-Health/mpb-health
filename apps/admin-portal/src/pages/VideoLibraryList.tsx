import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Video,
  Loader2,
  X,
  Save,
} from 'lucide-react';
import { videoService, type AdvisorVideo } from '@mpbhealth/admin-core';
import { supabase } from '@mpbhealth/database';

type VideoFormData = Omit<AdvisorVideo, 'id' | 'created_at' | 'updated_at'>;

const EMPTY_FORM: VideoFormData = {
  title: '',
  vimeo_id: '',
  vimeo_hash: '',
  thumbnail_url: '',
  description: '',
  order_index: 0,
  is_active: true,
  category: 'training',
  tags: [],
  duration: '',
};

export default function VideoLibraryList() {
  const [videos, setVideos] = useState<AdvisorVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<AdvisorVideo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalForm, setModalForm] = useState<VideoFormData>(EMPTY_FORM);
  const [modalSaving, setModalSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Admin needs all videos (including inactive), so query directly
      const { data, error } = await supabase
        .from('advisor_videos')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      setVideos((data || []) as AdvisorVideo[]);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (video: AdvisorVideo) => {
    try {
      await videoService.updateVideo(video.id, { is_active: !video.is_active });
      toast.success(video.is_active ? 'Video hidden' : 'Video activated');
      loadData();
    } catch (error) {
      toast.error('Failed to update video');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    setDeleting(id);
    try {
      await videoService.deleteVideo(id);
      toast.success('Video deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete video');
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = (video: AdvisorVideo) => {
    setEditingVideo(video);
    setModalForm({
      title: video.title,
      vimeo_id: video.vimeo_id,
      vimeo_hash: video.vimeo_hash || '',
      thumbnail_url: video.thumbnail_url || '',
      description: video.description || '',
      order_index: video.order_index,
      is_active: video.is_active,
      category: video.category || 'training',
      tags: video.tags || [],
      duration: video.duration || '',
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingVideo(null);
    setModalForm({ ...EMPTY_FORM, order_index: videos.length });
    setShowModal(true);
  };

  const handleModalSave = async () => {
    if (!modalForm.title.trim() || !modalForm.vimeo_id.trim()) {
      toast.error('Title and Vimeo ID are required');
      return;
    }
    setModalSaving(true);
    try {
      const payload = {
        ...modalForm,
        vimeo_hash: modalForm.vimeo_hash || null,
        thumbnail_url: modalForm.thumbnail_url || null,
        description: modalForm.description || null,
      };

      if (editingVideo) {
        await videoService.updateVideo(editingVideo.id, payload);
        toast.success('Video updated!');
      } else {
        await videoService.createVideo(payload);
        toast.success('Video added!');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error('Failed to save video');
    } finally {
      setModalSaving(false);
    }
  };

  const filtered = videos.filter(
    (v) =>
      !searchQuery ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vimeo_id.includes(searchQuery),
  );

  const totalActive = videos.filter((v) => v.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Video Library</h1>
          <p className="text-th-text-tertiary text-sm mt-1">Manage Vimeo-hosted videos for advisors</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center space-x-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Video</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total Videos', value: videos.length, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Active', value: totalActive, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${s.color}`}>
              <Video className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{s.value}</p>
              <p className="text-sm text-th-text-tertiary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search videos..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-xl text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-surface-primary rounded-xl border border-th-border text-center py-16">
          <Video className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
          <h3 className="text-lg font-semibold text-th-text-primary mb-1">No videos found</h3>
          <p className="text-th-text-tertiary">
            {searchQuery ? 'Try a different search' : 'Add your first video'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((video) => (
            <div
              key={video.id}
              className={`bg-surface-primary rounded-xl border border-th-border overflow-hidden group ${
                !video.is_active ? 'opacity-60' : ''
              }`}
            >
              {/* Thumbnail / Preview */}
              <div className="relative aspect-video bg-gray-900">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-10 h-10 text-gray-600" />
                  </div>
                )}
                {!video.is_active && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">Hidden</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                  Vimeo {video.vimeo_id}
                </div>
              </div>

              {/* Info + Actions */}
              <div className="p-4">
                <h3 className="font-medium text-th-text-primary line-clamp-1 mb-1">{video.title}</h3>
                {video.description && (
                  <p className="text-xs text-th-text-tertiary line-clamp-2 mb-3">{video.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-th-text-tertiary">Order: {video.order_index}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(video)}
                      title={video.is_active ? 'Hide' : 'Show'}
                      className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                    >
                      {video.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(video)}
                      title="Edit"
                      className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      disabled={deleting === video.id}
                      title="Delete"
                      className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      {deleting === video.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-th-border">
              <h3 className="text-lg font-semibold text-th-text-primary">
                {editingVideo ? 'Edit Video' : 'Add Video'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-th-text-tertiary hover:text-th-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Title *</label>
                <input
                  type="text"
                  value={modalForm.title}
                  onChange={(e) => setModalForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Video title"
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Vimeo ID *</label>
                  <input
                    type="text"
                    value={modalForm.vimeo_id}
                    onChange={(e) => setModalForm((p) => ({ ...p, vimeo_id: e.target.value }))}
                    placeholder="123456789"
                    className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Vimeo Hash</label>
                  <input
                    type="text"
                    value={modalForm.vimeo_hash || ''}
                    onChange={(e) => setModalForm((p) => ({ ...p, vimeo_hash: e.target.value }))}
                    placeholder="Private hash (optional)"
                    className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Description</label>
                <textarea
                  value={modalForm.description || ''}
                  onChange={(e) => setModalForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Thumbnail URL</label>
                  <input
                    type="url"
                    value={modalForm.thumbnail_url || ''}
                    onChange={(e) => setModalForm((p) => ({ ...p, thumbnail_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Order</label>
                  <input
                    type="number"
                    min="0"
                    value={modalForm.order_index}
                    onChange={(e) => setModalForm((p) => ({ ...p, order_index: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Category</label>
                  <select
                    title="Video category"
                    value={modalForm.category || 'training'}
                    onChange={(e) => setModalForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  >
                    <option value="training">Advisor Training</option>
                    <option value="marketing">Share with Members</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Duration</label>
                  <input
                    type="text"
                    value={modalForm.duration || ''}
                    onChange={(e) => setModalForm((p) => ({ ...p, duration: e.target.value }))}
                    placeholder="e.g. 12 min"
                    className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Tags</label>
                <input
                  type="text"
                  value={(modalForm.tags || []).join(', ')}
                  onChange={(e) => setModalForm((p) => ({ ...p, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
                <p className="text-xs text-th-text-tertiary mt-1">Comma-separated tags for search filtering</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalForm.is_active}
                  onChange={(e) => setModalForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                />
                <span className="text-sm text-th-text-secondary">Active (visible to advisors)</span>
              </label>
              {modalForm.vimeo_id && (
                <div className="bg-surface-secondary rounded-lg p-3 text-xs text-th-text-tertiary">
                  Preview URL: https://vimeo.com/{modalForm.vimeo_id}
                  {modalForm.vimeo_hash ? `?h=${modalForm.vimeo_hash}` : ''}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-th-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-th-border rounded-xl text-th-text-secondary hover:bg-surface-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                disabled={modalSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
              >
                {modalSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{editingVideo ? 'Update' : 'Add Video'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
