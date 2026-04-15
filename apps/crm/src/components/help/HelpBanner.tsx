import { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { cn } from '@mpbhealth/ui';

interface HelpBannerProps {
  pageKey: string;
  title: string;
  tip: string;
  className?: string;
}

const STORAGE_PREFIX = 'mpb-help-banner-dismissed:';

export function HelpBanner({ pageKey, title, tip, className }: HelpBannerProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${pageKey}`);
    setDismissed(stored === 'true');
  }, [pageKey]);

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(`${STORAGE_PREFIX}${pageKey}`, 'true');
    setDismissed(true);
  };

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 px-4 py-3 rounded-lg border border-th-accent-200 dark:border-th-accent-500/20 bg-th-accent-50 dark:bg-th-accent-500/5',
        className,
      )}
    >
      <Lightbulb className="w-5 h-5 text-th-accent-600 dark:text-th-accent-400 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-th-text-primary">{title}</p>
        <p className="text-xs text-th-text-secondary mt-0.5">{tip}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 p-1 text-th-text-tertiary hover:text-th-text-secondary transition-colors rounded"
        aria-label="Dismiss tip"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
