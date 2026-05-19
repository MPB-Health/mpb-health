import { X } from 'lucide-react';
import type { CmsBlock } from '@mpbhealth/database';

interface BlockInspectorProps {
  block: CmsBlock | null;
  onUpdate: (block: CmsBlock) => void;
  onClose: () => void;
  renderBlockForm: (block: CmsBlock, onChange: (b: CmsBlock) => void) => React.ReactNode;
}

export function BlockInspector({ block, onUpdate, onClose, renderBlockForm }: BlockInspectorProps) {
  if (!block) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <p className="text-th-text-secondary font-medium">No block selected</p>
        <p className="text-sm text-th-text-tertiary mt-1">
          Click a block in the canvas to edit its settings here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-th-border">
        <h3 className="text-sm font-semibold text-th-text-primary capitalize">
          {block.kind.replace(/_/g, ' ')} Settings
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-th-text-tertiary hover:bg-surface-tertiary"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {renderBlockForm(block, onUpdate)}
      </div>
    </div>
  );
}
