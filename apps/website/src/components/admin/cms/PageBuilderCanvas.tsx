import { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import type { CmsBlock } from '@mpbhealth/database';
import { SortableBlock } from './SortableBlock';

type Viewport = 'desktop' | 'tablet' | 'mobile';

interface PageBuilderCanvasProps {
  blocks: CmsBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onRemoveBlock: (id: string) => void;
}

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export function PageBuilderCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onRemoveBlock,
}: PageBuilderCanvasProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const canvasRef = useRef<HTMLDivElement>(null);

  const { setNodeRef } = useDroppable({ id: 'canvas-droppable' });

  return (
    <div className="flex flex-col h-full">
      {/* Viewport switcher */}
      <div className="flex items-center justify-center gap-1 px-4 py-2 border-b border-th-border bg-surface-secondary/50">
        <button
          type="button"
          onClick={() => setViewport('desktop')}
          className={`p-2 rounded-md transition-colors ${viewport === 'desktop' ? 'bg-th-accent-600 text-white' : 'text-th-text-tertiary hover:bg-surface-tertiary'}`}
          title="Desktop"
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setViewport('tablet')}
          className={`p-2 rounded-md transition-colors ${viewport === 'tablet' ? 'bg-th-accent-600 text-white' : 'text-th-text-tertiary hover:bg-surface-tertiary'}`}
          title="Tablet"
        >
          <Tablet className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setViewport('mobile')}
          className={`p-2 rounded-md transition-colors ${viewport === 'mobile' ? 'bg-th-accent-600 text-white' : 'text-th-text-tertiary hover:bg-surface-tertiary'}`}
          title="Mobile"
        >
          <Smartphone className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-y-auto bg-neutral-100 p-6"
        onClick={() => onSelectBlock(null)}
      >
        <div
          ref={setNodeRef}
          className="mx-auto bg-white shadow-sm rounded-lg min-h-[600px] transition-all duration-300"
          style={{ maxWidth: VIEWPORT_WIDTHS[viewport] }}
        >
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 border-2 border-dashed border-neutral-200 rounded-lg m-4">
              <p className="text-neutral-500 font-medium">Empty page</p>
              <p className="text-sm text-neutral-400 mt-1">
                Drag blocks from the palette on the right, or click "Add Section" below.
              </p>
            </div>
          ) : (
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => onSelectBlock(block.id)}
                  onRemove={() => onRemoveBlock(block.id)}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </div>
    </div>
  );
}
