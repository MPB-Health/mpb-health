import { useEffect, useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Testimonial data                                                    */
/* ------------------------------------------------------------------ */
const testimonials = [
  {
    quote: 'We went from spreadsheets to closing 35% more deals in three months. The pipeline automation alone paid for itself in the first week.',
    name: 'David Martinez',
    role: 'Agency Owner',
    company: 'Pinnacle Health Group',
    avatar: 'DM',
    color: 'from-blue-500 to-cyan-500',
    rating: 5,
  },
  {
    quote: 'The AI command bar is like having a senior analyst on the team. I just type what I need and it surfaces exactly the right leads and insights.',
    name: 'Sarah Thompson',
    role: 'Sales Director',
    company: 'Coastal Benefits',
    avatar: 'ST',
    color: 'from-violet-500 to-purple-500',
    rating: 5,
  },
  {
    quote: 'Round-robin assignment and SLA enforcement transformed how our team works. No more fighting over leads, no more missed follow-ups. Pure efficiency.',
    name: 'Michael Chen',
    role: 'VP of Sales',
    company: 'National Health Advisors',
    avatar: 'MC',
    color: 'from-emerald-500 to-teal-500',
    rating: 5,
  },
];

/* ------------------------------------------------------------------ */
/*  Logo/partner items for the scrolling ticker                         */
/* ------------------------------------------------------------------ */
const partnerNames = [
  'Pinnacle Health',
  'Coastal Benefits',
  'National Health Advisors',
  'Alliance Brokers',
  'Premier Health Solutions',
  'Summit Insurance Group',
  'Horizon Benefits',
  'Liberty Health Partners',
];

/* ================================================================== */
/*  Testimonials Section                                                */
/* ================================================================== */
export function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const iv = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(iv);
  }, [inView]);

  const active = testimonials[activeIdx];

  return (
    <section ref={ref} className="py-24 bg-neutral-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold mb-4">
            Trusted by Teams
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Loved by health insurance{' '}
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              sales teams
            </span>
          </h2>
          <p className="mt-4 text-lg text-neutral-500">
            See why growing agencies choose our CRM to accelerate their pipeline.
          </p>
        </motion.div>

        {/* Testimonial card */}
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.5 }}
              className="relative bg-white rounded-2xl border border-neutral-200 shadow-lg p-8 sm:p-10"
            >
              {/* Quote icon */}
              <div className="absolute -top-4 left-8">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Quote className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1 mb-6">
                {Array.from({ length: active.rating }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 + i * 0.08, type: 'spring', stiffness: 300 }}
                  >
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  </motion.div>
                ))}
              </div>

              {/* Quote text */}
              <p className="text-lg sm:text-xl text-neutral-700 leading-relaxed font-medium mb-8">
                &ldquo;{active.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${active.color} flex items-center justify-center text-sm font-bold text-white shadow-lg`}>
                  {active.avatar}
                </div>
                <div>
                  <p className="font-bold text-neutral-900">{active.name}</p>
                  <p className="text-sm text-neutral-500">{active.role} at {active.company}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dot navigation */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === activeIdx
                    ? 'w-8 h-2 bg-primary-600'
                    : 'w-2 h-2 bg-neutral-300 hover:bg-neutral-400'
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Logo ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 overflow-hidden"
        >
          <p className="text-center text-xs font-medium text-neutral-400 uppercase tracking-wider mb-6">
            Trusted by leading health insurance agencies
          </p>
          <div className="relative">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-neutral-50 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-neutral-50 to-transparent z-10 pointer-events-none" />

            {/* Scrolling strip */}
            <div className="flex animate-[scroll_30s_linear_infinite]">
              {[...partnerNames, ...partnerNames].map((name, i) => (
                <div key={i} className="flex items-center gap-2 px-8 shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-neutral-400">
                      {name.split(' ').map(w => w[0]).join('')}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-neutral-400 whitespace-nowrap">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
