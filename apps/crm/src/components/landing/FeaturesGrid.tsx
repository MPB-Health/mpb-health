import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Kanban,
  FileInput,
  Shuffle,
  Timer,
  Zap,
  BarChart3,
  Mail,
  Handshake,
  ShieldCheck,
} from 'lucide-react';

const features = [
  {
    icon: Kanban,
    title: 'Smart Pipeline',
    description: 'Drag-and-drop Kanban boards with auto-stage progression. Visualize every deal at a glance.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FileInput,
    title: 'Quote-to-Lead Capture',
    description: 'Website quote forms automatically become CRM leads. Zero manual entry, zero missed opportunities.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Shuffle,
    title: 'Round-Robin Distribution',
    description: 'Fair, automatic lead assignment with full audit trail. Every rep gets equal opportunity.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Timer,
    title: 'SLA Enforcement',
    description: '24-hour response guarantees with auto-escalation. Never let a hot lead go cold.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Zap,
    title: 'AI Automation Engine',
    description: 'Trigger-based workflows, follow-up cadences, and reactivation drips. Set it and watch it convert.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: BarChart3,
    title: 'Reports & Dashboards',
    description: '11+ built-in reports with XLSX export and real-time charts. Data-driven decisions, always.',
    color: 'from-sky-500 to-blue-500',
  },
  {
    icon: Mail,
    title: 'Email & Templates',
    description: 'A/B testing, bulk email, rich editor, sequences, and deliverability tracking built right in.',
    color: 'from-teal-500 to-green-500',
  },
  {
    icon: Handshake,
    title: 'Referral Network',
    description: 'Track referral partners, outside advisors, and community events. Grow your network systematically.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: ShieldCheck,
    title: 'Multi-Org RBAC',
    description: 'Role-based permissions, org switching, and full audit logging. Enterprise-grade access control.',
    color: 'from-slate-500 to-gray-600',
  },
];

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
              className="group relative p-6 bg-white rounded-2xl border border-neutral-200/60 hover:border-neutral-300 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
