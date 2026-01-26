import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight, Pause, Play, UserPlus, DollarSign, CreditCard, Stethoscope, FileText, Upload, Users, HeartHandshake } from 'lucide-react';
import { GlossaryTooltip } from './GlossaryTooltip';

interface Step {
  id: number;
  title: string;
  body: React.ReactNode;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  {
    id: 1,
    title: "Join MPB Health",
    icon: UserPlus,
    body: (
      <p>
        Become a member of a community that shares eligible medical costs. Your
        advisor helps you pick the right membership for your needs.
      </p>
    ),
  },
  {
    id: 2,
    title: "Choose your IUA",
    icon: DollarSign,
    body: (
      <p>
        Select your{" "}
        <GlossaryTooltip term="IUA" definition="Initial Unshareable Amount — your portion of an eligible medical need before community sharing begins." />{" "}
        level to match your budget and risk tolerance.
      </p>
    ),
  },
  {
    id: 3,
    title: "Make your Monthly Share",
    icon: CreditCard,
    body: (
      <p>
        Contribute a fixed monthly share to the community pool. Staying current
        keeps your eligibility for sharing active.
      </p>
    ),
  },
  {
    id: 4,
    title: "Get Care When You Need It",
    icon: Stethoscope,
    body: (
      <p>
        Start with $0 virtual care for everyday needs. For in-person visits, choose
        any doctor or hospital with no network restrictions.
      </p>
    ),
  },
  {
    id: 5,
    title: "An Expense Happens",
    icon: FileText,
    body: (
      <p>
        For a new medical need, keep itemized bills, notes, and provider details
        so everything's ready for submission.
      </p>
    ),
  },
  {
    id: 6,
    title: "Submit Your Bills",
    icon: Upload,
    body: (
      <p>
        Upload bills through the member portal. Our team reviews against
        guidelines, including{" "}
        <GlossaryTooltip term="Pre-membership conditions" definition="Conditions present before joining; waiting periods or limits may apply per guidelines." />
        .
      </p>
    ),
  },
  {
    id: 7,
    title: "Community Shares the Cost",
    icon: Users,
    body: (
      <p>
        After your IUA, the community pool helps pay eligible expenses per the
        sharing guidelines. You receive clear explanations of what's shared.
      </p>
    ),
  },
  {
    id: 8,
    title: "Ongoing Support",
    icon: HeartHandshake,
    body: (
      <p>
        Advisors, virtual behavioral health resources, and more keep you
        confident across future health events. Consider{" "}
        <GlossaryTooltip term="HSA-compatible" definition="Designed to meet Health Savings Account rules; consult your tax advisor." />{" "}
        options if tax-advantaged saving matters to you.
      </p>
    ),
  },
];

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
      setIndex((i) => (i + 1) % STEPS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [playing]);

  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + STEPS.length) % STEPS.length);
    setPlaying(false);
  };

  const select = (i: number) => {
    setIndex(i);
    setPlaying(false);
  };

  const progress = (index + 1) / STEPS.length;
  const currentStep = STEPS[index];
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
        <div className="mt-4 grid grid-cols-4 gap-2 md:grid-cols-8">
          {STEPS.map((s, i) => {
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
                  {s.title}
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
