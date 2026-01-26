import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { membershipPriorities, MembershipPriority, getPriorityById } from '../lib/membershipPriorities';
import { cn } from '../lib/utils';

interface CompactMembershipPrioritySelectorProps {
  selectedPriorities: string[];
  onChange: (priorities: string[]) => void;
  className?: string;
}

export const CompactMembershipPrioritySelector: React.FC<CompactMembershipPrioritySelectorProps> = ({
  selectedPriorities,
  onChange,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = (priorityId: string) => {
    if (selectedPriorities.includes(priorityId)) {
      onChange(selectedPriorities.filter((id) => id !== priorityId));
    } else {
      onChange([...selectedPriorities, priorityId]);
    }
  };

  const handleRemoveChip = (priorityId: string) => {
    onChange(selectedPriorities.filter((id) => id !== priorityId));
  };

  const handleSelectAll = () => {
    if (selectedPriorities.length === membershipPriorities.length) {
      onChange([]);
    } else {
      onChange(membershipPriorities.map((p) => p.id));
    }
  };

  return (
    <div className={cn('border-2 rounded-lg transition-all', isExpanded ? 'border-blue-500' : 'border-gray-200', className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-semibold text-gray-900">
            Membership Priorities
          </span>
          {selectedPriorities.length > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-full">
              {selectedPriorities.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {selectedPriorities.length > 0 && !isExpanded && (
        <div className="px-3 pb-2.5 flex flex-wrap gap-1.5">
          {selectedPriorities.map((priorityId) => {
            const priority = getPriorityById(priorityId);
            if (!priority) return null;
            const Icon = priority.icon;
            return (
              <div
                key={priorityId}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 px-2 py-1 rounded-full text-xs font-medium"
              >
                <Icon className="h-3 w-3" />
                <span>{priority.label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveChip(priorityId);
                  }}
                  className="hover:text-blue-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {isExpanded && (
        <div className="border-t border-gray-200 p-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {selectedPriorities.length === membershipPriorities.length ? 'Clear All' : 'Select All'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {membershipPriorities.map((priority) => (
              <CompactPriorityOption
                key={priority.id}
                priority={priority}
                isSelected={selectedPriorities.includes(priority.id)}
                onToggle={() => handleToggle(priority.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface CompactPriorityOptionProps {
  priority: MembershipPriority;
  isSelected: boolean;
  onToggle: () => void;
}

const CompactPriorityOption: React.FC<CompactPriorityOptionProps> = ({ priority, isSelected, onToggle }) => {
  const Icon = priority.icon;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 p-2 rounded-md border transition-all text-left',
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-transparent hover:bg-gray-50'
      )}
    >
      <div className="flex-shrink-0">
        {isSelected ? (
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
        ) : (
          <Circle className="h-4 w-4 text-gray-400" />
        )}
      </div>

      <div
        className={cn(
          'flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center',
          isSelected ? 'bg-blue-100' : 'bg-gray-100'
        )}
      >
        <Icon className={cn('h-3.5 w-3.5', isSelected ? 'text-blue-600' : 'text-gray-600')} />
      </div>

      <div className="flex-1 min-w-0">
        <span className={cn('text-xs font-semibold block', isSelected ? 'text-blue-900' : 'text-gray-900')}>
          {priority.label}
        </span>
        <span className="text-[10px] text-gray-600">{priority.description}</span>
      </div>
    </button>
  );
};

// Re-export with old name for backwards compatibility
export const CompactCoveragePrioritySelector = CompactMembershipPrioritySelector;

