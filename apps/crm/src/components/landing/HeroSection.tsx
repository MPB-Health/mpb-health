import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  Play,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Bell,
  UserPlus,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animated mini-counter used inside the mock dashboard KPI cards     */
/* ------------------------------------------------------------------ */
function MiniCounter({ target, prefix = '', suffix = '', delay = 0 }: {
  target: number; prefix?: string; suffix?: string; delay?: number;
}) {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    const dur = 1400;
    const steps = 40;
    const inc = target / steps;
    let cur = 0;
    const iv = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(iv); }
      else setVal(Math.floor(cur));
    }, dur / steps);
    return () => clearInterval(iv);
  }, [started, target]);

  return <span className="tabular-nums">{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ------------------------------------------------------------------ */
/*  Animated SVG mini bar-chart inside the mock dashboard              */
/* ------------------------------------------------------------------ */
const barHeights = [40, 65, 50, 80, 60, 90, 72];

function MiniBarChart({ animate }: { animate: boolean }) {
  return (
    <svg viewBox="0 0 140 60" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
      {barHeights.map((h, i) => (
        <motion.rect
          key={i}
          x={4 + i * 20}
          width={14}
          rx={3}
          y={60}
          height={0}
          fill={`url(#barGrad${i % 2})`}
          animate={animate ? { y: 60 - h * 0.6, height: h * 0.6 } : {}}
          transition={{ duration: 0.6, delay: 1.6 + i * 0.08, ease: 'easeOut' }}
        />
      ))}
      <defs>
        <linearGradient id="barGrad0" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini sparkline for KPI cards                                       */
/* ------------------------------------------------------------------ */
function Sparkline({ animate, delay = 0 }: { animate: boolean; delay?: number }) {
  return (
    <svg viewBox="0 0 48 16" className="w-12 h-4">
      <motion.polyline
        points="0,14 8,10 16,12 24,6 32,8 40,3 48,5"
        fill="none"
        stroke="#A4CC43"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={animate ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration: 1, delay, ease: 'easeOut' }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI data for the mock dashboard                                    */
/* ------------------------------------------------------------------ */
const kpis = [
  { icon: DollarSign, label: 'Pipeline', value: 284, prefix: '$', suffix: 'K', color: 'from-emerald-400 to-teal-500', trend: '+12%' },
  { icon: Users, label: 'Leads Today', value: 23, prefix: '+', suffix: '', color: 'from-blue-400 to-cyan-500', trend: '+8%' },
  { icon: Target, label: 'Close Rate', value: 34, prefix: '', suffix: '%', color: 'from-violet-400 to-purple-500', trend: '+5%' },
  { icon: TrendingUp, label: 'Revenue MTD', value: 128, prefix: '$', suffix: 'K', color: 'from-amber-400 to-orange-500', trend: '+18%' },
];

/* ------------------------------------------------------------------ */
/*  Mock pipeline columns in the dashboard preview                     */
/* ------------------------------------------------------------------ */
const pipelineCols = [
  { label: 'New', count: 12, color: 'bg-blue-400' },
  { label: 'Contacted', count: 8, color: 'bg-violet-400' },
  { label: 'Quoted', count: 5, color: 'bg-amber-400' },
  { label: 'Closed', count: 3, color: 'bg-emerald-400' },
];

/* ================================================================== */
/*  HeroSection                                                        */
/* ================================================================== */
export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setShowNotif(true), 3200);
    return () => clearTimeout(t);
  }, [inView]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1B2D5C] via-[#284E84] to-[#3D72BC]" />

      {/* Animated mesh blurs */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#A4CC43]/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-400/15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-violet-400/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* -------- Left: Copy -------- */}
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-[#A4CC43] animate-pulse" />
              <span className="text-sm font-medium text-white/90">Now with AI-Powered Automation</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight"
            >
              The CRM Built for{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#A4CC43] to-emerald-400 bg-clip-text text-transparent animate-[shimmer_3s_ease-in-out_infinite]">
                  Health Insurance
                </span>
              </span>{' '}
              Sales
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-6 text-lg sm:text-xl text-white/70 leading-relaxed max-w-xl"
            >
              From quote submission to closed deal &mdash; one seamless pipeline.
              AI-powered automation, real-time dashboards, and the tools your team
              needs to crush targets.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/login"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-xl bg-primary-600 hover:bg-primary-700 shadow-2xl shadow-primary-900/40 transition-all hover:shadow-primary-900/50 hover:-translate-y-0.5"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#pipeline"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-xl border-2 border-white/20 text-white hover:bg-white/10 transition-all"
              >
                <Play className="w-5 h-5" />
                See How It Works
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="mt-10 flex items-center gap-6 text-sm text-white/50"
            >
              {['14-day free trial', 'No credit card', 'HIPAA compliant'].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A4CC43]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* -------- Right: Animated Mock Dashboard -------- */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
            className="relative hidden lg:block"
          >
            {/* Glow behind the dashboard */}
            <div className="absolute -inset-8 bg-gradient-to-br from-[#A4CC43]/10 via-cyan-400/10 to-violet-400/10 rounded-3xl blur-2xl" />

            {/* Browser chrome frame */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 bg-[#0f1729]">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#0b1120] border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-white/5 text-[10px] text-white/30 font-mono">
                    crm.mpb.health/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-4 space-y-3">
                {/* KPI strip */}
                <div className="grid grid-cols-4 gap-2">
                  {kpis.map((kpi, i) => (
                    <motion.div
                      key={kpi.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={inView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.4, delay: 1.0 + i * 0.12 }}
                      className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                          <kpi.icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <Sparkline animate={inView} delay={1.4 + i * 0.15} />
                      </div>
                      <p className="text-[10px] text-white/40 font-medium">{kpi.label}</p>
                      <p className="text-sm font-bold text-white mt-0.5">
                        <MiniCounter target={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} delay={1000 + i * 120} />
                      </p>
                      <span className="text-[9px] font-medium text-emerald-400">{kpi.trend}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Chart + pipeline row */}
                <div className="grid grid-cols-5 gap-2">
                  {/* Chart area */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 1.5 }}
                    className="col-span-3 rounded-xl bg-white/[0.04] border border-white/[0.06] p-3"
                  >
                    <p className="text-[10px] text-white/40 font-medium mb-2">Weekly Revenue</p>
                    <div className="h-16">
                      <MiniBarChart animate={inView} />
                    </div>
                  </motion.div>

                  {/* Mini pipeline */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 1.7 }}
                    className="col-span-2 rounded-xl bg-white/[0.04] border border-white/[0.06] p-3"
                  >
                    <p className="text-[10px] text-white/40 font-medium mb-2">Pipeline</p>
                    <div className="space-y-1.5">
                      {pipelineCols.map((col, i) => (
                        <motion.div
                          key={col.label}
                          initial={{ scaleX: 0 }}
                          animate={inView ? { scaleX: 1 } : {}}
                          transition={{ duration: 0.5, delay: 2.0 + i * 0.1, ease: 'easeOut' }}
                          className="flex items-center gap-2 origin-left"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${col.color}`} />
                          <span className="text-[9px] text-white/40 w-12">{col.label}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${col.color}`}
                              initial={{ width: '0%' }}
                              animate={inView ? { width: `${(col.count / 12) * 100}%` } : {}}
                              transition={{ duration: 0.6, delay: 2.2 + i * 0.1, ease: 'easeOut' }}
                            />
                          </div>
                          <span className="text-[9px] text-white/50 font-medium w-4 text-right">{col.count}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Activity row mockup */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 2.4 }}
                  className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-white/40 font-medium">Recent Activity</p>
                    <div className="flex -space-x-1.5">
                      {['bg-blue-400', 'bg-violet-400', 'bg-emerald-400'].map((c, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={inView ? { scale: 1 } : {}}
                          transition={{ duration: 0.3, delay: 2.6 + i * 0.08 }}
                          className={`w-5 h-5 rounded-full ${c} border-2 border-[#0f1729] text-[7px] font-bold text-white flex items-center justify-center`}
                        >
                          {['JD', 'SM', 'AK'][i]}
                        </motion.div>
                      ))}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={inView ? { scale: 1 } : {}}
                        transition={{ duration: 0.3, delay: 2.84 }}
                        className="w-5 h-5 rounded-full bg-white/10 border-2 border-[#0f1729] text-[7px] text-white/50 flex items-center justify-center"
                      >
                        +4
                      </motion.div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {[
                      { text: 'Sarah M. moved to Quoted', time: '2m ago', dot: 'bg-violet-400' },
                      { text: 'Follow-up sent to James K.', time: '8m ago', dot: 'bg-blue-400' },
                      { text: 'New lead assigned via round-robin', time: '12m ago', dot: 'bg-emerald-400' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.3, delay: 2.8 + i * 0.12 }}
                        className="flex items-center gap-2"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                        <span className="text-[9px] text-white/50 flex-1">{item.text}</span>
                        <span className="text-[8px] text-white/25">{item.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Notification toast overlay */}
              <motion.div
                initial={{ opacity: 0, y: 20, x: 20 }}
                animate={showNotif ? { opacity: 1, y: 0, x: 0 } : {}}
                transition={{ duration: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
                className="absolute bottom-4 right-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#1a2744] border border-[#A4CC43]/30 shadow-lg shadow-[#A4CC43]/10"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#A4CC43] to-emerald-500 flex items-center justify-center shrink-0">
                  <UserPlus className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-white">New Lead Received</p>
                  <p className="text-[9px] text-white/40">Sarah M. submitted a quote request</p>
                </div>
                <Bell className="w-3.5 h-3.5 text-[#A4CC43] animate-bounce shrink-0" />
              </motion.div>
            </div>

            {/* Floating ambient glow orb */}
            <motion.div
              animate={{ y: [0, -12, 0], x: [0, 6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#A4CC43]/20 blur-2xl pointer-events-none"
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 80V40C240 65 480 80 720 60C960 40 1200 20 1440 40V80H0Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
