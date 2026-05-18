import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@mpbhealth/ui';

export interface AdvisorPageLoaderProps {
  title?: string;
  message?: string;
  subtitle?: string;
  /** Delay before showing (ms). Use 0 for route transitions so the UI never flashes empty. */
  delayMs?: number;
  /** Tighter layout for in-layout overlays and secondary panels. */
  compact?: boolean;
  /** Extra skeleton bars below the message (hidden when compact). */
  showSkeleton?: boolean;
  className?: string;
}

/**
 * Canonical advisor-portal loading state: spinner, message, optional skeleton.
 * Use for route Suspense fallbacks, shell bootstrap, data gates, and navigation overlays.
 */
export function AdvisorPageLoader({
  title = 'Loading',
  message,
  subtitle = 'Loading your content…',
  delayMs = 0,
  compact = false,
  showSkeleton = true,
  className,
}: AdvisorPageLoaderProps) {
  const [visible, setVisible] = useState(delayMs <= 0);

  useEffect(() => {
    if (delayMs <= 0) return;
    const t = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);

  if (!visible) {
    return (
      <div className={cn(compact ? 'min-h-[10rem]' : 'min-h-[40vh]', className)} aria-hidden />
    );
  }

  const label = message ?? title;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4',
        compact ? 'min-h-[12rem] py-6' : 'min-h-[50vh] py-12',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <Loader2
        className={cn('animate-spin text-th-accent-600', compact ? 'h-8 w-8' : 'h-10 w-10')}
        aria-hidden
      />
      <p
        className={cn(
          'mt-4 text-center font-semibold text-th-text-primary',
          compact ? 'text-sm' : 'text-base',
        )}
      >
        {label}
      </p>
      {subtitle ? (
        <p className="mt-1 max-w-sm text-center text-xs text-th-text-tertiary">{subtitle}</p>
      ) : null}
      {showSkeleton && !compact ? (
        <div className="mt-8 w-full max-w-md space-y-2.5 px-4">
          <div className="h-2.5 rounded-full bg-surface-tertiary motion-safe:animate-pulse" />
          <div className="h-2.5 w-[88%] rounded-full bg-surface-tertiary motion-safe:animate-pulse" />
          <div className="h-2.5 w-[70%] rounded-full bg-surface-tertiary motion-safe:animate-pulse" />
        </div>
      ) : null}
    </div>
  );
}
