import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import type { PriorityLane as LaneType, PriorityItemWithDetails } from '@mpbhealth/champion-core';
import { PriorityItemCard } from './PriorityItemCard';

interface PriorityLaneProps {
  lane: LaneType;
  items: PriorityItemWithDetails[];
  loading?: boolean;
  isExpanded?: boolean;
  onItemClick?: (item: PriorityItemWithDetails) => void;
  onItemComplete?: (itemId: string) => void;
  onItemSnooze?: (itemId: string) => void;
  onItemMove?: (itemId: string) => void;
  onAddItem?: (laneId: string) => void;
}

export function PriorityLane({
  lane,
  items,
  loading = false,
  isExpanded: initialExpanded = true,
  onItemClick,
  onItemComplete,
  onItemSnooze,
  onItemMove,
  onAddItem,
}: PriorityLaneProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  return (
    <div className="bg-neutral-50 rounded-xl border border-neutral-200">
      {/* Lane header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-100 transition-colors rounded-t-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: lane.color }}
          />
          <h3 className="font-semibold text-neutral-900">{lane.name}</h3>
          <span className="px-2 py-0.5 bg-neutral-200 text-neutral-600 text-xs font-medium rounded-full">
            {items.length}
            {lane.max_items && ` / ${lane.max_items}`}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {onAddItem && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddItem(lane.id);
              }}
              className="p-1 hover:bg-neutral-200 rounded"
              title="Add item to lane"
            >
              <Plus className="w-4 h-4 text-neutral-500" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </div>

      {/* Lane description */}
      {lane.description && isExpanded && (
        <p className="px-4 pb-2 text-sm text-neutral-500">{lane.description}</p>
      )}

      {/* Items list */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-sm">
              No items in this lane
            </div>
          ) : (
            items.map((item) => (
              <PriorityItemCard
                key={item.id}
                item={item}
                onClick={() => onItemClick?.(item)}
                onComplete={() => onItemComplete?.(item.id)}
                onSnooze={() => onItemSnooze?.(item.id)}
                onMove={() => onItemMove?.(item.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
