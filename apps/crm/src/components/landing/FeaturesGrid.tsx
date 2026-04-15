import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/* ================================================================== */
/*  Mini-demo: Kanban drag animation                                    */
/* ================================================================== */
function KanbanDemo({ animate }: { animate: boolean }) {
  const cols = [
    { label: 'New', cards: [{ h: 16 }, { h: 12 }] },
    { label: 'Contacted', cards: [{ h: 14 }] },
    { label: 'Closed', cards: [{ h: 12 }] },
  ];

  return (
    <div className="flex gap-2 h-full items-end">
      {cols.map((col, ci) => (
        <div key={col.label} className="flex-1 flex flex-col gap-1">
          <span className="text-[8px] text-white/30 font-medium text-center">{col.label}</span>
          <div className="flex flex-col gap-1 min-h-[40px]">
            {col.cards.map((card, ri) => (
              <motion.div
                key={ri}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={animate ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.3 + ci * 0.15 + ri * 0.1 }}
                style={{ height: card.h }}
                className="rounded bg-gradient-to-r from-blue-500/30 to-cyan-500/20 border border-blue-400/20"
              />
            ))}
          </div>
        </div>
      ))}
      {/* Animated dragging card */}
      <motion.div
        initial={{ x: -60, y: 0, opacity: 0 }}
        animate={animate ? {
          x: [0 - 60, 0 - 60, 20, 20],
          y: [0, -4, -4, 4],
          opacity: [0, 1, 1, 0.6],
          scale: [0.9, 1.05, 1.05, 0.95],
        } : {}}
        transition={{ duration: 3, delay: 1.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/3 w-[30%] h-3 rounded bg-violet-500/50 border border-violet-400/30 shadow-lg shadow-violet-500/20"
      />
    </div>
  );
}

/* ================================================================== */
/*  Mini-demo: Workflow automation chain                                 */
/* ================================================================== */
function WorkflowDemo({ animate }: { animate: boolean }) {
  const nodes = [
    { label: 'Trigger', color: 'from-amber-400 to-orange-500' },
    { label: 'Delay', color: 'from-blue-400 to-cyan-500' },
    { label: 'Email', color: 'from-violet-400 to-purple-500' },
    { label: 'Task', color: 'from-emerald-400 to-teal-500' },
  ];

  return (
    <div className="flex items-center justify-center gap-1 h-full">
      {nodes.map((node, i) => (
        <div key={node.label} className="flex items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={animate ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.2 }}
            className="flex flex-col items-center gap-1"
          >
            <motion.div
              animate={animate ? { boxShadow: ['0 0 0px rgba(139,92,246,0)', '0 0 12px rgba(139,92,246,0.4)', '0 0 0px rgba(139,92,246,0)'] } : {}}
              transition={{ duration: 2, delay: 1.5 + i * 0.5, repeat: Infinity, repeatDelay: 3 }}
              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${node.color} flex items-center justify-center`}
            >
              <div className="w-2 h-2 rounded-sm bg-white/80" />
            </motion.div>
            <span className="text-[7px] text-white/30">{node.label}</span>
          </motion.div>
          {i < nodes.length - 1 && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={animate ? { scaleX: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.6 + i * 0.2 }}
              className="w-4 h-px bg-gradient-to-r from-white/20 to-white/10 origin-left mx-0.5"
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Mini-demo: Animated bar chart                                       */
/* ================================================================== */
function ChartDemo({ animate }: { animate: boolean }) {
  const bars = [35, 55, 42, 70, 50, 85, 62];
  return (
    <div className="flex items-end justify-center gap-1.5 h-full px-2 pb-1">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={animate ? { height: `${h}%` } : {}}
          transition={{ duration: 0.5, delay: 0.4 + i * 0.08, ease: 'easeOut' }}
          className={`flex-1 rounded-t ${i % 2 === 0 ? 'bg-gradient-to-t from-emerald-500/60 to-emerald-400/30' : 'bg-gradient-to-t from-teal-500/60 to-teal-400/30'}`}
        />
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Mini-demo: Email sequence chain                                     */
/* ================================================================== */
function EmailDemo({ animate }: { animate: boolean }) {
  const steps = [
    { label: 'Day 1', status: 'sent' },
    { label: 'Day 3', status: 'opened' },
    { label: 'Day 7', status: 'replied' },
  ];

  return (
    <div className="flex flex-col gap-2 h-full justify-center px-1">
      {steps.map((step, i) => (
        <motion.div
          key={step.label}
          initial={{ opacity: 0, x: -12 }}
          animate={animate ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.5 + i * 0.3 }}
          className="flex items-center gap-2"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={animate ? { scale: 1 } : {}}
            transition={{ duration: 0.3, delay: 0.8 + i * 0.3, type: 'spring', stiffness: 300 }}
            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
              step.status === 'replied' ? 'bg-emerald-500/40' : step.status === 'opened' ? 'bg-blue-500/40' : 'bg-white/10'
            }`}
          >
            <svg className="w-2.5 h-2.5 text-white/80" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={animate ? { width: '100%' } : {}}
              transition={{ duration: 0.6, delay: 0.9 + i * 0.3 }}
              className={`h-full rounded-full ${
                step.status === 'replied' ? 'bg-emerald-500/50' : step.status === 'opened' ? 'bg-blue-500/50' : 'bg-pink-500/50'
              }`}
            />
          </div>
          <span className="text-[8px] text-white/30 w-8 shrink-0">{step.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Mini-demo: Team collaboration avatars + bubble                      */
/* ================================================================== */
function TeamDemo({ animate }: { animate: boolean }) {
  const avatars = [
    { initials: 'JD', color: 'from-blue-400 to-cyan-500' },
    { initials: 'SM', color: 'from-violet-400 to-purple-500' },
    { initials: 'AK', color: 'from-emerald-400 to-teal-500' },
    { initials: 'LR', color: 'from-amber-400 to-orange-500' },
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-3 h-full">
      {/* Avatars with presence */}
      <div className="flex -space-x-2">
        {avatars.map((a, i) => (
          <motion.div
            key={a.initials}
            initial={{ scale: 0, x: -8 }}
            animate={animate ? { scale: 1, x: 0 } : {}}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.1, type: 'spring', stiffness: 300 }}
            className="relative"
          >
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${a.color} border-2 border-[#14192e] flex items-center justify-center text-[8px] font-bold text-white`}>
              {a.initials}
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={animate ? { scale: 1 } : {}}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#14192e]"
            />
          </motion.div>
        ))}
      </div>
      {/* Chat bubble */}
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.9 }}
        animate={animate ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.4, delay: 1.2 }}
        className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[9px] text-white/40"
      >
        Just closed the Wilson deal! 🎉
      </motion.div>
    </div>
  );
}

/* ================================================================== */
/*  Mini-demo: Animated pie chart                                       */
/* ================================================================== */
function PieDemo({ animate }: { animate: boolean }) {
  const segments = [
    { pct: 35, color: '#3b82f6', offset: 0 },
    { pct: 28, color: '#8b5cf6', offset: 35 },
    { pct: 22, color: '#06b6d4', offset: 63 },
    { pct: 15, color: '#f59e0b', offset: 85 },
  ];
  const r = 24;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex items-center justify-center h-full">
      <svg viewBox="0 0 64 64" className="w-16 h-16">
        {segments.map((seg, i) => (
          <motion.circle
            key={i}
            cx={32}
            cy={32}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={8}
            strokeDasharray={`${(seg.pct / 100) * c} ${c}`}
            strokeDashoffset={-(seg.offset / 100) * c}
            strokeLinecap="round"
            opacity={0.6}
            initial={{ pathLength: 0 }}
            animate={animate ? { pathLength: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 + i * 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: '32px 32px', transform: 'rotate(-90deg)' }}
          />
        ))}
        <text x={32} y={34} textAnchor="middle" className="text-[9px] fill-white/50 font-bold">
          11+
        </text>
      </svg>
    </div>
  );
}

/* ================================================================== */
/*  Feature definitions                                                 */
/* ================================================================== */
const features = [
  {
    title: 'Smart Pipeline',
    description: 'Drag-and-drop Kanban boards with auto-stage progression and velocity tracking.',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    border: 'border-blue-500/20',
    Demo: KanbanDemo,
  },
  {
    title: 'AI Automation',
    description: 'Trigger-based workflows, follow-up cadences, and intelligent reactivation drips.',
    gradient: 'from-violet-500/20 to-purple-500/10',
    border: 'border-violet-500/20',
    Demo: WorkflowDemo,
  },
  {
    title: 'Real-time Analytics',
    description: '11+ built-in reports with live charts, XLSX export, and data-driven insights.',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    border: 'border-emerald-500/20',
    Demo: ChartDemo,
  },
  {
    title: 'Email Sequences',
    description: 'Automated multi-step cadences with A/B testing and deliverability tracking.',
    gradient: 'from-pink-500/20 to-rose-500/10',
    border: 'border-pink-500/20',
    Demo: EmailDemo,
  },
  {
    title: 'Team Collaboration',
    description: 'Deal rooms, @mentions, live presence, and real-time activity feeds.',
    gradient: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-500/20',
    Demo: TeamDemo,
  },
  {
    title: 'Reports & Dashboards',
    description: 'Customizable widget dashboard with drag-and-drop, heatmaps, and forecasting.',
    gradient: 'from-sky-500/20 to-blue-500/10',
    border: 'border-sky-500/20',
    Demo: PieDemo,
  },
];

/* ================================================================== */
/*  FeaturesGrid                                                        */
/* ================================================================== */
export function FeaturesGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="features" className="py-24 bg-neutral-50" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-semibold mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-primary-600 to-cyan-600 bg-clip-text text-transparent">
              close more deals
            </span>
          </h2>
          <p className="mt-4 text-lg text-neutral-500">
            Purpose-built for health insurance sales teams. No fluff, no bloat &mdash; just the tools that move the needle.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-white hover:border-neutral-300 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Demo area (dark) */}
              <div className={`relative h-36 bg-gradient-to-br ${feature.gradient} bg-[#0d1424] overflow-hidden`}>
                <div className="absolute inset-0 bg-[#0d1424]" />
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient}`} />
                <div className="relative h-full p-3">
                  <feature.Demo animate={inView} />
                </div>
              </div>

              {/* Text content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
