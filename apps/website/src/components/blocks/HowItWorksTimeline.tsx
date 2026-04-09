import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { HOW_IT_WORKS_STEPS } from '../../lib/onboarding/howItWorksSteps';

const AUTO_ADVANCE_MS = 6000;

const HowItWorksTimeline: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % HOW_IT_WORKS_STEPS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [playing]);

  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + HOW_IT_WORKS_STEPS.length) % HOW_IT_WORKS_STEPS.length);
    setPlaying(false);
  };

  const select = (i: number) => {
    setIndex(i);
    setPlaying(false);
  };

  const progress = (index + 1) / HOW_IT_WORKS_STEPS.length;
  const currentStep = HOW_IT_WORKS_STEPS[index];
  const StepIcon = currentStep.icon;

  return (
    <section
      aria-labelledby="how-mpb-works"
      className="relative mx-auto max-w-6xl rounded-2xl border border-neutral-200 bg-white/90 p-6 md:p-8 shadow-lg backdrop-blur-sm"
    >
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="how-mpb-works" className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
            How MPB Health Works
          </h2>
          <p className="text-neutral-600">
            Follow the steps to see how community medical cost sharing operates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Previous step"
            onClick={() => go(-1)}
            className="focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label={playing ? "Pause autoplay" : "Play autoplay"}
            onClick={() => setPlaying((v) => !v)}
            className="focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Next step"
            onClick={() => go(1)}
            className="focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Animated progress rail */}
      <div className="mb-6">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-200">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-600 to-teal-600"
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{
              type: "tween",
              duration: reduceMotion ? 0 : 0.5,
              ease: "easeInOut"
            }}
            aria-hidden="true"
          />
        </div>

        {/* Step nodes */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          {HOW_IT_WORKS_STEPS.map((s, i) => {
            const active = i === index;
            const completed = i < index;
            const Icon = s.icon;

            return (
              <button
                key={s.id}
                onClick={() => select(i)}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${s.id}: ${s.title}`}
                className={[
                  "group relative flex flex-col items-center justify-center rounded-lg border p-3 text-xs transition-all duration-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                  active
                    ? "border-blue-600 bg-gradient-to-br from-blue-600 to-teal-600 text-white shadow-lg scale-105"
                    : completed
                    ? "border-teal-300 bg-teal-50 text-teal-700 hover:border-teal-400 hover:bg-teal-100"
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50",
                ].join(" ")}
              >
                <Icon className={[
                  "h-5 w-5 mb-1 transition-transform duration-300",
                  active && "scale-110"
                ].join(" ")} />
                <span className="hidden md:inline text-center leading-tight font-medium">
                  {s.shortTitle}
                </span>
                <span className="md:hidden font-semibold">
                  {s.id}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step content with animation */}
      <div
        className="relative min-h-[160px] rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6 shadow-sm"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
            transition={{
              duration: reduceMotion ? 0 : 0.35,
              ease: "easeInOut"
            }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center shadow-md">
                <StepIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-xl font-bold text-neutral-900">
                  {currentStep.title}
                </h3>
                <div className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed">
                  {currentStep.body}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTAs */}
      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
        <Button
          onClick={() => {
            const calculator = document.getElementById('calculator');
            if (calculator) {
              calculator.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              window.location.href = '/individuals-and-families#calculator';
            }
          }}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-teal-600 hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
          aria-label="Calculate your personalized rate"
        >
          Get Your Quote
        </Button>
        <Button
          onClick={() => {
            window.location.href = '/compare-plans';
          }}
          variant="outline"
          className="w-full sm:w-auto border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 font-semibold transition-all duration-300"
          aria-label="Compare available plans"
        >
          Compare Plans
        </Button>
      </div>
    </section>
  );
};

export { HowItWorksTimeline };
