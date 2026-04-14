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
  },
  {
    icon: UserPlus,
    title: 'Lead Created',
    subtitle: 'Auto-captured in CRM',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Shuffle,
    title: 'Auto-Assigned',
    subtitle: 'Round-robin distribution',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Timer,
    title: 'SLA Starts',
    subtitle: '24hr response window',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: MessageSquare,
    title: 'Cadence',
    subtitle: 'Automated follow-ups',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Send,
    title: 'Proposal Sent',
    subtitle: 'Quote builder & e-sign',
    color: 'from-sky-500 to-blue-500',
  },
  {
    icon: Trophy,
    title: 'Deal Closed',
    subtitle: 'Revenue captured',
    color: 'from-[#A4CC43] to-emerald-500',
  },
];

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

        {/* Desktop: Horizontal flow */}
        <div className="hidden lg:block">
          <div className="relative flex items-start justify-between">
            {/* Connecting line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
              className="absolute top-10 left-[6%] right-[6%] h-0.5 bg-gradient-to-r from-blue-300 via-violet-300 to-emerald-300 origin-left"
            />

            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                className="relative flex flex-col items-center text-center w-[13%]"
              >
                {/* Node */}
                <motion.div
                  animate={inView ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, delay: 1.5 + i * 0.3, repeat: Infinity, repeatDelay: 5 }}
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl relative z-10`}
                >
                  <step.icon className="w-9 h-9 text-white" />
                </motion.div>

                {/* Label */}
                <h3 className="mt-4 text-sm font-bold text-neutral-900">{step.title}</h3>
                <p className="mt-1 text-xs text-neutral-500">{step.subtitle}</p>
              </motion.div>
            ))}
          </div>
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
              {/* Vertical line */}
              {i < steps.length - 1 && (
                <div className="absolute left-[26px] top-[64px] bottom-0 w-0.5 bg-neutral-200" />
              )}

              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shrink-0 relative z-10`}>
                <step.icon className="w-6 h-6 text-white" />
              </div>

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
