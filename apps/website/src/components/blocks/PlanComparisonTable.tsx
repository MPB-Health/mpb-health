import { usePlanComparison } from '@/hooks/usePlans';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import {
  getAllUniqueCategories,
  getCategoryLabel,
  getPlanBadges,
  getFeatureForPlan,
} from '@/lib/planUtils';
import { Check, X, ExternalLink } from 'lucide-react';

interface PlanComparisonTableProps {
  planSlugs: string[];
}

const MEC_ESSENTIALS_PLAN_SLUG = 'mec-essentials';

/** Only this cell treats a missing DB row as “Included” — MEC+ Essentials + MEC row in the MEC category. */
function missingFeatureTreatAsIncluded(
  plan: { slug: string },
  category: string,
  featureName: string,
): boolean {
  return (
    plan.slug === MEC_ESSENTIALS_PLAN_SLUG &&
    category === 'Minimum Essential Coverage' &&
    featureName.trim().toLowerCase() === 'minimum essential coverage'
  );
}

export function PlanComparisonTable({ planSlugs }: PlanComparisonTableProps) {
  const { plans, loading, error } = usePlanComparison(planSlugs);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-accent-50 to-white border-accent-200">
        <p className="text-accent-600 font-medium">Error loading plans: {error.message}</p>
      </Card>
    );
  }

  if (plans.length === 0) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-neutral-50 to-white border-neutral-200">
        <p className="text-neutral-600 font-medium">No plans selected for comparison</p>
      </Card>
    );
  }

  const categories = getAllUniqueCategories(plans);

  /** Table only: compact feature column; plan columns share the rest equally */
  const featureRailPercent = 18;
  const planTableColPercent = (100 - featureRailPercent) / plans.length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 mb-16 md:mb-20 px-2 sm:px-6 lg:px-8">
      {/* Plan hero cards — plans only (no Features cell); equal width */}
      <div className="w-full overflow-x-auto [-webkit-overflow-scrolling:touch] pb-1">
        <div
          className="grid gap-3 sm:gap-4 items-stretch w-full mx-auto"
          style={{
            gridTemplateColumns: `repeat(${plans.length}, minmax(11rem, 1fr))`,
          }}
        >
          {plans.map((plan, index) => (
          <Card
            key={plan.id}
            className="p-6 h-full flex flex-col bg-gradient-to-br from-white via-primary-50/20 to-white border-2 border-primary-200 shadow-xl hover:shadow-2xl transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${(index + 1) * 100}ms` }}
          >
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              <div className="relative shrink-0">
                <div className="absolute -top-3 -right-3 w-20 h-20 bg-gradient-to-br from-primary-200/30 to-success-200/30 rounded-full blur-2xl"></div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 bg-clip-text text-transparent relative">
                  {plan.name}
                </h3>
                {plan.tagline && (
                  <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{plan.tagline}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 shrink-0 min-h-[1.75rem] content-start">
                {getPlanBadges(plan).map((badge, idx) => (
                  <Badge
                    key={idx}
                    variant={badge.variant}
                    className="shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>

              <div className="mt-auto pt-1 w-full shrink-0">
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  asChild
                >
                  <a href={`/${plan.slug}`} className="inline-flex items-center justify-center gap-2">
                    View Details
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        ))}
        </div>
      </div>

      {/* Feature matrix — isolate + opaque backdrop so sticky columns do not composite with content below */}
      <div className="w-full overflow-x-auto [-webkit-overflow-scrolling:touch] relative z-[1] isolate">
        <div className="rounded-2xl border border-neutral-200 shadow-lg bg-white w-full relative">
          <table className="w-full border-collapse table-fixed bg-white">
            <colgroup>
              <col style={{ width: `${featureRailPercent}%` }} />
              {plans.map(plan => (
                <col key={`col-${plan.id}`} style={{ width: `${planTableColPercent}%` }} />
              ))}
            </colgroup>
              <thead>
                <tr className="bg-gradient-to-r from-primary-700 to-primary-600">
                  <th className="text-left py-4 px-6 text-white font-semibold sticky left-0 z-30 bg-gradient-to-r from-primary-700 to-primary-600 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.15)]">
                    Features
                  </th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-4 px-4 text-white font-semibold">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
          <tbody>
            {categories.map(category => {
              const allFeatureNames = Array.from(
                new Set(
                  plans.flatMap(plan =>
                    plan.features
                      .filter(f => f.category === category)
                      .map(f => f.feature_name)
                  )
                )
              );

              return (
                <>
                  {/* Category Header Row */}
                  <tr key={`cat-${category}`} className="bg-primary-50">
                    <td 
                      colSpan={plans.length + 1} 
                      className="py-3 px-6 font-bold text-primary-800 text-lg border-l-4 border-primary-500"
                    >
                      {getCategoryLabel(category)}
                    </td>
                  </tr>

                  {/* Feature Rows */}
                  {allFeatureNames.map((featureName, rowIndex) => (
                    <tr 
                      key={`${category}-${featureName}`}
                      className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-neutral-50'} hover:bg-primary-50/50 transition-colors`}
                    >
                      <td
                        className={`py-4 px-6 text-sm font-medium text-neutral-800 sticky left-0 z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)] ${
                          rowIndex % 2 === 0 ? 'bg-white' : 'bg-neutral-50'
                        }`}
                      >
                        {featureName}
                      </td>
                      {plans.map(plan => {
                        const feature = getFeatureForPlan(plan, category, featureName);
                        const costLabel = (feature?.cost || 'Included').trim();
                        const isLimited = /^limited$/i.test(costLabel) || /\blimited\b/i.test(costLabel);
                        return (
                          <td key={plan.id} className="py-4 px-4 text-center align-top">
                            {feature ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-center gap-2">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 ${
                                      isLimited
                                        ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                        : 'bg-gradient-to-br from-success-500 to-success-600'
                                    }`}
                                  >
                                    <Check className="h-4 w-4 text-white" />
                                  </div>
                                  <span
                                    className={`text-sm font-bold ${
                                      isLimited ? 'text-amber-700' : 'text-success-600'
                                    }`}
                                  >
                                    {costLabel || 'Included'}
                                  </span>
                                </div>
                                {feature.feature_value && (
                                  <p className="text-xs text-neutral-600 leading-relaxed">
                                    {feature.feature_value}
                                  </p>
                                )}
                                {feature.notes && (
                                  <p className="text-xs text-neutral-500 italic leading-relaxed">
                                    {feature.notes}
                                  </p>
                                )}
                              </div>
                            ) : missingFeatureTreatAsIncluded(plan, category, featureName) ? (
                              <div className="flex items-center justify-center gap-2 py-1">
                                <div
                                  className="w-6 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-sm flex-shrink-0"
                                  aria-hidden
                                >
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-sm font-bold text-success-600">Included</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-2 py-1">
                                <div
                                  className="w-7 h-7 rounded-full bg-neutral-300 flex items-center justify-center flex-shrink-0 shadow-sm"
                                  aria-hidden
                                >
                                  <Check className="h-4 w-4 text-neutral-800" strokeWidth={2.5} />
                                </div>
                                <span className="text-xs sm:text-sm text-neutral-500 text-center leading-snug max-w-[12ch]">
                                  Not Included
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              );
            })}

            {/* Medical Cost Sharing Details Section */}
            {plans.some(p => p.sharing_details) && (
              <>
                <tr className="bg-primary-50">
                  <td 
                    colSpan={plans.length + 1} 
                    className="py-3 px-6 font-bold text-primary-800 text-lg border-l-4 border-primary-500"
                  >
                    Medical Cost Sharing Details
                  </td>
                </tr>

                {/* Lifetime Cap Row */}
                <tr className="bg-white hover:bg-primary-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-neutral-800 sticky left-0 z-20 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                    Lifetime Cap
                  </td>
                  {plans.map(plan => (
                    <td key={`lifetime-${plan.id}`} className="py-4 px-4 text-center">
                      {plan.sharing_details ? (
                        plan.sharing_details.has_lifetime_cap ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                              <X className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="text-sm text-amber-700 font-medium">Has cap</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-sm flex-shrink-0">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-bold text-success-600">No cap</span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                            <X className="h-4 w-4 text-neutral-400" />
                          </div>
                          <span className="text-sm text-neutral-400">N/A</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Annual Cap Row */}
                <tr className="bg-neutral-50 hover:bg-primary-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-neutral-800 sticky left-0 z-20 bg-neutral-50 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                    Annual Cap
                  </td>
                  {plans.map(plan => (
                    <td key={`annual-${plan.id}`} className="py-4 px-4 text-center">
                      {plan.sharing_details ? (
                        plan.sharing_details.has_annual_cap ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                              <X className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="text-sm text-amber-700 font-medium">Has cap</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-sm flex-shrink-0">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-bold text-success-600">No cap</span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                            <X className="h-4 w-4 text-neutral-400" />
                          </div>
                          <span className="text-sm text-neutral-400">N/A</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Pre-membership Lookback Row */}
                <tr className="bg-white hover:bg-primary-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-neutral-800 sticky left-0 z-20 bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                    Pre-membership Lookback
                  </td>
                  {plans.map(plan => (
                    <td key={`lookback-${plan.id}`} className="py-4 px-4 text-center">
                      {plan.sharing_details?.preexisting_lookback_months ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary-600">
                              {Math.floor(plan.sharing_details.preexisting_lookback_months / 12)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-neutral-700">
                            {Math.floor(plan.sharing_details.preexisting_lookback_months / 12)} years
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                            <X className="h-4 w-4 text-neutral-400" />
                          </div>
                          <span className="text-sm text-neutral-400">N/A</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Maternity Waiting Period Row */}
                <tr className="bg-neutral-50 hover:bg-primary-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-neutral-800 sticky left-0 z-20 bg-neutral-50 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                    Maternity Waiting Period
                  </td>
                  {plans.map(plan => (
                    <td key={`maternity-${plan.id}`} className="py-4 px-4 text-center">
                      {plan.sharing_details?.maternity_waiting_months ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary-600">
                              {plan.sharing_details.maternity_waiting_months}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-neutral-700">
                            {plan.sharing_details.maternity_waiting_months} months
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                            <X className="h-4 w-4 text-neutral-400" />
                          </div>
                          <span className="text-sm text-neutral-400">N/A</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              </>
            )}
          </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
