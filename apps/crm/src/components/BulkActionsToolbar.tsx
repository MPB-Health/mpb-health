import { Users, GitBranch, Mail, Download, Trash2, X, RefreshCw, UserCheck, GitMerge, Tag, XCircle } from 'lucide-react';

interface Props {
  selectedCount: number;
  onAssign: () => void;
  onChangeStage: () => void;
  onSendEmail: () => void;
  onExport: () => void;
  onDelete?: () => void;
  onMassUpdate?: () => void;
  onMassTransfer?: () => void;
  onMerge?: () => void;
  onTagManager?: () => void;
  /** Section 6: bulk-mark selected leads as Lost (DNC). */
  onMarkLost?: () => void;
  onClear: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onAssign,
  onChangeStage,
  onSendEmail,
  onExport,
  onDelete,
  onMassUpdate,
  onMassTransfer,
  onMerge,
  onTagManager,
  onMarkLost,
  onClear,
}: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-20 bg-th-accent-600 text-white rounded-xl px-6 py-3 flex items-center justify-between shadow-lg glow-accent">
      <div className="flex items-center space-x-3 flex-wrap gap-y-2">
        <span className="text-sm font-semibold tabular-nums">{selectedCount} selected</span>
        <div className="h-5 w-px bg-white/30" />
        <button
          onClick={onAssign}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <Users className="w-4 h-4" />
          <span>Assign</span>
        </button>
        <button
          onClick={onChangeStage}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <GitBranch className="w-4 h-4" />
          <span>Change Stage</span>
        </button>
        <button
          onClick={onSendEmail}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <Mail className="w-4 h-4" />
          <span>Send Email</span>
        </button>
        {onMassUpdate && (
          <button
            onClick={onMassUpdate}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Mass Update</span>
          </button>
        )}
        {onMassTransfer && (
          <button
            onClick={onMassTransfer}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            <span>Transfer</span>
          </button>
        )}
        {onMerge && selectedCount >= 2 && (
          <button
            onClick={onMerge}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <GitMerge className="w-4 h-4" />
            <span>Merge</span>
          </button>
        )}
        {onTagManager && (
          <button
            onClick={onTagManager}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <Tag className="w-4 h-4" />
            <span>Tags</span>
          </button>
        )}
        {onMarkLost && (
          <button
            onClick={onMarkLost}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-500/80 transition-colors"
            title="Mark selected leads as Lost (DNC)"
          >
            <XCircle className="w-4 h-4" />
            <span>Mark Lost</span>
          </button>
        )}
        <button
          onClick={onExport}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-500/80 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        )}
      </div>
      <button
        onClick={onClear}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
        <span>Clear</span>
      </button>
    </div>
  );
}
