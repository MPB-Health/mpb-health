import { Check, Loader2, AlertCircle, Cloud } from 'lucide-react';
import type { SaveStatus } from '../hooks/useSaveStatus';

interface SaveIndicatorProps {
  status: SaveStatus;
  errorMessage?: string | null;
  className?: string;
}

const STATUS_CONFIG: Record<SaveStatus, {
  icon: typeof Check;
  label: string;
  color: string;
  bg: string;
  animate?: boolean;
}> = {
  idle: {
    icon: Cloud,
    label: '',
    color: 'text-th-text-tertiary',
    bg: '',
  },
  saving: {
    icon: Loader2,
    label: 'Saving...',
    color: 'text-th-accent-500',
    bg: 'bg-th-accent-50',
    animate: true,
  },
  saved: {
    icon: Check,
    label: 'Saved',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  error: {
    icon: AlertCircle,
    label: 'Save failed',
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-500/10',
  },
};

export function SaveIndicator({ status, errorMessage, className = '' }: SaveIndicatorProps) {
  if (status === 'idle') return null;

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${config.bg} ${config.color} ${className}`}
      role="status"
      aria-live="polite"
    >
      <Icon className={`w-3.5 h-3.5 ${config.animate ? 'animate-spin' : ''}`} />
      <span>{status === 'error' && errorMessage ? errorMessage : config.label}</span>
    </div>
  );
}
