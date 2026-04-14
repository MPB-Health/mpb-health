import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Kanban, BarChart3, Zap, Users } from 'lucide-react';

const floatingCards = [
  {
    icon: Kanban,
    title: 'Pipeline',
    stat: '47 Active',
    color: 'from-blue-500 to-cyan-500',
    position: 'top-32 -left-8 lg:left-12',
    delay: 0.8,
  },
  {
    icon: BarChart3,
    title: 'Revenue',
    stat: '$128K MTD',
    color: 'from-emerald-500 to-teal-500',
    position: 'top-56 -right-4 lg:right-16',
    delay: 1.0,
  },
  {
    icon: Zap,
    title: 'Automation',
    stat: '12 Active',
    color: 'from-violet-500 to-purple-500',
    position: 'bottom-36 -left-4 lg:left-20',
    delay: 1.2,
  },
  {
    icon: Users,
    title: 'Leads Today',
    stat: '+23 New',
    color: 'from-amber-500 to-orange-500',
    position: 'bottom-16 -right-2 lg:right-24',
    delay: 1.4,
  },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0E2D41] via-[#0A4E8E] to-[#0C71C3]" />

      {/* Animated mesh overlay */}
      <div className="absolute inset-0 opacity-30">
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
          {/* Left: Copy */}
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
              <span className="relative">
                <span className="bg-gradient-to-r from-[#A4CC43] to-emerald-400 bg-clip-text text-transparent">
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
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#A4CC43]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                14-day free trial
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#A4CC43]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                No credit card
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#A4CC43]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                HIPAA compliant
              </span>
            </motion.div>
          </div>

          {/* Right: Floating UI Preview Cards */}
          <div className="relative hidden lg:block h-[500px]">
            {floatingCards.map((card) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: card.delay, ease: 'easeOut' }}
                className={`absolute ${card.position}`}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut', delay: card.delay }}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/60">{card.title}</p>
                    <p className="text-sm font-bold text-white">{card.stat}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}

            {/* Central glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-primary-400/20 to-cyan-400/10 blur-3xl" />
            </div>
          </div>
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
