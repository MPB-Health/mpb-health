import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  CheckCircle2,
  Phone,
  ArrowLeft,
  Shield,
  Users,
  Star,
  Video,
  Zap,
  Sparkles,
} from 'lucide-react';
import { AllPlansComparisonTable } from '../components/AllPlansComparisonTable';
import { AllMembershipsEstimate } from '../lib/newRateEngine';
import { PlanRecommendation } from '../lib/membershipPriorities';
import { QUOTE_PHONE_DISPLAY, QUOTE_PHONE_EXT, QUOTE_PHONE_TEL } from '../lib/constants';
import { cn, fmtMoney } from '../lib/utils';

const QUOTE_RESULTS_KEY = 'mpb_quote_comparison_results';

/** Form data for "Edit your quote" — pre-fills HeroCalculator */
export interface QuoteFormData {
  householdType: string;
  state: string;
  primaryAge: number;
  spouseAge?: number;
  dependentsCount?: number;
  membershipPriorities: string[];
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface QuoteResultsState {
  estimates: AllMembershipsEstimate;
  recommendations: PlanRecommendation[];
  traditionalCost: number;
  email?: string;
  submissionSuccess?: boolean;
  submissionError?: string;
  formData?: QuoteFormData;
}

const BENEFIT_HIGHLIGHTS = [
  {
    icon: Video,
    title: '$0 Virtual Care',
    description: 'Unlimited 24/7 visits — urgent, primary, behavioral health',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'No Network Restrictions',
    description: 'Choose any doctor, any hospital, anywhere',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Users,
    title: '50,000+ Families',
    description: 'Join a community that saves together',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Zap,
    title: 'Real Savings',
    description: 'Members save up to 60% vs traditional insurance',
    color: 'from-amber-500 to-orange-500',
  },
];

export function QuoteResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<QuoteResultsState | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const state = location.state as QuoteResultsState | undefined;
    if (state?.estimates && state?.recommendations) {
      setData(state);
      try {
        sessionStorage.setItem(QUOTE_RESULTS_KEY, JSON.stringify(state));
      } catch {
        // ignore
      }
      return;
    }
    try {
      const stored = sessionStorage.getItem(QUOTE_RESULTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as QuoteResultsState;
        if (parsed.estimates && parsed.recommendations) {
          setData(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    navigate('/', { replace: true });
  }, [location.state, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 150);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleEditQuote = () => {
    navigate('/', {
      state: data.formData
        ? { editQuote: true, formData: data.formData }
        : undefined,
    });
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="animate-pulse text-slate-500 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          Loading your comparison...
        </div>
      </div>
    );
  }

  const { estimates, recommendations, traditionalCost, email, submissionSuccess, submissionError } = data;

  return (
    <>
      <Helmet>
        <title>Your Plan Comparison | MPB Health</title>
        <meta
          name="description"
          content="View your personalized health sharing plan comparison. Compare all MPB Health memberships and find the best fit for your family."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Sticky CTA bar (mobile) */}
        {scrolled && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden animate-slide-up-fade">
            <a
              href={QUOTE_PHONE_TEL}
              className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-[0.98]"
            >
              <Phone className="h-5 w-5" />
              Call {QUOTE_PHONE_DISPLAY} ext {QUOTE_PHONE_EXT}
            </a>
          </div>
        )}

        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.15),transparent)]" />
          <div className="absolute top-20 right-0 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-12 md:pt-12 md:pb-16">
            <button
              type="button"
              onClick={handleEditQuote}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {data.formData ? 'Edit your quote' : 'Back to home'}
            </button>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 animate-fadeIn">
                  <Sparkles className="h-4 w-4" />
                  Your personalized results
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
                  Your Plan Comparison
                </h1>
                <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
                  Based on your priorities and household, we've matched you with the best plans. 
                  See how each option fits your needs — then call to get your exact rate and enroll.
                </p>
                <p className="mt-2 text-sm font-medium text-amber-700">
                  Rates based on today&apos;s info — call to lock in your rate
                </p>
              </div>
              <div className="flex-shrink-0 w-full sm:w-auto">
                <a
                  href={QUOTE_PHONE_TEL}
                  className="group inline-flex items-center justify-center gap-3 w-full sm:w-auto px-6 sm:px-8 py-4 bg-white border-2 border-slate-900 text-slate-900 font-bold rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-300">Call now</span>
                    <span className="text-lg">{QUOTE_PHONE_DISPLAY}</span>
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-300 mt-0.5 block">ext {QUOTE_PHONE_EXT}</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Success / Error Banner */}
            {submissionSuccess && email && (
              <div className="mt-8 rounded-2xl bg-emerald-50 border border-emerald-200 p-6 flex items-start gap-4 animate-slide-up-fade">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-900">Your comparison has been sent</h3>
                  <p className="text-emerald-800 mt-1">
                    We've sent your personalized plan comparison to <strong>{email}</strong>. 
                    A health advisor will reach out within 24 hours — or call now to get started immediately.
                  </p>
                </div>
              </div>
            )}
            {submissionError && !submissionSuccess && (
              <div className="mt-8 rounded-2xl bg-amber-50 border border-amber-200 p-6 flex items-start gap-4">
                <div>
                  <h3 className="font-semibold text-amber-900">Your comparison is ready below</h3>
                  <p className="text-amber-800 mt-1 text-sm">{submissionError}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Best Match Hero Card */}
        {recommendations.length > 0 && (() => {
          const best = recommendations[0];
          const bestPlan = estimates.plans.find(p => p.planId === best.planId);
          if (!bestPlan) return null;
          const savings = traditionalCost - bestPlan.lowestPrice;
          return (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
              <div className="rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 via-white to-cyan-50/30 p-8 shadow-xl ring-2 ring-blue-200/50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <span className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4">
                      <Sparkles className="h-4 w-4" />
                      Your best match — {best.matchPercentage}% fit
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{bestPlan.planLabel}</h2>
                    <p className="mt-2 text-slate-600">
                      {best.reasons[0] || 'Tailored to your priorities'}
                    </p>
                    <div className="mt-4 flex items-baseline gap-3">
                      <span className="text-2xl font-bold text-slate-900">
                        Start at {bestPlan.flatRate ? fmtMoney(bestPlan.flatRate) : fmtMoney(bestPlan.lowestPrice)}
                        <span className="text-slate-500 font-normal text-lg">/mo</span>
                      </span>
                      {savings > 0 && (
                        <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                          Save {fmtMoney(savings)}/mo vs traditional
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={QUOTE_PHONE_TEL}
                    className="flex-shrink-0 inline-flex items-center justify-center gap-3 px-8 py-5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl text-lg"
                  >
                    <Phone className="h-6 w-6" />
                    Get Your Rate — Call Now
                  </a>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Benefit Highlights */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 mb-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BENEFIT_HIGHLIGHTS.map((benefit, i) => {
              const Icon = benefit.icon;
              const delayClass = ['animate-slide-up-fade-delay-1', 'animate-slide-up-fade-delay-2', 'animate-slide-up-fade-delay-3', 'animate-slide-up-fade-delay-4'][i];
              return (
                <div
                  key={benefit.title}
                  className={cn(
                    'rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white',
                    delayClass
                  )}
                >
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br', benefit.color)}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{benefit.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparison — pb-24 on mobile so content isn't hidden behind sticky CTA bar */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 md:pb-12">
          <AllPlansComparisonTable
            estimates={estimates}
            recommendations={recommendations}
            traditionalCostEstimate={traditionalCost}
            leadGenMode
          />
        </div>

        {/* CTA Section — extra bottom padding on mobile for sticky bar */}
        <div className="relative bg-slate-900 overflow-hidden pb-24 md:pb-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_120%,rgba(59,130,246,0.2),transparent)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium text-white">Trusted by 50,000+ families</span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to get your personalized rate?
              </h2>
              <p className="text-slate-300 max-w-2xl mx-auto mb-10 text-lg leading-relaxed">
                Speak with a licensed health advisor to finalize your plan, get your exact rate, 
                and enroll with confidence. No pressure — just answers.
              </p>
              <p className="text-amber-300/90 text-sm font-medium mb-6">
                Rates based on today&apos;s info — call now to lock in your rate
              </p>
              <a
                href={QUOTE_PHONE_TEL}
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-100 transition-all shadow-xl hover:shadow-2xl text-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="h-6 w-6" />
                Call {QUOTE_PHONE_DISPLAY} ext {QUOTE_PHONE_EXT}
              </a>
              <p className="mt-4 text-slate-400 text-sm">
                Press 1 when prompted for your personalized quote
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default QuoteResults;
