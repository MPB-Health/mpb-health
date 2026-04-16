import React, { useEffect, useState } from 'react';
import { Search, Save, Globe, Plus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { adminAnalyticsService, SEOMetadata } from '../../lib/adminAnalyticsService';
import { useAuth } from '../../contexts/AuthContext';

export const SEOManagementPanel: React.FC = () => {
  const { user } = useAuth();
  const [metadataList, setMetadataList] = useState<SEOMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SEOMetadata>>({
    page_path: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    canonical_url: '',
    robots: 'index, follow'
  });

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const data = await adminAnalyticsService.getSEOMetadata();
      setMetadataList(data as unknown as SEOMetadata[]);
    } catch (error) {
      console.error('Error loading SEO metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (metadata: SEOMetadata) => {
    setEditingPath(metadata.page_path);
    setFormData(metadata);
  };

  const handleSave = async () => {
    if (!user?.id || !formData.page_path) return;

    try {
      const updatedMetadata = await adminAnalyticsService.upsertSEOMetadata({
        ...formData,
        updated_by: user.id
      });

      if (editingPath) {
        setMetadataList(metadataList.map(m =>
          m.page_path === editingPath ? updatedMetadata : m
        ));
      } else {
        setMetadataList([...metadataList, updatedMetadata]);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving SEO metadata:', error);
      alert('Failed to save SEO metadata');
    }
  };

  const resetForm = () => {
    setEditingPath(null);
    setFormData({
      page_path: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      og_image: '',
      canonical_url: '',
      robots: 'index, follow'
    });
  };

  const commonPages = [
    '/',
    '/about-us',
    '/contact',
    '/plans',
    '/enrollment',
    '/how-it-works',
    '/faq',
    '/blog',
    '/advisors'
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-neutral-600">Loading SEO settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">SEO Management</h2>
          <p className="text-neutral-600">Optimize meta tags and search engine visibility</p>
        </div>
        <Button
          onClick={() => setEditingPath('new')}
          className="inline-flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Page SEO
        </Button>
      </div>

      {editingPath && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            {editingPath === 'new' ? 'Add New Page SEO' : `Edit SEO: ${editingPath}`}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Page Path *
              </label>
              <input
                type="text"
                value={formData.page_path}
                onChange={(e) => setFormData({ ...formData, page_path: e.target.value })}
                placeholder="/page-path"
                disabled={editingPath !== 'new'}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {commonPages.map(path => (
                  <button
                    key={path}
                    onClick={() => setFormData({ ...formData, page_path: path })}
                    className="px-2 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 rounded"
                  >
                    {path}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="Page Title for Search Results"
                  maxLength={60}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {formData.meta_title?.length || 0}/60 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Canonical URL
                </label>
                <input
                  type="text"
                  value={formData.canonical_url}
                  onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                  placeholder="https://mpb.health/page"
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="Brief description for search results"
                maxLength={160}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-neutral-500 mt-1">
                {formData.meta_description?.length || 0}/160 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Meta Keywords
              </label>
              <input
                type="text"
                value={formData.meta_keywords}
                onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                placeholder="keyword1, keyword2, keyword3"
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">OpenGraph / Social Media</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    OG Title
                  </label>
                  <input
                    type="text"
                    value={formData.og_title}
                    onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                    placeholder="Title for social media shares"
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    OG Description
                  </label>
                  <textarea
                    value={formData.og_description}
                    onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                    placeholder="Description for social media shares"
                    rows={2}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    OG Image URL
                  </label>
                  <input
                    type="text"
                    value={formData.og_image}
                    onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                    placeholder="https://mpb.health/assets/og-image.jpg"
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Robots Directive
              </label>
              <select
                value={formData.robots}
                onChange={(e) => setFormData({ ...formData, robots: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="index, follow">Index, Follow</option>
                <option value="noindex, follow">No Index, Follow</option>
                <option value="index, nofollow">Index, No Follow</option>
                <option value="noindex, nofollow">No Index, No Follow</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4 border-t border-neutral-200">
              <Button onClick={handleSave} className="inline-flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save SEO Settings
              </Button>
              <Button onClick={resetForm} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          Configured Pages
        </h3>

        <div className="space-y-3">
          {metadataList.map(metadata => (
            <div
              key={metadata.id}
              className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                    <h4 className="font-medium text-neutral-900">{metadata.page_path}</h4>
                    <span className="px-2 py-0.5 bg-neutral-200 text-neutral-700 text-xs rounded">
                      {metadata.robots}
                    </span>
                  </div>
                  {metadata.meta_title && (
                    <p className="text-sm text-neutral-700 mb-1">{metadata.meta_title}</p>
                  )}
                  {metadata.meta_description && (
                    <p className="text-xs text-neutral-600 line-clamp-2">{metadata.meta_description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleEdit(metadata)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex-shrink-0"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {metadataList.length === 0 && (
          <div className="text-center py-12 text-neutral-600">
            No SEO metadata configured yet. Add your first page!
          </div>
        )}
      </Card>
    </div>
  );
};
