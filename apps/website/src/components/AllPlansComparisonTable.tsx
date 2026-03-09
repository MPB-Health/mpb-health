import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Phone,
  ExternalLink,
  Sparkles,
  Shield,
  Heart,
  Building2,
  Stethoscope,
  Wallet,
  Video,
} from 'lucide-react';
import { AllMembershipsEstimate } from '../lib/newRateEngine';
import { PlanRecommendation } from '../lib/membershipPriorities';
import { QUOTE_PHONE_TEL } from '../lib/constants';
import { fmtMoney } from '../lib/utils';
import { cn } from '../lib/utils';

const PLAN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'secure-hsa': Shield,
  'mec-essentials': Building2,
  'essentials': Wallet,
  'care-plus': Heart,
  'direct': Stethoscope,
};

/** Sales-focused: tagline + benefit bullets with lead + detail */
const PLAN_SELL: Record<string, { tagline: string; bullets: { lead: string; detail: string }[] }> = {
  'secure-hsa': {
    tagline: 'The smart choice for self-employed & contractors',
    bullets: [
      { lead: '$0 unlimited virtual care', detail: '24/7 urgent, primary, and behavioral health — included in every plan' },
      { lead: 'Pre-tax dollars', detail: 'HSA + MEC means real tax savings — keep more of what you earn' },
      { lead: 'Full protection', detail: 'Hospital, surgery, major medical + RX Valet ($0–$14.95)' },
      { lead: 'RX Benefits ($0–$15)', detail: '' },
    ],
  },
  'mec-essentials': {
    tagline: 'Perfect for small businesses & ACA compliance',
    bullets: [
      { lead: '$0 unlimited virtual care', detail: '24/7 urgent, primary, and behavioral health — included in every plan' },
      { lead: 'Employer mandate satisfied', detail: 'No penalties, no headaches — stay compliant' },
      { lead: 'Debt Dismissal Program', detail: 'Reduce or eliminate existing medical debt' },
      { lead: 'MEC', detail: '' },
    ],
  },
  'essentials': {
    tagline: 'Essential protection without the overwhelm',
    bullets: [
      { lead: '$0 unlimited virtual care', detail: '24/7 urgent, primary, and behavioral health — included in every plan' },
      { lead: 'Hospital Debt Relief', detail: 'Get help with existing medical bills' },
      { lead: 'Pharmacy & supplement discounts', detail: 'Save on everyday health needs' },
      { lead: '50,000+ families', detail: 'Join a community that saves together' },
    ],
  },
  'care-plus': {
    tagline: 'Complete peace of mind for families',
    bullets: [
      { lead: '$0 unlimited virtual care', detail: '24/7 urgent, primary, and behavioral health — included in every plan' },
      { lead: 'Full medical cost sharing', detail: 'Hospital, surgery, no lifetime limits' },
      { lead: 'Maternity sharing', detail: 'Real support after 6 months when you need it' },
      { lead: 'Any doctor, any hospital', detail: 'No network restrictions — your choice' },
    ],
  },
  'direct': {
    tagline: 'Wellness-first + real protection',
    bullets: [
      { lead: '$0 unlimited virtual care', detail: '24/7 urgent, primary, and behavioral health — included in every plan' },
      { lead: 'Preventive care included', detail: 'Annual wellness ($175), labs, screenings, immunizations' },
      { lead: 'Medical cost sharing', detail: 'For the unexpected — without breaking the bank' },
      { lead: 'Best of both worlds', detail: 'Proactive care + catastrophic protection' },
    ],
  },
};

/** Virtual care included in every plan — shown at top of comparison */
const VIRTUAL_CARE_INCLUDED = {
  title: '$0 Unlimited Virtual Care',
  subtitle: 'Included in every plan — no extra cost',
  items: [
    '24/7 urgent care — get help when you need it',
    'Primary care visits — routine check-ins from home',
    'Virtual behavioral health — mental wellness support',
    'See a doctor anytime, anywhere — phone, tablet, or computer',
  ],
};

interface AllPlansComparisonTableProps {
  estimates: AllMembershipsEstimate;
  recommendations: PlanRecommendation[];
  traditionalCostEstimate: number;
  leadGenMode?: boolean;
  className?: string;
}

