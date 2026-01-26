import React from 'react';
import { CheckCircle2, Circle, Info } from 'lucide-react';
import { membershipPriorities, MembershipPriority } from '../lib/membershipPriorities';
import { cn } from '../lib/utils';

interface MembershipPrioritySelectorProps {
  selectedPriorities: string[];
  onChange: (priorities: string[]) => void;
  className?: string;
}

export const MembershipPrioritySelector: React.FC<MembershipPrioritySelectorProps> = ({
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

  const handleSelectAll = () => {
    if (selectedPriorities.length === membershipPriorities.length) {
      onChange([]);
    } else {
      onChange(membershipPriorities.map((p) => p.id));
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          {selectedPriorities.length === membershipPriorities.length ? 'Clear All' : 'Select All'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {membershipPriorities.map((priority) => (
          <PriorityOption
            key={priority.id}
            priority={priority}
            isSelected={selectedPriorities.includes(priority.id)}
            onToggle={() => handleToggle(priority.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface PriorityOptionProps {
  priority: MembershipPriority;
  isSelected: boolean;
  onToggle: () => void;
}

const PriorityOption: React.FC<PriorityOptionProps> = ({ priority, isSelected, onToggle }) => {
  const Icon = priority.icon;
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left group',
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isSelected ? (
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
        ) : (
          <Circle className="h-5 w-5 text-gray-400 group-hover:text-gray-500" />
        )}
      </div>

      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
          isSelected ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'
        )}
      >
        <Icon className={cn('h-4 w-4', isSelected ? 'text-blue-600' : 'text-gray-600')} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-sm font-semibold',
              isSelected ? 'text-blue-900' : 'text-gray-900'
            )}
          >
            {priority.label}
          </span>
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info className="h-3 w-3 text-gray-400 cursor-help" />
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10">
                <div className="bg-gray-900 text-white text-[10px] rounded px-3 py-2 whitespace-nowrap shadow-lg">
                  {priority.description}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-[10px] text-gray-600 mt-0.5 leading-relaxed">{priority.description}</p>
      </div>
    </button>
  );
};

// Re-export with old name for backwards compatibility
export const CoveragePrioritySelector = MembershipPrioritySelector;

