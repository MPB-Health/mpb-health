import { HelpCircle } from 'lucide-react';
import { cn } from '@mpbhealth/ui';

interface PageHelpButtonProps {
  onClick: () => void;
  className?: string;
}

export function PageHelpButton({ onClick, className }: PageHelpButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs',
        'bg-surface-tertiary hover:bg-surface-secondary text-th-text-tertiary hover:text-th-text-secondary',
        'transition-colors',
        className,
      )}
      title="Help (Ctrl+/)"
    >
      <HelpCircle className="w-3.5 h-3.5" />
      <span className="hidden md:inline">Help</span>
    </button>
  );
}