export const AllPlansComparisonTable: React.FC<AllPlansComparisonTableProps> = ({
  estimates,
  recommendations,
  traditionalCostEstimate,
  leadGenMode = false,
  className,
}) => {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const getMatchPercentage = (planId: string): number => {
    const rec = recommendations.find(r => r.planId === planId);
    return rec?.matchPercentage || 0;
  };

  const getReasons = (planId: string): string[] => {
    const rec = recommendations.find(r => r.planId === planId);
    return rec?.reasons || [];
  };

  const bestMatchPlanId = recommendations.length > 0 ? recommendations[0].planId : null;

  const sortedPlans = [...estimates.plans].sort((a, b) => {
    const matchA = getMatchPercentage(a.planId);
    const matchB = getMatchPercentage(b.planId);
    return matchB - matchA;
  });

  const toggleExpanded = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  const getPlanSell = (planId: string) => PLAN_SELL[planId] || { tagline: '', bullets: [] as { lead: string; detail: string }[] };

  const formatHousehold = (ht: string) => {
    const map: Record<string, string> = {
      'member-only': 'Individual',
      'member-spouse': 'Member + Spouse',
      'member-child': 'Member + Children',
      'member-family': 'Family',
    };
    return map[ht] || ht;
  };

  const MatchBadge = ({ percentage, isBest }: { percentage: number; isBest: boolean }) => {
    const color = percentage >= 80 ? 'emerald' : percentage >= 60 ? 'blue' : 'amber';
    const strokeColor = color === 'emerald' ? '#10b981' : color === 'blue' ? '#2563eb' : '#f59e0b';
    const circumference = 100;
    const strokeDash = Math.min((percentage / 100) * circumference, circumference);
    return (
      <div className="relative w-20 h-20 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-slate-200"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            'text-xl font-bold tabular-nums',
            color === 'emerald' && 'text-emerald-600',
            color === 'blue' && 'text-blue-600',
            color === 'amber' && 'text-amber-600'
          )}>
            {percentage}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">match</span>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-8', className)}>
      {/* Summary */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {leadGenMode ? 'Your Plan Matches' : 'Rate Comparison'}
          </h3>
          <p className="text-slate-600 mt-1 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
              {formatHousehold(estimates.inputSummary.householdType)}
            </span>
            <span>•</span>
            <span>Age {estimates.inputSummary.primaryAge}</span>
            <span>•</span>
            <span>{estimates.inputSummary.state}</span>
          </p>
        </div>
        {!leadGenMode && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
            <TrendingDown className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-800">
              Traditional avg: {fmtMoney(traditionalCostEstimate)}/mo
            </span>
          </div>
        )}
      </div>

      {/* Virtual Care — included in every plan (leadGenMode) */}
      {leadGenMode && (
        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-cyan-50/30 to-blue-50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg">
              <Video className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold text-slate-900">{VIRTUAL_CARE_INCLUDED.title}</h4>
              <p className="text-sm font-medium text-blue-700 mt-0.5">{VIRTUAL_CARE_INCLUDED.subtitle}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {VIRTUAL_CARE_INCLUDED.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Plan Cards — items-stretch for equal height */}
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3 items-stretch">
        {sortedPlans.map((plan, index) => {
          const matchPercentage = getMatchPercentage(plan.planId);
          const isBestMatch = plan.planId === bestMatchPlanId;
          const savings = traditionalCostEstimate - plan.lowestPrice;
          const reasons = getReasons(plan.planId);
          const isExpanded = expandedPlan === plan.planId;
          const planSell = getPlanSell(plan.planId);
          const PlanIcon = PLAN_ICONS[plan.planId] || Shield;
          const delayClasses = ['animate-slide-up-fade-delay-1', 'animate-slide-up-fade-delay-2', 'animate-slide-up-fade-delay-3', 'animate-slide-up-fade-delay-4', 'animate-slide-up-fade-delay-5'];
          const delayClass = delayClasses[Math.min(index, 4)];

          return (
            <div
              key={plan.planId}
              className={cn(
                'rounded-2xl border-2 bg-white overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 flex flex-col',
                delayClass,
                isBestMatch
                  ? 'border-blue-500 shadow-lg ring-2 ring-blue-200/50'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              {/* Card header */}
              <div className={cn(
                'relative px-8 py-8',
                isBestMatch ? 'bg-gradient-to-br from-blue-50 via-cyan-50/50 to-blue-50' : 'bg-gradient-to-br from-slate-50 to-white'
              )}>
                {isBestMatch && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-xl rounded-tr-2xl shadow-md">
                      Recommended
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <MatchBadge percentage={matchPercentage} isBest={isBestMatch} />
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      isBestMatch ? 'bg-blue-100' : 'bg-slate-100'
                    )}>
                      <PlanIcon className={cn('h-5 w-5', isBestMatch ? 'text-blue-600' : 'text-slate-600')} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-1 overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xl font-bold text-slate-900">{plan.planLabel}</h4>
                      {isBestMatch && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-600 text-white px-2.5 py-1 rounded-full">
                          <Sparkles className="h-3 w-3" />
                          Best for you
                        </span>
                      )}
                      {plan.popular && !isBestMatch && (
                        <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Best Seller
                        </span>
                      )}
                      {plan.hsaCompatible && (
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          HSA
                        </span>
                      )}
                    </div>
                    {leadGenMode && (
                      <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-lg font-bold text-slate-900">
                          Start at {plan.flatRate ? fmtMoney(plan.flatRate) : fmtMoney(plan.lowestPrice)}
                        </span>
                        <span className="text-slate-500 text-sm">/mo</span>
                        {savings > 0 && (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                            Save {fmtMoney(savings)} vs traditional
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Benefits — sales-focused bullets (lead + detail) */}
              <div className="px-8 py-7 flex-1 flex flex-col">
                {leadGenMode ? (
                  planSell.bullets.length > 0 && (
                    <ul className="space-y-5">
                      {planSell.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-4 group">
<div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-200 transition-colors">
                        <Check className="h-4 w-4 text-emerald-600" />
                          </div>
                          <span className="text-base text-slate-700 leading-relaxed">
                            <strong className="text-slate-900 font-semibold">{b.lead}</strong>
                            {b.detail ? <span className="text-slate-600"> — {b.detail}</span> : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )
                ) : reasons.length > 0 ? (
                  <ul className="space-y-5">
                    {reasons.slice(0, 3).map((line, i) => (
                      <li key={i} className="flex items-start gap-4 group">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-200 transition-colors">
                          <Check className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="text-base text-slate-700 leading-relaxed">{line}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {!leadGenMode && (
                  <>
                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-slate-900">
                          {plan.flatRate ? fmtMoney(plan.flatRate) : `${fmtMoney(plan.lowestPrice)}+`}
                        </span>
                        <span className="text-sm text-slate-500 ml-1">/mo</span>
                      </div>
                      {savings > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold">
                          <TrendingDown className="h-4 w-4" />
                          Save {fmtMoney(savings)}
                        </div>
                      )}
                    </div>
                    {plan.tiers.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleExpanded(plan.planId)}
                          className="mt-4 w-full flex items-center justify-between px-4 py-3 bg-slate-100 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          <span>View {plan.tiers.length} IUA options</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {isExpanded && (
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 animate-fadeIn">
                            {plan.tiers.map((tier) => (
                              <div key={tier.tierId} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                                <div className="text-[10px] text-slate-500 font-medium">{tier.tierLabel}</div>
                                <div className="font-bold text-slate-900 text-sm">{fmtMoney(tier.monthly)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* CTA */}
              <div className="px-8 pb-8 pt-2">
                {leadGenMode ? (
                  <a
                    href={QUOTE_PHONE_TEL}
                    className={cn(
                      'flex items-center justify-center gap-2 w-full py-5 rounded-xl text-base font-bold transition-all active:scale-[0.98]',
                      isBestMatch
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    )}
                  >
                    <Phone className="h-5 w-5" />
                    {isBestMatch ? 'Get Your Personalized Rate — Call Now' : 'Call for Your Quote'}
                  </a>
                ) : plan.enrollUrl ? (
                  <a
                    href={plan.enrollUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center justify-center gap-2 w-full py-5 rounded-xl text-base font-bold transition-all',
                      isBestMatch
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    )}
                  >
                    Enroll Now
                    <ExternalLink className="h-5 w-5" />
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="rounded-2xl bg-slate-100/80 px-6 py-5 border border-slate-200/60">
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong className="text-slate-700">Disclaimer:</strong> Estimates are informational only. Not insurance. 
          Final rates and eligibility are determined during enrollment.
        </p>
      </div>
    </div>
  );
};

export default AllPlansComparisonTable;
