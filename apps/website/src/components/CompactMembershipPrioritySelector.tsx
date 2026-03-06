import React from 'react';
import { Check } from 'lucide-react';
import { membershipPriorities, MembershipPriority } from '../lib/membershipPriorities';
import { cn } from '../lib/utils';

interface CompactMembershipPrioritySelectorProps {
  selectedPriorities: string[];
  onChange: (priorities: string[]) => void;
  className?: string;
  /** Start expanded for better visibility (e.g. in multi-step forms) — kept for API compat, ignored in simplified UI */
  defaultExpanded?: boolean;
}

export const CompactMembershipPrioritySelector: React.FC<CompactMembershipPrioritySelectorProps> = ({
  selectedPriorities,
  onChange,
  className,
}) => {
  const handleToggle = (priorityId: string) => {
    if (selectedPriorities.includes(priorityId)) {
      onChange(selectedPriorities.filter((id) => id !== priorityId));
    } else {
      onChange([...selectedPriorities, priorityId]);
    }
  };

  const displayLabel = (p: MembershipPriority) => p.shortLabel || p.label;

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-xs text-gray-500">
        Tap to select — pick 1–3 that matter most. All plans include $0 virtual care.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {membershipPriorities.map((priority) => {
          const isSelected = selectedPriorities.includes(priority.id);
          const Icon = priority.icon;
          return (
            <button
              key={priority.id}
              type="button"
              onClick={() => handleToggle(priority.id)}
              className={cn(
                'flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all',
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                  isSelected ? 'bg-blue-100' : 'bg-gray-100'
                )}
              >
                <Icon className={cn('h-4 w-4', isSelected ? 'text-blue-600' : 'text-gray-600')} />
              </div>
              <span
                className={cn(
                  'text-sm font-medium leading-tight',
                  isSelected ? 'text-blue-900' : 'text-gray-900'
                )}
              >
                {displayLabel(priority)}
              </span>
              {isSelected && (
                <div className="ml-auto w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedPriorities.length > 0 && (
        <p className="text-xs text-gray-500">
          {selectedPriorities.length} selected — {selectedPriorities.length < 2 ? 'add more if you like' : 'good to go'}
        </p>
      )}
    </div>
  );
};

// Re-export with old name for backwards compatibility
export const CompactCoveragePrioritySelector = CompactMembershipPrioritySelector;
