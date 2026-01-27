import { Users, GitBranch, Mail, Download, X } from 'lucide-react';

interface Props {
  selectedCount: number;
  onAssign: () => void;
  onChangeStage: () => void;
  onSendEmail: () => void;
  onExport: () => void;
  onClear: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onAssign,
  onChangeStage,
  onSendEmail,
  onExport,
  onClear,
}: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-20 bg-th-accent-600 text-white rounded-xl px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-semibold">{selectedCount} selected</span>
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
        <button
          onClick={onExport}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
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
