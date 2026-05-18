import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@mpbhealth/ui';
import { AdvisorPageLoader } from './AdvisorPageLoader';

export interface PageQueryBoundaryProps {
  isLoading: boolean;
  loadingMessage?: string;
  loadingSubtitle?: string;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
  compact?: boolean;
}

/**
 * Consistent gate for TanStack Query (or similar) fetch cycles: loader → error → children.
 */
export function PageQueryBoundary({
  isLoading,
  loadingMessage = 'Loading…',
  loadingSubtitle,
  isError = false,
  errorMessage = 'Something went wrong while loading this content.',
  onRetry,
  children,
  compact = false,
}: PageQueryBoundaryProps) {
  if (isLoading) {
    return (
      <AdvisorPageLoader
        message={loadingMessage}
        subtitle={loadingSubtitle}
        compact={compact}
      />
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-12 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500" aria-hidden />
        <p className="mt-4 max-w-md text-sm text-th-text-secondary">{errorMessage}</p>
        {onRetry ? (
          <Button type="button" variant="primary" className="mt-6" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
}
