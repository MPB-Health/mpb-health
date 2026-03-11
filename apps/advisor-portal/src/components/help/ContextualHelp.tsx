// ============================================================================
// ContextualHelp — Highlighted help indicator for first-time users
// ============================================================================

import { useState } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { cn } from '@mpbhealth/ui';
import { useOnboarding } from '../../hooks/useOnboarding';
import { HELP_TIPS } from './types';

interface ContextualHelpProps {
  tipId: string;
  children: React.ReactNode;
  className?: string;
  position?: 'inline' | 'floating';
  variant?: 'default' | 'highlight' | 'pulse';
}

export function ContextualHelp({
  tipId,
  children,
  className,
  position = 'inline',
  variant = 'default',
}: ContextualHelpProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isTipDismissed, dismissTip, markFeatureSeen, state } = useOnboarding();

  const tip = HELP_TIPS[tipId];

  // Don't show for users who've completed onboarding or dismissed this tip
  if (!tip || state.hasCompletedOnboarding || isTipDismissed(tipId)) {
    return <>{children}</>;
  }

  const handleDismiss = () => {
    dismissTip(tipId);
    if (tip.feature) {
      markFeatureSeen(tip.feature);
    }
    setIsExpanded(false);
  };

  return (
    <div className={cn('relative', className)}>
      {children}

      {/* Help indicator */}
      {position === 'floating' ? (
        <div className="absolute -top-2 -right-2 z-10">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label="Show tip"
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg transition-all',
              variant === 'pulse' && 'animate-pulse',
              variant === 'highlight'
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-primary-500 hover:bg-primary-600'
            )}
          >
            <Lightbulb className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all',
            variant === 'pulse' && 'animate-pulse',
            variant === 'highlight'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
          )}
        >
          <Lightbulb className="w-3 h-3" />
          <span>Tip</span>
        </button>
      )}

      {/* Expanded help card */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsExpanded(false)}
          />

          {/* Help card */}
          <div
            className={cn(
              'absolute z-50 w-72 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700',
              'animate-in fade-in-0 slide-in-from-top-2 duration-200',
              position === 'floating' ? 'top-8 right-0' : 'top-full left-0 mt-2'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-neutral-100 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">
                  {tip.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {tip.content}
              </p>
            </div>

            {/* Footer */}
            <div className="px-3 pb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                Got it, don&apos;t show again
              </button>
              {tip.learnMoreUrl && (
                <a
                  href={tip.learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Learn more
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ContextualHelp;
