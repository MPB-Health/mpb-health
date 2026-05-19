import { useCallback, useEffect, useState } from 'react';
import { Clock, RotateCcw, Eye, Loader2, X } from 'lucide-react';
import { revisionService, type CmsRevision, type RevisionEntityType } from '@mpbhealth/admin-core';
import toast from 'react-hot-toast';

interface RevisionHistoryProps {
  entityType: RevisionEntityType;
  entityId: string;
  onRestore: (snapshot: Record<string, unknown>) => void;
}

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function RevisionHistory({ entityType, entityId, onRestore }: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<CmsRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewRevision, setPreviewRevision] = useState<CmsRevision | null>(null);

  const loadRevisions = useCallback(async () => {
    if (!entityId) { setLoading(false); return; }
    try {
      const data = await revisionService.getRevisions(entityType, entityId);
      setRevisions(data);
    } catch (e) {
      console.error('Failed to load revisions', e);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    loadRevisions();
  }, [loadRevisions]);

  const handleRestore = (rev: CmsRevision) => {
    if (!window.confirm(`Restore version ${rev.version}? Current unsaved changes will be overwritten.`)) return;
    onRestore(rev.data_snapshot);
    toast.success(`Restored version ${rev.version}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-5 h-5 animate-spin text-th-accent-600" />
      </div>
    );
  }

  if (revisions.length === 0) {
    return (
      <div className="text-center p-6 text-sm text-th-text-tertiary">
        <Clock className="w-8 h-8 mx-auto mb-2 text-th-text-tertiary/50" />
        No revision history yet. Revisions are saved each time you publish or save.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-th-text-primary px-1 mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Revision History
      </h4>
      <div className="max-h-[400px] overflow-y-auto space-y-1">
        {revisions.map((rev) => (
          <div
            key={rev.id}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-surface-tertiary transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-th-text-primary">
                v{rev.version}
                {rev.change_summary && (
                  <span className="ml-2 text-xs font-normal text-th-text-tertiary">
                    {rev.change_summary}
                  </span>
                )}
              </p>
              <p className="text-xs text-th-text-tertiary">{formatRelativeTime(rev.created_at)}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => setPreviewRevision(rev)}
                title="Preview"
                className="p-1.5 rounded text-th-text-tertiary hover:bg-surface-secondary hover:text-th-text-primary"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleRestore(rev)}
                title="Restore this version"
                className="p-1.5 rounded text-th-text-tertiary hover:bg-th-accent-600/10 hover:text-th-accent-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      {previewRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setPreviewRevision(null)}>
          <div
            className="bg-surface-primary rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-th-border">
              <h3 className="text-lg font-semibold text-th-text-primary">Version {previewRevision.version}</h3>
              <button type="button" onClick={() => setPreviewRevision(null)} className="p-2 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <pre className="text-xs font-mono text-th-text-secondary bg-surface-secondary rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(previewRevision.data_snapshot, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end p-4 border-t border-th-border">
              <button
                type="button"
                onClick={() => handleRestore(previewRevision)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Restore this version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
