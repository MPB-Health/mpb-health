import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Check, Star, ArrowRight } from 'lucide-react';

const tiers = [
  {
    name: 'Starter',
    description: 'For small teams getting started',
    monthlyPrice: 49,
    annualPrice: 39,
    highlighted: false,
    features: [
      'Up to 5 users',
      'Lead & contact management',
      'Basic pipeline (3 custom stages)',
      'Email templates',
      'CSV import & export',
      'Standard reporting (3 reports)',
      'Community support',
    ],
  },
  {
    name: 'Professional',
    description: 'For growing sales teams',
    monthlyPrice: 99,
    annualPrice: 79,
    highlighted: true,
    badge: 'Most Popular',
    features: [
      'Unlimited users',
      'Everything in Starter, plus:',
      'Unlimited pipeline stages',
      'Round-robin lead distribution',
      'SLA enforcement & escalation',
      'Follow-up cadence automation',
      'Reactivation sub-pipeline',
      'Quote builder & invoicing',
      '11+ advanced reports & XLSX export',
      'Referral partner tracking',
      'Email A/B testing',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: 249,
    annualPrice: 199,
    highlighted: false,
    features: [
      'Everything in Professional, plus:',
      'AI automation engine (unlimited)',
      'Custom modules & fields',
      'API access & webhooks',
      'SSO / SAML authentication',
      'HIPAA BAA included',
      'White-label option',
      'Dedicated success manager',
      '99.99% SLA guarantee',
    ],
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="pricing" className="py-24 bg-neutral-50" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-violet-50 text-violet-700 text-sm font-semibold mb-4">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Simple, transparent{' '}
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              pricing
            </span>
          </h2>
          <p className="mt-4 text-lg text-neutral-500">
            No hidden fees. No long-term contracts. Scale as you grow.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-14"
        >
          <span className={`text-sm font-medium ${!annual ? 'text-neutral-900' : 'text-neutral-400'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${annual ? 'bg-primary-600' : 'bg-neutral-300'}`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${annual ? 'translate-x-7' : 'translate-x-0.5'}`}
            />
          </button>
          <span className={`text-sm font-medium ${annual ? 'text-neutral-900' : 'text-neutral-400'}`}>
            Annual
            <span className="ml-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </span>
        </motion.div>

        {/* Tiers */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              className={`relative rounded-2xl p-8 ${
                tier.highlighted
                  ? 'bg-white border-2 border-primary-500 shadow-2xl shadow-primary-500/10 scale-[1.02] lg:scale-105'
                  : 'bg-white border border-neutral-200 shadow-sm'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-primary-600 text-white text-xs font-bold shadow-lg shadow-primary-600/25">
                    <Star className="w-3.5 h-3.5" fill="currentColor" />
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-neutral-900">{tier.name}</h3>
                <p className="text-sm text-neutral-500 mt-1">{tier.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-neutral-900">
                    ${annual ? tier.annualPrice : tier.monthlyPrice}
                  </span>
                  <span className="text-neutral-500 text-sm">/user/mo</span>
                </div>
                {annual && (
                  <p className="text-xs text-neutral-400 mt-1">billed annually</p>
                )}
              </div>

              <Link
                to="/login"
                className={`group w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  tier.highlighted
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/25 hover:-translate-y-0.5'
                    : 'bg-neutral-900 text-white hover:bg-neutral-800 hover:-translate-y-0.5'
                }`}
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 mt-0.5 ${tier.highlighted ? 'text-primary-600' : 'text-emerald-500'}`} />
                    <span className="text-sm text-neutral-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
