import type { ReactNode } from 'react';
import {
  AlertCircle,
  Clock,
  CircleDot,
  Loader2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: ReactNode }> = {
  new: {
    label: 'New',
    color:
      'bg-sky-100 text-sky-800 border border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-100 dark:border-sky-800/50',
    icon: <CircleDot className="w-3.5 h-3.5 shrink-0" />,
  },
  open: {
    label: 'Open',
    color:
      'bg-amber-100 text-amber-900 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-900/50',
    icon: <AlertCircle className="w-3.5 h-3.5 shrink-0" />,
  },
  pending: {
    label: 'Pending',
    color:
      'bg-orange-100 text-orange-900 border border-orange-200/70 dark:bg-orange-950/35 dark:text-orange-100 dark:border-orange-900/45',
    icon: <Clock className="w-3.5 h-3.5 shrink-0" />,
  },
  in_progress: {
    label: 'In progress',
    color:
      'bg-violet-100 text-violet-900 border border-violet-200/70 dark:bg-violet-950/40 dark:text-violet-100 dark:border-violet-900/50',
    icon: <Loader2 className="w-3.5 h-3.5 shrink-0" />,
  },
  resolved: {
    label: 'Resolved',
    color:
      'bg-emerald-100 text-emerald-900 border border-emerald-200/70 dark:bg-emerald-950/35 dark:text-emerald-100 dark:border-emerald-900/45',
    icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0" />,
  },
  closed: {
    label: 'Closed',
    color:
      'bg-neutral-100 text-neutral-700 border border-neutral-200/80 dark:bg-neutral-800/80 dark:text-neutral-200 dark:border-neutral-600/60',
    icon: <XCircle className="w-3.5 h-3.5 shrink-0" />,
  },
};

export const DEFAULT_STATUS = {
  label: 'Unknown',
  color: 'bg-neutral-100 text-neutral-600 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300',
  icon: <CircleDot className="w-3.5 h-3.5 shrink-0" />,
};

export const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: {
    label: 'Low',
    color:
      'bg-neutral-100 text-neutral-700 border border-neutral-200/90 dark:bg-neutral-800 dark:text-neutral-200',
  },
  medium: {
    label: 'Medium',
    color:
      'bg-blue-50 text-blue-800 border border-blue-200/80 dark:bg-blue-950/45 dark:text-blue-100 dark:border-blue-900/50',
  },
  high: {
    label: 'High',
    color:
      'bg-orange-50 text-orange-800 border border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-100 dark:border-orange-900/50',
  },
  urgent: {
    label: 'Urgent',
    color:
      'bg-red-50 text-red-800 border border-red-200/80 dark:bg-red-950/40 dark:text-red-100 dark:border-red-900/50',
  },
};

export const DEFAULT_PRIORITY = {
  label: 'Normal',
  color: 'bg-neutral-100 text-neutral-600 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300',
};

/** Table cell chips (closer to ITSTS list) */
export const STATUS_TABLE_CLASS: Record<string, string> = {
  new: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-900/40',
  open: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/35 dark:text-cyan-200 border border-cyan-200/60 dark:border-cyan-900/40',
  pending: 'bg-amber-50 text-amber-800 dark:bg-amber-950/35 dark:text-amber-200 border border-amber-200/60 dark:border-amber-900/40',
  in_progress:
    'bg-violet-50 text-violet-800 dark:bg-violet-950/35 dark:text-violet-200 border border-violet-200/60 dark:border-violet-900/40',
  resolved:
    'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-900/40',
  closed:
    'bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/40',
};

export const PRIORITY_TABLE_CLASS: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 border border-red-200/60 dark:border-red-900/40',
  high: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300 border border-orange-200/60 dark:border-orange-900/40',
  medium: 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200 border border-amber-200/60 dark:border-amber-900/40',
  low: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-900/40',
};

export function subjectPreview(subject: string, maxChars = 56): string {
  const t = subject.trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars - 1)}…`;
}

export function formatStatusLabel(status: string): string {
  const s = status.replace(/_/g, ' ').trim();
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
