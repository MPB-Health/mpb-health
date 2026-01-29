// ============================================================================
// FeatureTour — Guided product tour with spotlight highlighting
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { cn } from '@mpbhealth/ui';
import { type TourDefinition, type TourStep, type TourPlacement } from './types';

interface FeatureTourProps {
  tour: TourDefinition;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  startStep?: number;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PLACEMENT_STYLES: Record<TourPlacement, (rect: TargetRect, padding: number) => React.CSSProperties> = {
  top: (rect, padding) => ({
    bottom: `calc(100% - ${rect.top - padding}px + 12px)`,
    left: rect.left + rect.width / 2,
    transform: 'translateX(-50%)',
  }),
  bottom: (rect, padding) => ({
    top: rect.top + rect.height + padding + 12,
    left: rect.left + rect.width / 2,
    transform: 'translateX(-50%)',
  }),
  left: (rect, padding) => ({
    top: rect.top + rect.height / 2,
    right: `calc(100% - ${rect.left - padding}px + 12px)`,
    transform: 'translateY(-50%)',
  }),
  right: (rect, padding) => ({
    top: rect.top + rect.height / 2,
    left: rect.left + rect.width + padding + 12,
    transform: 'translateY(-50%)',
  }),
  center: () => ({
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }),
};

const ARROW_STYLES: Record<TourPlacement, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-white dark:border-t-neutral-800',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-white dark:border-b-neutral-800',
  left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-white dark:border-l-neutral-800',
  right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-white dark:border-r-neutral-800',
  center: 'hidden',
};

export function FeatureTour({
  tour,
  isOpen,
  onClose,
  onComplete,
  startStep = 0,
}: FeatureTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(startStep);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const observerRef = useRef<ResizeObserver | null>(null);

  const currentStep = tour.steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === tour.steps.length - 1;
  const padding = currentStep?.highlightPadding ?? 8;

  // Find and observe target element
  const updateTargetRect = useCallback(() => {
    if (!currentStep) return;

    const element = document.querySelector(currentStep.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });

      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Target not found, use center placement
      setTargetRect(null);
    }
  }, [currentStep]);

  // Update position on step change and window resize
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    // Run beforeShow hook
    if (currentStep.beforeShow) {
      Promise.resolve(currentStep.beforeShow()).then(updateTargetRect);
    } else {
      updateTargetRect();
    }

    // Set up resize observer
    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    // Observe target element for size changes
    const element = document.querySelector(currentStep.target);
    if (element) {
      observerRef.current = new ResizeObserver(updateTargetRect);
      observerRef.current.observe(element);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isOpen, currentStep, updateTargetRect]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, tour.steps.length]);

  const handleNext = useCallback(async () => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    // Run afterHide hook
    if (currentStep?.afterHide) {
      await currentStep.afterHide();
    }

    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }

    setIsTransitioning(false);
  }, [currentStep, isLastStep, isTransitioning, onComplete]);

  const handlePrev = useCallback(async () => {
    if (isTransitioning || isFirstStep) return;

    setIsTransitioning(true);

    if (currentStep?.afterHide) {
      await currentStep.afterHide();
    }

    setCurrentStepIndex((prev) => prev - 1);
    setIsTransitioning(false);
  }, [currentStep, isFirstStep, isTransitioning]);

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen || !currentStep) return null;

  const placement = targetRect ? (currentStep.placement || 'bottom') : 'center';
  const tooltipStyle = targetRect
    ? PLACEMENT_STYLES[placement](targetRect, padding)
    : PLACEMENT_STYLES.center(targetRect!, padding);

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#spotlight-mask)"
          style={{ pointerEvents: 'auto' }}
          onClick={handleSkip}
        />
      </svg>

      {/* Highlight border around target */}
      {targetRect && (
        <div
          className="absolute border-2 border-primary-500 rounded-lg pointer-events-none animate-pulse"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={cn(
          'absolute w-80 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
        style={tooltipStyle}
      >
        {/* Arrow */}
        {targetRect && (
          <div
            className={cn(
              'absolute w-0 h-0 border-[8px]',
              ARROW_STYLES[placement]
            )}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-700">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {currentStep.title}
          </h3>
          <button
            onClick={handleSkip}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {currentStep.content}
          </p>

          {/* Custom action button */}
          {currentStep.action && (
            <button
              onClick={currentStep.action.onClick}
              className="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              {currentStep.action.label}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 pt-0">
          {/* Progress */}
          <div className="flex items-center gap-1">
            {tour.steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentStepIndex
                    ? 'bg-primary-500'
                    : index < currentStepIndex
                    ? 'bg-primary-300'
                    : 'bg-neutral-200 dark:bg-neutral-600'
                )}
              />
            ))}
            <span className="ml-2 text-xs text-neutral-500">
              {currentStepIndex + 1} of {tour.steps.length}
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Skip
              </button>
            )}

            {!isFirstStep && (
              <button
                onClick={handlePrev}
                disabled={isTransitioning}
                className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={isTransitioning}
              className={cn(
                'flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50',
                isLastStep
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              )}
            >
              <span>{isLastStep ? 'Finish' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureTour;
