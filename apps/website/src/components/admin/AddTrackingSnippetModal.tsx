import React, { useEffect, useState } from 'react';
import { X, Plus, Code, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { analyticsTrackingService, TrackingPlatform } from '../../lib/analyticsTrackingService';
import { useAuth } from '../../contexts/AuthContext';

interface AddTrackingSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTrackingSnippetModal: React.FC<AddTrackingSnippetModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [platforms, setPlatforms] = useState<TrackingPlatform[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (isOpen) {
      loadPlatforms();
    }
  }, [isOpen]);

  const loadPlatforms = async () => {
    try {
      const data = await analyticsTrackingService.getTrackingPlatforms(true);
      setPlatforms(data);
      if (data.length > 0 && !formData.platform_id) {
        setFormData(prev => ({ ...prev, platform_id: data[0].id }));
      }
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

      await analyticsTrackingService.createTrackingSnippet({
        platform_id: formData.platform_id,
        snippet_name: formData.snippet_name,
        tracking_id: formData.tracking_id || undefined,
        snippet_code: formData.snippet_code || undefined,
        snippet_type: formData.snippet_type,
        injection_point: formData.injection_point,
        is_enabled: formData.is_enabled,
        is_test_mode: formData.is_test_mode,
        load_priority: parseInt(String(formData.load_priority)) || 100,
        custom_parameters: customParams,
        created_by: user?.id
      });

      // Reset form
      setFormData({
        platform_id: platforms[0]?.id || '',
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

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating snippet:', err);
      setError(err.message || 'Failed to create tracking snippet');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
                <h2 className="text-xl font-bold text-neutral-900">Add Tracking Snippet</h2>
                <p className="text-sm text-neutral-600">Configure a new analytics pixel or tracking code</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

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
                The unique identifier for your tracking account (GA4 Measurement ID, Pixel ID, etc.)
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
              <p className="mt-1 text-xs text-neutral-500">
                The full JavaScript snippet provided by your analytics platform
              </p>
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
                Higher numbers load first. Default is 100. Use 200+ for critical tracking.
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

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
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
                    <Plus className="h-4 w-4" />
                    Add Snippet
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

