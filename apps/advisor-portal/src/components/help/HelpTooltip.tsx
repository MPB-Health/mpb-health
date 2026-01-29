// ============================================================================
// HelpTooltip — Contextual help tooltip component
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { HelpCircle, X, ExternalLink } from 'lucide-react';
import { cn } from '@mpbhealth/ui';
import { useOnboarding } from '../../hooks/useOnboarding';
import { HELP_TIPS, type HelpTipPlacement } from './types';

interface HelpTooltipProps {
  tipId: string;
  children: React.ReactNode;
  placement?: HelpTipPlacement;
  showOnce?: boolean;
  delay?: number;
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
}

const PLACEMENT_CLASSES: Record<HelpTipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const ARROW_CLASSES: Record<HelpTipPlacement, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-neutral-800 dark:border-t-neutral-700',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-neutral-800 dark:border-b-neutral-700',
  left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-neutral-800 dark:border-l-neutral-700',
  right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-neutral-800 dark:border-r-neutral-700',
};

export function HelpTooltip({
  tipId,
  children,
  placement = 'top',
  showOnce = false,
  delay = 0,
  className,
  iconClassName,
  showIcon = true,
}: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isTipDismissed, dismissTip, markFeatureSeen } = useOnboarding();

  const tip = HELP_TIPS[tipId];

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle visibility changes with delay
  useEffect(() => {
    if (isVisible) {
      timeoutRef.current = setTimeout(() => {
        setShouldRender(true);
      }, delay);
    } else {
      setShouldRender(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [isVisible, delay]);

  // Don't render if tip doesn't exist
  if (!tip) {
    return <>{children}</>;
  }

  // Don't show if already dismissed and showOnce is true
  if (showOnce && isTipDismissed(tipId)) {
    return <>{children}</>;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissTip(tipId);
    if (tip.feature) {
      markFeatureSeen(tip.feature);
    }
    setIsVisible(false);
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div
      className={cn('relative inline-flex items-center gap-1', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {showIcon && (
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center w-4 h-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors',
            iconClassName
          )}
          aria-label={`Help: ${tip.title}`}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      )}

      {/* Tooltip */}
      {shouldRender && (
        <div
          className={cn(
            'absolute z-50 w-64 p-3 bg-neutral-800 dark:bg-neutral-700 text-white rounded-lg shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            PLACEMENT_CLASSES[placement]
          )}
          role="tooltip"
        >
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0 border-[6px]',
              ARROW_CLASSES[placement]
            )}
          />

          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-sm">{tip.title}</h4>
            {showOnce && (
              <button
                onClick={handleDismiss}
                className="p-0.5 hover:bg-white/10 rounded transition-colors"
                aria-label="Dismiss tip"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Content */}
          <p className="text-sm text-neutral-200 leading-relaxed">
            {tip.content}
          </p>

          {/* Learn more link */}
          {tip.learnMoreUrl && (
            <a
              href={tip.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Learn more</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default HelpTooltip;
