import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import type { HowItWorksStep } from '../../lib/onboarding/howItWorksSteps.tsx';

interface StepPanelProps {
  step: HowItWorksStep;
  stepIndex: number;
  reduceMotion: boolean;
  onCTAClick: (type: 'primary' | 'secondary') => void;
}

export function StepPanel({ step, stepIndex, reduceMotion, onCTAClick }: StepPanelProps) {
  const StepIcon = step.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepIndex}
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
        transition={{
          type: 'spring',
          duration: reduceMotion ? 0 : 0.22,
          stiffness: 300,
          damping: 30,
        }}
        className="h-full"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-start gap-5 mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                delay: reduceMotion ? 0 : 0.1,
                duration: reduceMotion ? 0 : 0.3,
              }}
              className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center shadow-lg shadow-blue-200/50"
            >
              <StepIcon className="w-7 h-7 text-white" />
            </motion.div>

            <div className="flex-1 pt-1">
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: reduceMotion ? 0 : 0.05,
                  duration: reduceMotion ? 0 : 0.2,
                }}
                className="text-xs uppercase tracking-wider font-semibold text-blue-600 mb-1"
              >
                Step {String(step.id).padStart(2, '0')}
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: reduceMotion ? 0 : 0.1,
                  duration: reduceMotion ? 0 : 0.2,
                }}
                className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2"
              >
                {step.title}
              </motion.h3>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: reduceMotion ? 0 : 0.15,
              duration: reduceMotion ? 0 : 0.25,
            }}
            className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed flex-1"
          >
            {step.body}
          </motion.div>

          {(step.meta?.docsNeeded || step.meta?.faqLink) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : 0.2,
                duration: reduceMotion ? 0 : 0.2,
              }}
              className="mt-6 pt-4 border-t border-neutral-200"
            >
              <div className="flex flex-wrap gap-4 text-sm">
                {step.meta.docsNeeded && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <svg
                      className="w-4 h-4 text-teal-600"
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
                    <span>
                      <strong>Docs needed:</strong> {step.meta.docsNeeded}
                    </span>
                  </div>
                )}

                {step.meta.faqLink && (
                  <a
                    href={step.meta.faqLink}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    onClick={() => onCTAClick('secondary')}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Learn more
                  </a>
                )}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reduceMotion ? 0 : 0.25,
              duration: reduceMotion ? 0 : 0.2,
            }}
            className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row gap-3"
          >
            <Button
              onClick={() => {
                onCTAClick('primary');
                window.location.href = '/get-started';
              }}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-teal-600 hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
              aria-label="Start your MPB Health quote"
            >
              Get Your Quote
            </Button>
            <Button
              onClick={() => {
                onCTAClick('secondary');
                window.location.href = '/compare-plans';
              }}
              variant="outline"
              className="flex-1 sm:flex-initial border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 font-semibold transition-all duration-300"
              aria-label="Compare available plans"
            >
              Compare Plans
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
