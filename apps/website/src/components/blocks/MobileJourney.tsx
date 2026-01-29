import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Button } from '../ui/button';
import type { HowItWorksStep } from '../../lib/onboarding/howItWorksSteps.tsx';

interface MobileJourneyProps {
  steps: HowItWorksStep[];
  currentIndex: number;
  isPlaying: boolean;
  reduceMotion: boolean;
  onSelectStep: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onTogglePlayPause: () => void;
  onCTAClick: (type: 'primary' | 'secondary') => void;
}

export function MobileJourney({
  steps,
  currentIndex,
  isPlaying,
  reduceMotion,
  onSelectStep,
  onNext,
  onPrev,
  onTogglePlayPause,
  onCTAClick,
}: MobileJourneyProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const _currentStep = steps[currentIndex];

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollPosition = currentIndex * container.offsetWidth;
      container.scrollTo({
        left: scrollPosition,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    }
  }, [currentIndex, reduceMotion]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollPosition = container.scrollLeft;
    const itemWidth = container.offsetWidth;
    const newIndex = Math.round(scrollPosition / itemWidth);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < steps.length) {
      onSelectStep(newIndex);
    }
  };

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="flex">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentIndex;

            return (
              <div
                key={step.id}
                className="flex-shrink-0 w-full snap-start px-4"
              >
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
                      transition={{
                        type: 'spring',
                        duration: reduceMotion ? 0 : 0.22,
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="rounded-2xl p-6 bg-white/80 backdrop-blur-sm shadow-lg border border-neutral-200"
                    >
                      <div className="flex items-start gap-4 mb-5">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center shadow-md shadow-blue-200/50">
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        <div className="flex-1 pt-1">
                          <div className="text-xs uppercase tracking-wider font-semibold text-blue-600 mb-1">
                            Step {String(step.id).padStart(2, '0')}
                          </div>
                          <h3 className="text-xl font-bold text-neutral-900">
                            {step.title}
                          </h3>
                        </div>
                      </div>

                      <div className="prose prose-neutral prose-sm max-w-none text-neutral-700 leading-relaxed mb-6">
                        {step.body}
                      </div>

                      {(step.meta?.docsNeeded || step.meta?.timeEstimate) && (
                        <div className="mb-6 pb-4 border-b border-neutral-200">
                          <div className="flex flex-wrap gap-3 text-xs text-neutral-600">
                            {step.meta.timeEstimate && (
                              <div className="flex items-center gap-1.5">
                                <svg
                                  className="w-3.5 h-3.5 text-teal-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span>{step.meta.timeEstimate}</span>
                              </div>
                            )}

                            {step.meta.docsNeeded && (
                              <div className="flex items-center gap-1.5">
                                <svg
                                  className="w-3.5 h-3.5 text-teal-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                <span>{step.meta.docsNeeded}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2.5">
                        <Button
                          onClick={() => {
                            onCTAClick('primary');
                            const calculator = document.getElementById('calculator');
                            if (calculator) {
                              calculator.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } else {
                              window.location.href = '/individuals-and-families#calculator';
                            }
                          }}
                          className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                          aria-label="Calculate your personalized rate"
                        >
                          Get Your Quote
                        </Button>
                        <Button
                          onClick={() => {
                            onCTAClick('secondary');
                            window.location.href = '/compare-plans';
                          }}
                          variant="outline"
                          className="w-full border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 font-semibold transition-all duration-300"
                          aria-label="Compare available plans"
                        >
                          Compare Plans
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md rounded-full shadow-2xl border border-neutral-200 p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Previous step"
            onClick={onPrev}
            className="rounded-full w-10 h-10 p-0 border-0 hover:bg-neutral-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-1.5 px-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => onSelectStep(index)}
                aria-label={`Go to step ${step.id}`}
                aria-current={index === currentIndex ? 'step' : undefined}
                className={[
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "bg-gradient-to-r from-blue-600 to-teal-600 w-6"
                    : index < currentIndex
                    ? "bg-teal-400"
                    : "bg-neutral-300 hover:bg-neutral-400",
                ].join(" ")}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            aria-label={isPlaying ? "Pause autoplay" : "Play autoplay"}
            onClick={onTogglePlayPause}
            className="rounded-full w-10 h-10 p-0 border-0 hover:bg-neutral-100"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            aria-label="Next step"
            onClick={onNext}
            className="rounded-full w-10 h-10 p-0 border-0 hover:bg-neutral-100"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
