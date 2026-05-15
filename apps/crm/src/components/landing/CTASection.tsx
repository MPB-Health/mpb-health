import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1B2D5C] via-[#284E84] to-[#3D72BC]" />

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* Orbiting gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 50, -50, 0],
            y: [0, -60, 40, -20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 right-1/4 w-96 h-96 bg-[#A4CC43]/15 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -80, 30, 60, 0],
            y: [0, 40, -60, 20, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            x: [0, 60, -40, 80, 0],
            y: [0, -40, 60, -30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/2 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Ready to transform your{' '}
            <span className="bg-gradient-to-r from-[#A4CC43] to-emerald-400 bg-clip-text text-transparent">
              sales pipeline
            </span>
            ?
          </h2>
          <p className="mt-6 text-lg text-white/60 max-w-2xl mx-auto">
            Start your 14-day free trial today. No credit card required.
            Join hundreds of health insurance teams already closing more deals.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary CTA with shimmer */}
            <Link
              to="/login"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-[#0E2D41] rounded-xl bg-white hover:bg-neutral-50 shadow-2xl transition-all hover:-translate-y-0.5 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
              {/* Shimmer sweep */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 -translate-x-full animate-button-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </div>
            </Link>
            <a
              href="mailto:sales@mpb.health"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-xl border-2 border-white/20 text-white hover:bg-white/10 transition-all"
            >
              Contact Sales
            </a>
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex items-center justify-center gap-6 text-sm text-white/40"
          >
            {['HIPAA Compliant', '256-bit Encrypted', '99.9% Uptime'].map((t) => (
              <span key={t} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#A4CC43]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
