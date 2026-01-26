import { motion } from 'framer-motion';
import type { HowItWorksStep } from '../../lib/onboarding/howItWorksSteps.tsx';

interface TimelineRailProps {
  steps: HowItWorksStep[];
  currentIndex: number;
  onSelectStep: (index: number) => void;
  reduceMotion: boolean;
}

export function TimelineRail({ steps, currentIndex, onSelectStep, reduceMotion }: TimelineRailProps) {
  return (
    <div className="relative">
      <div
        className="absolute left-[19px] top-8 bottom-8 w-px bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-200"
        aria-hidden="true"
      />

      <div className="relative space-y-3">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const StepIcon = step.icon;

          return (
            <motion.button
              key={step.id}
              onClick={() => onSelectStep(index)}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Step ${step.id}: ${step.title}`}
              className={[
                "relative w-full text-left group transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg",
              ].join(" ")}
              initial={false}
              animate={{
                opacity: isActive || isCompleted ? 1 : 0.6,
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.3,
              }}
            >
              <div className="flex items-start gap-3 p-2">
                <div
                  className={[
                    "relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    "shadow-md",
                    isActive
                      ? "bg-gradient-to-br from-blue-600 to-teal-600 scale-110 shadow-lg shadow-blue-200"
                      : isCompleted
                      ? "bg-gradient-to-br from-teal-500 to-teal-600 scale-100"
                      : "bg-white border-2 border-neutral-300 group-hover:border-neutral-400 scale-100",
                  ].join(" ")}
                >
                  <StepIcon
                    className={[
                      "w-5 h-5 transition-colors duration-300",
                      isActive || isCompleted ? "text-white" : "text-neutral-600 group-hover:text-neutral-800",
                    ].join(" ")}
                  />
                </div>

                <div className="flex-1 pt-1">
                  <div
                    className={[
                      "text-[10px] uppercase tracking-wider font-semibold mb-0.5 transition-colors duration-300",
                      isActive
                        ? "text-blue-600"
                        : isCompleted
                        ? "text-teal-600"
                        : "text-neutral-500 group-hover:text-neutral-700",
                    ].join(" ")}
                  >
                    {String(step.id).padStart(2, '0')}
                  </div>

                  <div
                    className={[
                      "text-sm font-semibold leading-tight transition-colors duration-300",
                      isActive
                        ? "text-neutral-900"
                        : isCompleted
                        ? "text-neutral-800"
                        : "text-neutral-700 group-hover:text-neutral-900",
                    ].join(" ")}
                  >
                    {step.title}
                  </div>

                  {step.meta?.timeEstimate && (
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {step.meta.timeEstimate}
                    </div>
                  )}
                </div>
              </div>

              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 bg-blue-50 rounded-lg -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
