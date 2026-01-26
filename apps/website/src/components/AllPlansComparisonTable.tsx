import React, { useState } from 'react';
import {
  Check,
  Star,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  ExternalLink,
  Info,
  Sparkles,
  Shield,
  Heart
} from 'lucide-react';
import { AllMembershipsEstimate } from '../lib/newRateEngine';
import { PlanRecommendation } from '../lib/membershipPriorities';
import { fmtMoney } from '../lib/utils';
import { cn } from '../lib/utils';

interface AllPlansComparisonTableProps {
  estimates: AllMembershipsEstimate;
  recommendations: PlanRecommendation[];
  traditionalCostEstimate: number;
  className?: string;
}

export const AllPlansComparisonTable: React.FC<AllPlansComparisonTableProps> = ({
  estimates,
  recommendations,
  traditionalCostEstimate,
  className,
}) => {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  // Get match percentage for a plan from recommendations
  const getMatchPercentage = (planId: string): number => {
    const rec = recommendations.find(r => r.planId === planId);
    return rec?.matchPercentage || 0;
  };

  // Get reasons for a plan from recommendations
  const getReasons = (planId: string): string[] => {
    const rec = recommendations.find(r => r.planId === planId);
    return rec?.reasons || [];
  };

  // Find the best match plan
  const bestMatchPlanId = recommendations.length > 0 ? recommendations[0].planId : null;

  // Sort plans by match percentage (best first)
  const sortedPlans = [...estimates.plans].sort((a, b) => {
    const matchA = getMatchPercentage(a.planId);
    const matchB = getMatchPercentage(b.planId);
    return matchB - matchA;
  });

  // Toggle expanded state for a plan
  const toggleExpanded = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5" />
          <h3 className="text-lg font-bold">Your Personalized Rate Comparison</h3>
        </div>
        <p className="text-sm text-white/90">
          Based on your household ({estimates.inputSummary.householdType}, age {estimates.inputSummary.primaryAge}) 
          in {estimates.inputSummary.state}
        </p>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4" />
            <span>Traditional insurance avg: <strong>{fmtMoney(traditionalCostEstimate)}/mo</strong></span>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Plan</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Match</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Monthly Rate</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">You Save</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">IUA Options</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlans.map((plan, _index) => {
              const matchPercentage = getMatchPercentage(plan.planId);
              const isBestMatch = plan.planId === bestMatchPlanId;
              const savings = traditionalCostEstimate - plan.lowestPrice;
              const reasons = getReasons(plan.planId);
              const isExpanded = expandedPlan === plan.planId;

              return (
                <React.Fragment key={plan.planId}>
                  <tr 
                    className={cn(
                      'border-b border-gray-100 transition-colors',
                      isBestMatch ? 'bg-blue-50/50' : 'hover:bg-gray-50',
                      isExpanded && 'bg-gray-50'
                    )}
                  >
                    {/* Plan Name & Description */}
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900">{plan.planLabel}</h4>
                            {isBestMatch && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-2 py-0.5 rounded-full">
                                <Star className="h-2.5 w-2.5 fill-current" />
                                BEST MATCH
                              </span>
                            )}
                            {plan.popular && !isBestMatch && (
                              <span className="text-[10px] font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                Popular
                              </span>
                            )}
                            {plan.hsaCompatible && (
                              <span className="text-[10px] font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                HSA
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{plan.description}</p>
                          {reasons.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                              <span className="text-[10px] text-green-700">{reasons[0]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Match Percentage */}
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mb-1 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              matchPercentage >= 80
                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                : matchPercentage >= 60
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                            )}
                            style={{ width: `${matchPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{matchPercentage}%</span>
                      </div>
                    </td>

                    {/* Monthly Rate */}
                    <td className="px-4 py-4 text-center">
                      <div className="font-bold text-lg text-gray-900">
                        {plan.flatRate ? (
                          fmtMoney(plan.flatRate)
                        ) : (
                          <span className="flex items-center justify-center gap-1">
                            <span className="text-sm text-gray-500">from</span>
                            {fmtMoney(plan.lowestPrice)}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500">per month</div>
                    </td>

                    {/* Savings */}
                    <td className="px-4 py-4 text-center">
                      {savings > 0 ? (
                        <div className="inline-flex flex-col items-center">
                          <div className="flex items-center gap-1 text-green-600">
                            <TrendingDown className="h-3.5 w-3.5" />
                            <span className="font-bold">{fmtMoney(savings)}</span>
                          </div>
                          <span className="text-[10px] text-gray-500">vs traditional</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* IUA Options */}
                    <td className="px-4 py-4 text-center">
                      {plan.tiers.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(plan.planId)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                          {plan.tiers.length} options
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">Flat rate</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4 text-right">
                      {plan.enrollUrl ? (
                        <a
                          href={plan.enrollUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                            isBestMatch
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-md hover:shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          )}
                        >
                          Enroll Now
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">Coming soon</span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded IUA Tiers Row */}
                  {isExpanded && plan.tiers.length > 0 && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="ml-4 pl-4 border-l-2 border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-semibold text-gray-700">
                              IUA (Initial Unshareable Amount) Options
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {plan.tiers.map((tier) => (
                              <div
                                key={tier.tierId}
                                className="bg-white rounded-lg border border-gray-200 p-3 text-center"
                              >
                                <div className="text-xs text-gray-500 mb-1">{tier.tierLabel}</div>
                                <div className="font-bold text-gray-900">{fmtMoney(tier.monthly)}/mo</div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-2">
                            Lower IUA = Higher monthly cost but less out-of-pocket per incident
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedPlans.map((plan) => {
          const matchPercentage = getMatchPercentage(plan.planId);
          const isBestMatch = plan.planId === bestMatchPlanId;
          const savings = traditionalCostEstimate - plan.lowestPrice;
          const reasons = getReasons(plan.planId);
          const isExpanded = expandedPlan === plan.planId;

          return (
            <div
              key={plan.planId}
              className={cn(
                'rounded-xl border-2 overflow-hidden transition-all',
                isBestMatch
                  ? 'border-blue-500 bg-blue-50/30 shadow-lg'
                  : 'border-gray-200 bg-white'
              )}
            >
              {/* Card Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-900">{plan.planLabel}</h4>
                      {isBestMatch && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-2 py-0.5 rounded-full">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          BEST MATCH
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{plan.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-lg text-gray-900">
                      {plan.flatRate ? fmtMoney(plan.flatRate) : fmtMoney(plan.lowestPrice)}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {plan.flatRate ? 'per month' : 'from/mo'}
                    </div>
                  </div>
                </div>

                {/* Match & Savings Row */}
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          matchPercentage >= 80
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : matchPercentage >= 60
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                            : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                        )}
                        style={{ width: `${matchPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700">{matchPercentage}% Match</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                      <TrendingDown className="h-3 w-3" />
                      Save {fmtMoney(savings)}/mo
                    </div>
                  )}
                </div>

                {/* Reasons */}
                {reasons.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {reasons.slice(0, 2).map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                        <span className="text-[11px] text-gray-700">{reason}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2 mb-3">
                  {plan.hsaCompatible && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      <Shield className="h-2.5 w-2.5" />
                      HSA Compatible
                    </span>
                  )}
                  {plan.popular && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      <Heart className="h-2.5 w-2.5" />
                      Popular Choice
                    </span>
                  )}
                </div>

                {/* IUA Toggle */}
                {plan.tiers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(plan.planId)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors mb-3"
                  >
                    <span>View {plan.tiers.length} IUA options</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}

                {/* Expanded IUA Tiers */}
                {isExpanded && plan.tiers.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {plan.tiers.map((tier) => (
                      <div
                        key={tier.tierId}
                        className="bg-gray-50 rounded-lg border border-gray-200 p-2 text-center"
                      >
                        <div className="text-[10px] text-gray-500">{tier.tierLabel}</div>
                        <div className="font-bold text-sm text-gray-900">{fmtMoney(tier.monthly)}/mo</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Enroll Button */}
                {plan.enrollUrl && (
                  <a
                    href={plan.enrollUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                      isBestMatch
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    )}
                  >
                    Enroll in {plan.planLabel}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="text-[11px] text-gray-600 text-center leading-relaxed">
          <strong>Note:</strong> Estimates are informational only. Not insurance. 
          Final rates and eligibility are determined during enrollment. 
          IUA (Initial Unshareable Amount) is the amount you pay out-of-pocket before sharing begins for each medical incident.
        </p>
      </div>
    </div>
  );
};

export default AllPlansComparisonTable;


