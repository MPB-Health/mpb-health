import React, { useEffect, useState } from 'react';
import { X, Save, Code, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { analyticsTrackingService, TrackingPlatform, TrackingSnippet } from '../../lib/analyticsTrackingService';

interface EditTrackingSnippetModalProps {
  snippet: TrackingSnippet | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditTrackingSnippetModal: React.FC<EditTrackingSnippetModalProps> = ({
  snippet,
  onClose,
  onSuccess
}) => {
  const [platforms, setPlatforms] = useState<TrackingPlatform[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    platform_id: '',
    snippet_name: '',
    tracking_id: '',
    snippet_code: '',
    snippet_type: 'javascript',
    injection_point: 'head',
    is_enabled: true,
    is_test_mode: false,
    load_priority: 100,
    custom_parameters: '{}'
  });

  useEffect(() => {
    if (snippet) {
      loadPlatforms();
      setFormData({
        platform_id: snippet.platform_id,
        snippet_name: snippet.snippet_name,
        tracking_id: snippet.tracking_id || '',
        snippet_code: snippet.snippet_code || '',
        snippet_type: snippet.snippet_type,
        injection_point: snippet.injection_point,
        is_enabled: snippet.is_enabled,
        is_test_mode: snippet.is_test_mode,
        load_priority: snippet.load_priority,
        custom_parameters: JSON.stringify(snippet.custom_parameters || {}, null, 2)
      });
    }
  }, [snippet]);

  const loadPlatforms = async () => {
    try {
      const data = await analyticsTrackingService.getTrackingPlatforms(true);
      setPlatforms(data);
    } catch (err) {
      console.error('Error loading platforms:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snippet) return;

    setError(null);
    setLoading(true);

    try {
      // Validate custom parameters JSON
      let customParams = {};
      if (formData.custom_parameters.trim()) {
        try {
          customParams = JSON.parse(formData.custom_parameters);
        } catch {
          throw new Error('Custom parameters must be valid JSON');
        }
      }

      await analyticsTrackingService.updateTrackingSnippet(snippet.id, {
        platform_id: formData.platform_id,
        snippet_name: formData.snippet_name,
        tracking_id: formData.tracking_id || undefined,
        snippet_code: formData.snippet_code || undefined,
        snippet_type: formData.snippet_type,
        injection_point: formData.injection_point,
        is_enabled: formData.is_enabled,
        is_test_mode: formData.is_test_mode,
        load_priority: parseInt(String(formData.load_priority)) || 100,
        custom_parameters: customParams
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Error updating snippet:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to update: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!snippet) return;

    setDeleting(true);
    try {
      await analyticsTrackingService.deleteTrackingSnippet(snippet.id);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Error deleting snippet:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete tracking snippet');
      setDeleting(false);
    }
  };

  if (!snippet) return null;

  const selectedPlatform = platforms.find(p => p.id === formData.platform_id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Code className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Edit Tracking Snippet</h2>
                <p className="text-sm text-neutral-600">Update your tracking configuration</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900">Delete this tracking snippet?</p>
                  <p className="text-sm text-red-700 mt-1">
                    This action cannot be undone. The snippet will be removed and tracking will stop immediately.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {deleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Delete Permanently
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Platform *
              </label>
              <select
                name="platform_id"
                value={formData.platform_id}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {platforms.map(platform => (
                  <option key={platform.id} value={platform.id}>
                    {platform.display_name} ({platform.platform_type})
                  </option>
                ))}
              </select>
              {selectedPlatform?.description && (
                <p className="mt-1 text-xs text-neutral-500">{selectedPlatform.description}</p>
              )}
            </div>

            {/* Snippet Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Snippet Name *
              </label>
              <input
                type="text"
                name="snippet_name"
                value={formData.snippet_name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Facebook Pixel - Main Site"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tracking ID */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Tracking ID
              </label>
              <input
                type="text"
                name="tracking_id"
                value={formData.tracking_id}
                onChange={handleInputChange}
                placeholder="e.g., G-XXXXXXXXXX or 1234567890"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-neutral-500">
                The unique identifier for your tracking account
              </p>
            </div>

            {/* Snippet Code */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Snippet Code
              </label>
              <textarea
                name="snippet_code"
                value={formData.snippet_code}
                onChange={handleInputChange}
                rows={6}
                placeholder="<script>&#10;  // Paste your tracking code here&#10;</script>"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            {/* Snippet Type & Injection Point */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Snippet Type
                </label>
                <select
                  name="snippet_type"
                  value={formData.snippet_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="pixel">Image Pixel</option>
                  <option value="iframe">iFrame</option>
                  <option value="noscript">NoScript</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Injection Point
                </label>
                <select
                  name="injection_point"
                  value={formData.injection_point}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="head">Head (Recommended)</option>
                  <option value="body_start">Body Start</option>
                  <option value="body_end">Body End</option>
                </select>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Load Priority
              </label>
              <input
                type="number"
                name="load_priority"
                value={formData.load_priority}
                onChange={handleInputChange}
                min="1"
                max="1000"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Higher numbers load first. Default is 100.
              </p>
            </div>

            {/* Custom Parameters */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Custom Parameters (JSON)
              </label>
              <textarea
                name="custom_parameters"
                value={formData.custom_parameters}
                onChange={handleInputChange}
                rows={3}
                placeholder='{"enhanced_ecommerce": true}'
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            {/* Toggle Options */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_enabled"
                  checked={formData.is_enabled}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 border-neutral-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-neutral-900">Enabled</span>
                  <p className="text-xs text-neutral-500">Snippet will be active on the site</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_test_mode"
                  checked={formData.is_test_mode}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-yellow-600 border-neutral-300 rounded focus:ring-2 focus:ring-yellow-500"
                />
                <div>
                  <span className="text-sm font-medium text-neutral-900">Test Mode</span>
                  <p className="text-xs text-neutral-500">Logs to console instead of live</p>
                </div>
              </label>
            </div>

            {/* Version Info */}
            <div className="p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>Version: {snippet.version}</span>
                <span>Created: {new Date(snippet.created_at).toLocaleDateString()}</span>
                <span>Updated: {new Date(snippet.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

