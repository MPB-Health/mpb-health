import React, { useEffect, useState } from 'react';
import {
  Code,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Play,
  Pause,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { analyticsTrackingService, TrackingSnippet, TrackingPlatform } from '../../lib/analyticsTrackingService';
import { AddTrackingSnippetModal } from './AddTrackingSnippetModal';
import { EditTrackingSnippetModal } from './EditTrackingSnippetModal';

export const AnalyticsIntegrationPanel: React.FC = () => {
  const [platforms, setPlatforms] = useState<TrackingPlatform[]>([]);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<TrackingSnippet | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedPlatform]);

  const loadData = async () => {
    try {
      const [platformsData, snippetsData] = await Promise.all([
        analyticsTrackingService.getTrackingPlatforms(true),
        analyticsTrackingService.getTrackingSnippets(
          selectedPlatform !== 'all' ? selectedPlatform : undefined
        )
      ]);

      setPlatforms(platformsData);
      setSnippets(snippetsData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSnippetStatus = async (snippet: TrackingSnippet) => {
    try {
      await analyticsTrackingService.updateTrackingSnippet(snippet.id, {
        is_enabled: !snippet.is_enabled
      });
      loadData();
    } catch (error) {
      console.error('Error toggling snippet:', error);
      alert('Failed to update snippet status');
    }
  };

  const toggleTestMode = async (snippet: TrackingSnippet) => {
    try {
      await analyticsTrackingService.updateTrackingSnippet(snippet.id, {
        is_test_mode: !snippet.is_test_mode
      });
      loadData();
    } catch (error) {
      console.error('Error toggling test mode:', error);
      alert('Failed to update test mode');
    }
  };

  const deleteSnippet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tracking snippet?')) return;

    try {
      await analyticsTrackingService.deleteTrackingSnippet(id);
      loadData();
    } catch (error) {
      console.error('Error deleting snippet:', error);
      alert('Failed to delete snippet');
    }
  };

  const copySnippetCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  const getStatusColor = (snippet: TrackingSnippet) => {
    if (!snippet.is_enabled) return 'text-neutral-400';
    if (snippet.is_test_mode) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (snippet: TrackingSnippet) => {
    if (!snippet.is_enabled) return <Pause className="h-4 w-4" />;
    if (snippet.is_test_mode) return <AlertCircle className="h-4 w-4" />;
    return <Play className="h-4 w-4" />;
  };

  const getStatusText = (snippet: TrackingSnippet) => {
    if (!snippet.is_enabled) return 'Disabled';
    if (snippet.is_test_mode) return 'Test Mode';
    return 'Active';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-neutral-600">Loading analytics integrations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Analytics Integration Management</h2>
          <p className="text-neutral-600">Configure tracking pixels, snippets, and analytics platforms</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Tracking Snippet
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            selectedPlatform === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          All Platforms
        </button>
        {platforms.map(platform => (
          <button
            key={platform.id}
            onClick={() => setSelectedPlatform(platform.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedPlatform === platform.id
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {platform.display_name}
          </button>
        ))}
      </div>

      {snippets.length === 0 ? (
        <Card className="p-12 text-center">
          <Code className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No tracking snippets configured</h3>
          <p className="text-neutral-600 mb-4">
            Add your first tracking snippet to start collecting analytics data
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            Add Tracking Snippet
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {snippets.map(snippet => (
            <Card key={snippet.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {snippet.snippet_name}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(snippet)}`}>
                      {getStatusIcon(snippet)}
                      {getStatusText(snippet)}
                    </span>
                    {snippet.tracking_platforms && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {snippet.tracking_platforms.display_name}
                      </span>
                    )}
                  </div>
                  {snippet.tracking_id && (
                    <p className="text-sm text-neutral-600 mb-2">
                      <span className="font-medium">Tracking ID:</span>{' '}
                      <code className="px-2 py-1 bg-neutral-100 rounded text-xs">{snippet.tracking_id}</code>
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span>Priority: {snippet.load_priority}</span>
                    <span>Type: {snippet.snippet_type}</span>
                    <span>Inject: {snippet.injection_point}</span>
                    <span>Version: {snippet.version}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSnippetStatus(snippet)}
                    className={`p-2 rounded-lg transition-colors ${
                      snippet.is_enabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                    title={snippet.is_enabled ? 'Disable' : 'Enable'}
                  >
                    {snippet.is_enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => toggleTestMode(snippet)}
                    className={`p-2 rounded-lg transition-colors ${
                      snippet.is_test_mode
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                    title={snippet.is_test_mode ? 'Disable Test Mode' : 'Enable Test Mode'}
                  >
                    <AlertCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingSnippet(snippet)}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteSnippet(snippet.id)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {snippet.snippet_code && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-neutral-700">Snippet Code</span>
                    <button
                      onClick={() => copySnippetCode(snippet.snippet_code)}
                      className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy Code
                    </button>
                  </div>
                  <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{snippet.snippet_code}</code>
                  </pre>
                </div>
              )}

              {Object.keys(snippet.custom_parameters).length > 0 && (
                <div className="mt-4">
                  <span className="text-xs font-medium text-neutral-700 block mb-2">Custom Parameters</span>
                  <div className="bg-neutral-50 p-3 rounded-lg">
                    <pre className="text-xs text-neutral-700">
                      {JSON.stringify(snippet.custom_parameters, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Integration Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Test mode logs events to console instead of sending to live platforms</li>
              <li>• Higher priority numbers load first (100 = default, 200 = high priority)</li>
              <li>• Disabled snippets will not be injected into pages</li>
              <li>• Always test changes in a staging environment before deploying to production</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Add Tracking Snippet Modal */}
      <AddTrackingSnippetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadData}
      />

      {/* Edit Tracking Snippet Modal */}
      <EditTrackingSnippetModal
        snippet={editingSnippet}
        onClose={() => setEditingSnippet(null)}
        onSuccess={loadData}
      />
    </div>
  );
};
