import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  FileText,
  UserPlus,
  Shuffle,
  Timer,
  MessageSquare,
  Send,
  Trophy,
} from 'lucide-react';

const steps = [
  {
    icon: FileText,
    title: 'Quote Form',
    subtitle: 'Website visitor submits',
    color: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/30',
  },
  {
    icon: UserPlus,
    title: 'Lead Created',
    subtitle: 'Auto-captured in CRM',
    color: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/30',
  },
  {
    icon: Shuffle,
    title: 'Auto-Assigned',
    subtitle: 'Round-robin distribution',
    color: 'from-violet-500 to-purple-500',
    glow: 'shadow-violet-500/30',
  },
  {
    icon: Timer,
    title: 'SLA Starts',
    subtitle: '24hr response window',
    color: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/30',
  },
  {
    icon: MessageSquare,
    title: 'Cadence',
    subtitle: 'Automated follow-ups',
    color: 'from-pink-500 to-rose-500',
    glow: 'shadow-pink-500/30',
  },
  {
    icon: Send,
    title: 'Proposal',
    subtitle: 'Quote builder & e-sign',
    color: 'from-sky-500 to-blue-500',
    glow: 'shadow-sky-500/30',
  },
  {
    icon: Trophy,
    title: 'Deal Closed',
    subtitle: 'Revenue captured',
    color: 'from-[#A4CC43] to-emerald-500',
    glow: 'shadow-[#A4CC43]/30',
  },
];

/* Step duration for the traveling orb to complete one full journey */
const JOURNEY_DURATION = 8;
const STEP_PAUSE = JOURNEY_DURATION / steps.length;

export function PipelineFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="pipeline" className="py-24 bg-white overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-4">
            Seamless Pipeline
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            From quote to close,{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              fully automated
            </span>
          </h2>
          <p className="mt-4 text-lg text-neutral-500">
            Every step from first contact to signed deal is tracked, automated, and optimized.
            No leads fall through the cracks.
          </p>
        </motion.div>

        {/* Desktop: Horizontal flow with traveling orb */}
        <div className="hidden lg:block">
          <div className="relative flex items-start justify-between">
            {/* Static connecting line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
              className="absolute top-10 left-[6%] right-[6%] h-0.5 bg-neutral-200 origin-left"
            />

            {/* Animated gradient trail line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: [0, 1] } : {}}
              transition={{
                duration: JOURNEY_DURATION * 0.8,
                delay: 1.5,
                repeat: Infinity,
                repeatDelay: 2,
                ease: 'easeInOut',
              }}
              className="absolute top-10 left-[6%] right-[6%] h-0.5 bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 origin-left"
            />

            {/* Traveling orb */}
            <motion.div
              initial={{ left: '6%', opacity: 0 }}
              animate={inView ? {
                left: ['6%', '6%', '94%', '94%'],
                opacity: [0, 1, 1, 0],
              } : {}}
              transition={{
                duration: JOURNEY_DURATION,
                delay: 1.5,
                repeat: Infinity,
                repeatDelay: 2,
                ease: 'easeInOut',
                times: [0, 0.02, 0.95, 1],
              }}
              className="absolute top-[36px] -ml-2 z-20"
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-lg shadow-violet-500/50 border-2 border-violet-400">
                <div className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-40" />
              </div>
            </motion.div>

            {/* Step nodes */}
            {steps.map((step, i) => {
              const stepFraction = i / (steps.length - 1);
              const activateDelay = 1.5 + JOURNEY_DURATION * stepFraction * 0.9;

              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                  className="relative flex flex-col items-center text-center w-[13%]"
                >
                  {/* Node with repeating pulse */}
                  <motion.div
                    animate={inView ? {
                      scale: [1, 1.15, 1],
                      boxShadow: [
                        '0 0 0px rgba(0,0,0,0)',
                        '0 0 20px rgba(139,92,246,0.3)',
                        '0 0 0px rgba(0,0,0,0)',
                      ],
                    } : {}}
                    transition={{
                      duration: 0.6,
                      delay: activateDelay,
                      repeat: Infinity,
                      repeatDelay: JOURNEY_DURATION + 1.4,
                    }}
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl ${step.glow} relative z-10`}
                  >
                    <step.icon className="w-9 h-9 text-white" />
                  </motion.div>

                  <h3 className="mt-4 text-sm font-bold text-neutral-900">{step.title}</h3>
                  <p className="mt-1 text-xs text-neutral-500">{step.subtitle}</p>

                  {/* Step number badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={inView ? { scale: 1 } : {}}
                    transition={{ duration: 0.3, delay: 0.8 + i * 0.12, type: 'spring', stiffness: 300 }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-neutral-200 flex items-center justify-center z-20"
                  >
                    <span className="text-[10px] font-bold text-neutral-500">{i + 1}</span>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Time-to-close callout */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 2.0 }}
            className="flex items-center justify-center gap-3 mt-12 pt-8"
          >
            <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent to-neutral-200" />
            <div className="px-5 py-2.5 rounded-full bg-neutral-50 border border-neutral-200 text-sm">
              <span className="text-neutral-500">Average time to close: </span>
              <span className="font-bold text-neutral-900">35% faster</span>
              <span className="text-neutral-500"> than industry average</span>
            </div>
            <div className="h-px flex-1 max-w-20 bg-gradient-to-l from-transparent to-neutral-200" />
          </motion.div>
        </div>

        {/* Mobile: Vertical flow */}
        <div className="lg:hidden space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              className="relative flex items-center gap-4 py-4"
            >
              {i < steps.length - 1 && (
                <div className="absolute left-[26px] top-[64px] bottom-0 w-0.5 bg-neutral-200" />
              )}

              <motion.div
                animate={inView ? {
                  scale: [1, 1.08, 1],
                } : {}}
                transition={{ duration: 2, delay: 1.5 + i * STEP_PAUSE, repeat: Infinity, repeatDelay: JOURNEY_DURATION }}
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shrink-0 relative z-10`}
              >
                <step.icon className="w-6 h-6 text-white" />
              </motion.div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900">{step.title}</h3>
                <p className="text-xs text-neutral-500">{step.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
